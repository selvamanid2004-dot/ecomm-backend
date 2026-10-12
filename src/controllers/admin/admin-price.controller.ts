import { Request, Response, NextFunction } from 'express';
import { PricingService } from '../../services/pricing.service';

export class AdminPriceController {
  private pricingService = new PricingService();

  updatePrice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { base_price, compare_at_price, reason } = req.body;
      const result = await this.pricingService.updateProductPrice(
        req.params.productId,
        base_price,
        compare_at_price,
        reason,
        req.user?.userId
      );

      res.status(200).json({
        success: true,
        message: 'Product price updated successfully and audit logged',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getPriceHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const history = await this.pricingService.getPriceHistory(req.params.productId);
      res.status(200).json({
        success: true,
        message: 'Price history retrieved successfully',
        data: history,
      });
    } catch (error) {
      next(error);
    }
  };
}
