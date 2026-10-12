import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../config/database.config';
import { Category } from '../entities/Category';
import { NotFoundError, ConflictError } from '../errors/app-error';
import { mockStore } from '../database/mock-store';

export class CategoryService {
  private get categoryRepo() { return AppDataSource.getRepository(Category); }

  async getAllCategories() {
    if (!AppDataSource.isInitialized) {
      return mockStore.categories.filter((c) => c.is_active) as any[];
    }

    const categories = await this.categoryRepo
      .createQueryBuilder('category')
      .loadRelationCountAndMap('category.productCount', 'category.products', 'p', (qb) =>
        qb.where('p.is_active = :active', { active: true })
      )
      .where('category.is_active = :active', { active: true })
      .orderBy('category.display_order', 'ASC')
      .getMany();

    return categories;
  }

  async getCategoryBySlug(slug: string) {
    if (!AppDataSource.isInitialized) {
      const cat = mockStore.categories.find((c) => c.slug === slug);
      if (!cat) throw new NotFoundError(`Category not found: ${slug}`);
      return cat as any;
    }

    const category = await this.categoryRepo.findOne({
      where: { slug, is_active: true },
      relations: ['children'],
    });

    if (!category) {
      throw new NotFoundError(`Category not found: ${slug}`);
    }

    return category;
  }

  async createCategory(data: any) {
    if (!AppDataSource.isInitialized) {
      const cat = { id: `cat-${Date.now().toString().slice(-4)}`, ...data, is_active: true };
      mockStore.categories.push(cat);
      return cat;
    }

    const slug = data.name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
    const existing = await this.categoryRepo.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictError('A category with this name or slug already exists');
    }

    const category = this.categoryRepo.create({
      id: uuidv4(),
      name: data.name,
      slug,
      description: data.description,
      image_url: data.image_url,
      parent_id: data.parent_id || null,
      display_order: data.display_order ?? 0,
      is_active: true,
    });

    return this.categoryRepo.save(category);
  }

  async updateCategory(id: string, data: any) {
    if (!AppDataSource.isInitialized) {
      const cat = mockStore.categories.find((c) => c.id === id);
      if (cat) Object.assign(cat, data);
      return cat as any;
    }

    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundError('Category not found');
    Object.assign(category, data);
    return this.categoryRepo.save(category);
  }

  async deleteCategory(id: string) {
    if (!AppDataSource.isInitialized) {
      const cat = mockStore.categories.find((c) => c.id === id);
      if (cat) cat.is_active = false;
      return { success: true, message: 'Category removed' };
    }

    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundError('Category not found');
    category.is_active = false;
    await this.categoryRepo.save(category);
    return { success: true, message: 'Category removed' };
  }
}
