import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema, pinLoginSchema } from '@/lib/validations/auth';
import {
  temperatureLogSchema,
  correctiveActionSchema,
  getTempStatus,
  getTempColor,
  TEMP_RANGES,
} from '@/lib/validations/temperature';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    expect(loginSchema.safeParse({ email: 'user@test.com', password: '12345678' }).success).toBe(true);
  });

  it('rejects invalid email', () => {
    expect(loginSchema.safeParse({ email: 'not-email', password: '12345678' }).success).toBe(false);
  });

  it('rejects short password', () => {
    expect(loginSchema.safeParse({ email: 'user@test.com', password: '123' }).success).toBe(false);
  });
});

describe('registerSchema', () => {
  it('accepts valid registration', () => {
    const result = registerSchema.safeParse({
      email: 'user@test.com',
      password: '12345678',
      displayName: 'John Doe',
      restaurantName: 'Demo Grill',
    });
    expect(result.success).toBe(true);
  });

  it('requires all fields', () => {
    expect(registerSchema.safeParse({ email: 'a@b.com' }).success).toBe(false);
    expect(registerSchema.safeParse({ email: 'a@b.com', password: '12345678' }).success).toBe(false);
  });
});

describe('pinLoginSchema', () => {
  it('accepts valid 4-digit PIN', () => {
    expect(pinLoginSchema.safeParse({ pin: '1234', locationId: VALID_UUID }).success).toBe(true);
  });

  it('rejects non-4-digit PIN', () => {
    expect(pinLoginSchema.safeParse({ pin: '123', locationId: VALID_UUID }).success).toBe(false);
    expect(pinLoginSchema.safeParse({ pin: '12345', locationId: VALID_UUID }).success).toBe(false);
  });

  it('rejects non-numeric PIN', () => {
    expect(pinLoginSchema.safeParse({ pin: 'abcd', locationId: VALID_UUID }).success).toBe(false);
  });

  it('rejects invalid UUID for locationId', () => {
    expect(pinLoginSchema.safeParse({ pin: '1234', locationId: 'bad-id' }).success).toBe(false);
  });
});

describe('temperatureLogSchema', () => {
  it('accepts valid temperature log', () => {
    const result = temperatureLogSchema.safeParse({
      equipmentId: VALID_UUID,
      temperature: 38,
      unit: 'F',
    });
    expect(result.success).toBe(true);
  });

  it('defaults unit to F', () => {
    const result = temperatureLogSchema.safeParse({
      equipmentId: VALID_UUID,
      temperature: 38,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.unit).toBe('F');
    }
  });

  it('rejects out-of-range temperature', () => {
    expect(temperatureLogSchema.safeParse({
      equipmentId: VALID_UUID,
      temperature: 999,
    }).success).toBe(false);
  });

  it('rejects invalid unit', () => {
    expect(temperatureLogSchema.safeParse({
      equipmentId: VALID_UUID,
      temperature: 38,
      unit: 'K',
    }).success).toBe(false);
  });
});

describe('correctiveActionSchema', () => {
  it('accepts valid corrective action', () => {
    const result = correctiveActionSchema.safeParse({
      issueType: 'high_temp',
      description: 'Fridge temp too high',
      actionTaken: 'Moved items to backup fridge',
    });
    expect(result.success).toBe(true);
  });

  it('rejects unknown issue type', () => {
    expect(correctiveActionSchema.safeParse({
      issueType: 'unknown_type',
      description: 'Something happened',
      actionTaken: 'Did something',
    }).success).toBe(false);
  });

  it('rejects too short description', () => {
    expect(correctiveActionSchema.safeParse({
      issueType: 'other',
      description: 'Hi',
      actionTaken: 'Did something about it',
    }).success).toBe(false);
  });
});

describe('getTempStatus', () => {
  it('returns safe when in range', () => {
    expect(getTempStatus(38, 32, 41)).toBe('safe');
  });

  it('returns safe at boundary', () => {
    expect(getTempStatus(32, 32, 41)).toBe('safe');
    expect(getTempStatus(41, 32, 41)).toBe('safe');
  });

  it('returns warning when slightly out of range', () => {
    // Buffer is 10% of range (41-32=9, buffer=0.9)
    expect(getTempStatus(41.5, 32, 41)).toBe('warning');
    expect(getTempStatus(31.5, 32, 41)).toBe('warning');
  });

  it('returns danger when far out of range', () => {
    expect(getTempStatus(60, 32, 41)).toBe('danger');
    expect(getTempStatus(20, 32, 41)).toBe('danger');
  });

  it('returns safe when min/max are null', () => {
    expect(getTempStatus(100, null, null)).toBe('safe');
    expect(getTempStatus(100, null, 50)).toBe('safe');
    expect(getTempStatus(100, 50, null)).toBe('safe');
  });
});

describe('getTempColor', () => {
  it('returns correct color classes', () => {
    expect(getTempColor('safe')).toBe('text-emerald-600');
    expect(getTempColor('warning')).toBe('text-amber-600');
    expect(getTempColor('danger')).toBe('text-red-600');
  });
});

describe('TEMP_RANGES', () => {
  it('has FDA-compliant cold storage range', () => {
    expect(TEMP_RANGES.cold_storage.min).toBe(32);
    expect(TEMP_RANGES.cold_storage.max).toBe(41);
    expect(TEMP_RANGES.cold_storage.unit).toBe('F');
  });

  it('has freezer range', () => {
    expect(TEMP_RANGES.freezer.max).toBe(0);
  });

  it('has hot holding range', () => {
    expect(TEMP_RANGES.hot_holding.min).toBe(135);
  });
});
