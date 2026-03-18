'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Thermometer,
  Plus,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
  Legend,
} from 'recharts';
import type { TemperatureLog, Equipment } from '@/types/database';

type TempLogWithRefs = TemperatureLog & {
  equipment: Equipment;
  profile: { display_name: string };
};

type TrendLog = {
  id: string;
  temperature: number;
  unit: string;
  is_in_range: boolean;
  logged_at: string;
  min_temp_snapshot: number | null;
  max_temp_snapshot: number | null;
  equipment: { id: string; name: string; equipment_type: string };
};

type TrendData = {
  logs: TrendLog[];
  stats: {
    total: number;
    inRange: number;
    outOfRange: number;
    compliance: number;
  };
};

export default function TemperatureLogsPage() {
  const [logs, setLogs] = useState<TempLogWithRefs[]>([]);
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [trendDays, setTrendDays] = useState(7);

  useEffect(() => {
    const fetchLogs = async () => {
      const res = await fetch('/api/temperature-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
      setLoading(false);
    };
    fetchLogs();
  }, []);

  useEffect(() => {
    const fetchTrends = async () => {
      const res = await fetch(`/api/temperature-logs/trends?days=${trendDays}`);
      if (res.ok) {
        const data = await res.json();
        setTrendData(data);
      }
    };
    fetchTrends();
  }, [trendDays]);

  // Prepare chart data: group by equipment, aggregate by date
  const chartData = (() => {
    if (!trendData?.logs.length) return [];

    // Group logs by date
    const byDate = new Map<string, { date: string; displayDate: string; logs: TrendLog[] }>();
    for (const log of trendData.logs) {
      const dateKey = new Date(log.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!byDate.has(dateKey)) {
        byDate.set(dateKey, { date: dateKey, displayDate: dateKey, logs: [] });
      }
      byDate.get(dateKey)!.logs.push(log);
    }

    // Get unique equipment names
    const equipmentNames = [...new Set(trendData.logs.map(l => l.equipment?.name).filter(Boolean))];

    // Build chart points
    return Array.from(byDate.values()).map(({ date, logs: dayLogs }) => {
      const point: Record<string, string | number | null> = { date };

      for (const eqName of equipmentNames) {
        const eqLogs = dayLogs.filter(l => l.equipment?.name === eqName);
        if (eqLogs.length > 0) {
          // Average temperature for the day
          const avg = eqLogs.reduce((sum, l) => sum + l.temperature, 0) / eqLogs.length;
          point[eqName] = Math.round(avg * 10) / 10;

          // Store min/max ranges
          const firstLog = eqLogs[0];
          if (firstLog.min_temp_snapshot != null) {
            point[`${eqName}_min`] = firstLog.min_temp_snapshot;
            point[`${eqName}_max`] = firstLog.max_temp_snapshot;
          }
        }
      }

      return point;
    });
  })();

  const equipmentNames = trendData?.logs
    ? [...new Set(trendData.logs.map(l => l.equipment?.name).filter(Boolean))]
    : [];

  const equipmentColors: Record<string, string> = {};
  const colorPalette = ['#059669', '#2563eb', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];
  equipmentNames.forEach((name, i) => {
    equipmentColors[name] = colorPalette[i % colorPalette.length];
  });

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  // Group recent logs by date
  const grouped = logs.reduce<Record<string, TempLogWithRefs[]>>((acc, log) => {
    const date = new Date(log.logged_at).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Temperature Logs</h1>
          <p className="text-muted-foreground">Monitor and track temperature compliance</p>
        </div>
        <Link href="/temperature-logs/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="mr-2 h-4 w-4" />
            New Log
          </Button>
        </Link>
      </div>

      {/* Compliance Stats */}
      {trendData && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span className="text-sm text-muted-foreground">Compliance</span>
              </div>
              <div className="mt-2">
                <span className={`text-2xl font-bold ${trendData.stats.compliance >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {trendData.stats.compliance}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Last {trendDays} days</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Thermometer className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-muted-foreground">Total Readings</span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold">{trendData.stats.total}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <span className="text-sm text-muted-foreground">In Range</span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold text-emerald-600">{trendData.stats.inRange}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span className="text-sm text-muted-foreground">Violations</span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold text-red-600">{trendData.stats.outOfRange}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Temperature Trend Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Temperature Trends</CardTitle>
              <div className="flex gap-1">
                {[7, 14, 30].map((d) => (
                  <Button
                    key={d}
                    variant={trendDays === d ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTrendDays(d)}
                    className={trendDays === d ? 'bg-emerald-600 hover:bg-emerald-700 h-7 px-2 text-xs' : 'h-7 px-2 text-xs'}
                  >
                    {d}d
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    label={{ value: '°F', position: 'insideLeft', offset: 10, style: { fontSize: 12 } }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value) => [`${value}°F`]}
                  />
                  <Legend />
                  {/* FDA critical limits */}
                  <ReferenceLine y={41} stroke="#fbbf24" strokeDasharray="5 5" label={{ value: '41°F max cold', position: 'right', fill: '#d97706', fontSize: 10 }} />
                  <ReferenceLine y={135} stroke="#fbbf24" strokeDasharray="5 5" label={{ value: '135°F min hot', position: 'right', fill: '#d97706', fontSize: 10 }} />

                  {equipmentNames.map((name) => (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={equipmentColors[name]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Logs */}
      {logs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Thermometer className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium">No temperature logs yet</p>
            <p className="text-sm text-muted-foreground">
              Start logging temperatures to track compliance
            </p>
            <Link href="/temperature-logs/new" className="mt-4">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Log First Temperature
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <h2 className="text-lg font-semibold">Recent Readings</h2>
          {Object.entries(grouped).map(([date, dayLogs]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">{date}</h3>
              <Card>
                <CardContent className="divide-y p-0">
                  {dayLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        {log.is_in_range ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{log.equipment?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            by {log.profile?.display_name} at{' '}
                            {new Date(log.logged_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-lg font-bold ${
                          log.is_in_range ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {log.temperature}°{log.unit}
                        </span>
                        {!log.is_in_range && (
                          <p className="text-xs text-red-500">
                            Range: {log.min_temp_snapshot}-{log.max_temp_snapshot}°{log.unit}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
