'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Refrigerator, Plus, Loader2 } from 'lucide-react';
import { TEMP_RANGES } from '@/lib/validations/temperature';
import type { Equipment, EquipmentType } from '@/types/database';

export default function EquipmentPage() {
  const supabase = createClient();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'cold_storage' as EquipmentType,
    minTemp: '',
    maxTemp: '',
  });

  useEffect(() => {
    const fetchEquipment = async () => {
      const { data } = await supabase
        .from('equipment')
        .select('*')
        .order('position');
      if (data) setEquipment(data);
      setLoading(false);
    };
    fetchEquipment();
  }, []);

  const handleTypeChange = (type: EquipmentType) => {
    const range = TEMP_RANGES[type];
    setForm({
      ...form,
      type,
      minTemp: range.min.toString(),
      maxTemp: range.max.toString(),
    });
  };

  const handleAdd = async () => {
    if (!form.name) {
      toast.error('Enter equipment name');
      return;
    }
    setAdding(true);

    const res = await fetch('/api/settings/equipment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        equipmentType: form.type,
        minTemp: parseFloat(form.minTemp),
        maxTemp: parseFloat(form.maxTemp),
      }),
    });

    if (res.ok) {
      toast.success(`${form.name} added!`);
      setForm({ name: '', type: 'cold_storage', minTemp: '', maxTemp: '' });
      setDialogOpen(false);
      const { data } = await supabase.from('equipment').select('*').order('position');
      if (data) setEquipment(data);
    } else {
      const data = await res.json();
      toast.error(data.error || 'Failed to add equipment');
    }
    setAdding(false);
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case 'cold_storage': return 'Refrigerator';
      case 'hot_holding': return 'Hot Holding';
      case 'freezer': return 'Freezer';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Equipment</h1>
          <p className="text-muted-foreground">Manage temperature monitoring equipment</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Equipment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Equipment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="Walk-in Cooler #2"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => handleTypeChange(v as EquipmentType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cold_storage">Refrigerator (32-41°F)</SelectItem>
                    <SelectItem value="freezer">Freezer (0°F or below)</SelectItem>
                    <SelectItem value="hot_holding">Hot Holding (135°F+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Temp (°F)</Label>
                  <Input
                    type="number"
                    value={form.minTemp}
                    onChange={(e) => setForm({ ...form, minTemp: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Temp (°F)</Label>
                  <Input
                    type="number"
                    value={form.maxTemp}
                    onChange={(e) => setForm({ ...form, maxTemp: e.target.value })}
                  />
                </div>
              </div>
              <Button
                onClick={handleAdd}
                disabled={adding}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Equipment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="divide-y p-0">
          {equipment.length === 0 ? (
            <div className="flex flex-col items-center py-12">
              <Refrigerator className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 font-medium">No equipment added</p>
              <p className="text-sm text-muted-foreground">Add your first fridge or freezer</p>
            </div>
          ) : (
            equipment.map((eq) => (
              <div key={eq.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{eq.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Range: {eq.min_temp}°F - {eq.max_temp}°F
                  </p>
                </div>
                <Badge variant="secondary">{typeLabel(eq.equipment_type)}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
