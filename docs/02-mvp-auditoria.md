# MVP - Módulo de Auditoria

## Escopo
O MVP entrega um módulo web responsivo para registrar SKUs e endereços que precisam ser verificados, substituindo o uso de planilhas.

## Perfis e Permissões (RBAC)
- ADMIN: acesso total (usuários, regras, registros, exportação)
- AUDITOR: vê todos os registros, trata pendências e exporta
- OPERADOR: registra ocorrências e vê somente seus próprios registros

## Telas do MVP
1. Login (username/senha)
2. Operador: registra ocorrência (SKU + área + endereço + qtd "opcional")
3. Auditor: lista de ocorrências (filtros + resolver)
4. Admin: gestão de usuários + gestão de regras

## Endereçamento Suportado
- Formato é sempre validado.
- Limites (rua/nível/coluna/prateleira) são vaçidados apenas se existir regra ativa configurada pelo ADMIN.
- Campo sem limite (NULL) não é validado.