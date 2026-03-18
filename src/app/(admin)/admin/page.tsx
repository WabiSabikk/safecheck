'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, DollarSign, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { AdminStats } from '@/types/admin';

const TIER_COLORS: Record<string, string> = {
  free: '#94a3b8',
  starter: '#3b82f6',
  professional: '#10b981',
};

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />)}
      </div>
    );
  }

  if (!stats) return <div className="p-6">Failed to load stats</div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold">Platform Overview</h1>

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-violet-600" />
              <span className="text-sm text-muted-foreground">Organizations</span>
            </div>
            <span className="text-2xl font-bold mt-2 block">{stats.totalOrgs}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-muted-foreground">Users</span>
            </div>
            <span className="text-2xl font-bold mt-2 block">{stats.totalUsers}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-600" />
              <span className="text-sm text-muted-foreground">Active (7d)</span>
            </div>
            <span className="text-2xl font-bold mt-2 block">{stats.activeUsers7d}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-amber-600" />
              <span className="text-sm text-muted-foreground">MRR</span>
            </div>
            <span className="text-2xl font-bold mt-2 block">${stats.mrr}</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Signups chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Signups (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.signupsOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.signupsOverTime}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No signups in the last 30 days</p>
            )}
          </CardContent>
        </Card>

        {/* Tier distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tier Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.tierDistribution.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={stats.tierDistribution}
                      dataKey="count"
                      nameKey="tier"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      innerRadius={40}
                    >
                      {stats.tierDistribution.map(entry => (
                        <Cell key={entry.tier} fill={TIER_COLORS[entry.tier] || '#94a3b8'} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {stats.tierDistribution.map(t => (
                    <div key={t.tier} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: TIER_COLORS[t.tier] || '#94a3b8' }} />
                      <span className="text-sm capitalize">{t.tier}</span>
                      <span className="text-sm font-medium">{t.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent signups */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Signups</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentSignups.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">Email</th>
                    <th className="pb-2 font-medium">Organization</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentSignups.map(s => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="py-2">{s.display_name}</td>
                      <td className="py-2 text-muted-foreground">{s.email}</td>
                      <td className="py-2">{s.org_name}</td>
                      <td className="py-2 text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">No signups yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
