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
    id: "aaq_ii",
    title: "AAQ-II: Aceitacao e Acao",
    description: "Avaliacao de inflexibilidade experiencial (10 itens). Escala 1-7.",
    schema: {
      showProgressBar: true,
      widthMode: "responsive",
      pages: [
        {
          name: "intro",
          elements: [
            { type: "html", name: "intro", html: "<div style='padding:20px;'><h2>AAQ-II</h2><p>Avalie o quanto cada frase e verdadeira para voce.</p><p><strong>1 = Nunca verdade</strong> ate <strong>7 = Sempre verdade</strong></p></div>" }
          ]
        },
        {
          name: "itens",
          elements: [
            {
              type: "matrix",
              name: "aaq_items",
              columns: [
                { value: "1", text: "1" }, { value: "2", text: "2" }, { value: "3", text: "3" },
                { value: "4", text: "4" }, { value: "5", text: "5" }, { value: "6", text: "6" }, { value: "7", text: "7" }
              ],
              rows: [
                { value: "i1", text: "Uma experiencia desconfortavel e apenas isso, desconfortavel." },
                { value: "i2", text: "Eu me preocupo com meus sentimentos." },
                { value: "i3", text: "Eu percebo que meus pensamentos podem me impedir de fazer coisas." },
                { value: "i4", text: "E terrivel e posso nunca me sentir bem comigo mesmo." },
                { value: "i5", text: "Minhas emocoes me incapacitam." },
                { value: "i6", text: "Sinto-me em paz mesmo quando minhas emocoes estao fora de controle." },
                { value: "i7", text: "Emocoes desagradaveis sao sempre incapacitantes." },
                { value: "i8", text: "Preciso controlar emocoes para atingir meus objetivos." },
                { value: "i9", text: "Controlar emocoes significa sentir-me melhor." },
                { value: "i10", text: "Quando sinto uma emocao positiva, preciso trabalhar para mantê-la." }
              ],
              isAllRowsRequired: true
            }
          ]
        }
      ]
    }
  },
  {
    id: "faaq",
    title: "FAAQ",
    description: "Functional Acceptance (16 itens).",
    schema: {
      showProgressBar: true,
      widthMode: "responsive",
      pages: [
        { name: "itens", elements: [
          { type: "matrix", name: "faaq_items", columns: [{value:"1",text:"1"},{value:"2",text:"2"},{value:"3",text:"3"},{value:"4",text:"4"},{value:"5",text:"5"},{value:"6",text:"6"},{value:"7",text:"7"}],
            rows: [
              {value:"i1",text:"Eu tento evitar sentir emocoes negativas."},
              {value:"i2",text:"Eu me preocupo com emocoes atrapalhando."},
              {value:"i3",text:"Passo muito tempo pensando em emocoes."},
              {value:"i4",text:"Emocoes fazem perder oportunidades."},
              {value:"i5",text:"Incapaz de fazer quando perturbado."},
              {value:"i6",text:"Emocoes causam problemas."},
              {value:"i7",text:"Nao sei o que estou sentindo."},
              {value:"i8",text:"Esforco para nao sentir emocoes."},
              {value:"i9",text:"Emocoes interferem na vida."},
              {value:"i10",text:"Dificuldade em aproveitar."},
              {value:"i11",text:"Sei quao feliz/infeliz."},
              {value:"i12",text:"Emocoes nao afetam acoes."},
              {value:"i13",text:"Posso decidir perturbado."},
              {value:"i14",text:"Volto apos colapso."},
              {value:"i15",text:"Sinto bem com negatives."},
              {value:"i16",text:"Listo emocoes claramente."}
            ], isAllRowsRequired: true}
        ]}
      ]
    }
  },
  {
    id: "compact",
    title: "CompACT",
    description: "Comprehensive ACT (36 itens em 3 dimensoes).",
    schema: {
      showProgressBar: true,
      widthMode: "responsive",
      pages: [
        { name: "abertura", title: "Abertura a Experiencia", elements: [
          { type: "matrix", name: "compact_ab", columns: [{value:"0",text:"0"},{value:"1",text:"1"},{value:"2",text:"2"},{value:"3",text:"3"},{value:"4",text:"4"},{value:"5",text:"5"},{value:"6",text:"6"}],
            rows: [
              {value:"ab1",text:"Posso estar triste e ser produtivo."},
              {value:"ab2",text:"Sensacoes fisicas guiam decisoes."},
              {value:"ab3",text:"Nao evito pensamentos."},
              {value:"ab4",text:"Aceito sentir medo."},
              {value:"ab5",text:"Permito que neguem quando preciso."},
              {value:"ab6",text:"Nao preciso me sentir bem."},
              {value:"ab7",text:"Presto atencao sensacoes corporais."},
              {value:"ab8",text:"Permito emocoes dificeis."},
              {value:"ab9",text:"Capaz de sentir varias emocoes."},
              {value:"ab10",text:"Nao preciso eliminar emocoes."},
              {value:"ab11",text:"Ouço o que corpo diz."},
              {value:"ab12",text:"Permito sentimentos."}
            ], isAllRowsRequired: true}
        ]},
        { name: "engajamento", title: "Engajamento", elements: [
          { type: "matrix", name: "compact_en", columns: [{value:"0",text:"0"},{value:"1",text:"1"},{value:"2",text:"2"},{value:"3",text:"3"},{value:"4",text:"4"},{value:"5",text:"5"},{value:"6",text:"6"}],
            rows: [
              {value:"en1",text:"Mudo atencao quando preciso."},
              {value:"en2",text:"Vejo opcoes onde outros veem uma."},
              {value:"en3",text:"Vejo multiplas formas."},
              {value:"en4",text:"Mantenho foco distraido."},
              {value:"en5",text:"Mudo perspectiva."},
              {value:"en6",text:"Foco no momento atual."},
              {value:"en7",text:"Adapto estrategias."},
              {value:"en8",text:"Penso em formas diferentes."},
              {value:"en9",text:"Direciono atencao."},
              {value:"en10",text:"Recoloco atencao."},
              {value:"en11",text:"Mudo atencao conscientemente."},
              {value:"en12",text:"Vejo de diferentes angulos."}
            ], isAllRowsRequired: true}
        ]},
        { name: "valores", title: "Valores", elements: [
          { type: "matrix", name: "compact_va", columns: [{value:"0",text:"0"},{value:"1",text:"1"},{value:"2",text:"2"},{value:"3",text:"3"},{value:"4",text:"4"},{value:"5",text:"5"},{value:"6",text:"6"}],
            rows: [
              {value:"va1",text:"Sei o que e importante."},
              {value:"va2",text:"Me comprometo mesmo dificil."},
              {value:"va3",text:"Tenho direcao clara."},
              {value:"va4",text:"Trabalho com obstaculos."},
              {value:"va5",text:"Importo mais com significado."},
              {value:"va6",text:"Vida tem proposito."},
              {value:"va7",text:"Continuo apesar de contratempos."},
              {value:"va8",text:"Sei o que quero."},
              {value:"va9",text:"Acoes guiadas por valores."},
              {value:"va10",text:"Mantenho compromissos."},
              {value:"va11",text:"Tenho objetivos."},
              {value:"va12",text:"Escolhas aproximam do que importa."}
            ], isAllRowsRequired: true}
        ]}
      ]
    }
  },
  {
    id: "ysq_s",
    title: "YSQ-S: Triagem de Personalidade",
    description: "Yale Screener Questionnaire - Short (35 itens). Triagem de transtornos de personalidade.",
    schema: {
      showProgressBar: true,
      widthMode: "responsive",
      pages: [
        { name: "itens", elements: [
          { type: "matrix", name: "ysq_items", columns: [{value:"1",text:"1"},{value:"2",text:"2"},{value:"3",text:"3"},{value:"4",text:"4"},{value:"5",text:"5"}],
            rows: [
              {value:"i1",text:"Outros veem eu diferente do que eu sou."},
              {value:"i2",text:"Dificuldade em fazer amigos."},
              {value:"i3",text:"Preocupo muito com detalhes."},
              {value:"i4",text:"Humor muda rapido."},
              {value:"i5",text:"Brigas frequentes."},
              {value:"i6",text:"Sinto emptiness."},
              {value:"i7",text:"Coisa errada comigo."},
              {value:"i8",text:"Nao aguento ser ignorado."},
              {value:"i9",text:"Tudo precisa ser perfeito."},
              {value:"i10",text:"Raiva quando corrigido."},
              {value:"i11",text:"Medo de ser Abandonado."},
              {value:"i12",text:"Impaciencia."},
              {value:"i13",text:"Sentimentos feridos facil."},
              {value:"i14",text:"Culpa excessiva."},
              {value:"i15",text:"Instabilidade emocional."},
              {value:"i16",text:"Problemas em relaçöes intimas."},
              {value:"i17",text:"Raiva intensa."},
              {value:"i18",text:"Desconfianca."},
              {value:"i19",text:"Medo de nao ser bom enough."},
              {value:"i20",text:"Impulsividade."},
              {value:"i21",text:"Sentido de identidade confuso."},
              {value:"i22",text:"Vazio crônico."},
              {value:"i23",text:"Raiva inadequada."},
              {value:"i24",text:"Problemas com intimacy."},
              {value:"i25",text:"Medo de intimidade."},
              {value:"i26",text:"Instabilidade em relaciöes."},
              {value:"i27",text:"Ameaça de abandono."},
              {value:"i28",text:"Sinto-me inadequado."},
              {value:"i29",text:"Nao sei quem sou."},
              {value:"i30",text:"Sensibilidade a critica."},
              {value:"i31",text:"Desamparo."},
              {value:"i32",text:"Verdade diferente de outros."},
              {value:"i33",text:"Problemas em manter trabalho."},
              {value:"i34",text:"Descontrole emocional."},
              {value:"i35",text:"Ansiedade Social."}
            ], isAllRowsRequired: true}
        ]}
      ]
    }
  },
  {
    id: "ysq_l",
    title: "YSQ-L: Triagem de PersonalIDADE",
    description: "Yale Screener Questionnaire - Long (77 itens). Avaliacao completa de transtornos.",
    schema: {
      showProgressBar: true,
      widthMode: "responsive",
      pages: [
        { name: "page1", elements: [
          { type: "matrix", name: "ysql_1", columns: [{value:"1",text:"1"},{value:"2",text:"2"},{value:"3",text:"3"},{value:"4",text:"4"},{value:"5",text:"5"}],
            rows: [
              {value:"y1",text:"Outros me veem diferente."},
              {value:"y2",text:"Dificuldade em fazer amigos."},
              {value:"y3",text:"Preocupo com detalhes."},
              {value:"y4",text:"Humor muda rapido."},
              {value:"y5",text:"Brigas frequentes."},
              {value:"y6",text:"Sinto vazio."},
              {value:"y7",text:"Algo errado comigo."},
              {value:"y8",text:"Nao aguento ser ignorado."},
              {value:"y9",text:"Tudo precisa ser perfeito."},
              {value:"y10",text:"Raiva quando corrigido."},
              {value:"y11",text:"Medo de ser abandonado."},
              {value:"y12",text:"Impaciencia."},
              {value:"y13",text:"Sentimentos feridos."},
              {value:"y14",text:"Culpa excessiva."},
              {value:"y15",text:"Instabilidade emocional."},
              {value:"y16",text:"Problemas em relaciöes."},
              {value:"y17",text:"Raiva intensa."},
              {value:"y18",text:"Desconfianca."},
              {value:"y19",text:"Medo de nao ser capaz."},
              {value:"y20",text:"Impulsividade."},
              {value:"y21",text:"Identidade confusa."},
              {value:"y22",text:"Vazio cronico."},
              {value:"y23",text:"Raiva inadequada."},
              {value:"y24",text:"Problemas com intimidade."},
              {value:"y25",text:"Medo de intimidade."},
              {value:"y26",text:"Instabilidade relaciöes."},
              {value:"y27",text:"Ameaca abandono."},
              {value:"y28",text:"Sinto-me inadequado."},
              {value:"y29",text:"Nao sei quem sou."},
              {value:"y30",text:"Sensibilidade critica."},
              {value:"y31",text:"Desamparo."},
              {value:"y32",text:"Verdade diferente."}
            ], isAllRowsRequired: true}
        ]},
        { name: "page2", elements: [
          { type: "matrix", name: "ysql_2", columns: [{value:"1",text:"1"},{value:"2",text:"2"},{value:"3",text:"3"},{value:"4",text:"4"},{value:"5",text:"5"}],
            rows: [
              {value:"y33",text:"Problemas em manter trabalho."},
              {value:"y34",text:"Descontrole emocional."},
              {value:"y35",text:"Ansiedade social."},
              {value:"y36",text:"Sinto-me diferente."},
              {value:"y37",text:"Nao me conecto."},
              {value:"y38",text:"Perfeccionismo."},
              {value:"y39",text:"Mudancas de humor."},
              {value:"y40",text:"Conflictos."},
              {value:"y41",text:"Sensacao vazio."},
              {value:"y42",text:"Problemas identidade."},
              {value:"y43",text:"Nao me enquadro."},
              {value:"y44",text:"Medo rejeicao."},
              {value:"y45",text:"Sinto nao pertencer."},
              {value:"y46",text:"Dificuldade confiar."},
              {value:"y47",text:"Solidao crônica."},
              {value:"y48",text:"Sinto nao ser querido."},
              {value:"y49",text:"Coisa errada."},
              {value:"y50",text:"Nao sei o que sinto."},
              {value:"y51",text:"Medo intimidade."},
              {value:"y52",text:"Sinto nao merece."},
              {value:"y53",text:"Dificuldade foco."},
              {value:"y54",text:"Pensamentos negativos."},
              {value:"y55",text:"Sinto nao presto."},
              {value:"y56",text:"Raiva constante."},
              {value:"y57",text:"Desesperanca."},
              {value:"y58",text:"Sinto-me sozinho."},
              {value:"y59",text:"Nao tenho valor."},
              {value:"y60",text:"Problemas em confiar."},
              {value:"y61",text:"Medo do futuro."},
              {value:"y62",text:"Sinto-me incompreendido."},
              {value:"y63",text:"Nao consigo relaxar."},
              {value:"y64",text:"Tenso a maior parte."},
              {value:"y65",text:"Preocupacoes exces."},
              {value:"y66",text:"Medos irracionais."},
              {value:"y67",text:"Pessimismo."},
              {value:"y68",text:"Sinto-me diferente."},
              {value:"y69",text:"Nao sei o que quero."},
              {value:"y70",text:"Indecision cronica."},
              {value:"y71",text:"Nao tenho objetivo."},
              {value:"y72",text:"Vida nao faz sentido."},
              {value:"y73",text:"Sem direcao."},
              {value:"y74",text:"Nao tenho proposito."},
              {value:"y75",text:"Confusao sobre mim."},
              {value:"y76",text:"Nao tenho identidade."},
              {value:"y77",text:"Problemas de perspectiva."}
            ], isAllRowsRequired: true}
        ]}
      ]
    }
  },
  {
    id: "ders",
    title: "DERS: Dificuldades Regulacao Emocional",
    description: "Difficulties in Emotion Regulation Scale (36 itens em 6 subescalas).",
    schema: {
      showProgressBar: true,
      widthMode: "responsive",
      pages: [
        { name: "intro", elements: [
          { type: "html", name: "intro", html: "<div style='padding:20px;'><h2>DERS</h2><p>Para cada frase, marque <strong>1 = Quase nunca</strong> ate <strong>5 = Quase sempre</strong></p></div>" }
        ]},
        { name: "aceite", title: "Nao Aceitacao", elements: [
          { type: "matrix", name: "ders_aceite", columns: [{value:"1",text:"1"},{value:"2",text:"2"},{value:"3",text:"3"},{value:"4",text:"4"},{value:"5",text:"5"}],
            rows: [
              {value:"a1",text:"Fico pensando em raiva."},
              {value:"a2",text:"Sinto que nao posso controlar emocoes."},
              {value:"a3",text:"Coisa ruim acontece se sentir."},
              {value:"a4",text:"Nao entendo meus sentimentos."},
              {value:"a5",text:"Sentimentos me dao medo."},
              {value:"a6",text:"Tenho pensamentos ruins."}
            ], isAllRowsRequired: true}
        ]},
        { name: "impulso", title: "Dificuldade em Engajar", elements: [
          { type: "matrix", name: "ders_impulso", columns: [{value:"1",text:"1"},{value:"2",text:"2"},{value:"3",text:"3"},{value:"4",text:"4"},{value:"5",text:"5"}],
            rows: [
              {value:"i1",text:"Dificuldade fazer atividades."},
              {value:"i2",text:"Problemas controlando comportamento."},
              {value:"i3",text:"Dificuldade controlar impulsos."},
              {value:"i4",text:"Raiva afecta fazer coisas."},
              {value:"i5",text:"Problemas pensando claramente."},
              {value:"i6",text:"Nao consigo parar sentimentos."}
            ], isAllRowsRequired: true}
        ]},
        { name: "consci", title: "Consciencia Emocional", elements: [
          { type: "matrix", name: "ders_consci", columns: [{value:"1",text:"1"},{value:"2",text:"2"},{value:"3",text:"3"},{value:"4",text:"4"},{value:"5",text:"5"}],
            rows: [
              {value:"c1",text:"Presto atencao aos sentimentos."},
              {value:"c2",text:"Percebo sensacoes corporais."},
              {value:"c3",text:"Sei o que estou sentindo."},
              {value:"c4",text:"Consciente de humores."},
              {value:"c5",text:"Identifico emocoes."},
              {value:"c6",text:"Sei como me sinto."}
            ], isAllRowsRequired: true}
        ]},
        { name: "estrateg", title: "Estratégias", elements: [
          { type: "matrix", name: "ders_estrateg", columns: [{value:"1",text:"1"},{value:"2",text:"2"},{value:"3",text:"3"},{value:"4",text:"4"},{value:"5",text:"5"}],
            rows: [
              {value:"e1",text:"Tenho ideias para sentir melhor."},
              {value:"e2",text:"Sei controlar humores."},
              {value:"e3",text:"Consigo melhorar humor."},
              {value:"e4",text:"Estratégias para regular."},
              {value:"e5",text:"Consigo controlar emocoes."},
              {value:"e6",text:"Sei o que fazer."}
            ], isAllRowsRequired: true}
        ]},
        { name: "clareza", title: "Clareza Emocional", elements: [
          { type: "matrix", name: "ders_clareza", columns: [{value:"1",text:"1"},{value:"2",text:"2"},{value:"3",text:"3"},{value:"4",text:"4"},{value:"5",text:"5"}],
            rows: [
              {value:"cl1",text:"Entendo minhas emocoes."},
              {value:"cl2",text:"Sei como me sinto."},
              {value:"cl3",text:"Clareza sobre sentimentos."},
              {value:"cl4",text:"Sei o que sinto."},
              {value:"cl5",text:"Consigo descrever."},
              {value:"cl6",text:"Entendo o que sinto."}
            ], isAllRowsRequired: true}
        ]}
      ]
    }
  },
  {
    id: "epm",
    title: "EPM: Escala de Regulacao Emocional",
    description: "Escala de Modulacao Emocional (26 itens).",
    schema: {
      showProgressBar: true,
      widthMode: "responsive",
      pages: [
        { name: "itens", elements: [
          { type: "matrix", name: "epm_items", columns: [{value:"1",text:"1"},{value:"2",text:"2"},{value:"3",text:"3"},{value:"4",text:"4"},{value:"5",text:"5"}],
            rows: [
              {value:"i1",text:"Consigo controlar emocoes."},
              {value:"i2",text:"Nao deixo sentimentos."},
              {value:"i3",text:"Quando irritado consigo."},
              {value:"i4",text:"Consigo acalmar."},
              {value:"i5",text:"Antes de demonstrar."},
              {value:"i6",text:"Sei expressar."},
              {value:"i7",text:"Experiencio emocoes."},
              {value:"i8",text:"Reconheco o que sinto."},
              {value:"i9",text:"Meu equilibrio emocional."},
              {value:"i10",text:"Dificuldade aceitar."},
              {value:"i11",text:"Medo nao conseguir."},
              {value:"i12",text:"Raiva me domina."},
              {value:"i13",text:"Fico fora de controle."},
              {value:"i14",text:"Sinto que nao aguento."},
              {value:"i15",text:"Fico confuso com feelings."},
              {value:"i16",text:"Perco controle."},
              {value:"i17",text:"Ansioso com emocoes."},
              {value:"i18",text:"Nao sei o que fazer."},
              {value:"i19",text:"Sinto que vou exploded."},
              {value:"i20",text:"Nao suporto sentir."},
              {value:"i21",text:"Consigo relaxar."},
              {value:"i22",text:"Pensamentos confusos."},
              {value:"i23",text:"Nao consigo pensar."},
              {value:"i24",text:"Sensivel demais."},
              {value:"i25",text:"Mudo de humor rapido."},
              {value:"i26",text:"Sinto-me vazio."}
            ], isAllRowsRequired: true}
        ]}
      ]
    }
  },
  {
    id: "urica",
    title: "URICA: Estagios de Mudanca",
    description: "University of Rhode Island Change (24 itens). Avalia estagios de mudanca.",
    schema: {
      showProgressBar: true,
      widthMode: "responsive",
      pages: [
        { name: "pre", elements: [
          { type: "html", name: "intro", html: "<div style='padding:20px;'><h2>URICA</h2><p>Para cada frase, marque: <strong>1 = Discordo forte</strong> ate <strong>5 = Concordo forte</strong></p></div>" }
        ]},
        { name: "precont", title: "Pre-contemplacao", elements: [
          { type: "matrix", name: "urica_pre", columns: [{value:"1",text:"1"},{value:"2",text:"2"},{value:"3",text:"3"},{value:"4",text:"4"},{value:"5",text:"5"}],
            rows: [
              {value:"p1",text:"Nao vejo problema."},
              {value:"p2",text:"Nao preciso mudar."},
              {value:"p3",text:"Outros tem problema."},
              {value:"p4",text:"Nao tenho problema."},
              {value:"p5",text:"Sofre por outros."},
              {value:"p6",text:"Nao intendi ter problema."}
            ], isAllRowsRequired: true}
        ]},
        { name: "cont", title: "Contemplacao", elements: [
          { type: "matrix", name: "urica_cont", columns: [{value:"1",text:"1"},{value:"2",text:"2"},{value:"3",text:"3"},{value:"4",text:"4"},{value:"5",text:"5"}],
            rows: [
              {value:"c1",text:"Pensando em mudar."},
              {value:"c2",text:"Planeja procurar ajuda."},
              {value:"c3",text:"Quero mudarmas difficile."},
              {value:"c4",text:"Considerando mudancas."},
              {value:"c5",text:"Esperanca que funcione."},
              {value:"c6",text:"Pensando em tratamento."}
            ], isAllRowsRequired: true}
        ]},
        { name: "acao", title: "Acao", elements: [
          { type: "matrix", name: "urica_acao", columns: [{value:"1",text:"1"},{value:"2",text:"2"},{value:"3",text:"3"},{value:"4",text:"4"},{value:"5",text:"5"}],
            rows: [
              {value:"a1",text:"Ja estou mudando."},
              {value:"a2",text:"Fazendo mudancas."},
              {value:"a3",text:"Trabalhando em mudanca."},
              {value:"a4",text:"Ja tem feito mudancas."},
              {value:"a5",text:"Agindo ativamente."},
              {value:"a6",text:"Em processo de mudanca."}
            ], isAllRowsRequired: true}
        ]},
        { name: "manut", title: "Manutencao", elements: [
          { type: "matrix", name: "urica_manut", columns: [{value:"1",text:"1"},{value:"2",text:"2"},{value:"3",text:"3"},{value:"4",text:"4"},{value:"5",text:"5"}],
            rows: [
              {value:"m1",text:"Consegui manter mudanca."},
              {value:"m2",text:"Mudanca duradoura."},
              {value:"m3",text:"Novas formas funcionando."},
              {value:"m4",text:"Consigo manter."},
              {value:"m5",text:"Satisfaito com mudanca."},
              {value:"m6",text:"Continuo novo caminho."}
            ], isAllRowsRequired: true}
        ]}
      ]
    }
  },
  {
    id: "meq",
    title: "MEQ: Expectativas de Maconha",
    description: "Marijuana Expectancy Questionnaire (_expectativas sobre maconha).",
    schema: {
      showProgressBar: true,
      widthMode: "responsive",
      pages: [
        { name: "intro", elements: [
          { type: "html", name: "intro", html: "<div style='padding:20px;'><h2>MEQ</h2><p>Avalie o quanto voce acredita que usar maconha leva a cada efeito: <strong>-3 = Forte descrenca</strong> ate <strong>+3 = Forte crenca</strong></p></div>" }
        ]},
        { name: "positivas", title: "Expectativas Positivas", elements: [
          { type: "matrix", name: "meq_pos", columns: [{value:"-3",text:"-3"},{value:"-2",text:"-2"},{value:"-1",text:"-1"},{value:"0",text:"0"},{value:"1",text:"1"},{value:"2",text:"2"},{value:"3",text:"3"}],
            rows: [
              {value:"pp1",text:"Relaxamento."},
              {value:"pp2",text:"Euforia."},
              {value:"pp3",text:"Sentir-se bem."},
              {value:"pp4",text:"Mais sociavel."},
              {value:"pp5",text:"Criatividade."},
              {value:"pp6",text:"Concentracao."},
              {value:"pp7",text:"Prazer."}
            ], isAllRowsRequired: true}
        ]},
        { name: "negativas", title: "Expectativas Negativas", elements: [
          { type: "matrix", name: "meq_neg", columns: [{value:"-3",text:"-3"},{value:"-2",text:"-2"},{value:"-1",text:"-1"},{value:"0",text:"0"},{value:"1",text:"1"},{value:"2",text:"2"},{value:"3",text:"3"}],
            rows: [
              {value:"pn1",text:"Perda de controle."},
              {value:"pn2",text:"Problemas de memoria."},
              {value:"pn3",text:"Dificuldade pensar."},
              {value:"pn4",text:"Paranoia."},
              {value:"pn5",text:"Vicio."},
              {value:"pn6",text:"Problemas sessoes."},
              {value:"pn7",text:"Ansiedade."}
            ], isAllRowsRequired: true}
        ]},
        { name: "neg_pess", title: "Efeitos Negativos", elements: [
          { type: "matrix", name: "meq_neg2", columns: [{value:"-3",text:"-3"},{value:"-2",text:"-2"},{value:"-1",text:"-1"},{value:"0",text:"0"},{value:"1",text:"1"},{value:"2",text:"2"},{value:"3",text:"3"}],
            rows: [
              {value:"pn8",text:"Agressividade."},
              {value:"pn9",text:"Confusao."},
              {value:"pn10",text:"Alienacao."},
              {value:"pn11",text:"Depressao."},
              {value:"pn12",text:"Descontrole."},
              {value:"pn13",text:"Letargia."},
              {value:"pn14",text:"Perda de motivacao."}
            ], isAllRowsRequired: true}
        ]}
      ]
    }
  },
  {
    id: "eq",
    title: "EQ: Inteligencia Emocional",
    description: "Escala de Inteligência Emocional (33 itens).",
    schema: {
      showProgressBar: true,
      widthMode: "responsive",
      pages: [
        { name: "intro", elements: [
          { type: "html", name: "intro", html: "<div style='padding:20px;'><h2>EQ</h2><p>Para cada frase, marque: <strong>1 = Discordo</strong> ate <strong>5 = Concordo</strong></p></div>" }
        ]},
        { name: "autoconsc", title: "Autoconsciencia", elements: [
          { type: "matrix", name: "eq_auto", columns: [{value:"1",text:"1"},{value:"2",text:"2"},{value:"3",text:"3"},{value:"4",text:"4"},{value:"5",text:"5"}],
            rows: [
              {value:"au1",text:"Conheco meus sentimentos."},
              {value:"au2",text:"Sei quando estou triste."},
              {value:"au3",text:"Reconheco emocoes."},
              {value:"au4",text:"Entendo o que sinto."},
              {value:"au5",text:"Sei como me sinto."},
              {value:"au6",text:"Identifico sentfisicos."},
              {value:"au7",text:"Consciente de humores."},
              {value:"au8",text:"Percebo quando mudo."},
              {value:"au9",text:"Sei minhas reaccioes."},
              {value:"au10",text:"Perco quando muda humor."},
              {value:"au11",text:"Emocional perspicaz."}
            ], isAllRowsRequired: true}
        ]},
        { name: "autoreg", title: "Autoregrulacao", elements: [
          { type: "matrix", name: "eq_reg", columns: [{value:"1",text:"1"},{value:"2",text:"2"},{value:"3",text:"3"},{value:"4",text:"4"},{value:"5",text:"5"}],
            rows: [
              {value:"ar1",text:"Controlo emocoes."},
              {value:"ar2",text:"Nao me altero."},
              {value:"ar3",text:"Gerenciamento raiva."},
              {value:"ar4",text:"Tristeza passa rapido."},
              {value:"ar5",text:"Recupero do stress."},
              {value:"ar6",text:"Controlo impulsos."},
              {value:"ar7",text:"遇 calm em sit diff."},
              {value:"ar8",text:"Nao exajero feelings."},
              {value:"ar9",text:"Duravel emocionalmente."},
              {value:"ar10",text:"Equilibrio."},
              {value:"ar11",text:"Autocontrole."}
            ], isAllRowsRequired: true}
        ]},
        { name: "motv", title: "Motivacao", elements: [
          { type: "matrix", name: "eq_motv", columns: [{value:"1",text:"1"},{value:"2",text:"2"},{value:"3",text:"3"},{value:"4",text:"4"},{value:"5",text:"5"}],
            rows: [
              {value:"mo1",text:"Otimista."},
              {value:"mo2",text:"Perseguo objetivos."},
              {value:"mo3",text:"Superacao."},
              {value:"mo4",text:"Focado em resultados."},
              {value:"mo5",text:"Proseliga."},
              {value:"mo6",text:"Enfrento diff."},
              {value:"mo7",text:"Persistir com problemas."},
              {value:"mo8",text:"Dedication."},
              {value:"mo9",text:"Trabalho por sonhos."},
              {value:"mo10",text:"Autodeterminacao."},
              {value:"mo11",text:"Busca excelëncia."}
            ], isAllRowsRequired: true}
        ]},
        { name: "emp", title: "Empatia", elements: [
          { type: "matrix", name: "eq_emp", columns: [{value:"1",text:"1"},{value:"2",text:"2"},{value:"3",text:"3"},{value:"4",text:"4"},{value:"5",text:"5"}],
            rows: [
              {value:"em1",text:"Percebo sentimentos."},
              {value:"em2",text:"Sinto o que outros."},
              {value:"em3",text:"Coloco no lugar."},
              {value:"em4",text:"Compaxao."},
              {value:"em5",text:"Sensibilidade."},
              {value:"em6",text:"Cuido do outro."},
              {value:"em7",text:"Perspectiva do outro."},
              {value:"em8",text:"Identifico sentfisicos."},
              {value:"em9",text:"Sinto sympatia."},
              {value:"em10",text:"Entendo outros."},
              {value:"em11",text:"Harmonia social."}
            ], isAllRowsRequired: true}
        ]},
        { name: "skillsoc", title: "Habilidades Sociais", elements: [
          { type: "matrix", name: "eq_soc", columns: [{value:"1",text:"1"},{value:"2",text:"2"},{value:"3",text:"3"},{value:"4",text:"4"},{value:"5",text:"5"}],
            rows: [
              {value:"so1",text:"Trabalho em equipo."},
              {value:"so2",text:"Influencio outros."},
              {value:"so3",text:"Desenvolvimento."},
              {value:"so4",text:"Lider."},
              {value:"so5",text:"Colab prac."},
              {value:"so6",text:"Comunicacao."},
              {value:"so7",text:"Relaciöes posis."},
              {value:"so8",text:"Conectar."},
              {value:"so9",text:"Redes."},
              {value:"so10",text:"Negociar."},
              {value:"so11",text:"Gestão conflitos."}
            ], isAllRowsRequired: true}
        ]}
      ]
    }
  },
  {
    id: "vlq",
    title: "VLQ: Qualidades de Vida",
    description: "Valued Living Questionnaire (16 itens).",
    schema: {
      showProgressBar: true,
      widthMode: "responsive",
      pages: [
        { name: "valor", title: "Valores", elements: [
          { type: "matrix", name: "vlq_valor", columns: [{value:"1",text:"1"},{value:"2",text:"2"},{value:"3",text:"3"},{value:"4",text:"4"},{value:"5",text:"5"},{value:"6",text:"6"},{value:"7",text:"7"}],
            rows: [
              {value:"v1",text:"Familia."},
              {value:"v2",text:"Amigos."},
              {value:"v3",text:"Carreira."},
              {value:"v4",text:"Financas."},
              {value:"v5",text:"Saude."},
              {value:"v6",text:"Espiritual."},
              {value:"v7",text:"Recreacao."},
              {value:"v8",text:"Crescimento."}
            ], isAllRowsRequired: true}
        ]},
        { name: "acao", title: "Acao", elements: [
          { type: "matrix", name: "vlq_acao", columns: [{value:"1",text:"1"},{value:"2",text:"2"},{value:"3",text:"3"},{value:"4",text:"4"},{value:"5",text:"5"},{value:"6",text:"6"},{value:"7",text:"7"}],
            rows: [
              {value:"a1",text:"Familia age."},
              {value:"a2",text:"Amigos age."},
              {value:"a3",text:"Carreira age."},
              {value:"a4",text:"Financas age."},
              {value:"a5",text:"Saude age."},
              {value:"a6",text:"Espiritual age."},
              {value:"a7",text:"Recreacao age."},
              {value:"a8",text:"Crescimento age."}
            ], isAllRowsRequired: true}
        ]}
      ]
    }
  },
  {
    id: "cfq",
    title: "CFQ: Crencas sobre o Futuro",
    description: "Control Beliefs Questionnaire (23 itens).",
    schema: {
      showProgressBar: true,
      widthMode: "responsive",
      pages: [
        { name: "itens", elements: [
          { type: "matrix", name: "cfq_items", columns: [{value:"1",text:"1discordo"},{value:"2",text:"2"},{value:"3",text:"3"},{value:"4",text:"4concordo"}],
            rows: [
              {value:"c1",text:"Controlo meu futuro."},
              {value:"c2",text:"Posso influenciar."},
              {value:"c3",text:"Planejar ajuda."},
              {value:"c4",text:"Forca propria."},
              {value:"c5",text:"Decisoes minhas."},
              {value:"c6",text:"Sou responsavel."},
              {value:"c7",text:"Esforco compensa."},
              {value:"c8",text:"Posso mudar."},
              {value:"c9",text:"Determino destino."},
              {value:"c10",text:"Agindo fac diferenca."},
              {value:"c11",text:"Futuro depende mim."},
              {value:"c12",text:"Posso controlar."},
              {value:"c13",text:"Agir permite."},
              {value:"c14",text:"Participacao ativa."},
              {value:"c15",text:"Perseguir objetivos."},
              {value:"c16",text:"Perseveranca."},
              {value:"c17",text:"Persistir ate."},
              {value:"c18",text:"Determinacao."},
              {value:"c19",text:"Esforco resulta."},
              {value:"c20",text:"Autonomia."},
              {value:"c21",text:"Capacidade escolher."},
              {value:"c22",text:"Forca interior."},
              {value:"c23",text:"Nao sou victima."}
            ], isAllRowsRequired: true}
        ]}
      ]
    }
  },
  {
    id: "es",
    title: "ES: Escala de Satisfacao",
    description: "Escala de Satisfacao com a Vida (5 itens).",
    schema: {
      showProgressBar: true,
      widthMode: "responsive",
      pages: [
        { name: "itens", elements: [
          { type: "matrix", name: "es_items", columns: [{value:"1",text:"1 discordo"},{value:"2",text:"2"},{value:"3",text:"3"},{value:"4",text:"4"},{value:"5",text:"5 concordo"}],
            rows: [
              {value:"s1",text:"Vida ideal ate agora."},
              {value:"s2",text:"Condicoes vida sod."},
              {value:"s3",text:"Satisfeito com vida."},
              {value:"s4",text:"Consegui o que quer."},
              {value:"s5",text:"Mudaria tudo."}
            ], isAllRowsRequired: true}
        ]}
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
  },
  {
    id: "anamnese_neuro_adulto",
    title: "Anamnese Neuropsicológica - Adulto (Completa)",
    description: "Protocolo estruturado para avaliação neuropsicológica, abrangendo identificação do respondente, histórico médico, sintomas cognitivos e hábitos.",
    schema: {
      "firstPageIsStartPage": true,
      "startSurveyText": "Iniciar preenchimento",
      "pagePrevText": "Voltar",
      "pageNextText": "Próxima etapa",
      "completeText": "Finalizar",
      "showProgressBar": true,
      "showPreviewBeforeComplete": true,
      "previewMode": "answeredQuestions",
      "showQuestionNumbers": "off",
      "clearInvisibleValues": "onHidden",
      "completedHtml": "<h3>Questionário concluído.</h3><p>Revise as respostas e encaminhe para a equipe responsável pela avaliação.</p>",
      "widthMode": "responsive",
      "questionDescriptionLocation": "underInput",
      "questionErrorLocation": "bottom",
      "headerView": "advanced",
      "pages": [
        {
          "name": "inicio",
          "elements": [
            {
              "type": "html",
              "name": "intro_html",
              "html": "\n            <div style=\"max-width:860px;\">\n              <h2>Anamnese neuropsicológica de adulto</h2>\n              <p>Este formulário reúne informações sobre saúde, desenvolvimento, hábitos, escolaridade, trabalho e funcionamento atual para apoiar a avaliação neuropsicológica.</p>\n              <p><strong>Importante:</strong> a primeira etapa identifica <strong>quem está respondendo</strong>. A partir da etapa seguinte, todas as respostas devem se referir à <strong>pessoa avaliada (paciente)</strong>.</p>\n              <p>Quando uma pergunta não se aplicar ou você não souber responder, deixe em branco ou escolha a opção correspondente.</p>\n            </div>\n        "
            }
          ]
        },
        {
          "name": "identificacao_respondente",
          "title": "1. Identificação de quem está respondendo",
          "description": "Nesta etapa, informe apenas os dados da pessoa que está preenchendo o formulário agora.",
          "elements": [
            {
              "type": "radiogroup",
              "name": "respondent_type",
              "title": "Quem está preenchendo este formulário?",
              "choices": [
                {
                  "value": "self",
                  "text": "A própria pessoa avaliada"
                },
                {
                  "value": "mae",
                  "text": "Mãe"
                },
                {
                  "value": "pai",
                  "text": "Pai"
                },
                {
                  "value": "conjuge",
                  "text": "Cônjuge / parceiro(a)"
                },
                {
                  "value": "filho",
                  "text": "Filho(a)"
                },
                {
                  "value": "irmao",
                  "text": "Irmão(ã)"
                },
                {
                  "value": "cuidador",
                  "text": "Cuidador(a)"
                },
                {
                  "value": "profissional",
                  "text": "Profissional de saúde"
                },
                {
                  "value": "outro",
                  "text": "Outro"
                }
              ],
              "isRequired": true,
              "colCount": 1,
              "description": "Selecione a opção que melhor descreve a person que está respondendo."
            },
            {
              "type": "text",
              "name": "respondent_type_other",
              "title": "Se marcou “Outro”, especifique",
              "visibleIf": "{respondent_type} = 'outro'"
            },
            {
              "type": "panel",
              "name": "respondent_basic_data",
              "title": "Dados de quem está respondendo",
              "elements": [
                {
                  "type": "text",
                  "name": "respondent_full_name",
                  "title": "Nome completo",
                  "isRequired": true,
                  "width": "48%",
                  "minWidth": "220px"
                },
                {
                  "type": "text",
                  "name": "respondent_birth_date",
                  "title": "Data de nascimento",
                  "inputType": "date",
                  "width": "20%",
                  "startWithNewLine": false,
                  "minWidth": "140px"
                },
                {
                  "type": "text",
                  "name": "respondent_phone",
                  "title": "Telefone",
                  "inputType": "tel",
                  "width": "22%",
                  "startWithNewLine": false,
                  "minWidth": "170px"
                },
                {
                  "type": "text",
                  "name": "respondent_age",
                  "title": "Idade",
                  "inputType": "number",
                  "width": "120px",
                  "startWithNewLine": true,
                  "minWidth": "120px"
                }
              ],
              "visibleIf": "{respondent_type} != 'self' and !empty({respondent_type})",
              "description": "Esses são os dados básicos de quem está respondendo. Eles podem ser preenchidos em linha única quando houver espaço na tela."
            },
            {
              "type": "html",
              "name": "respondent_patient_note",
              "html": "\n            <div style=\"padding:8px 12px;border-radius:8px;background:#f6f7f9;\">\n              <strong>A partir da próxima etapa, responda sempre sobre a pessoa avaliada (paciente).</strong>\n            </div>\n        "
            }
          ]
        },
        {
          "name": "informacoes_paciente",
          "title": "2. Informações complementares sobre a pessoa avaliada",
          "description": "A partir desta etapa, todas as respostas devem se referir à pessoa avaliada (paciente). Quando houver detalhamento complementar, ele aparecerá logo abaixo da pergunta correspondente.",
          "elements": [
            {
              "type": "panel",
              "name": "patient_address_panel",
              "title": "Endereço da pessoa avaliada",
              "elements": [
                {
                  "type": "text",
                  "name": "patient_zip_code",
                  "title": "CEP"
                },
                {
                  "type": "text",
                  "name": "patient_street",
                  "title": "Logradouro"
                },
                {
                  "type": "text",
                  "name": "patient_number",
                  "title": "Número"
                },
                {
                  "type": "text",
                  "name": "patient_complement",
                  "title": "Complemento"
                },
                {
                  "type": "text",
                  "name": "patient_neighborhood",
                  "title": "Bairro"
                },
                {
                  "type": "text",
                  "name": "patient_city",
                  "title": "Cidade"
                },
                {
                  "type": "text",
                  "name": "patient_state",
                  "title": "Estado"
                }
              ]
            },
            {
              "type": "panel",
              "name": "patient_birth_place_panel",
              "title": "Naturalidade da pessoa avaliada",
              "elements": [
                {
                  "type": "text",
                  "name": "patient_birth_city",
                  "title": "Cidade de nascimento"
                },
                {
                  "type": "text",
                  "name": "patient_birth_state",
                  "title": "Estado de nascimento"
                },
                {
                  "type": "text",
                  "name": "patient_birth_country",
                  "title": "País de nascimento"
                }
              ]
            },
            {
              "type": "radiogroup",
              "name": "speaks_other_languages",
              "title": "A pessoa avaliada fala outro(s) idioma(s)?",
              "choices": [
                {
                  "value": "sim",
                  "text": "Sim"
                },
                {
                  "value": "nao",
                  "text": "Não"
                },
                {
                  "value": "na",
                  "text": "Não sei / não se aplica"
                }
              ],
              "colCount": 3
            },
            {
              "type": "text",
              "name": "which_languages",
              "title": "Quais idiomas?",
              "visibleIf": "{speaks_other_languages} = 'sim'"
            },
            {
              "type": "comment",
              "name": "previous_medical_diagnoses",
              "title": "Diagnóstico(s) médico(s) prévio(s) da pessoa avaliada",
              "rows": 3,
              "placeholder": "Informe diagnósticos já estabelecidos, se houver."
            },
            {
              "type": "text",
              "name": "referred_by",
              "title": "Quem encaminhou a pessoa avaliada para esta avaliação?"
            }
          ]
        },
        {
          "name": "motivo_queixa",
          "title": "3. Motivo da avaliação e queixa principal",
          "description": "Esta etapa ajuda a entender a queixa principal, como ela começou e como tem evoluído.",
          "elements": [
            {
              "type": "panel",
              "name": "main_complaint_panel",
              "title": "Queixa principal e objetivos da avaliação",
              "elements": [
                {
                  "type": "comment",
                  "name": "main_reason_for_evaluation",
                  "title": "Qual é a principal dificuldade, sintoma ou motivo desta avaliação?",
                  "isRequired": true,
                  "rows": 4,
                  "placeholder": "Descreva, em poucas linhas, a principal queixa ou situação que motivou a avaliação."
                },
                {
                  "type": "comment",
                  "name": "main_questions",
                  "title": "Quais dúvidas, decisões ou objetivos esta avaliação deve ajudar a esclarecer?",
                  "rows": 4,
                  "placeholder": "Ex.: impacto na memória, capacidade para o trabalho, necessidade de tratamento, consequências de um acidente."
                }
              ]
            },
            {
              "type": "panel",
              "name": "main_problem_start_panel",
              "title": "Como a queixa principal começou",
              "elements": [
                {
                  "type": "radiogroup",
                  "name": "main_problem_context",
                  "title": "O início da queixa principal parece estar mais associado a qual situação?",
                  "choices": [
                    {
                      "value": "accident_or_injury",
                      "text": "Começou após acidente, queda, trauma ou outra lesão"
                    },
                    {
                      "value": "disease_or_condition",
                      "text": "Começou após doença ou outra condição de saúde"
                    },
                    {
                      "value": "gradual_without_specific_event",
                      "text": "Apareceu aos poucos, sem uma causa clara"
                    },
                    {
                      "value": "other",
                      "text": "Outra situação"
                    },
                    {
                      "value": "unknown",
                      "text": "Não sei informar"
                    }
                  ],
                  "colCount": 1,
                  "description": "Escolha a alternativa que melhor representa o início da queixa principal."
                },
                {
                  "type": "text",
                  "name": "accident_event_desc",
                  "title": "Qual foi o acidente, a lesão ou o trauma?",
                  "visibleIf": "{main_problem_context} = 'accident_or_injury'"
                },
                {
                  "type": "text",
                  "name": "accident_date",
                  "title": "Quando isso aconteceu? Informe a data ou um período aproximado.",
                  "visibleIf": "{main_problem_context} = 'accident_or_injury'",
                  "placeholder": "Ex.: março de 2024 / há cerca de 2 anos"
                },
                {
                  "type": "text",
                  "name": "disease_name",
                  "title": "Qual foi a doença ou condição de saúde associada ao início da queixa?",
                  "visibleIf": "{main_problem_context} = 'disease_or_condition'"
                },
                {
                  "type": "text",
                  "name": "disease_start_or_diagnosis_date",
                  "title": "Quando os sintomas começaram ou quando houve o diagnóstico?",
                  "visibleIf": "{main_problem_context} = 'disease_or_condition'",
                  "placeholder": "Ex.: no início de 2023 / diagnóstico em agosto de 2024"
                },
                {
                  "type": "text",
                  "name": "main_problem_context_other",
                  "title": "Se marcou “Outra situação”, descreva brevemente.",
                  "visibleIf": "{main_problem_context} = 'other'"
                }
              ]
            },
            {
              "type": "panel",
              "name": "support_and_evolution_panel",
              "title": "Apoio atual e evolução da queixa principal",
              "elements": [
                {
                  "type": "radiogroup",
                  "name": "symptom_status",
                  "title": "Atualmente, essa dificuldade parece:",
                  "choices": [
                    {
                      "value": "estaveis",
                      "text": "Estável"
                    },
                    {
                      "value": "aumentando_lentamente",
                      "text": "Piorando lentamente"
                    },
                    {
                      "value": "aumentando_rapidamente",
                      "text": "Piorando rapidamente"
                    },
                    {
                      "value": "melhorando",
                      "text": "Melhorando"
                    },
                    {
                      "value": "variavel",
                      "text": "Oscila bastante"
                    }
                  ],
                  "colCount": 1
                },
                {
                  "type": "radiogroup",
                  "name": "symptom_occurrence",
                  "title": "Com que frequência ela acontece?",
                  "choices": [
                    {
                      "value": "raramente",
                      "text": "Raramente"
                    },
                    {
                      "value": "ocasionalmente",
                      "text": "Às vezes"
                    },
                    {
                      "value": "frequentemente",
                      "text": "Com frequência"
                    },
                    {
                      "value": "sempre",
                      "text": "Quase sempre / o tempo todo"
                    }
                  ],
                  "colCount": 1
                },
                {
                  "type": "radiogroup",
                  "name": "symptoms_last_six_months",
                  "title": "Nos últimos 6 meses, ela:",
                  "choices": [
                    {
                      "value": "iguais",
                      "text": "Ficou parecida"
                    },
                    {
                      "value": "aumentaram",
                      "text": "Aumentou"
                    },
                    {
                      "value": "pioraram",
                      "text": "Piorou bastante"
                    },
                    {
                      "value": "diminuiram",
                      "text": "Diminuiu"
                    },
                    {
                      "value": "variaram",
                      "text": "Variou"
                    }
                  ],
                  "colCount": 1
                },
                {
                  "type": "comment",
                  "name": "what_may_help",
                  "title": "O que costuma aliviar ou reduzir essa dificuldade?",
                  "rows": 3
                },
                {
                  "type": "comment",
                  "name": "what_makes_worse",
                  "title": "O que costuma piorar essa dificuldade?",
                  "rows": 3
                },
                {
                  "type": "radiogroup",
                  "name": "has_caregiver",
                  "title": "A pessoa avaliada tem cuidador(a) ou alguém que ofereça ajuda regular no dia a dia?",
                  "choices": [
                    {
                      "value": "sim",
                      "text": "Sim"
                    },
                    {
                      "value": "nao",
                      "text": "Não"
                    },
                    {
                      "value": "na",
                      "text": "Não sei / não se aplica"
                    }
                  ],
                  "colCount": 3
                },
                {
                  "type": "text",
                  "name": "caregiver_relationship",
                  "title": "Qual é o grau de parentesco ou vínculo dessa pessoa?",
                  "visibleIf": "{has_caregiver} = 'sim'"
                },
                {
                  "type": "comment",
                  "name": "future_goals",
                  "title": "Quais são as metas e objetivos esperados com esta avaliação e para o futuro?",
                  "rows": 3
                }
              ],
              "description": "As perguntas abaixo aparecem em sequência. Quando houver uma resposta positiva, o campo de detalhamento será exibido logo abaixo."
            }
          ]
        },
        {
          "name": "historico_medico",
          "title": "4. Histórico médico e psiquiátrico",
          "description": "O detalhamento fica aberto de propósito para reduzir a chance de alguma informação importante passar despercebida. Preencha o que souber; o restante pode ficar em branco.",
          "elements": [
            {
              "type": "matrixdropdown",
              "name": "medical_history_conditions",
              "title": "Detalhamento do histórico médico e psiquiátrico",
              "rows": [
                {
                  "value": "cond_1",
                  "text": "Problemas na cabeça / traumatismo"
                },
                {
                  "value": "cond_2",
                  "text": "Perda da consciência"
                },
                {
                  "value": "cond_3",
                  "text": "Acidentes automobilísticos"
                },
                {
                  "value": "cond_4",
                  "text": "Quedas altas / acidentes esportivos"
                },
                {
                  "value": "cond_5",
                  "text": "Ataque epilético / convulsões"
                },
                {
                  "value": "cond_6",
                  "text": "AVC (derrame)"
                },
                {
                  "value": "cond_7",
                  "text": "Já esteve em coma?"
                },
                {
                  "value": "cond_8",
                  "text": "Arteriosclerose"
                },
                {
                  "value": "cond_9",
                  "text": "Demência"
                },
                {
                  "value": "cond_10",
                  "text": "Infecções cerebrais (meningite etc.)"
                },
                {
                  "value": "cond_11",
                  "text": "Diabetes"
                },
                {
                  "value": "cond_12",
                  "text": "Doenças do coração"
                },
                {
                  "value": "cond_13",
                  "text": "Câncer"
                },
                {
                  "value": "cond_14",
                  "text": "Ferimento nas costas ou pescoço"
                },
                {
                  "value": "cond_15",
                  "text": "Doenças imunológicas / pulmão"
                },
                {
                  "value": "cond_16",
                  "text": "Envenenamento / exposição tóxica"
                },
                {
                  "value": "cond_17",
                  "text": "Cirurgias"
                },
                {
                  "value": "cond_18",
                  "text": "Problemas psiquiátricos"
                },
                {
                  "value": "cond_19",
                  "text": "Outros"
                }
              ],
              "columns": [
                {
                  "name": "teve_tem",
                  "title": "Teve / tem?",
                  "cellType": "radiogroup",
                  "choices": [
                    {
                      "value": "sim",
                      "text": "Sim"
                    },
                    {
                      "value": "nao",
                      "text": "Não"
                    }
                  ]
                },
                {
                  "name": "inicio_descricao",
                  "title": "Detalhes / data aproximada",
                  "cellType": "comment"
                }
              ],
              "alternateRows": true,
              "description": "Este quadro já fica aberto de propósito. Preencha os itens relevantes e use a coluna de detalhes para registrar época, início ou observações."
            },
            {
              "type": "panel",
              "name": "current_treatment_panel",
              "title": "Tratamentos atuais",
              "elements": [
                {
                  "type": "radiogroup",
                  "name": "current_medications",
                  "title": "A pessoa avaliada está tomando algum medicamento atualmente?",
                  "choices": [
                    {
                      "value": "sim",
                      "text": "Sim"
                    },
                    {
                      "value": "nao",
                      "text": "Não"
                    },
                    {
                      "value": "na",
                      "text": "Não sei / não se aplica"
                    }
                  ],
                  "colCount": 3
                },
                {
                  "type": "matrixdynamic",
                  "name": "current_medications_list",
                  "title": "Se sim, liste os medicamentos",
                  "columns": [
                    {
                      "name": "medicamento",
                      "title": "Medicamento",
                      "cellType": "text"
                    },
                    {
                      "name": "motivo",
                      "title": "Motivo",
                      "cellType": "text"
                    },
                    {
                      "name": "dosagem",
                      "title": "Dosagem",
                      "cellType": "text"
                    },
                    {
                      "name": "inicio_tratamento",
                      "title": "Início do tratamento",
                      "cellType": "text"
                    }
                  ],
                  "alternateRows": true,
                  "minRowCount": 1,
                  "addRowText": "Adicionar",
                  "removeRowText": "Remover",
                  "visibleIf": "{current_medications} = 'sim'"
                },
                {
                  "type": "radiogroup",
                  "name": "current_psychotherapy",
                  "title": "A pessoa avaliada está em psicoterapia ou tratamento psiquiátrico no momento?",
                  "choices": [
                    {
                      "value": "sim",
                      "text": "Sim"
                    },
                    {
                      "value": "nao",
                      "text": "Não"
                    },
                    {
                      "value": "na",
                      "text": "Não sei / não se aplica"
                    }
                  ],
                  "colCount": 3
                },
                {
                  "type": "text",
                  "name": "current_psychotherapy_start",
                  "title": "Quando esse acompanhamento começou?",
                  "visibleIf": "{current_psychotherapy} = 'sim'",
                  "placeholder": "Ex.: desde 2022 / começou há cerca de 6 meses"
                }
              ],
              "description": "As perguntas abaixo são independentes. Se houver resposta positiva, o campo de detalhamento aparece logo abaixo."
            }
          ]
        },
        {
          "name": "avaliacoes_exames",
          "title": "5. Avaliações prévias e exames recentes",
          "description": "Os quadros principais já aparecem abertos. Preencha somente o que for conhecido e relevante.",
          "elements": [
            {
              "type": "radiogroup",
              "name": "previous_psych_eval",
              "title": "A pessoa avaliada já realizou avaliação psicológica ou neuropsicológica anteriormente?",
              "choices": [
                {
                  "value": "sim",
                  "text": "Sim"
                },
                {
                  "value": "nao",
                  "text": "Não"
                },
                {
                  "value": "na",
                  "text": "Não sei / não se aplica"
                }
              ],
              "colCount": 3
            },
            {
              "type": "multipletext",
              "name": "previous_psych_eval_basic",
              "title": "Dados da avaliação anterior",
              "items": [
                {
                  "name": "psychologist_name",
                  "title": "Profissional ou serviço",
                  "inputType": "text"
                },
                {
                  "name": "evaluation_date",
                  "title": "Data",
                  "inputType": "date"
                },
                {
                  "name": "evaluation_reason",
                  "title": "Motivo da avaliação",
                  "inputType": "text"
                }
              ],
              "visibleIf": "{previous_psych_eval} = 'sim'"
            },
            {
              "type": "comment",
              "name": "previous_psych_eval_result",
              "title": "Resultado ou conclusão principal da avaliação anterior",
              "visibleIf": "{previous_psych_eval} = 'sim'",
              "rows": 3
            },
            {
              "type": "matrixdropdown",
              "name": "recent_exams",
              "title": "Exames e avaliações recentes",
              "rows": [
                {
                  "value": "exam_1",
                  "text": "Angiografia"
                },
                {
                  "value": "exam_2",
                  "text": "Exame de sangue"
                },
                {
                  "value": "exam_3",
                  "text": "Tomografia Computadorizada (CT)"
                },
                {
                  "value": "exam_4",
                  "text": "Ressonância Magnética (MRI)"
                },
                {
                  "value": "exam_5",
                  "text": "PET scan"
                },
                {
                  "value": "exam_6",
                  "text": "SPECT"
                },
                {
                  "value": "exam_7",
                  "text": "Radiografia do crânio"
                },
                {
                  "value": "exam_8",
                  "text": "Eletroencefalograma (EEG)"
                },
                {
                  "value": "exam_9",
                  "text": "Exame neurológico"
                }
              ],
              "columns": [
                {
                  "name": "resultado",
                  "title": "Resultado",
                  "cellType": "dropdown",
                  "choices": [
                    {
                      "value": "nao_realizado",
                      "text": "Não realizado"
                    },
                    {
                      "value": "normal",
                      "text": "Normal"
                    },
                    {
                      "value": "anormal",
                      "text": "Anormal"
                    }
                  ]
                }
              ],
              "alternateRows": true,
              "description": "Preencha apenas os exames conhecidos. Use “Não realizado” quando souber que o exame não foi feito. Os demais podem ficar em branco."
            },
            {
              "type": "comment",
              "name": "recent_exams_other",
              "title": "Outros exames recentes",
              "rows": 2
            },
            {
              "type": "radiogroup",
              "name": "has_current_medical_followup",
              "title": "A pessoa avaliada está em acompanhamento com alguma especialidade médica no momento?",
              "choices": [
                {
                  "value": "sim",
                  "text": "Sim"
                },
                {
                  "value": "nao",
                  "text": "Não"
                },
                {
                  "value": "na",
                  "text": "Não sei / não se aplica"
                }
              ],
              "colCount": 3
            },
            {
              "type": "text",
              "name": "treating_specialties",
              "title": "Quais especialidades acompanham a pessoa avaliada?",
              "visibleIf": "{has_current_medical_followup} = 'sim'",
              "description": "Ex.: neurologia, psiquiatria, cardiologia."
            },
            {
              "type": "panel",
              "name": "sensory_tests_panel",
              "title": "Últimos exames de visão e audição",
              "elements": [
                {
                  "type": "text",
                  "name": "last_vision_test_date",
                  "title": "Data do último teste de visão",
                  "placeholder": "Ex.: em 2024 / há cerca de 1 ano"
                },
                {
                  "type": "text",
                  "name": "last_hearing_test_date",
                  "title": "Data do último teste auditivo",
                  "placeholder": "Ex.: em 2024 / há cerca de 1 ano"
                }
              ],
              "description": "Se não souber a data exata, informe um período aproximado."
            }
          ]
        },
        {
          "name": "sintomas_fisicos_sensorio",
          "title": "6. Sintomas atuais: físico, motor e sensório",
          "description": "Os quadros abaixo já ficam abertos para facilitar o preenchimento. Marque e detalhe apenas o que for relevante.",
          "elements": [
            {
              "type": "matrixdropdown",
              "name": "motor_symptoms",
              "title": "Sintomas físicos e motores",
              "rows": [
                {
                  "value": "motor_1",
                  "text": "Fraqueza motora (pernas, braços)"
                },
                {
                  "value": "motor_2",
                  "text": "Tremores"
                },
                {
                  "value": "motor_3",
                  "text": "Tiques ou movimentos estranhos"
                },
                {
                  "value": "motor_4",
                  "text": "Problemas de equilíbrio"
                },
                {
                  "value": "motor_5",
                  "text": "Frequentemente bate nos objetos"
                },
                {
                  "value": "motor_6",
                  "text": "Desmaios"
                },
                {
                  "value": "motor_7",
                  "text": "Outros problemas motores"
                }
              ],
              "columns": [
                {
                  "name": "presenca",
                  "title": "Presença",
                  "cellType": "radiogroup",
                  "choices": [
                    {
                      "value": "sim",
                      "text": "Sim"
                    },
                    {
                      "value": "nao",
                      "text": "Não"
                    }
                  ]
                },
                {
                  "name": "lado",
                  "title": "Lado",
                  "cellType": "dropdown",
                  "choices": [
                    {
                      "value": "esq",
                      "text": "Esq"
                    },
                    {
                      "value": "dir",
                      "text": "Dir"
                    },
                    {
                      "value": "ambos",
                      "text": "Ambos"
                    },
                    {
                      "value": "na",
                      "text": "Não se aplica"
                    }
                  ]
                },
                {
                  "name": "comentarios",
                  "title": "Detalhes",
                  "cellType": "comment"
                }
              ],
              "alternateRows": true,
              "description": "Marque presença e detalhe apenas o que for relevante."
            },
            {
              "type": "matrixdropdown",
              "name": "sensory_symptoms",
              "title": "Sintomas sensoriais",
              "rows": [
                {
                  "value": "sens_1",
                  "text": "Perda da sensação / entorpecimento"
                },
                {
                  "value": "sens_2",
                  "text": "Formigamento / sensação estranha"
                },
                {
                  "value": "sens_3",
                  "text": "Dificuldade de discriminar frio / quente"
                },
                {
                  "value": "sens_4",
                  "text": "Dificuldade de visão"
                },
                {
                  "value": "sens_5",
                  "text": "Usa óculos"
                },
                {
                  "value": "sens_6",
                  "text": "Sensibilidade para luzes fortes"
                },
                {
                  "value": "sens_7",
                  "text": "Borrão / nuvem na visão"
                },
                {
                  "value": "sens_8",
                  "text": "Breves momentos de cegueira"
                },
                {
                  "value": "sens_9",
                  "text": "Precisa fixar a visão para enxergar"
                },
                {
                  "value": "sens_10",
                  "text": "Perda da audição"
                },
                {
                  "value": "sens_11",
                  "text": "Escuta sons estranhos"
                },
                {
                  "value": "sens_12",
                  "text": "Não percebe uma parte do corpo"
                },
                {
                  "value": "sens_13",
                  "text": "Problemas de paladar"
                },
                {
                  "value": "sens_14",
                  "text": "Aumento / diminuição do olfato"
                },
                {
                  "value": "sens_15",
                  "text": "Aumento / diminuição da sensibilidade"
                },
                {
                  "value": "sens_16",
                  "text": "Dores frequentes"
                }
              ],
              "columns": [
                {
                  "name": "presenca",
                  "title": "Presença",
                  "cellType": "radiogroup",
                  "choices": [
                    {
                      "value": "sim",
                      "text": "Sim"
                    },
                    {
                      "value": "nao",
                      "text": "Não"
                    }
                  ]
                },
                {
                  "name": "lado",
                  "title": "Lado",
                  "cellType": "dropdown",
                  "choices": [
                    {
                      "value": "esq",
                      "text": "Esq"
                    },
                    {
                      "value": "dir",
                      "text": "Dir"
                    },
                    {
                      "value": "ambos",
                      "text": "Ambos"
                    },
                    {
                      "value": "na",
                      "text": "Não se aplica"
                    }
                  ]
                },
                {
                  "name": "comentarios",
                  "title": "Detalhes",
                  "cellType": "comment"
                }
              ],
              "alternateRows": true,
              "description": "Marque presença e detalhe apenas o que for relevante."
            }
          ]
        },
        {
          "name": "cognicao_nao_verbal",
          "title": "7. Sintomas atuais: cognição e habilidades não verbais",
          "description": "Os quadros abaixo já ficam abertos para facilitar o preenchimento. Marque e detalhe apenas o que for relevante.",
          "elements": [
            {
              "type": "matrixdropdown",
              "name": "cognition_exec_symptoms",
              "title": "Funções executivas e cognição",
              "rows": [
                {
                  "value": "cog_1",
                  "text": "Entender como fazer novas coisas"
                },
                {
                  "value": "cog_2",
                  "text": "Resolver problemas comuns"
                },
                {
                  "value": "cog_3",
                  "text": "Planejar atividades"
                },
                {
                  "value": "cog_4",
                  "text": "Mudar um plano quando necessário"
                },
                {
                  "value": "cog_5",
                  "text": "Pensar rápido quando necessário"
                },
                {
                  "value": "cog_6",
                  "text": "Completar uma atividade em tempo hábil"
                },
                {
                  "value": "cog_7",
                  "text": "Fazer as coisas numa sequência lógica"
                }
              ],
              "columns": [
                {
                  "name": "presenca",
                  "title": "Presença",
                  "cellType": "radiogroup",
                  "choices": [
                    {
                      "value": "sim",
                      "text": "Sim"
                    },
                    {
                      "value": "nao",
                      "text": "Não"
                    }
                  ]
                },
                {
                  "name": "comentarios",
                  "title": "Detalhes",
                  "cellType": "comment"
                }
              ],
              "alternateRows": true,
              "description": "Marque presença e detalhe apenas o que for relevante."
            },
            {
              "type": "matrixdropdown",
              "name": "nonverbal_symptoms",
              "title": "Habilidades não verbais",
              "rows": [
                {
                  "value": "nv_1",
                  "text": "Informar qual é o lado direito / esquerdo"
                },
                {
                  "value": "nv_2",
                  "text": "Desenhar ou copiar"
                },
                {
                  "value": "nv_3",
                  "text": "Se vestir (não por problemas motores)"
                },
                {
                  "value": "nv_4",
                  "text": "Fazer coisas automáticas (ex.: escovar dentes)"
                },
                {
                  "value": "nv_5",
                  "text": "Fazer trajetos que antes eram familiares"
                },
                {
                  "value": "nv_6",
                  "text": "Reconhecer objetos ou pessoas"
                },
                {
                  "value": "nv_7",
                  "text": "Sensação de que parte do corpo não pertence à pessoa avaliada"
                },
                {
                  "value": "nv_8",
                  "text": "Habilidades musicais estão declinando"
                },
                {
                  "value": "nv_9",
                  "text": "Sem noção de tempo (dia, semana, ano)"
                },
                {
                  "value": "nv_10",
                  "text": "Diminuição do tempo de reação (lentidão)"
                }
              ],
              "columns": [
                {
                  "name": "presenca",
                  "title": "Presença",
                  "cellType": "radiogroup",
                  "choices": [
                    {
                      "value": "sim",
                      "text": "Sim"
                    },
                    {
                      "value": "nao",
                      "text": "Não"
                    }
                  ]
                },
                {
                  "name": "comentarios",
                  "title": "Detalhes",
                  "cellType": "comment"
                }
              ],
              "alternateRows": true,
              "description": "Marque presença e detalhe apenas o que for relevante."
            }
          ]
        },
        {
          "name": "concentracao_memoria",
          "title": "8. Sintomas atuais: concentração e memória",
          "description": "Os quadros abaixo já ficam abertos para facilitar o preenchimento. Marque e detalhe apenas o que for relevante.",
          "elements": [
            {
              "type": "matrixdropdown",
              "name": "concentration_symptoms",
              "title": "Consciência e concentração",
              "rows": [
                {
                  "value": "conc_1",
                  "text": "Muito distraído"
                },
                {
                  "value": "conc_2",
                  "text": "Perda fácil do encadeamento de pensamentos"
                },
                {
                  "value": "conc_3",
                  "text": "Brancos frequentes / lapsos momentâneos de pensamento"
                },
                {
                  "value": "conc_4",
                  "text": "Dificuldade em fazer mais de uma coisa ao mesmo tempo"
                },
                {
                  "value": "conc_5",
                  "text": "Confusão ou desorientação com facilidade"
                },
                {
                  "value": "conc_6",
                  "text": "Sensações estranhas frequentes (aura)"
                },
                {
                  "value": "conc_7",
                  "text": "Baixo estado de alerta ou de consciência do ambiente"
                },
                {
                  "value": "conc_8",
                  "text": "As tarefas do dia a dia têm requerido mais esforço"
                }
              ],
              "columns": [
                {
                  "name": "presenca",
                  "title": "Presença",
                  "cellType": "radiogroup",
                  "choices": [
                    {
                      "value": "sim",
                      "text": "Sim"
                    },
                    {
                      "value": "nao",
                      "text": "Não"
                    }
                  ]
                },
                {
                  "name": "comentarios",
                  "title": "Detalhes",
                  "cellType": "comment"
                }
              ],
              "alternateRows": true,
              "description": "Marque presença e detalhe apenas o que for relevante."
            },
            {
              "type": "matrixdropdown",
              "name": "memory_symptoms",
              "title": "Memória",
              "rows": [
                {
                  "value": "mem_1",
                  "text": "Esquecimento de onde deixa objetos (chaves, óculos etc.)"
                },
                {
                  "value": "mem_2",
                  "text": "Esquecimento de recados que precisava transmitir"
                },
                {
                  "value": "mem_3",
                  "text": "Esquecimento fácil de nomes de pessoas"
                },
                {
                  "value": "mem_4",
                  "text": "Esquecimento do que estava fazendo no momento"
                },
                {
                  "value": "mem_5",
                  "text": "Esquecimento de onde está ou para onde está indo"
                },
                {
                  "value": "mem_6",
                  "text": "Esquecimento de acontecimentos recentes (ex.: o que almoçou)"
                },
                {
                  "value": "mem_7",
                  "text": "Esquecimento de compromissos"
                },
                {
                  "value": "mem_8",
                  "text": "Esquecimento de fatos que aconteceram há muito tempo"
                },
                {
                  "value": "mem_9",
                  "text": "Maior segurança quando alguém relembra"
                },
                {
                  "value": "mem_10",
                  "text": "Maior segurança quando anota para lembrar"
                },
                {
                  "value": "mem_11",
                  "text": "Esquecimento da ordem dos eventos"
                },
                {
                  "value": "mem_12",
                  "text": "Esquecimento de fatos, mas preservação de como fazer as coisas"
                },
                {
                  "value": "mem_13",
                  "text": "Esquecimento de rostos de pessoas conhecidas"
                }
              ],
              "columns": [
                {
                  "name": "presenca",
                  "title": "Presença",
                  "cellType": "radiogroup",
                  "choices": [
                    {
                      "value": "sim",
                      "text": "Sim"
                    },
                    {
                      "value": "nao",
                      "text": "Não"
                    }
                  ]
                },
                {
                  "name": "comentarios",
                  "title": "Detalhes",
                  "cellType": "comment"
                }
              ],
              "alternateRows": true,
              "description": "Marque presença e detalhe apenas o que for relevante."
            }
          ]
        },
        {
          "name": "humor_comportamento",
          "title": "9. Sintomas atuais: humor, comportamento e personalidade",
          "description": "Os quadros abaixo já ficam abertos para facilitar o preenchimento. Marque e detalhe apenas o que for relevante.",
          "elements": [
            {
              "type": "matrixdropdown",
              "name": "mood_core",
              "title": "Humor",
              "rows": [
                {
                  "value": "mood_1",
                  "text": "Tristeza ou depressão"
                },
                {
                  "value": "mood_2",
                  "text": "Ansiedade ou nervosismo"
                },
                {
                  "value": "mood_3",
                  "text": "Estresse"
                }
              ],
              "columns": [
                {
                  "name": "intensidade",
                  "title": "Intensidade",
                  "cellType": "radiogroup",
                  "choices": [
                    {
                      "value": "suave",
                      "text": "Suave"
                    },
                    {
                      "value": "moderado",
                      "text": "Moderado"
                    },
                    {
                      "value": "severo",
                      "text": "Severo"
                    },
                    {
                      "value": "nao",
                      "text": "Não"
                    }
                  ]
                },
                {
                  "name": "inicio_comentarios",
                  "title": "Detalhes",
                  "cellType": "comment"
                }
              ],
              "alternateRows": true,
              "description": "Indique a intensidade quando houver alteração e use detalhes somente se necessário."
            },
            {
              "type": "matrixdropdown",
              "name": "behavior_personality_symptoms",
              "title": "Comportamento e personalidade",
              "rows": [
                {
                  "value": "beh_1",
                  "text": "Problemas de sono (início ou manter-se dormindo)"
                },
                {
                  "value": "beh_2",
                  "text": "Pesadelos diários / semanais"
                },
                {
                  "value": "beh_3",
                  "text": "Irrita-se ou fica com raiva facilmente"
                },
                {
                  "value": "beh_4",
                  "text": "Episódios de euforia ou sensação de grandiosidade"
                },
                {
                  "value": "beh_5",
                  "text": "Muito emotivo(a) (ex.: choro facilmente)"
                },
                {
                  "value": "beh_6",
                  "text": "Aparente indiferença em relação aos outros"
                },
                {
                  "value": "beh_7",
                  "text": "Frustra-se facilmente"
                },
                {
                  "value": "beh_8",
                  "text": "Realiza coisas automaticamente, sem perceber"
                },
                {
                  "value": "beh_9",
                  "text": "Menor inibição / faz coisas que normalmente não faria"
                },
                {
                  "value": "beh_10",
                  "text": "Dificuldade em ser espontâneo(a)"
                },
                {
                  "value": "beh_11",
                  "text": "Mudança de energia (perda ou aumento)"
                },
                {
                  "value": "beh_12",
                  "text": "Mudança do apetite (perda ou aumento)"
                },
                {
                  "value": "beh_13",
                  "text": "Peso (perda ou aumento)"
                },
                {
                  "value": "beh_14",
                  "text": "Mudança no interesse sexual (aumento ou declínio)"
                },
                {
                  "value": "beh_15",
                  "text": "Perda de interesse em atividades prazerosas"
                },
                {
                  "value": "beh_16",
                  "text": "Aumento da irritabilidade"
                },
                {
                  "value": "beh_17",
                  "text": "Aumento na agressividade"
                }
              ],
              "columns": [
                {
                  "name": "presenca",
                  "title": "Presença",
                  "cellType": "radiogroup",
                  "choices": [
                    {
                      "value": "sim",
                      "text": "Sim"
                    },
                    {
                      "value": "nao",
                      "text": "Não"
                    }
                  ]
                },
                {
                  "name": "inicio_comentarios",
                  "title": "Detalhes",
                  "cellType": "comment"
                }
              ],
              "alternateRows": true,
              "description": "Marque presença e detalhe apenas o que for relevante."
            },
            {
              "type": "radiogroup",
              "name": "others_notice_changes",
              "title": "Outras pessoas comentam mudanças no pensamento, no humor ou na personalidade da pessoa avaliada?",
              "choices": [
                {
                  "value": "sim",
                  "text": "Sim"
                },
                {
                  "value": "nao",
                  "text": "Não"
                },
                {
                  "value": "na",
                  "text": "Não sei / não se aplica"
                }
              ],
              "colCount": 3
            },
            {
              "type": "comment",
              "name": "others_notice_changes_what",
              "title": "Se sim, o que costumam relatar?",
              "visibleIf": "{others_notice_changes} = 'sim'",
              "rows": 3
            },
            {
              "type": "radiogroup",
              "name": "has_current_context_problems",
              "title": "Há problemas atuais em alguma das situações abaixo?",
              "choices": [
                {
                  "value": "sim",
                  "text": "Sim"
                },
                {
                  "value": "nao",
                  "text": "Não"
                },
                {
                  "value": "na",
                  "text": "Não sei / não se aplica"
                }
              ],
              "colCount": 3
            },
            {
              "type": "multipletext",
              "name": "current_context_problems",
              "title": "Situações atuais com dificuldade",
              "items": [
                {
                  "name": "marital_family",
                  "title": "Marital / familiar"
                },
                {
                  "name": "financial_legal",
                  "title": "Financeiro / legal"
                },
                {
                  "name": "driving",
                  "title": "Dirigir automóvel"
                }
              ],
              "visibleIf": "{has_current_context_problems} = 'sim'",
              "description": "Sintetize o problema e, se souber, informe quando começou."
            }
          ]
        },
        {
          "name": "habitos",
          "title": "10. Hábitos: álcool, tabaco e outras substâncias",
          "description": "As perguntas aparecem conforme o tipo de uso informado.",
          "elements": [
            {
              "type": "panel",
              "name": "alcohol_panel",
              "title": "Álcool",
              "elements": [
                {
                  "type": "radiogroup",
                  "name": "alcohol_use_status",
                  "title": "Qual opção melhor descreve o consumo de álcool pela pessoa avaliada?",
                  "choices": [
                    {
                      "value": "current",
                      "text": "Consome atualmente"
                    },
                    {
                      "value": "past",
                      "text": "Consumiu no passado, mas parou ou reduziu bastante"
                    },
                    {
                      "value": "never",
                      "text": "Nunca consumiu"
                    },
                    {
                      "value": "unknown",
                      "text": "Não sei informar"
                    }
                  ],
                  "colCount": 1
                },
                {
                  "type": "radiogroup",
                  "name": "alcohol_start_age",
                  "title": "Em que faixa etária a pessoa avaliada começou a consumir álcool?",
                  "choices": [
                    {
                      "value": "menos_10",
                      "text": "Menos de 10 anos"
                    },
                    {
                      "value": "10_15",
                      "text": "Entre 10 e 15 anos"
                    },
                    {
                      "value": "16_19",
                      "text": "Entre 16 e 19 anos"
                    },
                    {
                      "value": "20_21",
                      "text": "Entre 20 e 21 anos"
                    },
                    {
                      "value": "mais_21",
                      "text": "Acima de 21 anos"
                    }
                  ],
                  "visibleIf": "{alcohol_use_status} = 'current' or {alcohol_use_status} = 'past'",
                  "colCount": 1
                },
                {
                  "type": "radiogroup",
                  "name": "alcohol_frequency",
                  "title": "Qual é ou era a frequência habitual de consumo?",
                  "choices": [
                    {
                      "value": "raramente",
                      "text": "Raramente / quase nunca"
                    },
                    {
                      "value": "1_2_semana",
                      "text": "1 a 2 vezes por semana"
                    },
                    {
                      "value": "3_5_semana",
                      "text": "3 a 5 vezes por semana"
                    },
                    {
                      "value": "diariamente",
                      "text": "Diariamente"
                    }
                  ],
                  "visibleIf": "{alcohol_use_status} = 'current' or {alcohol_use_status} = 'past'",
                  "colCount": 1
                },
                {
                  "type": "radiogroup",
                  "name": "last_drink",
                  "title": "Quando foi a última vez que a pessoa avaliada consumiu álcool?",
                  "choices": [
                    {
                      "value": "menos_24h",
                      "text": "Menos de 24 horas"
                    },
                    {
                      "value": "2_dias",
                      "text": "Há 2 dias"
                    },
                    {
                      "value": "mais_2_dias",
                      "text": "Mais de 2 dias"
                    }
                  ],
                  "visibleIf": "{alcohol_use_status} = 'current'"
                },
                {
                  "type": "text",
                  "name": "used_to_drink_but_stopped_start",
                  "title": "Se houve interrupção ou grande redução do consumo, quando isso aconteceu?",
                  "inputType": "date",
                  "visibleIf": "{alcohol_use_status} = 'past'"
                },
                {
                  "type": "text",
                  "name": "alcohol_types",
                  "title": "Quais bebidas são ou eram consumidas com mais frequência?",
                  "visibleIf": "{alcohol_use_status} = 'current' or {alcohol_use_status} = 'past'"
                },
                {
                  "type": "checkbox",
                  "name": "alcohol_related_flags",
                  "title": "Sinalize o que mais se aplica",
                  "choices": [
                    {
                      "value": "tolerancia",
                      "text": "Tolera quantidades maiores que a maioria das pessoas sem parecer embriagada"
                    },
                    {
                      "value": "problemas_pos_bebida",
                      "text": "Já teve problemas após beber (justiça, trabalho, família, acidentes etc.)"
                    },
                    {
                      "value": "blackout",
                      "text": "Já apresentou blackout (apagão) após beber"
                    }
                  ],
                  "visibleIf": "{alcohol_use_status} = 'current' or {alcohol_use_status} = 'past'",
                  "colCount": 1
                },
                {
                  "type": "comment",
                  "name": "alcohol_related_flags_detail",
                  "title": "Se houve problemas após beber, especifique",
                  "visibleIf": "contains({alcohol_related_flags}, 'problemas_pos_bebida')",
                  "rows": 2
                }
              ]
            },
            {
              "type": "panel",
              "name": "drugs_panel",
              "title": "Drogas e outras substâncias",
              "elements": [
                {
                  "type": "radiogroup",
                  "name": "has_drug_history",
                  "title": "A pessoa avaliada usa ou já usou drogas ilícitas ou recreativas?",
                  "choices": [
                    {
                      "value": "sim",
                      "text": "Sim"
                    },
                    {
                      "value": "nao",
                      "text": "Não"
                    },
                    {
                      "value": "na",
                      "text": "Não sei / não se aplica"
                    }
                  ],
                  "colCount": 3
                },
                {
                  "type": "checkbox",
                  "name": "drugs_used",
                  "title": "Quais drogas usa ou já usou no passado?",
                  "choices": [
                    "Anfetamina",
                    "Barbitúricos",
                    "Cocaína / craque",
                    "Alucinógenos (LSD etc.)",
                    "Inalantes",
                    "Maconha / haxixe",
                    "Ópios (heroína etc.)",
                    "PCB (loló)"
                  ],
                  "visibleIf": "{has_drug_history} = 'sim'",
                  "showOtherItem": true,
                  "otherText": "Outro",
                  "otherPlaceholder": "Descreva",
                  "colCount": 1
                },
                {
                  "type": "radiogroup",
                  "name": "drug_dependence",
                  "title": "Há dependência de alguma das drogas acima?",
                  "choices": [
                    {
                      "value": "sim",
                      "text": "Sim"
                    },
                    {
                      "value": "nao",
                      "text": "Não"
                    },
                    {
                      "value": "na",
                      "text": "Não sei / não se aplica"
                    }
                  ],
                  "colCount": 3,
                  "visibleIf": "{has_drug_history} = 'sim'"
                },
                {
                  "type": "text",
                  "name": "drug_dependence_which",
                  "title": "Se sim, qual ou quais?",
                  "visibleIf": "{drug_dependence} = 'sim'"
                },
                {
                  "type": "radiogroup",
                  "name": "antidrug_treatment",
                  "title": "A pessoa avaliada está em tratamento para uso de drogas?",
                  "choices": [
                    {
                      "value": "sim",
                      "text": "Sim"
                    },
                    {
                      "value": "nao",
                      "text": "Não"
                    },
                    {
                      "value": "na",
                      "text": "Não sei / não se aplica"
                    }
                  ],
                  "colCount": 3,
                  "visibleIf": "{has_drug_history} = 'sim'"
                },
                {
                  "type": "radiogroup",
                  "name": "drug_impact_work",
                  "title": "O uso de drogas afeta ou já afetou o desempenho no trabalho?",
                  "choices": [
                    {
                      "value": "sim",
                      "text": "Sim"
                },
                {
                  "value": "nao",
                  "text": "Não"
                },
                {
                  "value": "na",
                  "text": "Não sei / não se aplica"
                }
              ],
              "colCount": 3,
              "visibleIf": "{has_drug_history} = 'sim'"
            },
            {
              "type": "radiogroup",
              "name": "licit_drug_dependence",
              "title": "Há dependência de alguma substância lícita ou medicação?",
              "choices": [
                {
                  "value": "sim",
                  "text": "Sim"
                },
                {
                  "value": "nao",
                  "text": "Não"
                },
                {
                  "value": "na",
                  "text": "Não sei / não se aplica"
                }
              ],
              "colCount": 3
            },
            {
              "type": "text",
              "name": "licit_drug_dependence_which",
              "title": "Se sim, qual?",
              "visibleIf": "{licit_drug_dependence} = 'sim'"
            },
            {
              "type": "radiogroup",
              "name": "substance_impact_driving",
              "title": "O uso de álcool, drogas ou medicações já afetou a capacidade de dirigir?",
              "choices": [
                {
                  "value": "sim",
                  "text": "Sim"
                },
                {
                  "value": "nao",
                  "text": "Não"
                },
                {
                  "value": "na",
                  "text": "Não sei / não se aplica"
                }
              ],
              "colCount": 3,
              "visibleIf": "{alcohol_use_status} = 'current' or {alcohol_use_status} = 'past' or {has_drug_history} = 'sim' or {licit_drug_dependence} = 'sim'"
            }
          ]
        },
        {
          "type": "panel",
          "name": "tobacco_caffeine_panel",
          "title": "Tabaco e café",
          "elements": [
            {
              "type": "radiogroup",
              "name": "smoker",
              "title": "A pessoa avaliada fuma?",
              "choices": [
                {
                  "value": "sim",
                  "text": "Sim"
                },
                {
                  "value": "nao",
                  "text": "Não"
                },
                {
                  "value": "na",
                  "text": "Não sei / não se aplica"
                }
              ],
              "colCount": 3
            },
            {
              "type": "text",
              "name": "packs_per_day",
              "title": "Se sim, quantos maços por dia?",
              "inputType": "number",
              "visibleIf": "{smoker} = 'sim'"
            },
            {
              "type": "radiogroup",
              "name": "drinks_coffee",
              "title": "A pessoa avaliada toma café?",
              "choices": [
                {
                  "value": "sim",
                  "text": "Sim"
                },
                {
                  "value": "nao",
                  "text": "Não"
                },
                {
                  "value": "na",
                  "text": "Não sei / não se aplica"
                }
              ],
              "colCount": 3
            },
            {
              "type": "text",
              "name": "cups_per_day",
              "title": "Se sim, quantas xícaras por dia?",
              "inputType": "number",
              "visibleIf": "{drinks_coffee} = 'sim'"
            }
          ]
        }
      ]
    },
    {
      "name": "historico_familiar",
      "title": "11. Histórico familiar",
      "description": "Os campos abaixo já ficam visíveis para reduzir a chance de alguma informação familiar importante passar despercebida.",
      "elements": [
        {
          "type": "panel",
          "name": "mother_panel",
          "title": "Mãe da pessoa avaliada",
          "elements": [
            {
              "type": "radiogroup",
              "name": "mother_alive",
              "title": "A mãe da pessoa avaliada é viva?",
              "choices": [
                {
                  "value": "sim",
                  "text": "Sim"
                },
                {
                  "value": "nao",
                  "text": "Não"
                },
                {
                  "value": "na",
                  "text": "Não sei / não se aplica"
                }
              ],
              "colCount": 3
            },
            {
              "type": "comment",
              "name": "mother_death_details",
              "title": "Se não, quando ocorreu o falecimento e como aconteceu?",
              "visibleIf": "{mother_alive} = 'nao'",
              "rows": 2
            },
            {
              "type": "text",
              "name": "mother_education",
              "title": "Escolaridade da mãe"
            },
            {
              "type": "text",
              "name": "mother_profession",
              "title": "Profissão da mãe"
            },
            {
              "type": "radiogroup",
              "name": "mother_learning_problems",
              "title": "A mãe teve ou tem dificuldade de aprendizagem conhecida ou suspeita?",
              "choices": [
                {
                  "value": "sim",
                  "text": "Sim"
                },
                {
                  "value": "nao",
                  "text": "Não"
                },
                {
                  "value": "na",
                  "text": "Não sei / não se aplica"
                }
              ],
              "colCount": 3
            },
            {
              "type": "comment",
              "name": "mother_learning_problems_desc",
              "title": "Se sim, descreva",
              "visibleIf": "{mother_learning_problems} = 'sim'",
              "rows": 2
            }
          ]
        },
        {
          "type": "panel",
          "name": "father_panel",
          "title": "Pai da pessoa avaliada",
          "elements": [
            {
              "type": "radiogroup",
              "name": "father_alive",
              "title": "O pai da pessoa avaliada é vivo?",
              "choices": [
                {
                  "value": "sim",
                  "text": "Sim"
                },
                {
                  "value": "nao",
                  "text": "Não"
                },
                {
                  "value": "na",
                  "text": "Não sei / não se aplica"
                }
              ],
              "colCount": 3
            },
            {
              "type": "comment",
              "name": "father_death_details",
              "title": "Se não, quando ocorreu o falecimento e como aconteceu?",
              "visibleIf": "{father_alive} = 'nao'",
              "rows": 2
            },
            {
              "type": "text",
              "name": "father_education",
              "title": "Escolaridade do pai"
            },
            {
              "type": "text",
              "name": "father_profession",
              "title": "Profissão do pai"
            },
            {
              "type": "radiogroup",
              "name": "father_learning_problems",
              "title": "O pai teve ou tem dificuldade de aprendizagem conhecida ou suspeita?",
              "choices": [
                {
                  "value": "sim",
                  "text": "Sim"
                },
                {
                  "value": "nao",
                  "text": "Não"
                },
                {
                  "value": "na",
                  "text": "Não sei / não se aplica"
                }
              ],
              "colCount": 3
            },
            {
              "type": "comment",
              "name": "father_learning_problems_desc",
              "title": "Se sim, descreva",
              "visibleIf": "{father_learning_problems} = 'sim'",
              "rows": 2
            }
          ]
        },
        {
          "type": "radiogroup",
          "name": "has_siblings",
          "title": "A pessoa avaliada tem irmãos ou irmãs?",
          "choices": [
            {
              "value": "sim",
              "text": "Sim"
            },
            {
              "value": "nao",
              "text": "Não"
            },
            {
              "value": "na",
              "text": "Não sei / não se aplica"
            }
          ],
          "colCount": 3
        },
        {
          "type": "text",
          "name": "siblings_count_age",
          "title": "Quantos irmãos/irmãs tem e quais são as idades aproximadas?",
          "visibleIf": "{has_siblings} = 'sim'"
        },
        {
          "type": "radiogroup",
          "name": "siblings_problems",
          "title": "Há histórico de problema físico, escolar ou psicológico entre os irmãos?",
          "choices": [
            {
              "value": "sim",
              "text": "Sim"
            },
            {
              "value": "nao",
              "text": "Não"
            },
            {
              "value": "na",
              "text": "Não sei / não se aplica"
            }
          ],
          "colCount": 3,
          "visibleIf": "{has_siblings} = 'sim'"
        },
        {
          "type": "comment",
          "name": "siblings_problems_desc",
          "title": "Se sim, descreva",
          "visibleIf": "{siblings_problems} = 'sim'",
          "rows": 2
        },
        {
          "type": "matrixdropdown",
          "name": "family_conditions",
          "title": "Condições familiares relevantes",
          "rows": [
            {
              "value": "fam_1",
              "text": "Doenças neurológicas"
            },
            {
              "value": "fam_2",
              "text": "Alzheimer ou doença senil"
            },
            {
              "value": "fam_3",
              "text": "Doença de Huntington"
            },
            {
              "value": "fam_4",
              "text": "Esclerose múltipla"
            },
            {
              "value": "fam_5",
              "text": "Doença de Parkinson"
            },
            {
              "value": "fam_6",
              "text": "Epilepsia"
            },
            {
              "value": "fam_7",
              "text": "Outras doenças neurológicas"
            },
            {
              "value": "fam_8",
              "text": "Doenças psiquiátricas"
            },
            {
              "value": "fam_9",
              "text": "Depressão"
            },
            {
              "value": "fam_10",
              "text": "Transtorno bipolar"
            },
            {
              "value": "fam_11",
              "text": "Esquizofrenia"
            },
            {
              "value": "fam_12",
              "text": "Deficiência intelectual"
            },
            {
              "value": "fam_13",
              "text": "Desordens de fala ou linguagem"
            },
            {
              "value": "fam_14",
              "text": "Problemas de aprendizagem"
            },
            {
              "value": "fam_15",
              "text": "Problemas de atenção"
            },
            {
              "value": "fam_16",
              "text": "Problemas de comportamento"
            },
            {
              "value": "fam_17",
              "text": "Outro problema ou desordem grave"
            },
            {
              "value": "fam_18",
              "text": "Problema de saúde significativo / necessidade especial"
            }
          ],
          "columns": [
            {
              "name": "presenca",
              "title": "Presença",
              "cellType": "radiogroup",
              "choices": [
                {
                  "value": "sim",
                  "text": "Sim"
                },
                {
                  "value": "nao",
                  "text": "Não"
                }
              ]
            },
            {
              "name": "quem_descricao",
              "title": "Quem / detalhes",
              "cellType": "comment"
            }
          ],
          "alternateRows": true,
          "description": "Considere pais, irmãos, avós, tios e tias. Preencha apenas o que souber."
        }
      ]
    },
    {
      "name": "pessoal_social",
      "title": "12. Histórico pessoal e social",
      "description": "Organizado em blocos curtos para facilitar o preenchimento.",
      "elements": [
        {
          "type": "panel",
          "name": "relationship_panel",
          "title": "Relacionamento atual",
          "elements": [
            {
              "type": "radiogroup",
              "name": "current_marital_status",
              "title": "Estado civil atual da pessoa avaliada",
              "choices": [
                {
                  "value": "solteiro",
                  "text": "Solteiro(a)"
                },
                {
                  "value": "amasiado",
                  "text": "Amasiado(a)"
                },
                {
                  "value": "separado",
                  "text": "Separado(a)"
                },
                {
                  "value": "casado",
                  "text": "Casado(a)"
                },
                {
                  "value": "divorciado",
                  "text": "Divorciado(a)"
                },
                {
                  "value": "viuvo",
                  "text": "Viúvo(a)"
                }
              ],
              "colCount": 1
            },
            {
              "type": "radiogroup",
              "name": "has_current_partner",
              "title": "A pessoa avaliada tem companheiro(a) ou parceiro(a) atualmente?",
              "choices": [
                {
                  "value": "sim",
                  "text": "Sim"
                },
                {
                  "value": "nao",
                  "text": "Não"
                },
                {
                  "value": "na",
                  "text": "Não sei / não se aplica"
                }
              ],
              "colCount": 3
            },
            {
              "type": "text",
              "name": "current_relationship_duration",
              "title": "Há quanto tempo dura essa relação?",
              "visibleIf": "{has_current_partner} = 'sim'"
            },
            {
              "type": "text",
              "name": "partner_occupation",
              "title": "Ocupação do(a) companheiro(a) / parceiro(a)",
              "visibleIf": "{has_current_partner} = 'sim'"
            },
            {
              "type": "radiogroup",
              "name": "partner_health",
              "title": "Como está a saúde do(a) companheiro(a) / parceiro(a)?",
              "choices": [
                {
                  "value": "excelente",
                  "text": "Excelente"
                },
                {
                  "value": "boa",
                  "text": "Boa"
                },
                {
                  "value": "fragil",
                  "text": "Frágil"
                },
                {
                  "value": "nao_sei",
                  "text": "Não sei informar"
                }
              ],
              "visibleIf": "{has_current_partner} = 'sim'",
              "colCount": 1
            },
            {
              "type": "radiogroup",
              "name": "previous_marriages",
              "title": "A pessoa avaliada teve casamentos ou uniões anteriores?",
              "choices": [
                {
                  "value": "sim",
                  "text": "Sim"
                },
                {
                  "value": "nao",
                  "text": "Não"
                },
                {
                  "value": "na",
                  "text": "Não sei / não se aplica"
                }
              ],
              "colCount": 3
            },
            {
              "type": "multipletext",
              "name": "previous_marriages_details",
              "title": "Detalhes das uniões anteriores",
              "items": [
                {
                  "name": "how_many",
                  "title": "Quantas"
                },
                {
                  "name": "how_long",
                  "title": "Duração aproximada"
                }
              ],
              "visibleIf": "{previous_marriages} = 'sim'"
            }
          ]
        },
        {
          "type": "panel",
          "name": "children_panel",
          "title": "Filhos e enteados",
          "elements": [
            {
              "type": "radiogroup",
              "name": "has_children_stepchildren",
              "title": "A pessoa avaliada tem filhos ou enteados?",
              "choices": [
                {
                  "value": "sim",
                  "text": "Sim"
                },
                {
                  "value": "nao",
                  "text": "Não"
                },
                {
                  "value": "na",
                  "text": "Não sei / não se aplica"
                }
              ],
              "colCount": 3
            },
            {
              "type": "matrixdynamic",
              "name": "children_stepchildren",
              "title": "Filhos / enteados",
              "columns": [
                {
                  "name": "nome_ou_identificador",
                  "title": "Nome ou identificador",
                  "cellType": "text"
                },
                {
                  "name": "sexo",
                  "title": "Sexo",
                  "cellType": "text"
                },
                {
                  "name": "idade",
                  "title": "Idade",
                  "cellType": "text"
                }
              ],
              "alternateRows": true,
              "minRowCount": 1,
              "addRowText": "Adicionar",
              "removeRowText": "Remover",
              "description": "Adicione uma linha por filho(a) ou enteado(a). Se preferir anonimizar, use apenas iniciais.",
              "visibleIf": "{has_children_stepchildren} = 'sim'"
            }
          ]
        },
        {
          "type": "comment",
          "name": "who_lives_at_home",
          "title": "Quem vive atualmente na casa da pessoa avaliada?",
          "rows": 3
        }
      ]
    },
    {
      "name": "infancia_desenvolvimento",
      "title": "13. Histórico infantil e desenvolvimento",
      "description": "Preencha apenas se essas informações forem conhecidas.",
      "elements": [
        {
          "type": "radiogroup",
          "name": "birth_development_history_known",
          "title": "Há informações confiáveis sobre gestação, parto e desenvolvimento inicial?",
          "choices": [
            {
              "value": "sim",
              "text": "Sim"
            },
            {
              "value": "nao",
              "text": "Não"
            },
            {
              "value": "na",
              "text": "Não sei / não se aplica"
            }
          ],
          "colCount": 3
        },
        {
          "type": "panel",
          "name": "birth_history_panel",
          "title": "Gestação e nascimento",
          "elements": [
            {
              "type": "radiogroup",
              "name": "birth_timing",
              "title": "O nascimento da pessoa avaliada ocorreu no",
              "choices": [
                {
                  "value": "tempo_certo",
                  "text": "Tempo certo"
                },
                {
                  "value": "prematuro",
                  "text": "Prematuro"
                },
                {
                  "value": "atrasado",
                  "text": "Atrasado"
                }
              ]
            },
            {
              "type": "text",
              "name": "birth_weight",
              "title": "Peso ao nascer"
            },
            {
              "type": "radiogroup",
              "name": "birth_problems",
              "title": "Houve algum problema no parto?",
              "choices": [
                {
                  "value": "sim",
                  "text": "Sim"
                },
                {
                  "value": "nao",
                  "text": "Não"
                },
                {
                  "value": "na",
                  "text": "Não sei / não se aplica"
                }
              ],
              "colCount": 3
            },
            {
              "type": "comment",
              "name": "birth_problems_desc",
              "title": "Se sim, descreva (ex.: falta de oxigênio, má posição no útero, convulsões etc.)",
              "visibleIf": "{birth_problems} = 'sim'",
              "rows": 2
            },
            {
              "type": "checkbox",
              "name": "pregnancy_exposures",
              "title": "Durante a gestação, houve alguma das situações abaixo?",
              "choices": [
                "Acidente",
                "Álcool",
                "Cigarro",
                "Drogas",
                "Doenças (diabetes etc.)",
                "Nutrição fraca",
                "Problemas psicológicos",
                "Medicações"
              ],
              "showOtherItem": true,
              "otherText": "Outro",
              "otherPlaceholder": "Descreva",
              "colCount": 1
            }
          ],
          "visibleIf": "{birth_development_history_known} = 'sim'"
        },
        {
          "type": "panel",
          "name": "development_panel",
          "title": "Desenvolvimento inicial e infância",
          "elements": [
            {
              "type": "matrix",
              "name": "development_milestones",
              "title": "Marcos do desenvolvimento inicial",
              "rows": [
                {
                  "value": "andar",
                  "text": "Andar"
                },
                {
                  "value": "falar",
                  "text": "Falar"
                },
                {
                  "value": "toalete",
                  "text": "Toalete / desfralde"
                },
                {
                  "value": "global",
                  "text": "Desenvolvimento global"
                }
              ],
              "columns": [
                {
                  "value": "cedo",
                  "text": "Cedo"
                },
                {
                  "value": "na_media",
                  "text": "Na média"
                },
                {
                  "value": "tarde",
                  "text": "Tarde"
                }
              ],
              "alternateRows": true
            },
            {
              "type": "checkbox",
              "name": "childhood_problems",
              "title": "Na infância, a pessoa avaliada apresentou algum dos problemas abaixo?",
              "choices": [
                "Problemas de atenção",
                "Dificuldade de aprendizagem",
                "Desajeitado(a)",
                "Problemas de fala",
                "Desenvolvimento retardado",
                "Problemas de audição",
                "Hiperatividade",
                "Infecções no ouvido",
                "Fraqueza muscular",
                "Problemas visuais"
              ],
              "colCount": 1
            }
          ],
          "visibleIf": "{birth_development_history_known} = 'sim'"
        }
      ]
    },
    {
      "name": "escolar_profissional",
      "title": "14. Histórico escolar e profissional",
      "description": "As perguntas estão divididas em escolar e profissional para facilitar o preenchimento.",
      "elements": [
        {
          "type": "panel",
          "name": "school_panel",
          "title": "Histórico escolar",
          "elements": [
            {
              "type": "radiogroup",
              "name": "school_history_known",
              "title": "Há informações suficientes sobre o histórico escolar da pessoa avaliada?",
              "choices": [
                {
                  "value": "sim",
                  "text": "Sim"
                },
                {
                  "value": "nao",
                  "text": "Não"
                },
                {
                  "value": "na",
                  "text": "Não sei / não se aplica"
                }
              ],
              "colCount": 3
            },
            {
              "type": "comment",
              "name": "schools_attended",
              "title": "Escolas ou níveis cursados (fundamental, médio, universidade etc.)",
              "visibleIf": "{school_history_known} = 'sim'",
              "rows": 3
            },
            {
              "type": "comment",
              "name": "repeated_years_reason",
              "title": "Houve repetência? Se sim, quais anos e por qual motivo?",
              "visibleIf": "{school_history_known} = 'sim'",
              "rows": 3
            },
            {
              "type": "comment",
              "name": "reading_writing_math_difficulty",
              "title": "Houve dificuldade para aprender leitura, escrita ou matemática?",
              "visibleIf": "{school_history_known} = 'sim'",
              "rows": 3
            },
            {
              "type": "radiogroup",
              "name": "special_classes",
              "title": "Frequentou classes especiais ou recebeu apoio escolar especializado?",
              "choices": [
                {
                  "value": "sim",
                  "text": "Sim"
                },
                {
                  "value": "nao",
                  "text": "Não"
                },
                {
                  "value": "na",
                  "text": "Não sei / não se aplica"
                }
              ],
              "colCount": 3,
              "visibleIf": "{school_history_known} = 'sim'"
            },
            {
              "type": "text",
              "name": "special_classes_details",
              "title": "Se sim, qual tipo e em que período?",
              "visibleIf": "{special_classes} = 'sim'"
            },
            {
              "type": "radiogroup",
              "name": "student_performance",
              "title": "Como foi o desempenho escolar da pessoa avaliada no geral?",
              "choices": [
                {
                  "value": "a_b",
                  "text": "Ótimo"
                },
                {
                  "value": "b_c",
                  "text": "Bom"
                },
                {
                  "value": "c_d",
                  "text": "Regular"
                },
                {
                  "value": "d_e",
                  "text": "Ruim"
                },
                {
                  "value": "nao_sei",
                  "text": "Não sei informar"
                }
              ],
              "visibleIf": "{school_history_known} = 'sim'",
              "colCount": 1
            }
          ]
        },
        {
          "type": "panel",
          "name": "work_panel",
          "title": "Histórico profissional",
          "elements": [
            {
              "type": "radiogroup",
              "name": "work_history_known",
              "title": "Há informações suficientes sobre o histórico profissional da pessoa avaliada?",
              "choices": [
                {
                  "value": "sim",
                  "text": "Sim"
                },
                {
                  "value": "nao",
                  "text": "Não"
                },
                {
                  "value": "na",
                  "text": "Não sei / não se aplica"
                }
              ],
              "colCount": 3
            },
            {
              "type": "radiogroup",
              "name": "military_service",
              "title": "Serviu ao exército ou fez serviço militar?",
              "choices": [
                {
                  "value": "sim",
                  "text": "Sim"
                },
                {
                  "value": "nao",
                  "text": "Não"
                },
                {
                  "value": "na",
                  "text": "Não sei / não se aplica"
                }
              ],
              "colCount": 3,
              "visibleIf": "{work_history_known} = 'sim'"
            },
            {
              "type": "text",
              "name": "military_service_details",
              "title": "Se sim, informe tempo, conclusão e patente, se souber.",
              "visibleIf": "{military_service} = 'sim'"
            },
            {
              "type": "comment",
              "name": "military_problems_or_toxic_exposure",
              "title": "Houve problemas no período militar ou exposição a substâncias tóxicas?",
              "visibleIf": "{military_service} = 'sim'",
              "rows": 2
            },
            {
              "type": "radiogroup",
              "name": "currently_working",
              "title": "Atualmente a pessoa avaliada trabalha?",
              "choices": [
                {
                  "value": "sim",
                  "text": "Sim"
                },
                {
                  "value": "nao",
                  "text": "Não"
                },
                {
                  "value": "na",
                  "text": "Não sei / não se aplica"
                }
              ],
              "colCount": 3,
              "visibleIf": "{work_history_known} = 'sim'"
            },
            {
              "type": "text",
              "name": "current_job_company_role",
              "title": "Se sim, cargo e empresa",
              "visibleIf": "{currently_working} = 'sim'"
            },
            {
              "type": "text",
              "name": "current_job_start_date",
              "title": "Data de ingresso",
              "visibleIf": "{currently_working} = 'sim'",
              "placeholder": "Ex.: 2021 / julho de 2023"
            },
            {
              "type": "comment",
              "name": "current_job_responsibilities",
              "title": "Responsabilidades atuais",
              "visibleIf": "{currently_working} = 'sim'",
              "rows": 2
            },
            {
              "type": "comment",
              "name": "current_job_instability",
              "title": "Há problemas, restrições ou instabilidade no trabalho atual?",
              "visibleIf": "{currently_working} = 'sim'",
              "rows": 2
            },
            {
              "type": "radiogroup",
              "name": "income_decreased_due_disease",
              "title": "A renda diminuiu por causa da condição de saúde ou da queixa atual?",
              "choices": [
                {
                  "value": "sim",
                  "text": "Sim"
                },
                {
                  "value": "nao",
                  "text": "Não"
                },
                {
                  "value": "na",
                  "text": "Não sei / não se aplica"
                }
              ],
              "colCount": 3,
              "visibleIf": "{work_history_known} = 'sim'"
            },
            {
              "type": "radiogroup",
              "name": "has_previous_jobs",
              "title": "Há empregos anteriores relevantes para registrar?",
              "choices": [
                {
                  "value": "sim",
                  "text": "Sim"
                },
                {
                  "value": "nao",
                  "text": "Não"
                },
                {
                  "value": "na",
                  "text": "Não sei / não se aplica"
                }
              ],
              "colCount": 3,
              "visibleIf": "{work_history_known} = 'sim'"
            },
            {
              "type": "matrixdynamic",
              "name": "previous_jobs",
              "title": "Empregos anteriores",
              "columns": [
                {
                  "name": "empresa",
                  "title": "Empresa",
                  "cellType": "text"
                },
                {
                  "name": "cargo",
                  "title": "Cargo",
                  "cellType": "text"
                },
                {
                  "name": "periodo",
                  "title": "Período",
                  "cellType": "text"
                },
                {
                  "name": "motivo_saida",
                  "title": "Motivo da saída",
                  "cellType": "text"
                }
              ],
              "alternateRows": true,
              "minRowCount": 1,
              "addRowText": "Adicionar",
              "removeRowText": "Remover",
              "visibleIf": "{has_previous_jobs} = 'sim'"
            },
            {
              "type": "radiogroup",
              "name": "feels_able_to_work",
              "title": "A pessoa avaliada está em condições de realizar atividades profissionais atualmente?",
              "choices": [
                {
                  "value": "sim",
                  "text": "Sim"
                },
                {
                  "value": "nao",
                  "text": "Não"
                },
                {
                  "value": "na",
                  "text": "Não sei / não se aplica"
                }
              ],
              "colCount": 3,
              "visibleIf": "{work_history_known} = 'sim'"
            },
            {
              "type": "comment",
              "name": "feels_able_to_work_desc",
              "title": "Se desejar, detalhe.",
              "visibleIf": "{feels_able_to_work} = 'sim' or {feels_able_to_work} = 'nao'",
              "rows": 2
            }
          ]
        },
        {
          "type": "comment",
          "name": "additional_information",
          "title": "Informações adicionais relevantes para a avaliação",
          "rows": 4
        }
      ]
    }
  ]
}
}
];
