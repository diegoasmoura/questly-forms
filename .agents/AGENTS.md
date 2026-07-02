# Questly Forms - Regras de Governança e Desenvolvimento

Este documento estabelece as regras e padrões de arquitetura para o projeto Questly Forms. Ao atuar neste repositório, siga rigorosamente as diretrizes abaixo.

## 1. Organização e Componentização
- **Arquivos Pequenos:** Evite arquivos maiores que 250 linhas. Refatore componentes monolíticos em subcomponentes menores (ex: `PastaComponente/index.jsx`, `PastaComponente/SubComponente.jsx`).
- **Hooks Customizados:** Toda lógica complexa, requisições de API (`fetch`/`axios`/`api.get`) e manipulação de estado complexo devem ser extraídas para `hooks` (ex: `useDashboardData.js`).
- **Widgets:** Componentes que representam blocos independentes de tela (como cartões na Dashboard) devem ser chamados de `Widget` e colocados em pastas semânticas (ex: `components/dashboard/`).

## 2. Padrões de Estilo e Identidade Visual
- **Aderência à Marca:** Respeite as variáveis definidas no `index.css` (`--sage`, `--peach`, `--purple`, etc).
- **Tipografia:** 
  - Interface geral (textos, botões, labels): `Nunito Sans` (classe `font-sans`).
  - Headings e Saudações: `Playfair Display` (classe `font-heading`).
  - Destaques manuscritos (nomes, palavras isoladas): `Caveat` (classe `font-handwritten`).
  - Marca (logo exclusivo): `Caveat Brush` (classe `font-brand`).
- **Tailwind:** Utilize as classes do Tailwind para espaçamentos e cores. Evite strings de classes exageradamente longas repetidas; prefira abstrair em componentes React se a repetição for alta, ou no `@layer components` se for estritamente necessário (como botões).
- **Transições:** A aplicação utiliza transições universais (`* { transition-colors }`) para garantir consistência entre tema claro e escuro. Respeite as propriedades base para evitar bugs visuais na troca de temas.

## 3. Padrões de Git e Colaboração
- Utilize **Conventional Commits** para padronizar o histórico:
  - `feat:` Nova funcionalidade
  - `fix:` Correção de bug
  - `refactor:` Refatoração de código sem mudar comportamento
  - `style:` Alterações apenas visuais/CSS
  - `chore:` Alterações em configurações, pacotes ou builds
- Descreva no corpo do commit a motivação da mudança, caso envolva regras de negócio complexas.

## 4. Tratamento de Dados (Governança)
- **APIs:** Nunca instancie chamadas cruas dentro da renderização do componente. Sempre passe através de `lib/api.js` para garantir centralização de tratamento de erros e autenticação (interceptors).
- **Dados Sensíveis:** Não commite chaves de API cruas, senhas de Supabase ou strings de banco de dados diretamente no código. Utilize variáveis de ambiente (`.env`).
- **Tratamento de Exceções:** Todos os componentes devem prever estado de `loading` (carregamento) e `error` (falha na API), além do `empty state` (nenhum dado disponível).

Siga estas regras em toda iteração do projeto para assegurar que a base de código permaneça escalável, limpa e adequada ao trabalho em equipe.
