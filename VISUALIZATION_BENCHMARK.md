# Benchmark: Visualização de Resultados de Pesquisas Clínicas

## 📋 Sumário Executivo

Este documento apresenta uma análise detalhada do estado atual da visualização de resultados no sistema Curious, tanto dentro quanto fora do contexto do paciente, e recomenda a melhor abordagem para implementação de gráficos clínicos.

---

## 🔍 1. Análise do Estado Atual

### 1.1 Visualização FORA do Contexto do Paciente (FormResponses.jsx)

**O que existe atualmente:**
- ✅ Cards de estatísticas básicas: Total, Hoje, Esta Semana
- ✅ Lista de respostas com preview dos primeiros 4 campos
- ✅ Visualização expandida: JSON raw em bloco `<pre>`
- ✅ Exportação CSV e PDF
- ❌ **NENHUM gráfico ou visualização de dados**

**Dados disponíveis mas não utilizados:**
```javascript
// Backend retorna dailyCounts (respostas por dia)
{ 
  total: 45,
  todayCount: 3,
  weekCount: 12,
  dailyCounts: {
    "2024-01-15": 2,
    "2024-01-16": 5,
    // ... mais dados
  }
}
```
**Problema:** `dailyCounts` é computado no backend mas **nunca renderizado** no frontend.

### 1.2 Visualização DENTRO do Contexto do Paciente (PatientRecord.jsx)

**O que existe atualmente:**
- ✅ Perfil do paciente com dados demográficos
- ✅ Notas clínicas
- ✅ Histórico clínico em timeline
- ✅ Scoring clínico para PHQ-9 e GAD-7:
  - Score numérico (ex: "15 de 27 pontos")
  - Severidade com badge colorido (Mínima, Leve, Moderada, Grave)
  - Alertas para ideação suicida
  - Interpretação clínica
- ❌ **NENHUM gráfico de tendência ou evolução temporal**
- ❌ **NENHUMA comparação entre múltiplas avaliações**

**Problemas identificados:**
1. **Sem visualização de tendência:** Não é possível ver a evolução do paciente ao longo do tempo
2. **Sem comparação entre avaliações:** Cada resposta é vista isoladamente
3. **Sem análise item-a-item:** Não mostra quais questões específicas contribuem para o score
4. **Dados brutos apenas:** Visualização em formato JSON não é clínica o suficiente

---

## 📊 2. Benchmark de Bibliotecas de Gráficos para React

### 2.1 Candidatas Avaliadas

| Biblioteca | Bundle Size | Curva de Aprendizado | SSR | Customização | Performance (<10K pts) |
|------------|-------------|---------------------|-----|--------------|------------------------|
| **Recharts** | ~133 KB | Baixa | ❌ | Alta | ✅ Excelente |
| **Nivo** | ~250 KB | Média | ✅ | Muito Alta | ✅ Excelente |
| **Chart.js (react-chartjs-2)** | ~50 KB | Baixa | ❌ | Média | ✅ Excelente |
| **Victory** | ~150 KB | Baixa | ✅ | Alta | ✅ Boa |
| **Visx (Airbnb)** | ~50-200 KB | Alta | ✅ | Máxima | ✅ Excelente |
| **Plotly.js** | ~3 MB | Média | ✅ | Alta | ⚠️ Moderada |
| **ECharts** | ~1 MB | Média | ❌ | Alta | ✅ Excelente |

### 2.2 Análise Detalhada das Top 3

#### 🏆 **Recharts** (Recomendado)
**Prós:**
- ✅ Mais popular para React (16k+ stars no GitHub)
- ✅ API declarativa e intuitiva (composição de componentes)
- ✅ Documentação excelente com exemplos interativos
- ✅ Leve o suficiente para o caso de uso (~133 KB)
- ✅ Baseado em D3, mas muito mais simples de usar
- ✅ Responsivo por padrão
- ✅ Animações suaves
- ✅ Comunidade grande e ativa

**Contras:**
- ❌ Performance degrada com >10K pontos (não é nosso caso)
- ❌ Sem SSR nativo (não usamos Next.js)
- ❌ Customização avançada pode ser verbosa

**Melhor para:** Dashboards clínicos, gráficos de tendência, comparações de severidade

---

#### 🥈 **Nivo**
**Prós:**
- ✅ Visual mais bonito e polido por padrão
- ✅ SSR nativo (útil se migrarmos para Next.js)
- ✅ Customização extremamente flexível
- ✅ Grande variedade de tipos de gráfico
- ✅ Animações excelentes

**Contras:**
- ❌ Bundle size maior (~250 KB)
- ❌ API mais complexa
- ❌ Documentação menos completa
- ❌ Overkill para nosso caso de uso

**Melhor para:** Se precisarmos de visual ultra-polished ou SSR

---

#### 🥉 **Chart.js (via react-chartjs-2)**
**Prós:**
- ✅ Menor bundle size (~50 KB)
- ✅ Mais simples de implementar
- ✅ Performance excelente
- ✅ Documentação extensa

**Contras:**
- ❌ Menos "React-native" (wrapper de biblioteca vanilla JS)
- ❌ Customização limitada comparado a Recharts/Nivo
- ❌ Menos flexível para visualizações complexas

**Melhor para:** Implementação rápida e simples

---

### 2.3 Veredito Final

**🏆 Recomendação: Recharts**

**Justificativa:**
1. **Melhor equilíbrio** entre facilidade de uso, customização e tamanho
2. **API React-first**: composição natural com componentes
3. **Perfeito para nosso caso de uso**: <1000 pontos de dados (não temos big data)
4. **Comunidade e suporte**: mais recursos, tutoriais e exemplos
5. **Manutenibilidade**: código mais legível e fácil de manter

---

## 🎯 3. Melhores Práticas para Visualização de Dados Clínicos

### 3.1 Tipos de Gráfico Recomendados por Objetivo

| Objetivo | Tipo de Gráfico | Por Quê |
|----------|----------------|---------|
| **Tendência temporal (PHQ-9/GAD-7 ao longo do tempo)** | Gráfico de Linha com bandas de confiança | Mostra evolução clara, identifica melhorias/piorações |
| **Distribuição de severidade** | Gráfico de Barras Empilhadas Divergentes | Visualiza proporção em cada categoria (Mínimo → Grave) |
| **Comparação de múltiplos pacientes** | Box Plot ou Small Multiples | Compara distribuição entre grupos |
| **Análise item-a-item** | Gráfico de Radar ou Barras Horizontais | Identifica哪些问题 específicas são mais severas |
| **Taxa de resposta ao tratamento** | Gráfico de Área com linhas de referência | Mostra cut-offs clínicos (ex: PHQ-9 ≥ 10 = moderado) |
| **Dashboard geral** | Cards + Mini sparklines | KPI rápido com tendência visual |

### 3.2 Princípios de Design para Dados Clínicos

✅ **Faça:**
- Use cores semânticas (verde → vermelho para severidade)
- Sempre mostre tamanho da amostra (n=X)
- Preservar ordem natural (Mínimo → Grave, não ordenar por valor)
- Adicionar linhas de referência para thresholds clínicos
- Anotar picos/outliers com contexto clínico
- Manter consistência entre visualizações
- Começar eixos numéricos em zero (evitar exageros)

❌ **Não faça:**
- Usar gráficos de pizza para dados ordinais/severidade
- Agregar excessivamente (só mostrar média esconde distribuição)
- Selecionar períodos cherry-picked (mostrar todos os intervalos)
- Ignorar dados faltantes (eles também são dados)
- Usar eixos que não começam em zero (distorce diferenças)

---

## 🎨 4. Recomendações de Implementação para o Curious

### 4.1 Visualização FORA do Paciente (Dashboard/FormResponses)

**Implementar:**

1. **Gráfico de Linha de Tendência** (usando `dailyCounts`)
   - Eixo X: Datas
   - Eixo Y: Número de respostas por dia
   - Mostrar tendência de preenchimento de formulários

2. **Gráfico de Barras de Severidade Agregada**
   - Para formulários PHQ-9/GAD-7
   - Mostrar distribuição: quantos em cada categoria de severidade
   - Ex: Mínimo (12), Leve (8), Moderado (15), Grave (5)

3. **Sparklines nos Cards de Estatísticas**
   - Mini gráficos de linha nos cards de stats
   - Mostrar tendência dos últimos 7 dias

**Arquivos a modificar:**
- `frontend/src/pages/FormResponses.jsx`
- `frontend/src/pages/Dashboard.jsx`

### 4.2 Visualização DENTRO do Paciente (PatientRecord)

**Implementar:**

1. **Gráfico de Tendência Longitudinal** (CRÍTICO)
   - Linha do tempo com scores PHQ-9 e GAD-7 sobrepostos
   - Linhas horizontais de referência para thresholds clínicos
   - Tooltips com data e score detalhado
   - Exemplo:
     ```
     Score
     27 |                              ● PHQ-9
        |                          ●   cutoff moderado (10)
     20 |                      ●       cutoff grave (20)
        |                  ●
     10 |----------●-------●----------- (linha de referência)
        |      ●
      0 |__●___|___|___|___|___|___ Data
        Jan  Fev Mar Abr Mai Jun
     ```

2. **Gráfico de Radar Item-a-Item**
   - Para PHQ-9: mostrar cada um dos 9 itens como eixo
   - Comparar última avaliação vs média histórica
   - Identificar哪些问题 específicas pioraram

3. **Gráfico de Barras de Severidade**
   - Timeline vertical mostrando severidade de cada avaliação
   - Código de cores: verde → amarelo → laranja → vermelho
   - Rápida visualização de padrão de melhora/piora

4. **Comparação PHQ-9 vs GAD-7**
   - Gráfico de linhas duplas
   - Mostrar depressão e ansiedade juntas
   - Identificar correlações

**Arquivos a modificar:**
- `frontend/src/pages/PatientRecord.jsx`
- `frontend/src/lib/scoring.js` (adicionar funções de agregação)

### 4.3 Estrutura de Dados Necessária

**Backend - Novo endpoint sugerido:**
```javascript
// GET /api/patients/:id/trends
{
  patientId: "abc123",
  phq9Trend: [
    { date: "2024-01-15", score: 15, maxScore: 27, severity: "Moderada" },
    { date: "2024-02-20", score: 12, maxScore: 27, severity: "Moderada" },
    { date: "2024-03-10", score: 8, maxScore: 27, severity: "Leve" }
  ],
  gad7Trend: [
    { date: "2024-01-15", score: 10, maxScore: 21, severity: "Ansiedade Moderada" },
    { date: "2024-02-20", score: 9, maxScore: 21, severity: "Ansiedade Moderada" }
  ],
  itemAnalysis: {
    phq9: {
      interest: { last: 2, avg: 1.8, trend: "stable" },
      down: { last: 3, avg: 2.5, trend: "improving" },
      // ... mais itens
    }
  }
}
```

---

## 📦 5. Estratégia para Formulários Grandes (100+ Perguntas)

### 5.1 O Problema com Visualizações Horizontais

Para formulários com 100+ perguntas (como anamneses completas, avaliações neuropsicológicas extensas, etc.), gráficos horizontais tornam-se:
- ❌ Ilegíveis (sobreposição de labels)
- ❌ Lentos para renderizar (100+ elementos DOM)
- ❌ Difíceis de navegar (scroll horizontal excessivo)
- ❌ Confusos para análise clínica

### 5.2 Solução: Tabela Dinâmica com Virtualização

**Abordagem Recomendada: TanStack Table + Virtualização**

| Biblioteca | Bundle Size | Virtualização | Customização | Curva de Aprendizado | Ideal Para |
|------------|-------------|---------------|--------------|---------------------|------------|
| **TanStack Table** | ~9 KB | Via react-window | Máxima (headless) | Média | Forms 50-500 perguntas |
| **AG Grid Community** | ~150 KB | Nativa | Alta | Baixa | Forms 100-1000+ perguntas |
| **MUI X Data Grid** | ~100 KB | Nativa (Pro) | Média | Baixa | Se já usa MUI |

### 5.3 Arquitetura Recomendada

```
┌─────────────────────────────────────────────┐
│  TAB 1: Resumo Clínico (Gráficos Recharts) │
│  - Scores ao longo do tempo (linha)         │
│  - Severidade por categoria (barras)        │
│  - Alertas clínicos                         │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  TAB 2: Tabela Detalhada (TanStack/AG Grid) │
│  - 100+ colunas virtualizadas               │
│  - Agrupamento por seção do formulário      │
│  - Colunas fixas (pin): Nome, Data, Score   │
│  - Busca e filtros                          │
│  - Toggle mostrar/ocultar colunas           │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  TAB 3: Análise Item-a-Item (Radar/Heatmap) │
│  - Apenas itens com scores anormais         │
│  - Comparação com baseline                  │
│  - Destaques de mudança significativa       │
└─────────────────────────────────────────────┘
```

### 5.4 Implementação da Tabela Dinâmica

#### Opção A: TanStack Table (Recomendado para 50-200 perguntas)

**Prós:**
- ✅ Ultra-leve (~9 KB)
- ✅ Controle total do UI (headless)
- ✅ TypeScript-first
- ✅ Integração com nosso Tailwind

**Contras:**
- ❌ Precisa implementar virtualização manualmente
- ❌ Mais código boilerplate

**Exemplo de estrutura:**
```jsx
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { Virtualizer } from '@tanstack/react-virtual';

function ResponsesTable({ responses, schema }) {
  // Extract columns from form schema
  const columns = useMemo(() => {
    const allQuestions = extractQuestionsFromSchema(schema);
    return [
      { header: 'Data', accessorKey: 'date', size: 120, pinned: true },
      { header: 'Score', accessorKey: 'score', size: 80, pinned: true },
      ...allQuestions.map(q => ({
        header: q.label,
        accessorKey: q.name,
        size: 150,
        cell: ({ value }) => renderCellByType(q.type, value)
      }))
    ];
  }, [schema]);

  const table = useReactTable({
    data: responses,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="border rounded-lg overflow-auto max-h-[600px]">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 sticky top-0">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th 
                  key={header.id}
                  className="px-3 py-2 border-b bg-white"
                  style={{ 
                    minWidth: header.column.columnDef.size,
                    position: header.column.columnDef.pinned ? 'sticky' : undefined,
                    left: header.column.columnDef.pinned ? getPinnedOffset(header) : undefined,
                    zIndex: header.column.columnDef.pinned ? 10 : undefined
                  }}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id} className="hover:bg-gray-50">
              {row.getVisibleCells().map(cell => (
                <td className="px-3 py-2 border-b">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

#### Opção B: AG Grid (Recomendado para 200-1000+ perguntas)

**Prós:**
- ✅ Virtualização nativa (rows + columns)
- ✅ Performance excelente com 100+ colunas
- ✅ Features prontas: pinning, filtering, sorting, grouping
- ✅ Integrated charting

**Contras:**
- ❌ Bundle maior (~150 KB)
- ❌ Visual menos customizável

**Exemplo:**
```jsx
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

function LargeFormResponses({ responses, schema }) {
  const columnDefs = useMemo(() => [
    { 
      field: 'createdAt', 
      headerName: 'Data', 
      pinned: 'left', 
      width: 120,
      valueFormatter: p => new Date(p.value).toLocaleDateString('pt-BR')
    },
    { 
      field: 'totalScore', 
      headerName: 'Score', 
      pinned: 'left', 
      width: 80,
      cellStyle: params => ({
        backgroundColor: getSeverityColor(params.value),
        color: 'white',
        fontWeight: 'bold'
      })
    },
    ...extractQuestionsFromSchema(schema).map(q => ({
      field: q.name,
      headerName: q.label,
      width: 150,
      cellRenderer: getCellRenderer(q.type)
    }))
  ], [schema]);

  return (
    <div className="ag-theme-alpine" style={{ height: 600, width: '100%' }}>
      <AgGridReact
        rowData={responses}
        columnDefs={columnDefs}
        rowVirtualization={true}
        columnVirtualization={true}
        defaultColDef={{ resizable: true, sortable: true, filter: true }}
        enableCellTextSelection={true}
      />
    </div>
  );
}
```

### 5.5 Funcionalidades Essenciais para 100+ Perguntas

1. **Column Pinning (Fixar Colunas)**
   - Fixar: Data, Score Total, Severidade
   - Permite scroll horizontal mantendo contexto

2. **Column Grouping (Agrupar Colunas)**
   ```
   ┌──────────────────────────────────────┐
   │     PHQ-9: Depressão (9 itens)      │
   ├────┬────┬────┬────┬────┬────┬────┬───┤
   │ Q1 │ Q2 │ Q3 │ Q4 │ Q5 │ Q6 │... │ Σ │
   └────┴────┴────┴────┴────┴────┴────┴───┘
   ```

3. **Column Visibility Toggle**
   - Mostrar/ocultar seções inteiras
   - Salvar preferências do usuário

4. **Conditional Formatting**
   - Cores por severidade (verde → vermelho)
   - Destaque para mudanças significativas
   - Ícones para alertas clínicos

5. **Search & Filter Avançado**
   - Buscar por nome da pergunta
   - Filtrar por range de scores
   - Filtrar por data/severidade

### 5.6 Quando Usar Cada Abordagem

| Cenário | Abordagem | Justificativa |
|---------|-----------|---------------|
| **PHQ-9 (9 perguntas)** | Gráfico de Barras/Radar | Simples e visual |
| **Avaliação Psicológica (50 perguntas)** | TanStack Table + Virtualização | Equilíbrio controle/performance |
| **Anamnese Completa (100-200 perguntas)** | AG Grid Community | Virtualização nativa essencial |
| **Bateria Neuropsicológica (300+ perguntas)** | AG Grid + Server-side | Performance crítica |

### 5.7 Recomendação Final para o Curious

**Implementar abordagem híbrida:**

```
Primeira fase (IMEDIATA):
├─ Recharts para scores/tendências (já planejado)
└─ Tabela simples com scroll horizontal (para forms <50 perguntas)

Segunda fase (1-2 meses):
├─ TanStack Table para forms 50-200 perguntas
├─ Agrupamento por seções
└─ Column pinning para contexto

Terceira fase (se necessário):
└─ Migrar para AG Grid se forms >200 perguntas
```

---

## 📦 6. Plano de Implementação Recomendado

### Fase 1: Fundação (1-2 semanas)
- [ ] Instalar Recharts: `npm install recharts`
- [ ] Criar componente base `ClinicalChart.jsx` com configurações padrão
- [ ] Adicionar linhas de referência para thresholds clínicos
- [ ] Criar paleta de cores clínica (verde → vermelho)

### Fase 2: Visualização Fora do Paciente (1 semana)
- [ ] Adicionar gráfico de linha em FormResponses.jsx (usando dailyCounts)
- [ ] Adicionar gráfico de barras de severidade agregada
- [ ] Adicionar sparklines nos cards do Dashboard

### Fase 3: Visualização Dentro do Paciente (2-3 semanas)
- [ ] Criar gráfico de tendência longitudinal (PHQ-9 + GAD-7)
- [ ] Adicionar gráfico de radar para análise item-a-item
- [ ] Criar visualização de severidade ao longo do tempo
- [ ] Adicionar comparações entre avaliações

### Fase 4: Aprimoramentos (1-2 semanas)
- [ ] Adicionar tooltips informativos com contexto clínico
- [ ] Implementar zoom e pan para gráficos de tendência
- [ ] Adicionar exportação de gráficos para PDF
- [ ] Criar small multiples para comparação entre pacientes

### Fase 5: Tabelas para Forms Grandes (Se necessário)
- [ ] Avaliar necessidade baseado no tamanho real dos formulários
- [ ] Implementar TanStack Table para 50-200 perguntas
- [ ] Ou migrar para AG Grid se >200 perguntas
- [ ] Adicionar virtualização, pinning, grouping

---

## 🚀 7. Exemplo de Código (Preview)

### 7.1 Gráfico de Tendência Longitudinal (PatientRecord)

```jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

function PatientTrendChart({ responses }) {
  // Transform response data into chart format
  const chartData = responses
    .filter(r => r.data.phq9_items || r.data.gad7_items)
    .map(r => {
      const phq9 = r.data.phq9_items 
        ? Object.values(r.data.phq9_items).reduce((a, b) => a + b, 0)
        : null;
      const gad7 = r.data.gad7_items 
        ? Object.values(r.data.gad7_items).reduce((a, b) => a + b, 0)
        : null;
      
      return {
        date: new Date(r.createdAt).toLocaleDateString('pt-BR'),
        phq9,
        gad7
      };
    });

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold mb-4">Evolução Clínica</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" />
          <YAxis domain={[0, 27]} />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="phq9" 
            stroke="#ef4444" 
            strokeWidth={2}
            name="PHQ-9"
          />
          <Line 
            type="monotone" 
            dataKey="gad7" 
            stroke="#f59e0b" 
            strokeWidth={2}
            name="GAD-7"
          />
          <ReferenceLine y={10} stroke="#f59e0b" strokeDasharray="3 3" label="Moderado" />
          <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="3 3" label="Grave" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### 7.2 Gráfico de Barras de Severidade (Dashboard)

```jsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function SeverityBarChart({ aggregate }) {
  const data = [
    { severity: 'Mínima', count: aggregate.minimal || 0, color: '#10b981' },
    { severity: 'Leve', count: aggregate.mild || 0, color: '#3b82f6' },
    { severity: 'Moderada', count: aggregate.moderate || 0, color: '#f59e0b' },
    { severity: 'Grave', count: aggregate.severe || 0, color: '#ef4444' },
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="severity" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count">
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
```

---

## 📈 8. Métricas de Sucesso

Após implementação, medir:

1. **Engajamento:** % de psicólogos que visualizam gráficos pelo menos 1x por semana
2. **Usabilidade:** Tempo médio para identificar tendência de paciente (deve diminuir)
3. **Satisfação:** Feedback qualitativo dos usuários sobre clareza dos dados
4. **Performance:** Tempo de carregamento de páginas com gráficos (< 2s)
5. **Adoção:** % de pacientes com gráficos de tendência visualizados

---

## 🔗 9. Referências

- [Recharts Documentation](https://recharts.org/en-US/)
- [TanStack Table Documentation](https://tanstack.com/table/latest)
- [AG Grid React](https://www.ag-grid.com/react-data-grid/)
- [Best Practices for Clinical Data Visualization](https://cssauthor.com/best-data-visualization-libraries-for-web/)
- [React Chart Libraries Comparison 2025](https://blog.openreplay.com/react-chart-libraries-2025/)
- [React Table Performance Guide for Large Datasets](https://strapi.io/blog/table-in-react-performance-guide)
- [PHQ-9 and GAD-7 Scoring Guidelines](https://pabau.com/templates/patient-health-questionnaire-and-general-anxiety-disorder-phq-9-and-gad7-template/)
- [Survey Visualization Best Practices](https://chartgen.ai/resources/blog/how-to-visualize-survey-results-charts-examples)

---

## ✅ Conclusão

**Recomendação Final: Implementar abordagem híbrida e escalável**

### Para formulários pequenos (<50 perguntas):
1. **Recharts** para visualizações clínicas:
   - Gráfico de tendência longitudinal no PatientRecord (MAIOR IMPACTO)
   - Gráfico de barras de severidade no Dashboard
   - Sparklines para trends rápidas

### Para formulários grandes (50-200+ perguntas):
2. **TanStack Table** ou **AG Grid** para visualização tabular:
   - Virtualização de colunas e linhas
   - Column pinning para contexto (Data, Score, Severidade)
   - Agrupamento por seções do formulário
   - Toggle de visibilidade de colunas
   - Conditional formatting por severidade

### Arquitetura de 3 camadas:
```
Camada 1: RESUMO CLÍNICO (Gráficos)
└─ Recharts: trends, severidade, comparações

Camada 2: DETALHAMENTO (Tabela Dinâmica)
└─ TanStack/AG Grid: 100+ colunas virtualizadas

Camada 3: ANÁLISE PROFUNDA (Item-a-Item)
└─ Radar/Heatmap: foco em itens relevantes
```

Esta abordagem proporcionará:
- ✅ Visualização clínica profissional para forms pequenos
- ✅ Escalabilidade garantida para forms grandes
- ✅ Performance otimizada via virtualização
- ✅ UX consistente entre diferentes tamanhos de formulário
- ✅ Insights acionáveis para psicólogos
- ✅ Diferencial competitivo no mercado de saúde mental

**Próximo passo:** Iniciar com Fase 1 (Recharts + tabela básica) e evoluir para TanStack/AG Grid conforme necessidade.
