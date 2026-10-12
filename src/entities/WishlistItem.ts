import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Wishlist } from './Wishlist';
import { Product } from './Product';

@Entity('wishlist_items')
@Unique(['wishlist_id', 'product_id'])
export class WishlistItem {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  wishlist_id!: string;

  @Column({ type: 'varchar', length: 36 })
  product_id!: string;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @ManyToOne(() => Wishlist, (wishlist) => wishlist.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wishlist_id' })
  wishlist!: Wishlist;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;
}
