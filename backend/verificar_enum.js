require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function verificarEnum() {
  try {
    // Consultar os valores permitidos no enum
    const result = await pool.query(`
      SELECT e.enumlabel 
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid 
      WHERE t.typname = 'user_role'
      ORDER BY e.enumsortorder;
    `);

    console.log("✅ Valores aceitos pelo enum user_role:");
    result.rows.forEach((row, i) => {
      console.log(`   ${i + 1}. "${row.enumlabel}"`);
    });

    // Verificar também usuários existentes
    const usuarios = await pool.query("SELECT cargo FROM usuarios LIMIT 10");
    console.log("\n📋 Cargos de usuários existentes:");
    usuarios.rows.forEach((u) => console.log(`   - "${u.cargo}"`));
  } catch (error) {
    console.error("❌ Erro:", error.message);
  } finally {
    await pool.end();
  }
}

verificarEnum();
