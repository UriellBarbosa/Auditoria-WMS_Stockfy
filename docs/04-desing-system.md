# Design System

## Objetivo
Este Design System define as cores, estados visuais e padrões básicos de interface do WMS Modular.

Ele foi estruturado para:
- Garantir consistência visual
- Facilitar escalabilidade
- Evitar hardcode de cores
- Preparar o sistema para crescimento modular (Auditoria → Estoque → Picking → KPIs)

## Princípios Visuais
O sistema transmite:
- 🔵 Tecnologia e confiabilidade (Primary)
- 🟢 Controle e resolução (Success)
- 🔴 Divergência e erro (Danger)
- 🟠 Atenção operacional (Warning)
- 🔷 Destaque institucional (Accent)

O visual deve parecer:
- Sistema SaaS profissional
- Produto vendável
- Ambiente logístico/operacional moderno

## Paleta Oficial
:root {
  /* Ação principal */
  --primary: #0ea5e9;
  --primary-hover: #0284c7;

  /* Estados */
  --success: #16a34a;
  --danger: #dc2626;
  --warning: #f97316;

  /* Destaque institucional / neutro forte */
  --accent: #1e293b;

  /* Base */
  --background: #f8fafc;
  --card-bg: #ffffff;
  --text: #0f172a;
  --muted: #64748b;
  --border: #e2e8f0;
}

## Semântica das Cores

🔵 Primary

Uso:
- Botões principais
- Links
- Ações primárias
- Elementos clicáveis

Nunca usar para:
- Alertas
- Status de erro

🟢 Success

Uso:
- Registro resolvido
- Operação concluída
- Confirmações positivas

Exemplo futuro:
- Status: "Resolvido"

🔴 Danger

Uso:
- Divergência
- Erro
- Exclusão
- Ações críticas

Exemplo futuro:
- Status: "Divergente"

🟠 Warning

Uso:
- Pendência
- Atenção
- Processo incompleto

Exemplo futuro
- Status: "Pendente"

🔷 Accent

Uso:
- Destaques secundários
- Badges informativos
- Indicadores neutros fortes
- Bordas laterais de destaque
- Ícones institucionais

Não usar para:
- Ações primárias
- Alertas críticos

## Hierarquia Visual
1. Primary → chama ação
2. Warning → chama atenção
3. Danger → indica erro
4. Success → indica conclusão
5. Accent → reforça informação

## Classes Utilitárias Base (serão adicionadas ao CSS futuramente)
.text-success { color: var(--success); }
.text-danger { color: var(--danger); }
.text-warning { color: var(--warning); }
.text-accent { color: var(--accent); }

.bg-success { background: var(--success); color: white; }
.bg-danger { background: var(--danger); color: white; }
.bg-warning { background: var(--warning); color: white; }
.bg-accent { background: var(--accent); color: white; }

## Componentes Base (serão adicionados como padrão no futuro)
BADGE
.badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

Estados:
.badge--success { background: var(--success); color: white; }
.badge--danger { background: var(--danger); color: white; }
.badge--warning { background: var(--warning); color: white; }
.badge--accent { background: var(--accent); color: white; }

## Consistência
Regras importantes:
- Nunca usar cor hexadecimal direto nos componentes.
- Sempre usa var(--nome-da-variável).
- Nunca misturar semântica (ex.: usar "success" para "erro").
- Toda nova cor deve ser documentada aqui.

## Evolução Futura
Quando o sistema crescer, podem ser adicionados:
- Modo Dark
- Paleta alternativa para clientes
- Variáveis RGB para efeitos de transparência
- Tokens de espaçamento
- Escala tipográfica

## Identidade do Produto
Nome oficial do sistema:
- WMS Modular

Primeiro módulo ativo:
- Módulo de Auditoria Inteligente