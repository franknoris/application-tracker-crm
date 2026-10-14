import type { Channel, Stage } from "@/types";

export const STAGES: Stage[] = [
  "researching",
  "contacted",
  "applying",
  "submitted",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
];

export const CHANNELS: Channel[] = ["email", "portal", "whatsapp", "call", "meeting", "other"];
