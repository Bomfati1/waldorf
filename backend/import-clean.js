const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  connectionString: 'postgresql://postgres:bNRSlxcogWyyqJZHtGHQDrjsdafUkYUC@yamabiko.proxy.rlwy.net:18115/railway',
  ssl: { rejectUnauthorized: false }
});

async function importCleanSQL() {
  try {
    console.log('🔗 Conectando ao Railway...\n');
    await client.connect();

    const sqlFile = fs.readFileSync('prod_railway_clean.sql', 'utf8');
    
    console.log(`📄 Importando: ${(sqlFile.length / 1024).toFixed(2)} KB`);
    console.log('⚙️  Executando SQL...\n');
    
    await client.query(sqlFile);
    
    console.log('✅ Import concluído!\n');
    console.log('📊 Verificando tabelas...\n');

    const result = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log(`✓ ${result.rows.length} tabelas importadas:`);
    result.rows.forEach(row => console.log(`  - ${row.table_name}`));
    
    console.log('\n🎉 Migração completa! Agora atualize o .env e teste o login.');
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

importCleanSQL();
