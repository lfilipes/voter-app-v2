"""
Rotas públicas para o módulo de votação
Todas as rotas começam com /public (sem /api, pois o blueprint já tem prefixo)
"""

from flask import Blueprint, request, jsonify
from .voting_service import (
    authenticate_voter,
    get_active_assembly,
    get_voting_weight,
    register_vote
)

from firebase_admin import firestore
db = firestore.client()

# Blueprint com url_prefix vazio, pois o /api já vem do app principal
voting_bp = Blueprint('voter_routes', __name__)

#============Funções replicadas para evitar importação ============
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
#============================================

# ============================================
# ENDPOINTS PÚBLICOS (sem autenticação)
# ============================================

@voting_bp.route('/public/condominiums', methods=['GET'])
def public_condominiums():
    """Lista todos os condomínios (público)"""
#    from modules.admin.condominium_service import get_all_condominiums_public
    condominiums = get_all_condominiums_public()
    return jsonify({'success': True, 'condominiums': condominiums})

@voting_bp.route('/public/condominiums/<cond_id>/assemblies/<assembly_number>/items', methods=['GET'])
def public_assembly_items(cond_id, assembly_number):
    """Lista itens de uma assembleia (público)"""
#    from modules.admin.assembly_service import get_assembly_items
    items = get_assembly_items(cond_id, assembly_number)
    return jsonify({'success': True, 'items': items})

@voting_bp.route('/public/voter/login', methods=['POST'])
def voter_login():
    """Login do votante (email + 6 primeiros dígitos do CPF)"""
    data = request.get_json()
    result = authenticate_voter(
        data.get('condominiumId'),
        data.get('email'),
        data.get('cpfPassword')
    )
    return jsonify(result)

@voting_bp.route('/public/voter/active-assembly', methods=['GET'])
def voter_active_assembly():
    """Busca assembleia ativa para um votante"""
    condominium_id = request.args.get('condominiumId')
    voter_email = request.args.get('email')
    result = get_active_assembly(condominium_id, voter_email)
    return jsonify(result)

@voting_bp.route('/public/voter/voting-weight', methods=['GET'])
def voter_voting_weight():
    """Calcula peso do voto para um votante"""
    condominium_id = request.args.get('condominiumId')
    voter_email = request.args.get('email')
    result = get_voting_weight(condominium_id, voter_email)
    return jsonify(result)

@voting_bp.route('/public/voter/register-vote', methods=['POST'])
def voter_register_vote():
    """Registra os votos de um votante"""
    data = request.get_json()
    result = register_vote(
        data.get('condominiumId'),
        data.get('assemblyNumber'),
        data.get('voter'),
        data.get('votes'),
        data.get('votingWeight', 1)
    )
    return jsonify(result)