require("dotenv").config();
const path = require("path");
const fs = require("fs");
const pool = require("../db");

async function run() {
  const client = await pool.connect();
  try {
    console.log("\n=== Migração CPF Normalizado: INÍCIO ===\n");
    const sqlPath = path.join(__dirname, "add_cpf_normalizado.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    console.log("Aplicando ALTER TABLE e índice não-único...");
    await client.query(sql);
    console.log("✔️ Estrutura atualizada.");

    console.log("\nVerificando duplicidades no cpf_normalizado...");
    const dupCheck = await client.query(`
      SELECT cpf_normalizado, COUNT(*) as total
      FROM familias
      WHERE cpf_normalizado IS NOT NULL AND cpf_normalizado <> ''
      GROUP BY cpf_normalizado
      HAVING COUNT(*) > 1
      ORDER BY total DESC, cpf_normalizado ASC
    `);

    if (dupCheck.rows.length > 0) {
      console.log(
        "⚠️ Foram encontradas duplicidades no cpf_normalizado. Índice único NÃO será criado agora."
      );
      console.table(dupCheck.rows.slice(0, 20));
      console.log("Total de valores duplicados:", dupCheck.rows.length);
      console.log(
        "\nSolução recomendada: corrigir manualmente as duplicidades ou consolidar registros antes de aplicar a unicidade."
      );
    } else {
      console.log(
        "Nenhuma duplicidade encontrada. Criando índice único parcial (IF NOT EXISTS)..."
      );
      await client.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS ux_familias_cpf_normalizado
        ON familias (cpf_normalizado)
        WHERE cpf_normalizado IS NOT NULL AND cpf_normalizado <> ''
      `);
      console.log("✔️ Índice único criado: ux_familias_cpf_normalizado");
    }

    console.log("\n=== Migração CPF Normalizado: FIM ===\n");
  } catch (err) {
    console.error(
      "❌ Erro ao executar migração de CPF normalizado:",
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
