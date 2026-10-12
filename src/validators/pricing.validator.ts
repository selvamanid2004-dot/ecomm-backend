import { z } from 'zod';

export const updatePriceSchema = z.object({
  base_price: z.coerce.number().positive('Price must be greater than zero'),
  compare_at_price: z.coerce.number().positive().optional().nullable(),
  reason: z.string().min(3, 'A reason for the price update must be provided').max(255),
});

export const adjustStockSchema = z.object({
  change_quantity: z.coerce.number().int(),
  type: z.enum(['restock', 'sale', 'adjustment', 'return']).default('adjustment'),
  notes: z.string().max(255).optional(),
});
