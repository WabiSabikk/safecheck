import { z } from 'zod';

export const temperatureLogSchema = z.object({
  equipmentId: z.string().uuid(),
  temperature: z.number().min(-40).max(500),
  unit: z.enum(['F', 'C']).default('F'),
  notes: z.string().max(500).optional(),
});

export const correctiveActionSchema = z.object({
  temperatureLogId: z.string().uuid().optional(),
  issueType: z.enum(['high_temp', 'low_temp', 'equipment_malfunction', 'food_discarded', 'other']),
  description: z.string().min(5, 'Describe the issue').max(1000),
  actionTaken: z.string().min(5, 'Describe what you did').max(1000),
});

export type TemperatureLogInput = z.infer<typeof temperatureLogSchema>;
export type CorrectiveActionInput = z.infer<typeof correctiveActionSchema>;

// Temperature range constants (FDA Food Code)
export const TEMP_RANGES = {
  cold_storage: { min: 32, max: 41, unit: 'F' as const, label: 'Refrigerator (32-41°F)' },
  freezer: { min: -10, max: 0, unit: 'F' as const, label: 'Freezer (0°F or below)' },
  hot_holding: { min: 135, max: 200, unit: 'F' as const, label: 'Hot Holding (135°F+)' },
} as const;

export function getTempStatus(temp: number, min: number | null, max: number | null): 'safe' | 'warning' | 'danger' {
  if (min === null || max === null) return 'safe';
  if (temp >= min && temp <= max) return 'safe';
  const buffer = (max - min) * 0.1;
  if (temp >= min - buffer && temp <= max + buffer) return 'warning';
  return 'danger';
}

export function getTempColor(status: 'safe' | 'warning' | 'danger'): string {
  switch (status) {
    case 'safe': return 'text-emerald-600';
    case 'warning': return 'text-amber-600';
    case 'danger': return 'text-red-600';
  }
}
