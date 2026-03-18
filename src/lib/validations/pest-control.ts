import { z } from 'zod';

export const pestControlSchema = z.object({
  serviceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  providerName: z.string().min(1, 'Provider name required').max(255),
  areasTreated: z.array(z.enum(['kitchen', 'storage', 'dining', 'restroom', 'exterior'])).min(1, 'Select at least one area'),
  treatmentType: z.enum(['spray', 'bait_stations', 'traps', 'fumigation'], { message: 'Treatment type required' }),
  findings: z.string().max(2000).optional().nullable(),
  nextServiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  reportNotes: z.string().max(2000).optional().nullable(),
});

export type PestControlInput = z.infer<typeof pestControlSchema>;
