import fs from 'fs';
import path from 'path';
import { zenofyProvider } from './zenofy';
import { E2PaymentProvider } from './e2payment';
import { EscalePayProvider } from './escalepay';

export interface StoredGatewayConfig {
  id: string; // 'zenofy' | 'e2payment' | 'escalepay' | 'lojou'
  name: string;
  status: 'Ativo' | 'Inativo';
  environment: 'Produção' | 'Sandbox';
  credentials: Record<string, string>;
  updatedAt?: string;
}

const GATEWAYS_FILE_PATH = path.join(process.cwd(), 'data', 'gateways.json');

function ensureGatewaysFile() {
  const dir = path.dirname(GATEWAYS_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(GATEWAYS_FILE_PATH)) {
    const initialConfigs: StoredGatewayConfig[] = [
      {
        id: 'zenofy',
        name: 'Zenofy APIs',
        status: process.env.ZENOFY_API_KEY ? 'Ativo' : 'Ativo',
        environment: 'Produção',
        credentials: {
          apiKey: process.env.ZENOFY_API_KEY || '',
          productId: process.env.ZENOFY_PRODUCT_ID || '',
          webhookSecret: process.env.ZENOFY_WEBHOOK_SECRET || '',
        },
      },
      {
        id: 'e2payment',
        name: 'E2 Payment',
        status: process.env.E2PAYMENT_CLIENT_ID ? 'Ativo' : 'Inativo',
        environment: 'Produção',
        credentials: {
          clientId: process.env.E2PAYMENT_CLIENT_ID || '',
          clientSecret: process.env.E2PAYMENT_CLIENT_SECRET || '',
          callbackUrl: '',
        },
      },
      {
        id: 'escalepay',
        name: 'EscalePay API',
        status: process.env.ESCALEPAY_PUBLIC_KEY ? 'Ativo' : 'Inativo',
        environment: 'Produção',
        credentials: {
          publicKey: process.env.ESCALEPAY_PUBLIC_KEY || '',
          secretKey: process.env.ESCALEPAY_SECRET_KEY || '',
          accountToken: process.env.ESCALEPAY_ACCOUNT_TOKEN || '',
        },
      },
      {
        id: 'lojou',
        name: 'Lojou API',
        status: 'Inativo',
        environment: 'Produção',
        credentials: {
          merchantId: '',
          accessToken: '',
          webhookKey: '',
        },
      },
    ];
    fs.writeFileSync(GATEWAYS_FILE_PATH, JSON.stringify(initialConfigs, null, 2), 'utf8');
  }
}

export function getAllGateways(): StoredGatewayConfig[] {
  try {
    ensureGatewaysFile();
    const content = fs.readFileSync(GATEWAYS_FILE_PATH, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    console.error('Erro ao ler gateways.json:', e);
    return [];
  }
}

export function getGatewayById(id: string): StoredGatewayConfig | undefined {
  const all = getAllGateways();
  return all.find((g) => g.id === id);
}

export function saveGatewayConfig(
  id: string,
  updates: Partial<StoredGatewayConfig>
): StoredGatewayConfig[] {
  ensureGatewaysFile();
  const all = getAllGateways();
  const index = all.findIndex((g) => g.id === id);

  if (index >= 0) {
    all[index] = {
      ...all[index],
      ...updates,
      credentials: {
        ...all[index].credentials,
        ...(updates.credentials || {}),
      },
      updatedAt: new Date().toISOString(),
    };
  } else {
    all.push({
      id,
      name: updates.name || id,
      status: updates.status || 'Inativo',
      environment: updates.environment || 'Produção',
      credentials: updates.credentials || {},
      updatedAt: new Date().toISOString(),
    });
  }

  fs.writeFileSync(GATEWAYS_FILE_PATH, JSON.stringify(all, null, 2), 'utf8');
  return all;
}

export function getActiveGateway(): StoredGatewayConfig | null {
  const all = getAllGateways();
  // Return the first active gateway
  return all.find((g) => g.status === 'Ativo') || null;
}

export interface DispatchCheckoutParams {
  orderId: string;
  amount: number;
  productName: string;
  hasOrderBump?: boolean;
  orderBumpTitle?: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  paymentMethod?: 'MPESA' | 'EMOLA';
  baseUrl: string;
}

export interface DispatchCheckoutResult {
  gatewayId: string;
  checkoutUrl: string;
  transactionId?: string;
  status: 'PENDING' | 'APPROVED' | 'REDIRECT';
  mode: 'real' | 'demo';
  message?: string;
}

export async function dispatchCheckout(params: DispatchCheckoutParams): Promise<DispatchCheckoutResult> {
  const activeGateway = getActiveGateway();
  const description = params.hasOrderBump
    ? `${params.productName} + ${params.orderBumpTitle || 'Order Bump'}`
    : params.productName;

  // 1. Zenofy
  if (activeGateway?.id === 'zenofy') {
    const creds = activeGateway.credentials;
    const apiKey = creds.apiKey || process.env.ZENOFY_API_KEY;

    if (apiKey) {
      const res = await zenofyProvider.createCheckoutOrder({
        amount: params.amount,
        reference: params.orderId,
        description,
        customer: params.customer,
        successUrl: `${params.baseUrl}/pay/success?ref=${params.orderId}`,
        cancelUrl: `${params.baseUrl}/pay/cancel?ref=${params.orderId}`,
      });

      return {
        gatewayId: 'zenofy',
        checkoutUrl: res.checkout_url,
        transactionId: res.checkout_id,
        status: 'REDIRECT',
        mode: 'real',
      };
    }
  }

  // 2. E2Payment (USSD Push Native)
  if (activeGateway?.id === 'e2payment') {
    const creds = activeGateway.credentials;
    const clientId = creds.clientId || process.env.E2PAYMENT_CLIENT_ID;
    const clientSecret = creds.clientSecret || process.env.E2PAYMENT_CLIENT_SECRET;

    if (clientId && clientSecret) {
      const e2 = new E2PaymentProvider({
        clientId,
        clientSecret,
        environment: activeGateway.environment,
      });

      const res = await e2.createCharge({
        amount: params.amount,
        reference: params.orderId,
        description,
        customer: params.customer,
        callbackUrl: `${params.baseUrl}/api/webhooks/e2payment`,
      });

      return {
        gatewayId: 'e2payment',
        checkoutUrl: `${params.baseUrl}/pay/success?ref=${params.orderId}&gateway=e2payment&status=pending`,
        transactionId: res.transaction_id,
        status: 'PENDING',
        mode: 'real',
        message: 'Pedido de pagamento USSD enviado para o telemóvel do cliente.',
      };
    }
  }

  // 3. EscalePay
  if (activeGateway?.id === 'escalepay') {
    const creds = activeGateway.credentials;
    const publicKey = creds.publicKey || process.env.ESCALEPAY_PUBLIC_KEY;
    const secretKey = creds.secretKey || process.env.ESCALEPAY_SECRET_KEY;

    if (publicKey && secretKey) {
      const ep = new EscalePayProvider({
        publicKey,
        secretKey,
        accountToken: creds.accountToken,
        environment: activeGateway.environment,
      });

      const res = await ep.createCheckout({
        amount: params.amount,
        reference: params.orderId,
        description,
        customer: params.customer,
        paymentMethod: params.paymentMethod,
        returnUrl: `${params.baseUrl}/pay/success?ref=${params.orderId}`,
        callbackUrl: `${params.baseUrl}/api/webhooks/escalepay`,
      });

      return {
        gatewayId: 'escalepay',
        checkoutUrl: res.checkout_url,
        transactionId: res.checkout_id,
        status: 'REDIRECT',
        mode: 'real',
      };
    }
  }

  // 4. Default / Fallback Mode (Demo Instant Approval)
  return {
    gatewayId: activeGateway?.id || 'demo',
    checkoutUrl: `${params.baseUrl}/pay/success?ref=${params.orderId}`,
    transactionId: `TX-DEMO-${Math.floor(100000 + Math.random() * 900000)}`,
    status: 'APPROVED',
    mode: 'demo',
  };
}
