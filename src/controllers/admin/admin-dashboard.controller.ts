import { Request, Response, NextFunction } from 'express';
import { AdminDashboardService } from '../../services/admin-dashboard.service';

export class AdminDashboardController {
  private dashboardService = new AdminDashboardService();

  getMetrics = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.dashboardService.getDashboardMetrics();
      res.status(200).json({
        success: true,
        message: 'Admin metrics retrieved successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  };
}
