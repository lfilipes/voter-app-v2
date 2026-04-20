"""
Rotas para gerenciamento de itens de votação
"""

from flask import Blueprint, request, jsonify
from firebase_admin import auth
from .voting_items_service import (
    save_voting_items, get_voting_items_by_election, 
    get_all_voting_items, delete_voting_items_by_election,
    validate_election_exists
)
from .excel_items_processor import process_voting_items_excel
from .firestore_service import is_admin_user

voting_bp = Blueprint('voting', __name__)

# ============================================
# FUNÇÃO AUXILIAR - VERIFICA TOKEN ADMIN
# ============================================

def verify_admin_token():
    """Verifica o token Firebase e se o usuário é admin"""
    auth_header = request.headers.get('Authorization', '')
    
    if not auth_header.startswith('Bearer '):
        return None, jsonify({'error': 'Token de autenticação ausente'}), 401
    
    token = auth_header.split('Bearer ')[1]
    
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token.get('uid')
        
        if not is_admin_user(uid):
            return None, jsonify({'error': 'Acesso negado. Apenas administradores.'}), 403
        
        return decoded_token, None, None
        
    except Exception as e:
        return None, jsonify({'error': f'Token inválido: {str(e)}'}), 401

# ============================================
# ROTAS
# ============================================

@voting_bp.route('/create-items', methods=['POST'])
def create_voting_items():
    """
    Cria os itens de votação para uma assembleia
    Recebe: election_number, election_name, informative_text, items
    """
    # Verifica autenticação
    admin_user, error_response, status_code = verify_admin_token()
    if error_response:
        return error_response, status_code
    
    data = request.get_json()
    
    election_number = data.get('election_number', '').strip()
    election_name = data.get('election_name', '').strip()
    informative_text = data.get('informative_text', '').strip()
    items = data.get('items', [])
    
    # Validações
    if not election_number:
        return jsonify({'error': 'Número da votação é obrigatório'}), 400
    
    if not election_name:
        return jsonify({'error': 'Nome da votação é obrigatório'}), 400
    
    if not informative_text:
        return jsonify({'error': 'Informativo é obrigatório'}), 400
    
    if not items or len(items) == 0:
        return jsonify({'error': 'Pelo menos um item deve ser cadastrado'}), 400
    
    if len(items) > 10:
        return jsonify({'error': 'Máximo de 10 itens permitidos'}), 400
    
    # Verifica se a votação existe na coleção de votantes
    if not validate_election_exists(election_number):
        return jsonify({'error': f'Votação {election_number} não encontrada no cadastro de votantes'}), 400
    
    # Salva os itens
    result = save_voting_items(election_number, election_name, informative_text, items)
    
    return jsonify({
        'success': True,
        'message': f'Itens de votação cadastrados com sucesso para {election_name}',
        'data': result
    }), 200

@voting_bp.route('/upload-excel', methods=['POST'])
def upload_voting_items_excel():
    """
    Upload de Excel com informativo e itens de votação
    """
    # Verifica autenticação
    admin_user, error_response, status_code = verify_admin_token()
    if error_response:
        return error_response, status_code
    
    # Verifica se o arquivo foi enviado
    if 'file' not in request.files:
        return jsonify({'error': 'Nenhum arquivo enviado'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Nenhum arquivo selecionado'}), 400
    
    # Verifica extensão
    if not file.filename.endswith(('.xlsx', '.xls')):
        return jsonify({'error': 'Arquivo deve ser Excel (.xlsx ou .xls)'}), 400
    
    # Obtém dados da votação
    election_number = request.form.get('election_number', '').strip()
    election_name = request.form.get('election_name', '').strip()
    
    if not election_number:
        return jsonify({'error': 'Número da votação é obrigatório'}), 400
    
    if not election_name:
        return jsonify({'error': 'Nome da votação é obrigatório'}), 400
    
    # Verifica se a votação existe
    if not validate_election_exists(election_number):
        return jsonify({'error': f'Votação {election_number} não encontrada no cadastro de votantes'}), 400
    
    # Processa o Excel
    file_content = file.read()
    result = process_voting_items_excel(file_content)
    
    if not result['success']:
        return jsonify({'error': result['error']}), 400
    
    # Salva os itens
    save_result = save_voting_items(
        election_number, 
        election_name, 
        result['informative_text'], 
        result['items']
    )
    
    return jsonify({
        'success': True,
        'message': f'Itens de votação cadastrados com sucesso para {election_name}',
        'informative_text': result['informative_text'],
        'items': result['items'],
        'total_items': result['total_items'],
        'save_result': save_result
    }), 200

@voting_bp.route('/items/<election_number>', methods=['GET'])
def get_voting_items(election_number):
    """
    Retorna os itens de votação de uma eleição
    """
    # Verifica autenticação
    admin_user, error_response, status_code = verify_admin_token()
    if error_response:
        return error_response, status_code
    
    items = get_voting_items_by_election(election_number)
    
    if not items:
        return jsonify({
            'success': False,
            'error': f'Nenhum item encontrado para a votação {election_number}'
        }), 404
    
    return jsonify({
        'success': True,
        'data': items
    }), 200

@voting_bp.route('/all', methods=['GET'])
def get_all_voting_items_list():
    """
    Retorna todas as votações que têm itens cadastrados
    """
    # Verifica autenticação
    admin_user, error_response, status_code = verify_admin_token()
    if error_response:
        return error_response, status_code
    
    elections = get_all_voting_items()
    
    return jsonify({
        'success': True,
        'elections': elections,
        'count': len(elections)
    }), 200

@voting_bp.route('/items/<election_number>', methods=['DELETE'])
def delete_voting_items(election_number):
    """
    Deleta todos os itens de votação de uma eleição
    """
    # Verifica autenticação
    admin_user, error_response, status_code = verify_admin_token()
    if error_response:
        return error_response, status_code
    
    delete_voting_items_by_election(election_number)
    
    return jsonify({
        'success': True,
        'message': f'Itens da votação {election_number} deletados com sucesso'
    }), 200