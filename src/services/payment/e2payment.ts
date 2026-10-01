import crypto from 'crypto';

export interface E2PaymentCustomer {
  name: string;
  phone: string; // Format +258XXXXXXXXX or 258XXXXXXXXX
  email?: string;
}

export interface E2PaymentChargeParams {
  amount: number; // in MZN
  reference: string;
  description: string;
  customer: E2PaymentCustomer;
  callbackUrl?: string;
}

export interface E2PaymentChargeResponse {
  success: boolean;
  transaction_id: string;
  reference: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  message: string;
}

export class E2PaymentProvider {
  private clientId: string;
  private clientSecret: string;
  private environment: 'Produção' | 'Sandbox';

  constructor(options?: { clientId?: string; clientSecret?: string; environment?: 'Produção' | 'Sandbox' }) {
    this.clientId = options?.clientId || process.env.E2PAYMENT_CLIENT_ID || '';
    this.clientSecret = options?.clientSecret || process.env.E2PAYMENT_CLIENT_SECRET || '';
    this.environment = options?.environment || 'Produção';
  }

  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  /**
   * Normalizes Moz phone numbers to 258XXXXXXXXX format
   */
  private formatPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('258') && digits.length === 12) {
      return digits;
    }
    if (digits.length === 9) {
      return `258${digits}`;
    }
    return digits;
  }

  /**
   * Triggers USSD Push C2B on client mobile phone (M-Pesa / e-Mola)
   */
  async createCharge(params: E2PaymentChargeParams): Promise<E2PaymentChargeResponse> {
    if (!this.isConfigured()) {
      throw new Error('E2Payment: Client ID ou Client Secret não configurados.');
    }

    const formattedPhone = this.formatPhone(params.customer.phone);
    const apiUrl = this.environment === 'Sandbox'
      ? 'https://sandbox.e2payment.com/v1/c2b'
      : 'https://api.e2payment.com/v1/c2b';

    const payload = {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      amount: Math.round(params.amount),
      phone: formattedPhone,
      reference: params.reference,
      description: params.description,
      callback_url: params.callbackUrl,
    };

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Client-ID': this.clientId,
          'X-Client-Secret': this.clientSecret,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('E2Payment API Error:', res.status, errorText);
        throw new Error(`Erro na comunicação com a API E2Payment: ${res.statusText}`);
      }

      const data = await res.json();
      return {
        success: true,
        transaction_id: data.transaction_id || data.id || `E2P-${Date.now()}`,
        reference: params.reference,
        status: data.status === 'SUCCESS' ? 'SUCCESS' : 'PENDING',
        message: data.message || 'Solicitação de pagamento USSD enviada ao cliente com sucesso.',
      };
    } catch (err: any) {
      console.error('E2Payment Charge exception:', err);
      throw new Error(err.message || 'Falha ao processar pagamento via E2Payment.');
    }
  }

  /**
   * Verify signature or basic auth from E2Payment Webhook/IPN
   */
  verifyWebhook(headers: Headers, rawBody: string): boolean {
    const signature = headers.get('x-e2-signature') || headers.get('authorization');
    if (!signature) {
      // If no secret configured, accept in development
      if (!this.clientSecret) return true;
      return false;
    }

    // Check HMAC-SHA256
    try {
      const expected = crypto
        .createHmac('sha256', this.clientSecret)
        .update(rawBody)
        .digest('hex');

      return signature.includes(expected);
    } catch {
      return false;
    }
  }
}

export const e2paymentProvider = new E2PaymentProvider();
