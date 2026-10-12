import { Router } from 'express';
import { authenticateJwt, requireRoles } from '../middleware/auth.middleware';
import { validateRequest } from '../validators/validate';
import { createProductSchema, updateProductSchema } from '../validators/product.validator';
import { updatePriceSchema, adjustStockSchema } from '../validators/pricing.validator';
import { updateOrderStatusSchema } from '../validators/order.validator';

import { AdminDashboardController } from '../controllers/admin/admin-dashboard.controller';
import { AdminProductController } from '../controllers/admin/admin-product.controller';
import { AdminPriceController } from '../controllers/admin/admin-price.controller';
import { AdminInventoryController } from '../controllers/admin/admin-inventory.controller';
import { AdminOrderController } from '../controllers/admin/admin-order.controller';
import { AdminCustomerController } from '../controllers/admin/admin-customer.controller';
import { ContentController } from '../controllers/content.controller';
import { AdminUploadController, uploadMiddleware } from '../controllers/admin/admin-upload.controller';

const router = Router();

// Protect entire admin routing hierarchy
router.use(authenticateJwt);
router.use(requireRoles('admin', 'manager'));

const dashboardCtrl = new AdminDashboardController();
const productCtrl = new AdminProductController();
const priceCtrl = new AdminPriceController();
const inventoryCtrl = new AdminInventoryController();
const orderCtrl = new AdminOrderController();
const customerCtrl = new AdminCustomerController();
const contentCtrl = new ContentController();
const uploadCtrl = new AdminUploadController();

// Image Upload (File / Base64)
router.post('/upload', uploadMiddleware, uploadCtrl.uploadImage);

// 1. Dashboard
router.get('/dashboard/metrics', dashboardCtrl.getMetrics);

// 2. Product Management
router.get('/products', productCtrl.getAllProducts);
router.post('/products', validateRequest({ body: createProductSchema }), productCtrl.createProduct);
router.put('/products/:id', validateRequest({ body: updateProductSchema }), productCtrl.updateProduct);
router.delete('/products/:id', productCtrl.deleteProduct);
router.post('/products/:id/toggle-status', productCtrl.toggleStatus);

// 3. Dynamic Price Management & Audit Trail
router.post(
  '/products/:productId/pricing',
  validateRequest({ body: updatePriceSchema }),
  priceCtrl.updatePrice
);
router.get('/products/:productId/price-history', priceCtrl.getPriceHistory);

// 4. Inventory Management & Stock Adjustments
router.post(
  '/products/:productId/inventory',
  validateRequest({ body: adjustStockSchema }),
  inventoryCtrl.adjustStock
);
router.get('/products/:productId/inventory-history', inventoryCtrl.getStockHistory);
router.get('/inventory/low-stock', inventoryCtrl.getLowStockAlerts);

// 5. Order Management
router.get('/orders', orderCtrl.getAllOrders);
router.get('/orders/:id', orderCtrl.getOrderById);
router.put('/orders/:id/status', validateRequest({ body: updateOrderStatusSchema }), orderCtrl.updateStatus);
router.delete('/orders/:id', orderCtrl.deleteOrder);

// 6. Customer Management
router.get('/customers', customerCtrl.getAllCustomers);
router.get('/customers/:id', customerCtrl.getCustomerById);
router.delete('/customers/:id', customerCtrl.deleteCustomer);

// 7. Storefront Dynamic Content (CMS)
router.get('/content/storefront', contentCtrl.getStorefrontContent);
router.put('/content/storefront', contentCtrl.updateStorefrontContent);

export default router;
