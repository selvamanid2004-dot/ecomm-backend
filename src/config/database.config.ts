import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from './environment.config';
import { logger } from '../logging/logger';
import {
  User,
  Customer,
  CustomerAddress,
  Category,
  Product,
  ProductImage,
  ProductVariant,
  PriceHistory,
  InventoryAdjustment,
  Wishlist,
  WishlistItem,
  Cart,
  CartItem,
  Order,
  OrderItem,
  OrderStatusHistory,
  Payment,
  Coupon,
  CouponUsage,
  Review,
  AuditLog,
} from '../entities';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  synchronize: env.DB_SYNCHRONIZE, // Use migrations for production
  logging: env.DB_LOGGING,
  entities: [
    User,
    Customer,
    CustomerAddress,
    Category,
    Product,
    ProductImage,
    ProductVariant,
    PriceHistory,
    InventoryAdjustment,
    Wishlist,
    WishlistItem,
    Cart,
    CartItem,
    Order,
    OrderItem,
    OrderStatusHistory,
    Payment,
    Coupon,
    CouponUsage,
    Review,
    AuditLog,
  ],
  migrations: ['dist/database/migrations/*.js'],
  subscribers: [],
  extra: {
    connectionLimit: 15,
    waitForConnections: true,
    queueLimit: 0,
  },
});

export async function initializeDatabase(): Promise<boolean> {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info('MySQL Database connection established successfully', {
        host: env.DB_HOST,
        port: env.DB_PORT,
        database: env.DB_NAME,
      });
    }
    return true;
  } catch (error: any) {
    logger.error('Failed to connect to MySQL database:', {
      error: error.message,
      host: env.DB_HOST,
      port: env.DB_PORT,
      database: env.DB_NAME,
    });
    return false;
  }
}
