import { describe, it, expect } from 'vitest';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/utils/rate-limit';

describe('checkRateLimit', () => {
  it('allows first request', () => {
    const key = `test-first-${Date.now()}`;
    const result = checkRateLimit(key, { limit: 3, windowSeconds: 60 });
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('decrements remaining on each call', () => {
    const key = `test-decrement-${Date.now()}`;
    const config = { limit: 5, windowSeconds: 60 };

    const r1 = checkRateLimit(key, config);
    expect(r1.remaining).toBe(4);

    const r2 = checkRateLimit(key, config);
    expect(r2.remaining).toBe(3);

    const r3 = checkRateLimit(key, config);
    expect(r3.remaining).toBe(2);
  });

  it('blocks after limit is exceeded', () => {
    const key = `test-block-${Date.now()}`;
    const config = { limit: 2, windowSeconds: 60 };

    checkRateLimit(key, config);
    checkRateLimit(key, config);
    const result = checkRateLimit(key, config);

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('returns resetAt timestamp', () => {
    const key = `test-reset-${Date.now()}`;
    const result = checkRateLimit(key, { limit: 5, windowSeconds: 60 });
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });
});

describe('getClientIp', () => {
  it('extracts IP from x-forwarded-for', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    });
    expect(getClientIp(request)).toBe('1.2.3.4');
  });

  it('falls back to x-real-ip', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-real-ip': '9.8.7.6' },
    });
    expect(getClientIp(request)).toBe('9.8.7.6');
  });

  it('returns unknown when no IP headers', () => {
    const request = new Request('http://localhost');
    expect(getClientIp(request)).toBe('unknown');
  });
});

describe('RATE_LIMITS presets', () => {
  it('has auth preset', () => {
    expect(RATE_LIMITS.auth.limit).toBe(5);
    expect(RATE_LIMITS.auth.windowSeconds).toBe(60);
  });

  it('has pin preset with longer window', () => {
    expect(RATE_LIMITS.pin.limit).toBe(5);
    expect(RATE_LIMITS.pin.windowSeconds).toBe(300);
  });
});
