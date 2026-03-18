import { z } from 'zod';

const FDA_BIG_9 = ['Milk', 'Eggs', 'Fish', 'Shellfish', 'Tree Nuts', 'Peanuts', 'Wheat', 'Soybeans', 'Sesame'] as const;

export const foodLabelSchema = z.object({
  foodName: z.string().min(1, 'Food name required').max(255),
  prepDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  shelfLifeDays: z.number().int().min(1).max(365).default(3),
  allergens: z.array(z.string().max(50)).max(20).default([]),
  storageInstructions: z.string().max(500).optional().nullable(),
  quantity: z.number().int().min(1).max(9999).default(1),
  templateId: z.string().uuid().optional().nullable(),
  saveAsTemplate: z.boolean().default(false),
});

export const allergenSchema = z.object({
  itemName: z.string().min(1, 'Item name required').max(255),
  category: z.string().max(100).optional().nullable(),
  allergens: z.array(z.string().max(50)).max(20).default([]),
  crossContactRisk: z.array(z.string().max(50)).max(20).default([]),
  storageNotes: z.string().max(500).optional().nullable(),
  separateStorage: z.boolean().default(false),
});

export const allergenUpdateSchema = allergenSchema.extend({
  id: z.string().uuid('Invalid ID'),
});

export type FoodLabelInput = z.infer<typeof foodLabelSchema>;
export type AllergenInput = z.infer<typeof allergenSchema>;
