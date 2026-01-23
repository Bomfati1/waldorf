// Teste completo do sistema de email com Resend
async function testSistemaCompleto() {
  console.log("🧪 Testando sistema completo de recuperação de senha...");

  const email = "matheusbomfati10@gmail.com";

  try {
    console.log("📡 Enviando solicitação para /recuperar-senha...");
    const response = await fetch('http://localhost:3001/recuperar-senha', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email })
    });

    const result = await response.json();

    console.log("📡 Status:", response.status);
    console.log("📧 Resposta:", result);

    if (response.ok) {
      console.log("✅ Sistema funcionando!");
      console.log("📧 Email enviado via Resend API");
      console.log("📧 Verifique seu email:", email);
      console.log("⏰ O link expira em 10 minutos");
    } else {
      console.log("❌ Erro na solicitação");
    }

  } catch (error) {
    console.log("❌ Erro de conexão:", error.message);
  }
}

testSistemaCompleto();