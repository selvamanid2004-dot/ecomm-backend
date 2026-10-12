import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './Order';

@Entity('order_status_history')
export class OrderStatusHistory {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  order_id!: string;

  @Column({ type: 'varchar', length: 50 })
  previous_status!: string;

  @Column({ type: 'varchar', length: 50 })
  new_status!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  comments?: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  changed_by_user_id?: string | null;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @ManyToOne(() => Order, (order) => order.status_history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;
}
