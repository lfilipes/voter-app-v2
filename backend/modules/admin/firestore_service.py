"""
Serviço de acesso ao Firestore para o módulo Admin
Todas as operações de banco de dados do módulo Admin ficam aqui
"""

from firebase_admin import firestore
import json
from datetime import datetime

db = firestore.client()

# ============================================
# CONSTANTES - Nomes das Collections
# ============================================

COLL_ELECTIONS = 'elections'      # Votações
COLL_PROXIES = 'proxies'          # Procurações
COLL_VOTERS = 'voters'            # Votantes
COLL_ADMIN = 'admin_users'        # Admins autorizados

# ============================================
# FUNÇÕES PARA ADMIN
# ============================================

def is_admin_user(uid):
    """Verifica se um UID é de um administrador autorizado"""
    doc_ref = db.collection(COLL_ADMIN).document(uid)
    doc = doc_ref.get()
    return doc.exists

def add_admin_user(uid, email):
    """Adiciona um novo administrador (uso único durante setup)"""
    db.collection(COLL_ADMIN).document(uid).set({
        'email': email,
        'created_at': firestore.SERVER_TIMESTAMP,
        'role': 'admin'
    })

# ============================================
# FUNÇÕES PARA VOTAÇÕES (ELECTIONS)
# ============================================

def save_election(election_data):
    """
    Salva uma votação no Firestore
    Retorna o ID do documento criado
    """
    doc_ref = db.collection(COLL_ELECTIONS).document()
    doc_ref.set({
        'id': doc_ref.id,
        'name': election_data.get('name'),
        'election_number': election_data.get('election_number'),
        'date': election_data.get('date'),
        'created_at': firestore.SERVER_TIMESTAMP,
        'voters_count': election_data.get('voters_count', 0),
        'status': 'active'
    })
    return doc_ref.id

def get_all_elections():
    """Retorna todas as votações cadastradas"""
    elections_ref = db.collection(COLL_ELECTIONS).order_by('created_at', direction=firestore.Query.DESCENDING)
    docs = elections_ref.stream()
    
    elections = []
    for doc in docs:
        data = doc.to_dict()
        elections.append({
            'id': doc.id,
            'name': data.get('name'),
            'election_number': data.get('election_number'),
            'date': data.get('date'),
            'voters_count': data.get('voters_count', 0),
            'status': data.get('status', 'active'),
            'created_at': data.get('created_at').isoformat() if data.get('created_at') else None
        })
    return elections

def get_election_by_number(election_number):
    """Busca uma votação pelo número"""
    elections_ref = db.collection(COLL_ELECTIONS).where('election_number', '==', election_number).limit(1)
    docs = elections_ref.stream()
    
    for doc in docs:
        return doc.to_dict()
    return None

# ============================================
# FUNÇÕES PARA PROCURAÇÕES (PROXIES)
# ============================================

def save_proxy(proxy_data):
    """
    Salva uma procuração no Firestore (dados básicos)
    Retorna o ID do documento criado
    """
    doc_ref = db.collection(COLL_PROXIES).document()
    doc_ref.set({
        'id': doc_ref.id,
        'apartment': proxy_data.get('apartment'),
        'grantor_email': proxy_data.get('grantor_email'),
        'grantor_cpf': proxy_data.get('grantor_cpf'),
        'grantee_cpf': proxy_data.get('grantee_cpf'),
        'original_filename': proxy_data.get('original_filename'),
        'pdf_page_count': proxy_data.get('pdf_page_count', 1),
        'pdf_url': proxy_data.get('pdf_url'),
        'uploaded_at': firestore.SERVER_TIMESTAMP,
        'status': 'active'
    })
    return doc_ref.id

def update_proxy_pdf_url(proxy_id, pdf_url):
    """
    Atualiza a URL do PDF no documento da procuração
    """
    doc_ref = db.collection(COLL_PROXIES).document(proxy_id)
    doc_ref.update({
        'pdf_url': pdf_url
    })

def get_all_proxies():
    """Retorna todas as procurações cadastradas"""
    proxies_ref = db.collection(COLL_PROXIES).order_by('uploaded_at', direction=firestore.Query.DESCENDING)
    docs = proxies_ref.stream()
    
    proxies = []
    for doc in docs:
        data = doc.to_dict()
        proxies.append({
            'id': doc.id,
            'apartment': data.get('apartment'),
            'grantor_email': data.get('grantor_email'),
            'grantor_cpf': data.get('grantor_cpf'),
            'grantee_cpf': data.get('grantee_cpf'),
            'original_filename': data.get('original_filename'),
            'pdf_url': data.get('pdf_url'),
            'status': data.get('status', 'active'),
            'uploaded_at': data.get('uploaded_at').isoformat() if data.get('uploaded_at') else None
        })
    return proxies

def get_proxies_by_apartment(apartment):
    """Busca procurações por apartamento"""
    proxies_ref = db.collection(COLL_PROXIES).where('apartment', '==', apartment)
    docs = proxies_ref.stream()
    
    proxies = []
    for doc in docs:
        data = doc.to_dict()
        proxies.append({
            'id': doc.id,
            'apartment': data.get('apartment'),
            'grantor_email': data.get('grantor_email'),
            'grantor_cpf': data.get('grantor_cpf'),
            'grantee_cpf': data.get('grantee_cpf'),
            'pdf_url': data.get('pdf_url'),
            'uploaded_at': data.get('uploaded_at').isoformat() if data.get('uploaded_at') else None
        })
    return proxies

# ============================================
# FUNÇÕES PARA VOTANTES (VOTERS)
# ============================================

def get_voters_by_election(election_number):
    """
    Retorna todos os votantes de uma votação específica
    """
    voters_ref = db.collection(COLL_VOTERS).where('election_number', '==', election_number)
    docs = voters_ref.stream()
    
    voters = []
    for doc in docs:
        data = doc.to_dict()
        voters.append({
            'id': doc.id,
            'name': data.get('name'),
            'email': data.get('email'),
            'apartment': data.get('apartment'),
            'has_voted': data.get('has_voted', False)
        })
    
    # Ordena por nome
    voters.sort(key=lambda x: x.get('name', ''))
    
    return voters

# ============================================
# FUNÇÕES PARA VOTANTES (VOTERS)
# ============================================

def save_voters_batch(voters_list, election_number):
    """
    Salva uma lista de votantes em lote
    voters_list: lista de dicionários com 'name', 'email', 'apartment', 'cpf'
    election_number: número da votação
    """
    batch = db.batch()
    collection_ref = db.collection(COLL_VOTERS)
    
    for voter in voters_list:
        doc_ref = collection_ref.document()
        batch.set(doc_ref, {
            'id': doc_ref.id,
            'name': voter.get('name'),
            'email': voter.get('email'),
            'apartment': voter.get('apartment'),
            'cpf': voter.get('cpf'),  # NOVO CAMPO
            'election_number': election_number,
            'has_voted': False,
            'created_at': firestore.SERVER_TIMESTAMP
        })
    
    batch.commit()
    return len(voters_list)

def get_voters_by_election(election_number):
    """
    Retorna todos os votantes de uma votação específica
    """
    voters_ref = db.collection(COLL_VOTERS).where('election_number', '==', election_number)
    docs = voters_ref.stream()
    
    voters = []
    for doc in docs:
        data = doc.to_dict()
        voters.append({
            'id': doc.id,
            'name': data.get('name'),
            'email': data.get('email'),
            'apartment': data.get('apartment'),
            'cpf': data.get('cpf'),  # NOVO CAMPO
            'has_voted': data.get('has_voted', False)
        })
    
    # Ordena por apartamento (ou nome)
    voters.sort(key=lambda x: x.get('apartment', ''))
    
    return voters