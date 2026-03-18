import { z } from 'zod';

export const supplierSchema = z.object({
  supplierName: z.string().min(1, 'Supplier name required').max(255),
  contactPhone: z.string().max(50).optional().nullable(),
  contactEmail: z.string().email('Invalid email').max(255).optional().nullable().or(z.literal('')),
  products: z.string().max(2000).optional().nullable(),
  lastVerificationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  verificationMethod: z.enum(['site_visit', 'documentation_review', 'third_party_audit']).optional().nullable(),
  licenseNumber: z.string().max(100).optional().nullable(),
  status: z.enum(['approved', 'pending', 'suspended']).default('pending'),
  notes: z.string().max(2000).optional().nullable(),
});

export type SupplierInput = z.infer<typeof supplierSchema>;
