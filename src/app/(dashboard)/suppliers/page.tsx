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
  Truck,
  Loader2,
  Phone,
  Mail,
  FileCheck,
} from 'lucide-react';
import type { Supplier, SupplierStatus, SubscriptionTier } from '@/types/database';
import { UpgradePrompt } from '@/components/billing/upgrade-prompt';
import { useAuth } from '@/lib/auth/context';
import { canAccessFeature } from '@/lib/stripe/tier-check';

const VERIFICATION_METHODS = [
  { value: 'site_visit', label: 'Site Visit' },
  { value: 'documentation_review', label: 'Documentation Review' },
  { value: 'third_party_audit', label: 'Third-Party Audit' },
];

const STATUS_OPTIONS = [
  { value: 'approved', label: 'Approved' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
];

const STATUS_STYLES: Record<SupplierStatus, string> = {
  approved: 'bg-emerald-600',
  pending: 'bg-amber-500',
  suspended: 'bg-red-500',
};

export default function SuppliersPage() {
  const { orgId, supabase } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form
  const [supplierName, setSupplierName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [products, setProducts] = useState('');
  const [lastVerificationDate, setLastVerificationDate] = useState('');
  const [verificationMethod, setVerificationMethod] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [status, setStatus] = useState<SupplierStatus>('pending');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!orgId) return;
    const fetchTier = async () => {
      const { data: org } = await supabase.from('organizations').select('subscription_tier').eq('id', orgId).single();
      if (org) setTier(org.subscription_tier || 'free');
    };
    fetchTier();
  }, [orgId, supabase]);

  useEffect(() => {
    const fetchSuppliers = async () => {
      const res = await fetch('/api/suppliers');
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data);
      }
      setLoading(false);
    };
    fetchSuppliers();
  }, []);

  const handleCreate = async () => {
    if (!supplierName.trim()) {
      toast.error('Supplier name required');
      return;
    }

    setSaving(true);
    const res = await fetch('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supplierName: supplierName.trim(),
        contactPhone: contactPhone.trim() || null,
        contactEmail: contactEmail.trim() || null,
        products: products.trim() || null,
        lastVerificationDate: lastVerificationDate || null,
        verificationMethod: verificationMethod || null,
        licenseNumber: licenseNumber.trim() || null,
        status,
        notes: notes.trim() || null,
      }),
    });

    if (res.ok) {
      const newSupplier = await res.json();
      setSuppliers(prev => [...prev, newSupplier].sort((a, b) => a.supplier_name.localeCompare(b.supplier_name)));
      toast.success('Supplier added!');
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
    const res = await fetch(`/api/suppliers?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setSuppliers(prev => prev.filter(s => s.id !== id));
      toast.success('Supplier removed');
    }
    setDeleting(null);
  };

  const resetForm = () => {
    setSupplierName('');
    setContactPhone('');
    setContactEmail('');
    setProducts('');
    setLastVerificationDate('');
    setVerificationMethod('');
    setLicenseNumber('');
    setStatus('pending');
    setNotes('');
  };

  const formatMethod = (method: string | null) => {
    if (!method) return null;
    const found = VERIFICATION_METHODS.find(m => m.value === method);
    return found ? found.label : method;
  };

  // Stats
  const approved = suppliers.filter(s => s.status === 'approved').length;
  const pending = suppliers.filter(s => s.status === 'pending').length;
  const suspended = suppliers.filter(s => s.status === 'suspended').length;

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!canAccessFeature(tier, 'supplierManagement')) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Supplier Verification</h1>
          <p className="text-muted-foreground">Track and verify supplier compliance</p>
        </div>
        <UpgradePrompt feature="Supplier Management" requiredTier="starter" currentTier={tier} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Supplier Verification</h1>
          <p className="text-muted-foreground">Track and verify supplier compliance</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Supplier</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Supplier Name</Label>
                <Input
                  placeholder="e.g., Sysco, US Foods"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                />
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    placeholder="(555) 123-4567"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="contact@supplier.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Products Supplied</Label>
                <Textarea
                  placeholder="e.g., Fresh produce, dairy, meats"
                  value={products}
                  onChange={(e) => setProducts(e.target.value)}
                />
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Last Verification Date</Label>
                  <Input type="date" value={lastVerificationDate} onChange={(e) => setLastVerificationDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Verification Method</Label>
                  <Select value={verificationMethod} onValueChange={setVerificationMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {VERIFICATION_METHODS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>License/Permit Number</Label>
                  <Input
                    placeholder="e.g., FL-12345"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as SupplierStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="Additional notes about this supplier..."
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
                Add Supplier
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      {suppliers.length > 0 && (
        <div className="grid gap-4 grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Approved</div>
              <div className="text-2xl font-bold text-emerald-600">{approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Pending</div>
              <div className="text-2xl font-bold text-amber-500">{pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Suspended</div>
              <div className="text-2xl font-bold text-red-500">{suspended}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Suppliers list */}
      {suppliers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Truck className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium">No suppliers tracked</p>
            <p className="text-sm text-muted-foreground">
              Add suppliers to verify their compliance and track approvals
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {suppliers.map((supplier) => (
            <Card
              key={supplier.id}
              className={supplier.status === 'suspended' ? 'border-red-200' : supplier.status === 'pending' ? 'border-amber-200' : ''}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{supplier.supplier_name}</span>
                      <Badge className={STATUS_STYLES[supplier.status]}>
                        {supplier.status.charAt(0).toUpperCase() + supplier.status.slice(1)}
                      </Badge>
                    </div>
                    {supplier.products && (
                      <p className="text-sm text-muted-foreground">{supplier.products}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {supplier.contact_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {supplier.contact_phone}
                        </span>
                      )}
                      {supplier.contact_email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {supplier.contact_email}
                        </span>
                      )}
                      {supplier.license_number && (
                        <span className="flex items-center gap-1">
                          <FileCheck className="h-3 w-3" /> License: {supplier.license_number}
                        </span>
                      )}
                    </div>
                    {supplier.last_verification_date && (
                      <p className="text-xs text-muted-foreground">
                        Last verified: {supplier.last_verification_date}
                        {supplier.verification_method && ` (${formatMethod(supplier.verification_method)})`}
                      </p>
                    )}
                    {supplier.notes && (
                      <p className="text-xs text-muted-foreground">{supplier.notes}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(supplier.id)}
                    disabled={deleting === supplier.id}
                    className="text-muted-foreground hover:text-red-500"
                  >
                    {deleting === supplier.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
