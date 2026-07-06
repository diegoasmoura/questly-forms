# Racional de Decisões de Arquitetura — QuestlyForms

Este documento registra as principais decisões de design e arquitetura do projeto durante o processo de refatoração e implementação de features do PsicoManager.

## Decisão 1: Templates de Anamnese no Client-side (`templates.js`)
- **Problema**: Onde armazenar e como estruturar os templates de Anamnese por faixa etária e abordagem?
- **Alternativas**:
  1. No banco de dados, com seed script.
  2. No client-side, dentro do arquivo `templates.js` já existente (que já armazena o YSQ-L3 de 232 itens).
- **Decisão**: Alternativa 2. O arquivo `templates.js` é importado pelo `Library.jsx` e os templates são criados no banco de dados sob demanda quando o psicólogo clica em "Adicionar" (usando a chamada `api.createForm`). Isso economiza requests iniciais e permite carregar rapidamente o acervo.
- **Ressalva**: Para evitar inchar a memória da aplicação com arquivos gigantescos, as perguntas devem ser sucintas e organizadas.
