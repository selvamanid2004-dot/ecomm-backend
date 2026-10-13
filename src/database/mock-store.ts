import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const defaultPasswordHash = bcrypt.hashSync('Password@123', 10);

export const mockStore = {
  users: [
    {
      id: 'usr-admin-001',
      email: 'admin@luxecomm.com',
      password_hash: defaultPasswordHash,
      first_name: 'Alexander',
      last_name: 'Vance',
      role: 'admin' as const,
      is_active: true,
      phone: '+1-555-0199',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      last_login_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 'usr-cust-001',
      email: 'sophia.chen@example.com',
      password_hash: defaultPasswordHash,
      first_name: 'Sophia',
      last_name: 'Chen',
      role: 'customer' as const,
      is_active: true,
      phone: '+1-555-0142',
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      last_login_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    },
  ],

  customers: [
    {
      id: 'cust-001',
      user_id: 'usr-cust-001',
      phone: '+1-555-0142' as string | null,
      loyalty_points: 250,
      notes: 'VIP Platinum customer' as string | null,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ] as Array<{ id: string; user_id: string; phone: string | null; loyalty_points: number; notes: string | null; created_at: Date; updated_at: Date }>,


  categories: [
    {
      id: 'cat-001',
      name: 'Audio & Acoustics',
      slug: 'audio-acoustics',
      description: 'Audiophile headphones and spatial monitors',
      image_url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80',
      display_order: 1,
      is_active: true,
      productCount: 2,
    },
    {
      id: 'cat-002',
      name: 'Smart Wearables',
      slug: 'smart-wearables',
      description: 'Precision titanium chronographs and smart rings',
      image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
      display_order: 2,
      is_active: true,
      productCount: 2,
    },
    {
      id: 'cat-003',
      name: 'Workstation & Design',
      slug: 'workstation-design',
      description: 'Billet aluminum keyboards and ergonomics',
      image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80',
      display_order: 3,
      is_active: true,
      productCount: 2,
    },
    {
      id: 'cat-004',
      name: 'Optics & Photography',
      slug: 'optics-photography',
      description: 'Mirrorless full-frame cine cameras',
      image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
      display_order: 4,
      is_active: true,
      productCount: 1,
    },
    {
      id: 'cat-005',
      name: 'Lifestyle & Travel',
      slug: 'lifestyle-travel',
      description: 'Tuscan full-grain leather luggage and EDC',
      image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
      display_order: 5,
      is_active: true,
      productCount: 1,
    },
  ],

  products: [
    {
      id: 'prod-001',
      name: 'Aether Pro Wireless ANC Headphones',
      slug: 'aether-pro-wireless-anc-headphones',
      sku: 'SKU-ATH-001',
      description: 'Engineered with custom 45mm beryllium drivers, active noise cancellation with transparent pass-through mode, ultra-low distortion DSP, and 40 hours of continuous high-fidelity playback. Finished in aircraft-grade brushed aluminum and lambskin leather ear cushions.',
      short_description: 'Flagship noise-canceling headphones with bespoke beryllium drivers and 40-hour battery life.',
      category_id: 'cat-001',
      base_price: 349.0,
      compare_at_price: 399.0,
      cost_price: 180.0,
      stock_quantity: 35,
      low_stock_threshold: 5,
      is_active: true,
      is_featured: true,
      is_in_stock: true,
      created_at: new Date(),
      category: { id: 'cat-001', name: 'Audio & Acoustics', slug: 'audio-acoustics' },
      images: [
        { id: 'img-001', product_id: 'prod-001', image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80', is_primary: true, display_order: 1 },
        { id: 'img-002', product_id: 'prod-001', image_url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1000&q=80', is_primary: false, display_order: 2 },
        { id: 'img-003', product_id: 'prod-001', image_url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1000&q=80', is_primary: false, display_order: 3 },
      ],
      variants: [
        { id: 'var-001', product_id: 'prod-001', sku: 'SKU-ATH-001-BLK', title: 'Matte Obsidian Black', price_override: 349.0, stock_quantity: 20, is_active: true },
        { id: 'var-002', product_id: 'prod-001', sku: 'SKU-ATH-001-SLV', title: 'Moonlight Silver', price_override: 349.0, stock_quantity: 15, is_active: true },
      ],
      reviews: [
        { id: 'rev-001', product_id: 'prod-001', customer_name: 'Sophia Chen', rating: 5, comment: 'The soundstage and acoustic depth are sublime. Active noise cancellation easily beats all other studio headphones I have tested.', created_at: new Date().toISOString() },
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
      base_price: 699.0,
      compare_at_price: 799.0,
      cost_price: 390.0,
      stock_quantity: 22,
      low_stock_threshold: 4,
      is_active: true,
      is_featured: true,
      is_in_stock: true,
      created_at: new Date(),
      category: { id: 'cat-002', name: 'Smart Wearables', slug: 'smart-wearables' },
      images: [
        { id: 'img-004', product_id: 'prod-002', image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80', is_primary: true, display_order: 1 },
        { id: 'img-005', product_id: 'prod-002', image_url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1000&q=80', is_primary: false, display_order: 2 },
      ],
      variants: [
        { id: 'var-003', product_id: 'prod-002', sku: 'SKU-CHR-002-45M', title: '45mm Titanium / Sport Band', price_override: 699.0, stock_quantity: 12, is_active: true },
        { id: 'var-004', product_id: 'prod-002', sku: 'SKU-CHR-002-49M', title: '49mm Titanium / Link Bracelet', price_override: 799.0, stock_quantity: 10, is_active: true },
      ],
      reviews: [
        { id: 'rev-002', product_id: 'prod-002', customer_name: 'Marcus Ross', rating: 5, comment: 'Grade 5 titanium feels sensational on the wrist. Battery easily lasts an entire week.', created_at: new Date().toISOString() },
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
      base_price: 219.0,
      compare_at_price: 249.0,
      cost_price: 110.0,
      stock_quantity: 48,
      low_stock_threshold: 8,
      is_active: true,
      is_featured: true,
      is_in_stock: true,
      created_at: new Date(),
      category: { id: 'cat-003', name: 'Workstation & Design', slug: 'workstation-design' },
      images: [
        { id: 'img-006', product_id: 'prod-003', image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1000&q=80', is_primary: true, display_order: 1 },
        { id: 'img-007', product_id: 'prod-003', image_url: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1000&q=80', is_primary: false, display_order: 2 },
      ],
      variants: [
        { id: 'var-005', product_id: 'prod-003', sku: 'SKU-KNS-003-LIN', title: 'Silent Linear Red Switches', price_override: 219.0, stock_quantity: 28, is_active: true },
        { id: 'var-006', product_id: 'prod-003', sku: 'SKU-KNS-003-TAC', title: 'Tactile Brown Switches', price_override: 219.0, stock_quantity: 20, is_active: true },
      ],
      reviews: [],
    },
    {
      id: 'prod-004',
      name: 'Lumina Cine X Full-Frame 8K Camera',
      slug: 'lumina-cine-x-full-frame-8k-camera',
      sku: 'SKU-LUM-004',
      description: 'Engineered for cinematographers, featuring a 45MP full-frame stacked CMOS sensor, 8K RAW recording at 60fps, 16 stops of dynamic range, internal ND filtration, and dual CFexpress Type B slots. Housed in a precision magnesium alloy weather-sealed chassis.',
      short_description: 'Full-frame cinema camera with 8K RAW recording, dual base ISO, and 16-stop dynamic range.',
      category_id: 'cat-004',
      base_price: 2499.0,
      compare_at_price: 2799.0,
      cost_price: 1500.0,
      stock_quantity: 14,
      low_stock_threshold: 3,
      is_active: true,
      is_featured: true,
      is_in_stock: true,
      created_at: new Date(),
      category: { id: 'cat-004', name: 'Optics & Photography', slug: 'optics-photography' },
      images: [
        { id: 'img-008', product_id: 'prod-004', image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=80', is_primary: true, display_order: 1 },
      ],
      variants: [],
      reviews: [],
    },
    {
      id: 'prod-005',
      name: 'Vanguard Full-Grain Tuscan Leather Duffle',
      slug: 'vanguard-full-grain-tuscan-leather-duffle',
      sku: 'SKU-VAN-005',
      description: 'Handcrafted in Florence from vegetable-tanned Tuscan full-grain leather and solid forged brass hardware. Features water-resistant Japanese cotton lining, dedicated shoe compartment, and padded sleeve accommodating laptops up to 16 inches.',
      short_description: 'Handcrafted vegetable-tanned Tuscan leather duffle with solid brass hardware.',
      category_id: 'cat-005',
      base_price: 480.0,
      compare_at_price: 540.0,
      cost_price: 240.0,
      stock_quantity: 25,
      low_stock_threshold: 5,
      is_active: true,
      is_featured: true,
      is_in_stock: true,
      created_at: new Date(),
      category: { id: 'cat-005', name: 'Lifestyle & Travel', slug: 'lifestyle-travel' },
      images: [
        { id: 'img-009', product_id: 'prod-005', image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=80', is_primary: true, display_order: 1 },
      ],
      variants: [],
      reviews: [],
    },
  ],


  priceHistory: [
    {
      id: 'ph-001',
      product_id: 'prod-001',
      productName: 'Aether Pro Wireless ANC Headphones',
      old_price: 399.0,
      new_price: 349.0,
      reason: 'Autumn promotional discount launch',
      created_at: new Date(),
    },
    {
      id: 'ph-002',
      product_id: 'prod-002',
      productName: 'Chronos Ultra Titanium Smartwatch',
      old_price: 799.0,
      new_price: 699.0,
      reason: 'Titanium procurement cost reduction passed to collectors',
      created_at: new Date(),
    },
  ],

  inventoryAdjustments: [] as any[],

  carts: {} as Record<string, { items: any[]; couponCode: string | null; discountAmount: number }>,
  wishlists: {} as Record<string, string[]>,

  orders: [
    {
      id: 'ord-001',
      order_number: 'ORD-2026-90412',
      invoice_number: 'INV-2026-90412',
      customer_id: 'cust-001',
      guest_email: 'sophia.chen@example.com',
      status: 'delivered',
      payment_status: 'paid',
      payment_method: 'credit_card',
      shipping_method: 'FedEx Express Air',
      subtotal: 349.0,
      discount_amount: 34.9,
      tax_amount: 25.13,
      shipping_fee: 0.0,
      total_amount: 339.23,
      tracking_number: 'TRK-FX-992384711',
      shipping_address_json: {
        recipient_name: 'Sophia Chen',
        street_address: '742 Evergreen Terrace',
        city: 'San Francisco',
        state: 'CA',
        postal_code: '94107',
      },
      items: [
        {
          id: 'item-001',
          product_name: 'Aether Pro Wireless ANC Headphones',
          sku: 'SKU-ATH-001-BLK',
          unit_price: 349.0,
          quantity: 1,
          line_total: 349.0,
          product_image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80',
        },
      ],
      created_at: new Date(),
    },
  ],

  siteContent: {
    announcement_text: '✨ COMPLIMENTARY WORLDWIDE EXPRESS DELIVERY • BESPOKE COLLECTION',
    announcement_badge: 'LIMITED DIRECT RELEASE',
    brand_name: 'LUXE',
    brand_tag: 'STUDIO',
    hero_badge: 'THE EXCLUSIVE CURATION',
    hero_heading: 'Crafted for the Discerning',
    hero_subheading: 'Experience our meticulously engineered collection. Select your desired quantities, review your bag, and complete checkout seamlessly in one place.',
    products_section_title: 'Available Creations',
    products_section_subtitle: 'Select quantity and proceed directly to purchase.',
    footer_text: 'LUXE STUDIO BOUTIQUE • Direct Single Page Experience',
  },
};

const DATA_DIR = path.resolve(__dirname, '../../data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders_store.json');
const CONTENT_FILE = path.join(DATA_DIR, 'content_store.json');
const USERS_FILE = path.join(DATA_DIR, 'users_store.json');
const CUSTOMERS_FILE = path.join(DATA_DIR, 'customers_store.json');

export function saveOrdersToDisk(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(mockStore.orders, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save orders to disk:', err);
  }
}

export function loadOrdersFromDisk(): void {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const raw = fs.readFileSync(ORDERS_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length > 0) {
        mockStore.orders = data;
      }
    }
  } catch (err) {
    console.error('Failed to load orders from disk:', err);
  }
}

export function saveContentToDisk(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(CONTENT_FILE, JSON.stringify(mockStore.siteContent, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save content to disk:', err);
  }
}

export function loadContentFromDisk(): void {
  try {
    if (fs.existsSync(CONTENT_FILE)) {
      const raw = fs.readFileSync(CONTENT_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (data && typeof data === 'object') {
        mockStore.siteContent = { ...mockStore.siteContent, ...data };
      }
    }
  } catch (err) {
    console.error('Failed to load content from disk:', err);
  }
}

export function saveUsersToDisk(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(USERS_FILE, JSON.stringify(mockStore.users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save users to disk:', err);
  }
}

export function loadUsersToDisk(): void {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length > 0) {
        // Ensure default admin is always preserved
        const hasAdmin = data.some((u) => u.role === 'admin' || u.email === 'admin@luxecomm.com');
        if (!hasAdmin && mockStore.users.length > 0) {
          data.unshift(mockStore.users[0]);
        }
        mockStore.users = data;
      }
    } else {
      saveUsersToDisk();
    }
  } catch (err) {
    console.error('Failed to load users from disk:', err);
  }
}

export function saveCustomersToDisk(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify(mockStore.customers, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save customers to disk:', err);
  }
}

export function loadCustomersToDisk(): void {
  try {
    if (fs.existsSync(CUSTOMERS_FILE)) {
      const raw = fs.readFileSync(CUSTOMERS_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length > 0) {
        mockStore.customers = data;
      }
    } else {
      saveCustomersToDisk();
    }
  } catch (err) {
    console.error('Failed to load customers from disk:', err);
  }
}

export function syncUsersFromOrders(): void {
  for (const order of mockStore.orders) {
    const email = (order.guest_email || (order.shipping_address_json as any)?.email || '').toLowerCase().trim();
    if (!email) continue;
    const existing = mockStore.users.find((u) => u.email.toLowerCase() === email);
    if (!existing) {
      const recipientName = (order.shipping_address_json as any)?.recipient_name || 'Customer';
      const parts = recipientName.split(' ');
      const firstName = parts[0] || 'Customer';
      const lastName = parts.slice(1).join(' ') || '';
      const userId = `usr-${Date.now().toString().slice(-4)}-${Math.floor(100 + Math.random() * 900)}`;
      const customerId = order.customer_id || `cust-${Date.now().toString().slice(-4)}`;
      const newUser = {
        id: userId,
        email,
        password_hash: defaultPasswordHash,
        first_name: firstName,
        last_name: lastName,
        role: 'customer' as const,
        is_active: true,
        phone: (order.shipping_address_json as any)?.phone || null,
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        last_login_at: new Date(order.created_at || Date.now()),
        created_at: new Date(order.created_at || Date.now()),
        updated_at: new Date(order.created_at || Date.now()),
      };
      mockStore.users.push(newUser);
      if (!mockStore.customers.some((c) => c.id === customerId || c.user_id === userId)) {
        mockStore.customers.push({
          id: customerId,
          user_id: userId,
          phone: (order.shipping_address_json as any)?.phone || null,
          loyalty_points: 50,
          notes: null,
          created_at: new Date(order.created_at || Date.now()),
          updated_at: new Date(order.created_at || Date.now()),
        });
      }
    }
  }
  saveUsersToDisk();
  saveCustomersToDisk();
}

const PRODUCTS_FILE = path.join(DATA_DIR, 'products_store.json');

export function saveProductsToDisk(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(mockStore.products, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save products to disk:', err);
  }
}

export function loadProductsToDisk(): void {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const raw = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length > 0) {
        // Ensure all products are loaded, ensuring none are accidentally left inactive if they are core products
        mockStore.products = data;
        return;
      }
    }
    // If file doesn't exist, save seed products
    saveProductsToDisk();
  } catch (err) {
    console.error('Failed to load products from disk:', err);
  }
}

loadProductsToDisk();
loadOrdersFromDisk();
loadUsersToDisk();
loadCustomersToDisk();
loadContentFromDisk();
syncUsersFromOrders();



