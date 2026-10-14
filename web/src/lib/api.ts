import type { Application, Interaction, Organization, Stage, Task, Token, User } from "@/types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function getToken(): string | null {
  return localStorage.getItem("token");
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = typeof data?.detail === "string" ? data.detail : `Request failed (${res.status})`;
    throw new ApiError(res.status, detail);
  }
  return data as T;
}

export const api = {
  register: (email: string, password: string) =>
    request<User>("/auth/register", { method: "POST", body: JSON.stringify({ email, password }) }),
  login: (email: string, password: string) =>
    request<Token>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => request<User>("/auth/me"),

  listOrganizations: () => request<Organization[]>("/organizations"),
  createOrganization: (data: Partial<Organization>) =>
    request<Organization>("/organizations", { method: "POST", body: JSON.stringify(data) }),

  listApplications: (stage?: Stage) =>
    request<Application[]>(`/applications${stage ? `?stage=${stage}` : ""}`),
  getApplication: (id: number) => request<Application>(`/applications/${id}`),
  createApplication: (data: Partial<Application>) =>
    request<Application>("/applications", { method: "POST", body: JSON.stringify(data) }),
  updateApplication: (id: number, data: Partial<Application>) =>
    request<Application>(`/applications/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  upcoming: (days = 7) => request<Application[]>(`/applications/upcoming?days=${days}`),

  listInteractions: (applicationId: number) =>
    request<Interaction[]>(`/interactions?application_id=${applicationId}`),
  createInteraction: (data: Partial<Interaction>) =>
    request<Interaction>("/interactions", { method: "POST", body: JSON.stringify(data) }),

  listTasks: () => request<Task[]>("/tasks"),
  dueTasks: (withinDays = 7) => request<Task[]>(`/tasks/due?within_days=${withinDays}`),
  overdueTasks: () => request<Task[]>(`/tasks/due?overdue=true`),
  createTask: (data: Partial<Task>) => request<Task>("/tasks", { method: "POST", body: JSON.stringify(data) }),
  updateTask: (id: number, data: Partial<Task>) =>
    request<Task>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
};
