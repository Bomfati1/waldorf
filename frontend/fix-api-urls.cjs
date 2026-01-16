const fs = require('fs');
const path = require('path');

// Função recursiva para ler todos os arquivos JSX
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

// Função para atualizar um arquivo
function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // Verifica se já tem import do getApiUrl ou API_URL
  const hasGetApiUrl = content.includes('import { getApiUrl }') || content.includes('import { API_URL }');
  const hasApiImport = content.includes("from '../config/api'") || 
                       content.includes('from "../config/api"') ||
                       content.includes("from '../../config/api'") ||
                       content.includes('from "../../config/api"');
  
  // Se o arquivo tem localhost:3001 e não tem import do API
  if (content.includes('http://localhost:3001') && !hasApiImport) {
    // Adiciona o import no topo, após os outros imports do react/router
    const importRegex = /(import.*from ['"]react['"];?\n|import.*from ['"]react-router-dom['"];?\n)/g;
    const matches = content.match(importRegex);
    
    if (matches && matches.length > 0) {
      const lastImport = matches[matches.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const insertPosition = lastImportIndex + lastImport.length;
      
      // Determina o caminho relativo correto
      const relativePath = filePath.includes('\\pages\\') ? '../../config/api' : '../config/api';
      
      // Verifica se precisa de getApiUrl ou API_URL
      const needsGetApiUrl = /http:\/\/localhost:3001\/[^`"']/.test(content);
      const needsApiUrl = /http:\/\/localhost:3001\$\{/.test(content);
      
      let importStatement = '';
      if (needsGetApiUrl && needsApiUrl) {
        importStatement = `import { getApiUrl, API_URL } from "${relativePath}";\n`;
      } else if (needsGetApiUrl) {
        importStatement = `import { getApiUrl } from "${relativePath}";\n`;
      } else {
        importStatement = `import { API_URL } from "${relativePath}";\n`;
      }
      
      content = content.slice(0, insertPosition) + importStatement + content.slice(insertPosition);
      changed = true;
    }
  }
  
  // Substitui as URLs
  // Para URLs em template strings com variáveis: `http://localhost:3001/path/${var}`
  content = content.replace(/`http:\/\/localhost:3001(\/[^`]*)`/g, 'getApiUrl(`$1`)');
  
  // Para URLs simples em strings: "http://localhost:3001/path"
  content = content.replace(/"http:\/\/localhost:3001(\/[^"]*)"/g, 'getApiUrl("$1")');
  
  // Para URLs com concatenação: `http://localhost:3001${path}`
  content = content.replace(/`http:\/\/localhost:3001(\$\{[^}]+\}[^`]*)`/g, '`${API_URL}$1`');
  
  // Verifica se houve mudanças
  const originalContent = fs.readFileSync(filePath, 'utf8');
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Atualizado: ${path.relative(process.cwd(), filePath)}`);
    return true;
  }
  
  return false;
}

// Executa
const srcDir = path.join(__dirname, 'src');
const files = getAllJsxFiles(srcDir);

console.log(`🔍 Encontrados ${files.length} arquivos JSX/JS\n`);

let updated = 0;
files.forEach(file => {
  if (updateFile(file)) {
    updated++;
  }
});

console.log(`\n✨ Concluído! ${updated} arquivos atualizados.`);
