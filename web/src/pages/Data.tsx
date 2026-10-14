import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { formatDateTime, formatDueDate } from "@/lib/format";
import { CHANNEL_COLORS } from "@/lib/labels";
import type { Application, Contact, Interaction, Organization, Task } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Segmented } from "@/components/ui/segmented";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrganizationForm } from "@/components/forms/OrganizationForm";
import { ContactForm } from "@/components/forms/ContactForm";
import { TaskForm } from "@/components/forms/TaskForm";
import { InteractionForm } from "@/components/forms/InteractionForm";

type Tab = "organizations" | "contacts" | "tasks" | "interactions";

const TABS: { value: Tab; label: string }[] = [
  { value: "organizations", label: "Organizations" },
  { value: "contacts", label: "Contacts" },
  { value: "tasks", label: "Tasks" },
  { value: "interactions", label: "Interactions" },
];

type DialogState =
  | { kind: "organization"; entity?: Organization }
  | { kind: "contact"; entity?: Contact }
  | { kind: "task"; entity?: Task }
  | { kind: "interaction"; entity?: Interaction }
  | null;

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        onClick={onEdit}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        title="Edit"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={onDelete}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600"
        title="Delete"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function Data() {
  const [tab, setTab] = useState<Tab>("organizations");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [dialog, setDialog] = useState<DialogState>(null);

  async function refresh() {
    const [o, c, t, i, a] = await Promise.all([
      api.listOrganizations(),
      api.listContacts(),
      api.listTasks(),
      api.listAllInteractions(),
      api.listApplications(),
    ]);
    setOrganizations(o);
    setContacts(c);
    setTasks(t);
    setInteractions(i);
    setApplications(a);
  }

  useEffect(() => {
    refresh();
  }, []);

  const orgName = (id?: number | null) => organizations.find((o) => o.id === id)?.name ?? "—";
  const appName = (id?: number | null) => applications.find((a) => a.id === id)?.program_name ?? "—";
  const contactName = (id?: number | null) => contacts.find((c) => c.id === id)?.name ?? "—";

  async function remove(kind: Tab, id: number) {
    if (!window.confirm("Delete this record? This cannot be undone.")) return;
    if (kind === "organizations") await api.deleteOrganization(id);
    if (kind === "contacts") await api.deleteContact(id);
    if (kind === "tasks") await api.deleteTask(id);
    if (kind === "interactions") await api.deleteInteraction(id);
    await refresh();
  }

  async function toggleTask(task: Task) {
    await api.updateTask(task.id, { done: !task.done });
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)));
  }

  function empty(text: string) {
    return <p className="py-10 text-center text-sm text-muted-foreground">{text}</p>;
  }

  const addButtons: Record<Tab, () => void> = {
    organizations: () => setDialog({ kind: "organization" }),
    contacts: () => setDialog({ kind: "contact" }),
    tasks: () => setDialog({ kind: "task" }),
    interactions: () => setDialog({ kind: "interaction" }),
  };

  const dialogTitle = dialog
    ? dialog.entity
      ? "Edit record"
      : "New record"
    : "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Data</h1>
        <div className="flex items-center gap-2">
          <Segmented options={TABS} value={tab} onChange={setTab} />
          <Button size="sm" onClick={addButtons[tab]}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </div>

      {tab === "organizations" &&
        (organizations.length === 0 ? (
          empty("No organizations yet. Click “Add”.")
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Website</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.name}</TableCell>
                  <TableCell>{o.type ?? "—"}</TableCell>
                  <TableCell>{o.country ?? "—"}</TableCell>
                  <TableCell>
                    {o.website ? (
                      <a href={o.website} target="_blank" rel="noreferrer" className="hover:underline">
                        {o.website}
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <RowActions
                      onEdit={() => setDialog({ kind: "organization", entity: o })}
                      onDelete={() => remove("organizations", o.id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ))}

      {tab === "contacts" &&
        (contacts.length === 0 ? (
          empty("No contacts yet. Click “Add”.")
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.role ?? "—"}</TableCell>
                  <TableCell>{c.email ?? "—"}</TableCell>
                  <TableCell>{orgName(c.organization_id)}</TableCell>
                  <TableCell>
                    <RowActions
                      onEdit={() => setDialog({ kind: "contact", entity: c })}
                      onDelete={() => remove("contacts", c.id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ))}

      {tab === "tasks" &&
        (tasks.length === 0 ? (
          empty("No tasks yet. Click “Add”.")
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">Done</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Application</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <input type="checkbox" checked={t.done} onChange={() => toggleTask(t)} />
                  </TableCell>
                  <TableCell className={t.done ? "font-medium text-muted-foreground line-through" : "font-medium"}>
                    {t.title}
                  </TableCell>
                  <TableCell>{appName(t.application_id)}</TableCell>
                  <TableCell>{formatDueDate(t.due_date)}</TableCell>
                  <TableCell>
                    <RowActions
                      onEdit={() => setDialog({ kind: "task", entity: t })}
                      onDelete={() => remove("tasks", t.id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ))}

      {tab === "interactions" &&
        (interactions.length === 0 ? (
          empty("No interactions yet. Click “Add”.")
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Application</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {interactions.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="whitespace-nowrap">{formatDateTime(i.occurred_at)}</TableCell>
                  <TableCell>
                    <Badge className={CHANNEL_COLORS[i.channel]}>{i.channel}</Badge>
                  </TableCell>
                  <TableCell>{i.summary}</TableCell>
                  <TableCell>
                    {i.application_id ? (
                      <Link to={`/applications/${i.application_id}`} className="hover:underline">
                        {appName(i.application_id)}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{contactName(i.contact_id)}</TableCell>
                  <TableCell>
                    <RowActions
                      onEdit={() => setDialog({ kind: "interaction", entity: i })}
                      onDelete={() => remove("interactions", i.id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ))}

      <Dialog open={dialog !== null} onClose={() => setDialog(null)} title={dialogTitle}>
        {dialog?.kind === "organization" && (
          <OrganizationForm
            organization={dialog.entity}
            onSaved={() => {
              setDialog(null);
              refresh();
            }}
            onCancel={() => setDialog(null)}
          />
        )}
        {dialog?.kind === "contact" && (
          <ContactForm
            contact={dialog.entity}
            organizations={organizations}
            onSaved={() => {
              setDialog(null);
              refresh();
            }}
            onCancel={() => setDialog(null)}
          />
        )}
        {dialog?.kind === "task" && (
          <TaskForm
            task={dialog.entity}
            applications={applications}
            onSaved={() => {
              setDialog(null);
              refresh();
            }}
            onCancel={() => setDialog(null)}
          />
        )}
        {dialog?.kind === "interaction" && (
          <InteractionForm
            interaction={dialog.entity}
            applications={applications}
            contacts={contacts}
            onSaved={() => {
              setDialog(null);
              refresh();
            }}
            onCancel={() => setDialog(null)}
          />
        )}
      </Dialog>
    </div>
  );
}
