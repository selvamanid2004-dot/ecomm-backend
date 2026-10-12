import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../config/database.config';
import { Product } from '../entities/Product';
import { PriceHistory } from '../entities/PriceHistory';
import { AuditLog } from '../entities/AuditLog';
import { NotFoundError } from '../errors/app-error';
import { mockStore } from '../database/mock-store';

export class PricingService {
  private get productRepo() { return AppDataSource.getRepository(Product); }
  private get priceHistoryRepo() { return AppDataSource.getRepository(PriceHistory); }
  private get auditLogRepo() { return AppDataSource.getRepository(AuditLog); }

  async updateProductPrice(
    productId: string,
    newPrice: number,
    compareAtPrice: number | null | undefined,
    reason: string,
    changedByUserId?: string
  ) {
    if (!AppDataSource.isInitialized) {
      const p = mockStore.products.find((prod) => prod.id === productId);
      if (!p) throw new NotFoundError(`Product not found: ${productId}`);

      const oldPrice = p.base_price;
      p.base_price = Number(newPrice);
      if (compareAtPrice !== undefined) p.compare_at_price = compareAtPrice as any;

      const history = {
        id: `ph-${Date.now().toString().slice(-4)}`,
        product_id: productId,
        productName: p.name,
        old_price: oldPrice,
        new_price: Number(newPrice),
        reason,
        created_at: new Date(),
      };
      mockStore.priceHistory.unshift(history);

      return { product: p, priceHistory: history };
    }

    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundError(`Product not found: ${productId}`);

    const oldPrice = Number(product.base_price);
    const updatedPrice = Number(newPrice);

    const history = this.priceHistoryRepo.create({
      id: uuidv4(),
      product_id: productId,
      old_price: oldPrice,
      new_price: updatedPrice,
      changed_by_user_id: changedByUserId || null,
      reason,
    });
    await this.priceHistoryRepo.save(history);

    product.base_price = updatedPrice;
    if (compareAtPrice !== undefined) product.compare_at_price = compareAtPrice;
    await this.productRepo.save(product);

    return { product, priceHistory: history };
  }

  async getPriceHistory(productId: string) {
    if (!AppDataSource.isInitialized) {
      return mockStore.priceHistory.filter((h) => h.product_id === productId) as any[];
    }

    return this.priceHistoryRepo.find({
      where: { product_id: productId },
      order: { created_at: 'DESC' },
    });
  }

  calculateLineItem(unitPrice: number, quantity: number) {
    const price = Number(unitPrice);
    const qty = Number(quantity);
    return Math.round(price * qty * 100) / 100;
  }
}
