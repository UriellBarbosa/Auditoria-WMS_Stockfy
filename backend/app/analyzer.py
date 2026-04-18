# Importações
import pandas as pd
import re
from datetime import datetime

# Padrões de operações normais do Stockfy
# re.compile() cria um padrão de texto que pode ser reutilizado
PADROES_NORMAIS = [
    re.compile(r"Separação da saida:\s*\d+", re.IGNORECASE),
    re.compile(r"Finalização do volume \d+ da saída \d+", re.IGNORECASE),
    re.compile(r"Recebimento", re.IGNORECASE),
]

def is_operacao_normal(mensagem: str) -> bool:
    """
    Verifica se uma mensagem de movimentação é uma operação normal.
    Retorna True se for normal, False se for suspeita.
    """
    # Se a mensagem estiver vazia, considera suspeita
    if not mensagem or pd.isna(mensagem):
        return False
    
    # Verifica se a mensagem bate com algum padrão normal
    for padrao in PADROES_NORMAIS:
        if padrao.search(str(mensagem)):
            return True
    
    # Se não bateu com nenhum padrão, é suspeita
    return False


def analisar_relatorio(df: pd.DataFrame) -> dict:
    """
    Recebe um DataFrame com os dados do relatório e retorna
    um dicionário com a análise completa.
    """

    # ── 1. Normaliza os nomes das colunas ──
    # Remove espaços extras e converte para minúsculas
    # para evitar problemas com nomes de colunas diferentes
    df.columns = df.columns.str.strip().str.lower()

    # ── 2. Verifica se as colunas necessárias existem ──
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
            "erro": f"Colunas não encontradas no arquivo: {', '.join(colunas_faltando)}"
        }

    # ── 3. Converte a coluna de data para datetime ──
    # datetime é um tipo de dado que representa datas e horas
    df["datahoramovimentacao"] = pd.to_datetime(
        df["datahoramovimentacao"], errors="coerce"
    )

    # ── 4. Ordena por data — do mais antigo para o mais recente ──
    df = df.sort_values("datahoramovimentacao", ascending=True)

    # ── 5. Identifica operações suspeitas ──
    # Cria uma nova coluna "normal" — True se for normal, False se for suspeita
    df["normal"] = df["mensagem"].apply(is_operacao_normal)

    # Filtra só as suspeitas
    suspeitas = df[df["normal"] == False].copy()

    # ── 6. Monta o resumo geral ──
    total_movimentacoes = len(df)
    total_suspeitas = len(suspeitas)
    usuarios_unicos = df["usuario"].nunique()

    # ── 7. Identifica quando começaram os problemas ──
    primeira_suspeita = None
    if not suspeitas.empty:
        primeira_suspeita = suspeitas.iloc[0]["datahoramovimentacao"]
        if pd.notna(primeira_suspeita):
            primeira_suspeita = primeira_suspeita.strftime("%d/%m/%Y %H:%M")

    # ── 8. Ranking de usuários suspeitos ──
    # Conta quantas operações suspeitas cada usuário fez
    ranking_usuarios = (
        suspeitas.groupby("usuario")
        .size()
        .reset_index(name="total_suspeitas")
        .sort_values("total_suspeitas", ascending=False)
        .head(10)
        .to_dict(orient="records")
    )

    # ── 9. Lista das operações suspeitas ──
    lista_suspeitas = []
    for _, row in suspeitas.iterrows():
        data = row["datahoramovimentacao"]
        lista_suspeitas.append({
            "data": data.strftime("%d/%m/%Y %H:%M") if pd.notna(data) else "-",
            "usuario": str(row["usuario"]),
            "mensagem": str(row["mensagem"]),
            "quantidade": int(row["quantidade"]) if pd.notna(row["quantidade"]) else 0,
            "saldo_produto": int(row["saldoproduto"]) if pd.notna(row["saldoproduto"]) else 0,
        })

    # ── 10. Monta e retorna o resultado final ──
    return {
        "sucesso": True,
        "produto": {
            "codigo": str(df["produtocodigo"].iloc[0]),
            "nome": str(df["produto"].iloc[0]),
        },
        "resumo": {
            "total_movimentacoes": total_movimentacoes,
            "total_suspeitas": total_suspeitas,
            "percentual_suspeitas": round((total_suspeitas / total_movimentacoes) * 100, 1) if total_movimentacoes > 0 else 0,
            "usuarios_envolvidos": usuarios_unicos,
            "primeira_ocorrencia_suspeita": primeira_suspeita,
        },
        "ranking_usuarios": ranking_usuarios,
        "operacoes_suspeitas": lista_suspeitas,
    }