import { v4 as uuidv4 } from 'uuid';
import { EntityManager } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Order, OrderStatus, PaymentStatus } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { OrderStatusHistory } from '../entities/OrderStatusHistory';
import { Payment } from '../entities/Payment';
import { Product } from '../entities/Product';
import { ProductVariant } from '../entities/ProductVariant';
import { Cart } from '../entities/Cart';
import { InventoryAdjustment } from '../entities/InventoryAdjustment';
import { Coupon } from '../entities/Coupon';
import { CouponUsage } from '../entities/CouponUsage';
import { CartService } from './cart.service';
import { NotFoundError, BadRequestError } from '../errors/app-error';
import {
  mockStore,
  saveOrdersToDisk,
  loadOrdersFromDisk,
  saveCustomersToDisk,
  loadCustomersToDisk,
  loadUsersToDisk,
} from '../database/mock-store';

export class OrderService {
  private get orderRepo() { return AppDataSource.getRepository(Order); }
  private cartService = new CartService();

  async createOrderFromCart(data: {
    customerId?: string | null;
    sessionId?: string | null;
    guestEmail?: string | null;
    shippingAddress: any;
    billingAddress: any;
    paymentMethod: string;
    shippingMethod?: string;
    notes?: string;
    items?: Array<{ product_id: string; quantity: number; unit_price?: number }>;
  }) {
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const invoiceNumber = `INV-${orderNumber.replace('ORD-', '')}`;
    loadOrdersFromDisk();
    loadUsersToDisk();
    loadCustomersToDisk();

    if (!AppDataSource.isInitialized) {
      const orderId = `ord-${Date.now().toString().slice(-6)}`;
      let orderItems: any[] = [];
      let subtotal = 0;

      if (data.items && data.items.length > 0) {
        orderItems = data.items.map((it) => {
          const p = mockStore.products.find((prod) => prod.id === it.product_id);
          const price = p ? Number(p.base_price) : 100;
          const lineTotal = price * it.quantity;
          subtotal += lineTotal;
          if (p) {
            p.stock_quantity = Math.max(0, p.stock_quantity - it.quantity);
            p.is_in_stock = p.stock_quantity > 0;
          }
          return {
            id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            product_name: p ? p.name : 'Luxury Creation',
            sku: p ? p.sku : 'SKU-BESPOKE',
            unit_price: price,
            quantity: it.quantity,
            line_total: lineTotal,
            product_image_url: p?.images?.[0]?.image_url || '',
          };
        });
      } else {
        const cartSummary = await this.cartService.getCartSummary(data.customerId, data.sessionId);
        if (!cartSummary.items || cartSummary.items.length === 0) {
          throw new BadRequestError('Cannot checkout with an empty cart');
        }
        subtotal = cartSummary.subtotal;
        orderItems = cartSummary.items.map((it: any) => ({
          id: `item-${it.id}`,
          product_name: it.productName,
          sku: it.sku,
          unit_price: it.unitPrice,
          quantity: it.quantity,
          line_total: it.lineTotal,
          product_image_url: it.image,
        }));

        cartSummary.items.forEach((it: any) => {
          const p = mockStore.products.find((prod) => prod.id === it.productId);
          if (p) {
            p.stock_quantity = Math.max(0, p.stock_quantity - it.quantity);
            p.is_in_stock = p.stock_quantity > 0;
          }
        });
      }

      let customerId = data.customerId || null;
      const guestEmail = (data.guestEmail || data.shippingAddress?.email || '').trim().toLowerCase();

      // If customerId is not specified, resolve it from the registered customer list using email
      if (!customerId && guestEmail) {
        const matchedUser = mockStore.users.find((u) => u.email.toLowerCase() === guestEmail);
        if (matchedUser) {
          const matchedCust = mockStore.customers.find((c) => c.user_id === matchedUser.id);
          customerId = matchedCust ? matchedCust.id : `cust-${matchedUser.id}`;
        }
      }

      // If customerId is present or resolved, award loyalty points strictly to that customer
      if (customerId) {
        const matchedCust = mockStore.customers.find(
          (c) => c.id === customerId || c.user_id === customerId || `cust-${c.user_id}` === customerId
        );
        if (matchedCust) {
          const earned = Math.max(1, Math.floor(subtotal / 10));
          matchedCust.loyalty_points = (matchedCust.loyalty_points || 0) + earned;
          matchedCust.updated_at = new Date();
          saveCustomersToDisk();
        }
      }

      const newOrder: any = {
        id: orderId,
        order_number: orderNumber,
        invoice_number: invoiceNumber,
        customer_id: customerId,
        guest_email: guestEmail || (data.shippingAddress?.email || null),
        status: 'pending',
        payment_status: 'paid',
        payment_method: data.paymentMethod || 'credit_card',
        shipping_method: data.shippingMethod || 'Standard Delivery',
        subtotal,
        discount_amount: 0,
        tax_amount: 0,
        shipping_fee: 0,
        total_amount: subtotal,
        shipping_address_json: data.shippingAddress,
        billing_address_json: data.billingAddress || data.shippingAddress,
        tracking_number: `TRK-FX-${Math.floor(100000000 + Math.random() * 900000000)}`,
        items: orderItems,
        created_at: new Date(),
      };

      mockStore.orders.unshift(newOrder);
      saveOrdersToDisk();

      // Clear ONLY this customer's cart
      const key = data.customerId || data.sessionId || (guestEmail || 'default_session');
      delete mockStore.carts[key];

      return newOrder;
    }

    const cartSummary = await this.cartService.getCartSummary(data.customerId, data.sessionId);
    if (!cartSummary.items || cartSummary.items.length === 0) {
      throw new BadRequestError('Cannot checkout with an empty cart');
    }

    return AppDataSource.transaction(async (manager: EntityManager) => {
      const orderItemsToSave: OrderItem[] = [];
      const orderId = uuidv4();

      for (const item of cartSummary.items) {
        const product = await manager.findOne(Product, {
          where: { id: item.productId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!product || !product.is_active) {
          throw new BadRequestError(`Product '${item.productName}' is no longer available`);
        }

        let variant: ProductVariant | null = null;
        if (item.variantId) {
          variant = await manager.findOne(ProductVariant, {
            where: { id: item.variantId },
            lock: { mode: 'pessimistic_write' },
          });
          if (!variant || !variant.is_active) {
            throw new BadRequestError(`Variant for product '${item.productName}' is no longer available`);
          }
        }

        const currentStock = variant ? variant.stock_quantity : product.stock_quantity;
        if (currentStock < item.quantity) {
          throw new BadRequestError(
            `Insufficient stock for '${item.productName}'. Only ${currentStock} available, but ${item.quantity} requested.`
          );
        }

        const currentPrice = variant?.price_override
          ? Number(variant.price_override)
          : Number(product.base_price);

        const newStock = currentStock - item.quantity;
        if (variant) {
          variant.stock_quantity = newStock;
          await manager.save(variant);
        } else {
          product.stock_quantity = newStock;
          product.is_in_stock = newStock > 0;
          await manager.save(product);
        }

        const invAdj = manager.create(InventoryAdjustment, {
          id: uuidv4(),
          product_id: product.id,
          change_quantity: -item.quantity,
          new_quantity: newStock,
          type: 'sale',
          notes: `Order #${orderNumber}`,
        });
        await manager.save(invAdj);

        const orderItem = manager.create(OrderItem, {
          id: uuidv4(),
          order_id: orderId,
          product_id: product.id,
          variant_id: variant?.id || null,
          product_name: product.name,
          sku: variant?.sku || product.sku,
          unit_price: currentPrice,
          quantity: item.quantity,
          line_total: Math.round(currentPrice * item.quantity * 100) / 100,
          product_image_url: item.image,
        });
        orderItemsToSave.push(orderItem);
      }

      const order = manager.create(Order, {
        id: orderId,
        order_number: orderNumber,
        invoice_number: invoiceNumber,
        customer_id: data.customerId || null,
        guest_email: data.guestEmail || null,
        status: 'pending' as OrderStatus,
        payment_status: 'paid' as PaymentStatus,
        payment_method: data.paymentMethod,
        shipping_method: data.shippingMethod || 'Standard Delivery',
        subtotal: cartSummary.subtotal,
        discount_amount: cartSummary.discountAmount,
        tax_amount: cartSummary.taxAmount,
        shipping_fee: cartSummary.shippingFee,
        total_amount: cartSummary.totalAmount,
        shipping_address_json: data.shippingAddress,
        billing_address_json: data.billingAddress,
        notes: data.notes,
      });

      await manager.save(order);
      await manager.save(orderItemsToSave);

      const statusHistory = manager.create(OrderStatusHistory, {
        id: uuidv4(),
        order_id: orderId,
        previous_status: 'none',
        new_status: 'pending',
        comments: 'Order placed and payment authorized',
      });
      await manager.save(statusHistory);

      const payment = manager.create(Payment, {
        id: uuidv4(),
        order_id: orderId,
        payment_method: data.paymentMethod,
        transaction_reference: `TXN-${uuidv4().substring(0, 8).toUpperCase()}`,
        amount: cartSummary.totalAmount,
        currency: 'INR',
        status: 'succeeded',
      });
      await manager.save(payment);

      if (cartSummary.couponCode) {
        const coupon = await manager.findOne(Coupon, {
          where: { code: cartSummary.couponCode },
        });
        if (coupon) {
          coupon.usage_count += 1;
          await manager.save(coupon);
        }
      }

      const cart = await manager.findOne(Cart, { where: { id: cartSummary.cartId } });
      if (cart) {
        await manager.delete('cart_items', { cart_id: cart.id });
        cart.coupon_code = null;
        cart.discount_amount = 0;
        await manager.save(cart);
      }

      return order;
    });
  }

  async getOrderById(id: string) {
    if (!AppDataSource.isInitialized) {
      const ord = mockStore.orders.find((o) => o.id === id || o.order_number === id);
      if (!ord) throw new NotFoundError(`Order not found: ${id}`);
      if (!ord.invoice_number) {
        ord.invoice_number = `INV-${ord.order_number?.replace('ORD-', '') || ord.id}`;
      }
      return ord as any;
    }

    const order = await this.orderRepo.findOne({
      where: [{ id }, { order_number: id }],
      relations: ['items', 'status_history', 'payments', 'customer', 'customer.user'],
    });

    if (!order) {
      throw new NotFoundError(`Order not found: ${id}`);
    }

    if (!order.invoice_number) {
      order.invoice_number = `INV-${order.order_number?.replace('ORD-', '') || order.id}`;
    }

    return order;
  }

  async getCustomerOrders(customerId?: string | null, email?: string | null) {
    loadOrdersFromDisk();
    loadUsersToDisk();

    if (!customerId && !email) {
      return [];
    }

    if (!AppDataSource.isInitialized) {
      let targetEmail = (email || '').trim().toLowerCase();

      // If customerId is provided but email is not, resolve user's email
      if (!targetEmail && customerId) {
        const u = mockStore.users.find(
          (usr) =>
            usr.id === customerId ||
            `cust-${usr.id}` === customerId ||
            mockStore.customers.some((c) => c.id === customerId && c.user_id === usr.id)
        );
        if (u) targetEmail = u.email.trim().toLowerCase();
      }

      const list = mockStore.orders.filter((o) => {
        const orderEmail = (o.guest_email || (o.shipping_address_json as any)?.email || '').trim().toLowerCase();
        const matchesEmail = Boolean(targetEmail && orderEmail && orderEmail === targetEmail);
        const matchesCustomer = Boolean(
          customerId && (
            o.customer_id === customerId ||
            o.customer_id === `cust-${customerId}` ||
            (customerId.startsWith('cust-') && o.customer_id === customerId.replace('cust-', '')) ||
            (customerId.startsWith('usr-') && o.customer_id === `cust-${customerId.replace('usr-', '')}`)
          )
        );
        return matchesEmail || matchesCustomer;
      }) as any[];

      list.forEach((o) => {
        if (!o.invoice_number) {
          o.invoice_number = `INV-${o.order_number?.replace('ORD-', '') || o.id}`;
        }
      });
      return list;
    }

    const whereConditions: any[] = [];
    if (customerId) whereConditions.push({ customer_id: customerId });
    if (email) whereConditions.push({ guest_email: email });

    const orders = await this.orderRepo.find({
      where: whereConditions,
      relations: ['items'],
      order: { created_at: 'DESC' },
    });

    orders.forEach((o) => {
      if (!o.invoice_number) {
        o.invoice_number = `INV-${o.order_number?.replace('ORD-', '') || o.id}`;
      }
    });

    return orders;
  }

  async getAllOrders(params: any) {
    loadOrdersFromDisk();
    const isAll = params.all === 'true' || params.all === true;

    if (!AppDataSource.isInitialized) {
      let list = [...mockStore.orders];
      if (params.status) list = list.filter((o) => o.status === params.status);
      list.forEach((o) => {
        if (!o.invoice_number) {
          o.invoice_number = `INV-${o.order_number?.replace('ORD-', '') || o.id}`;
        }
      });

      if (isAll) {
        return { orders: list as any[], meta: { page: 1, limit: list.length, total: list.length, totalPages: 1 } };
      }

      const page = Number(params.page) || 1;
      const limit = Number(params.limit) || 20;
      const paginated = list.slice((page - 1) * limit, page * limit);
      return { orders: paginated as any[], meta: { page, limit, total: list.length, totalPages: Math.ceil(list.length / limit) } };
    }

    const page = isAll ? 1 : (Number(params.page) || 1);
    const limit = isAll ? 10000 : (Number(params.limit) || 20);
    const skip = (page - 1) * limit;

    const qb = this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('customer.user', 'user')
      .leftJoinAndSelect('order.items', 'item');

    if (params.status) {
      qb.andWhere('order.status = :status', { status: params.status });
    }

    qb.orderBy('order.created_at', 'DESC').skip(skip).take(limit);
    const [orders, total] = await qb.getManyAndCount();

    orders.forEach((o) => {
      if (!o.invoice_number) {
        o.invoice_number = `INV-${o.order_number?.replace('ORD-', '') || o.id}`;
      }
    });

    return {
      orders,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateOrderStatus(
    orderId: string,
    newStatus: any,
    paymentStatus?: any,
    trackingNumber?: string,
    _comments?: string,
    _userId?: string
  ) {
    if (!AppDataSource.isInitialized) {
      loadOrdersFromDisk();
      const ord = mockStore.orders.find((o) => o.id === orderId || o.order_number === orderId);
      if (!ord) throw new NotFoundError('Order not found');
      ord.status = newStatus;
      if (paymentStatus) ord.payment_status = paymentStatus;
      if (trackingNumber) ord.tracking_number = trackingNumber;
      if (_comments) (ord as any).comments = _comments;
      saveOrdersToDisk();
      return ord as any;
    }

    const order = await this.getOrderById(orderId);
    order.status = newStatus;
    if (paymentStatus) order.payment_status = paymentStatus;
    if (trackingNumber) order.tracking_number = trackingNumber;

    await this.orderRepo.save(order);
    return order;
  }

  async deleteOrder(id: string) {
    if (!AppDataSource.isInitialized) {
      loadOrdersFromDisk();
      const initialLen = mockStore.orders.length;
      mockStore.orders = mockStore.orders.filter((o) => o.id !== id && o.order_number !== id);
      if (mockStore.orders.length === initialLen) {
        throw new NotFoundError(`Order not found: ${id}`);
      }
      saveOrdersToDisk();
      return { success: true, message: 'Order deleted successfully' };
    }

    const order = await this.orderRepo.findOne({ where: [{ id }, { order_number: id }] });
    if (!order) throw new NotFoundError(`Order not found: ${id}`);
    await this.orderRepo.remove(order);
    return { success: true, message: 'Order deleted successfully' };
  }
}
