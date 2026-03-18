import { z } from 'zod';

export const checklistTemplateSchema = z.object({
  name: z.string().min(1, 'Template name required').max(255),
  checklist_type: z.enum(['opening', 'closing', 'receiving', 'cleaning', 'custom']),
  scheduled_time: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  overdue_after_minutes: z.number().int().min(1).max(1440).default(180),
  items: z.array(z.object({
    description: z.string().min(1).max(500),
    category: z.string().max(100).optional(),
    is_required: z.boolean().default(true),
  })).min(1, 'At least one item required').max(100),
});

export type ChecklistTemplateInput = z.infer<typeof checklistTemplateSchema>;
