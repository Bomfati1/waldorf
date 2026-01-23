-- Tabela para armazenar anexos de planejamentos no Firebase Storage
CREATE TABLE IF NOT EXISTS planejamento_anexos_firebase (
  id SERIAL PRIMARY KEY,
  planejamento_id INTEGER NOT NULL REFERENCES planejamentos(id_planejamento) ON DELETE CASCADE,
  nome_arquivo VARCHAR(255) NOT NULL,
  tipo_arquivo VARCHAR(100),
  caminho_firebase TEXT NOT NULL,
  tamanho BIGINT,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Índice para melhorar performance nas consultas por planejamento
CREATE INDEX IF NOT EXISTS idx_planejamento_anexos_firebase_planejamento_id 
ON planejamento_anexos_firebase(planejamento_id);

-- Comentários na tabela e colunas
COMMENT ON TABLE planejamento_anexos_firebase IS 'Armazena referências dos anexos de planejamentos hospedados no Firebase Storage';
COMMENT ON COLUMN planejamento_anexos_firebase.caminho_firebase IS 'Caminho completo do arquivo no Firebase Storage (ex: anexos_planejamento/123/1737375600000_documento.pdf)';
COMMENT ON COLUMN planejamento_anexos_firebase.tamanho IS 'Tamanho do arquivo em bytes';
