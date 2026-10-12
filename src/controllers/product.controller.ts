import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';

export class ProductController {
  private productService = new ProductService();

  getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.productService.getProducts(req.query as any);
      res.setHeader('Cache-Control', 'public, max-age=15, stale-while-revalidate=60');
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

  getFeatured = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const products = await this.productService.getFeaturedProducts();
      res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
      res.status(200).json({
        success: true,
        message: 'Featured products retrieved successfully',
        data: products,
      });
    } catch (error) {
      next(error);
    }
  };

  getProductByIdentifier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const product = await this.productService.getProductBySlugOrId(req.params.identifier);
      res.status(200).json({
        success: true,
        message: 'Product retrieved successfully',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  };

  getRelated = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { categoryId, excludeId } = req.query as { categoryId: string; excludeId: string };
      const related = await this.productService.getRelatedProducts(categoryId, excludeId);
      res.status(200).json({
        success: true,
        message: 'Related products retrieved successfully',
        data: related,
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
}
