'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Award,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import type { SubscriptionTier } from '@/types/database';
import { UpgradePrompt } from '@/components/billing/upgrade-prompt';
import { useAuth } from '@/lib/auth/context';
import { canAccessFeature } from '@/lib/stripe/tier-check';

interface CertificationRaw {
  id: string;
  user_id: string;
  cert_type: string;
  cert_name: string;
  issued_date: string | null;
  expiry_date: string | null;
  cert_number: string | null;
  user?: { display_name: string; role: string };
}

interface Certification extends CertificationRaw {
  is_expired: boolean;
  expires_soon: boolean;
}

function enrichCert(cert: CertificationRaw): Certification {
  const now = new Date();
  const expiry = cert.expiry_date ? new Date(cert.expiry_date) : null;
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

  return {
    ...cert,
    is_expired: expiry ? expiry < now : false,
    expires_soon: expiry ? (expiry >= now && expiry <= thirtyDaysLater) : false,
  };
}

interface TeamMember {
  id: string;
  display_name: string;
  role: string;
}

const CERT_TYPES = [
  { value: 'food_protection', label: 'Food Protection Certificate', priority: true },
  { value: 'servsafe_manager', label: 'ServSafe Manager', priority: true },
  { value: 'servsafe_handler', label: 'ServSafe Food Handler', priority: true },
  { value: 'servsafe_alcohol', label: 'ServSafe Alcohol' },
  { value: 'cfp', label: 'Certified Food Protection (CFP)', priority: true },
  { value: 'allergen', label: 'Allergen Awareness' },
  { value: 'haccp', label: 'HACCP Certification' },
  { value: 'food_manager', label: 'Food Manager Certification' },
  { value: 'other', label: 'Other' },
];

const PRIORITY_CERT_TYPES = CERT_TYPES.filter(t => t.priority).map(t => t.value);

export default function CertificationsPage() {
  const { orgId, supabase } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [certs, setCerts] = useState<Certification[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form
  const [selectedUser, setSelectedUser] = useState('');
  const [certType, setCertType] = useState('');
  const [certName, setCertName] = useState('');
  const [issuedDate, setIssuedDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [certNumber, setCertNumber] = useState('');

  useEffect(() => {
    if (!orgId) return;
    const fetchTier = async () => {
      const { data: org } = await supabase.from('organizations').select('subscription_tier').eq('id', orgId).single();
      if (org) setTier(org.subscription_tier || 'free');
    };
    fetchTier();
  }, [orgId, supabase]);

  useEffect(() => {
    Promise.all([
      fetch('/api/certifications').then(r => r.ok ? r.json() : []),
      fetch('/api/settings/team').then(r => r.ok ? r.json() : []),
    ]).then(([certsData, teamData]) => {
      setCerts((certsData as CertificationRaw[]).map(enrichCert));
      setTeam(teamData);
      setLoading(false);
    });
  }, []);

  const handleCreate = async () => {
    if (!selectedUser || !certType || !certName) {
      toast.error('Staff member, type, and name required');
      return;
    }

    setSaving(true);
    const res = await fetch('/api/certifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: selectedUser,
        certType,
        certName,
        issuedDate: issuedDate || null,
        expiryDate: expiryDate || null,
        certNumber: certNumber || null,
      }),
    });

    if (res.ok) {
      const newCert = await res.json();
      const member = team.find(t => t.id === selectedUser);
      setCerts(prev => [...prev, { ...newCert, user: member ? { display_name: member.display_name, role: member.role } : undefined }]);
      toast.success('Certification added!');
      setDialogOpen(false);
      resetForm();
    } else {
      const data = await res.json();
      toast.error(data.error || 'Failed to add certification');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const res = await fetch(`/api/certifications?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setCerts(prev => prev.filter(c => c.id !== id));
      toast.success('Certification removed');
    }
    setDeleting(null);
  };

  const resetForm = () => {
    setSelectedUser('');
    setCertType('');
    setCertName('');
    setIssuedDate('');
    setExpiryDate('');
    setCertNumber('');
  };

  const expired = certs.filter(c => c.is_expired);
  const expiringSoon = certs.filter(c => c.expires_soon && !c.is_expired);
  const valid = certs.filter(c => !c.is_expired && !c.expires_soon);

  // Priority certs (Food Protection, ServSafe) shown prominently
  const priorityCerts = certs.filter(c => PRIORITY_CERT_TYPES.includes(c.cert_type));
  const otherCerts = certs.filter(c => !PRIORITY_CERT_TYPES.includes(c.cert_type));

  const daysUntilExpiry = (dateStr: string | null) => {
    if (!dateStr) return null;
    const expiry = new Date(dateStr);
    const now = new Date();
    return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!canAccessFeature(tier, 'certTracking')) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Certifications</h1>
          <p className="text-muted-foreground">Track staff food safety certifications</p>
        </div>
        <UpgradePrompt feature="Certification Tracking" requiredTier="starter" currentTier={tier} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Certifications</h1>
          <p className="text-muted-foreground">Track staff food safety certifications</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Cert
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Certification</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Staff Member</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {team.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.display_name} ({m.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Certification Type</Label>
                <Select value={certType} onValueChange={(v) => {
                  setCertType(v);
                  const found = CERT_TYPES.find(t => t.value === v);
                  if (found) setCertName(found.label);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CERT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {certType === 'other' && (
                <div className="space-y-2">
                  <Label>Certification Name</Label>
                  <Input
                    value={certName}
                    onChange={(e) => setCertName(e.target.value)}
                    placeholder="Enter certification name"
                  />
                </div>
              )}

              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Issued Date</Label>
                  <Input type="date" value={issuedDate} onChange={(e) => setIssuedDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Expiry Date</Label>
                  <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Certificate Number (optional)</Label>
                <Input
                  value={certNumber}
                  onChange={(e) => setCertNumber(e.target.value)}
                  placeholder="e.g., SS-123456"
                />
              </div>

              <Button
                onClick={handleCreate}
                disabled={saving}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Award className="mr-2 h-4 w-4" />}
                Add Certification
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Stats */}
      {certs.length > 0 && (
        <div className="grid gap-4 grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span className="text-sm text-muted-foreground">Valid</span>
              </div>
              <div className="mt-1 text-2xl font-bold text-emerald-600">{valid.length}</div>
            </CardContent>
          </Card>
          <Card className={expiringSoon.length > 0 ? 'border-amber-200' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                <span className="text-sm text-muted-foreground">Expiring Soon</span>
              </div>
              <div className="mt-1 text-2xl font-bold text-amber-500">{expiringSoon.length}</div>
            </CardContent>
          </Card>
          <Card className={expired.length > 0 ? 'border-red-200' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span className="text-sm text-muted-foreground">Expired</span>
              </div>
              <div className="mt-1 text-2xl font-bold text-red-500">{expired.length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts */}
      {expired.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800 font-semibold mb-2">
              <AlertTriangle className="h-5 w-5" />
              {expired.length} Expired Certification{expired.length !== 1 ? 's' : ''} - Renewal Required
            </div>
            {expired.map(c => (
              <p key={c.id} className="text-sm text-red-700">
                {c.user?.display_name}: {c.cert_name} expired {c.expiry_date}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      {expiringSoon.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-amber-800 font-semibold mb-2">
              <Clock className="h-5 w-5" />
              {expiringSoon.length} Expiring Soon (within 30 days)
            </div>
            {expiringSoon.map(c => {
              const days = daysUntilExpiry(c.expiry_date);
              return (
                <p key={c.id} className="text-sm text-amber-700">
                  {c.user?.display_name}: {c.cert_name} expires {c.expiry_date}
                  {days !== null && ` (${days} day${days !== 1 ? 's' : ''} left)`}
                </p>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* All certs */}
      {certs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Award className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium">No certifications tracked</p>
            <p className="text-sm text-muted-foreground">
              Add staff certifications to track expiration dates
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Priority Certifications - Food Protection & ServSafe */}
          {priorityCerts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-600" />
                Food Protection & ServSafe Certifications
              </h2>
              <div className="space-y-3">
                {priorityCerts.map((cert) => {
                  const days = daysUntilExpiry(cert.expiry_date);
                  return (
                    <Card key={cert.id} className={cert.is_expired ? 'border-red-200' : cert.expires_soon ? 'border-amber-200' : 'border-emerald-200'}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{cert.user?.display_name}</span>
                              <Badge variant="outline" className="font-semibold">{cert.cert_name}</Badge>
                              {cert.is_expired ? (
                                <Badge variant="destructive">Expired</Badge>
                              ) : cert.expires_soon ? (
                                <Badge className="bg-amber-500">
                                  {days !== null ? `${days} days left` : 'Expiring Soon'}
                                </Badge>
                              ) : (
                                <Badge className="bg-emerald-600">Valid</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {cert.issued_date && `Issued: ${cert.issued_date}`}
                              {cert.expiry_date && ` | Expires: ${cert.expiry_date}`}
                              {cert.cert_number && ` | #${cert.cert_number}`}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(cert.id)}
                            disabled={deleting === cert.id}
                            className="text-muted-foreground hover:text-red-500"
                          >
                            {deleting === cert.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Other Certifications */}
          {otherCerts.length > 0 && (
            <div>
              {priorityCerts.length > 0 && (
                <h2 className="text-lg font-semibold mb-3">Other Certifications</h2>
              )}
              <div className="space-y-3">
                {otherCerts.map((cert) => {
                  const days = daysUntilExpiry(cert.expiry_date);
                  return (
                    <Card key={cert.id} className={cert.is_expired ? 'border-red-200' : cert.expires_soon ? 'border-amber-200' : ''}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{cert.user?.display_name}</span>
                              <Badge variant="outline">{cert.cert_name}</Badge>
                              {cert.is_expired ? (
                                <Badge variant="destructive">Expired</Badge>
                              ) : cert.expires_soon ? (
                                <Badge className="bg-amber-500">
                                  {days !== null ? `${days} days left` : 'Expiring Soon'}
                                </Badge>
                              ) : (
                                <Badge className="bg-emerald-600">Valid</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {cert.issued_date && `Issued: ${cert.issued_date}`}
                              {cert.expiry_date && ` | Expires: ${cert.expiry_date}`}
                              {cert.cert_number && ` | #${cert.cert_number}`}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(cert.id)}
                            disabled={deleting === cert.id}
                            className="text-muted-foreground hover:text-red-500"
                          >
                            {deleting === cert.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
