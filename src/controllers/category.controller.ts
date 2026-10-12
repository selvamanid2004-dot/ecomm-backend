import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service';

export class CategoryController {
  private categoryService = new CategoryService();

  getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await this.categoryService.getAllCategories();
      res.status(200).json({
        success: true,
        message: 'Categories retrieved successfully',
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  };

  getBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await this.categoryService.getCategoryBySlug(req.params.slug);
      res.status(200).json({
        success: true,
        message: 'Category retrieved successfully',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  };
}
