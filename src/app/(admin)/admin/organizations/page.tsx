'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AdminOrg } from '@/types/admin';

export default function AdminOrganizationsPage() {
  const [orgs, setOrgs] = useState<AdminOrg[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchOrgs = async (p: number, s: string) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), search: s });
    const res = await fetch(`/api/admin/organizations?${params}`);
    const data = await res.json();
    setOrgs(data.organizations || []);
    setTotal(data.total || 0);
    setLoading(false);
  };

  useEffect(() => { fetchOrgs(page, search); }, [page]);

  const handleSearch = () => {
    setPage(1);
    fetchOrgs(1, search);
  };

  const tierBadge = (t: string) => {
    if (t === 'professional') return <Badge className="bg-emerald-600">Professional</Badge>;
    if (t === 'starter') return <Badge className="bg-blue-600">Starter</Badge>;
    return <Badge variant="secondary">Free</Badge>;
  };

  const totalPages = Math.ceil(total / 25);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Building2 className="h-6 w-6" />
        Organizations
      </h1>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={handleSearch}>Search</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium">Name</th>
                      <th className="pb-2 font-medium">Tier</th>
                      <th className="pb-2 font-medium">Users</th>
                      <th className="pb-2 font-medium">Locations</th>
                      <th className="pb-2 font-medium">Stripe Status</th>
                      <th className="pb-2 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgs.map(o => (
                      <tr key={o.id} className="border-b last:border-0">
                        <td className="py-2 font-medium">{o.name}</td>
                        <td className="py-2">{tierBadge(o.subscription_tier)}</td>
                        <td className="py-2">{o.user_count}</td>
                        <td className="py-2">{o.location_count}</td>
                        <td className="py-2">
                          {o.stripe_subscription_status ? (
                            <Badge variant="outline" className="capitalize">{o.stripe_subscription_status}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-2 text-muted-foreground">
                          {new Date(o.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {orgs.length === 0 && (
                      <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No organizations found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">{total} organizations total</span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">Page {page} of {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
