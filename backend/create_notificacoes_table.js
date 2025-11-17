require("dotenv").config();
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

async function createNotificacoesTable() {
  try {
    const sqlFile = path.join(__dirname, "sql", "create_notificacoes.sql");
    const sql = fs.readFileSync(sqlFile, "utf8");

    console.log("📋 Criando tabela de notificações...");
    await pool.query(sql);
    console.log("✅ Tabela de notificações criada com sucesso!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao criar tabela:", error.message);
    process.exit(1);
  }
}

createNotificacoesTable();
