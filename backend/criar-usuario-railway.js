const { Client } = require('pg');
const bcrypt = require('bcrypt');

const client = new Client({
  connectionString: 'postgresql://postgres:bNRSlxcogWyyqJZHtGHQDrjsdafUkYUC@yamabiko.proxy.rlwy.net:18115/railway',
  ssl: { rejectUnauthorized: false }
});

async function criarUsuario() {
  try {
    await client.connect();
    console.log('🔗 Conectado ao Railway\n');
    
    // Dados do usuário
    const nome = 'Admin';
    const email = 'admin@escola.com';
    const senha = 'admin123';
    const cargo = 'Administrador Geral'; // Usar valor do enum
    
    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);
    
    // Inserir usuário
    const result = await client.query(`
      INSERT INTO usuarios (nome, email, senha, cargo, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (email) DO UPDATE 
      SET senha = $3, nome = $1, cargo = $4
      RETURNING id, nome, email, cargo
    `, [nome, email, senhaHash, cargo]);
    
    console.log('✅ Usuário criado/atualizado:');
    console.log(`   ID: ${result.rows[0].id}`);
    console.log(`   Nome: ${result.rows[0].nome}`);
    console.log(`   Email: ${result.rows[0].email}`);
    console.log(`   Cargo: ${result.rows[0].cargo}`);
    console.log(`\n🔑 Credenciais:`);
    console.log(`   Email: ${email}`);
    console.log(`   Senha: ${senha}`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

criarUsuario();
