import httpx
from app.config import ANTHROPIC_API_KEY

async def gerar_recomendacao(resultado: dict) -> str:
    """
    Recebe o resultado da análise e retorna uma recomendação
    de ação gerada pelo Claude em linguagem natural.
    """

    if not ANTHROPIC_API_KEY:
        return "Chave da API Anthropic não configurada."

    resumo = resultado["resumo"]
    produto = resultado["produto"]
    ranking = resultado["ranking_usuarios"][:5]  # top 5 usuários
    suspeitas = resultado["operacoes_suspeitas"][:10]  # primeiras 10 operações

    # ── Monta o ranking em texto ──
    ranking_texto = "\n".join([
        f"- {u['usuario']}: {u['total_operacoes']} operações "
        f"(adicionou {u['total_adicionado']} un., retirou {abs(u['total_retirado'])} un.)"
        for u in ranking
    ])

    # ── Monta as primeiras ocorrências em texto ──
    suspeitas_texto = "\n".join([
        f"- {op['data']} | {op['usuario']} | {op['mensagem']} | "
        f"qtd: {op['quantidade']} | saldo após: {op['saldo_produto_apos']} | "
        f"endereço: {op.get('endereco', '-')}"
        for op in suspeitas
    ])

    # ── Monta o prompt ──
    prompt = f"""Você é um especialista em gestão de estoque e auditoria logística.
Analise os dados abaixo e forneça:

1. Um resumo claro do que aconteceu com o estoque desse produto
2. Uma avaliação de risco (baixo, médio, alto ou crítico)
3. Um plano de ação detalhado com passos numerados para resolver o problema
4. Quais usuários merecem investigação prioritária e por quê

Seja objetivo e use linguagem simples — o leitor pode não ter experiência técnica em auditoria.

═══════════════════════════════════
DADOS DA ANÁLISE
═══════════════════════════════════

Produto: {produto['nome']} (código: {produto['codigo']})

Resumo:
- Total de movimentações analisadas: {resumo['total_movimentacoes']}
- Operações suspeitas (Stock Locator): {resumo['total_suspeitas']} ({resumo['percentual_suspeitas']}% do total)
- Impacto total no saldo: {resumo['impacto_total_saldo']} unidades
- Total adicionado via Stock Locator: {resumo['total_adicionado_stock_locator']} unidades
- Total retirado via Stock Locator: {abs(resumo['total_retirado_stock_locator'])} unidades
- Primeira ocorrência suspeita: {resumo['primeira_ocorrencia']}
- Usuários envolvidos: {resumo['usuarios_envolvidos']}

Top 5 usuários com mais operações suspeitas:
{ranking_texto}

Primeiras 10 operações suspeitas identificadas:
{suspeitas_texto}

═══════════════════════════════════
Responda em português do Brasil.
"""

    # ── Chama a API do Claude ──
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 1500,
                    "messages": [
                        {"role": "user", "content": prompt}
                    ]
                }
            )
            response.raise_for_status()
            data = response.json()
            return data["content"][0]["text"]

    except Exception as e:
        print(f"Erro ao chamar API do Claude: {e}")
        return "Não foi possível gerar a recomendação automática no momento."