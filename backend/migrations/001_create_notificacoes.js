const pool = require("../db");
const fs = require("fs");
const path = require("path");

async function runMigration() {
  try {
    console.log("🔄 Executando migração: create_notificacoes...");

    const sqlFilePath = path.join(__dirname, "../sql/create_notificacoes.sql");
    const sql = fs.readFileSync(sqlFilePath, "utf8");

    await pool.query(sql);

    console.log("✅ Tabela notificacoes criada com sucesso!");
    console.log("✅ Índices criados com sucesso!");

    // Verifica se a tabela foi criada
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'notificacoes'
    `);

    if (result.rows.length > 0) {
      console.log(
        "✅ Verificação: Tabela notificacoes existe no banco de dados"
      );

      // Verifica os índices
      const indexes = await pool.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'notificacoes'
      `);

      console.log(
        `✅ Índices criados: ${indexes.rows.map((r) => r.indexname).join(", ")}`
      );
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao executar migração:", error);
    process.exit(1);
  }
}

runMigration();
