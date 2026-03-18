'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Circle,
  ChevronLeft,
  MessageSquare,
  Loader2,
  Send,
} from 'lucide-react';
import type { ChecklistSubmission, ChecklistTemplate, ChecklistItem } from '@/types/database';

type SubmissionWithTemplate = ChecklistSubmission & { template: ChecklistTemplate };

export default function ChecklistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [submission, setSubmission] = useState<SubmissionWithTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [noteItem, setNoteItem] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  const fetchChecklist = useCallback(async () => {
    const res = await fetch(`/api/checklists/${params.id}`);
    if (res.ok) {
      const data = await res.json();
      setSubmission(data);
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    fetchChecklist();
  }, [fetchChecklist]);

  const handleToggleItem = async (item: ChecklistItem) => {
    if (!submission || submission.status === 'completed') return;
    setSaving(item.id);

    const responses = submission.responses || {};
    const currentState = responses[item.id]?.completed || false;

    const res = await fetch(`/api/checklists/${submission.id}/respond`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemId: item.id,
        completed: !currentState,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setSubmission(prev => prev ? { ...prev, responses: data.responses, status: prev.status === 'pending' ? 'in_progress' : prev.status } : null);
    } else {
      toast.error('Failed to save');
    }

    setSaving(null);
  };

  const handleSaveNote = async (itemId: string) => {
    if (!submission) return;

    const res = await fetch(`/api/checklists/${submission.id}/respond`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemId,
        completed: submission.responses?.[itemId]?.completed || false,
        note: noteText,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setSubmission(prev => prev ? { ...prev, responses: data.responses } : null);
      setNoteItem(null);
      setNoteText('');
      toast.success('Note saved');
    }
  };

  const handleSubmitChecklist = async () => {
    if (!submission) return;
    setSubmitting(true);

    const res = await fetch(`/api/checklists/${submission.id}/submit`, {
      method: 'POST',
    });

    if (res.ok) {
      toast.success('Checklist completed!');
      router.push('/checklists/today');
    } else {
      const data = await res.json();
      toast.error(data.error || 'Failed to submit');
    }

    setSubmitting(false);
  };

  if (loading || !submission) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  const items = submission.template?.items || [];
  const responses = submission.responses || {};
  const completedCount = items.filter(i => responses[i.id]?.completed).length;
  const percent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;
  const isCompleted = submission.status === 'completed';

  // Group items by category
  const categories = items.reduce<Record<string, ChecklistItem[]>>((acc, item) => {
    const cat = item.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const allRequiredDone = items
    .filter(i => i.is_required)
    .every(i => responses[i.id]?.completed);

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{submission.template?.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">
              {completedCount}/{items.length} items
            </span>
            <Badge variant={isCompleted ? 'default' : 'secondary'}>
              {submission.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Progress */}
      <Progress value={percent} className="h-3" />

      {/* Items grouped by category */}
      {Object.entries(categories).map(([category, categoryItems]) => (
        <Card key={category}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {category}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {categoryItems.map((item) => {
              const response = responses[item.id];
              const isDone = response?.completed;
              const isSaving = saving === item.id;

              return (
                <div key={item.id}>
                  <button
                    onClick={() => handleToggleItem(item)}
                    disabled={isCompleted || isSaving}
                    className="flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-muted-foreground" />
                    ) : isDone ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Circle className="mt-0.5 h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <span className={`text-sm ${isDone ? 'line-through text-muted-foreground' : ''}`}>
                        {item.description}
                      </span>
                      {item.is_required && !isDone && (
                        <span className="ml-2 text-xs text-red-500">Required</span>
                      )}
                      {response?.note && (
                        <p className="mt-1 text-xs text-muted-foreground bg-muted rounded px-2 py-1">
                          {response.note}
                        </p>
                      )}
                    </div>
                    {!isCompleted && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setNoteItem(noteItem === item.id ? null : item.id);
                          setNoteText(response?.note || '');
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                    )}
                  </button>

                  {/* Note input */}
                  {noteItem === item.id && (
                    <div className="ml-8 mb-2 flex gap-2">
                      <Textarea
                        placeholder="Add a note..."
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        className="min-h-[60px] text-sm"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleSaveNote(item.id)}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {/* Submit button */}
      {!isCompleted && (
        <div className="sticky bottom-16 md:bottom-0 pb-4">
          <Button
            onClick={handleSubmitChecklist}
            disabled={!allRequiredDone || submitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-base"
          >
            {submitting ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-5 w-5" />
            )}
            Complete Checklist ({percent}%)
          </Button>
          {!allRequiredDone && (
            <p className="text-center text-xs text-muted-foreground mt-2">
              Complete all required items to submit
            </p>
          )}
        </div>
      )}
    </div>
  );
}
