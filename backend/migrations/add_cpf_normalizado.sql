-- Migração: adicionar coluna gerada cpf_normalizado e índices

-- 1) Adiciona coluna gerada com CPF apenas dígitos
ALTER TABLE familias
  ADD COLUMN IF NOT EXISTS cpf_normalizado TEXT
  GENERATED ALWAYS AS (regexp_replace(cpf::text, '[^0-9]', '', 'g')) STORED;

COMMENT ON COLUMN familias.cpf_normalizado IS 'CPF do responsável normalizado (apenas dígitos), gerado automaticamente a partir de cpf';

-- 2) Índice não-único para acelerar buscas
CREATE INDEX IF NOT EXISTS idx_familias_cpf_normalizado
  ON familias (cpf_normalizado);

-- 3) Observação: índice único será criado pelo script JS somente se não houver duplicidades
--    (evita falhas caso existam CPFs duplicados no formato normalizado)
