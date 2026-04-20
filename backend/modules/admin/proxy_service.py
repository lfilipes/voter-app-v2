"""
Service for managing proxies
"""

from firebase_admin import firestore
import re
from .resident_service import get_resident_by_cpf

db = firestore.client()

def create_proxy(cond_id, data):
    """Create a new proxy"""
    grantor_cpf = re.sub(r'\D', '', data.get('grantor_cpf', ''))
    grantee_email = data.get('grantee_email', '').lower().strip()
    
    # Validate grantor exists
    grantor = get_resident_by_cpf(cond_id, grantor_cpf)
    if not grantor:
        raise ValueError(f'Residente com CPF {grantor_cpf} não encontrado')
    
    # Check if grantor already has an active proxy
    existing = db.collection(f'condominiums/{cond_id}/proxies')\
        .where('grantor_cpf', '==', grantor_cpf)\
        .where('status', '==', 'active').get()
    
    if len(list(existing)) > 0:
        raise ValueError('Este residente já possui uma procuração ativa')
    
    # Create proxy
    proxy_ref = db.collection(f'condominiums/{cond_id}/proxies').document()
    proxy_ref.set({
        'grantor_cpf': grantor_cpf,
        'grantee_email': grantee_email,
        'grantee_name': data.get('grantee_name'),
        'apartment': grantor.get('apartment'),
        'pdf_url': data.get('pdf_url'),
        'status': 'active',
        'valid_from': firestore.SERVER_TIMESTAMP,
        'valid_until': data.get('valid_until'),
        'created_at': firestore.SERVER_TIMESTAMP,
        'created_by': data.get('created_by')
    })
    
    # Update resident's vote permission
    from .resident_service import update_resident_vote_permission
    update_resident_vote_permission(cond_id, grantor['email'], False, grantee_email)
    
    return {'success': True, 'proxy_id': proxy_ref.id}

def get_all_proxies(cond_id):
    """Get all proxies"""
    proxies_ref = db.collection(f'condominiums/{cond_id}/proxies')
    docs = proxies_ref.stream()
    
    proxies = []
    for doc in docs:
        data = doc.to_dict()
        proxies.append({
            'id': doc.id,
            'grantor_cpf': data.get('grantor_cpf'),
            'grantee_email': data.get('grantee_email'),
            'grantee_name': data.get('grantee_name'),
            'apartment': data.get('apartment'),
            'pdf_url': data.get('pdf_url'),
            'status': data.get('status'),
            'created_at': data.get('created_at')
        })
    
    return proxies

def get_proxies_by_grantee(cond_id, grantee_email):
    """Get all proxies where grantee_email matches"""
    proxies_ref = db.collection(f'condominiums/{cond_id}/proxies')\
        .where('grantee_email', '==', grantee_email)\
        .where('status', '==', 'active')
    docs = proxies_ref.stream()
    
    proxies = []
    for doc in docs:
        data = doc.to_dict()
        proxies.append({
            'id': doc.id,
            'grantor_cpf': data.get('grantor_cpf'),
            'apartment': data.get('apartment'),
            'grantee_name': data.get('grantee_name')
        })
    
    return proxies