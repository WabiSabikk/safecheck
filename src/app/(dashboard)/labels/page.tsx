'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Tag,
  Plus,
  Printer,
  Save,
  Clock,
  AlertTriangle,
  Loader2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n/context';

const FDA_ALLERGENS = [
  'Milk', 'Eggs', 'Fish', 'Shellfish', 'Tree Nuts',
  'Peanuts', 'Wheat', 'Soy', 'Sesame',
];

interface FoodLabel {
  id: string;
  food_name: string;
  prep_date: string;
  expiry_date: string;
  allergens: string[];
  storage_instructions: string | null;
  quantity: number;
  created_at: string;
  profile?: { display_name: string };
}

interface LabelTemplate {
  id: string;
  food_name: string;
  shelf_life_days: number;
  allergens: string[];
  storage_instructions: string | null;
}

export default function LabelsPage() {
  const { t } = useI18n();
  const [labels, setLabels] = useState<FoodLabel[]>([]);
  const [templates, setTemplates] = useState<LabelTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Form state
  const [foodName, setFoodName] = useState('');
  const [shelfLifeDays, setShelfLifeDays] = useState(3);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [storageInstructions, setStorageInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch('/api/food-labels')
      .then(r => r.ok ? r.json() : { labels: [], templates: [] })
      .then(data => {
        setLabels(data.labels || []);
        setTemplates(data.templates || []);
        setLoading(false);
      });
  }, []);

  const toggleAllergen = (a: string) => {
    setSelectedAllergens(prev =>
      prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
    );
  };

  const loadTemplate = (tmpl: LabelTemplate) => {
    setFoodName(tmpl.food_name);
    setShelfLifeDays(tmpl.shelf_life_days);
    setSelectedAllergens(tmpl.allergens);
    setStorageInstructions(tmpl.storage_instructions || '');
    setShowForm(true);
  };

  const handleCreate = async () => {
    if (!foodName.trim()) {
      toast.error('Food name is required');
      return;
    }
    setCreating(true);
    const res = await fetch('/api/food-labels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        foodName: foodName.trim(),
        shelfLifeDays,
        allergens: selectedAllergens,
        storageInstructions: storageInstructions || null,
        quantity,
        saveAsTemplate,
      }),
    });
    if (res.ok) {
      const label = await res.json();
      setLabels(prev => [label, ...prev]);
      toast.success('Label created');
      resetForm();
    } else {
      toast.error('Failed to create label');
    }
    setCreating(false);
  };

  const resetForm = () => {
    setFoodName('');
    setShelfLifeDays(3);
    setSelectedAllergens([]);
    setStorageInstructions('');
    setQuantity(1);
    setSaveAsTemplate(false);
    setShowForm(false);
  };

  const printLabel = (label: FoodLabel) => {
    const printWindow = window.open('', '_blank', 'width=400,height=300');
    if (!printWindow) return;

    const allergenText = label.allergens.length > 0
      ? `<p style="margin:4px 0;font-size:11px;"><strong>CONTAINS:</strong> ${label.allergens.join(', ')}</p>`
      : '';

    const html = Array.from({ length: label.quantity }, () => `
      <div style="border:2px solid #000;padding:8px;margin:4px;width:280px;font-family:Arial,sans-serif;page-break-inside:avoid;">
        <div style="font-size:16px;font-weight:bold;border-bottom:1px solid #000;padding-bottom:4px;margin-bottom:4px;">
          ${label.food_name}
        </div>
        <p style="margin:4px 0;font-size:12px;"><strong>Prep Date:</strong> ${formatDate(label.prep_date)}</p>
        <p style="margin:4px 0;font-size:14px;font-weight:bold;color:#c00;">
          USE BY: ${formatDate(label.expiry_date)}
        </p>
        ${allergenText}
        ${label.storage_instructions ? `<p style="margin:4px 0;font-size:10px;color:#666;">${label.storage_instructions}</p>` : ''}
      </div>
    `).join('');

    printWindow.document.write(`
      <html><head><title>Food Labels</title>
      <style>@media print { body { margin: 0; } }</style>
      </head><body style="display:flex;flex-wrap:wrap;">${html}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('labels.title')}</h1>
          <p className="text-sm text-muted-foreground">
            Create and print food prep labels with expiry dates and allergens
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('labels.new')}
        </Button>
      </div>

      {/* Create Label Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              {t('labels.new')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>{t('labels.foodName')}</Label>
                <Input
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  placeholder="e.g., Chicken Salad, Tomato Sauce..."
                />
              </div>
              <div>
                <Label>{t('labels.expiryDays')}</Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={shelfLifeDays}
                  onChange={(e) => setShelfLifeDays(Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">{t('allergens.fdaBigNine')}</Label>
              <div className="flex flex-wrap gap-2">
                {FDA_ALLERGENS.map(a => (
                  <button
                    key={a}
                    onClick={() => toggleAllergen(a)}
                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                      selectedAllergens.includes(a)
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {selectedAllergens.includes(a) && <AlertTriangle className="mr-1 inline h-3 w-3" />}
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Storage Instructions</Label>
                <Input
                  value={storageInstructions}
                  onChange={(e) => setStorageInstructions(e.target.value)}
                  placeholder="e.g., Keep refrigerated below 41°F"
                />
              </div>
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Label Preview */}
            <div>
              <Label>{t('labels.preview')}</Label>
              <div ref={printRef} className="mt-2 inline-block rounded border-2 border-black p-3 font-mono">
                <div className="border-b border-black pb-1 text-lg font-bold">
                  {foodName || 'Food Name'}
                </div>
                <p className="mt-1 text-xs">
                  <strong>Prep Date:</strong> {formatDate(new Date().toISOString().split('T')[0])}
                </p>
                <p className="text-sm font-bold text-red-600">
                  USE BY: {formatDate(calculateExpiry(shelfLifeDays))}
                </p>
                {selectedAllergens.length > 0 && (
                  <p className="text-xs">
                    <strong>CONTAINS:</strong> {selectedAllergens.join(', ')}
                  </p>
                )}
                {storageInstructions && (
                  <p className="text-[10px] text-gray-500">{storageInstructions}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={saveAsTemplate}
                  onChange={(e) => setSaveAsTemplate(e.target.checked)}
                  className="rounded"
                />
                <Save className="h-4 w-4" />
                {t('labels.saveAsTemplate')}
              </label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Tag className="mr-2 h-4 w-4" />}
                Create & Print
              </Button>
              <Button variant="outline" onClick={resetForm}>
                {t('common.cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Templates */}
      {templates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('labels.savedTemplates')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {templates.map(tmpl => (
                <button
                  key={tmpl.id}
                  onClick={() => loadTemplate(tmpl)}
                  className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <Tag className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium">{tmpl.food_name}</span>
                  <span className="text-xs text-muted-foreground">{tmpl.shelf_life_days}d</span>
                  {tmpl.allergens.length > 0 && (
                    <Badge variant="destructive" className="text-[10px]">
                      {tmpl.allergens.length} allergens
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Labels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('labels.recentLabels')}</CardTitle>
        </CardHeader>
        <CardContent>
          {labels.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('common.noData')}</p>
          ) : (
            <div className="space-y-2">
              {labels.map(label => {
                const isExpired = new Date(label.expiry_date) < new Date();
                return (
                  <div
                    key={label.id}
                    className={`flex items-center justify-between rounded-lg border p-3 ${
                      isExpired ? 'border-red-200 bg-red-50' : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{label.food_name}</span>
                        {isExpired && <Badge variant="destructive">Expired</Badge>}
                        {label.allergens.length > 0 && (
                          <Badge variant="outline" className="text-[10px]">
                            {label.allergens.join(', ')}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Prep: {formatDate(label.prep_date)}</span>
                        <span className={isExpired ? 'font-bold text-red-600' : ''}>
                          Use By: {formatDate(label.expiry_date)}
                        </span>
                        <span>Qty: {label.quantity}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => printLabel(label)}>
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function calculateExpiry(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
