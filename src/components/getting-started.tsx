'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Refrigerator,
  ListChecks,
  Thermometer,
  BookOpen,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface SetupStatus {
  hasEquipment: boolean;
  hasTemplates: boolean;
  hasFirstTempLog: boolean;
  hasTeamMembers: boolean;
}

const steps = [
  {
    id: 'equipment',
    title: 'Add Your Equipment',
    description: 'Add fridges, freezers, and hot-holding units with safe temperature ranges',
    href: '/settings/equipment',
    icon: Refrigerator,
    statusKey: 'hasEquipment' as const,
  },
  {
    id: 'templates',
    title: 'Set Up Checklists',
    description: 'Create opening/closing checklist templates for your daily routine',
    href: '/settings/templates',
    icon: ListChecks,
    statusKey: 'hasTemplates' as const,
  },
  {
    id: 'temp',
    title: 'Log First Temperature',
    description: 'Record your first temperature reading — takes 30 seconds',
    href: '/temperature-logs/new',
    icon: Thermometer,
    statusKey: 'hasFirstTempLog' as const,
  },
  {
    id: 'team',
    title: 'Invite Team Members',
    description: 'Add staff so they can log temps and complete checklists',
    href: '/settings/team',
    icon: Users,
    statusKey: 'hasTeamMembers' as const,
  },
];

export function GettingStarted() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const [equipRes, tempRes] = await Promise.all([
          fetch('/api/settings/equipment'),
          fetch('/api/temperature-logs?limit=1'),
        ]);

        const equipment = equipRes.ok ? await equipRes.json() : [];
        const tempLogs = tempRes.ok ? await tempRes.json() : [];

        setStatus({
          hasEquipment: Array.isArray(equipment) && equipment.length > 0,
          hasTemplates: true, // Templates are created during setup by default
          hasFirstTempLog: Array.isArray(tempLogs) && tempLogs.length > 0,
          hasTeamMembers: false, // Will check in a follow-up, not critical for MVP
        });
      } catch {
        setStatus({
          hasEquipment: false,
          hasTemplates: false,
          hasFirstTempLog: false,
          hasTeamMembers: false,
        });
      }
      setLoading(false);
    };
    fetchStatus();
  }, []);

  if (loading || dismissed || !status) return null;

  const completedCount = steps.filter(s => status[s.statusKey]).length;
  const allDone = completedCount === steps.length;
  const progress = Math.round((completedCount / steps.length) * 100);

  // Don't show if user has completed the essential steps (equipment + first temp log)
  if (status.hasEquipment && status.hasFirstTempLog) return null;

  return (
    <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              Getting Started with SafeCheck
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Complete these steps to start tracking food safety compliance
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Dismiss
          </button>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">{completedCount} of {steps.length} steps</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-3">
          {steps.map((step) => {
            const done = status[step.statusKey];
            return (
              <Link
                key={step.id}
                href={step.href}
                className={`flex items-center gap-4 rounded-lg border p-4 transition-all ${
                  done
                    ? 'border-emerald-200 bg-emerald-50/50 opacity-70'
                    : 'border-gray-200 bg-white hover:border-emerald-300 hover:shadow-sm'
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0 ${
                  done ? 'bg-emerald-100' : 'bg-gray-100'
                }`}>
                  {done ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <step.icon className="h-5 w-5 text-gray-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${done ? 'line-through text-muted-foreground' : ''}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {step.description}
                  </p>
                </div>
                {!done && <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
              </Link>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t">
          <Link href="/help">
            <Button variant="ghost" size="sm" className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100">
              <BookOpen className="mr-2 h-4 w-4" />
              Read the Food Safety Guide
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
