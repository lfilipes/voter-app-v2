"""
Processador de arquivos PDF para o módulo Admin
Versão SIMPLIFICADA - apenas validação básica do PDF
O upload e armazenamento são feitos nas rotas do admin
"""

import io
import PyPDF2


def validate_pdf(file_content):
    """
    Valida se o arquivo é um PDF válido e se tem pelo menos uma página
    
    Args:
        file_content (bytes): Conteúdo do arquivo PDF em bytes
        
    Returns:
        dict: {
            'success': bool,
            'error': str or None,
            'page_count': int
        }
    """
    try:
        # Tenta ler o PDF
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
        page_count = len(pdf_reader.pages)
        
        # Verifica se tem pelo menos uma página
        if page_count == 0:
            return {
                'success': False,
                'error': 'O PDF não contém nenhuma página',
                'page_count': 0
            }
        
        # PDF válido
        return {
            'success': True,
            'error': None,
            'page_count': page_count
        }
        
    except PyPDF2.errors.PdfReadError:
        return {
            'success': False,
            'error': 'Arquivo PDF corrompido ou inválido',
            'page_count': 0
        }
    except Exception as e:
        return {
            'success': False,
            'error': f'Erro ao ler o PDF: {str(e)}',
            'page_count': 0
        }


def get_pdf_page_count(file_content):
    """
    Retorna apenas o número de páginas do PDF
    
    Args:
        file_content (bytes): Conteúdo do arquivo PDF em bytes
        
    Returns:
        int: Número de páginas ou 0 em caso de erro
    """
    result = validate_pdf(file_content)
    return result['page_count'] if result['success'] else 0