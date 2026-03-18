'use client';

import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function AdminHeader() {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      <div className="flex items-center gap-2 md:hidden">
        <ShieldCheck className="h-5 w-5 text-violet-600" />
        <span className="font-bold">Admin</span>
      </div>

      <div className="hidden md:block">
        <Badge variant="outline" className="text-violet-600 border-violet-200">
          Platform Admin
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <Link href="/dashboard" className="md:hidden">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            App
          </Button>
        </Link>
      </div>
    </header>
  );
}
