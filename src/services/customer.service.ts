import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../config/database.config';
import { Customer } from '../entities/Customer';
import { CustomerAddress } from '../entities/CustomerAddress';
import { User } from '../entities/User';
import { NotFoundError } from '../errors/app-error';
import {
  mockStore,
  loadOrdersFromDisk,
  loadUsersToDisk,
  loadCustomersToDisk,
  saveUsersToDisk,
  saveCustomersToDisk,
} from '../database/mock-store';

export class CustomerService {
  private get userRepo() { return AppDataSource.getRepository(User); }
  private get customerRepo() { return AppDataSource.getRepository(Customer); }
  private get addressRepo() { return AppDataSource.getRepository(CustomerAddress); }

  async getAllCustomers(params: { page?: number; limit?: number; search?: string }) {
    if (!AppDataSource.isInitialized) {
      loadOrdersFromDisk();
      loadUsersToDisk();
      loadCustomersToDisk();

      const customers = mockStore.users
        .filter((u) => u.role === 'customer')
        .map((u) => {
          const custRecord = mockStore.customers.find(
            (c) => c.user_id === u.id || c.id === u.id || c.id === `cust-${u.id}`
          );
          const customerId = custRecord ? custRecord.id : `cust-${u.id}`;
          const uEmail = (u.email || '').toLowerCase().trim();

          // Strictly filter orders that belong ONLY to this specific customer
          const custOrders = mockStore.orders.filter((o) => {
            const orderEmail = (o.guest_email || (o.shipping_address_json as any)?.email || '').toLowerCase().trim();
            const matchesEmail = Boolean(uEmail && orderEmail && orderEmail === uEmail);
            const matchesCustId = Boolean(
              o.customer_id && (
                o.customer_id === customerId ||
                o.customer_id === u.id ||
                o.customer_id === `cust-${u.id}`
              )
            );
            return matchesEmail || matchesCustId;
          });

          const totalSpend = custOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
          const loyaltyPoints = custRecord ? custRecord.loyalty_points : 50;

          return {
            id: customerId,
            userId: u.id,
            name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Collector',
            email: u.email,
            phone: u.phone || custRecord?.phone || null,
            loyaltyPoints,
            totalOrders: custOrders.length,
            totalSpend: Math.round(totalSpend * 100) / 100,
            createdAt: u.created_at,
          };
        });

      let filtered = customers;
      if (params.search) {
        const s = params.search.toLowerCase().trim();
        filtered = customers.filter(
          (c) =>
            (c.name && c.name.toLowerCase().includes(s)) ||
            (c.email && c.email.toLowerCase().includes(s)) ||
            (c.phone && c.phone.toLowerCase().includes(s))
        );
      }

      return {
        customers: filtered,
        meta: { page: 1, limit: 20, total: filtered.length, totalPages: 1 },
      };
    }

    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const skip = (page - 1) * limit;

    const qb = this.customerRepo
      .createQueryBuilder('customer')
      .leftJoinAndSelect('customer.user', 'user')
      .leftJoinAndSelect('customer.orders', 'order');

    if (params.search) {
      qb.andWhere(
        '(LOWER(user.first_name) LIKE :search OR LOWER(user.last_name) LIKE :search OR LOWER(user.email) LIKE :search)',
        { search: `%${params.search.toLowerCase()}%` }
      );
    }

    qb.orderBy('customer.created_at', 'DESC').skip(skip).take(limit);

    const [customers, total] = await qb.getManyAndCount();

    const formatted = customers.map((c) => {
      const orders = c.orders || [];
      const totalSpend = orders.reduce((sum, ord) => sum + Number(ord.total_amount), 0);
      return {
        id: c.id,
        userId: c.user_id,
        name: `${c.user?.first_name || ''} ${c.user?.last_name || ''}`.trim(),
        email: c.user?.email,
        phone: c.phone || c.user?.phone,
        loyaltyPoints: c.loyalty_points,
        totalOrders: orders.length,
        totalSpend: Math.round(totalSpend * 100) / 100,
        createdAt: c.created_at,
      };
    });

    return {
      customers: formatted,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCustomerById(id: string) {
    if (!AppDataSource.isInitialized) {
      loadOrdersFromDisk();
      loadUsersToDisk();
      loadCustomersToDisk();

      const custRecord = mockStore.customers.find((c) => c.id === id || c.user_id === id);
      const targetUserId = custRecord ? custRecord.user_id : (id.startsWith('cust-') ? id.replace('cust-', '') : id);
      const u = mockStore.users.find(
        (user) => user.id === targetUserId || user.id === id || `cust-${user.id}` === id
      );

      if (!u) throw new NotFoundError(`Customer not found: ${id}`);

      const customerId = custRecord ? custRecord.id : (id.startsWith('cust-') ? id : `cust-${u.id}`);
      const uEmail = (u.email || '').toLowerCase().trim();

      // Filter orders strictly for this customer
      const custOrders = mockStore.orders.filter((o) => {
        const orderEmail = (o.guest_email || (o.shipping_address_json as any)?.email || '').toLowerCase().trim();
        const matchesEmail = Boolean(uEmail && orderEmail && orderEmail === uEmail);
        const matchesCustId = Boolean(
          o.customer_id && (
            o.customer_id === customerId ||
            o.customer_id === u.id ||
            o.customer_id === `cust-${u.id}`
          )
        );
        return matchesEmail || matchesCustId;
      });

      return {
        id: customerId,
        user: u,
        addresses: [],
        orders: custOrders,
        loyaltyPoints: custRecord ? custRecord.loyalty_points : 50,
      } as any;
    }

    const customer = await this.customerRepo.findOne({
      where: { id },
      relations: ['user', 'addresses', 'orders', 'orders.items'],
    });

    if (!customer) {
      throw new NotFoundError(`Customer not found: ${id}`);
    }

    return customer;
  }

  async getAddresses(customerId: string) {
    if (!AppDataSource.isInitialized) {
      return [
        {
          id: 'addr-001',
          customer_id: customerId,
          label: 'Home',
          recipient_name: 'Sophia Chen',
          phone: '+1-555-0142',
          street_address: '742 Evergreen Terrace',
          apartment: 'Apt 4B',
          city: 'San Francisco',
          state: 'CA',
          postal_code: '94107',
          country: 'United States',
          is_default_shipping: true,
          is_default_billing: true,
        },
      ] as any[];
    }

    return this.addressRepo.find({
      where: { customer_id: customerId },
      order: { is_default_shipping: 'DESC', created_at: 'DESC' },
    });
  }

  async addAddress(customerId: string, data: any) {
    if (!AppDataSource.isInitialized) {
      return { id: `addr-${Date.now().toString().slice(-4)}`, customer_id: customerId, ...data };
    }

    if (data.is_default_shipping) {
      await this.addressRepo.update({ customer_id: customerId }, { is_default_shipping: false });
    }

    const address = this.addressRepo.create({
      id: uuidv4(),
      customer_id: customerId,
      ...data,
    });

    return this.addressRepo.save(address);
  }

  async deleteAddress(customerId: string, addressId: string) {
    if (!AppDataSource.isInitialized) {
      return { success: true };
    }

    const address = await this.addressRepo.findOne({
      where: { id: addressId, customer_id: customerId },
    });

    if (!address) throw new NotFoundError('Address not found');
    await this.addressRepo.remove(address);
    return { success: true };
  }

  async deleteCustomer(id: string) {
    if (!AppDataSource.isInitialized) {
      loadUsersToDisk();
      loadCustomersToDisk();
      const cust = mockStore.customers.find((c) => c.id === id || c.user_id === id);
      const targetUserId = cust ? cust.user_id : (id.startsWith('cust-') ? id.replace('cust-', '') : id);

      const initUsersLen = mockStore.users.length;
      mockStore.customers = mockStore.customers.filter((c) => c.id !== id && c.user_id !== targetUserId);
      mockStore.users = mockStore.users.filter((u) => u.id !== targetUserId && u.id !== id && `cust-${u.id}` !== id);

      if (mockStore.users.length === initUsersLen) {
        throw new NotFoundError(`Customer not found: ${id}`);
      }

      saveUsersToDisk();
      saveCustomersToDisk();
      return { success: true, message: 'Customer account deleted successfully' };
    }

    const customer = await this.customerRepo.findOne({ where: { id }, relations: ['user'] });
    if (!customer) throw new NotFoundError(`Customer not found: ${id}`);
    if (customer.user) {
      await this.userRepo.remove(customer.user);
    } else {
      await this.customerRepo.remove(customer);
    }
    return { success: true, message: 'Customer account deleted successfully' };
  }
}
