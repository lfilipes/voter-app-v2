"""
Excel processor for voters and assembly items
"""

import pandas as pd
import io
import re

def validar_cpf(cpf):
    """Validate CPF (11 digits)"""
    cpf_clean = re.sub(r'\D', '', str(cpf))
    return len(cpf_clean) == 11

def process_voters_excel(file_content):
    """
    Process Excel with voters
    Columns: nome, email, apartamento, cpf
    """
    try:
        df = pd.read_excel(io.BytesIO(file_content))
        
        required_columns = ['nome', 'email', 'apartamento', 'cpf']
        missing = [col for col in required_columns if col not in df.columns]
        
        if missing:
            return {
                'success': False,
                'error': f'Colunas obrigatórias ausentes: {", ".join(missing)}'
            }
        
        residents = []
        errors = []
        
        for idx, row in df.iterrows():
            cpf_clean = re.sub(r'\D', '', str(row['cpf']))
            
            if not validar_cpf(cpf_clean):
                errors.append(f"Linha {idx+2}: CPF inválido")
                continue
            
            email = str(row['email']).lower().strip()
            if '@' not in email:
                errors.append(f"Linha {idx+2}: Email inválido")
                continue
            
            residents.append({
                'name': str(row['nome']).strip(),
                'email': email,
                'apartment': str(row['apartamento']).strip(),
                'cpf': cpf_clean,
                'password': cpf_clean  # Default password = CPF (can be changed later)
            })
        
        return {
            'success': True,
            'data': residents,
            'total_rows': len(df),
            'valid_rows': len(residents),
            'errors': errors
        }
        
    except Exception as e:
        return {'success': False, 'error': f'Erro ao processar Excel: {str(e)}'}

def process_assembly_items_excel(file_content):
    """
    Process Excel with assembly items
    Expected format:
    Row 1: Headers (ignored)
    Row 2: Column 1 = informative_text, Columns 2-11 = items
    """
    try:
        df = pd.read_excel(io.BytesIO(file_content), header=None)
        
        if len(df) < 2:
            return {
                'success': False,
                'error': 'Arquivo deve ter pelo menos 2 linhas'
            }
        
        data_row = df.iloc[1]
        informative_text = str(data_row.iloc[0]) if pd.notna(data_row.iloc[0]) else ""
        
        if not informative_text or informative_text == 'nan':
            return {
                'success': False,
                'error': 'Primeira coluna (informativo) não pode estar vazia'
            }
        
        items = []
        for i in range(1, 11):
            value = data_row.iloc[i] if i < len(data_row) else None
            if pd.notna(value) and str(value).strip() and str(value) != 'nan':
                items.append({
                    'order': len(items) + 1,
                    'title': f"Item {len(items) + 1}",
                    'description': str(value).strip(),
                    'type': 'approve_reject'
                })
        
        if not items:
            return {
                'success': False,
                'error': 'Nenhum item encontrado nas colunas 2 a 11'
            }
        
        return {
            'success': True,
            'informative_text': informative_text,
            'items': items,
            'total_items': len(items)
        }
        
    except Exception as e:
        return {'success': False, 'error': f'Erro ao processar Excel: {str(e)}'}