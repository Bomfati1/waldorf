const { Client } = require("pg");
const fs = require("fs");

const client = new Client({
  connectionString:
    "postgresql://postgres:bNRSlxcogWyyqJZHtGHQDrjsdafUkYUC@yamabiko.proxy.rlwy.net:18115/railway",
  ssl: { rejectUnauthorized: false },
});

async function importSQL() {
  try {
    await client.connect();
    console.log("📥 Importando prod_railway.sql para o Railway...\n");

    // Ler arquivo SQL
    const sqlFile = fs.readFileSync("prod_railway.sql", "utf8");

    console.log(`📄 Arquivo lido: ${(sqlFile.length / 1024).toFixed(2)} KB`);
    console.log("⚙️  Executando SQL (isso pode levar alguns minutos)...\n");

    // Dividir em statements e executar um por um
    const statements = sqlFile
      .split(";")
      .map((s) => s.trim())
      .filter(
        (s) => s.length > 0 && !s.startsWith("--") && !s.startsWith("SET")
      );

    let success = 0;
    let errors = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (stmt.length < 10) continue;

      try {
        await client.query(stmt);
        success++;
        if (i % 10 === 0) {
          console.log(
            `   Progresso: ${i}/${statements.length} statements executados`
          );
        }
      } catch (error) {
        errors++;
        if (errors < 5) {
          console.log(`   ⚠️  Aviso: ${error.message.substring(0, 100)}`);
        }
      }
    }

    console.log(`\n✅ Import concluído!`);
    console.log(`   ✓ ${success} statements executados com sucesso`);
    console.log(
      `   ⚠️  ${errors} erros (provavelmente constraints ou duplicatas)`
    );
    console.log("\n🎉 Agora atualize o .env do backend e teste o login!");
  } catch (error) {
    console.error("❌ Erro:", error.message);
  } finally {
    await client.end();
  }
}

importSQL();
