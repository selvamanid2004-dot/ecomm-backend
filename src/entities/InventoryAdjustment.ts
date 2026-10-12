import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './Product';

export type InventoryAdjustmentType = 'restock' | 'sale' | 'adjustment' | 'return';

@Entity('inventory_adjustments')
export class InventoryAdjustment {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  product_id!: string;

  @Column({ type: 'int' })
  change_quantity!: number;

  @Column({ type: 'int' })
  new_quantity!: number;

  @Column({ type: 'enum', enum: ['restock', 'sale', 'adjustment', 'return'], default: 'adjustment' })
  type!: InventoryAdjustmentType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  notes?: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  created_by_user_id?: string | null;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @ManyToOne(() => Product, (product) => product.inventory_adjustments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;
}
