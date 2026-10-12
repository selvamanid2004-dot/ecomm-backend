import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../config/database.config';
import { User } from '../entities/User';
import { Customer } from '../entities/Customer';
import { env } from '../config/environment.config';
import { ConflictError, UnauthorizedError, NotFoundError } from '../errors/app-error';
import {
  mockStore,
  saveUsersToDisk,
  loadUsersToDisk,
  saveCustomersToDisk,
  loadCustomersToDisk,
} from '../database/mock-store';

export class AuthService {
  private get userRepo() { return AppDataSource.getRepository(User); }
  private get customerRepo() { return AppDataSource.getRepository(Customer); }

  async register(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
  }) {
    if (!AppDataSource.isInitialized) {
      loadUsersToDisk();
      loadCustomersToDisk();

      const email = data.email.toLowerCase().trim();
      const existing = mockStore.users.find((u) => u.email.toLowerCase() === email);
      if (existing) throw new ConflictError('An account with this email address already exists');

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(data.password, salt);
      const uniqueSuffix = `${Date.now().toString().slice(-5)}-${Math.floor(100 + Math.random() * 900)}`;
      const userId = `usr-${uniqueSuffix}`;
      const customerId = `cust-${uniqueSuffix}`;

      const newUser: any = {
        id: userId,
        email,
        password_hash: passwordHash,
        first_name: data.first_name || 'Customer',
        last_name: data.last_name || '',
        phone: data.phone || null,
        role: 'customer',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockStore.users.push(newUser);
      mockStore.customers.push({
        id: customerId,
        user_id: userId,
        phone: data.phone || null,
        loyalty_points: 50,
        notes: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      saveUsersToDisk();
      saveCustomersToDisk();

      const tokens = this.generateTokens(newUser, customerId);
      return {
        user: {
          id: newUser.id,
          email: newUser.email,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          role: newUser.role,
          customerId,
        },
        ...tokens,
      };
    }

    const existing = await this.userRepo.findOne({ where: { email: data.email.toLowerCase() } });
    if (existing) {
      throw new ConflictError('An account with this email address already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const userId = uuidv4();
    const customerId = uuidv4();

    const user = this.userRepo.create({
      id: userId,
      email: data.email.toLowerCase(),
      password_hash: passwordHash,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      role: 'customer',
      is_active: true,
    });

    await this.userRepo.save(user);

    const customer = this.customerRepo.create({
      id: customerId,
      user_id: userId,
      phone: data.phone,
      loyalty_points: 50,
    });

    await this.customerRepo.save(customer);

    const tokens = this.generateTokens(user, customerId);

    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        customerId,
      },
      ...tokens,
    };
  }

  async login(data: { email: string; password: string }) {
    let email = (data.email || '').trim().toLowerCase();
    if (['admin', 'administrator', 'admin@admin.com', 'admin@luxe.com', 'root'].includes(email)) {
      email = 'admin@luxecomm.com';
    }

    const inputPassword = (data.password || '').trim();

    if (!AppDataSource.isInitialized) {
      loadUsersToDisk();
      loadCustomersToDisk();
      const user = mockStore.users.find((u) => u.email === email);

      if (!user || !user.is_active) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const isMatch = await bcrypt.compare(inputPassword, user.password_hash);
      if (!isMatch) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const customer = mockStore.customers.find((c) => c.user_id === user.id);
      const customerId = customer ? customer.id : null;
      const tokens = this.generateTokens(user as any, customerId);

      return {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          avatar_url: user.avatar_url,
          customerId,
        },
        ...tokens,
      };
    }

    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password_hash')
      .leftJoinAndSelect('user.customer', 'customer')
      .where('user.email = :email', { email })
      .getOne();

    if (!user || !user.is_active) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(inputPassword, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    user.last_login_at = new Date();
    await this.userRepo.save(user);

    const customerId = user.customer?.id || null;
    const tokens = this.generateTokens(user, customerId);

    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        avatar_url: user.avatar_url,
        customerId,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET) as any;
      if (!AppDataSource.isInitialized) {
        const user = mockStore.users.find((u) => u.id === decoded.userId);
        if (!user || !user.is_active) throw new UnauthorizedError('User session expired');
        const customer = mockStore.customers.find((c) => c.user_id === user.id);
        return this.generateTokens(user as any, customer ? customer.id : null);
      }

      const user = await this.userRepo.findOne({
        where: { id: decoded.userId },
        relations: ['customer'],
      });

      if (!user || !user.is_active) {
        throw new UnauthorizedError('User session expired or deactivated');
      }

      const customerId = user.customer?.id || null;
      return this.generateTokens(user, customerId);
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  async getProfile(userId: string) {
    if (!AppDataSource.isInitialized) {
      loadUsersToDisk();
      loadCustomersToDisk();
      const user = mockStore.users.find((u) => u.id === userId);
      if (!user) throw new NotFoundError('User not found');
      const customer = mockStore.customers.find((c) => c.user_id === user.id);
      return {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        phone: user.phone,
        avatar_url: user.avatar_url,
        customer,
        created_at: user.created_at,
      };
    }

    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['customer', 'customer.addresses'],
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      phone: user.phone,
      avatar_url: user.avatar_url,
      customer: user.customer,
      created_at: user.created_at,
    };
  }

  private generateTokens(user: User, customerId: string | null) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      customerId,
    };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });

    const refreshToken = jwt.sign(payload, env.REFRESH_TOKEN_SECRET, {
      expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as any,
    });

    return { accessToken, refreshToken };
  }
}
