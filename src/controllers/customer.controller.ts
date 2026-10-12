import { Request, Response, NextFunction } from 'express';
import { CustomerService } from '../services/customer.service';
import { BadRequestError } from '../errors/app-error';

export class CustomerController {
  private customerService = new CustomerService();

  private getRequiredCustomerId(req: Request): string {
    const customerId = req.user?.customerId;
    if (!customerId) {
      throw new BadRequestError('Customer profile not found for this account');
    }
    return customerId;
  }

  getAddresses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = this.getRequiredCustomerId(req);
      const addresses = await this.customerService.getAddresses(customerId);
      res.status(200).json({
        success: true,
        message: 'Addresses retrieved successfully',
        data: addresses,
      });
    } catch (error) {
      next(error);
    }
  };

  addAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = this.getRequiredCustomerId(req);
      const address = await this.customerService.addAddress(customerId, req.body);
      res.status(201).json({
        success: true,
        message: 'Address added successfully',
        data: address,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = this.getRequiredCustomerId(req);
      await this.customerService.deleteAddress(customerId, req.params.addressId);
      res.status(200).json({
        success: true,
        message: 'Address removed successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
