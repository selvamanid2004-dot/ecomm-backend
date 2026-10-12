import { z } from 'zod';

const addressSchema = z.object({
  recipient_name: z.string().optional().default('Customer'),
  phone: z.string().optional().default('+1-555-0142'),
  street_address: z.string().optional().default('742 Evergreen Terrace'),
  apartment: z.string().optional().nullable(),
  city: z.string().optional().default('San Francisco'),
  state: z.string().optional().default('CA'),
  postal_code: z.string().optional().default('94107'),
  country: z.string().optional().default('United States'),
});

const itemSchema = z.object({
  product_id: z.string(),
  quantity: z.number().min(1),
});

export const checkoutSchema = z.object({
  session_id: z.string().optional().nullable(),
  shipping_address: addressSchema.optional().default({}),
  billing_address: addressSchema.optional().nullable(),
  payment_method: z.string().optional().default('credit_card'),
  shipping_method: z.string().optional().default('Standard Delivery'),
  notes: z.string().optional().nullable(),
  guest_email: z.string().optional().nullable(),
  items: z.array(itemSchema).optional().default([]),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
  payment_status: z.enum(['unpaid', 'paid', 'refunded', 'failed']).optional(),
  tracking_number: z.string().optional(),
  comments: z.string().optional(),
});
