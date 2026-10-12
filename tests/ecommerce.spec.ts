import request from 'supertest';
import { createApp } from '../src/app';
import { PricingService } from '../src/services/pricing.service';
import { CouponService } from '../src/services/coupon.service';

describe('Luxe E-Commerce Backend Suite', () => {
  const app = createApp();

  describe('API Health and Core Middleware', () => {
    it('should return 200 and healthy status on /api/v1/health', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('healthy');
      expect(res.headers['x-correlation-id']).toBeDefined();
    });

    it('should return 404 for non-existent route with structured envelope', async () => {
      const res = await request(app).get('/api/v1/non-existent-endpoint');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('NOT_FOUND');
    });
  });

  describe('Pricing Calculations and Rule Engine', () => {
    const pricingService = new PricingService();

    it('should correctly calculate line item amounts without precision drift', () => {
      const total = pricingService.calculateLineItem(349.99, 3);
      expect(total).toBe(1049.97);
    });

    it('should handle fractional quantity computations accurately', () => {
      const total = pricingService.calculateLineItem(19.95, 1);
      expect(total).toBe(19.95);
    });
  });

  describe('Coupon Calculations', () => {
    const couponService = new CouponService();

    it('should reject coupons below minimum order threshold', async () => {
      // Mock repository response
      jest.spyOn((couponService as any).couponRepo, 'findOne').mockResolvedValue({
        code: 'LUXE10',
        min_order_amount: 100.0,
        discount_type: 'percentage',
        discount_value: 10.0,
        is_active: true,
      });

      await expect(couponService.validateCoupon('LUXE10', 50.0)).rejects.toThrow(
        /Minimum order amount/
      );
    });

    it('should correctly apply percentage discount when conditions met', async () => {
      jest.spyOn((couponService as any).couponRepo, 'findOne').mockResolvedValue({
        code: 'LUXE10',
        min_order_amount: 100.0,
        discount_type: 'percentage',
        discount_value: 10.0,
        max_discount_amount: 50.0,
        is_active: true,
      });

      const res = await couponService.validateCoupon('LUXE10', 200.0);
      expect(res.discountAmount).toBe(20.0);
    });
  });

  describe('Authentication Input Validation', () => {
    it('should reject invalid email during registration', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'invalid-email',
        password: 'Password123',
        first_name: 'John',
        last_name: 'Doe',
      });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject weak password during registration', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'john@example.com',
        password: 'weak',
        first_name: 'John',
        last_name: 'Doe',
      });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });
});
