import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Customer } from './Customer';
import { WishlistItem } from './WishlistItem';

@Entity('wishlists')
export class Wishlist {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 36, nullable: true, unique: true })
  customer_id?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  session_id?: string | null;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;

  @OneToOne(() => Customer, (customer) => customer.wishlist, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer | null;

  @OneToMany(() => WishlistItem, (item) => item.wishlist, { cascade: true })
  items!: WishlistItem[];
}
