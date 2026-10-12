import { z } from 'zod';

export const addToCartSchema = z.object({
  product_id: z.string().min(1, 'Product ID is required'),
  variant_id: z.string().optional().nullable(),
  quantity: z.coerce.number().int().positive('Quantity must be at least 1').default(1),
  session_id: z.string().optional(),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().positive('Quantity must be at least 1'),
});

export const applyCouponSchema = z.object({
  coupon_code: z.string().min(1, 'Coupon code is required'),
  session_id: z.string().optional(),
});
