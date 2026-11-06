import * as XLSX from 'xlsx';
import { Contact } from '../types';
import { validatePhoneNumber, sanitizePhoneNumber } from './phoneUtils';

export interface ParsedSheetData {
  headers: string[];
  rawRows: Record<string, any>[];
  detectedPhoneCol: string;
  detectedNameCol: string;
  detectedNoteCol: string;
}

/**
 * Intelligent detector for columns containing phone numbers
 */
export function detectPhoneColumn(headers: string[], sampleRows: Record<string, any>[]): string {
  const phoneKeywords = [
    'جوال', 'هاتف', 'تلفون', 'موبايل', 'رقم الجوال', 'رقم الهاتف', 'أرقام', 'ارقام', 'رقم',
    'phone', 'mobile', 'tel', 'cell', 'telephone', 'cellular', 'contact', 'whatsapp', 'sms'
  ];

  // 1. Check by header name similarity
  for (const h of headers) {
    const cleanHeader = h.trim().toLowerCase();
    for (const kw of phoneKeywords) {
      if (cleanHeader.includes(kw)) {
        return h;
      }
    }
  }

  // 2. Fallback: inspect sample row data to find the column with the highest proportion of phone-like digits
  let bestCol = headers[0] || '';
  let highestScore = -1;

  for (const h of headers) {
    let score = 0;
    const testLimit = Math.min(sampleRows.length, 10);
    for (let i = 0; i < testLimit; i++) {
      const val = sampleRows[i]?.[h];
      if (val !== undefined && val !== null) {
        const clean = sanitizePhoneNumber(String(val));
        const digits = clean.replace(/\D/g, '');
        if (digits.length >= 7 && digits.length <= 15) {
          score += 1;
        }
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestCol = h;
    }
  }

  return bestCol;
}

/**
 * Detects name column
 */
export function detectNameColumn(headers: string[]): string {
  const nameKeywords = ['اسم', 'الاسم', 'اسم العميل', 'الجهة', 'name', 'client', 'customer', 'contact name', 'person'];
  for (const h of headers) {
    const clean = h.trim().toLowerCase();
    for (const kw of nameKeywords) {
      if (clean.includes(kw)) {
        return h;
      }
    }
  }
  return '';
}

/**
 * Detects notes column
 */
export function detectNoteColumn(headers: string[]): string {
  const noteKeywords = ['ملاحظات', 'ملاحظة', 'تفاصيل', 'note', 'notes', 'remark', 'details', 'info'];
  for (const h of headers) {
    const clean = h.trim().toLowerCase();
    for (const kw of noteKeywords) {
      if (clean.includes(kw)) {
        return h;
      }
    }
  }
  return '';
}

/**
 * Parses an ArrayBuffer / File of XLSX, XLS, or CSV using SheetJS
 */
export function parseSpreadsheet(data: ArrayBuffer): ParsedSheetData {
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('الملف فارغ ولا يحتوي على أي صفحات عمل.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  // Parse rows as raw JSON array of objects
  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('لم يتم العثور على أي صفوف أو بيانات داخل الملف.');
  }

  // Extract headers
  const headerSet = new Set<string>();
  rawRows.forEach(row => {
    Object.keys(row).forEach(key => headerSet.add(key));
  });

  const headers = Array.from(headerSet);
  const detectedPhoneCol = detectPhoneColumn(headers, rawRows);
  const detectedNameCol = detectNameColumn(headers);
  const detectedNoteCol = detectNoteColumn(headers);

  return {
    headers,
    rawRows,
    detectedPhoneCol,
    detectedNameCol,
    detectedNoteCol,
  };
}

export interface ExtractionResult {
  contacts: Contact[];
  totalRead: number;
  validCount: number;
  invalidCount: number;
  duplicatesRemoved: number;
}

/**
 * Extracts and deduplicates contacts from raw parsed rows using specified column mapping
 */
export function extractContactsFromRows(
  rows: Record<string, any>[],
  phoneCol: string,
  nameCol: string,
  noteCol: string,
  listId: string = 'default',
  existingCleanPhones: Set<string> = new Set()
): ExtractionResult {
  const contacts: Contact[] = [];
  const seenInBatch = new Set<string>();
  let duplicatesRemoved = 0;
  let validCount = 0;
  let invalidCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rawPhone = row[phoneCol];
    const name = nameCol && row[nameCol] ? String(row[nameCol]).trim() : undefined;
    const note = noteCol && row[noteCol] ? String(row[noteCol]).trim() : undefined;

    // Skip totally empty rows
    if (rawPhone === undefined || rawPhone === null || String(rawPhone).trim() === '') {
      continue;
    }

    const validation = validatePhoneNumber(rawPhone);
    const cleanPhone = validation.cleanPhone;

    // Check duplicate
    if (seenInBatch.has(cleanPhone) || existingCleanPhones.has(cleanPhone)) {
      duplicatesRemoved++;
      continue;
    }

    if (cleanPhone) {
      seenInBatch.add(cleanPhone);
    }

    if (validation.isValid) {
      validCount++;
    } else {
      invalidCount++;
    }

    contacts.push({
      id: `c_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
      phone: String(rawPhone).trim(),
      cleanPhone: validation.cleanPhone || String(rawPhone).trim(),
      name,
      note,
      isValid: validation.isValid,
      validationReason: validation.reason,
      selected: validation.isValid, // Auto-select valid by default
      importedAt: new Date().toISOString(),
      listId,
    });
  }

  return {
    contacts,
    totalRead: rows.length,
    validCount,
    invalidCount,
    duplicatesRemoved,
  };
}

/**
 * Generates and triggers download of a ready-to-test sample Excel file
 */
export function downloadSampleExcel(): void {
  const sampleData = [
    { 'الاسم': 'أحمد المنصوري', 'رقم الجوال': '0501234567', 'الملاحظات': 'عميل مميز' },
    { 'الاسم': 'سارة الخالد', 'رقم الجوال': '+966551239876', 'الملاحظات': 'فرع الرياض' },
    { 'الاسم': 'محمد بن صالح', 'رقم الجوال': '0543216789', 'الملاحظات': 'حجز مؤكد' },
    { 'الاسم': 'نورة السبيعي', 'رقم الجوال': '+971501112233', 'الملاحظات': 'استفسار' },
    { 'الاسم': 'خالد العتيبي', 'رقم الجوال': '0598765432', 'الملاحظات': 'عرض خاص' },
    { 'الاسم': 'فاطمة الزهراني', 'رقم الجوال': '0512345678', 'الملاحظات': 'خدمة عملاء' },
    { 'الاسم': 'رقم غير صالح للتجربة', 'رقم الجوال': '123', 'الملاحظات': 'اختبار الفرز' },
    { 'الاسم': 'أحمد مكرر (تجربة المنع)', 'رقم الجوال': '0501234567', 'الملاحظات': 'سيتم استبعاده تلقائياً' },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'قائمة_العملاء');

  XLSX.writeFile(workbook, 'عينة_أرقام_الهواتف_نظام_الرسائل.xlsx');
}

/**
 * Exports current contact list to XLSX
 */
export function exportContactsToExcel(contacts: Contact[], filename: string = 'جهات_الاتصال.xlsx'): void {
  const data = contacts.map(c => ({
    'الاسم': c.name || '',
    'رقم الهاتف': c.phone,
    'الرقم المعالج': c.cleanPhone,
    'الحالة': c.isValid ? 'صالح' : 'غير صالح',
    'سبب التحقق': c.validationReason,
    'الملاحظات': c.note || '',
    'تاريخ الإضافة': new Date(c.importedAt).toLocaleDateString('ar-SA'),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'جهات_الاتصال');

  XLSX.writeFile(workbook, filename);
}
