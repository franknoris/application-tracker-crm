import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/lib/api";
import { STAGES } from "@/lib/constants";
import type { Application, Organization, Task } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PIE_COLORS = ["#6366f1", "#22c55e", "#eab308", "#ef4444", "#0ea5e9"];

export default function Dashboard() {
  const [apps, setApps] = useState<Application[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [upcoming, setUpcoming] = useState<Application[]>([]);

  useEffect(() => {
    api.listApplications().then(setApps);
    api.listOrganizations().then(setOrganizations);
    api.listTasks().then(setTasks);
    api.upcoming(7).then(setUpcoming);
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setDate(today.getDate() + 7);

  const overdue = tasks.filter((t) => !t.done && t.due_date && new Date(t.due_date) < today);
  const dueSoon = tasks.filter(
    (t) => !t.done && t.due_date && new Date(t.due_date) >= today && new Date(t.due_date) <= horizon
  );

  const stageData = STAGES.map((s) => ({ name: s, count: apps.filter((a) => a.stage === s).length }));

  const priorityCounts: Record<string, number> = {};
  for (const a of apps) {
    const p = a.priority ?? "none";
    priorityCounts[p] = (priorityCounts[p] ?? 0) + 1;
  }
  const priorityData = Object.entries(priorityCounts).map(([name, value]) => ({ name, value }));

  const stats = [
    { label: "Applications", value: apps.length },
    { label: "Deadlines (7d)", value: upcoming.length },
    { label: "Open tasks", value: tasks.filter((t) => !t.done).length },
    { label: "Organizations", value: organizations.length },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Applications by stage</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stageData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Applications by priority</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={priorityData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {priorityData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              {priorityData.map((d, i) => (
                <span key={d.name} className="flex items-center gap-1 text-xs">
                  <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {d.name} ({d.value})
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Overdue tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overdue.length === 0 && <p className="text-sm text-muted-foreground">Nothing overdue</p>}
            {overdue.map((t) => (
              <p key={t.id} className="text-sm">
                {t.title}
              </p>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Due in 7 days</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {dueSoon.length === 0 && <p className="text-sm text-muted-foreground">Nothing due</p>}
            {dueSoon.map((t) => (
              <p key={t.id} className="text-sm">
                {t.title}
              </p>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Deadlines coming up</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcoming.length === 0 && <p className="text-sm text-muted-foreground">None</p>}
            {upcoming.map((a) => (
              <Link key={a.id} to={`/applications/${a.id}`} className="block text-sm hover:underline">
                {a.program_name} <Badge>{a.stage}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
