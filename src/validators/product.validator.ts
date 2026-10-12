import { z } from 'zod';

export const createProductSchema = z
  .object({
    name: z.string().min(1, 'Product name is required').max(200),
    sku: z.string().max(100).optional(),
    description: z.string().min(1, 'Description is required'),
    short_description: z.string().optional(),
    category_id: z.string().optional().nullable(),
    base_price: z.coerce.number().positive('Price must be greater than zero').optional(),
    price: z.coerce.number().positive('Price must be greater than zero').optional(),
    compare_at_price: z.coerce.number().positive().optional().nullable(),
    cost_price: z.coerce.number().positive().optional().nullable(),
    stock_quantity: z.coerce.number().int().nonnegative().default(50),
    low_stock_threshold: z.coerce.number().int().nonnegative().default(5),
    is_active: z.boolean().default(true),
    is_featured: z.boolean().default(false),
    meta_title: z.string().max(200).optional(),
    meta_description: z.string().max(300).optional(),
    image_urls: z.array(z.string()).optional(),
    image_url: z.string().optional(),
  })
  .refine(
    (data) => data.base_price !== undefined || data.price !== undefined,
    {
      message: 'Price is required and must be greater than zero',
      path: ['price'],
    }
  );

export const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  sku: z.string().max(100).optional(),
  description: z.string().optional(),
  short_description: z.string().optional(),
  category_id: z.string().optional().nullable(),
  base_price: z.coerce.number().positive().optional(),
  price: z.coerce.number().positive().optional(),
  compare_at_price: z.coerce.number().positive().optional().nullable(),
  cost_price: z.coerce.number().positive().optional().nullable(),
  stock_quantity: z.coerce.number().int().nonnegative().optional(),
  low_stock_threshold: z.coerce.number().int().nonnegative().optional(),
  is_active: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  meta_title: z.string().max(200).optional(),
  meta_description: z.string().max(300).optional(),
  image_urls: z.array(z.string()).optional(),
  image_url: z.string().optional(),
});

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(12),
  category: z.string().optional(),
  search: z.string().optional(),
  min_price: z.coerce.number().nonnegative().optional(),
  max_price: z.coerce.number().nonnegative().optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'featured', 'rating']).default('newest'),
  in_stock: z.enum(['true', 'false']).optional(),
});
