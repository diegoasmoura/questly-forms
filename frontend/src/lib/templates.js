export const clinicalTemplates = [
  {
    id: "phq9",
    title: "PHQ-9: Questionário de Saúde do Paciente (Depressão)",
    description: "Ferramenta padrão ouro para rastreamento e monitoramento da gravidade da depressão.",
    schema: {
      title: "PHQ-9: Avaliação de Saúde",
      pages: [
        {
          name: "page1",
          elements: [
            {
              type: "matrix",
              name: "phq9_items",
              title: "Nas últimas 2 semanas, com que frequência você foi incomodado por qualquer um dos problemas abaixo?",
              columns: [
                { value: 0, text: "Nenhuma vez" },
                { value: 1, text: "Vários dias" },
                { value: 2, text: "Mais da metade dos dias" },
                { value: 3, text: "Quase todos os dias" }
              ],
              rows: [
                { value: "interest", text: "Pouco interesse ou prazer em fazer as coisas" },
                { value: "down", text: "Sentir-se para baixo, deprimido ou sem esperança" },
                { value: "sleep", text: "Dificuldade em pegar no sono ou permanecer dormindo, ou dormir demais" },
                { value: "energy", text: "Sentir-se cansado ou com pouca energia" },
                { value: "appetite", text: "Falta de apetite ou comendo demais" },
                { value: "failure", text: "Sentir-se mal consigo mesmo — ou achar que é um fracasso ou que decepcionou sua família ou a si próprio" },
                { value: "concentration", text: "Dificuldade para se concentrar nas coisas, como ler o jornal ou assistir à televisão" },
                { value: "movement", text: "Movimentar-se ou falar tão devagar que as outras pessoas percebam. Ou o oposto — estar tão agitado que você se movimenta muito mais do que o habitual" },
                { value: "suicide", text: "Pensamentos de que seria melhor morrer ou de se machucar de alguma maneira" }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    id: "gad7",
    title: "GAD-7: Escala de Transtorno de Ansiedade Generalizada",
    description: "Rastreador rápido para detectar e medir a gravidade dos sintomas de ansiedade.",
    schema: {
      title: "GAD-7: Avaliação de Ansiedade",
      pages: [
        {
          name: "page1",
          elements: [
            {
              type: "matrix",
              name: "gad7_items",
              title: "Nas últimas 2 semanas, com que frequência você foi incomodado pelos seguintes problemas?",
              columns: [
                { value: 0, text: "Nenhuma vez" },
                { value: 1, text: "Vários dias" },
                { value: 2, text: "Mais da metade dos dias" },
                { value: 3, text: "Quase todos os dias" }
              ],
              rows: [
                { value: "nervous", text: "Sentir-se nervoso, ansioso ou muito tenso" },
                { value: "control", text: "Não ser capaz de parar ou controlar a preocupação" },
                { value: "worrying", text: "Preocupar-se demais com diversas coisas" },
                { value: "relax", text: "Dificuldade para relaxar" },
                { value: "restless", text: "Estar tão inquieto que é difícil permanecer sentado" },
                { value: "annoyed", text: "Tornar-se facilmente irritável ou aborrecido" },
                { value: "afraid", text: "Sentir medo, como se algo terrível pudesse acontecer" }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    id: "anamnese_infantil",
    title: "Ficha de Anamnese Infantil (Inicial)",
    description: "Modelo para coleta de dados de desenvolvimento e histórico familiar em pediatria/psicologia infantil.",
    schema: {
      title: "Anamnese Infantil",
      showProgressBar: "top",
      pages: [
        {
          name: "dados_identificacao",
          title: "Identificação",
          elements: [
            { type: "text", name: "nome_crianca", title: "Nome da Criança", isRequired: true },
            { type: "text", name: "idade", title: "Idade", inputType: "number" },
            { type: "text", name: "responsavel", title: "Nome do Responsável" },
            { type: "comment", name: "queixa_principal", title: "Queixa Principal (Motivo da consulta)" }
          ]
        },
        {
          name: "histórico_desenvolvimento",
          title: "Histórico",
          elements: [
            { type: "radiogroup", name: "gestacao", title: "Como foi a gestação?", choices: ["Tranquila", "Com intercorrências", "Risco"] },
            { type: "text", name: "idade_andou", title: "Com que idade começou a andar?" },
            { type: "text", name: "idade_falou", title: "Com que idade começou a falar?" }
          ]
        }
      ]
    }
  }
];
