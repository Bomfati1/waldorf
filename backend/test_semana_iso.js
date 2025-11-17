require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const {
  getInfoSemanaISO,
  getSemanasISOMes,
  getNomeMes,
} = require("./utils/semanaUtils");

console.log("\n🧪 TESTE DO SISTEMA DE SEMANAS ISO\n");
console.log("=".repeat(60));

// Teste 1: Info de uma semana específica
console.log("\n📅 TESTE 1: Informações da Semana 18/2025");
console.log("-".repeat(60));
try {
  const semana18 = getInfoSemanaISO(2025, 18);
  console.log("✅ Semana ISO:", semana18.semanaISO);
  console.log("✅ Ano ISO:", semana18.anoISO);
  console.log("✅ Início:", semana18.inicioSemana);
  console.log("✅ Fim:", semana18.fimSemana);
  console.log(
    "✅ Meses abrangidos:",
    semana18.mesesAbrangidos.map((m) => getNomeMes(m)).join(", ")
  );
  console.log("✅ Compartilhada?", semana18.compartilhada ? "SIM 🔗" : "NÃO");
  console.log("✅ Dias da semana:", semana18.diasSemana.join(", "));
} catch (error) {
  console.error("❌ Erro:", error.message);
}

// Teste 2: Semanas de um mês
console.log("\n📊 TESTE 2: Todas as semanas de Maio/2025");
console.log("-".repeat(60));
try {
  const semanasMaio = getSemanasISOMes(2025, 5);
  console.log(`✅ Total de semanas em Maio: ${semanasMaio.length}\n`);

  semanasMaio.forEach((semana, index) => {
    const compartilhada = semana.compartilhada ? "🔗" : "  ";
    const meses = semana.mesesAbrangidos.map((m) => getNomeMes(m)).join(" + ");
    console.log(
      `${compartilhada} Semana ${semana.semanaISO}: ${semana.inicioSemana} a ${semana.fimSemana}`
    );
    console.log(`     Meses: ${meses}`);
  });
} catch (error) {
  console.error("❌ Erro:", error.message);
}

// Teste 3: Semanas compartilhadas do ano
console.log("\n🔗 TESTE 3: Semanas Compartilhadas em 2025");
console.log("-".repeat(60));
try {
  const semanasCompartilhadas = [];

  for (let mes = 1; mes <= 12; mes++) {
    const semanas = getSemanasISOMes(2025, mes);
    semanas.forEach((s) => {
      if (
        s.compartilhada &&
        !semanasCompartilhadas.find((sc) => sc.semanaISO === s.semanaISO)
      ) {
        semanasCompartilhadas.push(s);
      }
    });
  }

  console.log(
    `✅ Total de semanas compartilhadas no ano: ${semanasCompartilhadas.length}\n`
  );

  semanasCompartilhadas.slice(0, 10).forEach((semana) => {
    const meses = semana.mesesAbrangidos.map((m) => getNomeMes(m)).join(" e ");
    console.log(
      `🔗 Semana ${semana.semanaISO}: ${semana.inicioSemana} a ${semana.fimSemana}`
    );
    console.log(`   Compartilhada entre: ${meses}`);
  });

  if (semanasCompartilhadas.length > 10) {
    console.log(`\n   ... e mais ${semanasCompartilhadas.length - 10} semanas`);
  }
} catch (error) {
  console.error("❌ Erro:", error.message);
}

// Teste 4: Casos extremos
console.log("\n⚠️  TESTE 4: Casos Extremos");
console.log("-".repeat(60));

// Primeira semana do ano
try {
  const semana1 = getInfoSemanaISO(2025, 1);
  console.log(
    "✅ Semana 1/2025:",
    semana1.inicioSemana,
    "a",
    semana1.fimSemana
  );
  console.log(
    "   Meses:",
    semana1.mesesAbrangidos.map((m) => getNomeMes(m)).join(", ")
  );
} catch (error) {
  console.error("❌ Semana 1 erro:", error.message);
}

// Última semana do ano
try {
  const semana52 = getInfoSemanaISO(2025, 52);
  console.log(
    "✅ Semana 52/2025:",
    semana52.inicioSemana,
    "a",
    semana52.fimSemana
  );
  console.log(
    "   Meses:",
    semana52.mesesAbrangidos.map((m) => getNomeMes(m)).join(", ")
  );
} catch (error) {
  console.error("❌ Semana 52 erro:", error.message);
}

// Teste 5: Integração com banco de dados
console.log("\n🗄️  TESTE 5: Verificação do Banco de Dados");
console.log("-".repeat(60));

const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    // Verifica se as colunas existem
    const colunas = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'planejamentos' 
      AND column_name IN ('semana_iso', 'ano_iso')
      ORDER BY column_name
    `);

    if (colunas.rows.length === 2) {
      console.log(
        "✅ Colunas semana_iso e ano_iso existem na tabela planejamentos"
      );
      colunas.rows.forEach((col) => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log("❌ Colunas não encontradas! Execute a migration.");
    }

    // Verifica índices
    const indices = await pool.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'planejamentos' 
      AND indexname LIKE '%semana_iso%'
    `);

    if (indices.rows.length > 0) {
      console.log("✅ Índices criados:");
      indices.rows.forEach((idx) => {
        console.log(`   - ${idx.indexname}`);
      });
    }

    // Estatísticas de planejamentos
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(semana_iso) as com_iso,
        COUNT(DISTINCT ano_iso) as anos_diferentes,
        MIN(semana_iso) as menor_semana,
        MAX(semana_iso) as maior_semana
      FROM planejamentos
    `);

    console.log("\n📊 Estatísticas dos Planejamentos:");
    console.log(`   Total: ${stats.rows[0].total}`);
    console.log(`   Com semana ISO: ${stats.rows[0].com_iso}`);
    console.log(`   Anos diferentes: ${stats.rows[0].anos_diferentes}`);
    console.log(`   Menor semana: ${stats.rows[0].menor_semana}`);
    console.log(`   Maior semana: ${stats.rows[0].maior_semana}`);

    // Exemplo de planejamentos com semana ISO
    const exemplos = await pool.query(`
      SELECT 
        id_planejamento,
        turma_id,
        ano_iso,
        semana_iso,
        mes,
        semana,
        status
      FROM planejamentos 
      WHERE semana_iso IS NOT NULL
      ORDER BY ano_iso, semana_iso
      LIMIT 5
    `);

    if (exemplos.rows.length > 0) {
      console.log("\n📋 Exemplos de Planejamentos:");
      exemplos.rows.forEach((p) => {
        console.log(
          `   ID ${p.id_planejamento}: Turma ${p.turma_id}, Semana ISO ${p.semana_iso}/${p.ano_iso}, Status: ${p.status}`
        );
      });
    }
  } catch (error) {
    console.error("❌ Erro ao verificar banco:", error.message);
  } finally {
    await pool.end();

    console.log("\n" + "=".repeat(60));
    console.log("✅ TESTES CONCLUÍDOS!\n");
  }
})();
