import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { STAGES } from "@/lib/constants";
import { toLocalInput } from "@/lib/format";
import { ORG_TYPES, TIMEZONES } from "@/lib/labels";
import type { Application, Organization, Stage } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function ApplicationForm({
  application,
  organizations,
  onOrganizationsChange,
  onSaved,
  onCancel,
}: {
  application?: Application | null;
  organizations: Organization[];
  onOrganizationsChange: () => Promise<void>;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [organizationId, setOrganizationId] = useState(application ? String(application.organization_id) : "");
  const [programName, setProgramName] = useState(application?.program_name ?? "");
  const [stage, setStage] = useState<Stage>(application?.stage ?? "researching");
  const [priority, setPriority] = useState(application?.priority ?? "");
  const [deadline, setDeadline] = useState(application?.deadline ? toLocalInput(application.deadline) : "");
  const [timezone, setTimezone] = useState(application?.deadline_timezone ?? "Asia/Tokyo");
  const [fundingNotes, setFundingNotes] = useState(application?.funding_notes ?? "");
  const [notes, setNotes] = useState(application?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [showOrgQuick, setShowOrgQuick] = useState(false);
  const [quickOrgName, setQuickOrgName] = useState("");
  const [quickOrgType, setQuickOrgType] = useState("");

  async function quickAddOrg() {
    if (!quickOrgName.trim()) return;
    try {
      const org = await api.createOrganization({ name: quickOrgName, type: quickOrgType || null });
      setQuickOrgName("");
      setQuickOrgType("");
      setShowOrgQuick(false);
      await onOrganizationsChange();
      setOrganizationId(String(org.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add organization");
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const data = {
        organization_id: Number(organizationId),
        program_name: programName,
        stage,
        priority: priority || null,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        deadline_timezone: deadline ? timezone : null,
        funding_notes: fundingNotes || null,
        notes: notes || null,
      };
      if (application) await api.updateApplication(application.id, data);
      else await api.createApplication(data);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save application");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="app-name">Program name</Label>
        <Input
          id="app-name"
          value={programName}
          onChange={(e) => setProgramName(e.target.value)}
          required
          autoFocus
          placeholder="e.g. OIST Research Internship"
        />
      </div>

      <div className="space-y-2">
        <Label>Organization</Label>
        <Select value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} required>
          <option value="">Select…</option>
          {organizations.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </Select>
        {!showOrgQuick ? (
          <button
            type="button"
            onClick={() => setShowOrgQuick(true)}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <Plus className="h-3 w-3" /> New organization
          </button>
        ) : (
          <div className="space-y-2 rounded-lg border p-3">
            <Input
              placeholder="Organization name"
              value={quickOrgName}
              onChange={(e) => setQuickOrgName(e.target.value)}
            />
            <Select value={quickOrgType} onChange={(e) => setQuickOrgType(e.target.value)}>
              <option value="">Type…</option>
              {ORG_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={quickAddOrg} disabled={!quickOrgName.trim()}>
                Add
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowOrgQuick(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Stage</Label>
          <Select value={stage} onChange={(e) => setStage(e.target.value as Stage)}>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="">None</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Deadline</Label>
        <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
      </div>
      {deadline && (
        <div className="space-y-2">
          <Label>Deadline time zone</Label>
          <Select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
            {TIMEZONES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label>Funding notes</Label>
        <Textarea
          value={fundingNotes}
          onChange={(e) => setFundingNotes(e.target.value)}
          placeholder="Stipend, housing, travel…"
        />
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
          {saving ? "Saving…" : application ? "Save changes" : "Create application"}
        </Button>
      </div>
    </form>
  );
}
