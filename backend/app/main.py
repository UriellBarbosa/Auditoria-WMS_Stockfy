# Importações — traz as ferramentas que vamos usar
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Cria a instância da aplicação
# É aqui que o FastAPI "liga"
app = FastAPI(
    title="WMS Modular API",
    description="Backend do sistema WMS Modular",
    version="1.0.0"
)

# Configura o CORS
# Define quais frontends têm permissão para falar com esse backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",        # Live Server local
        "https://wmsmodular.netlify.app" # Produção
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos os verbos HTTP (GET, POST, etc)
    allow_headers=["*"],  # Permite todos os cabeçalhos
)

# Endpoint de teste — verifica se o backend está rodando
# GET /health → retorna status da API
@app.get("/health")
def health_check():
    return {
        "status": "online",
        "version": "1.0.0"
    }