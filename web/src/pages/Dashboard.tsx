import { useEffect, useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { api } from "@/lib/api";
import { STAGES } from "@/lib/constants";
import { STAGE_HEX, STAGE_LABELS } from "@/lib/labels";
import type { Application, Interaction, Organization, Task } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { cn } from "@/lib/utils";

const TYPE_HEX: Record<string, string> = {
  company: "#6366f1",
  institute: "#0ea5e9",
  university: "#22c55e",
  other: "#f59e0b",
};

type MonthBucket = { key: string; label: string; start: Date; end: Date };

function buildMonths(count: number): MonthBucket[] {
  const now = new Date();
  const out: MonthBucket[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    out.push({
      key: `${start.getFullYear()}-${start.getMonth()}`,
      label: start.toLocaleString(undefined, { month: "short" }),
      start,
      end,
    });
  }
  return out;
}

function inBucket(iso: string | null | undefined, bucket: MonthBucket): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return d >= bucket.start && d < bucket.end;
}

function trend(series: number[]): number | null {
  if (series.length < 2) return null;
  const last = series[series.length - 1];
  const prev = series[series.length - 2];
  if (prev === 0) return last === 0 ? 0 : null;
  return ((last - prev) / prev) * 100;
}

function cumulative(series: number[]): number[] {
  let sum = 0;
  return series.map((value) => (sum += value));
}

function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  const id = `spark-${useId().replace(/:/g, "")}`;
  const stroke = up ? "#22c55e" : "#ef4444";
  const points = data.map((value, index) => ({ index, value }));
  return (
    <ResponsiveContainer width="100%" height={44}>
      <AreaChart data={points} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="value" stroke={stroke} strokeWidth={2} fill={`url(#${id})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function DeltaChip({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
        <Minus className="h-3 w-3" />—
      </span>
    );
  }
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium",
        up
          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
      )}
    >
      <Icon className="h-3 w-3" />
      {up ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  );
}

export default function Dashboard() {
  const [apps, setApps] = useState<Application[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [upcoming, setUpcoming] = useState<Application[]>([]);
  const [metric, setMetric] = useState<"applications" | "interactions">("applications");

  useEffect(() => {
    api.listApplications().then(setApps);
    api.listOrganizations().then(setOrganizations);
    api.listTasks().then(setTasks);
    api.listAllInteractions().then(setInteractions);
    api.upcoming(7).then(setUpcoming);
  }, []);

  const months = useMemo(() => buildMonths(12), []);

  const appsByMonth = useMemo(
    () => months.map((b) => apps.filter((a) => inBucket(a.created_at, b)).length),
    [months, apps]
  );
  const interactionsByMonth = useMemo(
    () => months.map((b) => interactions.filter((i) => inBucket(i.occurred_at, b)).length),
    [months, interactions]
  );
  const offersByMonth = useMemo(
    () => months.map((b) => apps.filter((a) => a.stage === "offer" && inBucket(a.created_at, b)).length),
    [months, apps]
  );

  const chartData = months.map((b, i) => ({
    label: b.label,
    applications: appsByMonth[i],
    interactions: interactionsByMonth[i],
  }));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setDate(today.getDate() + 7);

  const offers = apps.filter((a) => a.stage === "offer").length;
  const rejected = apps.filter((a) => a.stage === "rejected").length;
  const decided = offers + rejected;
  const winRate = decided ? (offers / decided) * 100 : 0;

  const futureDeadlines = apps.filter((a) => a.deadline && new Date(a.deadline) >= today);
  const avgDays = futureDeadlines.length
    ? Math.round(
        futureDeadlines.reduce(
          (sum, a) => sum + (new Date(a.deadline as string).getTime() - today.getTime()) / 86400000,
          0
        ) / futureDeadlines.length
      )
    : null;

  const kpis = [
    { label: "Total Applications", value: String(apps.length), series: cumulative(appsByMonth), delta: trend(appsByMonth) },
    { label: "Offers Won", value: String(offers), series: cumulative(offersByMonth), delta: trend(offersByMonth) },
    { label: "Win Rate", value: `${winRate.toFixed(1)}%`, series: cumulative(offersByMonth), delta: null as number | null },
    { label: "Avg. Deadline", value: avgDays === null ? "—" : `${avgDays}d`, series: appsByMonth, delta: null as number | null },
  ];

  const stageData = STAGES.map((s) => ({
    stage: s,
    name: STAGE_LABELS[s],
    value: apps.filter((a) => a.stage === s).length,
    fill: STAGE_HEX[s],
  })).filter((d) => d.value > 0);

  const orgRows = useMemo(
    () =>
      organizations
        .map((o) => {
          const list = apps.filter((a) => a.organization_id === o.id);
          const won = list.filter((a) => a.stage === "offer").length;
          const lost = list.filter((a) => a.stage === "rejected").length;
          const rate = won + lost ? (won / (won + lost)) * 100 : 0;
          return {
            id: o.id,
            name: o.name,
            meta: [o.type, o.country].filter(Boolean).join(" · ") || "Organization",
            apps: list.length,
            offers: won,
            rate,
          };
        })
        .filter((r) => r.apps > 0)
        .sort((a, b) => b.apps - a.apps || b.offers - a.offers)
        .slice(0, 5),
    [organizations, apps]
  );

  const typeData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of organizations) {
      const key = o.type ?? "other";
      counts[key] = (counts[key] ?? 0) + 1;
    }
    const total = organizations.length || 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name,
        count,
        pct: (count / total) * 100,
        color: TYPE_HEX[name] ?? "#94a3b8",
      }));
  }, [organizations]);

  const overdue = tasks.filter((t) => !t.done && t.due_date && new Date(t.due_date) < today);
  const dueSoon = tasks.filter(
    (t) => !t.done && t.due_date && new Date(t.due_date) >= today && new Date(t.due_date) <= horizon
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">CRM</h1>
        <p className="text-sm text-muted-foreground">Manage your applications, pipeline, and deadlines.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{k.label}</span>
                <DeltaChip value={k.delta} />
              </div>
              <p className="mt-1 text-3xl font-semibold tabular-nums">{k.value}</p>
              <div className="-mx-1 mt-2">
                <Sparkline data={k.series} up={(k.delta ?? 0) >= 0} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Pipeline Overview</CardTitle>
            <Segmented
              value={metric}
              onChange={setMetric}
              options={[
                { value: "applications", label: "Applications" },
                { value: "interactions", label: "Interactions" },
              ]}
            />
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-xs text-muted-foreground">
              Monthly{" "}
              {metric === "applications" ? "applications created" : "logged interactions"} over the last year
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="pipelineFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey={metric} stroke="#6366f1" strokeWidth={2} fill="url(#pipelineFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deal Stages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={stageData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={90}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {stageData.map((d) => (
                      <Cell key={d.stage} fill={d.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold">{apps.length}</span>
                <span className="text-xs text-muted-foreground">deals</span>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {stageData.map((d) => (
                <div key={d.stage} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.fill }} />
                    {d.name}
                  </span>
                  <span className="tabular-nums">{d.value}</span>
                </div>
              ))}
              {stageData.length === 0 && <p className="text-sm text-muted-foreground">No applications yet</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Top Organizations</CardTitle>
            <Link to="/data" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="px-0 pb-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-2 font-medium">#</th>
                  <th className="px-2 py-2 font-medium">Organization</th>
                  <th className="px-2 py-2 text-right font-medium">Apps</th>
                  <th className="px-2 py-2 text-right font-medium">Offers</th>
                  <th className="px-6 py-2 font-medium">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {orgRows.map((r, i) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="px-6 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-2 py-3">
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs capitalize text-muted-foreground">{r.meta}</div>
                    </td>
                    <td className="px-2 py-3 text-right tabular-nums">{r.apps}</td>
                    <td className="px-2 py-3 text-right tabular-nums">{r.offers}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${r.rate}%` }} />
                        </div>
                        <span className="tabular-nums text-xs text-muted-foreground">{r.rate.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {orgRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-6 text-center text-sm text-muted-foreground">
                      No organizations yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Sources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="-mt-2 text-xs text-muted-foreground">Where your organizations come from</p>
            {typeData.map((t) => (
              <div key={t.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize text-muted-foreground">{t.name}</span>
                  <span className="tabular-nums">{t.pct.toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${t.pct}%`, background: t.color }} />
                </div>
              </div>
            ))}
            {typeData.length === 0 && <p className="text-sm text-muted-foreground">No organizations yet</p>}
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
