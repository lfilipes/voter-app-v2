"""
Serviço para geração de relatórios e resultados de votações
"""

from firebase_admin import firestore

db = firestore.client()

def get_election_results(cond_id, assembly_number):
    """
    Calcula os resultados de uma votação/assembleia
    
    Retorna:
    - total_voters: número total de votantes elegíveis
    - total_votes_cast: número total de votos registrados
    - items_results: lista com resultados por item
    """
    
    # ============================================
    # 1. Busca todos os votos da assembleia
    # ============================================
    votes_ref = db.collection(f'condominiums/{cond_id}/assemblies/{assembly_number}/votes')
    votes = list(votes_ref.stream())
    
    print(f"[DEBUG] Total de votos encontrados: {len(votes)}")
    
    # ============================================
    # 2. Busca todos os itens da assembleia
    # ============================================
    items_ref = db.collection(f'condominiums/{cond_id}/assemblies/{assembly_number}/items')\
        .order_by('order')
    items_docs = list(items_ref.stream())
    
    print(f"[DEBUG] Total de itens encontrados: {len(items_docs)}")
    
    # ============================================
    # 3. Busca o número total de residentes elegíveis
    # ============================================
    residents_ref = db.collection(f'condominiums/{cond_id}/residents')
    residents = list(residents_ref.stream())
    total_eligible = len([r for r in residents if r.to_dict().get('can_vote', True)])
    
    print(f"[DEBUG] Total de residentes elegíveis: {total_eligible}")
    
    # ============================================
    # 4. Processa resultados por item
    # ============================================
    items_results = []
    
    for item_doc in items_docs:
        item_data = item_doc.to_dict()
        item_type = item_data.get('type', 'approve_reject')
        item_id = item_doc.id
        
        print(f"[DEBUG] Processando item: {item_id} - Tipo: {item_type}")
        
        # Contadores para approve_reject
        approve_count = 0
        reject_count = 0
        abstain_count = 0
        
        # Para multiple_choice
        options_counts = {}
        total_votes_on_item = 0
        
        # Coleta as opções disponíveis para multiple_choice
        if item_type == 'multiple_choice':
            options = item_data.get('options', [])
            for opt in options:
                options_counts[opt['id']] = {
                    'label': opt['label'],
                    'description': opt.get('description', ''),
                    'count': 0,
                    'percentage': 0
                }
        
        # ============================================
        # 5. Conta os votos para este item
        # ============================================
        for vote_doc in votes:
            vote_data = vote_doc.to_dict()
            
            # Estrutura do voto: pode estar em 'votes' ou 'answers'
            # Verifica ambas as possibilidades
            vote_answers = vote_data.get('answers') or vote_data.get('votes')
            
            if not vote_answers:
                print(f"[DEBUG] Voto sem answers/votes: {vote_doc.id}")
                continue
            
            # Pega o voto para este item específico
            vote_value = vote_answers.get(item_id)
            
            if vote_value is not None and vote_value != '':
                total_votes_on_item += 1
                
                if item_type == 'approve_reject':
                    if vote_value == 'approve':
                        approve_count += 1
                    elif vote_value == 'reject':
                        reject_count += 1
                    elif vote_value == 'abstain':
                        abstain_count += 1
                        
                elif item_type == 'multiple_choice':
                    # Para múltipla escolha, o valor é o ID da opção
                    if vote_value in options_counts:
                        options_counts[vote_value]['count'] += 1
        
        # ============================================
        # 6. Calcula porcentagens
        # ============================================
        if item_type == 'approve_reject':
            total_votes = approve_count + reject_count + abstain_count
            
            result = {
                'item_id': item_id,
                'order': item_data.get('order'),
                'title': item_data.get('title'),
                'description': item_data.get('description'),
                'type': 'approve_reject',
                'approve': approve_count,
                'approve_percentage': (approve_count / total_votes * 100) if total_votes > 0 else 0,
                'reject': reject_count,
                'reject_percentage': (reject_count / total_votes * 100) if total_votes > 0 else 0,
                'abstain': abstain_count,
                'abstain_percentage': (abstain_count / total_votes * 100) if total_votes > 0 else 0,
                'total_votes': total_votes,
                'turnout_percentage': (total_votes / total_eligible * 100) if total_eligible > 0 else 0
            }
            
            print(f"[DEBUG] Item {item_id} - Aprov: {approve_count}, Reprov: {reject_count}")
            
        else:  # multiple_choice
            # Converte para lista ordenada
            options_list = []
            for opt_id, opt_data in options_counts.items():
                opt_data['percentage'] = (opt_data['count'] / total_votes_on_item * 100) if total_votes_on_item > 0 else 0
                opt_data['id'] = opt_id
                options_list.append(opt_data)
            
            # Ordena por número de votos (decrescente)
            options_list.sort(key=lambda x: x['count'], reverse=True)
            
            result = {
                'item_id': item_id,
                'order': item_data.get('order'),
                'title': item_data.get('title'),
                'description': item_data.get('description'),
                'type': 'multiple_choice',
                'options': options_list,
                'total_votes': total_votes_on_item,
                'turnout_percentage': (total_votes_on_item / total_eligible * 100) if total_eligible > 0 else 0
            }
            
            print(f"[DEBUG] Item {item_id} - Opções: {[(opt['label'], opt['count']) for opt in options_list]}")
        
        items_results.append(result)
    
    return {
        'success': True,
        'assembly_number': assembly_number,
        'total_eligible_voters': total_eligible,
        'total_votes_cast': len(votes),
        'items_results': items_results
    }


def get_assembly_info(cond_id, assembly_number):
    """Busca informações básicas da assembleia"""
    doc = db.collection(f'condominiums/{cond_id}/assemblies').document(assembly_number).get()
    if not doc.exists:
        return None
    
    data = doc.to_dict()
    
    # Busca informativo da subcollection
    info_text = ''
    info_ref = db.collection(f'condominiums/{cond_id}/assemblies/{assembly_number}/info').document('info')
    info_doc = info_ref.get()
    if info_doc.exists:
        info_text = info_doc.to_dict().get('informative_text', '')
    
    return {
        'name': data.get('name'),
        'number': data.get('number'),
        'date': data.get('date'),
        'status': data.get('status'),
        'informative_text': info_text
    }


def get_all_assemblies_for_report(cond_id):
    """Lista todas as assembleias disponíveis para relatórios"""
    assemblies_ref = db.collection(f'condominiums/{cond_id}/assemblies')
    docs = assemblies_ref.stream()
    
    assemblies = []
    for doc in docs:
        data = doc.to_dict()
        assemblies.append({
            'number': doc.id,
            'name': data.get('name'),
            'date': data.get('date'),
            'status': data.get('status')
        })
    
    # Ordena por data (mais recente primeiro)
    assemblies.sort(key=lambda x: x.get('date', ''), reverse=True)
    
    return assemblies

def get_detailed_votes(cond_id, assembly_number):
    """
    Busca todos os votos detalhados de uma assembleia
    Apenas votantes que efetivamente votaram (can_vote = true)
    """
    
    # Busca todos os votos
    votes_ref = db.collection(f'condominiums/{cond_id}/assemblies/{assembly_number}/votes')
    votes = list(votes_ref.stream())
    
    # Busca todos os residentes para obter dados completos
    residents_ref = db.collection(f'condominiums/{cond_id}/residents')
    residents = {}
    for doc in residents_ref.stream():
        data = doc.to_dict()
        residents[doc.id] = {
            'name': data.get('name'),
            'apartment': data.get('apartment'),
            'email': doc.id,
            'cpf': data.get('cpf'),
            'can_vote': data.get('can_vote', True),
            'proxy_granted_to': data.get('proxy_granted_to')
        }
    
    # Busca procurações para calcular peso do voto
    proxies_ref = db.collection(f'condominiums/{cond_id}/proxies').where('status', '==', 'active')
    proxies_by_grantee = {}
    for proxy in proxies_ref.stream():
        data = proxy.to_dict()
        grantee_email = data.get('grantee_email')
        if grantee_email:
            if grantee_email not in proxies_by_grantee:
                proxies_by_grantee[grantee_email] = []
            proxies_by_grantee[grantee_email].append({
                'grantor_cpf': data.get('grantor_cpf'),
                'apartment': data.get('apartment')
            })
    
    # Processa cada voto - APENAS quem efetivamente votou (can_vote = true)
    detailed_votes = []
    for vote_doc in votes:
        voter_email = vote_doc.id
        
        # Obtém dados do residente
        resident = residents.get(voter_email, {})
        
        # ⭐ PULA VOTANTES QUE DERAM PROCURAÇÃO (não votam)
        if not resident.get('can_vote', True):
            print(f"[DEBUG] Pulando {voter_email} - deu procuração, não vota")
            continue
        
        # Obtém os votos (pode estar em 'answers' ou 'votes')
        vote_data = vote_doc.to_dict()
        answers = vote_data.get('answers') or vote_data.get('votes') or {}
        
        # Se não há votos, pula
        if not answers or len(answers) == 0:
            print(f"[DEBUG] Pulando {voter_email} - sem votos registrados")
            continue
        
        # Calcula peso do voto (1 + número de procurações RECEBIDAS)
        proxy_count = len(proxies_by_grantee.get(voter_email, []))
        voting_weight = 1 + proxy_count
        
        # Verifica se está votando por procuração (tem procurações recebidas)
        is_proxy_vote = proxy_count > 0
        
        detailed_votes.append({
            'voter_email': voter_email,
            'voter_name': resident.get('name', 'Desconhecido'),
            'apartment': resident.get('apartment', '-'),
            'voting_weight': voting_weight,
            'is_proxy_vote': is_proxy_vote,
            'proxy_count': proxy_count,
            'voted_at': vote_data.get('voted_at'),
            'answers': answers
        })
    
    return detailed_votes


def get_votes_by_item(cond_id, assembly_number):
    """
    Organiza os votos por item para exibição em tabela
    """
    detailed_votes = get_detailed_votes(cond_id, assembly_number)
    
    # Busca os itens para ter os títulos
    items_ref = db.collection(f'condominiums/{cond_id}/assemblies/{assembly_number}/items')\
        .order_by('order')
    items = []
    for doc in items_ref.stream():
        data = doc.to_dict()
        items.append({
            'id': doc.id,
            'order': data.get('order'),
            'description': data.get('description'),
            'type': data.get('type', 'approve_reject'),
            'options': data.get('options', [])  # Para múltipla escolha
        })
    
    # Para cada item, organiza os votos
    votes_by_item = {}
    for item in items:
        item_votes = []
        for vote in detailed_votes:
            vote_value = vote['answers'].get(item['id'])
            if vote_value:
                # Para múltipla escolha, converte ID da opção para label
                vote_label = vote_value
                if item['type'] == 'multiple_choice':
                    for opt in item.get('options', []):
                        if opt.get('id') == vote_value:
                            vote_label = opt.get('label', vote_value)
                            break
                
                item_votes.append({
                    'voter_name': vote['voter_name'],
                    'apartment': vote['apartment'],
                    'voter_email': vote['voter_email'],
                    'voting_weight': vote['voting_weight'],
                    'vote': vote_label,
                    'vote_raw': vote_value,
                    'is_proxy_vote': vote['is_proxy_vote']
                })
        
        # Calcula totalização
        total_weight = sum([v['voting_weight'] for v in item_votes])
        
        # Conta votos por opção
        vote_counts = {}
        for v in item_votes:
            vote_label = v['vote']
            if vote_label not in vote_counts:
                vote_counts[vote_label] = {'count': 0, 'weight': 0}
            vote_counts[vote_label]['count'] += 1
            vote_counts[vote_label]['weight'] += v['voting_weight']
        
        votes_by_item[item['id']] = {
            'item_id': item['id'],
            'item_order': item['order'],
            'item_description': item['description'],
            'item_type': item['type'],
            'votes': item_votes,
            'total_votes': len(item_votes),
            'total_weight': total_weight,
            'vote_counts': vote_counts
        }
    
    return votes_by_item