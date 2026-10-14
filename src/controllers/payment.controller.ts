import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';

export class PaymentController {
  private paymentService = new PaymentService();

  getConfig = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const config = this.paymentService.getPublicConfig();
      res.status(200).json({
        success: true,
        data: config,
      });
    } catch (error) {
      next(error);
    }
  };

  createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderId, amount, receipt, notes } = req.body;
      const order = await this.paymentService.createRazorpayOrder({
        orderId,
        amount,
        receipt,
        notes,
      });

      res.status(200).json({
        success: true,
        message: 'Razorpay order created successfully',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  verifyPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
      const confirmedOrder = await this.paymentService.verifyAndConfirmPayment({
        orderId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });

      res.status(200).json({
        success: true,
        message: 'Payment verified and order confirmed successfully',
        data: confirmedOrder,
      });
    } catch (error) {
      next(error);
    }
  };
}
