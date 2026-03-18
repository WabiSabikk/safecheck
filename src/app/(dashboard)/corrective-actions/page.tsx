'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  ThermometerSun,
} from 'lucide-react';
import type { CorrectiveAction } from '@/types/database';

type ActionWithRefs = CorrectiveAction & {
  temperature_log?: {
    temperature: number;
    unit: string;
    equipment?: { name: string };
  } | null;
  logged_by_profile?: { display_name: string } | null;
};

export default function CorrectiveActionsPage() {
  const [actions, setActions] = useState<ActionWithRefs[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('open');
  const [resolving, setResolving] = useState<string | null>(null);

  useEffect(() => {
    const fetchActions = async () => {
      setLoading(true);
      const res = await fetch(`/api/corrective-actions?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setActions(data);
      }
      setLoading(false);
    };
    fetchActions();
  }, [filter]);

  const handleResolve = async (actionId: string) => {
    setResolving(actionId);
    const res = await fetch('/api/corrective-actions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: actionId, is_resolved: true }),
    });

    if (res.ok) {
      setActions(prev => prev.map(a =>
        a.id === actionId
          ? { ...a, is_resolved: true, resolved_at: new Date().toISOString() }
          : a
      ));
      toast.success('Corrective action resolved');
    } else {
      toast.error('Failed to resolve action');
    }
    setResolving(null);
  };

  const handleReopen = async (actionId: string) => {
    setResolving(actionId);
    const res = await fetch('/api/corrective-actions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: actionId, is_resolved: false }),
    });

    if (res.ok) {
      setActions(prev => prev.map(a =>
        a.id === actionId
          ? { ...a, is_resolved: false, resolved_at: null }
          : a
      ));
      toast.success('Corrective action reopened');
    } else {
      toast.error('Failed to reopen action');
    }
    setResolving(null);
  };

  const issueTypeLabels: Record<string, string> = {
    high_temp: 'High Temperature',
    low_temp: 'Low Temperature',
    equipment_malfunction: 'Equipment Issue',
    food_discarded: 'Food Discarded',
    other: 'Other',
  };

  const openCount = actions.filter(a => !a.is_resolved).length;
  const resolvedCount = actions.filter(a => a.is_resolved).length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Corrective Actions</h1>
        <p className="text-muted-foreground">
          Track and resolve food safety issues
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'open' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('open')}
          className={filter === 'open' ? 'bg-amber-600 hover:bg-amber-700' : ''}
        >
          <Clock className="mr-1 h-3 w-3" />
          Open {filter === 'all' ? `(${openCount})` : ''}
        </Button>
        <Button
          variant={filter === 'resolved' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('resolved')}
          className={filter === 'resolved' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
        >
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Resolved {filter === 'all' ? `(${resolvedCount})` : ''}
        </Button>
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
      </div>

      {/* Actions list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : actions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            {filter === 'open' ? (
              <>
                <CheckCircle2 className="h-12 w-12 text-emerald-500/50" />
                <p className="mt-4 text-lg font-medium">No open issues</p>
                <p className="text-sm text-muted-foreground">
                  All corrective actions have been resolved
                </p>
              </>
            ) : (
              <>
                <AlertTriangle className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-lg font-medium">No corrective actions</p>
                <p className="text-sm text-muted-foreground">
                  Actions are created when temperature violations occur
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {actions.map((action) => (
            <Card
              key={action.id}
              className={action.is_resolved ? 'border-emerald-200' : 'border-amber-200'}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={action.is_resolved ? 'default' : 'destructive'}
                        className={action.is_resolved ? 'bg-emerald-600' : ''}
                      >
                        {action.is_resolved ? 'Resolved' : 'Open'}
                      </Badge>
                      <Badge variant="outline">
                        {issueTypeLabels[action.issue_type] || action.issue_type}
                      </Badge>
                    </div>

                    {/* Linked temp log */}
                    {action.temperature_log && (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <ThermometerSun className="h-4 w-4" />
                        <span>
                          {action.temperature_log.equipment?.name}: {action.temperature_log.temperature}°{action.temperature_log.unit}
                        </span>
                      </div>
                    )}

                    <div className="space-y-1">
                      <p className="text-sm font-medium">Issue:</p>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium">Action Taken:</p>
                      <p className="text-sm text-muted-foreground">{action.action_taken}</p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                      <span>
                        By {action.logged_by_profile?.display_name || 'Staff'} at{' '}
                        {new Date(action.logged_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {action.resolved_at && (
                        <span className="text-emerald-600">
                          Resolved {new Date(action.resolved_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Resolve/Reopen button */}
                  <div className="flex-shrink-0">
                    {action.is_resolved ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReopen(action.id)}
                        disabled={resolving === action.id}
                      >
                        {resolving === action.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Reopen'
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleResolve(action.id)}
                        disabled={resolving === action.id}
                      >
                        {resolving === action.id ? (
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="mr-1 h-4 w-4" />
                        )}
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
