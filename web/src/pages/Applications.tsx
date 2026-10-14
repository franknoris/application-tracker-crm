import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "@/lib/api";
import type { Application, Organization, Stage } from "@/types";
import { STAGES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Segmented } from "@/components/ui/segmented";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [organizationId, setOrganizationId] = useState("");
  const [programName, setProgramName] = useState("");
  const [priority, setPriority] = useState("");

  async function refresh() {
    const [a, o] = await Promise.all([api.listApplications(), api.listOrganizations()]);
    setApps(a);
    setOrganizations(o);
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

  async function create(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.createApplication({
        organization_id: Number(organizationId),
        program_name: programName,
        priority: priority || null,
      });
      setOpen(false);
      setProgramName("");
      setPriority("");
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create application");
    }
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Applications</h1>
        <div className="flex items-center gap-2">
          <Segmented options={VIEWS} value={view} onChange={changeView} />
          <Button onClick={() => setOpen(true)}>New application</Button>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {apps.length === 0 && <p className="text-sm text-muted-foreground">No applications yet.</p>}

      {view === "kanban" && (
        <div className="grid gap-3 md:grid-cols-4">
          {STAGES.map((stage) => (
            <div key={stage} className="space-y-2">
              <h2 className="text-sm font-semibold uppercase text-muted-foreground">{stage}</h2>
              {apps
                .filter((a) => a.stage === stage)
                .map((app) => (
                  <Card key={app.id} className="p-3">
                    <Link to={`/applications/${app.id}`} className="block font-medium hover:underline">
                      {app.program_name}
                    </Link>
                    {app.priority && <Badge className="mt-1">{app.priority}</Badge>}
                    {app.deadline && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Due {new Date(app.deadline).toLocaleDateString()}
                      </p>
                    )}
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
                {app.priority && <Badge>{app.priority}</Badge>}
                {app.deadline && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(app.deadline).toLocaleDateString()}
                  </span>
                )}
                {stageSelect(app)}
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
                <TableCell>{stageSelect(app)}</TableCell>
                <TableCell>{app.priority ? <Badge>{app.priority}</Badge> : "—"}</TableCell>
                <TableCell>{app.deadline ? new Date(app.deadline).toLocaleDateString() : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title="New application">
        <form onSubmit={create} className="space-y-4">
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
          </div>
          <div className="space-y-2">
            <Label>Program name</Label>
            <Input value={programName} onChange={(e) => setProgramName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="">None</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </div>
          <Button type="submit" className="w-full">
            Create
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
