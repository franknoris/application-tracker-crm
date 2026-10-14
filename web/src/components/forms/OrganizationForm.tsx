import { useState, type FormEvent } from "react";
import { api, ApiError } from "@/lib/api";
import { ORG_TYPES } from "@/lib/labels";
import type { Organization } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function OrganizationForm({
  organization,
  onSaved,
  onCancel,
}: {
  organization?: Organization | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(organization?.name ?? "");
  const [type, setType] = useState(organization?.type ?? "");
  const [country, setCountry] = useState(organization?.country ?? "");
  const [website, setWebsite] = useState(organization?.website ?? "");
  const [notes, setNotes] = useState(organization?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const data = { name, type: type || null, country: country || null, website: website || null, notes: notes || null };
      if (organization) await api.updateOrganization(organization.id, data);
      else await api.createOrganization(data);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save organization");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="org-name">Name</Label>
        <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
      </div>
      <div className="space-y-2">
        <Label>Type</Label>
        <Select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">—</option>
          {ORG_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Country</Label>
          <Input value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Website</Label>
          <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
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
          {saving ? "Saving…" : organization ? "Save changes" : "Create"}
        </Button>
      </div>
    </form>
  );
}
