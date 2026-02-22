# WMS Modular
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![Git](https://img.shields.io/badge/git-%23F05033.svg?style=for-the-badge&logo=git&logoColor=white)
Sistema WMS modular em desenvolvimento, iniciado pelo módulo de Auditoria Inteligente.

## Objetivo
Criar um sistema WMS escalável, insipirado em soluções como o Stockfy, iniciando pelo módulo de auditoria para resolver divergências operacionais e eliminar o uso de planilhas no processo de conferência de estoque.

## Proble que o Projeto Resolve
Mesmo empresas que utilizam WMS frequentemente recorrem a planilhas para:

- Registrar divergências de estoque
- Controlar auditorias
- Acompanhar inconsistências entre físico e sistema

O módulo de Auditoria do WMS Modular visa substituir essas planilhas por um sistema estruturado, validado e escalável.

## Status Atual

Fase 1 - MVP (Módulo de Auditoria)

- Estrutura do projeto definida ✔
- Design System estruturado ✔
- Página de Login criada ✔
- Tela do operador
- Tela do auditor
- Integração com backend

## Arquitetura (Visão Geral)
O sistema será dividido em módulos independentes:
- Módulo 01 — Auditoria (MVP atual)
- Módulo 02 — Estoque e Movimentação
- Módulo 03 — Picking
- Módulo 04 — KPIs e Relatórios
- Módulo 05 — Integrações externas

Cada módulo poderá evoluir de forma independente.

## Tecnologias
Front-end:
- HTML5
- CSS3 (Design System próprio)

Back-end (planejado):
- Python
- FastAPI
- PostgreSQL (Supabase)

Infraestrutura:
- GitHub
- Deploy em nuvem (planejado)

## Estrutura do Projeto
/docs → Documentação do projeto
/src → Código-fonte
/src/css → Arquivos de estilo
/src/js → Scripts JavaScript
/src/assets → Ícones e imagens

## Documentação Completa
- [Visão Geral](./docs/01-visao-geral.md)
- [Escopo do MVP](./docs/02-mvp-auditoria.md)
- [Roadmap de Futuro](./docs/03-roadmap.md)
- [Design System](./docs/04-desing-system.md)

## Autor
Projeto desenvolvido por Uriel Barbosa, estudante de Engenharia de Software

## Observação
Este projeto está em desenvolvimento contínuo e faz parte de um estudo prático de arquitetura de sistemas e desenvolvimento full-stack.