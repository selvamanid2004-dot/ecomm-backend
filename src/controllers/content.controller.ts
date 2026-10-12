import { Request, Response, NextFunction } from 'express';
import { mockStore } from '../database/mock-store';

export class ContentController {
  getStorefrontContent = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({
        success: true,
        data: mockStore.siteContent,
      });
    } catch (error) {
      next(error);
    }
  };

  updateStorefrontContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      mockStore.siteContent = {
        ...mockStore.siteContent,
        ...req.body,
      };

      res.status(200).json({
        success: true,
        message: 'Storefront content updated successfully',
        data: mockStore.siteContent,
      });
    } catch (error) {
      next(error);
    }
  };
}
