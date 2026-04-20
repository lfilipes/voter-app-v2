"""
Processador de arquivos Excel para itens de votação
Lê planilha com informativo e itens a serem votados
"""

import pandas as pd
import io
import re

def process_voting_items_excel(file_content):
    """
    Processa um arquivo Excel com o informativo e itens de votação
    
    O Excel deve ter:
    - Linha 1: Cabeçalho (pode ser ignorado)
    - Linha 2: Coluna 1 = Informativo, Colunas 2 a 11 = Itens a serem votados
    
    Retorna:
    - success: booleano
    - informative_text: texto informativo
    - items: lista de itens
    - error: mensagem de erro
    """
    try:
        # Lê o Excel
        df = pd.read_excel(io.BytesIO(file_content), header=None)
        
        if len(df) < 2:
            return {
                'success': False,
                'error': 'O arquivo deve ter pelo menos 2 linhas (cabeçalho e dados)',
                'informative_text': None,
                'items': []
            }
        
        # A primeira linha é o cabeçalho (ignoramos)
        # A segunda linha contém os dados
        data_row = df.iloc[1]
        
        # Coluna 0: Informativo
        informative_text = str(data_row.iloc[0]) if pd.notna(data_row.iloc[0]) else ""
        
        if not informative_text or informative_text == 'nan':
            return {
                'success': False,
                'error': 'A primeira coluna (informativo) não pode estar vazia',
                'informative_text': None,
                'items': []
            }
        
        # Colunas 1 a 10: Itens (até 10 itens)
        items = []
        for i in range(1, 11):  # Colunas 1 a 10 (índices 1 a 10)
            item_value = data_row.iloc[i] if i < len(data_row) else None
            if pd.notna(item_value) and str(item_value).strip() and str(item_value) != 'nan':
                items.append({
                    'item_number': i,
                    'description': str(item_value).strip()
                })
        
        if len(items) == 0:
            return {
                'success': False,
                'error': 'Nenhum item válido encontrado. Preencha pelo menos um item nas colunas 2 a 11',
                'informative_text': None,
                'items': []
            }
        
        return {
            'success': True,
            'informative_text': informative_text,
            'items': items,
            'total_items': len(items),
            'error': None
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': f'Erro ao processar Excel: {str(e)}',
            'informative_text': None,
            'items': []
        }

def validate_excel_format(file_content):
    """
    Valida o formato do arquivo Excel
    """
    try:
        df = pd.read_excel(io.BytesIO(file_content), header=None)
        return {
            'success': True,
            'rows': len(df),
            'cols': len(df.columns) if len(df) > 0 else 0
        }
    except Exception as e:
        return {
            'success': False,
            'error': f'Formato de arquivo inválido: {str(e)}'
        }