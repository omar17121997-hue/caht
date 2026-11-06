import { SmsCounterResult, SmsBatch } from '../types';

/**
 * Standard GSM 7-bit character set check
 * If characters are outside this set (e.g. Arabic, Cyrillic, emojis), UCS-2 encoding is used.
 */
export function isUnicodeText(text: string): boolean {
  if (!text) return false;
  // Standard GSM-7 characters pattern
  // Matches Arabic, Chinese, Emoji, accents outside GSM-7
  const gsm7Regex = /^[@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\x1bÆæßÉ !"#¤%&'()*+,\-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà^{}\\[~\]|€]*$/;
  return !gsm7Regex.test(text);
}

/**
 * Calculates SMS characters and message parts according to telecom standards
 */
export function calculateSmsSegments(text: string): SmsCounterResult {
  const charCount = text ? Array.from(text).length : 0;
  const isUnicode = isUnicodeText(text);

  if (charCount === 0) {
    return {
      charCount: 0,
      isUnicode,
      segmentCount: 0,
      remainingInSegment: isUnicode ? 70 : 160,
      segmentLimit: isUnicode ? 70 : 160,
    };
  }

  const singleLimit = isUnicode ? 70 : 160;
  const multiLimit = isUnicode ? 67 : 153;

  if (charCount <= singleLimit) {
    return {
      charCount,
      isUnicode,
      segmentCount: 1,
      remainingInSegment: singleLimit - charCount,
      segmentLimit: singleLimit,
    };
  }

  const segmentCount = Math.ceil(charCount / multiLimit);
  const remainingInSegment = (segmentCount * multiLimit) - charCount;

  return {
    charCount,
    isUnicode,
    segmentCount,
    remainingInSegment,
    segmentLimit: multiLimit,
  };
}

/**
 * Constructs the standard Android SMS URI
 * Supports both comma (Google Messages / AOSP standard) and semicolon (Samsung / RFC variants)
 */
export function buildSmsUri(
  recipients: string[],
  body: string,
  separator: ',' | ';' = ',',
  protocol: 'sms' | 'smsto' = 'sms'
): string {
  if (!recipients || recipients.length === 0) return '';

  const cleanRecipients = recipients.map(r => r.trim()).filter(Boolean);
  const joinedNumbers = cleanRecipients.join(separator);
  const encodedBody = encodeURIComponent(body);

  // Android standard: sms:NUMBER1,NUMBER2?body=MESSAGE
  if (encodedBody) {
    return `${protocol}:${joinedNumbers}?body=${encodedBody}`;
  }
  return `${protocol}:${joinedNumbers}`;
}

/**
 * Splits a list of recipients into safe chunks for mobile browsers
 * Preventing URL length overflow (which can cause silent failure on mobile web)
 */
export function chunkRecipients(
  recipients: string[],
  body: string,
  maxBatchSize: number = 25,
  separator: ',' | ';' = ',',
  protocol: 'sms' | 'smsto' = 'sms'
): SmsBatch[] {
  const batches: SmsBatch[] = [];
  const cleanRecipients = recipients.map(r => r.trim()).filter(Boolean);

  for (let i = 0; i < cleanRecipients.length; i += maxBatchSize) {
    const chunk = cleanRecipients.slice(i, i + maxBatchSize);
    const uri = buildSmsUri(chunk, body, separator, protocol);
    batches.push({
      index: Math.floor(i / maxBatchSize) + 1,
      recipients: chunk,
      uri,
    });
  }

  return batches;
}

/**
 * Detects whether the current device is Android / Mobile
 */
export function getDeviceInfo(): { isMobile: boolean; isAndroid: boolean } {
  if (typeof window === 'undefined' || !window.navigator) {
    return { isMobile: false, isAndroid: false };
  }
  const ua = window.navigator.userAgent.toLowerCase();
  const isAndroid = ua.includes('android');
  const isMobile = isAndroid || /iphone|ipad|ipod|mobile|blackberry|iemobile|kindle/.test(ua);

  return { isMobile, isAndroid };
}
