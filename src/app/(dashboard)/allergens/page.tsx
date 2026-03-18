'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  Plus,
  Search,
  Loader2,
  Trash2,
  ShieldAlert,
  UtensilsCrossed,
} from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n/context';

const FDA_BIG_NINE = [
  { key: 'Milk', icon: '🥛' },
  { key: 'Eggs', icon: '🥚' },
  { key: 'Fish', icon: '🐟' },
  { key: 'Shellfish', icon: '🦐' },
  { key: 'Tree Nuts', icon: '🌰' },
  { key: 'Peanuts', icon: '🥜' },
  { key: 'Wheat', icon: '🌾' },
  { key: 'Soy', icon: '🫘' },
  { key: 'Sesame', icon: '🫓' },
];

interface MenuItem {
  id: string;
  item_name: string;
  category: string | null;
  allergens: string[];
  cross_contact_risk: string[];
  storage_notes: string | null;
  separate_storage: boolean;
}

export default function AllergensPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterAllergen, setFilterAllergen] = useState<string | null>(null);

  // Form
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [crossContactRisk, setCrossContactRisk] = useState<string[]>([]);
  const [storageNotes, setStorageNotes] = useState('');
  const [separateStorage, setSeparateStorage] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/allergens')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setItems(data);
        setLoading(false);
      });
  }, []);

  const toggleAllergen = (a: string) => {
    setSelectedAllergens(prev =>
      prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
    );
  };

  const toggleCrossContact = (a: string) => {
    setCrossContactRisk(prev =>
      prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
    );
  };

  const handleSave = async () => {
    if (!itemName.trim()) { toast.error('Item name required'); return; }
    setSaving(true);

    const res = await fetch('/api/allergens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemName: itemName.trim(),
        category: category || null,
        allergens: selectedAllergens,
        crossContactRisk,
        storageNotes: storageNotes || null,
        separateStorage,
      }),
    });

    if (res.ok) {
      const item = await res.json();
      setItems(prev => [...prev, item]);
      toast.success('Menu item added');
      resetForm();
    } else {
      toast.error('Failed to save');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/allergens?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success('Item removed');
    }
  };

  const resetForm = () => {
    setItemName('');
    setCategory('');
    setSelectedAllergens([]);
    setCrossContactRisk([]);
    setStorageNotes('');
    setSeparateStorage(false);
    setShowForm(false);
  };

  const filtered = items.filter(item => {
    if (search && !item.item_name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterAllergen && !item.allergens.includes(filterAllergen)) return false;
    return true;
  });

  // Allergen summary
  const allergenCounts: Record<string, number> = {};
  items.forEach(item => {
    item.allergens.forEach(a => {
      allergenCounts[a] = (allergenCounts[a] || 0) + 1;
    });
  });

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
          <h1 className="text-2xl font-bold">{t('allergens.title')}</h1>
          <p className="text-sm text-muted-foreground">
            Track allergens in menu items for FDA FSMA compliance
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('allergens.addItem')}
        </Button>
      </div>

      {/* Allergen Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            {t('allergens.fdaBigNine')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {FDA_BIG_NINE.map(({ key, icon }) => {
              const count = allergenCounts[key] || 0;
              const isActive = filterAllergen === key;
              return (
                <button
                  key={key}
                  onClick={() => setFilterAllergen(isActive ? null : key)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    isActive
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : count > 0
                      ? 'border-amber-300 bg-amber-50 text-amber-700'
                      : 'border-gray-200 text-gray-400'
                  }`}
                >
                  <span>{icon}</span>
                  <span>{key}</span>
                  {count > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 text-[10px]">
                      {count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
          {filterAllergen && (
            <button
              onClick={() => setFilterAllergen(null)}
              className="mt-2 text-xs text-blue-600 hover:underline"
            >
              Clear filter
            </button>
          )}
        </CardContent>
      </Card>

      {/* Add Item Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('allergens.addItem')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>{t('allergens.itemName')}</Label>
                <Input
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g., Caesar Salad, Pad Thai..."
                />
              </div>
              <div>
                <Label>Category</Label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Appetizers, Entrees, Desserts..."
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">{t('allergens.containsAllergens')}</Label>
              <div className="flex flex-wrap gap-2">
                {FDA_BIG_NINE.map(({ key, icon }) => (
                  <button
                    key={key}
                    onClick={() => toggleAllergen(key)}
                    className={`flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors ${
                      selectedAllergens.includes(key)
                        ? 'border-red-500 bg-red-50 text-red-700 font-medium'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {icon} {key}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">{t('allergens.crossContact')} Risk</Label>
              <div className="flex flex-wrap gap-2">
                {FDA_BIG_NINE.map(({ key, icon }) => (
                  <button
                    key={key}
                    onClick={() => toggleCrossContact(key)}
                    className={`flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors ${
                      crossContactRisk.includes(key)
                        ? 'border-amber-500 bg-amber-50 text-amber-700 font-medium'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <UtensilsCrossed className="h-3 w-3" /> {icon} {key}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>{t('allergens.storageNotes')}</Label>
                <Input
                  value={storageNotes}
                  onChange={(e) => setStorageNotes(e.target.value)}
                  placeholder="e.g., Store on separate shelf from nuts"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  checked={separateStorage}
                  onChange={(e) => setSeparateStorage(e.target.checked)}
                  className="rounded"
                />
                <Label>{t('allergens.separateStorage')}</Label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                {t('common.save')}
              </Button>
              <Button variant="outline" onClick={resetForm}>{t('common.cancel')}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Menu Items List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t('allergens.menuItems')} ({filtered.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('common.search')}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('common.noData')}</p>
          ) : (
            <div className="space-y-2">
              {filtered.map(item => (
                <div
                  key={item.id}
                  className={`flex items-start justify-between rounded-lg border p-3 ${
                    item.separate_storage ? 'border-amber-200 bg-amber-50' : ''
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.item_name}</span>
                      {item.category && (
                        <Badge variant="secondary" className="text-[10px]">{item.category}</Badge>
                      )}
                      {item.separate_storage && (
                        <Badge variant="outline" className="border-amber-400 text-[10px] text-amber-700">
                          Separate Storage
                        </Badge>
                      )}
                    </div>
                    {item.allergens.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                        {item.allergens.map(a => (
                          <Badge key={a} variant="destructive" className="text-[10px]">{a}</Badge>
                        ))}
                      </div>
                    )}
                    {item.cross_contact_risk.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        <UtensilsCrossed className="h-3.5 w-3.5 text-amber-500" />
                        {item.cross_contact_risk.map(a => (
                          <Badge key={a} variant="outline" className="border-amber-300 text-[10px] text-amber-600">
                            {a}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {item.storage_notes && (
                      <p className="mt-1 text-xs text-muted-foreground">{item.storage_notes}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(item.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
