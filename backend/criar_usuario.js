require("dotenv").config();
const bcrypt = require("bcrypt");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function criarUsuario() {
  const nome = "Administrador";
  const email = "admin@escola.com";
  const senha = "admin123"; // Troque pela senha desejada
  const cargo = "Administrador Geral"; // Valores: Administrador Geral, Administrador Pedagógico, Professor

  try {
    // Gerar hash da senha
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(senha, saltRounds);

    // Inserir no banco
    const result = await pool.query(
      "INSERT INTO usuarios (nome, email, senha, cargo) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, cargo",
      [nome, email.toLowerCase(), hashedPassword, cargo]
    );

    console.log("✅ Usuário criado com sucesso!");
    console.log(result.rows[0]);
    console.log(`\n📧 Email: ${email}`);
    console.log(`🔑 Senha: ${senha}`);
  } catch (error) {
    if (error.code === "23505") {
      console.error("❌ Este e-mail já está cadastrado!");
    } else {
      console.error("❌ Erro:", error.message);
    }
  } finally {
    await pool.end();
  }
}

criarUsuario();
