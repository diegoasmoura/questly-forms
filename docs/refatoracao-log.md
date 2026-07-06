# Log de Refatoração — QuestlyForms

Este log rastreia as voltas do loop de refatoração aplicadas ao QuestlyForms.

## Turno 1: Setup e Templates de Anamnese (Fase 1.1)
- **Módulo**: `templates`
- **Data**: 2026-07-06
- **Meta**: Adicionar templates de anamnese (Adulto, Infantil, Adolescente, Idoso) e abordagens clínicas no acervo (`templates.js`) com testes garantindo que o carregamento e formato dos templates estejam 100% corretos.
- **Evidência**: Vitest rodando e passando (templates.test.js).

## Turno 2: Exportação PDF/Excel do Prontuário Completo (Fase 1.2)
- **Módulo**: `export`
- **Data**: 2026-07-06
- **Meta**: Criar rota `GET /api/patients/:id/export` consolidando dados e a função frontend `exportCompletePatientRecordPdf` para gerar PDF de prontuário completo nos padrões do CFP.
- **Evidência**: Botão "Exportar PDF" renderizado na aba Prontuário e integração do endpoint com tratamento de dados.

## Turno 3: Lembretes Automáticos via WhatsApp (Fase 1.3)
- **Módulo**: `notifications`
- **Data**: 2026-07-06
- **Meta**: Rota de envio de WhatsApp `POST /api/notifications/send-reminder` com suporte a chaves no `.env` e fallback (Mock) para desenvolvimento.
- **Evidência**: Botão de envio "WhatsApp" adicionado a cada agendamento do paciente na aba de Agenda de PatientRecord.jsx.

## Turno 4: Agendamento Online - Link Público (Fase 1.4)
- **Módulo**: `booking`
- **Data**: 2026-07-06
- **Meta**: Criação do schema `BookingConfig` no banco de dados e rota pública `/booking/:slug` que lista horários livres dinamicamente e registra paciente/agendamento no funil do psicólogo.
- **Evidência**: Sincronização do Prisma efetuada com sucesso, rota backend e página frontend Booking.jsx implementadas.

## Turno 5: Compliance e Segurança - Audit e LGPD (Fase 1.5)
- **Módulo**: `security`
- **Data**: 2026-07-06
- **Meta**: Criação da tabela `AuditLog`, helper de auditoria e criptografia simétrica (com versão determinística para unique constraints) e termo de consentimento LGPD.
- **Evidência**: Checkbox LGPD obrigatório adicionado e validado no cadastro de pacientes do frontend. Criptografia transparente de CPF e Notas do Paciente nas rotas do backend.

## Turno 6: Validação de Duplicidade na Agenda e Tela de Configurações (Fase 1.6)
- **Módulo**: `agenda-settings`
- **Data**: 2026-07-06
- **Meta**: Corrigir bug que permitia agendamento duplo do mesmo paciente no mesmo horário no backend. Criar página de configurações `/settings` com abas para Clínica, Agenda, Assinatura e Ajuda, adicionando campos de configurações ao modelo User no Prisma e vinculando botões inativos do ProfileDropdown a rotas ativas com query params.
- **Evidência**: Suíte de testes frontend Vitest passando 20/20. Sincronização do Prisma concluída com sucesso. Lógica de colisão corrigida com testes manuais simulados de concorrência.

## Turno 7: Correção do Erro ao Gerar PDF (Fase 1.7)
- **Módulo**: `export-pdf-fix`
- **Data**: 2026-07-06
- **Meta**: Solucionar o erro de tipo `TypeError: Cannot read properties of undefined (reading 'finalY')` que impedia o download de prontuários. Substituímos referências de `doc.previousAutoTable` para `doc.lastAutoTable` e aplicamos encadeamento opcional (`doc.lastAutoTable?.finalY`) com valores de fallback seguros.
- **Evidência**: Vitest 20/20 verde. Download de arquivos PDF funciona normalmente sem gerar exceções no console ou nas notificações de toast.


