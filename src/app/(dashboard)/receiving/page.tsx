'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Package,
  Plus,
  Trash2,
  Loader2,
  Truck,
  Thermometer,
} from 'lucide-react';

interface ReceivingItem {
  name: string;
  quantity: string;
  unit: string;
  temperature?: string;
  isTCS: boolean;
  lotNumber?: string;
}

interface ReceivingLog {
  id: string;
  supplier_name: string;
  delivery_date: string;
  items: ReceivingItem[];
  delivery_temp: number | null;
  delivery_temp_unit: string;
  notes: string | null;
  received_by_profile?: { display_name: string };
  created_at: string;
}

export default function ReceivingPage() {
  const [logs, setLogs] = useState<ReceivingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form
  const [supplier, setSupplier] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryTemp, setDeliveryTemp] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ReceivingItem[]>([
    { name: '', quantity: '', unit: 'lbs', isTCS: false },
  ]);

  useEffect(() => {
    const fetchLogs = async () => {
      const res = await fetch('/api/receiving-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
      setLoading(false);
    };
    fetchLogs();
  }, []);

  const addItem = () => {
    setItems(prev => [...prev, { name: '', quantity: '', unit: 'lbs', isTCS: false }]);
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: string | boolean) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const handleCreate = async () => {
    if (!supplier.trim()) {
      toast.error('Supplier name required');
      return;
    }

    const validItems = items.filter(i => i.name.trim());
    if (validItems.length === 0) {
      toast.error('Add at least one item');
      return;
    }

    setSaving(true);
    const res = await fetch('/api/receiving-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supplierName: supplier.trim(),
        deliveryDate,
        items: validItems,
        deliveryTemp: deliveryTemp ? parseFloat(deliveryTemp) : null,
        notes: notes.trim() || null,
      }),
    });

    if (res.ok) {
      const newLog = await res.json();
      setLogs(prev => [newLog, ...prev]);
      toast.success('Receiving log saved!');
      setDialogOpen(false);
      resetForm();
    } else {
      const data = await res.json();
      toast.error(data.error || 'Failed to save');
    }
    setSaving(false);
  };

  const resetForm = () => {
    setSupplier('');
    setDeliveryDate(new Date().toISOString().split('T')[0]);
    setDeliveryTemp('');
    setNotes('');
    setItems([{ name: '', quantity: '', unit: 'lbs', isTCS: false }]);
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

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Receiving Log</h1>
          <p className="text-muted-foreground">Track deliveries for FDA traceability</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="mr-2 h-4 w-4" />
              Log Delivery
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Log New Delivery</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Supplier Name</Label>
                <Input
                  placeholder="e.g., Sysco, US Foods"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                />
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Delivery Date</Label>
                  <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Delivery Temp (°F)</Label>
                  <Input
                    type="number"
                    placeholder="41"
                    value={deliveryTemp}
                    onChange={(e) => setDeliveryTemp(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Items Received</Label>
                {items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start border rounded-lg p-2">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Item name (e.g., Chicken breast)"
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Input
                          placeholder="Qty"
                          className="w-20"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        />
                        <Input
                          placeholder="Unit"
                          className="w-20"
                          value={item.unit}
                          onChange={(e) => updateItem(index, 'unit', e.target.value)}
                        />
                        <Button
                          variant={item.isTCS ? 'default' : 'outline'}
                          size="sm"
                          className={`text-xs h-9 ${item.isTCS ? 'bg-amber-600 hover:bg-amber-700' : ''}`}
                          onClick={() => updateItem(index, 'isTCS', !item.isTCS)}
                        >
                          TCS
                        </Button>
                        <Input
                          placeholder="Lot #"
                          className="w-24"
                          value={item.lotNumber || ''}
                          onChange={(e) => updateItem(index, 'lotNumber', e.target.value)}
                        />
                      </div>
                    </div>
                    {items.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => removeItem(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addItem} className="w-full">
                  <Plus className="mr-1 h-3 w-3" /> Add Item
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="Delivery condition, driver info, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button
                onClick={handleCreate}
                disabled={saving}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Truck className="mr-2 h-4 w-4" />}
                Save Delivery Log
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Logs list */}
      {logs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium">No receiving logs</p>
            <p className="text-sm text-muted-foreground">
              Log deliveries for FDA Food Traceability compliance
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{log.supplier_name}</span>
                      <Badge variant="outline">{log.delivery_date}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {log.items.map((item: ReceivingItem, i: number) => (
                        <Badge key={i} variant={item.isTCS ? 'default' : 'outline'} className={`text-xs ${item.isTCS ? 'bg-amber-600' : ''}`}>
                          {item.name}
                          {item.quantity && ` (${item.quantity} ${item.unit})`}
                          {item.isTCS && ' [TCS]'}
                        </Badge>
                      ))}
                    </div>
                    {log.delivery_temp && (
                      <div className="flex items-center gap-1 text-sm mt-1">
                        <Thermometer className="h-3 w-3" />
                        Delivery temp: {log.delivery_temp}°{log.delivery_temp_unit}
                      </div>
                    )}
                    {log.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{log.notes}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Received by {log.received_by_profile?.display_name || 'Staff'}
                    </p>
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
