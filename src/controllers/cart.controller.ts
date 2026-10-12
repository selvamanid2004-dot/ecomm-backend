import { Request, Response, NextFunction } from 'express';
import { CartService } from '../services/cart.service';

export class CartController {
  private cartService = new CartService();

  private resolveCustomerId(req: Request): string | null {
    // Only resolve customerId from verified authenticated JWT claims
    return req.user?.customerId || null;
  }

  getCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = this.resolveCustomerId(req);
      const sessionId = (req.query.session_id as string) || (req.headers['x-session-id'] as string) || null;
      const cart = await this.cartService.getCartSummary(customerId, sessionId);

      res.status(200).json({
        success: true,
        message: 'Cart retrieved successfully',
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  };

  addItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = this.resolveCustomerId(req);
      const sessionId = req.body.session_id || (req.headers['x-session-id'] as string) || null;

      const result = await this.cartService.addItem({
        productId: req.body.product_id,
        variantId: req.body.variant_id,
        quantity: req.body.quantity,
        customerId,
        sessionId,
      });

      res.status(200).json({
        success: true,
        message: 'Item added to cart',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  updateItemQuantity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = this.resolveCustomerId(req);
      const sessionId = (req.query.session_id as string) || (req.headers['x-session-id'] as string) || null;

      const result = await this.cartService.updateItemQuantity(
        req.params.itemId,
        req.body.quantity,
        customerId,
        sessionId
      );

      res.status(200).json({
        success: true,
        message: 'Cart quantity updated',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  removeItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = this.resolveCustomerId(req);
      const sessionId = (req.query.session_id as string) || (req.headers['x-session-id'] as string) || null;

      const result = await this.cartService.removeItem(req.params.itemId, customerId, sessionId);

      res.status(200).json({
        success: true,
        message: 'Item removed from cart',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  applyCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = this.resolveCustomerId(req);
      const sessionId = req.body.session_id || (req.headers['x-session-id'] as string) || null;

      const result = await this.cartService.applyCoupon(req.body.coupon_code, customerId, sessionId);

      res.status(200).json({
        success: true,
        message: 'Coupon code applied successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  removeCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = this.resolveCustomerId(req);
      const sessionId = (req.query.session_id as string) || (req.headers['x-session-id'] as string) || null;

      const result = await this.cartService.removeCoupon(customerId, sessionId);

      res.status(200).json({
        success: true,
        message: 'Coupon removed',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
