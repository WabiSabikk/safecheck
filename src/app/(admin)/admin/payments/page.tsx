'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, DollarSign } from 'lucide-react';
import type { AdminPayment } from '@/types/admin';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [summary, setSummary] = useState({ free: 0, starter: 0, professional: 0, mrr: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/payments')
      .then(r => r.json())
      .then(data => {
        setPayments(data.payments || []);
        setSummary(data.summary || { free: 0, starter: 0, professional: 0, mrr: 0 });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        {[1, 2].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <CreditCard className="h-6 w-6" />
        Payments
      </h1>

      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <span className="text-sm text-muted-foreground">Free</span>
            <span className="text-2xl font-bold mt-1 block">{summary.free}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <span className="text-sm text-muted-foreground">Starter ($19)</span>
            <span className="text-2xl font-bold mt-1 block text-blue-600">{summary.starter}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <span className="text-sm text-muted-foreground">Professional ($39)</span>
            <span className="text-2xl font-bold mt-1 block text-emerald-600">{summary.professional}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-muted-foreground">MRR</span>
            </div>
            <span className="text-2xl font-bold mt-1 block text-amber-600">${summary.mrr}</span>
          </CardContent>
        </Card>
      </div>

      {/* Payments table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium">Organization</th>
                  <th className="pb-2 font-medium">Tier</th>
                  <th className="pb-2 font-medium">Stripe Status</th>
                  <th className="pb-2 font-medium">Period End</th>
                  <th className="pb-2 font-medium">Customer ID</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.org_id} className="border-b last:border-0">
                    <td className="py-2 font-medium">{p.org_name}</td>
                    <td className="py-2">
                      <Badge
                        variant={p.subscription_tier === 'free' ? 'secondary' : 'default'}
                        className={
                          p.subscription_tier === 'professional' ? 'bg-emerald-600' :
                          p.subscription_tier === 'starter' ? 'bg-blue-600' : ''
                        }
                      >
                        {p.subscription_tier}
                      </Badge>
                    </td>
                    <td className="py-2">
                      {p.stripe_subscription_status ? (
                        <Badge variant="outline" className="capitalize">{p.stripe_subscription_status}</Badge>
                      ) : '—'}
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {p.stripe_current_period_end
                        ? new Date(p.stripe_current_period_end).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="py-2 text-muted-foreground text-xs font-mono">
                      {p.stripe_customer_id ? p.stripe_customer_id.slice(0, 20) + '...' : '—'}
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No organizations yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
