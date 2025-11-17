-- Migration para adicionar colunas de semana ISO à tabela planejamentos
-- Execução: psql -U postgres -d escola_db -f add_semana_iso_columns.sql

BEGIN;

-- Adiciona colunas para semana ISO se não existirem
ALTER TABLE planejamentos 
ADD COLUMN IF NOT EXISTS semana_iso INTEGER,
ADD COLUMN IF NOT EXISTS ano_iso INTEGER;

-- Cria índices para melhor performance nas buscas
CREATE INDEX IF NOT EXISTS idx_planejamentos_semana_iso 
ON planejamentos(ano_iso, semana_iso);

CREATE INDEX IF NOT EXISTS idx_planejamentos_turma_semana_iso 
ON planejamentos(turma_id, ano_iso, semana_iso);

-- Adiciona comentários nas colunas
COMMENT ON COLUMN planejamentos.semana_iso IS 'Número da semana ISO 8601 (1-53)';
COMMENT ON COLUMN planejamentos.ano_iso IS 'Ano ISO da semana (pode diferir do ano calendário)';

-- Atualiza planejamentos existentes com valores ISO calculados
-- OBS: Esta migração assume que você tem os campos 'ano', 'mes' e 'semana'
-- e calcula uma aproximação. Para valores exatos, recomenda-se recalcular manualmente.

UPDATE planejamentos
SET 
  ano_iso = ano,
  semana_iso = (
    -- Cálculo aproximado: (mes-1) * 4 + semana
    CASE 
      WHEN mes IS NOT NULL AND semana IS NOT NULL 
      THEN ((mes - 1) * 4 + semana)
      ELSE NULL
    END
  )
WHERE semana_iso IS NULL;

COMMIT;

-- Verificação
SELECT 
  COUNT(*) as total_planejamentos,
  COUNT(semana_iso) as com_semana_iso,
  COUNT(*) - COUNT(semana_iso) as sem_semana_iso
FROM planejamentos;

COMMENT ON TABLE planejamentos IS 'Tabela de planejamentos com suporte a semanas ISO 8601 para compartilhamento entre meses';
