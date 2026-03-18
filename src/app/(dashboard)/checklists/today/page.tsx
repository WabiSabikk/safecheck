'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ClipboardCheck, CheckCircle2, Clock, AlertTriangle, History } from 'lucide-react';
import type { ChecklistSubmission, ChecklistTemplate } from '@/types/database';

type SubmissionWithTemplate = ChecklistSubmission & { template: ChecklistTemplate };

export default function ChecklistsTodayPage() {
  const [checklists, setChecklists] = useState<SubmissionWithTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChecklists = async () => {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/checklists?date=${today}`);
      if (res.ok) {
        const data = await res.json();
        setChecklists(data);
      }
      setLoading(false);
    };
    fetchChecklists();
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

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

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Today&apos;s Checklists</h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link href="/checklists" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <History className="h-4 w-4" />
          History
        </Link>
      </div>

      {checklists.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium">No checklists for today</p>
            <p className="text-sm text-muted-foreground">
              Checklists will appear here when they&apos;re scheduled
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
