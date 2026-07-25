# 📱 Guia de PWA (Progressive Web App) e Mobile

Este documento rege a lógica de Transformação Mobile e Funcionalidades Offline do **Questly Forms**. O sistema possui arquitetura PWA nativa impulsionada pelo `vite-plugin-pwa`.

## 1. Regras do Service Worker
- O Service Worker (`sw.js`) é registrado automaticamente em `main.jsx` no ciclo inicial da aplicação (`registerSW({ immediate: true })`).
- A configuração reside integralmente em `vite.config.js`.
- **Offline Cache:** 
  - As requisições GET para `/api/patients` e `/api/forms` sofrem cache `NetworkFirst` no navegador.
  - Fontes e ícones sofrem cache `StaleWhileRevalidate` ou `CacheFirst`.

## 2. Padrão de Instalação UI (A2HS)
A experiência de instalação no aparelho do usuário é controlada manualmente para lidar com as restrições da Apple e evitar prompts inesperados.

- **Componente Central:** `Sidebar.jsx` (Botão "Baixar App").
- **Lógica de Hook:** `hooks/usePwaInstall.js` (Gerencia a detecção do SO, captura o evento `beforeinstallprompt` no Android, e avalia a flag `isStandalone`).
- **Android / Windows:** Ao clicar no botão da Sidebar, invoca-se `promptInstall()` para abrir a caixa de diálogo nativa do sistema.
- **iOS (iPhone/iPad):** Como a Apple não aceita invocações nativas por script, um modal educativo é disparado: `PwaInstallModal.jsx`. Este modal orienta o usuário a utilizar a função "Adicionar à Tela de Início" do Safari.

## 3. Gestão de Versões
Sempre que uma nova compilação (`npm run build`) for feita e enviada para o servidor, o navegador detectará que o Service Worker mudou em background.
- O componente `PwaUpdateModal.jsx` (injetado no `<App />`) cuidará de capturar essa alteração.
- Um Toast customizado subirá pela base da tela orientando o usuário a "Atualizar Agora", acionando `updateServiceWorker(true)`, o que força o navegador a expurgar o cache antigo e utilizar a versão recente do código.

## 4. Meta Tags Críticas
O `index.html` possui declarações Mobile estritas que não devem ser removidas:
- `<meta name="theme-color" content="#5CBF9D">` (Decora a Status Bar do Android com o Verde Primário).
- `<meta name="apple-mobile-web-app-capable" content="yes">` (Garante tela cheia sem barras no iPhone).
