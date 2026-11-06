import { Contact, SavedList, OperationHistoryItem, SmsDispatchConfig } from '../types';

const STORAGE_KEYS = {
  CONTACTS: 'sms_dispatcher_contacts_v1',
  SAVED_LISTS: 'sms_dispatcher_lists_v1',
  HISTORY: 'sms_dispatcher_history_v1',
  ACTIVE_LIST_ID: 'sms_dispatcher_active_list_id',
  DRAFT_MESSAGE: 'sms_dispatcher_draft_message',
  CONFIG: 'sms_dispatcher_config_v1',
};

export const DEFAULT_CONFIG: SmsDispatchConfig = {
  separator: ',',
  protocol: 'sms',
  batchSize: 25,
  defaultCountryCode: '+966',
};

// Initial realistic Arabic contacts seeded for immediate demonstration
const INITIAL_SEED_CONTACTS: Contact[] = [
  {
    id: 'seed-1',
    name: 'عبدالله السعدي',
    phone: '0501234567',
    cleanPhone: '+966501234567',
    note: 'عميل ذهبي - الرياض',
    isValid: true,
    validationReason: 'رقم صالح للاستخدام',
    selected: true,
    importedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    listId: 'default',
  },
  {
    id: 'seed-2',
    name: 'مها الشمري',
    phone: '0559876543',
    cleanPhone: '+966559876543',
    note: 'فرع الخبر - استفسار',
    isValid: true,
    validationReason: 'رقم صالح للاستخدام',
    selected: true,
    importedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    listId: 'default',
  },
  {
    id: 'seed-3',
    name: 'سليمان الحربي',
    phone: '0543210987',
    cleanPhone: '+966543210987',
    note: 'خدمة عملاء VIP',
    isValid: true,
    validationReason: 'رقم صالح للاستخدام',
    selected: true,
    importedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    listId: 'default',
  },
  {
    id: 'seed-4',
    name: 'ريم الدوسري',
    phone: '0567788990',
    cleanPhone: '+966567788990',
    note: 'حجز موعد قادم',
    isValid: true,
    validationReason: 'رقم صالح للاستخدام',
    selected: false,
    importedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    listId: 'default',
  },
  {
    id: 'seed-5',
    name: 'خالد الفهد (رقم قصير)',
    phone: '050123',
    cleanPhone: '050123',
    note: 'رقم ناقص من الملف',
    isValid: false,
    validationReason: 'رقم قصير جداً (6 أرقام)',
    selected: false,
    importedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    listId: 'default',
  },
];

const INITIAL_SEED_LISTS: SavedList[] = [
  {
    id: 'default',
    name: 'القائمة الرئيسية',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    count: 5,
  },
];

export function getStoredContacts(): Contact[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONTACTS);
    if (!raw) {
      saveStoredContacts(INITIAL_SEED_CONTACTS);
      return INITIAL_SEED_CONTACTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SEED_CONTACTS;
  }
}

export function saveStoredContacts(contacts: Contact[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
  } catch (err) {
    console.error('Failed to save contacts to LocalStorage:', err);
  }
}

export function getStoredLists(): SavedList[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_LISTS);
    if (!raw) {
      saveStoredLists(INITIAL_SEED_LISTS);
      return INITIAL_SEED_LISTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SEED_LISTS;
  }
}

export function saveStoredLists(lists: SavedList[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SAVED_LISTS, JSON.stringify(lists));
  } catch (err) {
    console.error('Failed to save lists to LocalStorage:', err);
  }
}

export function getStoredHistory(): OperationHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredHistory(history: OperationHistoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  } catch (err) {
    console.error('Failed to save history to LocalStorage:', err);
  }
}

export function getStoredConfig(): SmsDispatchConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveStoredConfig(config: SmsDispatchConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save config to LocalStorage:', err);
  }
}

export function getStoredDraft(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.DRAFT_MESSAGE) || 'مرحباً بكم، نود إعلامكم بتحديث مهم لخدماتنا. نسعد دائماً بتواصلكم معنا.';
  } catch {
    return '';
  }
}

export function saveStoredDraft(text: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DRAFT_MESSAGE, text);
  } catch (err) {
    console.error('Failed to save draft to LocalStorage:', err);
  }
}
