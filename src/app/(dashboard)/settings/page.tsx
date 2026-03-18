'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth/context';
import { Settings, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { orgId, supabase, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    restaurantName: '',
    address: '',
    licenseNumber: '',
  });

  useEffect(() => {
    if (authLoading) return;
    if (!orgId) {
      setLoading(false);
      return;
    }

    const fetchSettings = async () => {
      try {
        const { data: locations } = await supabase
          .from('locations')
          .select('name, address, license_number')
          .eq('org_id', orgId)
          .limit(1);

        if (locations && locations[0]) {
          setForm({
            restaurantName: locations[0].name || '',
            address: locations[0].address || '',
            licenseNumber: locations[0].license_number || '',
          });
        }
      } catch (err) {
        console.error('[Settings] Error:', err);
      }
      setLoading(false);
    };
    fetchSettings();
  }, [authLoading, orgId, supabase]);

  const handleSave = async () => {
    if (!orgId) return;
    setSaving(true);

    await supabase
      .from('locations')
      .update({
        name: form.restaurantName,
        address: form.address,
        license_number: form.licenseNumber,
      })
      .eq('org_id', orgId);

    await supabase
      .from('organizations')
      .update({ name: form.restaurantName })
      .eq('id', orgId);

    toast.success('Settings saved');
    setSaving(false);
  };

  if (authLoading || loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your restaurant information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Restaurant Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Restaurant Name</Label>
            <Input
              value={form.restaurantName}
              onChange={(e) => setForm({ ...form, restaurantName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="123 Main St, City, State"
            />
          </div>
          <div className="space-y-2">
            <Label>Health Department License #</Label>
            <Input
              value={form.licenseNumber}
              onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
              placeholder="Optional"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
