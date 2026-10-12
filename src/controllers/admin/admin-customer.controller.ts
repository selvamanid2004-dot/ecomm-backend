import { Request, Response, NextFunction } from 'express';
import { CustomerService } from '../../services/customer.service';

export class AdminCustomerController {
  private customerService = new CustomerService();

  getAllCustomers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.customerService.getAllCustomers(req.query as any);
      res.status(200).json({
        success: true,
        message: 'Customers retrieved successfully',
        data: result.customers,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  };

  getCustomerById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customer = await this.customerService.getCustomerById(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Customer profile retrieved successfully',
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.customerService.deleteCustomer(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
