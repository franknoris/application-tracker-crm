import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { STAGES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { PRIORITY_COLORS, STAGE_COLORS } from "@/lib/labels";
import type { Application, Organization, Stage } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Segmented } from "@/components/ui/segmented";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApplicationForm } from "@/components/forms/ApplicationForm";

type View = "kanban" | "list" | "table";

const VIEWS: { value: View; label: string }[] = [
  { value: "kanban", label: "Kanban" },
  { value: "list", label: "List" },
  { value: "table", label: "Table" },
];

export default function Applications() {
  const [apps, setApps] = useState<Application[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [view, setView] = useState<View>(() => {
    const saved = localStorage.getItem("appsView");
    return saved === "list" || saved === "table" || saved === "kanban" ? saved : "kanban";
  });
  const [dialog, setDialog] = useState<{ mode: "create" } | { mode: "edit"; app: Application } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const [a, o] = await Promise.all([api.listApplications(), api.listOrganizations()]);
    setApps(a);
    setOrganizations(o);
  }

  async function refreshOrgs() {
    setOrganizations(await api.listOrganizations());
  }

  useEffect(() => {
    refresh();
  }, []);

  function changeView(next: View) {
    setView(next);
    localStorage.setItem("appsView", next);
  }

  const orgName = (id: number) => organizations.find((o) => o.id === id)?.name ?? "—";

  async function moveStage(app: Application, stage: Stage) {
    setError(null);
    try {
      await api.updateApplication(app.id, { stage });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not move application");
    }
  }

  async function remove(app: Application) {
    if (!window.confirm(`Delete "${app.program_name}"? This cannot be undone.`)) return;
    await api.deleteApplication(app.id);
    await refresh();
  }

  function stageSelect(app: Application) {
    return (
      <Select className="h-8 w-36 text-xs" value={app.stage} onChange={(e) => moveStage(app, e.target.value as Stage)}>
        {STAGES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>
    );
  }

  function actions(app: Application) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => setDialog({ mode: "edit", app })}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          title="Edit"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => remove(app)}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Applications</h1>
        <div className="flex items-center gap-2">
          <Segmented options={VIEWS} value={view} onChange={changeView} />
          <Button onClick={() => setDialog({ mode: "create" })}>
            <Plus className="h-4 w-4" /> New application
          </Button>
        </div>
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}

      {apps.length === 0 && (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No applications yet. Click “New application” to get started.
        </div>
      )}

      {view === "kanban" && (
        <div className="grid gap-3 md:grid-cols-4">
          {STAGES.map((stage) => (
            <div key={stage} className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{stage}</h2>
              {apps
                .filter((a) => a.stage === stage)
                .map((app) => (
                  <Card key={app.id} className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/applications/${app.id}`} className="font-medium hover:underline">
                        {app.program_name}
                      </Link>
                      {actions(app)}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {app.priority && <Badge className={PRIORITY_COLORS[app.priority]}>{app.priority}</Badge>}
                      {app.deadline && (
                        <span className="text-xs text-muted-foreground">{formatDate(app.deadline)}</span>
                      )}
                    </div>
                    <div className="mt-2">{stageSelect(app)}</div>
                  </Card>
                ))}
            </div>
          ))}
        </div>
      )}

      {view === "list" && (
        <div className="space-y-2">
          {apps.map((app) => (
            <Card key={app.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <Link to={`/applications/${app.id}`} className="font-medium hover:underline">
                  {app.program_name}
                </Link>
                <p className="text-xs text-muted-foreground">{orgName(app.organization_id)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={STAGE_COLORS[app.stage]}>{app.stage}</Badge>
                {app.priority && <Badge className={PRIORITY_COLORS[app.priority]}>{app.priority}</Badge>}
                {app.deadline && <span className="text-xs text-muted-foreground">{formatDate(app.deadline)}</span>}
                {stageSelect(app)}
                {actions(app)}
              </div>
            </Card>
          ))}
        </div>
      )}

      {view === "table" && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Program</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apps.map((app) => (
              <TableRow key={app.id}>
                <TableCell className="font-medium">
                  <Link to={`/applications/${app.id}`} className="hover:underline">
                    {app.program_name}
                  </Link>
                </TableCell>
                <TableCell>{orgName(app.organization_id)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge className={STAGE_COLORS[app.stage]}>{app.stage}</Badge>
                    {stageSelect(app)}
                  </div>
                </TableCell>
                <TableCell>{app.priority ? <Badge className={PRIORITY_COLORS[app.priority]}>{app.priority}</Badge> : "—"}</TableCell>
                <TableCell>{app.deadline ? formatDate(app.deadline) : "—"}</TableCell>
                <TableCell className="text-right">{actions(app)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog
        open={dialog !== null}
        onClose={() => setDialog(null)}
        title={dialog?.mode === "edit" ? "Edit application" : "New application"}
      >
        <ApplicationForm
          application={dialog?.mode === "edit" ? dialog.app : null}
          organizations={organizations}
          onOrganizationsChange={refreshOrgs}
          onSaved={() => {
            setDialog(null);
            refresh();
          }}
          onCancel={() => setDialog(null)}
        />
      </Dialog>
    </div>
  );
}
