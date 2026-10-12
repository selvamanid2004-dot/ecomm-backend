import { AppDataSource } from '../config/database.config';
import { Coupon } from '../entities/Coupon';
import { BadRequestError, NotFoundError } from '../errors/app-error';

export class CouponService {
  private couponRepo = AppDataSource.getRepository(Coupon);

  async validateCoupon(code: string, subtotal: number) {
    const coupon = await this.couponRepo.findOne({
      where: { code: code.toUpperCase().trim(), is_active: true },
    });

    if (!coupon) {
      throw new NotFoundError(`Coupon '${code}' is invalid or has expired`);
    }

    if (coupon.expires_at && new Date() > new Date(coupon.expires_at)) {
      throw new BadRequestError('This promotional coupon has expired');
    }

    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      throw new BadRequestError('This promotional coupon has reached its maximum redemption limit');
    }

    if (subtotal < Number(coupon.min_order_amount)) {
      throw new BadRequestError(
        `Minimum order amount of ₹${coupon.min_order_amount} required to use coupon '${coupon.code}'`
      );
    }

    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = (subtotal * Number(coupon.discount_value)) / 100;
      if (coupon.max_discount_amount) {
        discount = Math.min(discount, Number(coupon.max_discount_amount));
      }
    } else {
      discount = Math.min(Number(coupon.discount_value), subtotal);
    }

    discount = Math.round(discount * 100) / 100;

    return {
      coupon,
      discountAmount: discount,
    };
  }

  async getAllCoupons() {
    return this.couponRepo.find({ order: { created_at: 'DESC' } });
  }

  async createCoupon(data: any) {
    const coupon = this.couponRepo.create({
      ...data,
      code: data.code.toUpperCase().trim(),
    });
    return this.couponRepo.save(coupon);
  }
}
