import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../config/database.config';
import { Cart } from '../entities/Cart';
import { CartItem } from '../entities/CartItem';
import { Product } from '../entities/Product';
import { ProductVariant } from '../entities/ProductVariant';
import { CouponService } from './coupon.service';
import { NotFoundError, BadRequestError } from '../errors/app-error';
import { mockStore } from '../database/mock-store';

export class CartService {
  private get cartRepo() { return AppDataSource.getRepository(Cart); }
  private get itemRepo() { return AppDataSource.getRepository(CartItem); }
  private get productRepo() { return AppDataSource.getRepository(Product); }
  private get variantRepo() { return AppDataSource.getRepository(ProductVariant); }
  private couponService = new CouponService();

  async getOrCreateCart(customerId?: string | null, sessionId?: string | null): Promise<any> {
    if (!AppDataSource.isInitialized) {
      const key = customerId || sessionId || 'default_session';
      if (!mockStore.carts[key]) {
        mockStore.carts[key] = { items: [], couponCode: null, discountAmount: 0 };
      }
      return { id: key, ...mockStore.carts[key] };
    }

    let cart: Cart | null = null;
    if (customerId) {
      cart = await this.cartRepo.findOne({
        where: { customer_id: customerId },
        relations: ['items', 'items.product', 'items.product.images', 'items.variant'],
      });
    } else if (sessionId) {
      cart = await this.cartRepo.findOne({
        where: { session_id: sessionId },
        relations: ['items', 'items.product', 'items.product.images', 'items.variant'],
      });
    }

    if (!cart) {
      cart = this.cartRepo.create({
        id: uuidv4(),
        customer_id: customerId || null,
        session_id: sessionId || (!customerId ? uuidv4() : null),
        discount_amount: 0.0,
      });
      await this.cartRepo.save(cart);
      cart.items = [];
    }

    return cart;
  }

  async getCartSummary(customerId?: string | null, sessionId?: string | null) {
    if (!AppDataSource.isInitialized) {
      const key = customerId || sessionId || 'default_session';
      const c = mockStore.carts[key] || { items: [], couponCode: null, discountAmount: 0 };
      let subtotal = 0;

      const items = c.items.map((it: any) => {
        const lineTotal = Math.round(it.unitPrice * it.quantity * 100) / 100;
        subtotal += lineTotal;
        return { ...it, lineTotal };
      });

      subtotal = Math.round(subtotal * 100) / 100;
      let discountAmount = c.discountAmount || 0;
      if (c.couponCode === 'LUXE10' && subtotal >= 100) {
        discountAmount = Math.round(subtotal * 0.1 * 100) / 100;
      }

      const discountedSubtotal = Math.max(0, subtotal - discountAmount);
      const shippingFee = subtotal === 0 ? 0 : subtotal >= 150 ? 0 : 15.0;
      const taxAmount = Math.round(discountedSubtotal * 0.075 * 100) / 100;
      const totalAmount = Math.round((discountedSubtotal + shippingFee + taxAmount) * 100) / 100;

      return {
        cartId: key,
        sessionId: key,
        couponCode: c.couponCode,
        items,
        itemCount: items.reduce((acc: number, curr: any) => acc + curr.quantity, 0),
        subtotal,
        discountAmount,
        shippingFee,
        taxAmount,
        totalAmount,
      };
    }

    const cart = await this.getOrCreateCart(customerId, sessionId);

    let subtotal = 0;
    const items = (cart.items || []).map((item: any) => {
      const unitPrice = item.variant?.price_override
        ? Number(item.variant.price_override)
        : Number(item.product.base_price);
      const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;
      subtotal += lineTotal;

      return {
        id: item.id,
        productId: item.product_id,
        productName: item.product.name,
        slug: item.product.slug,
        sku: item.variant?.sku || item.product.sku,
        image: item.product.images?.[0]?.image_url || null,
        variantTitle: item.variant?.title || null,
        variantId: item.variant_id,
        quantity: item.quantity,
        stockAvailable: item.variant ? item.variant.stock_quantity : item.product.stock_quantity,
        unitPrice,
        lineTotal,
      };
    });

    subtotal = Math.round(subtotal * 100) / 100;

    let discountAmount = 0;
    if (cart.coupon_code) {
      try {
        const couponResult = await this.couponService.validateCoupon(cart.coupon_code, subtotal);
        discountAmount = couponResult.discountAmount;
      } catch {
        cart.coupon_code = null;
        cart.discount_amount = 0;
        await this.cartRepo.save(cart);
      }
    }

    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const shippingFee = subtotal === 0 ? 0 : subtotal >= 150 ? 0 : 15.0;
    const taxRate = 0.075;
    const taxAmount = Math.round(discountedSubtotal * taxRate * 100) / 100;
    const totalAmount = Math.round((discountedSubtotal + shippingFee + taxAmount) * 100) / 100;

    return {
      cartId: cart.id,
      sessionId: cart.session_id,
      couponCode: cart.coupon_code,
      items,
      itemCount: items.reduce((acc: any, curr: any) => acc + curr.quantity, 0),
      subtotal,
      discountAmount,
      shippingFee,
      taxAmount,
      totalAmount,
    };
  }

  async addItem(data: {
    productId: string;
    variantId?: string | null;
    quantity: number;
    customerId?: string | null;
    sessionId?: string | null;
  }) {
    if (!AppDataSource.isInitialized) {
      const key = data.customerId || data.sessionId || 'default_session';
      if (!mockStore.carts[key]) {
        mockStore.carts[key] = { items: [], couponCode: null, discountAmount: 0 };
      }
      const p = mockStore.products.find((prod) => prod.id === data.productId);
      if (!p) throw new NotFoundError('Product not found');

      const existing = mockStore.carts[key].items.find(
        (it: any) => it.productId === data.productId && it.variantId === (data.variantId || null)
      );
      if (existing) {
        existing.quantity += data.quantity;
      } else {
        mockStore.carts[key].items.push({
          id: `item-${Date.now().toString().slice(-4)}`,
          productId: p.id,
          productName: p.name,
          slug: p.slug,
          sku: p.sku,
          image: p.images?.[0]?.image_url || null,
          variantId: data.variantId || null,
          variantTitle: null,
          quantity: data.quantity,
          stockAvailable: p.stock_quantity,
          unitPrice: p.base_price,
          lineTotal: p.base_price * data.quantity,
        });
      }
      return this.getCartSummary(data.customerId, data.sessionId);
    }

    const cart = await this.getOrCreateCart(data.customerId, data.sessionId);
    const product = await this.productRepo.findOne({ where: { id: data.productId, is_active: true } });
    if (!product) throw new NotFoundError('Product not found or unavailable');

    let availableStock = product.stock_quantity;
    let unitPrice = Number(product.base_price);

    if (data.variantId) {
      const variant = await this.variantRepo.findOne({
        where: { id: data.variantId, product_id: data.productId, is_active: true },
      });
      if (!variant) throw new NotFoundError('Selected variant not found');
      availableStock = variant.stock_quantity;
      if (variant.price_override) unitPrice = Number(variant.price_override);
    }

    let existingItem = await this.itemRepo.findOne({
      where: {
        cart_id: cart.id,
        product_id: data.productId,
        variant_id: data.variantId || (null as any),
      },
    });

    const targetQuantity = existingItem ? existingItem.quantity + data.quantity : data.quantity;
    if (targetQuantity > availableStock) {
      throw new BadRequestError(`Only ${availableStock} items in stock for this product`);
    }

    if (existingItem) {
      existingItem.quantity = targetQuantity;
      existingItem.unit_price = unitPrice;
      await this.itemRepo.save(existingItem);
    } else {
      const newItem = this.itemRepo.create({
        id: uuidv4(),
        cart_id: cart.id,
        product_id: data.productId,
        variant_id: data.variantId || null,
        quantity: data.quantity,
        unit_price: unitPrice,
      });
      await this.itemRepo.save(newItem);
    }

    return this.getCartSummary(data.customerId, data.sessionId);
  }

  async updateItemQuantity(
    itemId: string,
    quantity: number,
    customerId?: string | null,
    sessionId?: string | null
  ) {
    if (!AppDataSource.isInitialized) {
      const key = customerId || sessionId || 'default_session';
      const c = mockStore.carts[key];
      if (c) {
        if (quantity <= 0) {
          c.items = c.items.filter((it: any) => it.id !== itemId);
        } else {
          const item = c.items.find((it: any) => it.id === itemId);
          if (item) item.quantity = quantity;
        }
      }
      return this.getCartSummary(customerId, sessionId);
    }

    const item = await this.itemRepo.findOne({ where: { id: itemId }, relations: ['product', 'variant'] });
    if (!item) throw new NotFoundError('Cart item not found');

    const availableStock = item.variant ? item.variant.stock_quantity : item.product.stock_quantity;
    if (quantity > availableStock) {
      throw new BadRequestError(`Only ${availableStock} items in stock for this product`);
    }

    if (quantity <= 0) {
      await this.itemRepo.remove(item);
    } else {
      item.quantity = quantity;
      await this.itemRepo.save(item);
    }

    return this.getCartSummary(customerId, sessionId);
  }

  async removeItem(itemId: string, customerId?: string | null, sessionId?: string | null) {
    if (!AppDataSource.isInitialized) {
      const key = customerId || sessionId || 'default_session';
      const c = mockStore.carts[key];
      if (c) {
        c.items = c.items.filter((it: any) => it.id !== itemId);
      }
      return this.getCartSummary(customerId, sessionId);
    }

    await this.itemRepo.delete({ id: itemId });
    return this.getCartSummary(customerId, sessionId);
  }

  async applyCoupon(code: string, customerId?: string | null, sessionId?: string | null) {
    if (!AppDataSource.isInitialized) {
      const key = customerId || sessionId || 'default_session';
      if (!mockStore.carts[key]) {
        mockStore.carts[key] = { items: [], couponCode: null, discountAmount: 0 };
      }
      mockStore.carts[key].couponCode = code.toUpperCase();
      return this.getCartSummary(customerId, sessionId);
    }

    const cart = await this.getOrCreateCart(customerId, sessionId);
    const summary = await this.getCartSummary(customerId, sessionId);
    const couponResult = await this.couponService.validateCoupon(code, summary.subtotal);
    cart.coupon_code = couponResult.coupon.code;
    cart.discount_amount = couponResult.discountAmount;
    await this.cartRepo.save(cart);

    return this.getCartSummary(customerId, sessionId);
  }

  async removeCoupon(customerId?: string | null, sessionId?: string | null) {
    if (!AppDataSource.isInitialized) {
      const key = customerId || sessionId || 'default_session';
      if (mockStore.carts[key]) {
        mockStore.carts[key].couponCode = null;
        mockStore.carts[key].discountAmount = 0;
      }
      return this.getCartSummary(customerId, sessionId);
    }

    const cart = await this.getOrCreateCart(customerId, sessionId);
    cart.coupon_code = null;
    cart.discount_amount = 0;
    await this.cartRepo.save(cart);
    return this.getCartSummary(customerId, sessionId);
  }

  async clearCart(cartId: string) {
    if (!AppDataSource.isInitialized) {
      delete mockStore.carts[cartId];
      return;
    }
    await this.itemRepo.delete({ cart_id: cartId });
    await this.cartRepo.update({ id: cartId }, { coupon_code: null, discount_amount: 0 });
  }
}
