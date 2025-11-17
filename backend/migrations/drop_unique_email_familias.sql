-- Remove unicidade do email em familias (se existir) e cria índice não-único
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'familias_email_key'
  ) THEN
    ALTER TABLE familias DROP CONSTRAINT familias_email_key;
  END IF;
END$$;

-- Índice não-único para manter performance de busca por email
CREATE INDEX IF NOT EXISTS idx_familias_email ON familias(email) WHERE email IS NOT NULL AND email <> '';
