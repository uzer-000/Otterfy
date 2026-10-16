import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import dbStore from '@/lib/store';

export interface WithdrawalRecord {
  id: string;
  recipientName: string;
  method: 'MPESA' | 'EMOLA' | 'BANK';
  destination: string;
  bankName?: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: 'COMPLETED' | 'PENDING' | 'REJECTED';
  submittedAt: string;
  processedAt?: string;
  reference: string;
}

export interface PayoutAccount {
  id: string;
  type: 'MPESA' | 'EMOLA' | 'BANK';
  holderName: string;
  identifier: string; // phone or NIB
  bankName?: string;
  isDefault: boolean;
}

const WITHDRAWALS_FILE = path.join(process.cwd(), 'data', 'withdrawals.json');
const ACCOUNTS_FILE = path.join(process.cwd(), 'data', 'payout-accounts.json');

function ensureFiles() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(WITHDRAWALS_FILE)) {
    const initialWithdrawals: WithdrawalRecord[] = [
      {
        id: 'w-init-1',
        recipientName: 'Conta Principal M-Pesa',
        method: 'MPESA',
        destination: '+258 84 901 2345',
        amount: 25000,
        fee: 0,
        netAmount: 25000,
        status: 'COMPLETED',
        submittedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        processedAt: new Date(Date.now() - 86400000 * 3 + 120000).toISOString(),
        reference: 'SAQ-MP-98124',
      },
      {
        id: 'w-init-2',
        recipientName: 'Millennium BIM Empresa',
        method: 'BANK',
        destination: '0001 0000 1234 5678 9012 3',
        bankName: 'Millennium BIM',
        amount: 50000,
        fee: 0,
        netAmount: 50000,
        status: 'COMPLETED',
        submittedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        processedAt: new Date(Date.now() - 86400000 * 7 + 3600000).toISOString(),
        reference: 'SAQ-BIM-44321',
      },
    ];
    fs.writeFileSync(WITHDRAWALS_FILE, JSON.stringify(initialWithdrawals, null, 2), 'utf8');
  }

  if (!fs.existsSync(ACCOUNTS_FILE)) {
    const initialAccounts: PayoutAccount[] = [
      {
        id: 'acc-1',
        type: 'MPESA',
        holderName: 'Titular Otterfy',
        identifier: '+258 84 901 2345',
        isDefault: true,
      },
      {
        id: 'acc-2',
        type: 'BANK',
        holderName: 'Otterfy Digital Lda',
        identifier: '0001 0000 1234 5678 9012 3',
        bankName: 'Millennium BIM',
        isDefault: false,
      },
    ];
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(initialAccounts, null, 2), 'utf8');
  }
}

function getWithdrawals(): WithdrawalRecord[] {
  try {
    ensureFiles();
    const data = fs.readFileSync(WITHDRAWALS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveWithdrawals(list: WithdrawalRecord[]) {
  ensureFiles();
  fs.writeFileSync(WITHDRAWALS_FILE, JSON.stringify(list, null, 2), 'utf8');
}

function getAccounts(): PayoutAccount[] {
  try {
    ensureFiles();
    const data = fs.readFileSync(ACCOUNTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveAccounts(list: PayoutAccount[]) {
  ensureFiles();
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(list, null, 2), 'utf8');
}

export async function GET() {
  try {
    const allOrders = await dbStore.getOrders();
    const approvedOrders = allOrders.filter((o) => o.status === 'APPROVED');
    const pendingOrders = allOrders.filter((o) => o.status === 'PENDING');

    const grossRevenue = approvedOrders.reduce((sum, o) => sum + o.amount, 0);
    // Payzeno Wallet mode fee: 7% on confirmed payments
    const platformFeeRate = 0.07;
    const totalPlatformFee = Math.round(grossRevenue * platformFeeRate);
    const netRevenue = grossRevenue - totalPlatformFee;

    const withdrawals = getWithdrawals();
    const completedWithdrawals = withdrawals.filter((w) => w.status === 'COMPLETED');
    const totalWithdrawn = completedWithdrawals.reduce((sum, w) => sum + w.amount, 0);

    const pendingWithdrawals = withdrawals.filter((w) => w.status === 'PENDING');
    const totalPendingWithdrawalAmount = pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0);

    // Available for withdrawal = Net Revenue minus already withdrawn or pending withdrawal
    const availableBalance = Math.max(0, netRevenue - totalWithdrawn - totalPendingWithdrawalAmount);

    // Pending escrow: pending orders volume (estimated potential)
    const pendingEscrow = pendingOrders.reduce((sum, o) => sum + o.amount, 0);

    const accounts = getAccounts();

    return NextResponse.json({
      success: true,
      balance: {
        grossRevenue,
        platformFeeRate: 7,
        totalPlatformFee,
        netRevenue,
        availableBalance,
        pendingEscrow,
        totalWithdrawn,
        withdrawalFeeRate: 0, // 0% withdrawal fee in Payzeno Wallet mode
        settlementMode: 'WALLET', // 'WALLET' | 'DIRECT'
      },
      withdrawals,
      accounts,
    });
  } catch (err: unknown) {
    console.error('Error fetching balance & withdrawals:', err);
    return NextResponse.json({ error: 'Erro ao carregar dados de saldo.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'save_account') {
      const { type, holderName, identifier, bankName, isDefault } = body;
      if (!holderName || !identifier || !type) {
        return NextResponse.json({ error: 'Dados da conta incompletos.' }, { status: 400 });
      }

      const accounts = getAccounts();
      const newAccount: PayoutAccount = {
        id: `acc-${Date.now()}`,
        type,
        holderName,
        identifier,
        bankName,
        isDefault: Boolean(isDefault) || accounts.length === 0,
      };

      let updated = accounts;
      if (newAccount.isDefault) {
        updated = updated.map((a) => ({ ...a, isDefault: false }));
      }
      updated.unshift(newAccount);
      saveAccounts(updated);

      return NextResponse.json({ success: true, message: 'Conta salva com sucesso!', accounts: updated });
    }

    // Default action: Create withdrawal
    const { method, destination, bankName, amount, recipientName } = body;
    const withdrawAmount = Number(amount);

    if (!withdrawAmount || withdrawAmount < 50) {
      return NextResponse.json(
        { error: 'Montante mínimo de saque é de 50 MZN.' },
        { status: 400 }
      );
    }

    if (!destination || !recipientName) {
      return NextResponse.json(
        { error: 'Por favor indique o destinatário e a conta/número de destino.' },
        { status: 400 }
      );
    }

    // Recalculate balance to prevent over-withdrawing
    const allOrders = await dbStore.getOrders();
    const approvedOrders = allOrders.filter((o) => o.status === 'APPROVED');
    const grossRevenue = approvedOrders.reduce((sum, o) => sum + o.amount, 0);
    const netRevenue = grossRevenue - Math.round(grossRevenue * 0.07);

    const withdrawals = getWithdrawals();
    const lockedAmount = withdrawals
      .filter((w) => w.status === 'COMPLETED' || w.status === 'PENDING')
      .reduce((sum, w) => sum + w.amount, 0);

    const currentAvailable = Math.max(0, netRevenue - lockedAmount);

    if (withdrawAmount > currentAvailable) {
      return NextResponse.json(
        {
          error: `Saldo insuficiente. Disponível para saque: ${currentAvailable.toLocaleString(
            'pt-MZ'
          )} MZN`,
        },
        { status: 400 }
      );
    }

    const refCode = `SAQ-${method.slice(0, 3)}-${Math.floor(10000 + Math.random() * 90000)}`;

    const newWithdrawal: WithdrawalRecord = {
      id: `w-${Date.now()}`,
      recipientName,
      method,
      destination,
      bankName: method === 'BANK' ? bankName : undefined,
      amount: withdrawAmount,
      fee: 0, // 0% comissão no Payzeno
      netAmount: withdrawAmount,
      status: method === 'MPESA' || method === 'EMOLA' ? 'COMPLETED' : 'PENDING',
      submittedAt: new Date().toISOString(),
      processedAt:
        method === 'MPESA' || method === 'EMOLA'
          ? new Date().toISOString()
          : undefined,
      reference: refCode,
    };

    withdrawals.unshift(newWithdrawal);
    saveWithdrawals(withdrawals);

    return NextResponse.json({
      success: true,
      message: `Saque de ${withdrawAmount.toLocaleString('pt-MZ')} MZN registrado com sucesso via ${method}!`,
      withdrawal: newWithdrawal,
    });
  } catch (err: unknown) {
    console.error('Error processing withdrawal:', err);
    return NextResponse.json({ error: 'Erro ao processar saque.' }, { status: 500 });
  }
}
