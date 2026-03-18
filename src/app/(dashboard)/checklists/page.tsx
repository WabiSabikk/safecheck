'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  ClipboardCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import type { ChecklistSubmission, ChecklistTemplate } from '@/types/database';

type SubmissionWithTemplate = ChecklistSubmission & { template: ChecklistTemplate };

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function isToday(date: Date): boolean {
  const today = new Date();
  return formatDate(date) === formatDate(today);
}

export default function ChecklistHistoryPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [checklists, setChecklists] = useState<SubmissionWithTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChecklists = async () => {
      setLoading(true);
      const dateStr = formatDate(selectedDate);
      const res = await fetch(`/api/checklists?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        setChecklists(data);
      }
      setLoading(false);
    };
    fetchChecklists();
  }, [selectedDate]);

  const navigateDay = (offset: number) => {
    setSelectedDate(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() + offset);
      return next;
    });
  };

  const getCompletionPercent = (submission: SubmissionWithTemplate): number => {
    const items = submission.template?.items || [];
    if (items.length === 0) return 0;
    const responses = submission.responses || {};
    const completed = items.filter(item => responses[item.id]?.completed).length;
    return Math.round((completed / items.length) * 100);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'overdue': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'in_progress': return <Clock className="h-5 w-5 text-amber-500" />;
      default: return <ClipboardCheck className="h-5 w-5 text-muted-foreground" />;
    }
  };

  // Calculate daily compliance
  const totalItems = checklists.reduce((sum, c) => sum + (c.template?.items?.length || 0), 0);
  const completedItems = checklists.reduce((sum, c) => {
    const items = c.template?.items || [];
    const responses = c.responses || {};
    return sum + items.filter(i => responses[i.id]?.completed).length;
  }, 0);
  const dailyCompliance = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  const allCompleted = checklists.length > 0 && checklists.every(c => c.status === 'completed');

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with date navigation */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Checklist History</h1>
          {!isToday(selectedDate) && (
            <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
              Today
            </Button>
          )}
        </div>

        {/* Date navigator */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateDay(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 relative">
            <Input
              type="date"
              value={formatDate(selectedDate)}
              onChange={(e) => {
                if (e.target.value) setSelectedDate(new Date(e.target.value + 'T12:00:00'));
              }}
              max={formatDate(new Date())}
              className="text-center"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateDay(1)}
            disabled={isToday(selectedDate)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground text-center">
          {formatDisplayDate(selectedDate)}
          {isToday(selectedDate) && <Badge variant="secondary" className="ml-2">Today</Badge>}
        </p>
      </div>

      {/* Daily compliance summary */}
      {checklists.length > 0 && (
        <Card className={allCompleted ? 'border-emerald-200 bg-emerald-50' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Daily Compliance
              </span>
              <span className={`text-lg font-bold ${allCompleted ? 'text-emerald-600' : ''}`}>
                {dailyCompliance}%
              </span>
            </div>
            <Progress value={dailyCompliance} className="h-2" />
            <p className="mt-2 text-xs text-muted-foreground">
              {completedItems}/{totalItems} items completed across {checklists.length} checklists
            </p>
          </CardContent>
        </Card>
      )}

      {/* Checklists list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : checklists.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium">No checklists for this date</p>
            <p className="text-sm text-muted-foreground">
              {isToday(selectedDate)
                ? "Checklists will appear here when they're scheduled"
                : 'No checklists were recorded on this day'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {checklists.map((checklist) => {
            const percent = getCompletionPercent(checklist);
            const items = checklist.template?.items || [];
            const responses = checklist.responses || {};
            const completedCount = items.filter(i => responses[i.id]?.completed).length;

            return (
              <Link key={checklist.id} href={`/checklists/${checklist.id}`}>
                <Card className="cursor-pointer transition-all hover:shadow-md hover:border-emerald-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(checklist.status)}
                        <CardTitle className="text-lg">
                          {checklist.template?.name}
                        </CardTitle>
                      </div>
                      <Badge variant={
                        checklist.status === 'completed' ? 'default' :
                        checklist.status === 'overdue' ? 'destructive' :
                        'secondary'
                      }>
                        {checklist.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {completedCount} of {items.length} items
                        </span>
                        <span className="font-medium">{percent}%</span>
                      </div>
                      <Progress value={percent} className="h-2" />
                      {checklist.completed_at && (
                        <p className="text-xs text-muted-foreground">
                          Completed at {new Date(checklist.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
