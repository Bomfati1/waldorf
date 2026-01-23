// Teste do Resend configurado
require("dotenv").config(); // Carregar variáveis de ambiente

async function testResendConfigurado() {
  console.log("🧪 Testando Resend configurado...");

  const apiKey = process.env.RESEND_API_KEY;
  console.log("🔑 API Key detectada:", apiKey ? "✅ Presente" : "❌ Ausente");
  console.log(
    "🔑 Valor da chave:",
    apiKey ? apiKey.substring(0, 10) + "..." : "N/A",
  );

  if (!apiKey || apiKey.includes("xxxxxxxxx")) {
    console.log("❌ RESEND_API_KEY não configurada corretamente");
    return;
  }

  // Teste direto da função sendEmailViaAPI
  try {
    console.log("📧 Testando envio via Resend API...");

    const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail, // Usar variável de ambiente ou padrão
        to: ["matheusbomfati10@gmail.com"], // Usando seu email real
        subject: "Teste - Sistema Escolar Resend",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">🎉 Resend Configurado!</h2>
            <p>Olá!</p>
            <p>Este é um email de teste para verificar se o Resend está funcionando corretamente.</p>
            <p>Se você recebeu este email, significa que:</p>
            <ul>
              <li>✅ API Key do Resend está correta</li>
              <li>✅ Conexão com Resend API está funcionando</li>
              <li>✅ Sistema de email está pronto para produção</li>
            </ul>
            <p><strong>Data do teste:</strong> ${new Date().toLocaleString("pt-BR")}</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">Este é um email automático de teste.</p>
          </div>
        `,
      }),
    });

    console.log("📡 Status da resposta:", response.status);

    if (!response.ok) {
      const error = await response.text();
      console.log("❌ Erro da API:", error);
      return;
    }

    const result = await response.json();
    console.log("✅ Email enviado com sucesso!");
    console.log("📧 ID do email:", result.id);
    console.log("📧 Verifique seu email: matheusbomfati10@gmail.com");
  } catch (error) {
    console.log("❌ Erro na requisição:", error.message);
  }
}

testResendConfigurado();
