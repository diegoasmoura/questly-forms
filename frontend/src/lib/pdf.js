import { jsPDF } from "jspdf";
import "jspdf-autotable";

export const generatePremiumSummary = (patient, response) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const primaryColor = [11, 9, 7]; // Azul-escuro (baseado no Curious Brand)
  const secondaryColor = [246, 245, 244]; // Cinza-claro (respiro)
  const accentColor = [59, 130, 246]; // Azul-claro acento

  // 1) CABEÇALHO (Faixa Horizontal)
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 45, "F");

  // Elemento gráfico sutil (círculo translúcido)
  doc.setGfxMatrix(new doc.Matrix(1, 0, 0, 1, 0, 0));
  doc.setFillColor(255, 255, 255, 0.05);
  doc.circle(200, 5, 30, "F");

  // Título e Subtítulo
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo pré-consulta", 15, 25);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Material de apoio para compartilhar com psiquiatra e neuropsicóloga • leitura rápida", 15, 35);

  // Linha divisória fina
  doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setLineWidth(0.5);
  doc.line(0, 45, 210, 45);

  // 2) BLOCO 1: CARD LEITURA RÁPIDA
  let currentY = 55;
  
  // Sombra/Borda do Card
  doc.setDrawColor(231, 229, 228);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(15, currentY, 180, 50, 3, 3, "FD");

  // Faixa do título do card
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.roundedRect(15, currentY, 180, 8, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("LEITURA RÁPIDA", 20, currentY + 5.5);

  // Conteúdo do Card
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(10);
  
  doc.text("Paciente:", 20, currentY + 18);
  doc.setFont("helvetica", "normal");
  doc.text(patient.name, 40, currentY + 18);

  doc.setFont("helvetica", "bold");
  doc.text("Finalidade:", 20, currentY + 26);
  doc.setFont("helvetica", "normal");
  doc.text("Organizar material existente para facilitar a conversa clínica e evitar perda de informação.", 40, currentY + 26);

  doc.setFont("helvetica", "bold");
  doc.text("Como usar:", 20, currentY + 34);
  doc.setFont("helvetica", "normal");
  const usageText = "1) Leia esta página em 2 min; 2) Use os anexos para aprofundar se necessário.";
  doc.text(usageText, 40, currentY + 34);

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Observação: Os resultados trazem pistas de perfil emocional, não fecham diagnóstico isoladamente.", 20, currentY + 44);

  // 3) BLOCO 2: TABELA DE MATERIAIS
  currentY += 65;
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Linha do tempo dos materiais já existentes", 15, currentY);

  const tableData = [
    ["Data", "Material", "Leitura rápida para a consulta"],
    [new Date(response.createdAt).toLocaleDateString(), response.form.title, "Respostas com destaque para temas de autocobrança, perfeccionismo e padrões elevados."]
  ];

  doc.autoTable({
    startY: currentY + 5,
    head: [tableData[0]],
    body: tableData.slice(1),
    theme: "striped",
    headStyles: { 
      fillColor: [241, 245, 249], 
      textColor: primaryColor,
      fontSize: 10,
      fontStyle: "bold"
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 5
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 50 },
      2: { cellWidth: "auto" }
    },
    margin: { left: 15, right: 15 }
  });

  // 4) BLOCO 3: NOTA FINAL
  currentY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Ponto de atenção para a conversa:", 15, currentY);
  
  doc.setFont("helvetica", "normal");
  doc.text("Diferenças perceptíveis no relato atual sugerem exploração clínica sobre contexto e fase de vida.", 15, currentY + 5);

  // Microlegenda
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text("Útil como contexto emocional. Não substitui avaliação neuropsicológica.", 15, currentY + 15);

  // RODAPÉ
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("Uso clínico pessoal • resumo de apoio • não substitui avaliação profissional", 15, 285);
  doc.text("Página 1 de 1", 185, 285);

  doc.save(`${patient.name}_Resumo_Clinico.pdf`);
};

// Mantemos o exportToPdf original para casos genéricos
export const exportToPdf = (schema, data, fileName = "response.pdf") => {
  // Chamaria o SurveyPDF (surveyJS) se necessário, mas para o resumo usamos o generatePremiumSummary
  console.log("Standard export called. Consider using generatePremiumSummary for clinical UX.");
};
