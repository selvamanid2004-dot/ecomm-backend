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
import { User } from './User';
import { CustomerAddress } from './CustomerAddress';
import { Order } from './Order';
import { Wishlist } from './Wishlist';
import { Cart } from './Cart';

@Entity('customers')
export class Customer {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 36, unique: true })
  user_id!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone?: string | null;

  @Column({ type: 'int', default: 0 })
  loyalty_points!: number;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;

  @OneToOne(() => User, (user) => user.customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @OneToMany(() => CustomerAddress, (address) => address.customer)
  addresses!: CustomerAddress[];

  @OneToMany(() => Order, (order) => order.customer)
  orders!: Order[];

  @OneToOne(() => Wishlist, (wishlist) => wishlist.customer)
  wishlist?: Wishlist;

  @OneToOne(() => Cart, (cart) => cart.customer)
  cart?: Cart;
}
