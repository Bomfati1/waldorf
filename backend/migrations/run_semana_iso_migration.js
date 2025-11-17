const path = require("path");

// Carrega o .env do diretório pai (backend)
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const { Pool } = require("pg");
const fs = require("fs");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function executarMigrationSemanaISO() {
  console.log("\n🚀 Iniciando migration de semanas ISO...\n");

  try {
    // Lê o arquivo SQL
    const sqlPath = path.join(__dirname, "add_semana_iso_columns.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    // Executa a migration
    console.log("📝 Executando SQL...");
    await pool.query(sql);
    console.log("✅ Migration executada com sucesso!\n");

    // Verifica o resultado
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_planejamentos,
        COUNT(semana_iso) as com_semana_iso,
        COUNT(*) - COUNT(semana_iso) as sem_semana_iso
      FROM planejamentos
    `);

    console.log("📊 Resultado da migration:");
    console.log(
      "   Total de planejamentos:",
      result.rows[0].total_planejamentos
    );
    console.log("   Com semana ISO:", result.rows[0].com_semana_iso);
    console.log("   Sem semana ISO:", result.rows[0].sem_semana_iso);
    console.log("");

    // Mostra exemplo de planejamentos
    const exemplo = await pool.query(`
      SELECT 
        id_planejamento,
        turma_id,
        ano,
        mes,
        semana,
        semana_iso,
        ano_iso
      FROM planejamentos 
      LIMIT 5
    `);

    if (exemplo.rows.length > 0) {
      console.log("📋 Exemplos de planejamentos atualizados:");
      exemplo.rows.forEach((p) => {
        console.log(
          `   ID ${p.id_planejamento}: Ano ${p.ano}, Mês ${p.mes}, Semana ${p.semana} → ISO: Semana ${p.semana_iso}/${p.ano_iso}`
        );
      });
      console.log("");
    }

    console.log("✅ Migration concluída com sucesso!\n");
  } catch (error) {
    console.error("❌ Erro ao executar migration:", error.message);
    if (error.code === "42701") {
      console.log(
        "ℹ️  As colunas semana_iso e ano_iso já existem na tabela planejamentos"
      );
    }
    console.error("Stack:", error.stack);
  } finally {
    await pool.end();
  }
}

executarMigrationSemanaISO();
