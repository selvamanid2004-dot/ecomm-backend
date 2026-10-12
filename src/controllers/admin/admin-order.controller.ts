import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../../services/order.service';

export class AdminOrderController {
  private orderService = new OrderService();

  getAllOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.orderService.getAllOrders(req.query as any);
      res.status(200).json({
        success: true,
        message: 'Orders retrieved successfully',
        data: result.orders,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  };

  getOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await this.orderService.getOrderById(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Order retrieved successfully',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, payment_status, tracking_number, comments } = req.body;
      const order = await this.orderService.updateOrderStatus(
        req.params.id,
        status,
        payment_status,
        tracking_number,
        comments,
        req.user?.userId
      );

      res.status(200).json({
        success: true,
        message: 'Order status updated successfully',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.orderService.deleteOrder(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
