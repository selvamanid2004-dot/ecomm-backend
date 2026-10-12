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
import { CartItem } from './CartItem';

@Entity('carts')
export class Cart {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 36, nullable: true, unique: true })
  customer_id?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  session_id?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  coupon_code?: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.0 })
  discount_amount!: number;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;

  @OneToOne(() => Customer, (customer) => customer.cart, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer | null;

  @OneToMany(() => CartItem, (item) => item.cart, { cascade: true })
  items!: CartItem[];
}
