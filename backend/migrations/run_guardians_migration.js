require("dotenv").config();
const path = require("path");
const fs = require("fs");
const pool = require("../db");

async function applySql(client, file) {
  const sqlPath = path.join(__dirname, file);
  const sql = fs.readFileSync(sqlPath, "utf8");
  await client.query(sql);
  console.log(`✔️ Aplicado: ${file}`);
}

async function run() {
  const client = await pool.connect();
  try {
    console.log("\n=== Migração Responsáveis M:N: INÍCIO ===\n");

    // 1) Criar join table aluno_familias
    await applySql(client, "add_aluno_familias.sql");

    // 2) Remover unicidade de email em familias e criar índice simples
    await applySql(client, "drop_unique_email_familias.sql");

    console.log("\n=== Migração Responsáveis M:N: FIM ===\n");
  } catch (err) {
    console.error(
      "❌ Erro ao executar migração M:N de responsáveis:",
      err.message
    );
    console.error(err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
