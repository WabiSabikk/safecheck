'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth/context';
import { Users, Plus, Loader2 } from 'lucide-react';
import type { Profile } from '@/types/database';

export default function TeamPage() {
  const { orgId, supabase, loading: authLoading } = useAuth();
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!orgId) {
      setLoading(false);
      return;
    }

    const fetchTeam = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, email, display_name, role, created_at, org_id')
          .eq('org_id', orgId)
          .order('created_at');
        if (data) setMembers(data as unknown as Profile[]);
      } catch (err) {
        console.error('[Team] Error:', err);
      }
      setLoading(false);
    };
    fetchTeam();
  }, [authLoading, orgId, supabase]);

  const handleAddStaff = async () => {
    if (!newName || !newPin || newPin.length !== 4) {
      toast.error('Enter name and 4-digit PIN');
      return;
    }

    setAdding(true);

    const res = await fetch('/api/settings/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: newName, pin: newPin }),
    });

    if (res.ok) {
      toast.success(`${newName} added!`);
      setNewName('');
      setNewPin('');
      setDialogOpen(false);
      window.location.reload();
    } else {
      const data = await res.json();
      toast.error(data.error || 'Failed to add staff');
    }

    setAdding(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-muted-foreground">Manage staff and PINs</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Staff Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="Carlos Martinez"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>4-Digit PIN</Label>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="1234"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                />
                <p className="text-xs text-muted-foreground">
                  Staff will use this PIN to log in on the kitchen tablet
                </p>
              </div>
              <Button
                onClick={handleAddStaff}
                disabled={adding}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Staff Member
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="divide-y p-0">
          {members.length === 0 ? (
            <div className="flex flex-col items-center py-12">
              <Users className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 font-medium">No team members yet</p>
            </div>
          ) : (
            members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-medium text-sm">
                    {member.display_name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-medium">{member.display_name}</p>
                    <p className="text-xs text-muted-foreground">{member.email || 'PIN login only'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                    {member.role}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
