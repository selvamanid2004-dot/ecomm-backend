import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../../services/product.service';

export class AdminProductController {
  private productService = new ProductService();

  getAllProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.productService.getProducts({ ...req.query, include_inactive: true } as any);
      res.status(200).json({
        success: true,
        message: 'Products retrieved successfully',
        data: result.products,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  };

  createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const product = await this.productService.createProduct(req.body);
      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  };

  updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const product = await this.productService.updateProduct(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.productService.deleteProduct(req.params.id);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };

  toggleStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.productService.toggleProductStatus(req.params.id);
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      next(error);
    }
  };
}
