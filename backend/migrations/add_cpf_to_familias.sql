-- Adicionar coluna CPF na tabela familias
-- Execute este script no banco de dados PostgreSQL

-- Adiciona a coluna CPF se não existir
ALTER TABLE familias 
ADD COLUMN IF NOT EXISTS cpf VARCHAR(14) UNIQUE;

-- Adiciona índice para melhorar performance de busca
CREATE INDEX IF NOT EXISTS idx_familias_cpf ON familias(cpf);

-- Adiciona comentário na coluna
COMMENT ON COLUMN familias.cpf IS 'CPF do responsável (formato: XXX.XXX.XXX-XX ou apenas números)';
