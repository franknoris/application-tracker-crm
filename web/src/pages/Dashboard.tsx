import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import type { Application, Task } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const [due, setDue] = useState<Task[]>([]);
  const [overdue, setOverdue] = useState<Task[]>([]);
  const [upcoming, setUpcoming] = useState<Application[]>([]);

  useEffect(() => {
    api.dueTasks(7).then(setDue);
    api.overdueTasks().then(setOverdue);
    api.upcoming(7).then(setUpcoming);
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
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
            {due.length === 0 && <p className="text-sm text-muted-foreground">Nothing due</p>}
            {due.map((t) => (
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
