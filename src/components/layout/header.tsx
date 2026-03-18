'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ShieldCheck, LogOut, User, Globe, MapPin, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { useLocation } from '@/lib/hooks/use-location';

export function Header() {
  const { profile, isAdmin } = useAuth();
  const { locale, setLocale, t } = useI18n();
  const { currentLocation, locations, switchLocation } = useLocation();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    // Server-side signout clears cookies reliably
    await fetch('/api/auth/signout', { method: 'POST' });
    // Clear client-side session too
    await supabase.auth.signOut({ scope: 'local' });
    window.location.href = '/login';
  };

  const initials = profile?.display_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      {/* Mobile logo */}
      <div className="flex items-center gap-2 md:hidden">
        <ShieldCheck className="h-5 w-5 text-emerald-600" />
        <span className="font-bold">SafeCheck</span>
      </div>

      {/* Desktop: location selector */}
      <div className="hidden md:block">
        {locations.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <MapPin className="h-3.5 w-3.5" />
                {currentLocation?.name || 'Select Location'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {locations.map((loc) => (
                <DropdownMenuItem
                  key={loc.id}
                  onClick={() => switchLocation(loc.id)}
                  className={loc.id === currentLocation?.id ? 'bg-emerald-50 font-medium' : ''}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  {loc.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Language toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocale(locale === 'en' ? 'es' : 'en')}
          className="gap-1 text-xs"
        >
          <Globe className="h-3.5 w-3.5" />
          {locale === 'en' ? 'ES' : 'EN'}
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="text-sm">
                <p className="font-medium">{profile?.display_name}</p>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            {locations.length > 1 && (
              <>
                {locations.map((loc) => (
                  <DropdownMenuItem
                    key={loc.id}
                    onClick={() => switchLocation(loc.id)}
                    className={loc.id === currentLocation?.id ? 'bg-emerald-50' : ''}
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    {loc.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </>
            )}
            {isAdmin && (
              <DropdownMenuItem onClick={() => router.push('/admin')}>
                <Shield className="mr-2 h-4 w-4" />
                Admin Panel
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <User className="mr-2 h-4 w-4" />
              {t('settings.title')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              {t('common.signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
