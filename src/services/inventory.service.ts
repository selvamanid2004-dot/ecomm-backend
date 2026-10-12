import { v4 as uuidv4 } from 'uuid';
import { EntityManager } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Product } from '../entities/Product';
import { InventoryAdjustment, InventoryAdjustmentType } from '../entities/InventoryAdjustment';
import { NotFoundError, BadRequestError } from '../errors/app-error';
import { mockStore } from '../database/mock-store';

export class InventoryService {
  private get productRepo() { return AppDataSource.getRepository(Product); }
  private get adjRepo() { return AppDataSource.getRepository(InventoryAdjustment); }

  async adjustStock(
    productId: string,
    changeQuantity: number,
    type: InventoryAdjustmentType = 'adjustment',
    notes?: string,
    userId?: string
  ) {
    if (!AppDataSource.isInitialized) {
      const p = mockStore.products.find((prod) => prod.id === productId);
      if (!p) throw new NotFoundError(`Product not found: ${productId}`);

      const newQty = p.stock_quantity + changeQuantity;
      if (newQty < 0) throw new BadRequestError('Cannot reduce stock below zero');

      p.stock_quantity = newQty;
      p.is_in_stock = newQty > 0;

      const adj = {
        id: `adj-${Date.now().toString().slice(-4)}`,
        product_id: productId,
        change_quantity: changeQuantity,
        new_quantity: newQty,
        type,
        notes,
        created_at: new Date(),
      };
      mockStore.inventoryAdjustments.unshift(adj);

      return { product: p, adjustment: adj };
    }

    return AppDataSource.transaction(async (manager: EntityManager) => {
      const product = await manager.findOne(Product, {
        where: { id: productId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!product) {
        throw new NotFoundError(`Product not found: ${productId}`);
      }

      const newQty = product.stock_quantity + changeQuantity;
      if (newQty < 0) {
        throw new BadRequestError(`Cannot reduce stock below 0. Current stock is ${product.stock_quantity}`);
      }

      product.stock_quantity = newQty;
      product.is_in_stock = newQty > 0;
      await manager.save(product);

      const adj = manager.create(InventoryAdjustment, {
        id: uuidv4(),
        product_id: productId,
        change_quantity: changeQuantity,
        new_quantity: newQty,
        type,
        notes,
        created_by_user_id: userId || null,
      });
      await manager.save(adj);

      return { product, adjustment: adj };
    });
  }

  async getLowStockProducts() {
    if (!AppDataSource.isInitialized) {
      return mockStore.products.filter((p) => p.is_active && p.stock_quantity <= p.low_stock_threshold) as any[];
    }

    return this.productRepo
      .createQueryBuilder('p')
      .where('p.stock_quantity <= p.low_stock_threshold')
      .andWhere('p.is_active = :active', { active: true })
      .orderBy('p.stock_quantity', 'ASC')
      .getMany();
  }

  async getStockHistory(productId: string) {
    if (!AppDataSource.isInitialized) {
      return mockStore.inventoryAdjustments.filter((a) => a.product_id === productId) as any[];
    }

    return this.adjRepo.find({
      where: { product_id: productId },
      order: { created_at: 'DESC' },
    });
  }
}
