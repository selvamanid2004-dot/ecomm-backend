import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../config/database.config';
import { Product } from '../entities/Product';
import { ProductImage } from '../entities/ProductImage';
import { ProductVariant } from '../entities/ProductVariant';
import { Category } from '../entities/Category';
import { NotFoundError, ConflictError } from '../errors/app-error';
import { mockStore, saveProductsToDisk, loadProductsToDisk } from '../database/mock-store';

export class ProductService {
  private get productRepo() { return AppDataSource.getRepository(Product); }
  private get imageRepo() { return AppDataSource.getRepository(ProductImage); }
  private get variantRepo() { return AppDataSource.getRepository(ProductVariant); }
  private get categoryRepo() { return AppDataSource.getRepository(Category); }

  async getProducts(params: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    min_price?: number;
    max_price?: number;
    sort?: string;
    in_stock?: string;
    include_inactive?: boolean;
    all?: string;
  }) {
    if (!AppDataSource.isInitialized) {
      loadProductsToDisk();
      let list = [...mockStore.products];

      if (params.include_inactive !== true && params.all !== 'true') {
        list = list.filter((p) => p.is_active);
      }

      if (params.category) {
        list = list.filter((p) => p.category?.slug === params.category || p.category_id === params.category);
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        list = list.filter(
          (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
        );
      }
      if (params.min_price !== undefined) {
        list = list.filter((p) => p.base_price >= params.min_price!);
      }
      if (params.max_price !== undefined) {
        list = list.filter((p) => p.base_price <= params.max_price!);
      }
      if (params.in_stock === 'true') {
        list = list.filter((p) => p.stock_quantity > 0);
      }

      if (params.sort === 'price_asc') {
        list.sort((a, b) => a.base_price - b.base_price);
      } else if (params.sort === 'price_desc') {
        list.sort((a, b) => b.base_price - a.base_price);
      } else if (params.sort === 'featured') {
        list.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
      }

      const isAll = params.all === 'true' || params.all === (true as any);
      if (isAll) {
        return {
          products: list as any[],
          meta: { page: 1, limit: list.length, total: list.length, totalPages: 1 },
        };
      }

      const page = Number(params.page) || 1;
      const limit = Number(params.limit) || 12;
      const total = list.length;
      const paginated = list.slice((page - 1) * limit, page * limit);

      return {
        products: paginated as any[],
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    }

    const isAll = params.all === 'true' || params.all === (true as any);
    const page = isAll ? 1 : (Number(params.page) || 1);
    const limit = isAll ? 10000 : (Number(params.limit) || 12);
    const skip = (page - 1) * limit;

    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.images', 'image')
      .where('product.is_active = :isActive', { isActive: true });

    if (params.category) {
      qb.andWhere('(category.slug = :catSlug OR category.id = :catId)', {
        catSlug: params.category,
        catId: params.category,
      });
    }

    if (params.search) {
      qb.andWhere(
        '(LOWER(product.name) LIKE :search OR LOWER(product.description) LIKE :search OR LOWER(product.sku) LIKE :search)',
        { search: `%${params.search.toLowerCase()}%` }
      );
    }

    if (params.min_price !== undefined) {
      qb.andWhere('product.base_price >= :minPrice', { minPrice: params.min_price });
    }

    if (params.max_price !== undefined) {
      qb.andWhere('product.base_price <= :maxPrice', { maxPrice: params.max_price });
    }

    if (params.in_stock === 'true') {
      qb.andWhere('product.stock_quantity > 0');
    }

    switch (params.sort) {
      case 'price_asc':
        qb.orderBy('product.base_price', 'ASC');
        break;
      case 'price_desc':
        qb.orderBy('product.base_price', 'DESC');
        break;
      case 'featured':
        qb.orderBy('product.is_featured', 'DESC').addOrderBy('product.created_at', 'DESC');
        break;
      default:
        qb.orderBy('product.created_at', 'DESC');
    }

    qb.skip(skip).take(limit);

    const [products, total] = await qb.getManyAndCount();

    products.forEach((p) => {
      p.images?.sort((a, b) => a.display_order - b.display_order);
    });

    return {
      products,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getFeaturedProducts(limit = 6) {
    if (!AppDataSource.isInitialized) {
      return mockStore.products.filter((p) => p.is_active && p.is_featured).slice(0, limit) as any[];
    }

    return this.productRepo.find({
      where: { is_active: true, is_featured: true },
      relations: ['images', 'category'],
      take: limit,
      order: { created_at: 'DESC' },
    });
  }

  async getProductBySlugOrId(identifier: string) {
    if (!AppDataSource.isInitialized) {
      const p = mockStore.products.find((prod) => prod.slug === identifier || prod.id === identifier);
      if (!p) throw new NotFoundError(`Product not found: ${identifier}`);
      return p as any;
    }

    const product = await this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.images', 'image')
      .leftJoinAndSelect('product.variants', 'variant')
      .leftJoinAndSelect('product.reviews', 'review', 'review.is_approved = true')
      .where('product.slug = :identifier OR product.id = :identifier', { identifier })
      .getOne();

    if (!product) {
      throw new NotFoundError(`Product not found with identifier: ${identifier}`);
    }

    product.images?.sort((a, b) => a.display_order - b.display_order);
    return product;
  }

  async getRelatedProducts(categoryId: string, excludeProductId: string, limit = 4) {
    if (!AppDataSource.isInitialized) {
      return mockStore.products
        .filter((p) => p.category_id === categoryId && p.id !== excludeProductId && p.is_active)
        .slice(0, limit) as any[];
    }

    return this.productRepo.find({
      where: { category_id: categoryId, is_active: true },
      relations: ['images', 'category'],
      take: limit,
      order: { created_at: 'DESC' },
    });
  }

  async createProduct(data: any) {
    const sku = (data.sku && data.sku.trim()) || `SKU-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
    const basePrice = Number(data.base_price !== undefined ? data.base_price : data.price);
    const stockQuantity = data.stock_quantity !== undefined ? Number(data.stock_quantity) : 50;

    let imageUrls: string[] = [];
    if (Array.isArray(data.image_urls) && data.image_urls.length > 0) {
      imageUrls = data.image_urls.filter(Boolean);
    } else if (data.image_url) {
      imageUrls = [data.image_url];
    }

    if (!AppDataSource.isInitialized) {
      loadProductsToDisk();
      const id = `prod-${Date.now().toString().slice(-4)}`;
      const newP: any = {
        id,
        name: data.name,
        slug: this.generateSlug(data.name),
        sku,
        description: data.description,
        short_description: data.short_description || data.description.slice(0, 100),
        category_id: data.category_id || null,
        base_price: basePrice,
        compare_at_price: data.compare_at_price ? Number(data.compare_at_price) : null,
        stock_quantity: stockQuantity,
        low_stock_threshold: 5,
        is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
        is_featured: Boolean(data.is_featured),
        is_in_stock: stockQuantity > 0,
        created_at: new Date(),
        images: imageUrls.map((u: string, idx: number) => ({
          id: `img-${idx}`,
          product_id: id,
          image_url: u,
          is_primary: idx === 0,
          display_order: idx + 1,
        })),
        variants: [],
        reviews: [],
      };
      if (newP.images.length === 0) {
        newP.images.push({
          id: `img-0`,
          product_id: id,
          image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80',
          is_primary: true,
          display_order: 1,
        });
      }
      mockStore.products.unshift(newP);
      saveProductsToDisk();
      return newP;
    }

    const existingSku = await this.productRepo.findOne({ where: { sku } });
    if (existingSku) {
      throw new ConflictError(`Product with SKU '${sku}' already exists`);
    }

    const slug = this.generateSlug(data.name);
    const existingSlug = await this.productRepo.findOne({ where: { slug } });
    const finalSlug = existingSlug ? `${slug}-${Date.now().toString().slice(-4)}` : slug;

    const productId = uuidv4();
    const product = this.productRepo.create({
      id: productId,
      name: data.name,
      slug: finalSlug,
      sku,
      description: data.description,
      short_description: data.short_description,
      category_id: data.category_id || null,
      base_price: basePrice,
      compare_at_price: data.compare_at_price || null,
      cost_price: data.cost_price || null,
      stock_quantity: stockQuantity,
      low_stock_threshold: data.low_stock_threshold ?? 5,
      is_active: data.is_active ?? true,
      is_featured: data.is_featured ?? false,
      is_in_stock: stockQuantity > 0,
      meta_title: data.meta_title,
      meta_description: data.meta_description,
    });

    await this.productRepo.save(product);

    if (imageUrls.length > 0) {
      const images = imageUrls.map((url: string, index: number) =>
        this.imageRepo.create({
          id: uuidv4(),
          product_id: productId,
          image_url: url,
          is_primary: index === 0,
          display_order: index + 1,
        })
      );
      await this.imageRepo.save(images);
    }

    return this.getProductBySlugOrId(productId);
  }

  async updateProduct(id: string, data: any) {
    let imageUrls: string[] = [];
    if (Array.isArray(data.image_urls) && data.image_urls.length > 0) {
      imageUrls = data.image_urls.filter(Boolean);
    } else if (data.image_url) {
      imageUrls = [data.image_url];
    }

    if (!AppDataSource.isInitialized) {
      loadProductsToDisk();
      const p = mockStore.products.find((prod) => prod.id === id);
      if (!p) throw new NotFoundError(`Product not found: ${id}`);
      Object.assign(p, data);
      if (data.price !== undefined && data.base_price === undefined) {
        p.base_price = Number(data.price);
      }
      if (imageUrls.length > 0) {
        p.images = imageUrls.map((u: string, idx: number) => ({
          id: `img-${idx}`,
          product_id: p.id,
          image_url: u,
          is_primary: idx === 0,
          display_order: idx + 1,
        }));
      }
      if (data.is_active !== undefined) p.is_active = Boolean(data.is_active);
      if (data.stock_quantity !== undefined) {
        p.stock_quantity = Number(data.stock_quantity);
        p.is_in_stock = p.stock_quantity > 0;
      }
      saveProductsToDisk();
      return p as any;
    }

    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundError(`Product not found: ${id}`);
    }

    if (data.name && data.name !== product.name) {
      product.name = data.name;
      product.slug = this.generateSlug(data.name);
    }

    if (data.price !== undefined && data.base_price === undefined) {
      data.base_price = Number(data.price);
    }

    Object.assign(product, data);
    await this.productRepo.save(product);

    if (imageUrls.length > 0) {
      await this.imageRepo.delete({ product_id: id });
      const images = imageUrls.map((url: string, index: number) =>
        this.imageRepo.create({
          id: uuidv4(),
          product_id: id,
          image_url: url,
          is_primary: index === 0,
          display_order: index + 1,
        })
      );
      await this.imageRepo.save(images);
    }

    return this.getProductBySlugOrId(id);
  }

  async deleteProduct(id: string) {
    if (!AppDataSource.isInitialized) {
      loadProductsToDisk();
      const initialLen = mockStore.products.length;
      mockStore.products = mockStore.products.filter((prod) => prod.id !== id && prod.slug !== id);
      if (mockStore.products.length === initialLen) {
        throw new NotFoundError(`Product not found: ${id}`);
      }
      saveProductsToDisk();
      return { success: true, message: 'Product deleted successfully' };
    }

    const product = await this.productRepo.findOne({ where: [{ id }, { slug: id }] });
    if (!product) throw new NotFoundError(`Product not found: ${id}`);
    await this.productRepo.remove(product);
    return { success: true, message: 'Product deleted successfully' };
  }

  async toggleProductStatus(id: string) {
    if (!AppDataSource.isInitialized) {
      loadProductsToDisk();
      const p = mockStore.products.find((prod) => prod.id === id);
      if (!p) throw new NotFoundError(`Product not found: ${id}`);
      p.is_active = !p.is_active;
      saveProductsToDisk();
      return { success: true, message: `Product ${p.is_active ? 'activated' : 'deactivated'}`, data: p };
    }

    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundError(`Product not found: ${id}`);
    product.is_active = !product.is_active;
    await this.productRepo.save(product);
    return { success: true, message: `Product ${product.is_active ? 'activated' : 'deactivated'}`, data: product };
  }

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
