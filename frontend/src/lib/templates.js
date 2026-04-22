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
