// Shared PDF utilities for branding and header/footer rendering
// Loads the Waldorf logo from backend uploads and converts to a PNG data URL for jsPDF

const LOGO_URL =
  "http://localhost:3001/uploads/aluno_image/bf-fundo-trasnparente-pequeno-YNqrBazK8rUMjRGQ.avif";

let cachedLogoDataUrl = null;
let cachedLogoPromise = null;

export async function loadLogoDataUrl() {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  if (cachedLogoPromise) return cachedLogoPromise;

  cachedLogoPromise = new Promise(async (resolve, reject) => {
    try {
      const res = await fetch(LOGO_URL, {
        mode: "cors",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Falha ao carregar logo: ${res.status}`);
      const blob = await res.blob();
      const imgBitmap = await createImageBitmap(blob);
      const canvas = document.createElement("canvas");
      canvas.width = imgBitmap.width;
      canvas.height = imgBitmap.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(imgBitmap, 0, 0);
      cachedLogoDataUrl = canvas.toDataURL("image/png");
      resolve(cachedLogoDataUrl);
    } catch (err) {
      console.error("Erro ao carregar/convertar logo:", err);
      // Fallback: resolve null to allow proceeding without logo
      cachedLogoDataUrl = null;
      resolve(null);
    }
  });

  return cachedLogoPromise;
}

// Draws a standardized header. Returns the y position to start content.
export async function drawHeader(doc, { title, subtitle, rightText } = {}) {
  const pageWidth = doc.internal.pageSize.getWidth();
  let yLogo = 10;
  let xLogo = 15;
  let logoW = 25;
  let logoH = 25;

  try {
    const logoDataUrl = await loadLogoDataUrl();
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, "PNG", xLogo, yLogo, logoW, logoH);
    }
  } catch (e) {
    // Logo falhou, segue sem imagem
  }

  // Brand title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 60, 114);
  doc.text("Portal Primavera Waldorf", 45, 18);

  if (title) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(title, 45, 26);
  }

  if (rightText) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(rightText, pageWidth - 15, 14, { align: "right" });
  }

  // Divider
  doc.setDrawColor(30, 60, 114);
  doc.setLineWidth(0.5);
  doc.line(15, 38, pageWidth - 15, 38);

  // Optional subtitle under the line
  let y = 45;
  if (subtitle) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(subtitle, 20, y);
    y += 10;
  }
  return y;
}

export function drawFooter(doc) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const totalPages = doc.internal.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(80, 80, 80);
    doc.text(
      "Relatório gerado automaticamente pelo Sistema Escola",
      pageWidth / 2,
      pageHeight - 15,
      { align: "center" }
    );
    doc.text(
      `Data de geração: ${new Date().toLocaleDateString(
        "pt-BR"
      )} às ${new Date().toLocaleTimeString("pt-BR")}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
    doc.setFont("helvetica", "normal");
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - 15, pageHeight - 10, {
      align: "right",
    });
  }
}

export function formatBRDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return new Date(
    d.getTime() + d.getTimezoneOffset() * 60000
  ).toLocaleDateString("pt-BR");
}
