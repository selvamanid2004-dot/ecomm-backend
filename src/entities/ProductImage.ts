import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './Product';

@Entity('product_images')
export class ProductImage {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  product_id!: string;

  @Column({ type: 'varchar', length: 500 })
  image_url!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  alt_text?: string | null;

  @Column({ type: 'boolean', default: false })
  is_primary!: boolean;

  @Column({ type: 'int', default: 0 })
  display_order!: number;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @ManyToOne(() => Product, (product) => product.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;
}
