-- Tabela de Notificações
-- Armazena notificações para os usuários sobre ações no sistema

CREATE TABLE IF NOT EXISTS notificacoes (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL, -- 'anexo_adicionado', 'comentario', 'aprovado', 'reprovado'
  mensagem TEXT NOT NULL,
  planejamento_id INTEGER REFERENCES planejamentos(id_planejamento) ON DELETE CASCADE,
  lida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_id ON notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_created_at ON notificacoes(created_at DESC);

-- Comentários
COMMENT ON TABLE notificacoes IS 'Armazena notificações para usuários sobre ações no sistema';
COMMENT ON COLUMN notificacoes.tipo IS 'Tipo da notificação: anexo_adicionado, comentario, aprovado, reprovado';
COMMENT ON COLUMN notificacoes.lida IS 'Indica se a notificação foi lida pelo usuário';
