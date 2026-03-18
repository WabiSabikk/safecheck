import { z } from 'zod';

export const checkoutSchema = z.object({
  tier: z.enum(['starter', 'professional']),
});
