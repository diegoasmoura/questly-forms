const API_URL = import.meta.env.VITE_API_URL || "/api";
const REQUEST_TIMEOUT = 15000;

class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    console.log(`API Request: ${options.method || 'GET'} ${endpoint}`, options.body ? JSON.parse(options.body) : '');
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    if (res.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    if (!res.ok) {
      if (isJson) {
        const data = await res.json();
        throw new ApiError(data.error || "Request failed", res.status, data);
      }
      throw new ApiError("Request failed (status: " + res.status + ")", res.status);
    }

    if (!isJson || res.status === 204) {
      return { success: true };
    }

    let data;
    try {
      data = await res.json();
    } catch (e) {
      throw new ApiError("Resposta inválida do servidor", res.status);
    }
    
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === "AbortError") {
      throw new ApiError("Tempo limite da requisição excedido", 408, null);
    }
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(error.message || "Erro de conexão", 0, null);
  }
}

export const api = {
  // Auth
  login: (credentials) => request("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
  register: (data) => request("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  me: () => request("/auth/me"),
  updateProfile: (data) => request("/auth/profile", { method: "PUT", body: JSON.stringify(data) }),
  uploadAvatar: async (file) => {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("avatar", file);

    const res = await fetch(`${API_URL}/auth/avatar`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = {}; }
      throw new ApiError(data.error || `Erro ao fazer upload (${res.status})`, res.status);
    }

    return res.json();
  },

  // Forms
  getForms: () => request("/forms"),
  getForm: (id) => request(`/forms/${id}`),
  createForm: (data) => request("/forms", { method: "POST", body: JSON.stringify(data) }),
  updateForm: (id, data) => request(`/forms/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteForm: (id) => request(`/forms/${id}`, { method: "DELETE" }),
  duplicateForm: (id) => request(`/forms/${id}/duplicate`, { method: "POST" }),
  getFormStats: (id) => request(`/forms/${id}/stats`),

  // Responses
  getResponses: (formId) => request(`/responses/form/${formId}`),
  getResponse: (id) => request(`/responses/${id}`),
  deleteResponse: (id) => request(`/responses/${id}`, { method: "DELETE" }),
  getAggregate: (formId) => request(`/responses/form/${formId}/aggregate`),

  // Share
  createShareLink: (data) => request("/share/create", { method: "POST", body: JSON.stringify(data) }),
  getShareLinks: (formId) => request(`/share/form/${formId}`),
  getShareLinksForPatient: (patientId) => request(`/share/patient/${patientId}`),
  revokeShareLink: (id) => request(`/share/${id}/revoke`, { method: "PATCH" }),

  // Public share
  getSharedForm: (token) => request(`/share/${token}`),
  submitSharedForm: (token, data) => request(`/share/${token}/submit`, { method: "POST", body: JSON.stringify(data) }),

  // Patients
  getPatients: () => request("/patients"),
  getPatient: (id) => request(`/patients/${id}`),
  createPatient: (data) => request("/patients", { method: "POST", body: JSON.stringify(data) }),
  updatePatient: (id, data) => request(`/patients/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deletePatient: (id) => request(`/patients/${id}`, { method: "DELETE" }),
  updatePatientFunnel: (id, data) => request(`/patients/${id}/funnel`, { method: "PATCH", body: JSON.stringify(data) }),
  exportPatientRecord: (id) => request(`/patients/${id}/export`),
  sendWhatsAppReminder: (data) => request("/notifications/send-reminder", { method: "POST", body: JSON.stringify(data) }),

  // Attachments
  getAttachments: (patientId) => request(`/attachments/patient/${patientId}`),
  uploadAttachment: async (patientId, file) => {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);
    
    const res = await fetch(`${API_URL}/attachments/${patientId}/attachments`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    
    if (!res.ok) {
      const data = await res.json();
      throw new ApiError(data.error || "Erro ao fazer upload", res.status);
    }
    
    return res.json();
  },
  deleteAttachment: (attachmentId) => request(`/attachments/${attachmentId}`, { method: "DELETE" }),
  downloadAttachment: async (attachmentId, filename) => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      throw new ApiError("Não autorizado", 401);
    }
    
    const res = await fetch(`${API_URL}/attachments/${attachmentId}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (res.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
      throw new ApiError("Sessão expirada", 401);
    }
    
    const contentType = res.headers.get("content-type") || "";
    if (!res.ok) {
      if (contentType === "application/json") {
        const data = await res.json();
        throw new ApiError(data.error || "Erro ao baixar arquivo", res.status);
      }
      throw new ApiError("Erro ao baixar arquivo (status: " + res.status + ")", res.status);
    }
    
    if (!contentType || contentType.includes("text/html")) {
      throw new ApiError("Arquivo não encontrado", 404);
    }
    
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // Appointments (Agenda)
  getAppointments: () => request("/appointments"),
  getPatientAppointments: (patientId) => request(`/appointments/patient/${patientId}`),
  deletePatientAppointments: (patientId) => request(`/appointments/patient/${patientId}`, { method: "DELETE" }),
  deletePatientAppointmentsByTime: (patientId, time) => request(`/appointments/patient/${patientId}/time/${time}`, { method: "DELETE" }),
  saveAppointmentsBatch: (patientId, slots) => request("/appointments/batch", { 
    method: "POST", 
    body: JSON.stringify({ patientId, slots }) 
  }),
  createAppointment: (data) => request("/appointments", { 
    method: "POST", 
    body: JSON.stringify(data) 
  }),
  updateAppointment: (id, data) => request(`/appointments/${id}`, { 
    method: "PUT", 
    body: JSON.stringify(data) 
  }),
  deleteAppointment: (id) => request(`/appointments/${id}`, { 
    method: "DELETE" 
  }),
  checkAppointmentConflict: (data) => request("/appointments/check-conflict", { 
    method: "POST", 
    body: JSON.stringify(data) 
  }),
  
  // Attendance (presença/falta)
  getAttendances: () => request("/attendances"),
  getAttendanceStats: (startDate, endDate) => request(`/attendances/stats?startDate=${startDate}&endDate=${endDate}`),
  saveAttendance: (data) => request("/attendances", {
    method: "POST",
    body: JSON.stringify(data)
  }),
  deleteAttendance: (id) => request(`/attendances/${id}`, { method: "DELETE" }),
  getAttendanceDescendants: (id) => request(`/attendances/${id}/descendants`),

  // Payments
  getPayments: () => request("/payments"),
  getPatientPayments: (patientId) => request(`/payments/patient/${patientId}`),
  savePayment: (data) => request("/payments", {
    method: "POST",
    body: JSON.stringify(data)
  }),
  updatePayment: (id, data) => request(`/payments/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  }),
  deletePayment: (id) => request(`/payments/${id}`, { method: "DELETE" }),
  
  // Settings
  getSettings: () => request("/settings"),
  updateSettings: (data) => request("/settings", { method: "PUT", body: JSON.stringify(data) }),
};

export { ApiError };
