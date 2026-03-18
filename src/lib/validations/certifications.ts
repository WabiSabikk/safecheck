import { z } from 'zod';

export const certificationSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  certType: z.string().min(1, 'Certification type required').max(100),
  certName: z.string().min(1, 'Certification name required').max(255),
  issuedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  certNumber: z.string().max(100).optional().nullable(),
});

export type CertificationInput = z.infer<typeof certificationSchema>;
