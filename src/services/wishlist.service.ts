import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../config/database.config';
import { Wishlist } from '../entities/Wishlist';
import { WishlistItem } from '../entities/WishlistItem';
import { Product } from '../entities/Product';
import { NotFoundError } from '../errors/app-error';
import { mockStore } from '../database/mock-store';

export class WishlistService {
  private get wishlistRepo() { return AppDataSource.getRepository(Wishlist); }
  private get itemRepo() { return AppDataSource.getRepository(WishlistItem); }
  private get productRepo() { return AppDataSource.getRepository(Product); }

  async getWishlist(customerId?: string | null, sessionId?: string | null) {
    if (!AppDataSource.isInitialized) {
      const key = customerId || sessionId || 'default_session';
      const ids = mockStore.wishlists[key] || [];
      const items = ids
        .map((pid) => {
          const p = mockStore.products.find((prod) => prod.id === pid);
          if (!p) return null;
          return {
            id: `wi-${pid}`,
            productId: p.id,
            name: p.name,
            slug: p.slug,
            sku: p.sku,
            price: p.base_price,
            compareAtPrice: p.compare_at_price,
            isInStock: p.stock_quantity > 0,
            image: p.images?.[0]?.image_url || null,
            categoryName: p.category?.name || null,
            addedAt: new Date().toISOString(),
          };
        })
        .filter(Boolean);

      return {
        wishlistId: key,
        items,
        count: items.length,
      };
    }

    let wishlist: Wishlist | null = null;
    if (customerId) {
      wishlist = await this.wishlistRepo.findOne({
        where: { customer_id: customerId },
        relations: ['items', 'items.product', 'items.product.images', 'items.product.category'],
      });
    } else if (sessionId) {
      wishlist = await this.wishlistRepo.findOne({
        where: { session_id: sessionId },
        relations: ['items', 'items.product', 'items.product.images', 'items.product.category'],
      });
    }

    if (!wishlist) {
      wishlist = this.wishlistRepo.create({
        id: uuidv4(),
        customer_id: customerId || null,
        session_id: sessionId || (!customerId ? uuidv4() : null),
      });
      await this.wishlistRepo.save(wishlist);
      wishlist.items = [];
    }

    const items = (wishlist.items || []).map((item) => ({
      id: item.id,
      productId: item.product_id,
      name: item.product.name,
      slug: item.product.slug,
      sku: item.product.sku,
      price: Number(item.product.base_price),
      compareAtPrice: item.product.compare_at_price ? Number(item.product.compare_at_price) : null,
      isInStock: item.product.stock_quantity > 0,
      image: item.product.images?.[0]?.image_url || null,
      categoryName: item.product.category?.name || null,
      addedAt: item.created_at,
    }));

    return {
      wishlistId: wishlist.id,
      items,
      count: items.length,
    };
  }

  async addItem(productId: string, customerId?: string | null, sessionId?: string | null) {
    if (!AppDataSource.isInitialized) {
      const key = customerId || sessionId || 'default_session';
      if (!mockStore.wishlists[key]) mockStore.wishlists[key] = [];
      if (!mockStore.wishlists[key].includes(productId)) {
        mockStore.wishlists[key].push(productId);
      }
      return this.getWishlist(customerId, sessionId);
    }

    const product = await this.productRepo.findOne({ where: { id: productId, is_active: true } });
    if (!product) throw new NotFoundError('Product not found');

    const wishlistSummary = await this.getWishlist(customerId, sessionId);
    const existing = await this.itemRepo.findOne({
      where: { wishlist_id: wishlistSummary.wishlistId, product_id: productId },
    });

    if (!existing) {
      const item = this.itemRepo.create({
        id: uuidv4(),
        wishlist_id: wishlistSummary.wishlistId,
        product_id: productId,
      });
      await this.itemRepo.save(item);
    }

    return this.getWishlist(customerId, sessionId);
  }

  async removeItem(productId: string, customerId?: string | null, sessionId?: string | null) {
    if (!AppDataSource.isInitialized) {
      const key = customerId || sessionId || 'default_session';
      if (mockStore.wishlists[key]) {
        mockStore.wishlists[key] = mockStore.wishlists[key].filter((id) => id !== productId);
      }
      return this.getWishlist(customerId, sessionId);
    }

    const summary = await this.getWishlist(customerId, sessionId);
    await this.itemRepo.delete({ wishlist_id: summary.wishlistId, product_id: productId });
    return this.getWishlist(customerId, sessionId);
  }
}
