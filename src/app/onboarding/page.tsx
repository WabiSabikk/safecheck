'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  ShieldCheck,
  ArrowRight,
  Refrigerator,
  Thermometer,
  ClipboardCheck,
  Sparkles,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

interface EquipmentItem {
  name: string;
  type: 'cold_storage' | 'freezer' | 'hot_holding';
  minTemp: number;
  maxTemp: number;
}

const defaultEquipment: EquipmentItem[] = [
  { name: 'Main Fridge', type: 'cold_storage', minTemp: 32, maxTemp: 41 },
  { name: 'Freezer', type: 'freezer', minTemp: -10, maxTemp: 0 },
];

const equipmentPresets: { label: string; item: EquipmentItem }[] = [
  { label: 'Walk-in Cooler', item: { name: 'Walk-in Cooler', type: 'cold_storage', minTemp: 32, maxTemp: 41 } },
  { label: 'Walk-in Freezer', item: { name: 'Walk-in Freezer', type: 'freezer', minTemp: -10, maxTemp: 0 } },
  { label: 'Prep Table Fridge', item: { name: 'Prep Table Fridge', type: 'cold_storage', minTemp: 32, maxTemp: 41 } },
  { label: 'Steam Table', item: { name: 'Steam Table', type: 'hot_holding', minTemp: 135, maxTemp: 200 } },
  { label: 'Hot-Holding Cabinet', item: { name: 'Hot-Holding Cabinet', type: 'hot_holding', minTemp: 135, maxTemp: 200 } },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [equipment, setEquipment] = useState<EquipmentItem[]>(defaultEquipment);
  const [saving, setSaving] = useState(false);

  const totalSteps = 3;
  const progress = Math.round(((step + 1) / totalSteps) * 100);

  const addEquipment = (item: EquipmentItem) => {
    setEquipment(prev => [...prev, item]);
  };

  const removeEquipment = (index: number) => {
    setEquipment(prev => prev.filter((_, i) => i !== index));
  };

  const updateEquipment = (index: number, field: keyof EquipmentItem, value: string | number) => {
    setEquipment(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const saveEquipment = async () => {
    setSaving(true);
    let success = 0;

    for (const item of equipment) {
      if (!item.name.trim()) continue;

      const res = await fetch('/api/settings/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name,
          equipmentType: item.type,
          minTemp: item.minTemp,
          maxTemp: item.maxTemp,
        }),
      });

      if (res.ok) success++;
    }

    setSaving(false);

    if (success > 0) {
      toast.success(`Added ${success} equipment item${success > 1 ? 's' : ''}`);
      return true;
    } else if (equipment.length === 0) {
      return true; // Skip is OK
    } else {
      toast.error('Failed to save equipment. You can add them later in Settings.');
      return true; // Still allow proceeding
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      const ok = await saveEquipment();
      if (!ok) return;
    }
    if (step < totalSteps - 1) {
      setStep(step + 1);
    }
  };

  const handleFinish = () => {
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-white px-4 py-8">
      {/* Logo */}
      <div className="mb-6 flex items-center gap-2">
        <ShieldCheck className="h-8 w-8 text-emerald-600" />
        <span className="text-2xl font-bold">SafeCheck</span>
      </div>

      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
            <span>Step {step + 1} of {totalSteps}</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <Card>
            <CardHeader className="text-center">
              <Sparkles className="h-12 w-12 text-emerald-600 mx-auto mb-2" />
              <CardTitle className="text-2xl">Welcome to SafeCheck!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                Let&apos;s set up your kitchen in 2 minutes. Here&apos;s what SafeCheck helps you do:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 flex-shrink-0">
                    <Thermometer className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Temperature Logging</p>
                    <p className="text-xs text-muted-foreground">
                      Log fridge, freezer, and hot-holding temps in 30 seconds
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 flex-shrink-0">
                    <ClipboardCheck className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Daily Checklists</p>
                    <p className="text-xs text-muted-foreground">
                      Opening and closing safety checklists with auto-reminders
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 flex-shrink-0">
                    <ShieldCheck className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Inspection Ready</p>
                    <p className="text-xs text-muted-foreground">
                      PDF reports for health inspectors in one click
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleNext}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 1: Add Equipment */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <Refrigerator className="h-10 w-10 text-emerald-600 mb-2" />
              <CardTitle>Add Your Equipment</CardTitle>
              <p className="text-sm text-muted-foreground">
                Add your fridges, freezers, and hot-holding units. We&apos;ll pre-fill standard FDA temperature ranges.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Equipment list */}
              {equipment.map((item, index) => (
                <div key={index} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Input
                      value={item.name}
                      onChange={(e) => updateEquipment(index, 'name', e.target.value)}
                      placeholder="Equipment name"
                      className="font-medium"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2 text-muted-foreground hover:text-red-600 flex-shrink-0"
                      onClick={() => removeEquipment(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground whitespace-nowrap">
                      {item.type === 'cold_storage' ? 'Fridge' :
                       item.type === 'freezer' ? 'Freezer' : 'Hot Holding'}
                    </span>
                    <span className="text-muted-foreground">|</span>
                    <span className="font-mono text-xs">
                      {item.minTemp}°F - {item.maxTemp}°F
                    </span>
                  </div>
                </div>
              ))}

              {/* Quick add buttons */}
              <div>
                <Label className="text-xs text-muted-foreground">Quick Add:</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {equipmentPresets
                    .filter(p => !equipment.some(e => e.name === p.item.name))
                    .slice(0, 3)
                    .map((preset) => (
                      <Button
                        key={preset.label}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => addEquipment(preset.item)}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        {preset.label}
                      </Button>
                    ))
                  }
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(0)} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleNext}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    {equipment.length > 0 ? 'Save & Continue' : 'Skip'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 2: All Done */}
        {step === 2 && (
          <Card>
            <CardHeader className="text-center">
              <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-2" />
              <CardTitle className="text-2xl">You&apos;re All Set!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                Your kitchen is ready for food safety compliance. Here&apos;s what to do next:
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2 rounded-lg bg-emerald-50 p-3">
                  <span className="font-bold text-emerald-700">1.</span>
                  <span className="text-emerald-700">
                    <strong>Log your first temperature</strong> — tap &quot;Log Temperature&quot; on your dashboard
                  </span>
                </div>
                <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3">
                  <span className="font-bold text-blue-700">2.</span>
                  <span className="text-blue-700">
                    <strong>Complete your opening checklist</strong> — it&apos;s automatically created daily
                  </span>
                </div>
                <div className="flex items-start gap-2 rounded-lg bg-purple-50 p-3">
                  <span className="font-bold text-purple-700">3.</span>
                  <span className="text-purple-700">
                    <strong>Invite your team</strong> — add staff in Settings &gt; Team
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleFinish}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                size="lg"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Skip link */}
        {step < 2 && (
          <div className="text-center mt-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Skip setup, go to dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
