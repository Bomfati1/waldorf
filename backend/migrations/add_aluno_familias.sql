-- Cria tabela de vínculo N:N entre alunos e familias (responsáveis)
CREATE TABLE IF NOT EXISTS aluno_familias (
  aluno_id INTEGER NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  familia_id INTEGER NOT NULL REFERENCES familias(id) ON DELETE CASCADE,
  parentesco TEXT NULL,
  principal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (aluno_id, familia_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_aluno_familias_aluno ON aluno_familias (aluno_id);
CREATE INDEX IF NOT EXISTS idx_aluno_familias_familia ON aluno_familias (familia_id);
