import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";

export function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

export function formatDateKey(date) {
  if (!date) return "";
  if (typeof date === "string") return date.split("T")[0];
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function extractUTCDate(dateStr) {
  if (!dateStr) return "";
  return dateStr.split("T")[0];
}

export function parseLocalDateStr(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("T")[0].split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function getAgeGroup(birthDate) {
  if (!birthDate) return null;
  const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
  if (age < 18) return "-18";
  if (age <= 35) return "18-35";
  if (age <= 55) return "36-55";
  return "+55";
}

export function useDashboardData() {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [forms, setForms] = useState([]);
  const [formStats, setFormStats] = useState({});
  const [attendances, setAttendances] = useState([]);
  const [payments, setPayments] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [patientsData, formsData, attendancesData, paymentsData, appointmentsData] =
        await Promise.all([
          api.getPatients(),
          api.getForms(),
          api.getAttendances().catch(() => []),
          api.getPayments().catch(() => []),
          api.getAppointments().catch(() => []),
        ]);

      setPatients(patientsData);
      setForms(formsData);
      setAttendances(attendancesData);
      setPayments(paymentsData);
      setAppointments(appointmentsData);

      const statsResults = await Promise.all(
        formsData.map((f) =>
          api.getFormStats(f.id).catch(() => ({ responseCount: 0, shareLinkCount: 0 }))
        )
      );
      const statsMap = {};
      formsData.forEach((f, i) => { statsMap[f.id] = statsResults[i]; });
      setFormStats(statsMap);
    } catch (error) {
      console.error("Failed to load home data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const today = new Date();
  const thisMonth = today.getMonth();
  const thisYear = today.getFullYear();
  const prevMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const prevYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  const monthAttendances = attendances.filter((a) => {
    const d = new Date(a.date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });
  const prevAttendances = attendances.filter((a) => {
    const d = new Date(a.date);
    return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
  });
  const monthPayments = payments.filter((p) => {
    const d = new Date(p.createdAt);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });
  const prevPayments = payments.filter((p) => {
    const d = new Date(p.createdAt);
    return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
  });

  const presencas = monthAttendances.filter((a) => a.status === "presente").length;
  const prevPresencas = prevAttendances.filter((a) => a.status === "presente").length;
  const totalMesAtendimentos = monthAttendances.length;
  const taxaPresenca = totalMesAtendimentos > 0
    ? Math.round((presencas / totalMesAtendimentos) * 100)
    : 0;
  const prevTaxaPresenca = prevAttendances.length > 0
    ? Math.round((prevPresencas / prevAttendances.length) * 100)
    : 0;
  const totalPaid = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const prevTotalPaid = prevPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const aReceberCount = monthAttendances.filter(
    (a) => (a.status === "presente" || a.status === "falta") && !a.paymentId
  ).length;

  const activePatients = patients.filter((p) => p.isActive !== false).length;
  const monthPatientIds = new Set(
    monthAttendances.filter((a) => a.status === "presente").map((a) => a.patientId)
  );

  const totalSent = Object.values(formStats).reduce((s, x) => s + (x.shareLinkCount || 0), 0);
  const totalResponses = Object.values(formStats).reduce((s, x) => s + (x.responseCount || 0), 0);
  const completionRate = totalSent > 0 ? Math.round((totalResponses / totalSent) * 100) : 0;

  const topForm = forms.length > 0
    ? forms.reduce((best, f) =>
        (formStats[f.id]?.responseCount || 0) > (formStats[best.id]?.responseCount || 0) ? f : best
      , forms[0])
    : null;

  const upcomingBirthdays = patients.filter((p) => {
    if (!p.birthDate) return false;
    const bd = new Date(p.birthDate);
    for (let i = 0; i <= 7; i++) {
      const check = new Date(today);
      check.setDate(today.getDate() + i);
      if (bd.getMonth() === check.getMonth() && bd.getDate() === check.getDate()) return true;
    }
    return false;
  }).map((p) => {
    const bd = new Date(p.birthDate);
    const thisYear = today.getFullYear();
    const next = new Date(thisYear, bd.getMonth(), bd.getDate());
    if (next < today) next.setFullYear(thisYear + 1);
    const diff = Math.round((next - today) / 86400000);
    return { ...p, daysUntil: diff };
  }).sort((a, b) => a.daysUntil - b.daysUntil);

  const genderMap = { feminino: 0, masculino: 0, outro: 0, "": 0 };
  patients.filter((p) => p.isActive !== false).forEach((p) => {
    const g = (p.gender || "").toLowerCase();
    if (g.includes("fem")) genderMap.feminino++;
    else if (g.includes("mas") || g === "m") genderMap.masculino++;
    else genderMap.outro++;
  });
  const totalGender = activePatients || 1;
  const genderData = [
    { label: "Feminino", value: genderMap.feminino, pct: Math.round((genderMap.feminino / totalGender) * 100), color: "#F8A26B" },
    { label: "Masculino", value: genderMap.masculino, pct: Math.round((genderMap.masculino / totalGender) * 100), color: "#2E7DFF" },
    { label: "Outro / N/I", value: activePatients - genderMap.feminino - genderMap.masculino, pct: Math.round(((activePatients - genderMap.feminino - genderMap.masculino) / totalGender) * 100), color: "#7C5CFF" },
  ];

  const ageGroups = ["-18", "18-35", "36-55", "+55"];
  const ageData = ageGroups.map((g) => ({
    label: g,
    value: patients.filter((p) => p.isActive !== false && getAgeGroup(p.birthDate) === g).length,
  }));
  const maxAge = Math.max(...ageData.map((d) => d.value), 1);

  const revenueData = (() => {
    const data = [];
    const monthNamesShort = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(today.getMonth() - i);
      const targetMonth = d.getMonth();
      const targetYear = d.getFullYear();
      const total = payments
        .filter((p) => {
          const pDate = new Date(p.paymentDate || p.createdAt);
          return pDate.getMonth() === targetMonth && pDate.getFullYear() === targetYear;
        })
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      data.push({
        name: monthNamesShort[targetMonth],
        faturamento: total,
      });
    }
    return data;
  })();

  function getAppointmentsForDate(date) {
    const dateStr = formatDateKey(date);
    const dayOfWeek = date.getDay();
    return appointments
      .filter((a) => {
        if (a.dayOfWeek !== dayOfWeek) return false;
        if (a.startDate && dateStr < extractUTCDate(a.startDate)) return false;
        if (a.endDate && dateStr > extractUTCDate(a.endDate)) return false;
        if (a.scheduledDate && dateStr !== extractUTCDate(a.scheduledDate)) return false;
        if (a.skipDates?.includes(dateStr)) return false;
        if (a.maxSessions > 0 && a.startDate) {
          const start = parseLocalDateStr(a.startDate);
          let count = 0;
          const cursor = new Date(start);
          const rangeEnd = new Date(date);
          rangeEnd.setHours(23, 59, 59, 999);
          while (cursor <= rangeEnd) {
            if (cursor.getDay() === a.dayOfWeek) count++;
            cursor.setDate(cursor.getDate() + 7);
          }
          if (count > a.maxSessions) return false;
        }
        return true;
      })
      .map((app) => {
        const att = attendances.find(
          (a) => a.patientId === app.patientId && extractUTCDate(a.date) === dateStr
        );
        return {
          ...app,
          attendance: att || null,
          sortTime: att?.sessionTime || app.time || "00:00",
          date,
          dateStr,
        };
      })
      .sort((a, b) => a.sortTime.localeCompare(b.sortTime));
  }

  const todayEvents = getAppointmentsForDate(today);

  const upcomingDays = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i + 1);
    return { date: d, events: getAppointmentsForDate(d) };
  }).filter((d) => d.events.length > 0).slice(0, 3);

  return {
    loading,
    activePatients,
    monthPatientIds,
    totalSent,
    totalResponses,
    completionRate,
    topForm,
    formStats,
    upcomingBirthdays,
    genderData,
    ageData,
    maxAge,
    revenueData,
    todayEvents,
    upcomingDays,
    totalPaid,
    prevTotalPaid,
    aReceberCount,
    taxaPresenca,
    prevTaxaPresenca,
    presencas,
    totalMesAtendimentos,
    loadData,
  };
}
