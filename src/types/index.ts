export interface Contact {
  id: string;
  phone: string;
  cleanPhone: string;
  name?: string;
  note?: string;
  isValid: boolean;
  validationReason: string;
  selected: boolean;
  importedAt: string;
  listId?: string;
}

export interface SavedList {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  count: number;
}

export interface OperationHistoryItem {
  id: string;
  timestamp: string;
  recipientsCount: number;
  recipientsSample: string[];
  message: string;
  status: 'prepared' | 'opened' | 'confirmed' | 'cancelled';
  method: 'bulk_uri' | 'single_queue' | 'batch_chunk' | 'clipboard';
  notes?: string;
}

export interface SmsDispatchConfig {
  separator: ',' | ';';
  protocol: 'sms' | 'smsto';
  batchSize: number;
  defaultCountryCode: string;
}

export interface SmsBatch {
  index: number;
  recipients: string[];
  uri: string;
}

export interface SmsCounterResult {
  charCount: number;
  isUnicode: boolean;
  segmentCount: number;
  remainingInSegment: number;
  segmentLimit: number;
}
