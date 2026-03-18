'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ClipboardCheck,
  Thermometer,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { GettingStarted } from '@/components/getting-started';
import type { ChecklistSubmission, TemperatureLog } from '@/types/database';

interface DashboardData {
  checklists: (ChecklistSubmission & { template: { name: string; checklist_type: string } })[];
  violations: (TemperatureLog & { equipment: { name: string } })[];
  correctiveActions: { id: string; is_resolved: boolean; issue_type: string; description: string; logged_at: string }[];
  stats: {
    checklistCompletion: number;
    totalChecklists: number;
    completedChecklists: number;
    tempCompliance: number;
    totalTempLogs: number;
    violationCount: number;
  };
}

interface WeeklyData {
  thisWeek: {
    checklistCompliance: number;
    tempCompliance: number;
    missedChecklists: number;
    violations: number;
    totalActions: number;
    resolvedActions: number;
  };
  trends: {
    checklistTrend: number;
    tempTrend: number;
    violationTrend: number;
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [weekly, setWeekly] = useState<WeeklyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      // Auto-schedule today's checklists first
      await fetch('/api/checklists/schedule', { method: 'POST' }).catch(() => {});

      const [dashRes, weeklyRes] = await Promise.all([
        fetch('/api/reports/dashboard'),
        fetch('/api/reports/weekly'),
      ]);
      if (dashRes.ok) {
        const json = await dashRes.json();
        setData(json);
      }
      if (weeklyRes.ok) {
        const json = await weeklyRes.json();
        setWeekly(json);
      }
      setLoading(false);
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  const stats = data?.stats;
  const openActions = data?.correctiveActions?.filter(a => !a.is_resolved) || [];
  const hasActiveViolations = (stats?.violationCount || 0) > 0;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Getting Started for new users */}
      <GettingStarted />

      {/* Alert banner for active violations */}
      {hasActiveViolations && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-800">Temperature Violations Detected</h3>
              <p className="text-sm text-red-700 mt-1">
                {stats?.violationCount} violation{stats?.violationCount !== 1 ? 's' : ''} in the last 7 days.
                {openActions.length > 0 && ` ${openActions.length} corrective action${openActions.length !== 1 ? 's' : ''} pending resolution.`}
              </p>
              <div className="flex gap-2 mt-3">
                <Link href="/corrective-actions">
                  <Button size="sm" variant="destructive" className="h-8 text-xs">
                    View Actions
                  </Button>
                </Link>
                <Link href="/temperature-logs">
                  <Button size="sm" variant="outline" className="h-8 text-xs border-red-300 text-red-700 hover:bg-red-100">
                    View Logs
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Open corrective actions alert */}
      {openActions.length > 0 && !hasActiveViolations && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800">Pending Corrective Actions</h3>
              <p className="text-sm text-amber-700 mt-1">
                {openActions.length} corrective action{openActions.length !== 1 ? 's' : ''} need{openActions.length === 1 ? 's' : ''} resolution.
              </p>
              <Link href="/corrective-actions" className="mt-2 inline-block">
                <Button size="sm" variant="outline" className="h-8 text-xs border-amber-300 text-amber-700 hover:bg-amber-100">
                  Review Actions
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-emerald-600" />
              <span className="text-sm text-muted-foreground">Checklists</span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold">
                {stats?.completedChecklists || 0}/{stats?.totalChecklists || 0}
              </span>
            </div>
            <Progress
              value={stats?.checklistCompletion || 0}
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-muted-foreground">Temp Compliance</span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold">
                {stats?.tempCompliance || 100}%
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {stats?.totalTempLogs || 0} logs today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span className="text-sm text-muted-foreground">Violations</span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-amber-600">
                {stats?.violationCount || 0}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span className="text-sm text-muted-foreground">Overall</span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-emerald-600">
                {stats && stats.checklistCompletion >= 80 && stats.tempCompliance >= 90
                  ? 'Good'
                  : 'Needs Attention'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/checklists/today">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center justify-between pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                  <ClipboardCheck className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium">Start Checklist</p>
                  <p className="text-sm text-muted-foreground">
                    {stats?.totalChecklists && stats.totalChecklists - (stats?.completedChecklists || 0) > 0
                      ? `${stats.totalChecklists - stats.completedChecklists} pending`
                      : 'All done!'}
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/temperature-logs/new">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center justify-between pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <Thermometer className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Log Temperature</p>
                  <p className="text-sm text-muted-foreground">Quick 30-second entry</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Weekly Summary */}
      {weekly && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weekly Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Checklist Compliance</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xl font-bold ${weekly.thisWeek.checklistCompliance >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {weekly.thisWeek.checklistCompliance}%
                  </span>
                  {weekly.trends.checklistTrend !== 0 && (
                    <Badge variant="outline" className={`text-xs ${weekly.trends.checklistTrend > 0 ? 'text-emerald-600 border-emerald-200' : 'text-red-600 border-red-200'}`}>
                      {weekly.trends.checklistTrend > 0 ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                      {weekly.trends.checklistTrend > 0 ? '+' : ''}{weekly.trends.checklistTrend}%
                    </Badge>
                  )}
                </div>
                {weekly.thisWeek.missedChecklists > 0 && (
                  <p className="text-xs text-amber-600">
                    {weekly.thisWeek.missedChecklists} missed this week
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Temp Compliance</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xl font-bold ${weekly.thisWeek.tempCompliance >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {weekly.thisWeek.tempCompliance}%
                  </span>
                  {weekly.trends.tempTrend !== 0 && (
                    <Badge variant="outline" className={`text-xs ${weekly.trends.tempTrend >= 0 ? 'text-emerald-600 border-emerald-200' : 'text-red-600 border-red-200'}`}>
                      {weekly.trends.tempTrend > 0 ? '+' : ''}{weekly.trends.tempTrend}%
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Violations</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xl font-bold ${weekly.thisWeek.violations === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {weekly.thisWeek.violations}
                  </span>
                  {weekly.trends.violationTrend !== 0 && (
                    <Badge variant="outline" className={`text-xs ${weekly.trends.violationTrend <= 0 ? 'text-emerald-600 border-emerald-200' : 'text-red-600 border-red-200'}`}>
                      {weekly.trends.violationTrend > 0 ? '+' : ''}{weekly.trends.violationTrend} vs last week
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Actions Resolved</p>
                <span className={`text-xl font-bold ${
                  weekly.thisWeek.totalActions === 0 || weekly.thisWeek.resolvedActions === weekly.thisWeek.totalActions
                    ? 'text-emerald-600'
                    : 'text-amber-600'
                }`}>
                  {weekly.thisWeek.resolvedActions}/{weekly.thisWeek.totalActions}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's checklists */}
      {data?.checklists && data.checklists.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today&apos;s Checklists</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.checklists.map((checklist) => (
                <Link
                  key={checklist.id}
                  href={`/checklists/${checklist.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${
                      checklist.status === 'completed' ? 'bg-emerald-500' :
                      checklist.status === 'overdue' ? 'bg-red-500' :
                      checklist.status === 'in_progress' ? 'bg-amber-500' :
                      'bg-muted-foreground'
                    }`} />
                    <div>
                      <p className="font-medium text-sm">{checklist.template?.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {checklist.template?.checklist_type} checklist
                      </p>
                    </div>
                  </div>
                  <Badge variant={
                    checklist.status === 'completed' ? 'default' :
                    checklist.status === 'overdue' ? 'destructive' :
                    'secondary'
                  }>
                    {checklist.status === 'completed' && <CheckCircle2 className="mr-1 h-3 w-3" />}
                    {checklist.status === 'overdue' && <Clock className="mr-1 h-3 w-3" />}
                    {checklist.status}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent violations */}
      {data?.violations && data.violations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Recent Violations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.violations.slice(0, 5).map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3"
                >
                  <div>
                    <p className="font-medium text-sm text-red-800">
                      {v.equipment?.name}: {v.temperature}°{v.unit}
                    </p>
                    <p className="text-xs text-red-600">
                      Range: {v.min_temp_snapshot}°{v.unit} - {v.max_temp_snapshot}°{v.unit}
                    </p>
                  </div>
                  <span className="text-xs text-red-500">
                    {new Date(v.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
