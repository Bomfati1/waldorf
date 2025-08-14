// Importa a classe Pool da biblioteca 'pg'
const { Pool } = require("pg");

// Cria uma nova instância do Pool com as configurações de conexão
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "escola",
  password: "ttaall1001",
  port: 5432,
});

// Exporta o pool diretamente.
// Isso nos permite usar tanto `db.query()` para consultas simples
// quanto `db.connect()` para transações mais complexas, como o cadastro de turmas.
module.exports = pool;
