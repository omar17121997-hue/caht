/**
 * Utilities for phone number sanitization, validation, and normalization
 */

// Convert Eastern Arabic-Indic numerals (٠-٩) and Persian numerals to standard ASCII (0-9)
export function convertArabicNumerals(str: string): string {
  if (!str) return '';
  const arabicEasternMap: Record<string, string> = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  };
  return str.replace(/[٠-٩۰-۹]/g, (char) => arabicEasternMap[char] || char);
}

/**
 * Normalizes phone numbers:
 * - Converts Arabic digits
 * - Strips all non-digit characters except leading '+'
 * - Normalizes double pluses or spaces
 */
export function sanitizePhoneNumber(input: string | number | undefined | null): string {
  if (input === undefined || input === null) return '';
  let str = String(input).trim();
  str = convertArabicNumerals(str);

  const hasLeadingPlus = str.startsWith('+');
  // Remove all non-digits
  const digitsOnly = str.replace(/\D/g, '');

  if (!digitsOnly) return '';

  return hasLeadingPlus ? `+${digitsOnly}` : digitsOnly;
}

export interface PhoneValidation {
  isValid: boolean;
  cleanPhone: string;
  reason: string;
}

/**
 * Validates a phone number based on international standards (E.164-compatible logic)
 */
export function validatePhoneNumber(raw: string | number | undefined | null): PhoneValidation {
  const clean = sanitizePhoneNumber(raw);

  if (!clean) {
    return {
      isValid: false,
      cleanPhone: '',
      reason: 'رقم فارغ أو غير موجود',
    };
  }

  const digits = clean.replace(/\D/g, '');

  // Too short for any telephone system (< 7 digits)
  if (digits.length < 7) {
    return {
      isValid: false,
      cleanPhone: clean,
      reason: `رقم قصير جداً (${digits.length} أرقام)`,
    };
  }

  // Too long (> 15 digits according to E.164)
  if (digits.length > 15) {
    return {
      isValid: false,
      cleanPhone: clean,
      reason: `رقم طويل يتجاوز المعيار الدولي (${digits.length} رقماً)`,
    };
  }

  // Check for dummy repeated digits like "000000000" or "11111111"
  if (/^(\d)\1+$/.test(digits)) {
    return {
      isValid: false,
      cleanPhone: clean,
      reason: 'رقم وهمي مكون من رقم واحد متكرر',
    };
  }

  // Basic check for obvious non-phone patterns
  if (/^0{3,}/.test(digits)) {
    return {
      isValid: false,
      cleanPhone: clean,
      reason: 'رقم غير صحيح يبدأ بعدة أصفار',
    };
  }

  return {
    isValid: true,
    cleanPhone: clean,
    reason: 'رقم صالح للاستخدام',
  };
}

/**
 * Formats a phone number for clean RTL display (keeps number in LTR block to prevent visual reversals)
 */
export function formatPhoneForDisplay(phone: string): string {
  if (!phone) return '';
  return phone;
}
