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
  };
} else if (DATABASE_URL) {
  // Parse DATABASE_URL manualmente
  const url = new URL(DATABASE_URL);
  poolConfig = {
    host: url.hostname,
    port: parseInt(url.port, 10) || 5432,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: false },
  };
} else {
  throw new Error(
    'Variáveis de ambiente ausentes: PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE (ou defina DATABASE_URL)'
  );
}

// Cria uma nova instância do Pool com as configurações de conexão
const pool = new Pool(poolConfig);

// Log de conexão bem-sucedida
pool.on('connect', () => {
  console.log('✅ Nova conexão estabelecida com PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erro inesperado no pool de conexão:', err);
});

// Exporta o pool diretamente.
// Isso nos permite usar tanto `db.query()` para consultas simples
// quanto `db.connect()` para transações mais complexas, como o cadastro de turmas.
module.exports = pool;
module.exports = pool;
