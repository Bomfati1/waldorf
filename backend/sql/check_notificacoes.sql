-- Script para verificar a estrutura e dados da tabela de notificações

-- 1. Verificar se a tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'notificacoes'
);

-- 2. Verificar estrutura da tabela
\d notificacoes

-- 3. Listar todas as notificações
SELECT 
  id,
  usuario_id,
  tipo,
  mensagem,
  planejamento_id,
  lida,
  created_at
FROM notificacoes
ORDER BY created_at DESC
LIMIT 20;

-- 4. Contar notificações por tipo
SELECT 
  tipo,
  COUNT(*) as total,
  COUNT(CASE WHEN lida = false THEN 1 END) as nao_lidas
FROM notificacoes
GROUP BY tipo
ORDER BY total DESC;

-- 5. Verificar notificações recentes (últimas 24 horas)
SELECT 
  id,
  usuario_id,
  tipo,
  mensagem,
  planejamento_id,
  lida,
  created_at
FROM notificacoes
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 6. Verificar se existem usuários ativos
SELECT 
  id,
  nome,
  email,
  ativo
FROM usuarios
WHERE ativo = true;

-- 7. Testar INSERT de notificação
-- INSERT INTO notificacoes (usuario_id, tipo, mensagem, planejamento_id, lida, created_at)
-- VALUES (1, 'planejamento', 'Teste de notificação', NULL, false, NOW())
-- RETURNING *;
