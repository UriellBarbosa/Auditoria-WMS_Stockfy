from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from io import BytesIO
import pandas as pd
from app.analyzer import analisar_relatorio
from app.database import (
    insert_analysis,
    insert_findings,
    insert_progress,
    get_previous_analysis,
    update_analysis_recommendation
)
from app.ai import gerar_recomendacao

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

# ── Endpoint de análise ──
@app.post("/analyze")
async def analyze_report(
    file: UploadFile = File(...),
    company_id: str = None,
    user_id: str = None
):
    """
    Recebe um arquivo Excel, processa, salva no banco e retorna a análise.
    """

    # ── 1. Valida o arquivo ──
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=400,
            detail="Arquivo inválido. Envie um arquivo Excel (.xlsx ou .xls)"
        )

    # ── 2. Lê o arquivo ──
    conteudo = await file.read()

    try:
        arquivo_virtual = BytesIO(conteudo)
        df = pd.read_excel(arquivo_virtual)
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"Erro ao ler o arquivo Excel: {str(e)}"
        )

    if df.empty:
        raise HTTPException(
            status_code=422,
            detail="O arquivo está vazio."
        )

    # ── 3. Processa a análise ──
    resultado = analisar_relatorio(df)

    if not resultado.get("sucesso"):
        raise HTTPException(
            status_code=422,
            detail=resultado.get("erro", "Erro desconhecido na análise.")
        )

    # ── 4. Salva no banco (só se company_id e user_id foram fornecidos) ──
    analysis_id = None

    if company_id and user_id:
        try:
            resumo = resultado["resumo"]
            produto = resultado["produto"]

            # ── 4.1 Busca análise anterior para calcular tendência ──
            anterior = await get_previous_analysis(company_id, produto["codigo"])

            tendencia = "primeira_analise"
            if anterior:
                if resumo["total_suspeitas"] < anterior["total_suspeitas"]:
                    tendencia = "melhora"
                elif resumo["total_suspeitas"] > anterior["total_suspeitas"]:
                    tendencia = "piora"
                else:
                    tendencia = "estavel"

            # ── 4.2 Salva a análise principal ──
            analysis = await insert_analysis({
                "company_id": company_id,
                "created_by": user_id,
                "produto_codigo": produto["codigo"],
                "produto_nome": produto["nome"],
                "total_movimentacoes": resumo["total_movimentacoes"],
                "total_suspeitas": resumo["total_suspeitas"],
                "percentual_suspeitas": resumo["percentual_suspeitas"],
                "impacto_total_saldo": resumo["impacto_total_saldo"],
                "total_adicionado": resumo["total_adicionado_stock_locator"],
                "total_retirado": abs(resumo["total_retirado_stock_locator"]),
                "usuarios_envolvidos": resumo["usuarios_envolvidos"],
            })

            analysis_id = analysis["id"]

            # ── 4.3 Salva as operações suspeitas ──
            findings = [
                {
                    "analysis_id": analysis_id,
                    "company_id": company_id,
                    "data_operacao": op["data"],
                    "usuario": op["usuario"],
                    "mensagem": op["mensagem"],
                    "quantidade": op["quantidade"],
                    "saldo_produto_apos": op["saldo_produto_apos"],
                    "endereco": op.get("endereco"),
                }
                for op in resultado["operacoes_suspeitas"]
            ]

            await insert_findings(findings)

            # ── 4.4 Salva o progresso ──
            await insert_progress({
                "company_id": company_id,
                "produto_codigo": produto["codigo"],
                "analysis_id": analysis_id,
                "total_suspeitas": resumo["total_suspeitas"],
                "impacto_total_saldo": resumo["impacto_total_saldo"],
                "usuarios_envolvidos": resumo["usuarios_envolvidos"],
                "tendencia": tendencia,
            })

            # ── 4.5 Gera recomendação com IA ──
            recomendacao = await gerar_recomendacao(resultado)

            # ── 4.6 Atualiza a análise com a recomendação ──
            await update_analysis_recommendation(analysis_id, recomendacao)

        except Exception as e:
            # Se falhar ao salvar, ainda retorna o resultado da análise
            # O usuário não perde o trabalho — só o histórico não é salvo
            print(f"Erro ao salvar no banco: {e}")

    # ── 5. Retorna o resultado ──
    return {
        **resultado,
        "analysis_id": analysis_id,
        "saved": analysis_id is not None
    }