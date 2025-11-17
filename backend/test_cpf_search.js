require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const cpfComMascara = "881.901.750-41";
const cpfSemMascara = "88190175041";

async function testCPF() {
  try {
    console.log("🔍 Testando busca de CPF: 881.901.750-41\n");

    // Teste 1: CPF com máscara
    console.log("1️⃣ Buscando COM máscara (881.901.750-41):");
    const result1 = await pool.query(
      "SELECT id, nome_completo, cpf FROM familias WHERE cpf = $1",
      [cpfComMascara]
    );
    console.log(`   Resultado: ${result1.rows.length} registros`);
    if (result1.rows.length) console.log("   Dados:", result1.rows[0]);
    console.log("");

    // Teste 2: CPF sem máscara
    console.log("2️⃣ Buscando SEM máscara (88190175041):");
    const result2 = await pool.query(
      "SELECT id, nome_completo, cpf FROM familias WHERE cpf = $1",
      [cpfSemMascara]
    );
    console.log(`   Resultado: ${result2.rows.length} registros`);
    if (result2.rows.length) console.log("   Dados:", result2.rows[0]);
    console.log("");

    // Teste 3: LIKE para encontrar qualquer formato
    console.log("3️⃣ Buscando com LIKE %881%:");
    const result3 = await pool.query(
      "SELECT id, nome_completo, cpf FROM familias WHERE cpf LIKE $1",
      ["%881%"]
    );
    console.log(`   Resultado: ${result3.rows.length} registros`);
    if (result3.rows.length) {
      result3.rows.forEach((row) => {
        console.log(`   - ${row.nome_completo}: CPF = "${row.cpf}"`);
      });
    }
    console.log("");

    // Teste 4: Listar TODOS os CPFs cadastrados
    console.log("4️⃣ Listando TODOS os CPFs cadastrados:");
    const result4 = await pool.query(
      "SELECT id, nome_completo, cpf FROM familias WHERE cpf IS NOT NULL AND cpf != '' ORDER BY id LIMIT 10"
    );
    console.log(`   Total: ${result4.rows.length} responsáveis com CPF`);
    result4.rows.forEach((row) => {
      console.log(
        `   - ID ${row.id}: ${row.nome_completo} - CPF: "${row.cpf}"`
      );
    });
  } catch (error) {
    console.error("❌ Erro:", error.message);
  } finally {
    await pool.end();
  }
}

testCPF();
