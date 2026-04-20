"""
Arquivo principal da aplicação Flask - Inicializa o servidor e registra os módulos
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore, storage
from config import Config
import os

# ============================================
# VERIFICAR VARIÁVEIS DE AMBIENTE (DEBUG)
# ============================================
print("=== VERIFICANDO CONFIGURAÇÕES ===")
print(f"FIREBASE_PROJECT_ID: {Config.FIREBASE_PROJECT_ID}")
print(f"FIREBASE_CLIENT_EMAIL: {Config.FIREBASE_CLIENT_EMAIL}")
print(f"FIREBASE_STORAGE_BUCKET: {Config.FIREBASE_STORAGE_BUCKET}")
print("================================")

# ============================================
# INICIALIZAÇÃO DO FIREBASE ADMIN
# ============================================
# Verificar se todas as variáveis necessárias existem
required_vars = ['FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL']
missing_vars = [var for var in required_vars if not getattr(Config, var, None)]

if missing_vars:
    raise ValueError(f"Variáveis de ambiente faltando: {', '.join(missing_vars)}")

cred_dict = {
    "type": "service_account",
    "project_id": Config.FIREBASE_PROJECT_ID,
    "private_key_id": Config.FIREBASE_PRIVATE_KEY_ID,
    "private_key": Config.FIREBASE_PRIVATE_KEY,
    "client_email": Config.FIREBASE_CLIENT_EMAIL,
    "client_id": Config.FIREBASE_CLIENT_ID,
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{Config.FIREBASE_CLIENT_EMAIL}"
}

# Inicializar credenciais Firebase
try:
    cred = credentials.Certificate(cred_dict)
    print("✅ Credenciais criadas com sucesso")
except Exception as e:
    print(f"❌ Erro ao criar credenciais: {e}")
    raise

# Inicializar Firebase
try:
    firebase_admin.initialize_app(cred, {
        'storageBucket': Config.FIREBASE_STORAGE_BUCKET
    })
    print(f"✅ Firebase inicializado com sucesso!")
    print(f"   Project ID: {Config.FIREBASE_PROJECT_ID}")
    print(f"   Storage Bucket: {Config.FIREBASE_STORAGE_BUCKET}")
except Exception as e:
    print(f"❌ Falha ao inicializar Firebase: {e}")
    raise

db = firestore.client()

# ============================================
# INICIALIZAÇÃO DO FLASK
# ============================================
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = Config.MAX_CONTENT_LENGTH

ALLOWED_ORIGINS = [
    'https://voter-app-v2.web.app',
    'https://voter-app-v2.firebaseapp.com',
    'http://localhost:3000'
]
CORS(
    app,
    resources={r"/api/*": {"origins": ALLOWED_ORIGINS}},
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
)
# ============================================
# REGISTRO DOS MÓDULOS
# ============================================
try:
    from modules.admin.admin_routes import admin_bp
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    print("✅ Blueprint admin registrado")
except Exception as e:
    print(f"❌ Erro ao registrar blueprint admin: {e}")

try:
    from modules.voting.voting_routes import voting_bp
    app.register_blueprint(voting_bp, url_prefix='/api')
    print("✅ Blueprint voting registrado")
except Exception as e:
    print(f"❌ Erro ao registrar blueprint voting: {e}")

# ============================================
# ENDPOINTS GERAIS
# ============================================

# 🔑 Critical for GAE
@app.route('/api/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    return '', 204

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Server is running'})

@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({'status': 'ok', 'message': 'API is working'})

# ============================================
# EXECUÇÃO
# ============================================

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)