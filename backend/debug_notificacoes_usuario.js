/**
 * Script para verificar notificações de um usuário específico
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

async function verificarNotificacoesPorUsuario() {
  console.log("🔍 Verificando notificações por usuário...\n");

  try {
    // 1. Listar todos os usuários
    console.log("1️⃣ Listando todos os usuários:");
    const usuarios = await pool.query(
      "SELECT id, nome, email FROM usuarios ORDER BY id"
    );
    console.log(`   Total de usuários: ${usuarios.rows.length}\n`);

    usuarios.rows.forEach((u) => {
      console.log(`   - ID ${u.id}: ${u.nome} (${u.email})`);
    });

    // 2. Para cada usuário, verificar suas notificações
    console.log("\n2️⃣ Notificações por usuário:\n");

    for (const usuario of usuarios.rows) {
      const notifs = await pool.query(
        `
        SELECT 
          n.id,
          n.tipo,
          n.mensagem,
          n.lida,
          n.created_at,
          n.planejamento_id
        FROM notificacoes n
        WHERE n.usuario_id = $1
        ORDER BY n.created_at DESC
      `,
        [usuario.id]
      );

      console.log(`   👤 ${usuario.nome} (ID: ${usuario.id}):`);
      console.log(`      Total de notificações: ${notifs.rows.length}`);
      console.log(
        `      Não lidas: ${notifs.rows.filter((n) => !n.lida).length}`
      );

      if (notifs.rows.length > 0) {
        console.log(`      Últimas 3 notificações:`);
        notifs.rows.slice(0, 3).forEach((n) => {
          const status = n.lida ? "✅ Lida" : "📌 Não lida";
          console.log(
            `      - [${n.id}] ${n.tipo}: ${n.mensagem.substring(
              0,
              60
            )}... ${status}`
          );
        });
      } else {
        console.log(`      ⚠️ Nenhuma notificação encontrada`);
      }
      console.log("");
    }

    // 3. Verificar se há notificações sem usuário
    console.log("3️⃣ Verificando notificações órfãs (sem usuário válido):");
    const orfas = await pool.query(`
      SELECT n.*
      FROM notificacoes n
      LEFT JOIN usuarios u ON n.usuario_id = u.id
      WHERE u.id IS NULL
    `);

    if (orfas.rows.length > 0) {
      console.log(
        `   ⚠️ Encontradas ${orfas.rows.length} notificações sem usuário válido!`
      );
      orfas.rows.forEach((n) => {
        console.log(
          `   - Notificação ID ${n.id} para usuário inexistente ID ${n.usuario_id}`
        );
      });
    } else {
      console.log(`   ✅ Nenhuma notificação órfã encontrada`);
    }

    // 4. Criar notificação de teste para TODOS os usuários
    console.log("\n4️⃣ Criando notificação de teste para todos os usuários...");

    for (const usuario of usuarios.rows) {
      await pool.query(
        `
        INSERT INTO notificacoes (usuario_id, tipo, mensagem, planejamento_id, lida, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `,
        [
          usuario.id,
          "planejamento",
          `🧪 TESTE: Notificação criada em ${new Date().toLocaleString(
            "pt-BR"
          )}`,
          null,
          false,
        ]
      );
      console.log(
        `   ✅ Notificação de teste criada para ${usuario.nome} (ID: ${usuario.id})`
      );
    }

    console.log("\n✅ Verificação concluída!");
    console.log(
      "\n💡 Dica: Faça login com um dos usuários acima e clique no sino 🔔 para ver as notificações."
    );
  } catch (error) {
    console.error("\n❌ Erro:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    await pool.end();
  }
}

verificarNotificacoesPorUsuario();
