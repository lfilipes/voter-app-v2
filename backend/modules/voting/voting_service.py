"""
Serviços para o módulo de votação
Gerencia autenticação de votantes, peso de voto e registro de votos
"""

from firebase_admin import firestore
import re

db = firestore.client()

def authenticate_voter(condominium_id, email, cpf_password):
    """
    Autentica um votante usando email e os 6 primeiros dígitos do CPF
    
    Args:
        condominium_id: ID do condomínio
        email: Email do votante
        cpf_password: 6 primeiros dígitos do CPF (string de 6 caracteres)
    
    Returns:
        dict: {success, voter, error}
    """
    # Busca o residente pelo email
    resident_ref = db.collection(f'condominiums/{condominium_id}/residents').document(email)
    resident = resident_ref.get()
    
    if not resident.exists:
        return {'success': False, 'error': 'Email não encontrado'}
    
    resident_data = resident.to_dict()
    cpf_completo = resident_data.get('cpf', '')
    
    # Extrai os 6 primeiros dígitos do CPF cadastrado
    cpf_6_digits = cpf_completo[:6] if len(cpf_completo) >= 6 else cpf_completo
    
    # Compara apenas os 6 primeiros dígitos (sem validação de CPF completo)
    if cpf_6_digits != cpf_password:
        return {'success': False, 'error': 'Senha incorreta'}
    
    # Verifica se o residente pode votar
    if not resident_data.get('can_vote', True):
        return {'success': False, 'error': 'Este usuário não pode votar (deu procuração)'}
    
    return {
        'success': True,
        'voter': {
            'email': email,
            'name': resident_data.get('name'),
            'cpf': cpf_completo,
            'apartment': resident_data.get('apartment')
        }
    }

def get_active_assembly(condominium_id, voter_email):
    """
    Busca a assembleia disponível para um votante
    Retorna a assembleia com status 'active' ou 'closed'
    """
    assemblies_ref = db.collection(f'condominiums/{condominium_id}/assemblies')
    
    # Busca por assembleias com status 'active' ou 'closed'
    docs = assemblies_ref.stream()
    
    assembly_data = None
    for doc in docs:
        data = doc.to_dict()
        status = data.get('status', 'inactive')
        
        # Aceita apenas 'active' ou 'closed'
        if status in ['active', 'closed']:
            assembly_data = {
                'number': doc.id,
                'name': data.get('name'),
                'date': data.get('date'),
                'status': status,
                'has_voted': False
            }
            
            # Busca o informativo
            info_ref = db.collection(f'condominiums/{condominium_id}/assemblies/{doc.id}/info').document('info')
            info_doc = info_ref.get()
            if info_doc.exists:
                assembly_data['informative_text'] = info_doc.to_dict().get('informative_text', '')
            
            # Verifica se o votante já votou
            vote_ref = db.collection(f'condominiums/{condominium_id}/assemblies/{doc.id}/votes').document(voter_email)
            assembly_data['has_voted'] = vote_ref.get().exists
            
            break  # Pega a primeira assembleia disponível
    
    if not assembly_data:
        return {'success': False, 'error': 'Nenhuma assembleia disponível no momento'}
    
    return {'success': True, 'assembly': assembly_data}

def get_voting_weight(condominium_id, voter_email):
    """
    Calcula o peso do voto (1 + número de procurações recebidas)
    
    Args:
        condominium_id: ID do condomínio
        voter_email: Email do votante
    
    Returns:
        dict: {success, weight, error}
    """
    # Busca procurações onde este email é o outorgado (grantee)
    proxies_ref = db.collection(f'condominiums/{condominium_id}/proxies')\
        .where('grantee_email', '==', voter_email)\
        .where('status', '==', 'active')
    
    proxies = list(proxies_ref.stream())
    proxy_count = len(proxies)
    
    weight = 1 + proxy_count
    
    return {
        'success': True,
        'weight': weight,
        'proxy_count': proxy_count
    }

def register_vote(condominium_id, assembly_number, voter, votes, voting_weight):
    """
    Registra os votos de um votante
    
    Se o peso > 1, registra votos individuais para cada procuração
    
    Args:
        condominium_id: ID do condomínio
        assembly_number: Número da assembleia
        voter: Dados do votante
        votes: Dicionário com os votos {item_id: choice}
        voting_weight: Peso do voto (1 + número de procurações)
    
    Returns:
        dict: {success, message, error}
    """
    
    # Verifica se o votante já votou nesta assembleia
    vote_ref = db.collection(f'condominiums/{condominium_id}/assemblies/{assembly_number}/votes')\
        .document(voter['email'])
    
    if vote_ref.get().exists:
        return {'success': False, 'error': 'Você já votou nesta assembleia'}
    
    # Busca procurações onde este email é o outorgado
    proxies = []
    if voting_weight > 1:
        proxies_ref = db.collection(f'condominiums/{condominium_id}/proxies')\
            .where('grantee_email', '==', voter['email'])\
            .where('status', '==', 'active')
        proxies = list(proxies_ref.stream())
    
    # Prepara o objeto de votos
    votes_data = {
        'voter_email': voter['email'],
        'voter_cpf': voter['cpf'],
        'voted_at': firestore.SERVER_TIMESTAMP,
        'voting_weight': voting_weight,
        'votes': votes,
        'proxy_count': len(proxies)
    }
    
    # Se tem procurações, registra os grantors
    if proxies:
        votes_data['proxy_for'] = []
        for proxy in proxies:
            proxy_data = proxy.to_dict()
            votes_data['proxy_for'].append({
                'grantor_cpf': proxy_data.get('grantor_cpf'),
                'grantee_email': proxy_data.get('grantee_email')
            })
    
    # Registra o voto principal
    vote_ref.set(votes_data)
    
    # Para cada procuração, registra um voto individual (voto indireto)
    for proxy in proxies:
        proxy_data = proxy.to_dict()
        grantor_cpf = proxy_data.get('grantor_cpf')
        
        # Busca o grantor para saber seu email
        grantor = db.collection(f'condominiums/{condominium_id}/residents')\
            .where('cpf', '==', grantor_cpf).limit(1).get()
        
        grantor_email = None
        for g in grantor:
            grantor_email = g.id
            break
        
        if grantor_email:
            proxy_vote_ref = db.collection(f'condominiums/{condominium_id}/assemblies/{assembly_number}/votes')\
                .document(grantor_email)
            
            proxy_vote_ref.set({
                'voter_email': voter['email'],
                'grantor_email': grantor_email,
                'grantor_cpf': grantor_cpf,
                'voted_at': firestore.SERVER_TIMESTAMP,
                'vote_type': 'proxy',
                'votes': votes
            })
    
    return {'success': True, 'message': 'Voto registrado com sucesso'}