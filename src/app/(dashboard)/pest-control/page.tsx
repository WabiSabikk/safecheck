'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  Bug,
  Loader2,
  CalendarDays,
  Shield,
} from 'lucide-react';
import type { PestControlLog } from '@/types/database';
import type { SubscriptionTier } from '@/types/database';
import { UpgradePrompt } from '@/components/billing/upgrade-prompt';
import { useAuth } from '@/lib/auth/context';
import { canAccessFeature } from '@/lib/stripe/tier-check';

const AREAS = [
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'storage', label: 'Storage' },
  { value: 'dining', label: 'Dining Area' },
  { value: 'restroom', label: 'Restroom' },
  { value: 'exterior', label: 'Exterior' },
];

const TREATMENT_TYPES = [
  { value: 'spray', label: 'Spray' },
  { value: 'bait_stations', label: 'Bait Stations' },
  { value: 'traps', label: 'Traps' },
  { value: 'fumigation', label: 'Fumigation' },
];

export default function PestControlPage() {
  const { orgId, supabase } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [logs, setLogs] = useState<PestControlLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [providerName, setProviderName] = useState('');
  const [areasTreated, setAreasTreated] = useState<string[]>([]);
  const [treatmentType, setTreatmentType] = useState('');
  const [findings, setFindings] = useState('');
  const [nextServiceDate, setNextServiceDate] = useState('');
  const [reportNotes, setReportNotes] = useState('');

  useEffect(() => {
    if (!orgId) return;
    const fetchTier = async () => {
      const { data: org } = await supabase.from('organizations').select('subscription_tier').eq('id', orgId).single();
      if (org) setTier(org.subscription_tier || 'free');
    };
    fetchTier();
  }, [orgId, supabase]);

  useEffect(() => {
    const fetchLogs = async () => {
      const res = await fetch('/api/pest-control');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
      setLoading(false);
    };
    fetchLogs();
  }, []);

  const toggleArea = (area: string) => {
    setAreasTreated(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const handleCreate = async () => {
    if (!providerName.trim()) {
      toast.error('Provider name required');
      return;
    }
    if (areasTreated.length === 0) {
      toast.error('Select at least one area');
      return;
    }
    if (!treatmentType) {
      toast.error('Treatment type required');
      return;
    }

    setSaving(true);
    const res = await fetch('/api/pest-control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceDate,
        providerName: providerName.trim(),
        areasTreated,
        treatmentType,
        findings: findings.trim() || null,
        nextServiceDate: nextServiceDate || null,
        reportNotes: reportNotes.trim() || null,
      }),
    });

    if (res.ok) {
      const newLog = await res.json();
      setLogs(prev => [newLog, ...prev]);
      toast.success('Pest control log saved!');
      setDialogOpen(false);
      resetForm();
    } else {
      const data = await res.json();
      toast.error(data.error || 'Failed to save');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const res = await fetch(`/api/pest-control?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setLogs(prev => prev.filter(l => l.id !== id));
      toast.success('Log removed');
    }
    setDeleting(null);
  };

  const resetForm = () => {
    setServiceDate(new Date().toISOString().split('T')[0]);
    setProviderName('');
    setAreasTreated([]);
    setTreatmentType('');
    setFindings('');
    setNextServiceDate('');
    setReportNotes('');
  };

  const formatTreatment = (type: string) => {
    const found = TREATMENT_TYPES.find(t => t.value === type);
    return found ? found.label : type;
  };

  const formatArea = (area: string) => {
    const found = AREAS.find(a => a.value === area);
    return found ? found.label : area;
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!canAccessFeature(tier, 'pestControl')) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Pest Control Log</h1>
          <p className="text-muted-foreground">Track pest control services and inspections</p>
        </div>
        <UpgradePrompt feature="Pest Control Log" requiredTier="starter" currentTier={tier} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pest Control Log</h1>
          <p className="text-muted-foreground">Track pest control services and inspections</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Log Pest Control Service</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Service Provider</Label>
                <Input
                  placeholder="e.g., Terminix, Orkin"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                />
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Service Date</Label>
                  <Input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Next Service Date</Label>
                  <Input type="date" value={nextServiceDate} onChange={(e) => setNextServiceDate(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Areas Treated</Label>
                <div className="flex flex-wrap gap-2">
                  {AREAS.map((area) => (
                    <Button
                      key={area.value}
                      type="button"
                      variant={areasTreated.includes(area.value) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleArea(area.value)}
                      className={areasTreated.includes(area.value) ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                    >
                      {area.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Treatment Type</Label>
                <Select value={treatmentType} onValueChange={setTreatmentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select treatment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TREATMENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Findings</Label>
                <Textarea
                  placeholder="What was found during inspection..."
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Report Notes (optional)</Label>
                <Input
                  placeholder="Report file name or reference"
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                />
              </div>

              <Button
                onClick={handleCreate}
                disabled={saving}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
                Save Pest Control Log
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Upcoming service reminder */}
      {logs.length > 0 && (() => {
        const upcoming = logs.find(l => l.next_service_date && new Date(l.next_service_date) >= new Date());
        if (!upcoming) return null;
        const daysUntil = Math.ceil((new Date(upcoming.next_service_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil > 30) return null;
        return (
          <Card className={daysUntil <= 7 ? 'border-amber-200 bg-amber-50' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CalendarDays className={`h-5 w-5 ${daysUntil <= 7 ? 'text-amber-600' : 'text-blue-600'}`} />
                <span className="font-medium">
                  Next service: {upcoming.next_service_date} ({daysUntil} day{daysUntil !== 1 ? 's' : ''} away)
                </span>
                <Badge variant="outline">{upcoming.provider_name}</Badge>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Logs list */}
      {logs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bug className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium">No pest control logs</p>
            <p className="text-sm text-muted-foreground">
              Log pest control services for health inspection compliance
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{log.provider_name}</span>
                      <Badge variant="outline">{log.service_date}</Badge>
                      <Badge className="bg-emerald-600">{formatTreatment(log.treatment_type)}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(log.areas_treated || []).map((area) => (
                        <Badge key={area} variant="outline" className="text-xs">
                          {formatArea(area)}
                        </Badge>
                      ))}
                    </div>
                    {log.findings && (
                      <p className="text-sm text-muted-foreground">{log.findings}</p>
                    )}
                    {log.next_service_date && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        Next service: {log.next_service_date}
                      </p>
                    )}
                    {log.report_notes && (
                      <p className="text-xs text-muted-foreground">Report: {log.report_notes}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Logged by {log.profile?.display_name || 'Staff'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(log.id)}
                    disabled={deleting === log.id}
                    className="text-muted-foreground hover:text-red-500"
                  >
                    {deleting === log.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
