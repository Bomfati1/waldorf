require("dotenv").config();
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log(
      "🚀 Executando migration: create_planejamento_anexos_firebase.sql",
    );

    const sqlPath = path.join(
      __dirname,
      "migrations",
      "create_planejamento_anexos_firebase.sql",
    );
    const sql = fs.readFileSync(sqlPath, "utf8");

    await client.query(sql);

    console.log("✅ Tabela planejamento_anexos_firebase criada com sucesso!");

    // Verifica se a tabela foi criada
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'planejamento_anexos_firebase'
      ORDER BY ordinal_position
    `);

    console.log("\n📋 Estrutura da tabela:");
    result.rows.forEach((row) => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
  } catch (error) {
    console.error("❌ Erro ao executar migration:", error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => {
    console.log("\n✨ Migration concluída!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Falha na migration:", error);
    process.exit(1);
  });
