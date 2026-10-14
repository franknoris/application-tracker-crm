import { useState, type FormEvent } from "react";
import { api, ApiError } from "@/lib/api";
import type { Contact, Organization } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function ContactForm({
  contact,
  organizations,
  onSaved,
  onCancel,
}: {
  contact?: Contact | null;
  organizations: Organization[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(contact?.name ?? "");
  const [organizationId, setOrganizationId] = useState(contact?.organization_id ? String(contact.organization_id) : "");
  const [role, setRole] = useState(contact?.role ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [notes, setNotes] = useState(contact?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const data = {
        name,
        organization_id: organizationId ? Number(organizationId) : null,
        role: role || null,
        email: email || null,
        notes: notes || null,
      };
      if (contact) await api.updateContact(contact.id, data);
      else await api.createContact(data);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save contact");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="contact-name">Name</Label>
        <Input id="contact-name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
      </div>
      <div className="space-y-2">
        <Label>Organization</Label>
        <Select value={organizationId} onChange={(e) => setOrganizationId(e.target.value)}>
          <option value="">—</option>
          {organizations.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Role</Label>
          <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Professor, HR…" />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : contact ? "Save changes" : "Create"}
        </Button>
      </div>
    </form>
  );
}
