const API_URL = import.meta.env.VITE_API_URL || "/api";

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
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
  revokeShareLink: (id) => request(`/share/${id}/revoke`, { method: "PATCH" }),

  // Public share
  getSharedForm: (token) => request(`/share/${token}`),
  submitSharedForm: (token, data) => request(`/share/${token}/submit`, { method: "POST", body: JSON.stringify(data) }),
};
