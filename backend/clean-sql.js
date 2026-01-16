const fs = require("fs");
const path = require("path");

console.log("🧹 Limpando prod_railway.sql...\n");

const sqlPath = path.join(__dirname, "prod_railway.sql");
const sqlContent = fs.readFileSync(sqlPath, "utf8");

console.log(`📄 Arquivo original: ${(sqlContent.length / 1024).toFixed(2)} KB`);

const lines = sqlContent.split("\n");
let cleanedLines = [];
let skipUntilSemicolon = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();

  // Pular comentários de TOC
  if (trimmed.startsWith("-- TOC entry")) {
    skipUntilSemicolon = false;
    continue;
  }

  // Pular linhas de metadados
  if (
    trimmed.startsWith("-- Name:") ||
    trimmed.startsWith("-- Type:") ||
    trimmed.startsWith("-- Schema:") ||
    trimmed.startsWith("-- Owner:")
  ) {
    continue;
  }

  // Pular comentários gerais
  if (trimmed.startsWith("--") && !trimmed.startsWith("---")) {
    continue;
  }

  // Pular linhas vazias consecutivas
  if (trimmed === "" && cleanedLines[cleanedLines.length - 1] === "") {
    continue;
  }

  // Remover comandos ALTER OWNER
  if (trimmed.startsWith("ALTER ") && trimmed.includes("OWNER TO")) {
    continue;
  }

  // Remover comandos SET desnecessários
  if (
    trimmed.startsWith("SET ") &&
    !trimmed.startsWith("SET search_path") &&
    !trimmed.startsWith("SET standard_conforming_strings")
  ) {
    continue;
  }

  cleanedLines.push(line);
}

const cleanedSQL = cleanedLines.join("\n");

// Salvar arquivo limpo
const cleanPath = path.join(__dirname, "prod_railway_clean.sql");
fs.writeFileSync(cleanPath, cleanedSQL, "utf8");

console.log(`✅ Arquivo limpo: ${(cleanedSQL.length / 1024).toFixed(2)} KB`);
console.log(`📝 Salvo em: prod_railway_clean.sql`);
console.log(
  `🔽 Redução: ${((1 - cleanedSQL.length / sqlContent.length) * 100).toFixed(
    1
  )}%\n`
);
