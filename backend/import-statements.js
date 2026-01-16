const { Client } = require("pg");
const fs = require("fs");

const client = new Client({
  connectionString:
    "postgresql://postgres:bNRSlxcogWyyqJZHtGHQDrjsdafUkYUC@yamabiko.proxy.rlwy.net:18115/railway",
  ssl: { rejectUnauthorized: false },
});

async function importByStatements() {
  try {
    console.log("🔗 Conectando ao Railway...\n");
    await client.connect();

    const sqlFile = fs.readFileSync("prod_railway_clean.sql", "utf8");
    console.log(`📄 Arquivo: ${(sqlFile.length / 1024).toFixed(2)} KB\n`);

    // Dividir por ; mas manter blocos CREATE TABLE juntos
    const statements = sqlFile
      .replace(/\n/g, " ")
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 10);

    console.log(`⚙️  Executando ${statements.length} statements...\n`);

    let executed = 0;
    let errors = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i] + ";";

      try {
        await client.query(stmt);
        executed++;

        if (i % 50 === 0) {
          console.log(`   ⏳ Progresso: ${i}/${statements.length}`);
        }
      } catch (error) {
        errors++;
        // Só mostrar erros relevantes
        if (
          !error.message.includes("already exists") &&
          !error.message.includes("does not exist") &&
          errors < 3
        ) {
          console.log(`   ⚠️  ${error.message.substring(0, 80)}`);
        }
      }
    }

    console.log(`\n✅ Concluído!`);
    console.log(`   ✓ ${executed} statements executados`);
    console.log(`   ⚠️  ${errors} avisos/erros ignorados\n`);

    // Verificar tabelas
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log(`📊 ${result.rows.length} tabelas no banco:`);
    result.rows.forEach((row) => console.log(`  - ${row.table_name}`));
  } catch (error) {
    console.error("\n❌ Erro fatal:", error.message);
  } finally {
    await client.end();
  }
}

importByStatements();
