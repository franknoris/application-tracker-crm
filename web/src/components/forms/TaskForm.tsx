import { useState, type FormEvent } from "react";
import { api, ApiError } from "@/lib/api";
import type { Application, Task } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function TaskForm({
  task,
  applications,
  onSaved,
  onCancel,
}: {
  task?: Task | null;
  applications: Application[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [applicationId, setApplicationId] = useState(task?.application_id ? String(task.application_id) : "");
  const [dueDate, setDueDate] = useState(task?.due_date ?? "");
  const [done, setDone] = useState(task?.done ?? false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const data = {
        title,
        application_id: applicationId ? Number(applicationId) : null,
        due_date: dueDate || null,
        done,
      };
      if (task) await api.updateTask(task.id, data);
      else await api.createTask(data);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save task");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="task-title">Title</Label>
        <Input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
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
          <Label>Due date</Label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={done} onChange={(e) => setDone(e.target.checked)} />
        Mark as done
      </label>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : task ? "Save changes" : "Create"}
        </Button>
      </div>
    </form>
  );
}
