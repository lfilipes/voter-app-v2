"""
Módulo de configuração central
Todas as variáveis de ambiente e configurações globais ficam aqui
"""

import os
from dotenv import load_dotenv

# Carrega variáveis do arquivo .env
load_dotenv()

class Config:
    """Configurações principais da aplicação"""
    
    # Firebase Admin SDK - Credenciais (via variáveis de ambiente)
    FIREBASE_PROJECT_ID = os.environ.get('FIREBASE_PROJECT_ID')
    FIREBASE_PRIVATE_KEY_ID = os.environ.get('FIREBASE_PRIVATE_KEY_ID')
    FIREBASE_PRIVATE_KEY = os.environ.get('FIREBASE_PRIVATE_KEY', '').replace('\\n', '\n')
    FIREBASE_CLIENT_EMAIL = os.environ.get('FIREBASE_CLIENT_EMAIL')
    FIREBASE_CLIENT_ID = os.environ.get('FIREBASE_CLIENT_ID')
    
    # Firebase Storage bucket (NOME CORRETO DO BUCKET)
    # O formato é: SEU_PROJECT_ID.firebasestorage.app
    # Ou para projetos mais antigos: SEU_PROJECT_ID.appspot.com
    FIREBASE_STORAGE_BUCKET = os.environ.get('FIREBASE_STORAGE_BUCKET', f"{FIREBASE_PROJECT_ID}.firebasestorage.app")
    
    # Configurações de upload
    # UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', '/tmp/uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max
    
    # Collections do Firestore
    COLLECTIONS = {
        'elections': 'elections',
        'proxies': 'proxies',
        'voters': 'voters',
        'admin_users': 'admin_users'
    }