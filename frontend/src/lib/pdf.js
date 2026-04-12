import { SurveyPDF } from "survey-pdf";

export const exportToPdf = (schema, data, fileName = "response.pdf") => {
  // Configurações profissionais para o PDF clínico
  const options = {
    fontSize: 12,
    margins: {
      left: 15,
      right: 15,
      top: 20,
      bottom: 20
    },
    format: "a4",
    compress: true,
    // Remover marcas d'água se possível (em modo dev pode aparecer)
    showNonCommercialPlayer: false
  };

  try {
    const surveyPDF = new SurveyPDF(schema, options);
    surveyPDF.data = data;
    
    // Adiciona cabeçalho customizado (Simulando papel timbrado)
    surveyPDF.onRenderHeader.add((_, canvas) => {
      canvas.drawText("Curious - Plataforma Clínica", {
        x: 15,
        y: 10,
        fontSize: 10,
        color: "#57534e"
      });
      canvas.drawLine({
        x1: 15,
        y1: 15,
        x2: 195,
        y2: 15,
        lineWidth: 0.5,
        color: "#e7e5e4"
      });
    });

    // Salva o arquivo
    surveyPDF.save(fileName);
  } catch (error) {
    console.error("PDF Export failed:", error);
    throw new Error("Failed to generate PDF. Please try again.");
  }
};
