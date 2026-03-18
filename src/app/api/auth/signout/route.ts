import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Manually clear all Supabase auth cookies
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const response = NextResponse.json({ success: true });

  for (const cookie of allCookies) {
    if (cookie.name.startsWith('sb-')) {
      response.cookies.set(cookie.name, '', {
        path: '/',
        expires: new Date(0),
        maxAge: 0,
      });
    }
  }

  return response;
}
