import { useState, type FormEvent } from "react";
import { api, ApiError } from "@/lib/api";
import { CHANNELS } from "@/lib/constants";
import { toLocalInput } from "@/lib/format";
import type { Application, Channel, Contact, Interaction } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function InteractionForm({
  interaction,
  applications,
  contacts,
  onSaved,
  onCancel,
}: {
  interaction?: Interaction | null;
  applications: Application[];
  contacts: Contact[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [channel, setChannel] = useState<Channel>(interaction?.channel ?? "email");
  const [summary, setSummary] = useState(interaction?.summary ?? "");
  const [applicationId, setApplicationId] = useState(interaction?.application_id ? String(interaction.application_id) : "");
  const [contactId, setContactId] = useState(interaction?.contact_id ? String(interaction.contact_id) : "");
  const [occurredAt, setOccurredAt] = useState(interaction?.occurred_at ? toLocalInput(interaction.occurred_at) : "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const data = {
        channel,
        summary,
        application_id: applicationId ? Number(applicationId) : null,
        contact_id: contactId ? Number(contactId) : null,
        occurred_at: occurredAt ? new Date(occurredAt).toISOString() : undefined,
      };
      if (interaction) await api.updateInteraction(interaction.id, data);
      else await api.createInteraction(data);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save interaction");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Channel</Label>
          <Select value={channel} onChange={(e) => setChannel(e.target.value as Channel)}>
            {CHANNELS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label>When</Label>
          <Input type="datetime-local" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Application</Label>
          <Select value={applicationId} onChange={(e) => setApplicationId(e.target.value)}>
            <option value="">—</option>
            {applications.map((a) => (
              <option key={a.id} value={a.id}>
                {a.program_name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Contact</Label>
          <Select value={contactId} onChange={(e) => setContactId(e.target.value)}>
            <option value="">—</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="interaction-summary">Summary</Label>
        <Textarea
          id="interaction-summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          required
          autoFocus
          placeholder="What happened?"
        />
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : interaction ? "Save changes" : "Create"}
        </Button>
      </div>
    </form>
  );
}
