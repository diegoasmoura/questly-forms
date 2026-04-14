import { useState, useCallback, useMemo } from "react";
import { api } from "../lib/api";

export function useShareLinkStatus(patientId) {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadLinks = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getShareLinksForPatient(patientId);
      setLinks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const extendLink = useCallback(async (linkId, days = 30) => {
    try {
      const result = await api.extendShareLink(linkId, days);
      await loadLinks();
      return result;
    } catch (err) {
      throw err;
    }
  }, [loadLinks]);

  const revokeLink = useCallback(async (linkId) => {
    try {
      await api.revokeShareLink(linkId);
      await loadLinks();
    } catch (err) {
      throw err;
    }
  }, [loadLinks]);

  const getStatusCounts = useMemo(() => {
    return links.reduce((acc, link) => {
      acc[link.status] = (acc[link.status] || 0) + 1;
      return acc;
    }, { PENDENTE: 0, RESPONDIDO: 0, EXPIRADO: 0 });
  }, [links]);

  const pendingLinks = useMemo(() => 
    links.filter(l => l.status === "PENDENTE"),
  [links]);

  const answeredLinks = useMemo(() => 
    links.filter(l => l.status === "RESPONDIDO"),
  [links]);

  const compliance = useMemo(() => {
    if (links.length === 0) return 0;
    return Math.round((answeredLinks.length / links.length) * 100);
  }, [links, answeredLinks]);

  return {
    links,
    loading,
    error,
    loadLinks,
    extendLink,
    revokeLink,
    getStatusCounts,
    pendingLinks,
    answeredLinks,
    compliance,
  };
}

export function getStatusBadge(status) {
  const badges = {
    PENDENTE: { bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500", text: "text-amber-700", label: "Pendente" },
    RESPONDIDO: { bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500", text: "text-emerald-700", label: "Respondido" },
    EXPIRADO: { bg: "bg-gray-50", border: "border-gray-200", dot: "bg-gray-400", text: "text-gray-500", label: "Expirado" },
  };
  return badges[status] || badges.EXPIRADO;
}

export function getDaysRemaining(expiresAt) {
  if (!expiresAt) return null;
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
