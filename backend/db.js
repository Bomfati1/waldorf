// Importa a classe Pool da biblioteca 'pg'
const { Pool } = require("pg");
const dns = require('dns');

// Forçar DNS para IPv4 primeiro
dns.setDefaultResultOrder('ipv4first');

// Permite configuração por variáveis de ambiente (.env)
const { DATABASE_URL, PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE, PGSSL } =
  process.env;

let poolConfig;

// Sempre usar parâmetros individuais para forçar IPv4
if (PGHOST && PGPORT && PGUSER && PGPASSWORD && PGDATABASE) {
  poolConfig = {
    host: PGHOST,
    port: parseInt(PGPORT, 10),
    user: PGUSER,
    password: PGPASSWORD,
    database: PGDATABASE,
    ssl: PGSSL === 'true' ? { rejectUnauthorized: false } : false,
    // Forçar IPv4 para evitar erro ENETUNREACH em IPv6
    family: 4,
  };
} else if (DATABASE_URL) {
  // Parse DATABASE_URL manualmente para usar family: 4
  const url = new URL(DATABASE_URL);
  poolConfig = {
    host: url.hostname,
    port: parseInt(url.port, 10) || 5432,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: false },
    // Forçar IPv4 para evitar erro ENETUNREACH em IPv6
    family: 4,
  };
} else {
  throw new Error(
    'Variáveis de ambiente ausentes: PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE (ou defina DATABASE_URL)'
  );
}

// Cria uma nova instância do Pool com as configurações de conexão
const pool = new Pool(poolConfig);

// Exporta o pool diretamente.
// Isso nos permite usar tanto `db.query()` para consultas simples
// quanto `db.connect()` para transações mais complexas, como o cadastro de turmas.
module.exports = pool;
