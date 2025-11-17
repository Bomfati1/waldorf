#!/bin/bash

# Script de Debug - Planejamentos ISO
echo "🔍 ========================================="
echo "🔍 DEBUG - PLANEJAMENTOS ISO"
echo "🔍 ========================================="
echo ""

# 1. Verificar arquivos
echo "📁 1. Verificando arquivos necessários..."
echo ""

files=(
  "escola/src/pages/PlanejamentosISOPage.jsx"
  "escola/src/components/PlanejamentoISO.jsx"
  "escola/src/css/PlanejamentosISOPage.css"
  "escola/src/css/PlanejamentoISO.css"
  "escola/src/App.jsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file - ARQUIVO NÃO ENCONTRADO!"
  fi
done

echo ""
echo "📋 2. Verificando rota no App.jsx..."
if grep -q "planejamentos-iso" escola/src/App.jsx; then
  echo "  ✅ Rota 'planejamentos-iso' encontrada"
else
  echo "  ❌ Rota 'planejamentos-iso' NÃO encontrada!"
fi

echo ""
echo "📋 3. Verificando import do PlanejamentosISOPage..."
if grep -q "import PlanejamentosISOPage" escola/src/App.jsx; then
  echo "  ✅ Import encontrado"
else
  echo "  ❌ Import NÃO encontrado!"
fi

echo ""
echo "📋 4. Verificando Sidebar..."
if grep -q "planejamentos-iso" escola/src/components/Sidebar.jsx; then
  echo "  ✅ Link na Sidebar encontrado"
else
  echo "  ❌ Link na Sidebar NÃO encontrado!"
fi

echo ""
echo "🌐 5. Verificando backend..."
if curl -s http://localhost:3001 > /dev/null 2>&1; then
  echo "  ✅ Backend rodando em http://localhost:3001"
else
  echo "  ❌ Backend NÃO está rodando!"
  echo "     Execute: cd backend && node index.js"
fi

echo ""
echo "🌐 6. Verificando frontend..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
  echo "  ✅ Frontend rodando em http://localhost:5173"
else
  echo "  ❌ Frontend NÃO está rodando!"
  echo "     Execute: cd escola && npm run dev"
fi

echo ""
echo "📊 7. Verificando rota do backend..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/planejamentos/semanas-iso/2025/11 2>/dev/null)
if [ "$response" = "200" ] || [ "$response" = "401" ]; then
  echo "  ✅ Rota /planejamentos/semanas-iso/:ano/:mes existe (Status: $response)"
  if [ "$response" = "401" ]; then
    echo "     ⚠️  Status 401 = você precisa estar logado"
  fi
else
  echo "  ❌ Rota não encontrada (Status: $response)"
fi

echo ""
echo "🔍 ========================================="
echo "🎯 PRÓXIMOS PASSOS:"
echo "🔍 ========================================="
echo ""
echo "1. Acesse: http://localhost:5173"
echo "2. Faça login"
echo "3. Vá para: http://localhost:5173/home/planejamentos-iso"
echo "4. Abra o Console (F12)"
echo "5. Procure por logs com:"
echo "   - 🎯 [PLANEJAMENTOS-ISO]"
echo "   - 📅 Buscando semanas"
echo ""
echo "Se não aparecer nada, copie TODOS os erros"
echo "do console e me envie!"
echo ""
