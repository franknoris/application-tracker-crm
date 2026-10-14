import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import type { Application, Contact, Interaction, Organization, Task } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Segmented } from "@/components/ui/segmented";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Tab = "organizations" | "contacts" | "tasks" | "interactions";

const TABS: { value: Tab; label: string }[] = [
  { value: "organizations", label: "Organizations" },
  { value: "contacts", label: "Contacts" },
  { value: "tasks", label: "Tasks" },
  { value: "interactions", label: "Interactions" },
];

export default function Data() {
  const [tab, setTab] = useState<Tab>("organizations");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    api.listOrganizations().then(setOrganizations);
    api.listContacts().then(setContacts);
    api.listTasks().then(setTasks);
    api.listAllInteractions().then(setInteractions);
    api.listApplications().then(setApplications);
  }, []);

  const orgName = (id?: number | null) => organizations.find((o) => o.id === id)?.name ?? "—";
  const appName = (id?: number | null) => applications.find((a) => a.id === id)?.program_name ?? "—";
  const contactName = (id?: number | null) => contacts.find((c) => c.id === id)?.name ?? "—";

  async function toggleTask(task: Task) {
    await api.updateTask(task.id, { done: !task.done });
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)));
  }

  function empty(text: string) {
    return <p className="py-8 text-sm text-muted-foreground">{text}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Data</h1>
        <Segmented options={TABS} value={tab} onChange={setTab} />
      </div>

      {tab === "organizations" &&
        (organizations.length === 0 ? (
          empty("No organizations yet.")
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Website</TableHead>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ))}

      {tab === "contacts" &&
        (contacts.length === 0 ? (
          empty("No contacts yet.")
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Organization</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.role ?? "—"}</TableCell>
                  <TableCell>{c.email ?? "—"}</TableCell>
                  <TableCell>{orgName(c.organization_id)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ))}

      {tab === "tasks" &&
        (tasks.length === 0 ? (
          empty("No tasks yet.")
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">Done</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Application</TableHead>
                <TableHead>Due</TableHead>
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
                  <TableCell>{t.due_date ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ))}

      {tab === "interactions" &&
        (interactions.length === 0 ? (
          empty("No interactions yet.")
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Application</TableHead>
                <TableHead>Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {interactions.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(i.occurred_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge>{i.channel}</Badge>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ))}
    </div>
  );
}
