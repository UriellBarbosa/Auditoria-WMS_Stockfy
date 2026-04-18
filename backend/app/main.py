from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from io import BytesIO
import pandas as pd
from app.analyzer import analisar_relatorio

# ── Instância da aplicação ──
app = FastAPI(
    title="WMS Modular API",
    description="Backend do sistema WMS Modular",
    version="1.0.0"
)

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "https://wmsmodular.netlify.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Endpoint de saúde ──
@app.get("/health")
def health_check():
    return {
        "status": "online",
        "version": "1.0.0"
    }

# ── Endpoint de análise de relatório ──
@app.post("/analyze")
async def analyze_report(file: UploadFile = File(...)):
    """
    Recebe um arquivo Excel (.xlsx) com o relatório de movimentações
    do Stockfy e retorna a análise de divergências.
    """

    # ── 1. Valida o tipo do arquivo ──
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=400,
            detail="Arquivo inválido. Envie um arquivo Excel (.xlsx ou .xls)"
        )

    # ── 2. Lê o conteúdo do arquivo em memória ──
    conteudo = await file.read()

    # ── 3. Tenta processar o arquivo ──
    try:
        # BytesIO cria um arquivo virtual na memória
        # para o Pandas conseguir ler sem salvar em disco
        arquivo_virtual = BytesIO(conteudo)
        df = pd.read_excel(arquivo_virtual)

    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"Erro ao ler o arquivo Excel: {str(e)}"
        )

    # ── 4. Verifica se o arquivo tem dados ──
    if df.empty:
        raise HTTPException(
            status_code=422,
            detail="O arquivo está vazio."
        )

    # ── 5. Chama o motor de análise ──
    resultado = analisar_relatorio(df)

    # ── 6. Verifica se a análise foi bem sucedida ──
    if not resultado.get("sucesso"):
        raise HTTPException(
            status_code=422,
            detail=resultado.get("erro", "Erro desconhecido na análise.")
        )

    return resultado