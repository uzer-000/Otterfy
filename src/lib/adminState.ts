import prisma from './prisma';

export const ADMIN_EMAIL = 'nhacossfilipe@gmail.com';
const SYSTEM_ADMIN_STATE_EMAIL = '__system_admin_state__@otterfy.internal';

export type UserApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED';
export type ProductApprovalStatus = 'APPROVED' | 'PENDING' | 'REJECTED' | 'BLOCKED_BLACK';

export interface UserModerationRecord {
  status: UserApprovalStatus;
  updatedAt: string;
  note?: string;
}

export interface ProductModerationRecord {
  status: ProductApprovalStatus;
  updatedAt: string;
  reason?: string;
}

export interface AdminCloudState {
  users: Record<string, UserModerationRecord>;
  products: Record<string, ProductModerationRecord>;
}

export function isAdminEmail(email?: string | null): boolean {
  return Boolean(email && email.trim().toLowerCase() === ADMIN_EMAIL);
}

export async function getAdminCloudState(): Promise<AdminCloudState> {
  try {
    const row = await prisma.user.findUnique({
      where: { email: SYSTEM_ADMIN_STATE_EMAIL },
      select: { avatarImage: true },
    });
    if (row?.avatarImage) {
      const parsed = JSON.parse(row.avatarImage);
      return {
        users: parsed?.users && typeof parsed.users === 'object' ? parsed.users : {},
        products: parsed?.products && typeof parsed.products === 'object' ? parsed.products : {},
      };
    }
  } catch {
    // ignore
  }
  return { users: {}, products: {} };
}

export async function saveAdminCloudState(state: AdminCloudState): Promise<void> {
  const serialized = JSON.stringify(state);
  try {
    await prisma.user.upsert({
      where: { email: SYSTEM_ADMIN_STATE_EMAIL },
      update: { avatarImage: serialized },
      create: {
        email: SYSTEM_ADMIN_STATE_EMAIL,
        name: 'System Admin State',
        passwordHash: '$2a$12$systemadminstateplaceholderhash000000000000000000',
        avatarImage: serialized,
      },
    });
  } catch (err) {
    console.warn('[adminState] Failed to persist state:', err);
  }
}

export async function getUserApprovalStatus(email: string, userId?: string): Promise<UserApprovalStatus> {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (cleanEmail === ADMIN_EMAIL) return 'APPROVED';

  const state = await getAdminCloudState();
  const byEmail = state.users[cleanEmail];
  if (byEmail?.status) return byEmail.status;
  if (userId && state.users[userId]?.status) return state.users[userId].status;

  return 'PENDING';
}

export async function setUserApprovalStatus(
  email: string,
  status: UserApprovalStatus,
  userId?: string,
  note?: string
): Promise<UserModerationRecord> {
  const cleanEmail = (email || '').trim().toLowerCase();
  const state = await getAdminCloudState();
  const record: UserModerationRecord = {
    status: cleanEmail === ADMIN_EMAIL ? 'APPROVED' : status,
    updatedAt: new Date().toISOString(),
    note,
  };
  state.users[cleanEmail] = record;
  if (userId) {
    state.users[userId] = record;
  }
  await saveAdminCloudState(state);
  return record;
}

export async function setProductApprovalStatus(
  productId: string,
  status: ProductApprovalStatus,
  reason?: string
): Promise<ProductModerationRecord> {
  const state = await getAdminCloudState();
  const record: ProductModerationRecord = {
    status,
    updatedAt: new Date().toISOString(),
    reason,
  };
  state.products[productId] = record;
  await saveAdminCloudState(state);
  return record;
}
