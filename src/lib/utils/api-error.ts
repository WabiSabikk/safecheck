import { NextResponse } from 'next/server';

export function apiError(error: unknown, publicMessage = 'An error occurred', status = 500) {
  console.error('[API Error]', error instanceof Error ? error.message : error);
  return NextResponse.json({ error: publicMessage }, { status });
}
