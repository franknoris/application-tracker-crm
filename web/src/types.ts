export type Stage =
  | "researching"
  | "contacted"
  | "applying"
  | "submitted"
  | "interview"
  | "offer"
  | "rejected"
  | "withdrawn";

export type Channel = "email" | "portal" | "whatsapp" | "call" | "meeting" | "other";

export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface Organization {
  id: number;
  name: string;
  country?: string | null;
  website?: string | null;
  type?: string | null;
  notes?: string | null;
}

export interface Contact {
  id: number;
  organization_id?: number | null;
  name: string;
  role?: string | null;
  email?: string | null;
  notes?: string | null;
}

export interface Application {
  id: number;
  organization_id: number;
  program_name: string;
  stage: Stage;
  deadline?: string | null;
  deadline_timezone?: string | null;
  priority?: string | null;
  funding_notes?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface Interaction {
  id: number;
  application_id?: number | null;
  contact_id?: number | null;
  channel: Channel;
  summary: string;
  occurred_at: string;
}

export interface Task {
  id: number;
  application_id?: number | null;
  title: string;
  due_date?: string | null;
  done: boolean;
}

export interface Token {
  access_token: string;
  token_type: string;
}
