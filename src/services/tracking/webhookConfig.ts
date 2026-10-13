import fs from 'fs';
import path from 'path';

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

const INTEGRATIONS_FILE_PATH = path.join(process.cwd(), 'data', 'integrations.json');
const WEBHOOK_LOGS_FILE_PATH = path.join(process.cwd(), 'data', 'webhook-logs.json');

let memoryIntegrations: StoredIntegrationConfig[] | null = null;
let memoryLogs: WebhookLogEntry[] = [];

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
  } catch (err) {
    console.warn('Fallback to memory integrations:', err);
  }
  if (!memoryIntegrations) {
    memoryIntegrations = [...DEFAULT_INTEGRATION_CONFIGS];
  }
  return memoryIntegrations;
}

export function getAllIntegrations(): StoredIntegrationConfig[] {
  const list = ensureIntegrationsFile();
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

export function getIntegrationById(id: string): StoredIntegrationConfig | undefined {
  return getAllIntegrations().find((item) => item.id === id);
}

export function saveIntegrationConfig(
  id: string,
  updates: {
    status?: 'Ativo' | 'Inativo';
    fields?: Record<string, string>;
    events?: string[];
  }
): StoredIntegrationConfig[] {
  const all = getAllIntegrations();
  const idx = all.findIndex((item) => item.id === id);

  const updatedEntry: StoredIntegrationConfig =
    idx >= 0
      ? {
          ...all[idx],
          status: updates.status ?? all[idx].status,
          fields: {
            ...all[idx].fields,
            ...(updates.fields || {}),
          },
          events: updates.events ?? all[idx].events,
          updatedAt: new Date().toISOString(),
        }
      : {
          id,
          name: id,
          status: updates.status || 'Ativo',
          fields: updates.fields || {},
          events: updates.events || ['order.approved'],
          updatedAt: new Date().toISOString(),
        };

  if (idx >= 0) {
    all[idx] = updatedEntry;
  } else {
    all.push(updatedEntry);
  }

  memoryIntegrations = all;
  try {
    const dir = path.dirname(INTEGRATIONS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(INTEGRATIONS_FILE_PATH, JSON.stringify(all, null, 2), 'utf8');
  } catch (err) {
    console.warn('Could not persist integrations.json to disk, kept in memory:', err);
  }

  return all;
}

export function getWebhookLogs(limit = 30): WebhookLogEntry[] {
  try {
    if (fs.existsSync(WEBHOOK_LOGS_FILE_PATH)) {
      const content = fs.readFileSync(WEBHOOK_LOGS_FILE_PATH, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        memoryLogs = parsed;
      }
    }
  } catch {}
  return memoryLogs.slice(0, limit);
}

export function addWebhookLog(entry: Omit<WebhookLogEntry, 'id' | 'createdAt'>): WebhookLogEntry {
  const newEntry: WebhookLogEntry = {
    ...entry,
    id: `whlog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
  };

  const current = getWebhookLogs(100);
  const next = [newEntry, ...current].slice(0, 50);
  memoryLogs = next;

  try {
    const dir = path.dirname(WEBHOOK_LOGS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(WEBHOOK_LOGS_FILE_PATH, JSON.stringify(next, null, 2), 'utf8');
  } catch {}

  return newEntry;
}
