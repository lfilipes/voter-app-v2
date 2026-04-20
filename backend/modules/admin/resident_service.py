"""
Service for managing residents (voters)
"""

from firebase_admin import firestore
import bcrypt
import re

db = firestore.client()

def hash_password(password):
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password, hashed):
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def validate_cpf(cpf):
    """Validate CPF format (11 digits)"""
    cpf_clean = re.sub(r'\D', '', str(cpf))
    return len(cpf_clean) == 11

def create_resident(cond_id, data):
    """Create a new resident in the condominium"""
    email = data.get('email', '').lower().strip()
    cpf = re.sub(r'\D', '', data.get('cpf', ''))
    
    # Validations
    if not validate_cpf(cpf):
        raise ValueError('CPF inválido')
    
    password = data.get('password')
    if not password or len(password) < 6:
        raise ValueError('Senha deve ter pelo menos 6 caracteres')
    
    # Check if already exists
    resident_ref = db.collection(f'condominiums/{cond_id}/residents').document(email)
    if resident_ref.get().exists:
        raise ValueError('Email já cadastrado')
    
    # Create resident
    resident_ref.set({
        'name': data.get('name'),
        'email': email,
        'apartment': data.get('apartment'),
        'cpf': cpf,
        'hashed_password': hash_password(password),
        'phone': data.get('phone', ''),
        'can_vote': True,  # Default True until proxy is granted
        'proxy_granted_to': None,
        'is_active': True,
        'created_at': firestore.SERVER_TIMESTAMP,
        'updated_at': firestore.SERVER_TIMESTAMP
    })
    
    return {'success': True, 'email': email}

def get_all_residents(cond_id):
    """Get all residents of a condominium"""
    residents_ref = db.collection(f'condominiums/{cond_id}/residents')
    docs = residents_ref.stream()
    
    residents = []
    for doc in docs:
        data = doc.to_dict()
        residents.append({
            'email': doc.id,
            'name': data.get('name'),
            'apartment': data.get('apartment'),
            'cpf': data.get('cpf'),
            'phone': data.get('phone'),
            'can_vote': data.get('can_vote', True),
            'proxy_granted_to': data.get('proxy_granted_to'),
            'is_active': data.get('is_active', True)
        })
    
    return residents

def get_resident_by_cpf(cond_id, cpf):
    """Find resident by CPF"""
    cpf_clean = re.sub(r'\D', '', cpf)
    residents_ref = db.collection(f'condominiums/{cond_id}/residents')
    docs = residents_ref.where('cpf', '==', cpf_clean).stream()
    
    for doc in docs:
        data = doc.to_dict()
        return {
            'email': doc.id,
            'name': data.get('name'),
            'apartment': data.get('apartment'),
            'cpf': data.get('cpf'),
            'can_vote': data.get('can_vote', True)
        }
    return None

def update_resident_vote_permission(cond_id, email, can_vote, proxy_granted_to=None):
    """Update resident's vote permission"""
    resident_ref = db.collection(f'condominiums/{cond_id}/residents').document(email)
    resident_ref.update({
        'can_vote': can_vote,
        'proxy_granted_to': proxy_granted_to,
        'updated_at': firestore.SERVER_TIMESTAMP
    })