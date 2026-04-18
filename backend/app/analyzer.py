import pandas as pd
import re
from datetime import datetime

# ── Padrões de operações NORMAIS ──
# re.IGNORECASE faz a busca ignorar maiúsculas/minúsculas
PADROES_NORMAIS = [
    re.compile(r"Separação da saida", re.IGNORECASE),
    re.compile(r"Finalização do volume", re.IGNORECASE),
    re.compile(r"Movimentação Coleta", re.IGNORECASE),
    re.compile(r"Movimentação Entrega", re.IGNORECASE),
    re.compile(r"Reabastecimento Coleta", re.IGNORECASE),
    re.compile(r"Reabastecimento Entrega", re.IGNORECASE),
    re.compile(r"Ajuste saldo de estoque", re.IGNORECASE),
    re.compile(r"Ajuste divergencia de estoque", re.IGNORECASE),
    re.compile(r"Migração inicial de estoque", re.IGNORECASE),
    re.compile(r"Movimentação entre endereços solicitado", re.IGNORECASE),
    re.compile(r"Volta da saída", re.IGNORECASE),
    re.compile(r"Remover de estoque", re.IGNORECASE),
    re.compile(r"Inserir de estoque", re.IGNORECASE),
    re.compile(r"Cancelamento da saida", re.IGNORECASE),
]

# ── Padrões de operações SUSPEITAS (Stock Locator) ──
PADROES_SUSPEITOS = [
    re.compile(r"stock.?locator", re.IGNORECASE),
]

def classificar_operacao(mensagem: str) -> str:
    """
    Classifica uma mensagem de movimentação em três categorias:
    - "normal"   → operação esperada do dia a dia
    - "suspeita" → Stock Locator identificado
    - "unknown"  → operação desconhecida (novo padrão não mapeado)
    """
    if not mensagem or pd.isna(mensagem):
        return "unknown"

    mensagem_str = str(mensagem)

    # Verifica primeiro se é suspeita
    # (tem prioridade sobre qualquer outro padrão)
    for padrao in PADROES_SUSPEITOS:
        if padrao.search(mensagem_str):
            return "suspeita"

    # Verifica se é normal
    for padrao in PADROES_NORMAIS:
        if padrao.search(mensagem_str):
            return "normal"

    # Se não bateu com nenhum padrão conhecido
    return "unknown"


def analisar_relatorio(df: pd.DataFrame) -> dict:
    """
    Recebe um DataFrame com os dados do relatório e retorna
    um dicionário com a análise completa.
    """

    # ── 1. Normaliza os nomes das colunas ──
    df.columns = df.columns.str.strip().str.lower()

    # ── 2. Verifica colunas necessárias ──
    colunas_necessarias = [
        "datahoramovimentacao",
        "usuario",
        "mensagem",
        "quantidade",
        "saldoproduto",
        "produtocodigo",
        "produto"
    ]

    colunas_faltando = [c for c in colunas_necessarias if c not in df.columns]

    if colunas_faltando:
        return {
            "sucesso": False,
            "erro": f"Colunas não encontradas: {', '.join(colunas_faltando)}"
        }

    # ── 3. Converte data e ordena ──
    df["datahoramovimentacao"] = pd.to_datetime(
        df["datahoramovimentacao"], errors="coerce"
    )
    df = df.sort_values("datahoramovimentacao", ascending=True)

    # ── 4. Classifica cada operação ──
    df["classificacao"] = df["mensagem"].apply(classificar_operacao)

    # ── 5. Separa por classificação ──
    suspeitas = df[df["classificacao"] == "suspeita"].copy()
    unknowns = df[df["classificacao"] == "unknown"].copy()

    # ── 6. Calcula impacto total do Stock Locator ──
    # Separa adições e retiradas
    adicoes = suspeitas[suspeitas["quantidade"] > 0]
    retiradas = suspeitas[suspeitas["quantidade"] < 0]

    impacto_total = int(suspeitas["quantidade"].sum()) if not suspeitas.empty else 0
    total_adicionado = int(adicoes["quantidade"].sum()) if not adicoes.empty else 0
    total_retirado = int(retiradas["quantidade"].sum()) if not retiradas.empty else 0

    # ── 7. Primeira ocorrência suspeita ──
    primeira_suspeita = None
    if not suspeitas.empty:
        data = suspeitas.iloc[0]["datahoramovimentacao"]
        if pd.notna(data):
            primeira_suspeita = data.strftime("%d/%m/%Y %H:%M")

    # ── 8. Ranking de usuários que usaram Stock Locator ──
    ranking_usuarios = []
    if not suspeitas.empty:
        ranking_usuarios = (
            suspeitas.groupby("usuario")
            .agg(
                total_operacoes=("quantidade", "count"),
                total_adicionado=("quantidade", lambda x: int(x[x > 0].sum())),
                total_retirado=("quantidade", lambda x: int(x[x < 0].sum())),
            )
            .reset_index()
            .sort_values("total_operacoes", ascending=False)
            .to_dict(orient="records")
        )

    # ── 9. Lista detalhada das operações suspeitas ──
    lista_suspeitas = []
    for _, row in suspeitas.iterrows():
        data = row["datahoramovimentacao"]
        lista_suspeitas.append({
            "data": data.isoformat() if pd.notna(data) else None,
            "usuario": str(row["usuario"]).strip(),
            "mensagem": str(row["mensagem"]).strip(),
            "quantidade": int(row["quantidade"]) if pd.notna(row["quantidade"]) else 0,
            "saldo_produto_apos": int(row["saldoproduto"]) if pd.notna(row["saldoproduto"]) else 0,
            "endereco": str(row.get("endereco", "-")).strip(),
        })

    # ── 10. Operações desconhecidas ──
    # Útil para identificar novos padrões não mapeados
    lista_unknowns = []
    if not unknowns.empty:
        mensagens_unicas = unknowns["mensagem"].unique().tolist()
        lista_unknowns = [str(m) for m in mensagens_unicas[:20]]

    # ── 11. Retorna resultado completo ──
    return {
        "sucesso": True,
        "produto": {
            "codigo": str(df["produtocodigo"].iloc[0]),
            "nome": str(df["produto"].iloc[0]),
        },
        "resumo": {
            "total_movimentacoes": len(df),
            "total_suspeitas": len(suspeitas),
            "percentual_suspeitas": round(
                (len(suspeitas) / len(df)) * 100, 1
            ) if len(df) > 0 else 0,
            "impacto_total_saldo": impacto_total,
            "total_adicionado_stock_locator": total_adicionado,
            "total_retirado_stock_locator": total_retirado,
            "primeira_ocorrencia": primeira_suspeita,
            "usuarios_envolvidos": len(ranking_usuarios),
        },
        "ranking_usuarios": ranking_usuarios,
        "operacoes_suspeitas": lista_suspeitas,
        "operacoes_desconhecidas": lista_unknowns,
    }