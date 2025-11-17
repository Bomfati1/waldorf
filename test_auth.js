// Script para testar autenticação e notificações

// 1. Abra o console do navegador (F12)
// 2. Cole este script
// 3. Execute

console.log("🔍 Testando autenticação...");

// Verificar cookies
const cookies = document.cookie;
console.log("🍪 Cookies atuais:", cookies);

if (!cookies.includes("token")) {
  console.log("⚠️ PROBLEMA: Cookie de autenticação não encontrado!");
  console.log("📝 SOLUÇÃO:");
  console.log("   1. Faça logout");
  console.log("   2. Faça login novamente");
  console.log("   3. Verifique se o backend está rodando");
} else {
  console.log("✅ Cookie de autenticação encontrado!");

  // Testar requisição de notificações
  fetch("http://localhost:3001/notificacoes", {
    credentials: "include",
  })
    .then((response) => {
      console.log("📡 Status da resposta:", response.status);
      if (response.ok) {
        console.log("✅ Autenticação funcionando!");
        return response.json();
      } else {
        console.log("❌ Erro de autenticação. Status:", response.status);
        console.log("💡 Faça logout e login novamente");
      }
    })
    .then((data) => {
      if (data) {
        console.log("📦 Notificações:", data);
      }
    })
    .catch((error) => {
      console.log("❌ Erro na requisição:", error);
    });
}
