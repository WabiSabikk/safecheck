import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/utils/rate-limit';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: Request) {
  // Rate limit by IP
  const ip = getClientIp(request);
  const rl = checkRateLimit(`pin:${ip}`, RATE_LIMITS.pin);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  const body = await request.json();
  const pin = body.pin;

  if (!pin || typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
    return NextResponse.json(
      { error: 'PIN must be 4 digits' },
      { status: 400 }
    );
  }

  // Find all staff profiles with PINs
  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('id, pin_hash, display_name')
    .not('pin_hash', 'is', null)
    .eq('role', 'staff');

  if (error || !profiles || profiles.length === 0) {
    return NextResponse.json(
      { error: 'Invalid PIN' },
      { status: 401 }
    );
  }

  // Check each profile's PIN
  for (const profile of profiles) {
    const match = await bcrypt.compare(pin, profile.pin_hash!);
    if (match) {
      return NextResponse.json({
        success: true,
        user: {
          id: profile.id,
          displayName: profile.display_name,
        },
      });
    }
  }

  return NextResponse.json(
    { error: 'Invalid PIN' },
    { status: 401 }
  );
}
