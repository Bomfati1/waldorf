const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

async function runMigration() {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    await client.connect();
    console.log("✅ Conectado ao banco de dados PostgreSQL");

    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, "add_cpf_to_familias.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf8");

    // Executar o SQL
    await client.query(sqlContent);
    console.log("✅ Migração executada com sucesso!");
    console.log("   - Coluna CPF adicionada à tabela familias");
    console.log("   - Índice criado para melhor performance");
  } catch (error) {
    console.error("❌ Erro ao executar migração:", error.message);
    if (error.code === "42701") {
      console.log("ℹ️  A coluna CPF já existe na tabela familias");
    }
  } finally {
    await client.end();
    console.log("✅ Conexão fechada");
  }
}

runMigration();
