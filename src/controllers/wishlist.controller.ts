import { Request, Response, NextFunction } from 'express';
import { WishlistService } from '../services/wishlist.service';

export class WishlistController {
  private wishlistService = new WishlistService();

  getWishlist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = req.user?.customerId || null;
      const sessionId = (req.query.session_id as string) || (req.headers['x-session-id'] as string) || null;

      const wishlist = await this.wishlistService.getWishlist(customerId, sessionId);
      res.status(200).json({
        success: true,
        message: 'Wishlist retrieved successfully',
        data: wishlist,
      });
    } catch (error) {
      next(error);
    }
  };

  addItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = req.user?.customerId || null;
      const sessionId = req.body.session_id || (req.headers['x-session-id'] as string) || null;

      const result = await this.wishlistService.addItem(req.body.product_id, customerId, sessionId);
      res.status(200).json({
        success: true,
        message: 'Product added to wishlist',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  removeItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = req.user?.customerId || null;
      const sessionId = (req.query.session_id as string) || (req.headers['x-session-id'] as string) || null;

      const result = await this.wishlistService.removeItem(req.params.productId, customerId, sessionId);
      res.status(200).json({
        success: true,
        message: 'Product removed from wishlist',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
