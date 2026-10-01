import crypto from 'crypto';

export interface EscalePayCustomer {
  name: string;
  phone: string;
  email?: string;
}

export interface EscalePayCheckoutParams {
  amount: number; // in MZN
  reference: string;
  description: string;
  customer: EscalePayCustomer;
  paymentMethod?: 'MPESA' | 'EMOLA';
  returnUrl?: string;
  callbackUrl?: string;
}

export interface EscalePayCheckoutResponse {
  checkout_id: string;
  checkout_url: string;
  status: 'PENDING' | 'SUCCESS';
  expires_at?: string;
}

export class EscalePayProvider {
  private publicKey: string;
  private secretKey: string;
  private accountToken: string;
  private environment: 'Produção' | 'Sandbox';

  constructor(options?: {
    publicKey?: string;
    secretKey?: string;
    accountToken?: string;
    environment?: 'Produção' | 'Sandbox';
  }) {
    this.publicKey = options?.publicKey || process.env.ESCALEPAY_PUBLIC_KEY || '';
    this.secretKey = options?.secretKey || process.env.ESCALEPAY_SECRET_KEY || '';
    this.accountToken = options?.accountToken || process.env.ESCALEPAY_ACCOUNT_TOKEN || '';
    this.environment = options?.environment || 'Produção';
  }

  isConfigured(): boolean {
    return Boolean(this.publicKey && this.secretKey);
  }

  async createCheckout(params: EscalePayCheckoutParams): Promise<EscalePayCheckoutResponse> {
    if (!this.isConfigured()) {
      throw new Error('EscalePay: Public Key ou Secret Key não configurados.');
    }

    const apiUrl = this.environment === 'Sandbox'
      ? 'https://sandbox.escalepay.mz/v1/checkout'
      : 'https://api.escalepay.mz/v1/checkout';

    const payload = {
      account_token: this.accountToken || undefined,
      amount: Math.round(params.amount * 100) / 100,
      currency: 'MZN',
      reference: params.reference,
      description: params.description,
      customer: {
        name: params.customer.name,
        phone: params.customer.phone,
        email: params.customer.email,
      },
      payment_method: params.paymentMethod ? params.paymentMethod.toLowerCase() : 'all',
      redirect_url: params.returnUrl,
      callback_url: params.callbackUrl,
    };

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Public-Key': this.publicKey,
          'Authorization': `Bearer ${this.secretKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('EscalePay API Error:', res.status, errorText);
        throw new Error(`Erro na API do EscalePay (${res.status}): ${res.statusText}`);
      }

      const data = await res.json();
      return {
        checkout_id: data.checkout_id || data.id || `esc_${Date.now()}`,
        checkout_url: data.checkout_url || data.url || params.returnUrl || '',
        status: 'PENDING',
        expires_at: data.expires_at,
      };
    } catch (err: any) {
      console.error('EscalePay checkout exception:', err);
      throw new Error(err.message || 'Falha ao processar checkout via EscalePay.');
    }
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!this.secretKey) return true;

    try {
      const hash = crypto
        .createHmac('sha256', this.secretKey)
        .update(rawBody)
        .digest('hex');

      return hash === signature || signature.includes(hash);
    } catch {
      return false;
    }
  }
}

export const escalepayProvider = new EscalePayProvider();
