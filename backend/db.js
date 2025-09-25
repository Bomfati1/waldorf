// Importa a classe Pool da biblioteca 'pg'
const { Pool } = require("pg");

// Permite configuração por variáveis de ambiente (.env)
// Suporta tanto parâmetros individuais quanto DATABASE_URL inteira
const { DATABASE_URL, PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE, PGSSL } =
  process.env;

let poolConfig;

if (DATABASE_URL) {
  poolConfig = {
    connectionString: DATABASE_URL,
    ssl: PGSSL ? { rejectUnauthorized: false } : undefined,
  };
} else {
  const missing = [
    "PGHOST",
    "PGPORT",
    "PGUSER",
    "PGPASSWORD",
    "PGDATABASE",
  ].filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(
      `Variáveis de ambiente ausentes: ${missing.join(
        ", "
      )} (ou defina DATABASE_URL)`
    );
  }

  poolConfig = {
    host: PGHOST,
    port: parseInt(PGPORT, 10),
    user: PGUSER,
    password: PGPASSWORD,
    database: PGDATABASE,
    ssl: PGSSL ? { rejectUnauthorized: false } : undefined,
  };
}

// Cria uma nova instância do Pool com as configurações de conexão
const pool = new Pool(poolConfig);

// Exporta o pool diretamente.
// Isso nos permite usar tanto `db.query()` para consultas simples
// quanto `db.connect()` para transações mais complexas, como o cadastro de turmas.
module.exports = pool;
