import { z } from 'zod';

export const receivingLogSchema = z.object({
  supplierName: z.string().min(1, 'Supplier name required').max(255),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  items: z.array(z.object({
    name: z.string().min(1).max(255),
    quantity: z.number().positive().optional(),
    unit: z.string().max(50).optional(),
    temperature: z.number().optional(),
    tempUnit: z.enum(['F', 'C']).optional(),
    inRange: z.boolean().optional(),
    isTCS: z.boolean().optional(),
    lotNumber: z.string().max(100).optional(),
  })).min(1, 'At least one item required').max(100),
  deliveryTemp: z.number().min(-40).max(500).optional().nullable(),
  deliveryTempUnit: z.enum(['F', 'C']).default('F'),
  notes: z.string().max(1000).optional().nullable(),
});

export type ReceivingLogInput = z.infer<typeof receivingLogSchema>;
