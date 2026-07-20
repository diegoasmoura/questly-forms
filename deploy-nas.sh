#!/bin/bash

# Script de deploy automatizado para o NAS do Questly Forms
# Executar este script dentro do terminal do seu NAS para atualizar para a versão mais recente.

echo "============================================="
echo "🔄 Iniciando atualização do Questly Forms no NAS..."
echo "============================================="

# 1. Alterna para a branch correta
echo "🌿 Garantindo branch feature/diego-improvements..."
git checkout feature/diego-improvements

# 2. Puxa as atualizações do GitHub
echo "📥 Puxando código mais recente..."
git pull origin feature/diego-improvements

# 3. Derruba os containers limpando volumes antigos de build
echo "🗑️ Derrubando containers e volumes temporários..."
docker-compose -f docker-compose.nas.yml down -v

# 4. Reconstrói as imagens limpando qualquer cache antigo
echo "🏗️ Reconstruindo containers do zero (no-cache)..."
docker-compose -f docker-compose.nas.yml build --no-cache

# 5. Sobe os novos containers em background
echo "🚀 Iniciando containers atualizados..."
docker-compose -f docker-compose.nas.yml up -d

echo "============================================="
echo "✅ Questly Forms atualizado com sucesso no seu NAS!"
echo "============================================="
