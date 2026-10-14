import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/lib/api";
import type { Application, Channel, Interaction, Task } from "@/types";
import { CHANNELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function ApplicationDetail() {
  const { id } = useParams();
  const appId = Number(id);

  const [app, setApp] = useState<Application | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [summary, setSummary] = useState("");
  const [channel, setChannel] = useState<Channel>("email");
  const [taskTitle, setTaskTitle] = useState("");

  async function refresh() {
    const [a, i, t] = await Promise.all([api.getApplication(appId), api.listInteractions(appId), api.listTasks()]);
    setApp(a);
    setInteractions(i);
    setTasks(t.filter((task) => task.application_id === appId));
  }

  useEffect(() => {
    refresh();
  }, [appId]);

  async function addInteraction(e: FormEvent) {
    e.preventDefault();
    await api.createInteraction({ application_id: appId, channel, summary });
    setSummary("");
    await refresh();
  }

  async function addTask(e: FormEvent) {
    e.preventDefault();
    await api.createTask({ application_id: appId, title: taskTitle });
    setTaskTitle("");
    await refresh();
  }

  async function toggleTask(task: Task) {
    await api.updateTask(task.id, { done: !task.done });
    await refresh();
  }

  if (!app) return <div className="p-8 text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{app.program_name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Stage: <Badge>{app.stage}</Badge>
          {app.deadline && <> · due {new Date(app.deadline).toLocaleString()}</>}
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Interactions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={addInteraction} className="space-y-2">
              <Select value={channel} onChange={(e) => setChannel(e.target.value as Channel)}>
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
              <Textarea
                placeholder="What happened?"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                required
              />
              <Button type="submit" size="sm">
                Log interaction
              </Button>
            </form>
            <div className="space-y-3">
              {interactions.length === 0 && <p className="text-sm text-muted-foreground">No interactions yet</p>}
              {interactions.map((i) => (
                <div key={i.id} className="border-l-2 pl-3">
                  <p className="text-sm">{i.summary}</p>
                  <p className="text-xs text-muted-foreground">
                    {i.channel} · {new Date(i.occurred_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={addTask} className="flex gap-2">
              <Input placeholder="New task" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
              <Button type="submit" size="sm">
                Add
              </Button>
            </form>
            <div className="space-y-2">
              {tasks.length === 0 && <p className="text-sm text-muted-foreground">No tasks</p>}
              {tasks.map((t) => (
                <label key={t.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={t.done} onChange={() => toggleTask(t)} />
                  <span className={t.done ? "text-muted-foreground line-through" : ""}>{t.title}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
