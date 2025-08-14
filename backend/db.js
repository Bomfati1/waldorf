// Importa a classe Pool da biblioteca 'pg'
const { Pool } = require("pg");

// Cria uma nova instância do Pool com as configurações de conexão
const pool = new Pool({
  // --- ATENÇÃO: EDITE AS LINHAS ABAIXO ---

  // 1. Substitua 'seu_usuario_postgres' pelo seu nome de usuário do PostgreSQL.
  //    (Geralmente é 'postgres' se você não criou outro).
  user: "postgres",

  // 2. Mantenha 'localhost' se o banco de dados estiver na sua máquina.
  host: "localhost",

  // 3. Substitua 'seu_banco_de_dados' pelo nome do banco de dados que você criou para este projeto.
  database: "escola",

  // 4. Substitua 'sua_senha_postgres' pela senha que você definiu durante a instalação do PostgreSQL.
  password: "ttaall1001",

  // 5. Mantenha a porta 5432.
  port: 5432,
});

// Exporta um objeto com um método 'query' para que possamos executar comandos SQL
// a partir de outros arquivos do nosso projeto.
module.exports = {
  query: (text, params) => pool.query(text, params),
};
