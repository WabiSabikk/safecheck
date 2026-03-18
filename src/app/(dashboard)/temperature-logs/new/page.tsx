'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Thermometer,
  ChevronLeft,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getTempStatus, getTempColor } from '@/lib/validations/temperature';
import { PhotoCapture } from '@/components/photo-capture';
import type { Equipment } from '@/types/database';

export default function NewTemperatureLogPage() {
  const router = useRouter();
  const supabase = createClient();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [temperature, setTemperature] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCorrective, setShowCorrective] = useState(false);
  const [correctiveDesc, setCorrectiveDesc] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');

  useEffect(() => {
    const fetchEquipment = async () => {
      const { data } = await supabase
        .from('equipment')
        .select('*')
        .eq('is_active', true)
        .order('position');
      if (data) setEquipment(data);
      setLoading(false);
    };
    fetchEquipment();
  }, []);

  const tempNum = parseFloat(temperature);
  const tempStatus = selectedEquipment && !isNaN(tempNum)
    ? getTempStatus(tempNum, selectedEquipment.min_temp, selectedEquipment.max_temp)
    : null;

  const handleSubmit = async () => {
    if (!selectedEquipment || isNaN(tempNum)) {
      toast.error('Select equipment and enter temperature');
      return;
    }

    // If out of range and no corrective action, show form
    if (tempStatus === 'danger' && !showCorrective) {
      setShowCorrective(true);
      toast.warning('Temperature out of range! Corrective action required.');
      return;
    }

    setSubmitting(true);

    // Log temperature
    const res = await fetch('/api/temperature-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        equipmentId: selectedEquipment.id,
        temperature: tempNum,
        unit: 'F',
        notes: notes || undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || 'Failed to log temperature');
      setSubmitting(false);
      return;
    }

    const tempLog = await res.json();

    // If corrective action needed, submit it too
    if (showCorrective && correctiveDesc && correctiveAction) {
      await fetch('/api/corrective-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temperatureLogId: tempLog.id,
          locationId: tempLog.location_id,
          issueType: tempNum > (selectedEquipment.max_temp || 200) ? 'high_temp' : 'low_temp',
          description: correctiveDesc,
          actionTaken: correctiveAction,
        }),
      });
    }

    toast.success('Temperature logged!');
    // Reset for quick next entry
    setTemperature('');
    setNotes('');
    setShowCorrective(false);
    setCorrectiveDesc('');
    setCorrectiveAction('');
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Log Temperature</h1>
          <p className="text-sm text-muted-foreground">Quick 30-second entry</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Equipment selector */}
          <div className="space-y-2">
            <Label>Equipment</Label>
            <Select
              value={selectedEquipment?.id || ''}
              onValueChange={(val) => {
                const eq = equipment.find(e => e.id === val);
                setSelectedEquipment(eq || null);
                setShowCorrective(false);
              }}
            >
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="Select equipment" />
              </SelectTrigger>
              <SelectContent>
                {equipment.map((eq) => (
                  <SelectItem key={eq.id} value={eq.id} className="py-3">
                    <div>
                      <span className="font-medium">{eq.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({eq.min_temp}°F - {eq.max_temp}°F)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Temperature input — large for kitchen staff */}
          <div className="space-y-2">
            <Label>Temperature (°F)</Label>
            <div className="relative">
              <Input
                type="number"
                inputMode="decimal"
                step="0.1"
                placeholder="41.0"
                value={temperature}
                onChange={(e) => {
                  setTemperature(e.target.value);
                  setShowCorrective(false);
                }}
                className={`h-16 text-3xl text-center font-bold ${
                  tempStatus === 'safe' ? 'border-emerald-500 focus:ring-emerald-500' :
                  tempStatus === 'warning' ? 'border-amber-500 focus:ring-amber-500' :
                  tempStatus === 'danger' ? 'border-red-500 focus:ring-red-500' :
                  ''
                }`}
              />
              {tempStatus && (
                <div className={`absolute right-3 top-1/2 -translate-y-1/2 ${getTempColor(tempStatus)}`}>
                  {tempStatus === 'safe' ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <AlertTriangle className="h-6 w-6" />
                  )}
                </div>
              )}
            </div>
            {selectedEquipment && (
              <p className="text-xs text-muted-foreground text-center">
                Safe range: {selectedEquipment.min_temp}°F - {selectedEquipment.max_temp}°F
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Any observations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[60px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Corrective Action (shown when temp out of range) */}
      {showCorrective && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Corrective Action Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-red-800">What happened?</Label>
              <Textarea
                placeholder="Describe the issue (e.g., Walk-in cooler temp rising, compressor noise)"
                value={correctiveDesc}
                onChange={(e) => setCorrectiveDesc(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-red-800">What did you do?</Label>
              <Textarea
                placeholder="Describe the action taken (e.g., Moved items to backup fridge, called repair)"
                value={correctiveAction}
                onChange={(e) => setCorrectiveAction(e.target.value)}
                className="bg-white"
              />
            </div>

            {/* Photo evidence */}
            <div className="space-y-2">
              <Label className="text-red-800">Photo Evidence</Label>
              <PhotoCapture
                entityType="corrective_action"
                className="bg-white rounded-lg"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!selectedEquipment || !temperature || submitting || (showCorrective && (!correctiveDesc || !correctiveAction))}
        className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-base"
      >
        {submitting ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <Thermometer className="mr-2 h-5 w-5" />
        )}
        {showCorrective ? 'Log Temperature + Corrective Action' : 'Log Temperature'}
      </Button>
    </div>
  );
}
