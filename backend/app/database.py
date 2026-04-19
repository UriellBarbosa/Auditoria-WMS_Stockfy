import httpx
from app.config import SUPABASE_URL, SUPABASE_SERVICE_KEY

# Headers padrão para todas as requisições ao Supabase
# A Service Role Key vai aqui — nunca no frontend
HEADERS = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

async def insert_analysis(data: dict) -> dict:
    """
    Insere uma análise na tabela analyses.
    Retorna o registro criado com o ID gerado pelo banco.
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SUPABASE_URL}/rest/v1/analyses",
            headers=HEADERS,
            json=data
        )
        response.raise_for_status()
        return response.json()[0]

async def insert_findings(findings: list) -> None:
    """
    Insere as operações suspeitas na tabela analysis_findings.
    Recebe uma lista de operações e insere todas de uma vez.
    """
    if not findings:
        return

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SUPABASE_URL}/rest/v1/analysis_findings",
            headers=HEADERS,
            json=findings
        )
        response.raise_for_status()

async def insert_progress(data: dict) -> None:
    """
    Insere um registro de progresso na tabela analysis_progress.
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SUPABASE_URL}/rest/v1/analysis_progress",
            headers=HEADERS,
            json=data
        )
        response.raise_for_status()

async def get_previous_analysis(company_id: str, produto_codigo: str) -> dict | None:
    """
    Busca a análise mais recente do mesmo produto para comparar progresso.
    Retorna None se for a primeira análise.
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SUPABASE_URL}/rest/v1/analysis_progress",
            headers=HEADERS,
            params={
                "company_id": f"eq.{company_id}",
                "produto_codigo": f"eq.{produto_codigo}",
                "order": "created_at.desc",
                "limit": "1"
            }
        )
        response.raise_for_status()
        data = response.json()
        return data[0] if data else None

async def update_analysis_recommendation(analysis_id: str, recomendacao: str) -> None:
    """
    Atualiza a análise com a recomendação gerada pela IA.
    """
    async with httpx.AsyncClient() as client:
        response = await client.patch(
            f"{SUPABASE_URL}/rest/v1/analyses",
            headers=HEADERS,
            params={"id": f"eq.{analysis_id}"},
            json={"recomendacao_ia": recomendacao}
        )
        response.raise_for_status()