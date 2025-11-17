#!/bin/bash

# 🔍 Script de Debug Rápido - Notificações
# Execute: bash quick_debug.sh

echo "🔍 =========================================="
echo "   DEBUG RÁPIDO - SISTEMA DE NOTIFICAÇÕES"
echo "=========================================="
echo ""

# 1. Testar conexão com banco
echo "1️⃣ Testando sistema de notificações..."
cd /c/Users/mathe/Desktop/escola/backend
node test_notificacoes.js
echo ""

# 2. Verificar se backend está rodando
echo "2️⃣ Verificando se backend está rodando..."
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "   ✅ Backend está ONLINE em http://localhost:3001"
else
    echo "   ❌ Backend está OFFLINE"
    echo "   Execute: cd backend && npm start"
fi
echo ""

# 3. Verificar se frontend está rodando
echo "3️⃣ Verificando se frontend está rodando..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "   ✅ Frontend está ONLINE em http://localhost:5173"
else
    echo "   ❌ Frontend está OFFLINE"
    echo "   Execute: cd escola && npm run dev"
fi
echo ""

echo "=========================================="
echo "✅ Verificação concluída!"
echo "=========================================="
echo ""
echo "📋 Próximos passos:"
echo "   1. Cadastre um aluno em: http://localhost:5173/home/cadastrar-aluno"
echo "   2. Observe os logs no terminal do backend"
echo "   3. Clique no sino 🔔 para ver as notificações"
echo ""
