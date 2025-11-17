/**
 * Script de teste para verificar o sistema de notificações
 * Execute este script no terminal do backend com: node test_notificacoes.js
 */

const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function testarNotificacoes() {
  console.log("🔍 [TESTE] Iniciando testes de notificações...\n");

  try {
    // 1. Verificar se a tabela existe
    console.log("1️⃣ Verificando se a tabela notificacoes existe...");
    const tabelaExiste = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notificacoes'
      );
    `);
    console.log(
      "   Tabela existe:",
      tabelaExiste.rows[0].exists ? "✅ SIM" : "❌ NÃO"
    );

    if (!tabelaExiste.rows[0].exists) {
      console.log(
        "   ⚠️ ATENÇÃO: Tabela notificacoes não existe! Execute a migration primeiro."
      );
      return;
    }

    // 2. Verificar estrutura da tabela
    console.log("\n2️⃣ Verificando estrutura da tabela...");
    const estrutura = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'notificacoes'
      ORDER BY ordinal_position;
    `);
    console.log("   Colunas encontradas:");
    estrutura.rows.forEach((col) => {
      console.log(
        `   - ${col.column_name} (${col.data_type}) ${
          col.is_nullable === "NO" ? "⚠️ NOT NULL" : ""
        }`
      );
    });

    // 3. Verificar usuários ativos
    console.log("\n3️⃣ Verificando usuários...");
    const usuarios = await pool.query(`
      SELECT id, nome, email
      FROM usuarios
      LIMIT 5;
    `);
    console.log(`   Usuários encontrados: ${usuarios.rows.length}`);
    usuarios.rows.forEach((u) => {
      console.log(`   - ID ${u.id}: ${u.nome} (${u.email})`);
    });

    // 4. Contar notificações existentes
    console.log("\n4️⃣ Contando notificações existentes...");
    const total = await pool.query("SELECT COUNT(*) FROM notificacoes");
    console.log(`   Total de notificações: ${total.rows[0].count}`);

    // 5. Listar notificações por tipo
    console.log("\n5️⃣ Notificações por tipo...");
    const porTipo = await pool.query(`
      SELECT 
        tipo,
        COUNT(*) as total,
        COUNT(CASE WHEN lida = false THEN 1 END) as nao_lidas
      FROM notificacoes
      GROUP BY tipo
      ORDER BY total DESC;
    `);
    if (porTipo.rows.length > 0) {
      porTipo.rows.forEach((t) => {
        console.log(`   - ${t.tipo}: ${t.total} (${t.nao_lidas} não lidas)`);
      });
    } else {
      console.log("   Nenhuma notificação encontrada.");
    }

    // 6. Listar últimas 5 notificações
    console.log("\n6️⃣ Últimas 5 notificações...");
    const ultimas = await pool.query(`
      SELECT 
        id,
        usuario_id,
        tipo,
        mensagem,
        lida,
        created_at
      FROM notificacoes
      ORDER BY created_at DESC
      LIMIT 5;
    `);
    if (ultimas.rows.length > 0) {
      ultimas.rows.forEach((n) => {
        console.log(
          `   - [${n.id}] ${n.tipo} - ${n.mensagem.substring(0, 50)}... (${
            n.lida ? "Lida" : "Não lida"
          })`
        );
      });
    } else {
      console.log("   Nenhuma notificação encontrada.");
    }

    // 7. Criar notificação de teste (se houver usuários)
    if (usuarios.rows.length > 0) {
      console.log("\n7️⃣ Criando notificação de teste...");
      const usuarioTeste = usuarios.rows[0];
      const resultado = await pool.query(
        `
        INSERT INTO notificacoes (usuario_id, tipo, mensagem, planejamento_id, lida, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *;
      `,
        [
          usuarioTeste.id,
          "planejamento",
          "🧪 NOTIFICAÇÃO DE TESTE - Sistema funcionando corretamente!",
          null,
          false,
        ]
      );
      console.log("   ✅ Notificação de teste criada:");
      console.log("   -", JSON.stringify(resultado.rows[0], null, 2));
    }

    console.log("\n✅ [TESTE] Testes concluídos com sucesso!");
  } catch (error) {
    console.error("\n❌ [TESTE] Erro durante os testes:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    await pool.end();
  }
}

// Executar testes
testarNotificacoes();
