import { Request, Response, NextFunction } from 'express';
import { InventoryService } from '../../services/inventory.service';

export class AdminInventoryController {
  private inventoryService = new InventoryService();

  adjustStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { change_quantity, type, notes } = req.body;
      const result = await this.inventoryService.adjustStock(
        req.params.productId,
        change_quantity,
        type,
        notes,
        req.user?.userId
      );

      res.status(200).json({
        success: true,
        message: 'Inventory stock level adjusted successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getLowStockAlerts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const products = await this.inventoryService.getLowStockProducts();
      res.status(200).json({
        success: true,
        message: 'Low stock products retrieved successfully',
        data: products,
      });
    } catch (error) {
      next(error);
    }
  };

  getStockHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const history = await this.inventoryService.getStockHistory(req.params.productId);
      res.status(200).json({
        success: true,
        message: 'Stock adjustment history retrieved successfully',
        data: history,
      });
    } catch (error) {
      next(error);
    }
  };
}
