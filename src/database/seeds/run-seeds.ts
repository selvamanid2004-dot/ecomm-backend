import 'reflect-metadata';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource, initializeDatabase } from '../../config/database.config';
import {
  User,
  Customer,
  CustomerAddress,
  Category,
  Product,
  ProductImage,
  ProductVariant,
  Coupon,
  Order,
  OrderItem,
  OrderStatusHistory,
  Payment,
  Review,
} from '../../entities';
import { logger } from '../../logging/logger';

async function seed() {
  logger.info('Starting database seeding...');
  const connected = await initializeDatabase();
  if (!connected) {
    logger.error('Cannot run seeds: database connection failed.');
    process.exit(1);
  }

  const userRepo = AppDataSource.getRepository(User);
  const customerRepo = AppDataSource.getRepository(Customer);
  const addressRepo = AppDataSource.getRepository(CustomerAddress);
  const categoryRepo = AppDataSource.getRepository(Category);
  const productRepo = AppDataSource.getRepository(Product);
  const imageRepo = AppDataSource.getRepository(ProductImage);
  const variantRepo = AppDataSource.getRepository(ProductVariant);
  const couponRepo = AppDataSource.getRepository(Coupon);
  const orderRepo = AppDataSource.getRepository(Order);
  const orderItemRepo = AppDataSource.getRepository(OrderItem);
  const statusHistoryRepo = AppDataSource.getRepository(OrderStatusHistory);
  const paymentRepo = AppDataSource.getRepository(Payment);
  const reviewRepo = AppDataSource.getRepository(Review);

  // 1. Users & Customers
  const defaultPasswordHash = await bcrypt.hash('Password@123', 10);

  let adminUser = await userRepo.findOne({ where: { email: 'admin@luxecomm.com' } });
  if (!adminUser) {
    adminUser = userRepo.create({
      id: 'usr-admin-001',
      email: 'admin@luxecomm.com',
      password_hash: defaultPasswordHash,
      first_name: 'Alexander',
      last_name: 'Vance',
      role: 'admin',
      is_active: true,
      phone: '+1-555-0199',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    });
    await userRepo.save(adminUser);
    logger.info('Created admin user: admin@luxecomm.com / Password@123');
  }

  let customerUser = await userRepo.findOne({ where: { email: 'sophia.chen@example.com' } });
  if (!customerUser) {
    customerUser = userRepo.create({
      id: 'usr-cust-001',
      email: 'sophia.chen@example.com',
      password_hash: defaultPasswordHash,
      first_name: 'Sophia',
      last_name: 'Chen',
      role: 'customer',
      is_active: true,
      phone: '+1-555-0142',
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    });
    await userRepo.save(customerUser);

    const customer = customerRepo.create({
      id: 'cust-001',
      user_id: customerUser.id,
      phone: '+1-555-0142',
      loyalty_points: 250,
      notes: 'VIP Platinum customer',
    });
    await customerRepo.save(customer);

    const address = addressRepo.create({
      id: 'addr-001',
      customer_id: customer.id,
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
    });
    await addressRepo.save(address);
    logger.info('Created sample customer: sophia.chen@example.com / Password@123');
  }

  // 2. Categories
  const categoriesData = [
    { id: 'cat-001', name: 'Audio & Acoustics', slug: 'audio-acoustics', description: 'Audiophile headphones and spatial monitors', image_url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80', display_order: 1 },
    { id: 'cat-002', name: 'Smart Wearables', slug: 'smart-wearables', description: 'Precision titanium chronographs and smart rings', image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80', display_order: 2 },
    { id: 'cat-003', name: 'Workstation & Design', slug: 'workstation-design', description: 'Billet aluminum keyboards and ergonomics', image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80', display_order: 3 },
    { id: 'cat-004', name: 'Optics & Photography', slug: 'optics-photography', description: 'Mirrorless full-frame cine cameras', image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80', display_order: 4 },
    { id: 'cat-005', name: 'Lifestyle & Travel', slug: 'lifestyle-travel', description: 'Tuscan full-grain leather luggage and EDC', image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80', display_order: 5 },
  ];

  for (const c of categoriesData) {
    const exists = await categoryRepo.findOne({ where: { slug: c.slug } });
    if (!exists) {
      await categoryRepo.save(categoryRepo.create({ ...c, is_active: true }));
    }
  }

  // 3. Products
  const productsData = [
    {
      id: 'prod-001',
      name: 'Aether Pro Wireless ANC Headphones',
      slug: 'aether-pro-wireless-anc-headphones',
      sku: 'SKU-ATH-001',
      description: 'Engineered with custom 45mm beryllium drivers, active noise cancellation with transparent pass-through mode, ultra-low distortion DSP, and 40 hours of continuous high-fidelity playback. Finished in aircraft-grade brushed aluminum and lambskin leather ear cushions.',
      short_description: 'Flagship noise-canceling headphones with bespoke beryllium drivers and 40-hour battery life.',
      category_id: 'cat-001',
      base_price: 349.00,
      compare_at_price: 399.00,
      cost_price: 180.00,
      stock_quantity: 35,
      low_stock_threshold: 5,
      is_active: true,
      is_featured: true,
      is_in_stock: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80', primary: true, order: 1 },
        { url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1000&q=80', primary: false, order: 2 },
        { url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1000&q=80', primary: false, order: 3 },
      ],
      variants: [
        { sku: 'SKU-ATH-001-BLK', title: 'Matte Obsidian Black', option1_name: 'Color', option1_value: 'Obsidian Black', price_override: 349.00, stock_quantity: 20 },
        { sku: 'SKU-ATH-001-SLV', title: 'Moonlight Silver', option1_name: 'Color', option1_value: 'Moonlight Silver', price_override: 349.00, stock_quantity: 15 },
      ],
    },
    {
      id: 'prod-002',
      name: 'Chronos Ultra Titanium Smartwatch',
      slug: 'chronos-ultra-titanium-smartwatch',
      sku: 'SKU-CHR-002',
      description: 'Grade 5 aerospace titanium bezel paired with sapphire crystal display. Features dual-frequency GPS, medical-grade ECG and SpO2 tracking, depth gauge rated to 100 meters, and seamless cellular connectivity. 7-day battery endurance under full telemetry usage.',
      short_description: 'Aerospace titanium smartwatch with sapphire glass, 100m water resistance, and ECG diagnostics.',
      category_id: 'cat-002',
      base_price: 699.00,
      compare_at_price: 799.00,
      cost_price: 390.00,
      stock_quantity: 22,
      low_stock_threshold: 4,
      is_active: true,
      is_featured: true,
      is_in_stock: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80', primary: true, order: 1 },
        { url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1000&q=80', primary: false, order: 2 },
      ],
      variants: [
        { sku: 'SKU-CHR-002-45M', title: '45mm Titanium / Sport Band', option1_name: 'Size', option1_value: '45mm', price_override: 699.00, stock_quantity: 12 },
        { sku: 'SKU-CHR-002-49M', title: '49mm Titanium / Link Bracelet', option1_name: 'Size', option1_value: '49mm', price_override: 799.00, stock_quantity: 10 },
      ],
    },
    {
      id: 'prod-003',
      name: 'Kinesis Apex Mechanical Keyboard',
      slug: 'kinesis-apex-mechanical-keyboard',
      sku: 'SKU-KNS-003',
      description: 'Solid CNC milled billet aluminum enclosure with gasket-mounted carbon fiber switch plate. Hot-swappable lubricated linear switches, south-facing per-key RGB, wireless 2.4GHz low latency and Bluetooth 5.2 connectivity.',
      short_description: 'Milled aluminum mechanical keyboard with gasket mount, custom switches, and wireless trio.',
      category_id: 'cat-003',
      base_price: 219.00,
      compare_at_price: 249.00,
      cost_price: 110.00,
      stock_quantity: 48,
      low_stock_threshold: 8,
      is_active: true,
      is_featured: true,
      is_in_stock: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1000&q=80', primary: true, order: 1 },
        { url: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1000&q=80', primary: false, order: 2 },
      ],
      variants: [
        { sku: 'SKU-KNS-003-LIN', title: 'Silent Linear Red Switches', option1_name: 'Switch', option1_value: 'Linear Red', price_override: 219.00, stock_quantity: 28 },
        { sku: 'SKU-KNS-003-TAC', title: 'Tactile Brown Switches', option1_name: 'Switch', option1_value: 'Tactile Brown', price_override: 219.00, stock_quantity: 20 },
      ],
    },
    {
      id: 'prod-004',
      name: 'Lumix Horizon Full-Frame Mirrorless',
      slug: 'lumix-horizon-full-frame-mirrorless',
      sku: 'SKU-LMX-004',
      description: 'Equipped with a 45.7MP back-illuminated full-frame sensor, 8K30p ProRes RAW recording capability, 5-axis 7-stop sensor shift stabilization, and hybrid phase-detection autofocus with real-time subject recognition.',
      short_description: '45.7MP full-frame mirrorless camera with 8K RAW video and 7-stop in-body image stabilization.',
      category_id: 'cat-004',
      base_price: 2199.00,
      compare_at_price: 2399.00,
      cost_price: 1450.00,
      stock_quantity: 14,
      low_stock_threshold: 3,
      is_active: true,
      is_featured: true,
      is_in_stock: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=80', primary: true, order: 1 },
        { url: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1000&q=80', primary: false, order: 2 },
      ],
      variants: [],
    },
    {
      id: 'prod-005',
      name: 'Nomad Voyager Full-Grain Leather Weekender',
      slug: 'nomad-voyager-leather-weekender',
      sku: 'SKU-NMD-005',
      description: 'Handcrafted from vegetable-tanned Italian Tuscan leather. Features dedicated padded compartment for 16-inch laptops, waterproof bottom shoe garage, and YKK Excella antiqued brass zippers.',
      short_description: 'Handmade Tuscan leather weekender duffle bag with dedicated tech and footwear partitions.',
      category_id: 'cat-005',
      base_price: 429.00,
      compare_at_price: 489.00,
      cost_price: 210.00,
      stock_quantity: 19,
      low_stock_threshold: 4,
      is_active: true,
      is_featured: true,
      is_in_stock: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=80', primary: true, order: 1 },
        { url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1000&q=80', primary: false, order: 2 },
      ],
      variants: [],
    },
    {
      id: 'prod-006',
      name: 'Vanguard Studio Spatial Soundbar',
      slug: 'vanguard-studio-spatial-soundbar',
      sku: 'SKU-VNG-006',
      description: '11 discrete acoustic drivers with dual up-firing Dolby Atmos channels and integrated 8-inch acoustic subwoofer. HDMI eARC 2.1 passthrough, AirPlay 2, and RoomCal acoustic calibration micro-sensor suite.',
      short_description: '11-driver Dolby Atmos spatial soundbar with HDMI eARC and auto acoustic room tuning.',
      category_id: 'cat-001',
      base_price: 599.00,
      compare_at_price: 699.00,
      cost_price: 310.00,
      stock_quantity: 18,
      low_stock_threshold: 5,
      is_active: true,
      is_featured: true,
      is_in_stock: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1000&q=80', primary: true, order: 1 },
      ],
      variants: [],
    },
  ];

  for (const p of productsData) {
    let product = await productRepo.findOne({ where: { sku: p.sku } });
    if (!product) {
      product = productRepo.create({
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        description: p.description,
        short_description: p.short_description,
        category_id: p.category_id,
        base_price: p.base_price,
        compare_at_price: p.compare_at_price,
        cost_price: p.cost_price,
        stock_quantity: p.stock_quantity,
        low_stock_threshold: p.low_stock_threshold,
        is_active: p.is_active,
        is_featured: p.is_featured,
        is_in_stock: p.is_in_stock,
      });
      await productRepo.save(product);

      for (const img of p.images) {
        await imageRepo.save(
          imageRepo.create({
            id: uuidv4(),
            product_id: product.id,
            image_url: img.url,
            is_primary: img.primary,
            display_order: img.order,
          })
        );
      }

      for (const v of p.variants) {
        await variantRepo.save(
          variantRepo.create({
            id: uuidv4(),
            product_id: product.id,
            sku: v.sku,
            title: v.title,
            option1_name: v.option1_name,
            option1_value: v.option1_value,
            price_override: v.price_override,
            stock_quantity: v.stock_quantity,
            is_active: true,
          })
        );
      }
    }
  }

  // 4. Coupons
  const coupons = [
    { id: 'cpn-001', code: 'LUXE10', description: '10% off storewide on orders over ₹1,000', discount_type: 'percentage' as const, discount_value: 10.00, min_order_amount: 1000.00, max_discount_amount: 2000.00, usage_limit: 1000, usage_count: 24, is_active: true },
    { id: 'cpn-002', code: 'WELCOME50', description: '₹500 flat discount for luxury purchases above ₹3,000', discount_type: 'fixed' as const, discount_value: 500.00, min_order_amount: 3000.00, usage_limit: 500, usage_count: 15, is_active: true },
    { id: 'cpn-003', code: 'VIP20', description: '20% off exclusively for registered members', discount_type: 'percentage' as const, discount_value: 20.00, min_order_amount: 2500.00, max_discount_amount: 3000.00, usage_limit: 200, usage_count: 8, is_active: true },
  ];

  for (const c of coupons) {
    const existing = await couponRepo.findOne({ where: { code: c.code } });
    if (!existing) {
      await couponRepo.save(couponRepo.create(c));
    }
  }

  logger.info('Database seeding completed successfully!');
  process.exit(0);
}

seed().catch((err) => {
  logger.error('Seeding failure:', { error: err.message });
  process.exit(1);
});
