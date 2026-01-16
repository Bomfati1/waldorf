const { Pool } = require("pg");

// Conexão com Supabase (origem)
const supabase = new Pool({
  host: "db.jncwczixuzriuobrzico.supabase.co",
  port: 5432,
  user: "postgres",
  password: "8NwM3be-&NbFfpM",
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

// Conexão com Railway (destino)
const railway = new Pool({
  connectionString:
    "postgresql://postgres:bNRSlxcogWyyqJZHtGHQDrjsdafUkYUC@yamabiko.proxy.rlwy.net:18115/railway",
  ssl: { rejectUnauthorized: false },
});

async function copyTable(tableName) {
  try {
    console.log(`\n📋 Copiando tabela: ${tableName}`);

    // 1. Pegar estrutura da tabela (CREATE TABLE)
    const structureResult = await supabase.query(
      `
      SELECT 
        'CREATE TABLE ' || quote_ident(table_name) || ' (' ||
        string_agg(
          quote_ident(column_name) || ' ' || data_type || 
          CASE WHEN character_maximum_length IS NOT NULL 
            THEN '(' || character_maximum_length || ')' 
            ELSE '' END ||
          CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END,
          ', '
        ) || ');' as create_statement
      FROM information_schema.columns
      WHERE table_name = $1 AND table_schema = 'public'
      GROUP BY table_name
    `,
      [tableName]
    );

    if (structureResult.rows.length > 0) {
      // Criar tabela no Railway (ignorar se já existe)
      try {
        await railway.query(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
        console.log(`   ✓ Tabela removida (se existia)`);
      } catch (e) {
        // Ignorar erro se tabela não existe
      }
    }

    // 2. Pegar dados
    const dataResult = await supabase.query(`SELECT * FROM ${tableName}`);
    console.log(`   📊 ${dataResult.rows.length} linhas encontradas`);

    if (dataResult.rows.length > 0) {
      // 3. Inserir dados linha por linha
      for (const row of dataResult.rows) {
        const columns = Object.keys(row);
        const values = Object.values(row);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");

        const insertQuery = `
          INSERT INTO ${tableName} (${columns.join(", ")})
          VALUES (${placeholders})
          ON CONFLICT DO NOTHING
        `;

        await railway.query(insertQuery, values);
      }
      console.log(`   ✅ ${dataResult.rows.length} linhas copiadas`);
    }
  } catch (error) {
    console.error(`   ❌ Erro em ${tableName}:`, error.message);
  }
}

async function migrate() {
  try {
    console.log("🚀 Iniciando migração Supabase → Railway...\n");

    // Pegar lista de tabelas
    const tablesResult = await supabase.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log(`✅ ${tablesResult.rows.length} tabelas encontradas\n`);

    // Copiar cada tabela
    for (const { table_name } of tablesResult.rows) {
      await copyTable(table_name);
    }

    console.log("\n🎉 Migração concluída com sucesso!");
  } catch (error) {
    console.error("\n❌ Erro na migração:", error.message);
  } finally {
    await supabase.end();
    await railway.end();
  }
}

migrate();
