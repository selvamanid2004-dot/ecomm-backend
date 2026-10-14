import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../config/environment.config';
import { BadRequestError, NotFoundError } from '../errors/app-error';
import { mockStore, saveOrdersToDisk } from '../database/mock-store';
import { AppDataSource } from '../config/database.config';
import { Order } from '../entities/Order';
import { Payment } from '../entities/Payment';

export class PaymentService {
  private razorpay: any;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  }

  getPublicConfig() {
    return {
      keyId: env.RAZORPAY_KEY_ID,
      currency: 'INR',
    };
  }

  async createRazorpayOrder(params: {
    orderId?: string;
    amount?: number;
    receipt?: string;
    notes?: any;
  }) {
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      throw new BadRequestError('Razorpay credentials are not configured on the server');
    }

    let finalAmount = params.amount || 0;
    let finalReceipt = params.receipt || `rcpt_${Date.now()}`;

    // If orderId is provided, look up authoritative total from order
    if (params.orderId) {
      let order: any = null;
      if (!AppDataSource.isInitialized) {
        order = mockStore.orders.find((o) => o.id === params.orderId || o.order_number === params.orderId);
      } else {
        const repo = AppDataSource.getRepository(Order);
        order = await repo.findOne({ where: [{ id: params.orderId }, { order_number: params.orderId }] });
      }

      if (!order) {
        throw new NotFoundError(`Order ${params.orderId} not found`);
      }

      finalAmount = Number(order.total_amount);
      finalReceipt = order.order_number || order.id;
    }

    if (finalAmount <= 0) {
      throw new BadRequestError('Payment amount must be greater than zero');
    }

    // Razorpay expects amount in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(finalAmount * 100);

    const rzpOrder = await this.razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: finalReceipt.slice(0, 40),
      notes: params.notes || {},
    });

    return {
      razorpay_order_id: rzpOrder.id,
      amount: rzpOrder.amount, // in paise
      amount_in_rupees: finalAmount,
      currency: rzpOrder.currency,
      key_id: env.RAZORPAY_KEY_ID,
      receipt: rzpOrder.receipt,
    };
  }

  verifySignature(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string): boolean {
    const text = `${razorpayOrderId}|${razorpayPaymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    return generatedSignature === razorpaySignature;
  }

  async verifyAndConfirmPayment(data: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    const isValid = this.verifySignature(data.razorpayOrderId, data.razorpayPaymentId, data.razorpaySignature);
    if (!isValid) {
      throw new BadRequestError('Cryptographic payment signature verification failed');
    }

    if (!AppDataSource.isInitialized) {
      const order = mockStore.orders.find(
        (o) => o.id === data.orderId || o.order_number === data.orderId
      );

      if (!order) {
        throw new NotFoundError(`Order ${data.orderId} not found`);
      }

      order.payment_status = 'paid';
      order.payment_method = 'razorpay';
      order.status = 'processing';
      order.tracking_number = order.tracking_number || `TRK-FX-${Math.floor(100000000 + Math.random() * 900000000)}`;
      (order as any).razorpay_order_id = data.razorpayOrderId;
      (order as any).razorpay_payment_id = data.razorpayPaymentId;
      (order as any).transaction_reference = data.razorpayPaymentId;

      mockStore.payments.push({
        id: `pay-${Date.now()}`,
        order_id: order.id,
        payment_method: 'razorpay',
        transaction_reference: data.razorpayPaymentId,
        amount: Number(order.total_amount),
        currency: 'INR',
        status: 'succeeded',
        gateway_response: {
          razorpay_order_id: data.razorpayOrderId,
          razorpay_payment_id: data.razorpayPaymentId,
          razorpay_signature: data.razorpaySignature,
        },
        created_at: new Date(),
      });

      saveOrdersToDisk();
      return order;
    }

    const orderRepo = AppDataSource.getRepository(Order);
    const paymentRepo = AppDataSource.getRepository(Payment);

    const order = await orderRepo.findOne({
      where: [{ id: data.orderId }, { order_number: data.orderId }],
    });

    if (!order) {
      throw new NotFoundError(`Order ${data.orderId} not found`);
    }

    order.payment_status = 'paid';
    order.payment_method = 'razorpay';
    order.status = 'processing';
    await orderRepo.save(order);

    const payment = paymentRepo.create({
      id: `pay-${Date.now()}`,
      order_id: order.id,
      payment_method: 'razorpay',
      transaction_reference: data.razorpayPaymentId,
      amount: order.total_amount,
      currency: 'INR',
      status: 'succeeded',
      gateway_response: {
        razorpay_order_id: data.razorpayOrderId,
        razorpay_payment_id: data.razorpayPaymentId,
        razorpay_signature: data.razorpaySignature,
      },
    });
    await paymentRepo.save(payment);

    return order;
  }
}
