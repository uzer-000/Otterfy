import fs from 'fs';
import path from 'path';
import prisma from '@/lib/prisma';

export interface StoredIntegrationConfig {
  id: string; // 'webhook' | 'n8n' | 'utmify' | 'whatsapp' | 'salesfunnel' | 'membership'
  name: string;
  status: 'Ativo' | 'Inativo';
  fields: Record<string, string>;
  events?: string[];
  updatedAt?: string;
}

export interface WebhookLogEntry {
  id: string;
  url: string;
  event: string;
  orderId: string;
  productName: string;
  status: number;
  ok: boolean;
  durationMs: number;
  responsePreview?: string;
  error?: string;
  createdAt: string;
}

export interface StoredPushSubscription {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  updatedAt: string;
}

const INTEGRATIONS_FILE_PATH = path.join(process.cwd(), 'data', 'integrations.json');
const WEBHOOK_LOGS_FILE_PATH = path.join(process.cwd(), 'data', 'webhook-logs.json');
const PUSH_SUBS_FILE_PATH = path.join(process.cwd(), 'data', 'push-subscriptions.json');

const CONFIG_EMAIL_INTEGRATIONS = '__system_integrations__@otterfy.internal';
const CONFIG_EMAIL_LOGS = '__system_webhook_logs__@otterfy.internal';
const CONFIG_EMAIL_PUSH_SUBS = '__system_push_subs__@otterfy.internal';

let memoryIntegrations: StoredIntegrationConfig[] | null = null;
let memoryLogs: WebhookLogEntry[] = [];
let memoryPushSubs: StoredPushSubscription[] = [];

const DEFAULT_INTEGRATION_CONFIGS: StoredIntegrationConfig[] = [
  {
    id: 'webhook',
    name: 'Webhook',
    status: process.env.OTTERFY_GLOBAL_WEBHOOK_URL ? 'Ativo' : 'Inativo',
    fields: {
      webhookUrl: process.env.OTTERFY_GLOBAL_WEBHOOK_URL || '',
      secret: process.env.OTTERFY_GLOBAL_WEBHOOK_SECRET || '',
    },
    events: ['order.approved', 'order.created', 'order.declined', 'order.refunded'],
  },
  {
    id: 'n8n',
    name: 'n8n',
    status: 'Inativo',
    fields: {
      webhookUrl: '',
      authHeader: '',
    },
    events: ['order.approved', 'order.created', 'order.declined', 'order.refunded'],
  },
  {
    id: 'utmify',
    name: 'Utmify',
    status: 'Inativo',
    fields: {
      pixelId: '',
      apiToken: '',
    },
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    status: 'Inativo',
    fields: {
      phone: '',
      instanceKey: '',
    },
  },
  {
    id: 'salesfunnel',
    name: 'Funis de Vendas',
    status: 'Inativo',
    fields: {
      upsellUrl: '',
      downsellUrl: '',
    },
  },
  {
    id: 'membership',
    name: 'Áreas de Membro',
    status: 'Inativo',
    fields: {
      platform: '',
      apiUrl: '',
    },
  },
];

async function readDbJson<T>(emailKey: string): Promise<T | null> {
  try {
    const row = await prisma.user.findUnique({
      where: { email: emailKey },
      select: { avatarImage: true },
    });
    if (row?.avatarImage) {
      return JSON.parse(row.avatarImage) as T;
    }
  } catch {}
  return null;
}

async function writeDbJson(emailKey: string, name: string, value: unknown): Promise<void> {
  try {
    const serialized = JSON.stringify(value);
    await prisma.user.upsert({
      where: { email: emailKey },
      create: {
        email: emailKey,
        name,
        passwordHash: '__system_config_row__',
        avatarImage: serialized,
      },
      update: {
        avatarImage: serialized,
      },
    });
  } catch (err) {
    console.warn(`[SystemConfig DB Persist Warning (${name})]:`, err);
  }
}

function mergeWithDefaults(list: StoredIntegrationConfig[]): StoredIntegrationConfig[] {
  return DEFAULT_INTEGRATION_CONFIGS.map((def) => {
    const found = list.find((item) => item.id === def.id);
    if (!found) return def;
    return {
      ...def,
      ...found,
      fields: {
        ...def.fields,
        ...(found.fields || {}),
      },
      events: found.events && found.events.length > 0 ? found.events : def.events,
    };
  });
}

function ensureIntegrationsFile(): StoredIntegrationConfig[] {
  try {
    const dir = path.dirname(INTEGRATIONS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(INTEGRATIONS_FILE_PATH)) {
      fs.writeFileSync(INTEGRATIONS_FILE_PATH, JSON.stringify(DEFAULT_INTEGRATION_CONFIGS, null, 2), 'utf8');
      memoryIntegrations = DEFAULT_INTEGRATION_CONFIGS;
      return DEFAULT_INTEGRATION_CONFIGS;
    }
    const raw = fs.readFileSync(INTEGRATIONS_FILE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      memoryIntegrations = parsed;
      return parsed;
    }
  } catch {}
  if (!memoryIntegrations) {
    memoryIntegrations = [...DEFAULT_INTEGRATION_CONFIGS];
  }
  return memoryIntegrations;
}

export function getAllIntegrations(): StoredIntegrationConfig[] {
  const list = memoryIntegrations || ensureIntegrationsFile();
  return mergeWithDefaults(list);
}

export async function getAllIntegrationsAsync(): Promise<StoredIntegrationConfig[]> {
  const fromDb = await readDbJson<StoredIntegrationConfig[]>(CONFIG_EMAIL_INTEGRATIONS);
  if (Array.isArray(fromDb) && fromDb.length > 0) {
    memoryIntegrations = fromDb;
    return mergeWithDefaults(fromDb);
  }
  return getAllIntegrations();
}

export function getIntegrationById(id: string): StoredIntegrationConfig | undefined {
  return getAllIntegrations().find((item) => item.id === id);
}

export async function saveIntegrationConfig(
  id: string,
  updates: {
    status?: 'Ativo' | 'Inativo';
    fields?: Record<string, string>;
    events?: string[];
  }
): Promise<StoredIntegrationConfig[]> {
  const all = await getAllIntegrationsAsync();
  const idx = all.findIndex((item) => item.id === id);

  const mergedFields = {
    ...(idx >= 0 ? all[idx].fields : {}),
    ...(updates.fields || {}),
  };
  const hasActiveFieldUrl = Boolean(
    mergedFields.webhookUrl?.trim() || mergedFields.apiUrl?.trim() || mergedFields.pixelId?.trim() || mergedFields.apiToken?.trim()
  );
  const resolvedStatus: 'Ativo' | 'Inativo' =
    updates.status ?? (idx >= 0 ? all[idx].status : 'Ativo') ?? (hasActiveFieldUrl ? 'Ativo' : 'Inativo');

  const updatedEntry: StoredIntegrationConfig =
    idx >= 0
      ? {
          ...all[idx],
          status: resolvedStatus,
          fields: mergedFields,
          events: updates.events ?? all[idx].events,
          updatedAt: new Date().toISOString(),
        }
      : {
          id,
          name: id,
          status: resolvedStatus,
          fields: mergedFields,
          events: updates.events || ['order.approved', 'order.created', 'order.declined', 'order.refunded'],
          updatedAt: new Date().toISOString(),
        };

  if (idx >= 0) {
    all[idx] = updatedEntry;
  } else {
    all.push(updatedEntry);
  }

  memoryIntegrations = all;
  await writeDbJson(CONFIG_EMAIL_INTEGRATIONS, 'System Integrations Config', all);

  try {
    const dir = path.dirname(INTEGRATIONS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(INTEGRATIONS_FILE_PATH, JSON.stringify(all, null, 2), 'utf8');
  } catch {}

  return all;
}

export function getWebhookLogs(limit = 30): WebhookLogEntry[] {
  try {
    if (fs.existsSync(WEBHOOK_LOGS_FILE_PATH)) {
      const content = fs.readFileSync(WEBHOOK_LOGS_FILE_PATH, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > memoryLogs.length) {
        memoryLogs = parsed;
      }
    }
  } catch {}
  return memoryLogs.slice(0, limit);
}

export async function getWebhookLogsAsync(limit = 30): Promise<WebhookLogEntry[]> {
  const fromDb = await readDbJson<WebhookLogEntry[]>(CONFIG_EMAIL_LOGS);
  if (Array.isArray(fromDb)) {
    memoryLogs = fromDb;
    return fromDb.slice(0, limit);
  }
  return getWebhookLogs(limit);
}

export async function addWebhookLog(entry: Omit<WebhookLogEntry, 'id' | 'createdAt'>): Promise<WebhookLogEntry> {
  const newEntry: WebhookLogEntry = {
    ...entry,
    id: `whlog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
  };

  const current = await getWebhookLogsAsync(50);
  const next = [newEntry, ...current].slice(0, 40);
  memoryLogs = next;

  await writeDbJson(CONFIG_EMAIL_LOGS, 'System Webhook Logs', next);

  try {
    const dir = path.dirname(WEBHOOK_LOGS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(WEBHOOK_LOGS_FILE_PATH, JSON.stringify(next, null, 2), 'utf8');
  } catch {}

  return newEntry;
}

// ============================================================================
// WEB PUSH SUBSCRIPTIONS (Cross-device background push notifications)
// ============================================================================
export async function getPushSubscriptions(): Promise<StoredPushSubscription[]> {
  const fromDb = await readDbJson<StoredPushSubscription[]>(CONFIG_EMAIL_PUSH_SUBS);
  if (Array.isArray(fromDb)) {
    memoryPushSubs = fromDb;
    return fromDb;
  }
  try {
    if (fs.existsSync(PUSH_SUBS_FILE_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(PUSH_SUBS_FILE_PATH, 'utf8'));
      if (Array.isArray(parsed)) {
        memoryPushSubs = parsed;
        return parsed;
      }
    }
  } catch {}
  return memoryPushSubs;
}

export async function savePushSubscription(sub: StoredPushSubscription): Promise<StoredPushSubscription[]> {
  const current = await getPushSubscriptions();
  const filtered = current.filter((s) => s.endpoint !== sub.endpoint);
  const next = [{ ...sub, updatedAt: new Date().toISOString() }, ...filtered].slice(0, 25);
  memoryPushSubs = next;

  await writeDbJson(CONFIG_EMAIL_PUSH_SUBS, 'System Push Subscriptions', next);
  try {
    const dir = path.dirname(PUSH_SUBS_FILE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(PUSH_SUBS_FILE_PATH, JSON.stringify(next, null, 2), 'utf8');
  } catch {}
  return next;
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  const current = await getPushSubscriptions();
  const next = current.filter((s) => s.endpoint !== endpoint);
  memoryPushSubs = next;
  await writeDbJson(CONFIG_EMAIL_PUSH_SUBS, 'System Push Subscriptions', next);
  try {
    if (fs.existsSync(PUSH_SUBS_FILE_PATH)) {
      fs.writeFileSync(PUSH_SUBS_FILE_PATH, JSON.stringify(next, null, 2), 'utf8');
    }
  } catch {}
}
