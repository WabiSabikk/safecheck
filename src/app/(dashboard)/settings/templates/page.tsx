'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  ClipboardCheck,
  Lock,
  Loader2,
  GripVertical,
} from 'lucide-react';
import type { ChecklistTemplate } from '@/types/database';

export default function TemplatesSettingsPage() {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // New template form
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<string>('custom');
  const [newTime, setNewTime] = useState('');
  const [newItems, setNewItems] = useState<{ description: string; category: string; is_required: boolean }[]>([
    { description: '', category: 'General', is_required: true },
  ]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const res = await fetch('/api/checklist-templates');
    if (res.ok) {
      const data = await res.json();
      setTemplates(data);
    }
    setLoading(false);
  };

  const addItem = () => {
    setNewItems(prev => [...prev, { description: '', category: 'General', is_required: true }]);
  };

  const removeItem = (index: number) => {
    setNewItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: string | boolean) => {
    setNewItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error('Template name required');
      return;
    }

    const validItems = newItems.filter(i => i.description.trim());
    if (validItems.length === 0) {
      toast.error('Add at least one checklist item');
      return;
    }

    setSaving(true);
    const res = await fetch('/api/checklist-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newName.trim(),
        checklist_type: newType,
        scheduled_time: newTime || null,
        items: validItems,
      }),
    });

    if (res.ok) {
      toast.success('Template created!');
      setDialogOpen(false);
      setNewName('');
      setNewType('custom');
      setNewTime('');
      setNewItems([{ description: '', category: 'General', is_required: true }]);
      fetchTemplates();
    } else {
      const data = await res.json();
      toast.error(data.error || 'Failed to create template');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const res = await fetch(`/api/checklist-templates?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Template deleted');
      setTemplates(prev => prev.filter(t => t.id !== id));
    } else {
      const data = await res.json();
      toast.error(data.error || 'Failed to delete');
    }
    setDeleting(null);
  };

  const typeLabels: Record<string, string> = {
    opening: 'Opening',
    closing: 'Closing',
    mid_shift: 'Mid-Shift',
    custom: 'Custom',
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
          <h1 className="text-2xl font-bold">Checklist Templates</h1>
          <p className="text-muted-foreground">Manage daily checklist templates</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Checklist Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input
                  placeholder="e.g., Mid-Shift Check, Weekly Deep Clean"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={newType} onValueChange={setNewType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="opening">Opening</SelectItem>
                      <SelectItem value="closing">Closing</SelectItem>
                      <SelectItem value="mid_shift">Mid-Shift</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Scheduled Time (optional)</Label>
                  <Input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Checklist Items</Label>
                {newItems.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-1">
                      <Input
                        placeholder={`Item ${index + 1}: e.g., Check fridge temperatures`}
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Select
                          value={item.category}
                          onValueChange={(v) => updateItem(index, 'category', v)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="General">General</SelectItem>
                            <SelectItem value="Temperature">Temperature</SelectItem>
                            <SelectItem value="Sanitation">Sanitation</SelectItem>
                            <SelectItem value="Equipment">Equipment</SelectItem>
                            <SelectItem value="Food Safety">Food Safety</SelectItem>
                            <SelectItem value="Personnel">Personnel</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => updateItem(index, 'is_required', !item.is_required)}
                        >
                          {item.is_required ? 'Required' : 'Optional'}
                        </Button>
                      </div>
                    </div>
                    {newItems.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-red-500"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addItem} className="w-full">
                  <Plus className="mr-1 h-3 w-3" />
                  Add Item
                </Button>
              </div>

              <Button
                onClick={handleCreate}
                disabled={saving}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ClipboardCheck className="mr-2 h-4 w-4" />}
                Create Template
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates list */}
      <div className="space-y-4">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{template.name}</h3>
                    <Badge variant="outline">{typeLabels[template.checklist_type]}</Badge>
                    {template.is_system && (
                      <Badge variant="secondary" className="text-xs">
                        <Lock className="mr-1 h-3 w-3" />
                        System
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {template.items.length} items
                    {template.scheduled_time && ` | Scheduled at ${template.scheduled_time}`}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {template.items.slice(0, 5).map((item, i) => (
                      <Badge key={i} variant="outline" className="text-xs font-normal">
                        {item.description.length > 40 ? item.description.slice(0, 40) + '...' : item.description}
                      </Badge>
                    ))}
                    {template.items.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.items.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
                {!template.is_system && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-red-500"
                    onClick={() => handleDelete(template.id)}
                    disabled={deleting === template.id}
                  >
                    {deleting === template.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
