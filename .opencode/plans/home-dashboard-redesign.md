# Plano: Redesign do Home Dashboard

## Objetivo
Substituir o grid de conteúdo atual (Meus formulários + Chart/Atividades) por:
1. **Agenda do Dia** + **Comparativo do Mês** (row 1)
2. **Meus formulários reduzido** + **Aniversariantes** (row 2)

## Decisões do usuário
- ✅ Substituir o grid atual
- ✅ Remover o chart "Respostas por período"
- ✅ Incluir "Aniversariantes do mês"
- ✅ Reduzir "Meus formulários" (3 itens)

---

## Edições no `frontend/src/pages/Home.jsx`

### 1. Adicionar helpers (após `monthLabels`)

```js
function formatDateKey(date) {
  if (!date) return "";
  if (typeof date === "string") return date.split("T")[0];
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function extractUTCDate(dateStr) {
  if (!dateStr) return "";
  return dateStr.split("T")[0];
}

function parseLocalDateStr(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("T")[0].split("-").map(Number);
  return new Date(y, m - 1, d);
}
```

### 2. Adicionar estado `appointments`

**Após** `const [payments, setPayments] = useState([]);`:
```js
const [appointments, setAppointments] = useState([]);
```

### 3. Adicionar fetch de appointments no `loadData`

No `Promise.all`:
```js
const [patientsData, formsData, attendancesData, paymentsData, appointmentsData] = await Promise.all([
  api.getPatients(),
  api.getForms(),
  api.getAttendances().catch(() => []),
  api.getPayments().catch(() => []),
  api.getAppointments().catch(() => []),
]);
```

E após `setPayments(paymentsData);`:
```js
setAppointments(appointmentsData);
```

### 4. Adicionar cálculos novos (após os cálculos existentes)

```js
// Today's appointments
const todayStr = formatDateKey(today);
const todayDayOfWeek = today.getDay();

const todayAppointments = appointments
  .filter(a => {
    if (a.dayOfWeek !== todayDayOfWeek) return false;
    if (a.startDate && todayStr < extractUTCDate(a.startDate)) return false;
    if (a.endDate && todayStr > extractUTCDate(a.endDate)) return false;
    if (a.scheduledDate && todayStr !== extractUTCDate(a.scheduledDate)) return false;
    if (a.skipDates?.includes(todayStr)) return false;
    if (a.maxSessions > 0 && a.startDate) {
      const start = parseLocalDateStr(a.startDate);
      let count = 0;
      const cursor = new Date(start);
      const dayEnd = new Date(today);
      dayEnd.setHours(23, 59, 59, 999);
      while (cursor <= dayEnd) {
        if (cursor.getDay() === a.dayOfWeek) count++;
        cursor.setDate(cursor.getDate() + 7);
      }
      if (count > a.maxSessions) return false;
    }
    return true;
  })
  .map(app => {
    const att = attendances.find(
      a => a.patientId === app.patientId && extractUTCDate(a.date) === todayStr
    );
    return {
      ...app,
      attendance: att || null,
      sortTime: att?.sessionTime || app.time || "00:00",
    };
  })
  .sort((a, b) => a.sortTime.localeCompare(b.sortTime));

// Unique patients attended this month
const monthPatientIds = new Set(
  monthAttendances.filter(a => a.status === "presente").map(a => a.patientId)
);
const prevPatientIds = new Set(
  prevAttendances.filter(a => a.status === "presente").map(a => a.patientId)
);
const pacientesAtendidosMes = monthPatientIds.size;
const prevPacientesAtendidos = prevPatientIds.size;

// Birthday patients
const birthdayPatients = patients.filter(p => {
  if (!p.birthDate) return false;
  const birthMonth = new Date(p.birthDate).getMonth();
  return birthMonth === thisMonth;
}).sort((a, b) => {
  const dayA = new Date(a.birthDate).getDate();
  const dayB = new Date(b.birthDate).getDate();
  return dayA - dayB;
});
```

### 5. Substituir o grid de conteúdo inteiro

**Remover** (linhas ~285-471):
```
{/* Content Grid */}
<div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5 items-start">
  ... (todo o conteúdo: Meus formulários, Chart, Recent Activity)
</div>
```

**Adicionar**:

```jsx
{/* Row 1: Agenda + Comparativo */}
<div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5 items-start mb-5">
  {/* Left: Agenda do Dia */}
  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-6">
    <div className="flex items-center justify-between mb-[18px]">
      <h2 className="text-[22px] m-0 text-[var(--text-primary)]">Agenda do Dia</h2>
      <Link to="/agenda" className="text-[13px] font-bold text-[var(--dark-green)] dark:text-[#5CBF9D] no-underline cursor-pointer">
        Ir para agenda
      </Link>
    </div>
    {todayAppointments.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Calendar size={32} className="text-[var(--text-muted)] mb-3" />
        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
          Nenhum agendamento para hoje
        </p>
        <Link to="/agenda" className="text-xs font-bold text-[#5CBF9D] mt-2 hover:text-[var(--dark-green)] transition-colors">
          Ver agenda completa
        </Link>
      </div>
    ) : (
      todayAppointments.map((app, i) => {
        const status = app.attendance?.status || "confirmado";
        const statusColors = {
          presente: { dot: "#5CBF90", bg: "var(--sage-light)" },
          falta: { dot: "#F8A268", bg: "var(--peach-light)" },
          justificada: { dot: "#7C5CFF", bg: "var(--purple-light)" },
          confirmado: { dot: "#2E7DFF", bg: "var(--blue-light)" },
        };
        const sc = statusColors[status] || statusColors.confirmado;
        const patientName = app.patient?.name || "Paciente";
        return (
          <div key={app.id + "-" + i} className="flex items-center gap-3.5 px-2.5 py-3 rounded-[10px] border-b border-[var(--border)] last:border-b-0">
            <div className="w-[10px] h-[10px] rounded-full flex-shrink-0" style={{ background: sc.dot }} />
            <span className="text-[13px] font-bold text-[var(--text-secondary)] w-[50px] flex-shrink-0">
              {app.sortTime.slice(0, 5)}
            </span>
            <span className="flex-1 font-semibold text-[15px] text-[var(--text-primary)]">
              {patientName}
            </span>
            <span className="text-[11px] font-bold px-[9px] py-[3px] rounded-[999px]" style={{ background: sc.bg, color: sc.dot }}>
              {status === "presente" ? "Presente" : status === "falta" ? "Falta" : status === "justificada" ? "Justificada" : "Confirmado"}
            </span>
          </div>
        );
      })
    )}
  </div>

  {/* Right: Comparativo do Mês */}
  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-6">
    <h2 className="text-[20px] m-0 text-[var(--text-primary)] mb-[18px]">Comparativo do Mês</h2>
    <div className="space-y-4">
      <ComparativoItem
        label="Sessões realizadas"
        prev={prevPresencas}
        current={presencas}
        format="number"
      />
      <ComparativoItem
        label="Pacientes atendidos"
        prev={prevPacientesAtendidos}
        current={pacientesAtendidosMes}
        format="number"
      />
      <ComparativoItem
        label="Faturamento"
        prev={prevTotalPaid}
        current={totalPaid}
        format="currency"
      />
    </div>
  </div>
</div>

{/* Row 2: Forms reduzido + Aniversariantes */}
<div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5 items-start">
  {/* Left: Meus formulários */}
  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-6">
    <div className="flex items-center justify-between mb-[18px]">
      <h2 className="text-[22px] m-0 text-[var(--text-primary)]">Meus formulários</h2>
      <Link to="/my-forms" className="text-[13px] font-bold text-[var(--dark-green)] dark:text-[#5CBF9D] no-underline cursor-pointer">
        Ver todos
      </Link>
    </div>
    {forms.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <FileText size={32} className="text-[var(--text-muted)] mb-3" />
        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Nenhum formulário criado</p>
        <Link to="/my-forms" className="text-xs font-bold text-[#5CBF9D] mt-2 hover:text-[var(--dark-green)] transition-colors">
          Criar formulário
        </Link>
      </div>
    ) : (
      forms.slice(0, 3).map((f, i) => {
        const ac = accentColors[i % accentColors.length];
        const stats = formStats[f.id] || { responseCount: 0 };
        const updated = f.updatedAt ? new Date(f.updatedAt).toLocaleDateString("pt-BR") : "—";
        return (
          <Link key={f.id} to={`/forms/${f.id}/responses`}
            className="flex items-center gap-3.5 px-2.5 py-3.5 rounded-[10px] transition-colors hover:bg-[var(--surface-alt)] cursor-pointer no-underline border-b border-[var(--border)] last:border-b-0">
            <div className="w-[42px] h-[42px] rounded-[12px] flex items-center justify-center flex-shrink-0" style={{ background: ac.bg, color: ac.color }}>
              <FileText size={19} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[15px] text-[var(--text-primary)] mb-0.5">{f.title || "Sem título"}</div>
              <div className="text-[12.5px] text-[var(--text-muted)]">Atualizado em {updated}</div>
            </div>
            <div className="text-[13px] font-bold text-[var(--text-secondary)] whitespace-nowrap text-right">
              {stats.responseCount || 0}
              <span className="block font-normal text-[11px] text-[var(--text-muted)]">respostas</span>
            </div>
          </Link>
        );
      })
    )}
  </div>

  {/* Right: Aniversariantes */}
  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-6">
    <h2 className="text-[20px] m-0 text-[var(--text-primary)] mb-[18px]">Aniversariantes do mês</h2>
    {birthdayPatients.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <span className="text-2xl mb-2">🎈</span>
        <p className="text-[13px] text-[var(--text-muted)]">Sem aniversariantes este mês</p>
      </div>
    ) : (
      <div className="space-y-3">
        {birthdayPatients.map(p => {
          const day = new Date(p.birthDate).getDate();
          const initials = p.name?.split(" ")?.map(n => n[0])?.join("")?.toUpperCase()?.slice(0, 2) || "?";
          return (
            <div key={p.id} className="flex items-center gap-3">
              <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-[#7C5CFF] to-[#F8A26B] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-[14px] text-[var(--text-primary)]">{p.name}</div>
              </div>
              <span className="text-[13px] font-bold text-[var(--peach)]">{day}</span>
            </div>
          );
        })}
      </div>
    )}
  </div>
</div>
```

### 6. Adicionar componente `ComparativoItem` (após o componente `StatCard`)

```jsx
function ComparativoItem({ label, prev, current, format }) {
  const isUp = current > prev;
  const isDown = current < prev;
  const fmt = (val) => {
    if (format === "currency") {
      return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }
    return val;
  };
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-b-0">
      <span className="text-[14px] text-[var(--text-secondary)]">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-[13px] text-[var(--text-muted)]">
          {fmt(prev)}
        </span>
        <svg width="16" height="16" viewBox="0 0 16 16" className="text-[var(--text-muted)]">
          <path d="M6 12V4l-4 4m8-4v8l4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className={`text-[16px] font-extrabold ${isUp ? "text-[#5CBF90]" : isDown ? "text-[#F8A268]" : "text-[var(--text-primary)]"}`}>
          {fmt(current)}
        </span>
        {isUp && <span className="text-[11px] font-bold text-[#5CBF90]">▲</span>}
        {isDown && <span className="text-[11px] font-bold text-[#F8A268]">▼</span>}
      </div>
    </div>
  );
}
```

### 7. Adicionar `Calendar` ao import do lucide-react

Adicionar `Calendar` na lista de imports do `lucide-react`.

---

## Dados utilizados

| Seção | Dados | Origem |
|---|---|---|
| Agenda do Dia | `appointments` filtrado por hoje | `api.getAppointments()` |
| Comparativo: Sessões | `presencas` (já calculado) | `attendances` |
| Comparativo: Pacientes | `pacientesAtendidosMes` (novo) | Unique patientIds em `attendances` com status "presente" |
| Comparativo: Faturamento | `totalPaid` (já calculado) | `payments` |
| Aniversariantes | `patients[].birthDate` | `patients` (já carregado) |
| Meus formulários | `forms` (3 itens) | `forms` (já carregado) |
