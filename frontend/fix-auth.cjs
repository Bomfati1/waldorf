const fs = require('fs');
const path = require('path');

function getAllJsxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllJsxFiles(filePath, fileList);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // Verifica se já usa fetchWithAuth
  if (content.includes('fetchWithAuth')) {
    return false;
  }
  
  // Verifica se usa fetch(getApiUrl(
  const usesFetchWithGetApiUrl = /fetch\(getApiUrl\(/g.test(content);
  
  if (!usesFetchWithGetApiUrl) {
    return false;
  }
  
  // Atualiza o import para incluir fetchWithAuth
  if (content.includes("import { getApiUrl }")) {
    content = content.replace(
      /import { getApiUrl } from/g,
      "import { getApiUrl, fetchWithAuth } from"
    );
    changed = true;
  } else if (content.includes("import { getApiUrl,")) {
    // Já tem múltiplos imports, adiciona fetchWithAuth
    content = content.replace(
      /import { (getApiUrl[^}]*) } from/g,
      "import { $1, fetchWithAuth } from"
    );
    changed = true;
  }
  
  // Substitui fetch(getApiUrl( por fetchWithAuth(
  const originalContent = content;
  
  // Pattern 1: fetch(getApiUrl("/path"), {
  content = content.replace(
    /fetch\(getApiUrl\(([^)]+)\),\s*{/g,
    'fetchWithAuth($1, {'
  );
  
  // Pattern 2: fetch(getApiUrl("/path"))
  content = content.replace(
    /fetch\(getApiUrl\(([^)]+)\)\)/g,
    'fetchWithAuth($1)'
  );
  
  // Pattern 3: await fetch(getApiUrl
  content = content.replace(
    /await\s+fetch\(getApiUrl\(([^)]+)\),/g,
    'await fetchWithAuth($1,'
  );
  
  if (content !== originalContent) {
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Atualizado: ${path.relative(process.cwd(), filePath)}`);
    return true;
  }
  
  return false;
}

const srcDir = path.join(__dirname, 'src');
const files = getAllJsxFiles(srcDir);

console.log(`🔍 Encontrados ${files.length} arquivos JSX/JS\n`);

let updated = 0;
files.forEach(file => {
  if (updateFile(file)) {
    updated++;
  }
});

console.log(`\n✨ Concluído! ${updated} arquivos atualizados para usar fetchWithAuth.`);
