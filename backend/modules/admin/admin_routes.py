"""
Admin routes - Complete redesigned API
"""

from flask import Blueprint, request, jsonify
from firebase_admin import auth, firestore
import re
import tempfile

from .condominium_service import create_condominium, get_all_condominiums, get_condominium
from .resident_service import create_resident, get_all_residents, get_resident_by_cpf
from .proxy_service import create_proxy, get_all_proxies
from .assembly_service import (
    create_assembly, add_assembly_item, get_assembly_items,
    get_all_assemblies, update_item_release_status, update_item_lock_status
)
from .excel_processor import process_voters_excel, process_assembly_items_excel
from .firestore_service import is_admin_user
from .reports_service import get_election_results, get_assembly_info, get_all_assemblies_for_report

db = firestore.client()

admin_bp = Blueprint('admin', __name__)

def verify_admin_token():
    """Verify Firebase token and admin status"""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None, jsonify({'error': 'Token ausente'}), 401
    
    token = auth_header.split('Bearer ')[1]
    try:
        decoded = auth.verify_id_token(token)
        uid = decoded.get('uid')
        
        if not is_admin_user(uid):
            return None, jsonify({'error': 'Acesso negado'}), 403
        
        return decoded, None, None
    except Exception as e:
        return None, jsonify({'error': str(e)}), 401

# ============ CONDOMINIUMS ============

@admin_bp.route('/condominiums', methods=['GET'])
def list_condominiums():
    admin, err, code = verify_admin_token()
    if err:
        return err, code
    
    condominiums = get_all_condominiums()
    return jsonify({'success': True, 'condominiums': condominiums})

@admin_bp.route('/condominiums', methods=['POST'])
def add_condominium():
    admin, err, code = verify_admin_token()
    if err:
        return err, code
    
    result = create_condominium(request.get_json())
    return jsonify(result)

@admin_bp.route('/condominiums/<cond_id>', methods=['GET'])
def get_condominium_by_id(cond_id):
    admin, err, code = verify_admin_token()
    if err:
        return err, code
    
    cond = get_condominium(cond_id)
    if not cond:
        return jsonify({'error': 'Condomínio não encontrado'}), 404
    return jsonify({'success': True, 'condominium': cond})

# ============ RESIDENTS ============

@admin_bp.route('/condominiums/<cond_id>/residents', methods=['GET'])
def list_residents(cond_id):
    admin, err, code = verify_admin_token()
    if err:
        return err, code
    
    residents = get_all_residents(cond_id)
    return jsonify({'success': True, 'residents': residents, 'count': len(residents)})

@admin_bp.route('/condominiums/<cond_id>/residents/upload', methods=['POST'])
def upload_residents_excel(cond_id):
    admin, err, code = verify_admin_token()
    if err:
        return err, code
    
    if 'file' not in request.files:
        return jsonify({'error': 'Nenhum arquivo'}), 400
    
    file = request.files['file']
    if not file.filename.endswith(('.xlsx', '.xls')):
        return jsonify({'error': 'Formato deve ser Excel'}), 400
    
    result = process_voters_excel(file.read())
    if not result['success']:
        return jsonify({'error': result['error']}), 400
    
    created = 0
    errors = []
    for resident in result['data']:
        try:
            create_resident(cond_id, resident)
            created += 1
        except Exception as e:
            errors.append(f"{resident['email']}: {str(e)}")
    
    return jsonify({
        'success': True,
        'created': created,
        'total': result['valid_rows'],
        'errors': errors,
        'warnings': result.get('errors', [])
    })

# ============ PROXIES ============

@admin_bp.route('/condominiums/<cond_id>/proxies', methods=['GET'])
def list_proxies(cond_id):
    admin, err, code = verify_admin_token()
    if err:
        return err, code
    
    proxies = get_all_proxies(cond_id)
    return jsonify({'success': True, 'proxies': proxies, 'count': len(proxies)})

@admin_bp.route('/condominiums/<cond_id>/proxies', methods=['POST'])
def add_proxy(cond_id):
    admin, err, code = verify_admin_token()
    if err:
        return err, code
    
    data = request.get_json()
    data['created_by'] = admin.get('email')
    
    try:
        result = create_proxy(cond_id, data)
        return jsonify(result)
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

# ============ Info da  assembleia ============
@admin_bp.route('/condominiums/<cond_id>/assemblies/<assembly_number>/info', methods=['GET'])
def get_assembly_info(cond_id, assembly_number):
    admin, err, code = verify_admin_token()
    if err:
        return err, code
    
    info_doc = db.collection(f'condominiums/{cond_id}/assemblies/{assembly_number}/info').document('info').get()
    if not info_doc.exists:
        return jsonify({'success': False, 'error': 'Info não encontrado'}), 404
    
    data = info_doc.to_dict()
    return jsonify({
        'success': True,
        'informative_text': data.get('informative_text', '')
    })
# ============ detalhes assembleia ============
@admin_bp.route('/condominiums/<cond_id>/assemblies/<assembly_number>', methods=['GET'])
def get_assembly_details(cond_id, assembly_number):
    admin, err, code = verify_admin_token()
    if err:
        return err, code
    
    # Busca o documento principal
    doc = db.collection(f'condominiums/{cond_id}/assemblies').document(assembly_number).get()
    if not doc.exists:
        return jsonify({'error': 'Assembleia não encontrada'}), 404
    
    data = doc.to_dict()
    
    # Busca o informative_text da subcollection info
    informative_text = ''
    info_ref = db.collection(f'condominiums/{cond_id}/assemblies/{assembly_number}/info').document('info')
    info_doc = info_ref.get()
    if info_doc.exists:
        informative_text = info_doc.to_dict().get('informative_text', '')
    
    print(f"Assembly: {assembly_number}, Informative text encontrado: {informative_text[:50] if informative_text else 'VAZIO'}")
    
    return jsonify({
        'success': True,
        'name': data.get('name'),
        'number': data.get('number'),
        'date': data.get('date'),
        'informative_text': informative_text,
        'description': data.get('description', ''),
        'status': data.get('status'),
        'created_at': data.get('created_at')
    })

#=========== Adicionar rota para criar residente =========#

@admin_bp.route('/condominiums/<cond_id>/residents', methods=['POST'])
def add_resident(cond_id):
    """Create a single resident manually"""
    admin, err, code = verify_admin_token()
    if err:
        return err, code
    
    data = request.get_json()
    try:
        result = create_resident(cond_id, data)
        return jsonify(result)
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

# ============================================
# ROTAS PARA RELATÓRIOS
# ============================================

@admin_bp.route('/condominiums/<cond_id>/assemblies', methods=['GET'])
def list_assemblies_for_report(cond_id):
    """Lista todas as assembleias para seleção de relatório"""
    admin, err, code = verify_admin_token()
    if err:
        return err, code
    
    assemblies = get_all_assemblies_for_report(cond_id)
    return jsonify({'success': True, 'assemblies': assemblies})

@admin_bp.route('/condominiums/<cond_id>/assemblies/<assembly_number>/info', methods=['GET'])
def get_assembly_info_route(cond_id, assembly_number):
    """Busca informações da assembleia"""
    admin, err, code = verify_admin_token()
    if err:
        return err, code
    
    info = get_assembly_info(cond_id, assembly_number)
    if not info:
        return jsonify({'error': 'Assembleia não encontrada'}), 404
    
    return jsonify({'success': True, 'info': info})

@admin_bp.route('/condominiums/<cond_id>/assemblies/<assembly_number>/results', methods=['GET'])
def get_election_results_route(cond_id, assembly_number):
    """Retorna os resultados da votação"""
    admin, err, code = verify_admin_token()
    if err:
        return err, code
    
    results = get_election_results(cond_id, assembly_number)
    return jsonify(results)


@admin_bp.route('/condominiums/<cond_id>/assemblies/<assembly_number>/votes/detailed', methods=['GET'])
def get_detailed_votes_route(cond_id, assembly_number):
    """Retorna votos detalhados por item para exibição em tabela"""
    admin, err, code = verify_admin_token()
    if err:
        return err, code
    
    from .reports_service import get_votes_by_item
    votes_by_item = get_votes_by_item(cond_id, assembly_number)
    
    return jsonify({
        'success': True,
        'votes_by_item': votes_by_item
    })

# ============ ASSEMBLIES ============

@admin_bp.route('/condominiums/<cond_id>/assemblies', methods=['GET'])
def list_assemblies(cond_id):
    admin, err, code = verify_admin_token()
    if err:
        return err, code
    
    assemblies = get_all_assemblies(cond_id)
    return jsonify({'success': True, 'assemblies': assemblies})

@admin_bp.route('/condominiums/<cond_id>/assemblies', methods=['POST'])
def create_assembly_endpoint(cond_id):
    admin, err, code = verify_admin_token()
    if err:
        return err, code
    
    data = request.get_json()
    data['created_by'] = admin.get('email')
    
    result = create_assembly(cond_id, data)
    return jsonify(result)

@admin_bp.route('/condominiums/<cond_id>/assemblies/<assembly_number>/items', methods=['GET'])
def get_items(cond_id, assembly_number):
    admin, err, code = verify_admin_token()
    if err:
        return err, code
    
    items = get_assembly_items(cond_id, assembly_number)
    return jsonify({'success': True, 'items': items})

@admin_bp.route('/condominiums/<cond_id>/assemblies/<assembly_number>/items', methods=['POST'])
def add_item(cond_id, assembly_number):
    admin, err, code = verify_admin_token()
    if err:
        return err, code
    
    result = add_assembly_item(cond_id, assembly_number, request.get_json())
    return jsonify(result)

@admin_bp.route('/condominiums/<cond_id>/assemblies/<assembly_number>/items/<item_id>/release', methods=['PUT'])
def release_item(cond_id, assembly_number, item_id):
    admin, err, code = verify_admin_token()
    if err:
        return err, code
    
    is_released = request.get_json().get('is_released', False)
    update_item_release_status(cond_id, assembly_number, item_id, is_released)
    return jsonify({'success': True})

@admin_bp.route('/condominiums/<cond_id>/assemblies/<assembly_number>/items/<item_id>/lock', methods=['PUT'])
def lock_item(cond_id, assembly_number, item_id):
    admin, err, code = verify_admin_token()
    if err:
        return err, code
    
    is_locked = request.get_json().get('is_locked', False)
    update_item_lock_status(cond_id, assembly_number, item_id, is_locked)
    return jsonify({'success': True})

# delete assembly item
@admin_bp.route('/condominiums/<cond_id>/assemblies/<assembly_number>/items/<item_id>', methods=['DELETE'])
def delete_assembly_item_route(cond_id, assembly_number, item_id):
    """Deleta um item de votação"""
    admin, err, code = verify_admin_token()
    if err:
        return err, code
    
    from .assembly_service import delete_assembly_item
    result = delete_assembly_item(cond_id, assembly_number, item_id)
    
    if result['success']:
        return jsonify({'success': True, 'message': 'Item removido com sucesso'})
    else:
        return jsonify({'error': result.get('error', 'Erro ao remover item')}), 400

@admin_bp.route('/condominiums/<cond_id>/assemblies/<assembly_number>/start', methods=['POST'])
def start_assembly_route(cond_id, assembly_number):
    """Inicia uma assembleia (ativa para votação)"""
    admin, err, code = verify_admin_token()
    if err:
        return err, code
    
    from .assembly_service import start_assembly
    result = start_assembly(cond_id, assembly_number)
    return jsonify(result)

@admin_bp.route('/condominiums/<cond_id>/assemblies/<assembly_number>/close', methods=['POST'])
def close_assembly_route(cond_id, assembly_number):
    """Encerra uma assembleia (resultados disponíveis)"""
    admin, err, code = verify_admin_token()
    if err:
        return err, code
    
    from .assembly_service import close_assembly
    result = close_assembly(cond_id, assembly_number)
    return jsonify(result)

@admin_bp.route('/condominiums/<cond_id>/assemblies/<assembly_number>/status', methods=['GET'])
def get_assembly_status_route(cond_id, assembly_number):
    """Retorna o status da assembleia"""
    admin, err, code = verify_admin_token()
    if err:
        return err, code
    
    from .assembly_service import get_assembly_status
    result = get_assembly_status(cond_id, assembly_number)
    if not result:
        return jsonify({'error': 'Assembleia não encontrada'}), 404
    return jsonify(result)

@admin_bp.route('/condominiums/<cond_id>/assemblies/<assembly_number>/activate', methods=['POST'])
def activate_assembly_route(cond_id, assembly_number):
    """Ativa uma assembleia e desativa todas as outras"""
    admin, err, code = verify_admin_token()
    if err:
        return err, code
    
    from .assembly_service import activate_assembly
    result = activate_assembly(cond_id, assembly_number)
    return jsonify(result)

@admin_bp.route('/condominiums/<cond_id>/assemblies/<assembly_number>/deactivate', methods=['POST'])
def deactivate_assembly_route(cond_id, assembly_number):
    """Desativa uma assembleia"""
    admin, err, code = verify_admin_token()
    if err:
        return err, code
    
    from .assembly_service import deactivate_assembly
    result = deactivate_assembly(cond_id, assembly_number)
    return jsonify(result)


@admin_bp.route('/condominiums/<cond_id>/assemblies/upload-excel', methods=['POST'])
def upload_assembly_excel(cond_id):
    admin, err, code = verify_admin_token()
    if err:
        return err, code
    
    if 'file' not in request.files:
        return jsonify({'error': 'Nenhum arquivo'}), 400
    
    file = request.files['file']
    assembly_name = request.form.get('assembly_name')
    assembly_number = request.form.get('assembly_number')
    assembly_date = request.form.get('assembly_date')
    
    if not assembly_number:
        return jsonify({'error': 'Número da votação é obrigatório'}), 400
    
    result = process_assembly_items_excel(file.read())
    if not result['success']:
        return jsonify({'error': result['error']}), 400
 
    # Create assembly
    create_assembly(cond_id, {
        'name': assembly_name,
        'number': assembly_number,
        'date': assembly_date,
        'informative_text': result['informative_text'],
        'description': result['informative_text'][:200],
        'created_by': admin.get('email')
    })
    
    # Add items
    for item in result['items']:
        add_assembly_item(cond_id, assembly_number, item)
    
    return jsonify({
        'success': True,
        'message': f'Assembleia criada com {result["total_items"]} itens',
        'items': result['items']
    })