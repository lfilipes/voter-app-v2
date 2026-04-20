"""
Service for managing condominiums
"""

from firebase_admin import firestore
import secrets

db = firestore.client()

def create_condominium(data):
    """Create a new condominium"""
    cond_id = secrets.token_hex(8)  # Generate unique ID
    cond_ref = db.collection('condominiums').document(cond_id)
    
    cond_ref.set({
        'id': cond_id,
        'name': data.get('name'),
        'address': data.get('address'),
        'cnpj': data.get('cnpj'),
        'phone': data.get('phone'),
        'email_admin': data.get('email_admin'),
        'settings': {
            'require_cpf_login': data.get('require_cpf_login', True),
            'allow_proxy_votes': data.get('allow_proxy_votes', True),
            'allow_blank_vote': data.get('allow_blank_vote', False)
        },
        'created_at': firestore.SERVER_TIMESTAMP
    })
    
    return {'success': True, 'condominium_id': cond_id}

def get_all_condominiums():
    """Get all condominiums"""
    cond_ref = db.collection('condominiums')
    docs = cond_ref.stream()
    
    condominiums = []
    for doc in docs:
        data = doc.to_dict()
        condominiums.append({
            'id': doc.id,
            'name': data.get('name'),
            'address': data.get('address'),
            'cnpj': data.get('cnpj'),
            'phone': data.get('phone'),
            'email_admin': data.get('email_admin'),
            'created_at': data.get('created_at')
        })
    
    return condominiums

def get_condominium(cond_id):
    """Get a specific condominium"""
    doc = db.collection('condominiums').document(cond_id).get()
    if not doc.exists:
        return None
    
    data = doc.to_dict()
    return {
        'id': doc.id,
        'name': data.get('name'),
        'address': data.get('address'),
        'cnpj': data.get('cnpj'),
        'phone': data.get('phone'),
        'email_admin': data.get('email_admin'),
        'settings': data.get('settings'),
        'created_at': data.get('created_at')
    }

def get_all_condominiums_public():
    """Get all condominiums (public - no auth required)"""
    cond_ref = db.collection('condominiums')
    docs = cond_ref.stream()
    
    condominiums = []
    for doc in docs:
        data = doc.to_dict()
        condominiums.append({
            'id': doc.id,
            'name': data.get('name'),
            'address': data.get('address'),
            'email_admin': data.get('email_admin')
        })
    
    return condominiums