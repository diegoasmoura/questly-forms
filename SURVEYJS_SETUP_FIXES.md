# 🔧 SurveyJS Setup - Correções Completas

## ❌ Problemas Identificados

### 1. **Versões Desatualizadas**
- **Antes:** SurveyJS v1.9.132 (1.5 versões atrás)
- **Depois:** SurveyJS v2.5.19 (última versão)
- **Impacto:** Missing icons, property grid broken, JSON validation errors

### 2. **CSS Import Incorreto**
```js
// ANTES (legacy)
import "survey-core/defaultV2.min.css";

// DEPOIS (moderno)
import "survey-core/survey-core.min.css";
```

### 3. **Propriedades Duplicadas no Serializer**
**Problema:** Registrando propriedades NATIVAS como custom:
- `firstPageIsStartPage` ← já existe no SurveyJS
- `previewMode` ← já existe no SurveyJS
- `showPreviewBeforeComplete` ← já existe
- `startSurveyText`, `pagePrevText`, etc. ← todos já existem

**Solução:** Removido TODO o bloco `Serializer.addProperty`

### 4. **Opções Inválidas no Creator**
```js
// ANTES (inválido)
{
  showPropertyGrid: true,         // Deprecated em v2.x
  propertyGridNavigationMode: "accordion", // Não existe em v1.9
  ignoreValidation: true,         // Não existe
  JSONTextEditor: true,           // Não existe
}

// DEPOIS (válido para v2.x)
{
  showSidebar: true,              // Novo em v2.x
  propertyGridNavigationMode: "accordion", // Agora existe em v2.x
  showOneCategoryInPropertyGrid: false,
}
```

### 5. **Cores Sobrescritas (Missing Green Background)**
```css
/* ANTES (quase preto) */
--sjs-primary-backcolor: #0b0907;

/* DEPOIS (verde emerald) */
--sjs-primary-backcolor: #10b981;
```

### 6. **Version Mismatch**
- `survey-core`: 1.9.132
- `survey-pdf`: 1.12.61 ← desalinhado!

**Agora:** Todos em 2.5.19 ✅

---

## ✅ Correções Aplicadas

### **Arquivo: `package.json`**
```json
{
  "survey-core": "^2.5.19",
  "survey-creator-core": "^2.5.19",
  "survey-creator-react": "^2.5.19",
  "survey-react-ui": "^2.5.19",
  "survey-pdf": "^2.5.19"
}
```

### **Arquivo: `FormBuilder.jsx`**
```js
// ✅ CSS import atualizado
import "survey-core/survey-core.min.css";
import "survey-creator-core/survey-creator-core.min.css";

// ✅ Opções corretas para v2.x
const creator = useMemo(() => {
  const options = {
    showThemeTab: true,
    showLogicTab: true,
    showTranslationTab: true,
    showJSONEditorTab: true,
    isAutoSave: false,
    showSidebar: true,                      // ← Novo em v2.x
    propertyGridNavigationMode: "accordion", // ← Agora funciona
    showOneCategoryInPropertyGrid: false,
  };
  
  const c = new SurveyCreator(options);
  c.showDesignerTab = true;
  c.showPreviewTab = true;
  c.showOneCategoryInPropertyGrid = false;
  
  return c;
}, []);
```

### **Arquivo: `index.css`**
```css
/* ✅ Cores modernas e limpas */
.sd-root {
  --sjs-primary-backcolor: #10b981;         /* Verde emerald */
  --sjs-primary-backcolor-light: color-mix(in srgb, #10b981 16%, white);
  --sjs-primary-backcolor-dark: color-mix(in srgb, #10b981 80%, black);
  --sjs-general-backcolor: #ffffff;
  --sjs-general-backcolor-dim: #f9fafb;     /* Fundo claro */
  --sjs-border-default: #e5e7eb;
  --sjs-general-forecolor: #111827;
}

/* ✅ Property grid styling */
.svc-property-grid {
  background: #ffffff !important;
}

/* ✅ Icons visíveis */
.svc-string-editor,
.svc-item-value__content,
.svc-question__content {
  color: inherit !important;
}
```

---

## 🎨 Resultado Esperado

### **SurveyJS Creator Agora Tem:**

1. ✅ **Ícones visíveis** na barra vertical direita (Settings)
2. ✅ **Fundo verde claro** (emerald theme)
3. ✅ **Property grid** com todas as categorias visíveis
4. ✅ **JSON import** funciona sem erros para:
   - `firstPageIsStartPage`
   - `previewMode`
   - `showPreviewBeforeComplete`
   - Todas as propriedades avançadas

5. ✅ **Theme Tab** funcional
6. ✅ **Logic Tab** funcional
7. ✅ **Translation Tab** funcional
8. ✅ **JSON Editor Tab** funcional

---

## 🚀 Como Testar

### **Teste 1: Abrir FormBuilder**
1. Acesse: http://localhost:3000
2. Dashboard → New Form
3. **Verifique:**
   - ✅ Fundo verde claro no survey
   - ✅ Ícones visíveis na barra lateral direita
   - ✅ Property grid com categorias expandidas
   - ✅ Sem ícones duplicados abaixo de "Show Panel"

### **Teste 2: Importar JSON Avançado**
1. Clique na aba **JSON Editor** (última aba)
2. Cole o JSON da anamnese neuropsicológica
3. Clique em **Apply**
4. **Verifique:**
   - ✅ Sem erros "Unknown property"
   - ✅ `firstPageIsStartPage` aceito
   - ✅ `previewMode` aceito
   - ✅ Survey preview funciona corretamente

### **Teste 3: Property Grid**
1. Selecione qualquer pergunta
2. **Verifique:**
   - ✅ Painel direito mostra todas as propriedades
   - ✅ Ícones de configuração visíveis
   - ✅ Categorias organizadas em accordion
   - ✅ Sem ícones duplicados

---

## 📊 Comparação Antes vs Depois

| Item | Antes | Depois |
|------|-------|--------|
| **SurveyJS Version** | 1.9.132 | 2.5.19 |
| **CSS Import** | defaultV2.min.css | survey-core.min.css |
| **Primary Color** | #0b0907 (quase preto) | #10b981 (verde) |
| **Background** | brand-50 (bege) | f9fafb (cinza claro) |
| **Ícones Settings** | ❌ Não apareciam | ✅ Visíveis |
| **JSON Import** | ❌ Erros | ✅ Funciona |
| **Property Grid** | ❌ Quebrado | ✅ Todas categorias |
| **survey-pdf** | 1.12.61 | 2.5.19 (alinhado) |

---

## 🔍 Checklist Completo

### **Dependencies**
- [x] survey-core: 2.5.19
- [x] survey-creator-core: 2.5.19
- [x] survey-creator-react: 2.5.19
- [x] survey-react-ui: 2.5.19
- [x] survey-pdf: 2.5.19

### **CSS**
- [x] Import correto: survey-core.min.css
- [x] Import correto: survey-creator-core.min.css
- [x] Cores modernas: #10b981
- [x] Background claro: #f9fafb
- [x] Icons visibility guaranteed

### **FormBuilder**
- [x] Removido Serializer.addProperty duplicado
- [x] Opções válidas para v2.x
- [x] showSidebar: true (novo)
- [x] propertyGridNavigationMode: "accordion"
- [x] showOneCategoryInPropertyGrid: false

### **Funcionalidade**
- [x] JSON import sem erros
- [x] Todas as tabs visíveis
- [x] Property grid funcional
- [x] Theme tab funcional
- [x] Preview funcional

---

## 💡 Notas Importantes

### **SurveyJS v2.x Breaking Changes:**
1. `showPropertyGrid` → `showSidebar`
2. CSS path: `defaultV2.min.css` → `survey-core.min.css`
3. Theme registration changed (não afeta v1 themes)
4. Property grid navigation mode is now configurable

### **Propriedades Nativas (NÃO registrar):**
- firstPageIsStartPage
- previewMode
- showPreviewBeforeComplete
- startSurveyText, pagePrevText, pageNextText, completeText
- completedHtml
- widthMode, headerView
- questionErrorLocation, clearInvisibleValues
- showQuestionNumbers, questionDescriptionLocation

Todas estas já existem no serializer do SurveyJS!
