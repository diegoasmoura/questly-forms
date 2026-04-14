import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const generatePremiumSummary = (patient, response) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  // Cores da Paleta Curious Premium
  const primaryColor = [11, 9, 7];    // Azul quase preto (Charcoal)
  const accentColor = [59, 130, 246];  // Azul clínico (Vibrant Blue)
  const textColor = [31, 41, 55];      // Cinza escuro para texto
  const lightGrey = [249, 250, 251];   // Fundo de cards

  // 1) CABEÇALHO (Faixa Superior)
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 40, "F");

  // Detalhe visual (Círculo decorativo no canto)
  doc.setFillColor(30, 30, 30); 
  doc.circle(200, 5, 35, "F");

  // Título e Subtítulo
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo Pré-consulta", 15, 22);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("MATERIAL DE APOIO CLÍNICO • LEITURA RÁPIDA (2 MINUTOS)", 15, 30);

  // Linha de acento inferior do cabeçalho
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(0, 40, 210, 1.5, "F");

  // 2) BLOCO 1: CARD DE LEITURA RÁPIDA
  let currentY = 52;
  
  doc.setFillColor(lightGrey[0], lightGrey[1], lightGrey[2]);
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(15, currentY, 180, 52, 2, 2, "FD");

  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(15, currentY, 180, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("INSIGHTS DE LEITURA RÁPIDA", 20, currentY + 5.5);

  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(10);
  
  doc.setFont("helvetica", "bold");
  doc.text("Paciente:", 20, currentY + 18);
  doc.setFont("helvetica", "normal");
  doc.text(patient.name, 45, currentY + 18);

  doc.setFont("helvetica", "bold");
  doc.text("Finalidade:", 20, currentY + 27);
  doc.setFont("helvetica", "normal");
  doc.text("Otimizar o tempo de consulta e reduzir a perda de informações clínicas.", 45, currentY + 27);

  doc.setFont("helvetica", "bold");
  doc.text("Como usar:", 20, currentY + 36);
  doc.setFont("helvetica", "normal");
  doc.text("1) Leia esta síntese; 2) Utilize a pág. 2 para notas; 3) Consulte o PDF completo se necessário.", 45, currentY + 36);

  doc.setFontSize(7.5);
  doc.setTextColor(107, 114, 128);
  doc.text("* Nota: Este documento é um material de apoio e não substitui avaliação diagnóstica formal.", 20, currentY + 47);

  // 3) BLOCO 2: LINHA DO TEMPO (TABELA USANDO autoTable DIRETAMENTE)
  currentY += 65;
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Histórico de Materiais Disponíveis", 15, currentY);

  const tableData = [
    [
      new Date(response.createdAt).toLocaleDateString(), 
      response.form.title, 
      "Análise de padrões: Destaque para autocobrança e perfeccionismo. Útil para exploração clínica."
    ]
  ];

  autoTable(doc, {
    startY: currentY + 6,
    head: [["Data", "Material / Teste", "Resumo para a Consulta"]],
    body: tableData,
    theme: "grid",
    headStyles: { 
      fillColor: [243, 244, 246], 
      textColor: [31, 41, 55],
      fontSize: 9,
      fontStyle: "bold",
      lineWidth: 0.1
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [55, 65, 81],
      cellPadding: 4
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 45 },
      2: { cellWidth: "auto" }
    },
    margin: { left: 15, right: 15 }
  });

  // 4) BLOCO 3: PONTO DE ATENÇÃO
  // Usamos doc.lastAutoTable.finalY ou pegamos o valor retornado pelo autoTable
  let finalY = doc.previousAutoTable.finalY;
  currentY = finalY + 15;
  
  doc.setFillColor(254, 252, 232); 
  doc.setDrawColor(254, 240, 138); 
  doc.roundedRect(15, currentY, 180, 18, 1, 1, "FD");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(133, 77, 14); 
  doc.text("PONTO DE ATENÇÃO CLÍNICA:", 20, currentY + 7);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text("Diferenças entre o relato atual e registros anteriores sugerem exploração sobre o contexto atual.", 20, currentY + 12);

  // RODAPÉ
  const footerY = 285;
  doc.setDrawColor(229, 231, 235);
  doc.line(15, footerY - 5, 195, footerY - 5);
  
  doc.setFontSize(7.5);
  doc.setTextColor(156, 163, 175);
  doc.text("USO CLÍNICO RESTRITO • DOCUMENTO GERADO PELA PLATAFORMA CURIOUS", 15, footerY);
  doc.text(`PÁGINA 1 DE 1`, 175, footerY);

  doc.save(`${patient.name.replace(/\s+/g, '_')}_Resumo_Clinico.pdf`);
};

export const exportToPdf = (schema, data, fileName = "response.pdf") => {
  console.log("PDF Standard fallback.");
};
