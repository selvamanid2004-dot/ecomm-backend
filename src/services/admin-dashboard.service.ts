import { AppDataSource } from '../config/database.config';
import { Order } from '../entities/Order';
import { Product } from '../entities/Product';
import { Customer } from '../entities/Customer';
import { PriceHistory } from '../entities/PriceHistory';
import { mockStore } from '../database/mock-store';

export class AdminDashboardService {
  private get orderRepo() { return AppDataSource.getRepository(Order); }
  private get productRepo() { return AppDataSource.getRepository(Product); }
  private get customerRepo() { return AppDataSource.getRepository(Customer); }
  private get priceHistoryRepo() { return AppDataSource.getRepository(PriceHistory); }

  async getDashboardMetrics() {
    if (!AppDataSource.isInitialized) {
      const totalRevenue = mockStore.orders
        .filter((o) => o.payment_status === 'paid')
        .reduce((sum, o) => sum + Number(o.total_amount), 0);

      const totalOrders = mockStore.orders.length;
      const pendingOrders = mockStore.orders.filter((o) => o.status === 'pending').length;
      const totalProducts = mockStore.products.filter((p) => p.is_active).length;
      const lowStockProducts = mockStore.products.filter(
        (p) => p.is_active && p.stock_quantity <= p.low_stock_threshold
      ).length;
      const totalCustomers = mockStore.users.filter((u) => u.role === 'customer').length;

      return {
        overview: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalOrders,
          pendingOrders,
          totalProducts,
          lowStockProducts,
          totalCustomers,
        },
        recentOrders: mockStore.orders.slice(0, 6).map((o) => ({
          id: o.id,
          orderNumber: o.order_number,
          customerName: o.shipping_address_json?.recipient_name || o.guest_email || 'Collector',
          totalAmount: Number(o.total_amount),
          status: o.status,
          paymentStatus: o.payment_status,
          itemCount: o.items?.length || 0,
          createdAt: o.created_at,
        })),
        recentPriceChanges: mockStore.priceHistory.slice(0, 5).map((p) => ({
          id: p.id,
          productName: p.productName || 'Creation',
          oldPrice: p.old_price,
          newPrice: p.new_price,
          reason: p.reason,
          createdAt: p.created_at,
        })),
      };
    }

    const revenueResult = await this.orderRepo
      .createQueryBuilder('o')
      .select('SUM(o.total_amount)', 'totalRevenue')
      .addSelect('COUNT(o.id)', 'totalOrders')
      .where('o.payment_status = :status', { status: 'paid' })
      .getRawOne();

    const totalRevenue = Number(revenueResult?.totalRevenue || 0);
    const totalOrders = Number(revenueResult?.totalOrders || 0);
    const pendingOrders = await this.orderRepo.count({ where: { status: 'pending' } });
    const totalProducts = await this.productRepo.count({ where: { is_active: true } });
    const lowStockProducts = await this.productRepo
      .createQueryBuilder('p')
      .where('p.stock_quantity <= p.low_stock_threshold')
      .andWhere('p.is_active = :active', { active: true })
      .getCount();

    const totalCustomers = await this.customerRepo.count();

    const recentOrders = await this.orderRepo.find({
      relations: ['customer', 'customer.user', 'items'],
      order: { created_at: 'DESC' },
      take: 6,
    });

    const recentPriceChanges = await this.priceHistoryRepo.find({
      relations: ['product'],
      order: { created_at: 'DESC' },
      take: 5,
    });

    return {
      overview: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        pendingOrders,
        totalProducts,
        lowStockProducts,
        totalCustomers,
      },
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.order_number,
        customerName: o.customer?.user
          ? `${o.customer.user.first_name} ${o.customer.user.last_name}`
          : o.guest_email || 'Guest',
        totalAmount: Number(o.total_amount),
        status: o.status,
        paymentStatus: o.payment_status,
        itemCount: o.items?.length || 0,
        createdAt: o.created_at,
      })),
      recentPriceChanges: recentPriceChanges.map((p) => ({
        id: p.id,
        productName: p.product?.name,
        oldPrice: Number(p.old_price),
        newPrice: Number(p.new_price),
        reason: p.reason,
        createdAt: p.created_at,
      })),
    };
  }
}
