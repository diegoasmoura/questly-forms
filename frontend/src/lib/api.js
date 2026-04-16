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
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    const data = await res.json();
    
    if (!res.ok) {
      throw new ApiError(data.error || "Request failed", res.status, data);
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
  extendShareLink: (id, days = 30, type = "renewal") => request(`/share/${id}/extend`, { method: "PATCH", body: JSON.stringify({ days, type }) }),

  // Public share
  getSharedForm: (token) => request(`/share/${token}`),
  submitSharedForm: (token, data) => request(`/share/${token}/submit`, { method: "POST", body: JSON.stringify(data) }),

  // Patients
  getPatients: () => request("/patients"),
  getPatient: (id) => request(`/patients/${id}`),
  createPatient: (data) => request("/patients", { method: "POST", body: JSON.stringify(data) }),
  updatePatient: (id, data) => request(`/patients/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deletePatient: (id) => request(`/patients/${id}`, { method: "DELETE" }),
};

export { ApiError };
