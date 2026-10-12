import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import { ForbiddenError, UnauthorizedError } from '../errors/app-error';

export class OrderController {
  private orderService = new OrderService();

  createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = req.user?.customerId || req.user?.userId || null;
      const sessionId = req.body.session_id || (req.headers['x-session-id'] as string) || null;

      const order = await this.orderService.createOrderFromCart({
        customerId,
        sessionId,
        guestEmail: req.body.guest_email || req.user?.email || null,
        shippingAddress: req.body.shipping_address,
        billingAddress: req.body.billing_address || req.body.shipping_address,
        paymentMethod: req.body.payment_method || 'credit_card',
        shippingMethod: req.body.shipping_method,
        notes: req.body.notes,
        items: req.body.items,
      });

      res.status(201).json({
        success: true,
        message: 'Order placed successfully',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  getOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      const order = await this.orderService.getOrderById(req.params.id);

      // Enforce authorization: Admin or verified order owner only
      if (user) {
        const isAdmin = user.role === 'admin' || user.role === 'manager';
        const isOwner =
          (user.customerId && order.customer_id === user.customerId) ||
          (user.email && order.guest_email?.toLowerCase() === user.email.toLowerCase());
        if (!isAdmin && !isOwner) {
          throw new ForbiddenError('Access denied: You do not have permission to view this order');
        }
      } else {
        const verifyEmail = (req.query.email as string)?.trim().toLowerCase();
        if (!verifyEmail || verifyEmail !== order.guest_email?.toLowerCase()) {
          throw new UnauthorizedError('Authentication or email verification required to view this order');
        }
      }

      res.status(200).json({
        success: true,
        message: 'Order retrieved successfully',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  getMyOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = req.user?.customerId || req.user?.userId || null;
      const email = (req.user?.email || req.query.email || req.headers['x-customer-email'] || null) as string | null;
      const orders = await this.orderService.getCustomerOrders(customerId, email);
      res.status(200).json({
        success: true,
        message: 'Customer orders retrieved successfully',
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  };
}
