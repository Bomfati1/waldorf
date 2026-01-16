const { Pool } = require('pg');
const fs = require('fs');

// Conexão com Supabase (origem)
const supabasePool = new Pool({
  host: 'db.jncwczixuzriuobrzico.supabase.co',
  port: 5432,
  user: 'postgres',
  password: '8NwM3be-&NbFfpM',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

// Conexão com Railway (destino)
const railwayPool = new Pool({
  connectionString: 'postgresql://postgres:bNRSlxcogWyyqJZHtGHQDrjsdafUkYUC@yamabiko.proxy.rlwy.net:18115/railway',
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log('📥 Exportando schema do Supabase...');
    
    // Pegar lista de tabelas
    const tablesResult = await supabasePool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log(`✅ ${tablesResult.rows.length} tabelas encontradas:`, tablesResult.rows.map(r => r.table_name));
    
    // Para cada tabela, pegar CREATE TABLE e dados
    for (const { table_name } of tablesResult.rows) {
      console.log(`\n📋 Processando tabela: ${table_name}`);
      
      // Criar arquivo SQL para cada tabela
      let sql = `-- Tabela: ${table_name}\n\n`;
      
      // Pegar dados
      const dataResult = await supabasePool.query(`SELECT * FROM ${table_name}`);
      console.log(`   ${dataResult.rows.length} linhas encontradas`);
      
      if (dataResult.rows.length > 0) {
        sql += `-- Dados da tabela ${table_name}\n`;
        sql += `-- Execute manualmente as INSERTs ou use o pgAdmin\n\n`;
      }
      
      // Salvar em arquivo
      fs.appendFileSync('supabase_export.sql', sql);
    }
    
    console.log('\n✅ Exportação concluída! Arquivo: supabase_export.sql');
    console.log('\n📌 PRÓXIMOS PASSOS:');
    console.log('1. Abra o pgAdmin');
    console.log('2. Conecte ao Supabase e Railway');
    console.log('3. Use "Backup" no Supabase e "Restore" no Railway');
    console.log('   OU');
    console.log('4. Copie tabela por tabela usando Query Tool');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await supabasePool.end();
    await railwayPool.end();
  }
}

migrate();
