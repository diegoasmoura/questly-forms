# 5. Instrumentos e Acervo Clínico

A seção de Formulários/Instrumentos engloba o `FormBuilder` (Criação de avaliações customizadas) e a visualização de resumos.

---

## 5.1 Construtor de Formulários (Form Builder)
A interface de criação de formulários é a única do sistema onde a Sidebar fica retraída automaticamente ou onde se trava o scroll duplo (overflow). 
- O foco do usuário deve estar 100% no canvas (tela de pintura) do formulário.
- A paleta de cores para os botões de construtor (adicionar campo, configurações) segue a variação neutra da paleta para não competir com a atenção das questões clínicas que o profissional está digitando.

## 5.2 Estilos dos Cartões de Acervo
No "Acervo Clínico", os modelos e formulários pré-prontos utilizam os Squircles grandes (`rounded-[20px]`).
- Eles possuem as bordas `border-[var(--border)]` e fundo sólido `bg-[var(--surface)]`.
- As tags indicativas da categoria do instrumento (Ex: Psicanálise, TCC, Anamnese) utilizam a paleta de Cores de Status descrita no arquivo `0_design_system.md`, priorizando as variações Pastéis claras (Light) e textos escuros.

## 5.3 Widget de Instrumentos (Home)
Os dados gerados nesta aba repercutem na `Home.jsx` via `InstrumentsWidget`.
Lá, o preenchimento dos formulários (respostas) é exibido como um mini funil, onde se deve prezar por usar as cores frias (Azul/Roxo/Verde) combinadas. A regra geral do projeto aplica-se aqui: *Nenhum botão de widget deve ser uma pílula redonda, devem ser 'quadradinhos'.*
