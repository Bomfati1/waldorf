// Importa a classe Pool da biblioteca 'pg'
const { Pool } = require("pg");
const dns = require('dns').promises;

// Função para resolver hostname para IPv4
async function resolveToIPv4(hostname) {
  try {
    const addresses = await dns.resolve4(hostname);
    return addresses[0]; // Retorna o primeiro IPv4
  } catch (error) {
    console.error(`Erro ao resolver ${hostname}:`, error);
    return hostname; // Se falhar, retorna o hostname original
  }
}

// Permite configuração por variáveis de ambiente (.env)
const { DATABASE_URL, PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE, PGSSL } =
  process.env;

async function createPool() {
  let poolConfig;

  // Sempre usar parâmetros individuais para forçar IPv4
  if (PGHOST && PGPORT && PGUSER && PGPASSWORD && PGDATABASE) {
    // Resolver hostname para IPv4 antes de conectar
    const ipv4Host = await resolveToIPv4(PGHOST);
    console.log(`🔗 Resolvendo ${PGHOST} para IPv4: ${ipv4Host}`);
    
    poolConfig = {
      host: ipv4Host,
      port: parseInt(PGPORT, 10),
      user: PGUSER,
      password: PGPASSWORD,
      database: PGDATABASE,
      ssl: PGSSL === 'true' ? { rejectUnauthorized: false } : false,
    };
  } else if (DATABASE_URL) {
    // Parse DATABASE_URL manualmente
    const url = new URL(DATABASE_URL);
    const ipv4Host = await resolveToIPv4(url.hostname);
    console.log(`🔗 Resolvendo ${url.hostname} para IPv4: ${ipv4Host}`);
    
    poolConfig = {
      host: ipv4Host,
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
  return new Pool(poolConfig);
}

// Exporta uma promise que resolve para o pool
const poolPromise = createPool();

// Exporta o pool diretamente (para manter compatibilidade)
let pool;
poolPromise.then(p => {
  pool = p;
  console.log('✅ Pool de conexão PostgreSQL criado com sucesso');
}).catch(err => {
  console.error('❌ Erro ao criar pool de conexão:', err);
  process.exit(1);
});

module.exports = poolPromise;
module.exports = pool;
