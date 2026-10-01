import fs from 'fs';
import path from 'path';
import prisma from './prisma';

export interface ProductItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  userId: string;
  category?: string | null;
  currency?: string;
  approvalStatus?: string;
  salesCount?: number;
  contentDeliveryType?: string | null;
  contentUrl?: string | null;
  materials?: { name: string; type: string; url?: string }[] | null;
  paymentMethods?: string[] | null;
  allowAffiliation?: boolean;
  tracking?: {
    metaPixelId?: string;
    metaApiToken?: string;
    tiktokPixelId?: string;
    tiktokAccessToken?: string;
    googleAnalyticsId?: string;
    googleAdsId?: string;
    googleAdsLabel?: string;
    utmifyPixelId?: string;
    utmifyToken?: string;
    gtmId?: string;
  };
  checkoutSettings?: {
    coupons?: Array<{ code: string; discountPercent: number }>;
    orderBump?: {
      enabled: boolean;
      title: string;
      price: number;
      description?: string;
    };
    customCheckout?: {
      enabled?: boolean;
      themeColor?: string;
      guaranteeDays?: number;
      urgencyTimer?: boolean;
      timerMinutes?: number;
      timerText?: string;
      bannerUrl?: string;
    };
    whatsappSupport?: {
      enabled: boolean;
      phone: string;
      message?: string;
    };
  };
  automation?: {
    webhookUrl?: string;
    webhookEvents?: string[];
    cartRecoveryEmail?: boolean;
    cartRecoveryWhatsapp?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'REFUNDED' | 'CHARGEBACK' | 'CANCELLED' | 'EXPIRED';
  createdAt: string;
  updatedAt: string;
  product?: ProductItem;
  transaction?: {
    id: string;
    method?: 'MPESA' | 'EMOLA' | null;
    status: string;
    zenofyCheckoutId?: string | null;
    zenofyCheckoutUrl?: string | null;
    zenofyTransactionId?: string | null;
    responsePayload?: any;
  } | null;
  hasOrderBump?: boolean;
  orderBumpTitle?: string;
  orderBumpAmount?: number;
  affiliateRef?: string | null;
  utmParams?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  };
}

interface StoreData {
  products: ProductItem[];
  orders: OrderItem[];
}

const STORE_PATH = path.join(process.cwd(), 'data', 'store.json');

function readLocalStore(): StoreData {
  try {
    if (!fs.existsSync(STORE_PATH)) {
      const initial: StoreData = { products: [], orders: [] };
      fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
      fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const content = fs.readFileSync(STORE_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    console.error('Error reading local store:', e);
    return { products: [], orders: [] };
  }
}

function writeLocalStore(data: StoreData) {
  try {
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing local store:', e);
  }
}

export const dbStore = {
  // PRODUCTS
  async getProducts(status?: string): Promise<ProductItem[]> {
    try {
      const dbProducts = await prisma.product.findMany({
        where: status && (status === 'ACTIVE' || status === 'INACTIVE') ? { status } : undefined,
        orderBy: { createdAt: 'desc' },
      });
      const store = readLocalStore();
      return dbProducts.map(p => {
        const localMatch = store.products.find(lp => lp.id === p.id);
        const salesCount = store.orders.filter(o => o.productId === p.id && o.status === 'APPROVED').length;
        return {
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          imageUrl: p.imageUrl,
          status: p.status as 'ACTIVE' | 'INACTIVE',
          userId: p.userId,
          category: localMatch?.category || 'SoftwareSaaS',
          currency: localMatch?.currency || 'MZN',
          approvalStatus: localMatch?.approvalStatus || 'Aprovado',
          salesCount: localMatch?.salesCount ?? salesCount,
          tracking: localMatch?.tracking,
          checkoutSettings: localMatch?.checkoutSettings,
          automation: localMatch?.automation,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        };
      });
    } catch {
      // Fallback to local store
      const store = readLocalStore();
      return store.products
        .filter(p => !status || status === 'ALL' || p.status === status)
        .map(p => {
          const salesCount = store.orders.filter(o => o.productId === p.id && o.status === 'APPROVED').length;
          return {
            ...p,
            category: p.category || 'SoftwareSaaS',
            currency: p.currency || 'MZN',
            approvalStatus: p.approvalStatus || 'Aprovado',
            salesCount: p.salesCount !== undefined ? p.salesCount : salesCount,
          };
        });
    }
  },

  async getProductById(id: string): Promise<ProductItem | null> {
    try {
      const p = await prisma.product.findUnique({ where: { id } });
      const store = readLocalStore();
      const localMatch = store.products.find(lp => lp.id === id);
      const salesCount = store.orders.filter(o => o.productId === id && o.status === 'APPROVED').length;
      if (p) {
        return {
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          imageUrl: p.imageUrl,
          status: p.status as 'ACTIVE' | 'INACTIVE',
          userId: p.userId,
          category: localMatch?.category || 'SoftwareSaaS',
          currency: localMatch?.currency || 'MZN',
          approvalStatus: localMatch?.approvalStatus || 'Aprovado',
          salesCount: localMatch?.salesCount ?? salesCount,
          tracking: localMatch?.tracking,
          checkoutSettings: localMatch?.checkoutSettings,
          automation: localMatch?.automation,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        };
      }
    } catch {
      // ignore
    }

    const store = readLocalStore();
    const prod = store.products.find(p => p.id === id);
    if (!prod) return null;
    const salesCount = store.orders.filter(o => o.productId === id && o.status === 'APPROVED').length;
    return {
      ...prod,
      category: prod.category || 'SoftwareSaaS',
      currency: prod.currency || 'MZN',
      approvalStatus: prod.approvalStatus || 'Aprovado',
      salesCount: prod.salesCount !== undefined ? prod.salesCount : salesCount,
    };
  },

  async createProduct(data: {
    name: string;
    price: number;
    description?: string;
    imageUrl?: string;
    userId?: string;
    category?: string;
    currency?: string;
    contentDeliveryType?: string;
    contentUrl?: string;
    materials?: { name: string; type: string; url?: string }[];
    paymentMethods?: string[];
    allowAffiliation?: boolean;
  }): Promise<ProductItem> {
    const userId = data.userId || 'admin-user-otterfy';
    try {
      const p = await prisma.product.create({
        data: {
          name: data.name,
          price: data.price,
          description: data.description || null,
          imageUrl: data.imageUrl || null,
          userId,
          status: 'ACTIVE',
        },
      });
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        imageUrl: p.imageUrl,
        status: p.status as 'ACTIVE' | 'INACTIVE',
        userId: p.userId,
        category: data.category || 'Outro',
        currency: data.currency || 'MZN',
        contentDeliveryType: data.contentDeliveryType,
        contentUrl: data.contentUrl,
        materials: data.materials,
        paymentMethods: data.paymentMethods,
        allowAffiliation: data.allowAffiliation,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      };
    } catch {
      // Fallback
      const store = readLocalStore();
      const newProduct: ProductItem = {
        id: `prod_${Date.now().toString(36)}`,
        name: data.name,
        price: data.price,
        description: data.description || null,
        imageUrl: data.imageUrl || null,
        userId,
        status: 'ACTIVE',
        category: data.category || 'Outro',
        currency: data.currency || 'MZN',
        contentDeliveryType: data.contentDeliveryType,
        contentUrl: data.contentUrl,
        materials: data.materials,
        paymentMethods: data.paymentMethods,
        allowAffiliation: data.allowAffiliation,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.products.unshift(newProduct);
      writeLocalStore(store);
      return newProduct;
    }
  },

  async updateProduct(id: string, data: Partial<ProductItem>): Promise<ProductItem | null> {
    // 1. Update local JSON store so all advanced settings (tracking, checkoutSettings, automation, etc.) are always persisted
    const store = readLocalStore();
    const index = store.products.findIndex(p => p.id === id);
    let updatedItem: ProductItem;
    if (index !== -1) {
      store.products[index] = {
        ...store.products[index],
        ...data,
        tracking: data.tracking ? { ...store.products[index].tracking, ...data.tracking } : store.products[index].tracking,
        checkoutSettings: data.checkoutSettings ? { ...store.products[index].checkoutSettings, ...data.checkoutSettings } : store.products[index].checkoutSettings,
        automation: data.automation ? { ...store.products[index].automation, ...data.automation } : store.products[index].automation,
        updatedAt: new Date().toISOString(),
      };
      updatedItem = store.products[index];
      writeLocalStore(store);
    } else {
      updatedItem = {
        id,
        name: data.name || 'Produto',
        price: data.price || 0,
        status: data.status || 'ACTIVE',
        userId: 'admin-user-otterfy',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data,
      };
      store.products.unshift(updatedItem);
      writeLocalStore(store);
    }

    // 2. Also try to update Prisma if database is connected
    try {
      await prisma.product.update({
        where: { id },
        data: {
          ...(data.name ? { name: data.name } : {}),
          ...(data.price !== undefined ? { price: data.price } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
          ...(data.status ? { status: data.status } : {}),
        },
      });
    } catch {
      // Prisma optional fallback
    }

    return updatedItem;
  },

  // ORDERS & PAYMENTS
  async getOrders(filters?: { status?: string; startDate?: string; endDate?: string }): Promise<OrderItem[]> {
    try {
      const dbOrders = await prisma.order.findMany({
        where: {
          ...(filters?.status && filters.status !== 'ALL' ? { status: filters.status as any } : {}),
        },
        orderBy: { createdAt: 'desc' },
        include: {
          product: true,
          customer: true,
          transaction: true,
        },
      });
      return dbOrders.map(o => ({
        id: o.id,
        productId: o.productId,
        customerId: o.customerId,
        customerName: o.customer.name,
        customerPhone: o.customer.phone,
        customerEmail: o.customer.email,
        amount: o.amount,
        status: o.status as any,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        product: {
          id: o.product.id,
          name: o.product.name,
          price: o.product.price,
          status: o.product.status as any,
          userId: o.product.userId,
          createdAt: o.product.createdAt.toISOString(),
          updatedAt: o.product.updatedAt.toISOString(),
        },
        transaction: o.transaction ? {
          id: o.transaction.id,
          method: o.transaction.method as any,
          status: o.transaction.status,
          zenofyCheckoutId: o.transaction.zenofyCheckoutId,
          zenofyCheckoutUrl: o.transaction.zenofyCheckoutUrl,
          zenofyTransactionId: o.transaction.zenofyTransactionId,
        } : null,
      }));
    } catch {
      // Fallback
      const store = readLocalStore();
      let orders = store.orders.map(o => {
        const prod = store.products.find(p => p.id === o.productId);
        return { ...o, product: prod || o.product };
      });

      if (filters?.status && filters.status !== 'ALL') {
        orders = orders.filter(o => o.status === filters.status);
      }
      return orders;
    }
  },

  async getOrderById(id: string): Promise<OrderItem | null> {
    try {
      const o = await prisma.order.findUnique({
        where: { id },
        include: { product: true, customer: true, transaction: true },
      });
      if (o) {
        return {
          id: o.id,
          productId: o.productId,
          customerId: o.customerId,
          customerName: o.customer.name,
          customerPhone: o.customer.phone,
          customerEmail: o.customer.email,
          amount: o.amount,
          status: o.status as any,
          createdAt: o.createdAt.toISOString(),
          updatedAt: o.updatedAt.toISOString(),
          product: {
            id: o.product.id,
            name: o.product.name,
            price: o.product.price,
            status: o.product.status as any,
            userId: o.product.userId,
            createdAt: o.product.createdAt.toISOString(),
            updatedAt: o.product.updatedAt.toISOString(),
          },
          transaction: o.transaction ? {
            id: o.transaction.id,
            method: o.transaction.method as any,
            status: o.transaction.status,
            zenofyCheckoutId: o.transaction.zenofyCheckoutId,
            zenofyCheckoutUrl: o.transaction.zenofyCheckoutUrl,
            zenofyTransactionId: o.transaction.zenofyTransactionId,
          } : null,
        };
      }
    } catch {
      // ignore
    }

    const store = readLocalStore();
    const order = store.orders.find(o => o.id === id);
    if (!order) return null;
    const prod = store.products.find(p => p.id === order.productId);
    return { ...order, product: prod || order.product };
  },

  async createOrder(data: {
    productId: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    amount: number;
    paymentMethod?: 'MPESA' | 'EMOLA';
    hasOrderBump?: boolean;
    orderBumpTitle?: string;
    orderBumpAmount?: number;
    affiliateRef?: string;
    utmParams?: {
      source?: string;
      medium?: string;
      campaign?: string;
      content?: string;
      term?: string;
    };
  }): Promise<OrderItem> {
    const orderId = `OTF-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    try {
      let customer = await prisma.customer.findUnique({ where: { phone: data.customerPhone } });
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            name: data.customerName,
            phone: data.customerPhone,
            email: data.customerEmail || null,
          },
        });
      }

      const order = await prisma.order.create({
        data: {
          id: orderId,
          productId: data.productId,
          customerId: customer.id,
          amount: data.amount,
          status: 'PENDING',
          transaction: {
            create: {
              status: 'PENDING',
              method: data.paymentMethod,
            },
          },
        },
        include: {
          product: true,
          customer: true,
          transaction: true,
        },
      });

      return {
        id: order.id,
        productId: order.productId,
        customerId: order.customerId,
        customerName: order.customer.name,
        customerPhone: order.customer.phone,
        customerEmail: order.customer.email,
        amount: order.amount,
        status: order.status as any,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        hasOrderBump: data.hasOrderBump,
        orderBumpTitle: data.orderBumpTitle,
        orderBumpAmount: data.orderBumpAmount,
        affiliateRef: data.affiliateRef,
        utmParams: data.utmParams,
        transaction: order.transaction ? {
          id: order.transaction.id,
          method: order.transaction.method as any,
          status: order.transaction.status,
        } : null,
      };
    } catch {
      // Fallback
      const store = readLocalStore();
      const newOrder: OrderItem = {
        id: orderId,
        productId: data.productId,
        customerId: `cust_${Date.now()}`,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail || null,
        amount: data.amount,
        status: 'PENDING',
        hasOrderBump: data.hasOrderBump,
        orderBumpTitle: data.orderBumpTitle,
        orderBumpAmount: data.orderBumpAmount,
        affiliateRef: data.affiliateRef,
        utmParams: data.utmParams,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        transaction: {
          id: `tx_${Date.now()}`,
          method: data.paymentMethod || null,
          status: 'PENDING',
        },
      };
      store.orders.unshift(newOrder);
      writeLocalStore(store);
      return newOrder;
    }
  },

  async updateOrderTransaction(orderId: string, data: {
    zenofyCheckoutId?: string;
    zenofyCheckoutUrl?: string;
    status?: 'PENDING' | 'APPROVED' | 'DECLINED' | 'REFUNDED' | 'CHARGEBACK' | 'CANCELLED';
    zenofyTransactionId?: string;
    method?: 'MPESA' | 'EMOLA';
    responsePayload?: any;
  }) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { transaction: true },
      });
      if (order && order.transaction) {
        await prisma.transaction.update({
          where: { id: order.transaction.id },
          data: {
            ...(data.zenofyCheckoutId ? { zenofyCheckoutId: data.zenofyCheckoutId } : {}),
            ...(data.zenofyCheckoutUrl ? { zenofyCheckoutUrl: data.zenofyCheckoutUrl } : {}),
            ...(data.status ? { status: data.status as any } : {}),
            ...(data.zenofyTransactionId ? { zenofyTransactionId: data.zenofyTransactionId } : {}),
            ...(data.method ? { method: data.method } : {}),
            ...(data.responsePayload ? { responsePayload: data.responsePayload } : {}),
          },
        });
        if (data.status) {
          await prisma.order.update({
            where: { id: orderId },
            data: { status: data.status as any },
          });
        }
      }
    } catch {
      // ignore
    }

    // Always update local store too
    const store = readLocalStore();
    const orderIndex = store.orders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
      const ord = store.orders[orderIndex];
      store.orders[orderIndex] = {
        ...ord,
        status: data.status || ord.status,
        updatedAt: new Date().toISOString(),
        transaction: {
          ...(ord.transaction || { id: `tx_${Date.now()}`, status: 'PENDING' }),
          ...data,
        },
      };
      writeLocalStore(store);
    }
  },

  // KPIS
  async getKPIs() {
    const orders = await this.getOrders();
    const approvedOrders = orders.filter(o => o.status === 'APPROVED');

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfThisWeek = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfThisMonth = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000);

    const todayOrders = approvedOrders.filter(o => new Date(o.createdAt) >= startOfToday);
    const weekOrders = approvedOrders.filter(o => new Date(o.createdAt) >= startOfThisWeek);
    const monthOrders = approvedOrders.filter(o => new Date(o.createdAt) >= startOfThisMonth);

    const todayRev = todayOrders.reduce((acc, curr) => acc + curr.amount, 0);
    const weekRev = weekOrders.reduce((acc, curr) => acc + curr.amount, 0);
    const monthRev = monthOrders.reduce((acc, curr) => acc + curr.amount, 0);

    return {
      today: { revenue: todayRev, salesCount: todayOrders.length, percentChange: 0 },
      thisWeek: { revenue: weekRev, salesCount: weekOrders.length, percentChange: 0 },
      thisMonth: { revenue: monthRev, salesCount: monthOrders.length, percentChange: 0 },
      recentTransactions: orders.slice(0, 5).map(o => ({
        id: o.id,
        reference: o.id,
        amount: o.amount,
        status: o.status,
        productName: o.product?.name || 'Produto',
        date: o.createdAt,
      })),
    };
  },
};

export default dbStore;
