"""
Service for managing assemblies and votes
"""

from firebase_admin import firestore
from datetime import datetime

db = firestore.client()

# Cria Assembléia =================================
def create_assembly(cond_id, data):
    """Create a new assembly/voting (inactive by default)"""
    assembly_number = data.get('number', '').replace('/', '-')
    assembly_ref = db.collection(f'condominiums/{cond_id}/assemblies').document(assembly_number)
    
    assembly_ref.set({
        'name': data.get('name'),
        'number': data.get('number'),
        'description': data.get('description'),
        'informative_text': data.get('informative_text'),
        'date': data.get('date'),
        'status': 'inactive',  # inactive, active, closed
        'start_date': data.get('start_date'),
        'end_date': data.get('end_date'),
        'created_at': firestore.SERVER_TIMESTAMP,
        'created_by': data.get('created_by')
    })
    
    return {'success': True, 'assembly_number': assembly_number}

# Start Assembléia =================================
def start_assembly(cond_id, assembly_number):
    """
    Inicia uma assembleia (ativa para votação)
    """
    assembly_ref = db.collection(f'condominiums/{cond_id}/assemblies').document(assembly_number)
    assembly_ref.update({
        'status': 'active',
        'started_at': firestore.SERVER_TIMESTAMP,
        'started_by': 'admin'
    })
    
    return {'success': True, 'message': f'Assembleia {assembly_number} iniciada com sucesso'}

# Close Assembléia =================================

def close_assembly(cond_id, assembly_number):
    """
    Encerra uma assembleia (votação encerrada, resultados disponíveis)
    """
    assembly_ref = db.collection(f'condominiums/{cond_id}/assemblies').document(assembly_number)
    assembly_ref.update({
        'status': 'closed',
        'closed_at': firestore.SERVER_TIMESTAMP,
        'closed_by': 'admin'
    })
    
    return {'success': True, 'message': f'Assembleia {assembly_number} encerrada com sucesso'}

# Get Assembléia Status =================================
def get_assembly_status(cond_id, assembly_number):
    """
    Retorna o status completo de uma assembleia
    """
    doc = db.collection(f'condominiums/{cond_id}/assemblies').document(assembly_number).get()
    if not doc.exists:
        return None
    
    data = doc.to_dict()
    return {
        'status': data.get('status', 'inactive'),
        'started_at': data.get('started_at'),
        'closed_at': data.get('closed_at'),
        'has_results': data.get('status') == 'closed'  # Resultados disponíveis apenas se fechada
    }

def deactivate_assembly(cond_id, assembly_number):
    """
    Desativa uma assembleia (apenas se ela for a ativa)
    """
    assembly_ref = db.collection(f'condominiums/{cond_id}/assemblies').document(assembly_number)
    assembly_ref.update({
        'status': 'inactive',
        'deactivated_at': firestore.SERVER_TIMESTAMP
    })
    
    return {'success': True, 'message': f'Assembleia {assembly_number} desativada com sucesso'}

def add_assembly_item(cond_id, assembly_number, item_data):
    """
    Add an item to an assembly
    
    Supports two types:
    - 'approve_reject': Yes/No voting
    - 'multiple_choice': Choose one option from multiple (e.g., elections)
    """
    item_ref = db.collection(f'condominiums/{cond_id}/assemblies/{assembly_number}/items').document()
    
    # Base item data
    item_dict = {
        'order': item_data.get('order'),
        'title': item_data.get('title'),
        'description': item_data.get('description'),
        'type': item_data.get('type', 'approve_reject'),
        'is_released': item_data.get('is_released', False),
        'is_locked': item_data.get('is_locked', False),
        'created_at': firestore.SERVER_TIMESTAMP
    }
    
    # Add options for multiple choice items
    if item_data.get('type') == 'multiple_choice':
        item_dict['options'] = item_data.get('options', [])
        item_dict['max_options'] = item_data.get('max_options', 1)
    
    item_ref.set(item_dict)
    return {'success': True, 'item_id': item_ref.id}

def update_item_release_status(cond_id, assembly_number, item_id, is_released):
    """Update item release status (liberar/bloquear para votação)"""
    item_ref = db.collection(f'condominiums/{cond_id}/assemblies/{assembly_number}/items').document(item_id)
    item_ref.update({
        'is_released': is_released,
        'updated_at': firestore.SERVER_TIMESTAMP
    })

def update_item_lock_status(cond_id, assembly_number, item_id, is_locked):
    """Update item lock status (bloquear item pelo admin)"""
    item_ref = db.collection(f'condominiums/{cond_id}/assemblies/{assembly_number}/items').document(item_id)
    item_ref.update({
        'is_locked': is_locked,
        'updated_at': firestore.SERVER_TIMESTAMP
    })

def update_item_options(cond_id, assembly_number, item_id, options):
    """Update options for a multiple choice item"""
    item_ref = db.collection(f'condominiums/{cond_id}/assemblies/{assembly_number}/items').document(item_id)
    item_ref.update({
        'options': options,
        'updated_at': firestore.SERVER_TIMESTAMP
    })

def get_assembly_items(cond_id, assembly_number):
    """Get all items of an assembly"""
    items_ref = db.collection(f'condominiums/{cond_id}/assemblies/{assembly_number}/items')\
        .order_by('order')
    docs = items_ref.stream()
    
    items = []
    for doc in docs:
        data = doc.to_dict()
        item = {
            'id': doc.id,
            'order': data.get('order'),
            'title': data.get('title'),
            'description': data.get('description'),
            'type': data.get('type', 'approve_reject'),
            'is_released': data.get('is_released', False),
            'is_locked': data.get('is_locked', False)
        }
        
        # Add options for multiple choice
        if data.get('type') == 'multiple_choice':
            item['options'] = data.get('options', [])
            item['max_options'] = data.get('max_options', 1)
        
        items.append(item)
    
    return items

def get_assembly_details(cond_id, assembly_number):
    """Get assembly details including informative text"""
    doc = db.collection(f'condominiums/{cond_id}/assemblies').document(assembly_number).get()
    if not doc.exists:
        return None
    
    data = doc.to_dict()
    
    # Get informative text from subcollection
    informative_text = ''
    info_ref = db.collection(f'condominiums/{cond_id}/assemblies/{assembly_number}/info').document('info')
    info_doc = info_ref.get()
    if info_doc.exists:
        informative_text = info_doc.to_dict().get('informative_text', '')
    
    return {
        'name': data.get('name'),
        'number': data.get('number'),
        'date': data.get('date'),
        'informative_text': informative_text,
        'status': data.get('status')
    }

# delete item
def delete_assembly_item(cond_id, assembly_number, item_id):
    """
    Deleta um item específico de uma assembleia
    """
    item_ref = db.collection(f'condominiums/{cond_id}/assemblies/{assembly_number}/items').document(item_id)
    
    # Verifica se o item existe
    if not item_ref.get().exists:
        return {'success': False, 'error': 'Item não encontrado'}
    
    # Deleta o item
    item_ref.delete()
    
    # Reordenar os itens restantes (opcional)
    items_ref = db.collection(f'condominiums/{cond_id}/assemblies/{assembly_number}/items')\
        .order_by('order')
    items = list(items_ref.stream())
    
    # Reordena os itens restantes
    for idx, doc in enumerate(items, 1):
        doc.reference.update({'order': idx})
    
    return {'success': True}


def get_all_assemblies(cond_id):
    """Get all assemblies with status"""
    assemblies_ref = db.collection(f'condominiums/{cond_id}/assemblies')
    docs = assemblies_ref.stream()
    
    assemblies = []
    for doc in docs:
        data = doc.to_dict()
        
        # Get items count
        items_count = len(list(db.collection(f'condominiums/{cond_id}/assemblies/{doc.id}/items').stream()))
        
        assemblies.append({
            'number': doc.id,
            'name': data.get('name'),
            'date': data.get('date'),
            'items_count': items_count,
            'status': data.get('status', 'inactive'),  # Adicionado status
            'created_at': data.get('created_at')
        })
    
    return assemblies

def register_vote(cond_id, assembly_number, grantor_cpf, voted_by_email, voted_by_cpf, vote_type, answers):
    """Register a vote"""
    vote_ref = db.collection(f'condominiums/{cond_id}/assemblies/{assembly_number}/votes').document(grantor_cpf)
    
    # Check if already voted
    if vote_ref.get().exists:
        return {'success': False, 'error': 'Este residente já votou nesta assembleia'}
    
    vote_ref.set({
        'grantor_cpf': grantor_cpf,
        'voted_by_email': voted_by_email,
        'voted_by_cpf': voted_by_cpf,
        'vote_type': vote_type,
        'voted_at': firestore.SERVER_TIMESTAMP,
        'answers': answers
    })
    
    return {'success': True}

def has_voted(cond_id, assembly_number, grantor_cpf):
    """Check if a resident has already voted"""
    vote_ref = db.collection(f'condominiums/{cond_id}/assemblies/{assembly_number}/votes').document(grantor_cpf)
    return vote_ref.get().exists

def get_vote(cond_id, assembly_number, grantor_cpf):
    """Get vote details"""
    vote_ref = db.collection(f'condominiums/{cond_id}/assemblies/{assembly_number}/votes').document(grantor_cpf)
    doc = vote_ref.get()
    
    if not doc.exists:
        return None
    
    data = doc.to_dict()
    return {
        'grantor_cpf': data.get('grantor_cpf'),
        'voted_by_email': data.get('voted_by_email'),
        'voted_by_cpf': data.get('voted_by_cpf'),
        'vote_type': data.get('vote_type'),
        'voted_at': data.get('voted_at'),
        'answers': data.get('answers')
    }

def activate_assembly(cond_id, assembly_number):
    """
    Ativa uma assembleia e desativa todas as outras
    """
    # Busca todas as assembleias do condomínio
    assemblies_ref = db.collection(f'condominiums/{cond_id}/assemblies')
    all_assemblies = assemblies_ref.stream()
    
    # Desativa todas as assembleias
    for doc in all_assemblies:
        doc.reference.update({'status': 'inactive'})
    
    # Ativa a assembleia selecionada
    assembly_ref = db.collection(f'condominiums/{cond_id}/assemblies').document(assembly_number)
    assembly_ref.update({
        'status': 'active',
        'activated_at': firestore.SERVER_TIMESTAMP
    })
    
    return {'success': True, 'message': f'Assembleia {assembly_number} ativada com sucesso'}
