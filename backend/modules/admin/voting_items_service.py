"""
Serviço de acesso ao Firestore para itens de votação
Gerencia as collections: voting_items
"""

from firebase_admin import firestore

db = firestore.client()

COLL_VOTING_ITEMS = 'voting_items'  # Itens de votação

# ============================================
# FUNÇÕES PARA ITENS DE VOTAÇÃO
# ============================================

def save_voting_items(election_number, election_name, informative_text, items):
    """
    Salva os itens de votação para uma assembleia
    
    Args:
        election_number: número da votação (ex: 001/2024)
        election_name: nome da votação
        informative_text: texto informativo sobre a assembleia
        items: lista de dicionários com {'item_number', 'description'}
    
    Returns:
        list: IDs dos documentos criados
    """
    # Verifica se já existe itens para esta votação
    existing_items = get_voting_items_by_election(election_number)
    if existing_items:
        # Se existir, deleta os antigos primeiro
        delete_voting_items_by_election(election_number)
    
    # Cria um documento principal para a votação
    main_ref = db.collection(COLL_VOTING_ITEMS).document(f"{election_number}_info")
    main_ref.set({
        'election_number': election_number,
        'election_name': election_name,
        'informative_text': informative_text,
        'total_items': len(items),
        'created_at': firestore.SERVER_TIMESTAMP,
        'updated_at': firestore.SERVER_TIMESTAMP
    })
    
    # Cria documentos para cada item
    item_ids = []
    for item in items:
        item_ref = db.collection(COLL_VOTING_ITEMS).document()
        item_data = {
            'election_number': election_number,
            'item_number': item.get('item_number'),
            'description': item.get('description'),
            'type': 'item',
            'created_at': firestore.SERVER_TIMESTAMP
        }
        item_ref.set(item_data)
        item_ids.append(item_ref.id)
    
    return {
        'main_id': f"{election_number}_info",
        'item_ids': item_ids,
        'total_items': len(items)
    }

def get_voting_items_by_election(election_number):
    """
    Retorna todos os itens de votação de uma eleição específica
    """
    # Busca o documento principal
    main_ref = db.collection(COLL_VOTING_ITEMS).document(f"{election_number}_info")
    main_doc = main_ref.get()
    
    if not main_doc.exists:
        return None
    
    # Busca os itens
    items_ref = db.collection(COLL_VOTING_ITEMS).where('election_number', '==', election_number).where('type', '==', 'item')
    docs = items_ref.stream()
    
    items = []
    for doc in docs:
        data = doc.to_dict()
        items.append({
            'id': doc.id,
            'item_number': data.get('item_number'),
            'description': data.get('description')
        })
    
    # Ordena por número do item
    items.sort(key=lambda x: x.get('item_number', 0))
    
    return {
        'election_number': election_number,
        'election_name': main_doc.to_dict().get('election_name'),
        'informative_text': main_doc.to_dict().get('informative_text'),
        'total_items': len(items),
        'items': items,
        'created_at': main_doc.to_dict().get('created_at')
    }

def get_all_voting_items():
    """
    Retorna todas as votações que têm itens cadastrados
    """
    # Busca todos os documentos principais (que terminam com _info)
    collection_ref = db.collection(COLL_VOTING_ITEMS)
    docs = collection_ref.stream()
    
    elections = []
    for doc in docs:
        data = doc.to_dict()
        if doc.id.endswith('_info'):
            # Busca a contagem de itens
            items_ref = collection_ref.where('election_number', '==', data.get('election_number')).where('type', '==', 'item')
            items_count = len(list(items_ref.stream()))
            
            elections.append({
                'election_number': data.get('election_number'),
                'election_name': data.get('election_name'),
                'total_items': items_count,
                'created_at': data.get('created_at').isoformat() if data.get('created_at') else None
            })
    
    return elections

def delete_voting_items_by_election(election_number):
    """
    Deleta todos os itens de votação de uma eleição
    """
    # Deleta o documento principal
    main_ref = db.collection(COLL_VOTING_ITEMS).document(f"{election_number}_info")
    main_ref.delete()
    
    # Deleta todos os itens
    items_ref = db.collection(COLL_VOTING_ITEMS).where('election_number', '==', election_number).where('type', '==', 'item')
    docs = items_ref.stream()
    
    for doc in docs:
        doc.reference.delete()
    
    return True

def validate_election_exists(election_number):
    """
    Verifica se a votação existe na coleção de votantes
    """
    voters_ref = db.collection('voters').where('election_number', '==', election_number).limit(1)
    docs = list(voters_ref.stream())
    return len(docs) > 0