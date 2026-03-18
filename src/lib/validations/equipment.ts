import { z } from 'zod';

export const equipmentSchema = z.object({
  name: z.string().min(1, 'Equipment name required').max(255),
  equipmentType: z.enum(['cold_storage', 'freezer', 'hot_holding', 'dry_storage', 'other']),
  minTemp: z.number().min(-100).max(600).optional().nullable(),
  maxTemp: z.number().min(-100).max(600).optional().nullable(),
});

export type EquipmentInput = z.infer<typeof equipmentSchema>;
