import React, { useState, useEffect } from 'react';
import { 
  X, Smartphone, CheckCircle, AlertTriangle, QrCode, Copy, 
  ExternalLink, Layers, ArrowLeft, Check, RefreshCw, Send, ShieldCheck
} from 'lucide-react';
import QRCode from 'qrcode';
import { Contact, SmsDispatchConfig, SmsBatch } from '../types';
import { buildSmsUri, chunkRecipients, calculateSmsSegments, getDeviceInfo } from '../utils/smsUtils';

interface SmsDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedContacts: Contact[];
  messageText: string;
  config: SmsDispatchConfig;
  onRecordHistory: (status: 'opened' | 'confirmed' | 'cancelled', method: 'bulk_uri' | 'single_queue' | 'batch_chunk') => void;
  onOpenSequentialMode: () => void;
}

export const SmsDispatchModal: React.FC<SmsDispatchModalProps> = ({
  isOpen,
  onClose,
  selectedContacts,
  messageText,
  config,
  onRecordHistory,
  onOpenSequentialMode,
}) => {
  const [separator, setSeparator] = useState<',' | ';'>(config.separator || ',');
  const [protocol, setProtocol] = useState<'sms' | 'smsto'>(config.protocol || 'sms');
  const [showQr, setShowQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedNumbers, setCopiedNumbers] = useState(false);
  const [copiedUri, setCopiedUri] = useState(false);
  const [hasTriggeredIntent, setHasTriggeredIntent] = useState(false);

  const recipients = selectedContacts.map(c => c.cleanPhone || c.phone);
  const segments = calculateSmsSegments(messageText);
  const deviceInfo = getDeviceInfo();

  const isLargeBatch = recipients.length > config.batchSize;
  const batches: SmsBatch[] = chunkRecipients(recipients, messageText, config.batchSize, separator, protocol);

  const primaryUri = buildSmsUri(recipients, messageText, separator, protocol);

  // Generate QR Code for primary URI
  useEffect(() => {
    if (primaryUri) {
      QRCode.toDataURL(primaryUri, {
        margin: 1,
        width: 256,
        color: { dark: '#0f172a', light: '#ffffff' },
      })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('QR code error:', err));
    }
  }, [primaryUri]);

  if (!isOpen) return null;

  const handleLaunchPrimaryIntent = () => {
    setHasTriggeredIntent(true);
    onRecordHistory('opened', isLargeBatch ? 'batch_chunk' : 'bulk_uri');
    window.location.href = primaryUri;
  };

  const handleLaunchBatchIntent = (batch: SmsBatch) => {
    setHasTriggeredIntent(true);
    onRecordHistory('opened', 'batch_chunk');
    window.location.href = batch.uri;
  };

  const handleConfirmUserSent = () => {
    onRecordHistory('confirmed', isLargeBatch ? 'batch_chunk' : 'bulk_uri');
    onClose();
  };

  const handleCopyNumbersOnly = () => {
    navigator.clipboard.writeText(recipients.join(', '));
    setCopiedNumbers(true);
    setTimeout(() => setCopiedNumbers(false), 2000);
  };

  const handleCopyFullUri = () => {
    navigator.clipboard.writeText(primaryUri);
    setCopiedUri(true);
    setTimeout(() => setCopiedUri(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">تجهيز الرسالة لتطبيق الرسائل SMS</h2>
              <p className="text-xs text-slate-500">مراجعة المستلمين وتأكيد الإرسال عبر هاتف Android</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Post-Trigger Feedback Banner if already triggered */}
          {hasTriggeredIntent && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>تم إرسال أمر فتح تطبيق الرسائل إلى هاتفك</span>
              </div>
              <p className="text-xs text-emerald-700 leading-relaxed">
                هل تم فتح تطبيق الرسائل بنجاح واطّلعت على الرسالة؟ يمكنك تأكيد ذلك أدناه لحفظه في سجل العمليات.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={handleConfirmUserSent}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  أكدتُ الإرسال في التطبيق
                </button>
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  تم الفتح للمراجعة فقط
                </button>
              </div>
            </div>
          )}

          {/* Critical Consent / Android Safety Notice */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-slate-800 block">ضمان الخصوصية والتحكم التام:</span>
              <p className="leading-relaxed">
                لن يتم إرسال أي رسائل تلقائياً أو خصم أي رصيد دون موافقتك. ستقوم صفحة الويب بفتح تطبيق الرسائل الافتراضي على هاتفك مع تعبئة الأرقام والرسالة لتراجعها وتضغط زر الإرسال بنفسك.
              </p>
            </div>
          </div>

          {/* Dispatch Summary Card */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-800">تفاصيل العملية المجهزة:</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[11px]">عدد المستلمين</span>
                <span className="font-bold font-mono text-emerald-700 text-sm">
                  {recipients.length} مستلم
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[11px]">أجزاء الرسالة (SMS)</span>
                <span className="font-bold font-mono text-slate-900 text-sm">
                  {segments.segmentCount} جزء ({segments.charCount} حرف)
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 col-span-2 sm:col-span-1">
                <span className="text-slate-500 block text-[11px]">نوع الجهاز المكتشف</span>
                <span className="font-bold text-slate-900 text-sm">
                  {deviceInfo.isAndroid ? 'هاتف Android' : deviceInfo.isMobile ? 'هاتف محمول' : 'كمبيوتر / مكتبي'}
                </span>
              </div>
            </div>

            {/* Message Preview Quote */}
            <div>
              <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                نص الرسالة المجهز:
              </span>
              <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-800 leading-relaxed max-h-24 overflow-y-auto whitespace-pre-wrap">
                {messageText}
              </div>
            </div>
          </div>

          {/* Batches division if large */}
          {isLargeBatch && (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <Layers className="w-4 h-4 text-amber-600" />
                <span>
                  تم تقسيم الإرسال إلى {batches.length} دفعات لتفادي قيود متصفح الهاتف:
                </span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                تحتوي متصفحات الهواتف على حد أقصى لطول الروابط (~2,000 حرف). قمنا بتقسيم الأرقام إلى دفعات آمنة لضمان فتح التطبيق دون مشاكل.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {batches.map((batch) => (
                  <button
                    key={batch.index}
                    onClick={() => handleLaunchBatchIntent(batch)}
                    className="p-2.5 bg-white hover:bg-slate-50 border border-amber-300 rounded-lg text-xs font-semibold text-slate-800 flex items-center justify-between transition-colors cursor-pointer shadow-2xs"
                  >
                    <span>الدفعة {batch.index} ({batch.recipients.length} رقم)</span>
                    <span className="text-emerald-700 flex items-center gap-1 text-[11px]">
                      <span>إرسال</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Android Compatibility & Separator Settings */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                إعدادات توافق تطبيق الرسائل (Android OEM Compatibility):
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 cursor-pointer">
                <input
                  type="radio"
                  name="smsSeparator"
                  checked={separator === ','}
                  onChange={() => setSeparator(',')}
                  className="accent-emerald-600"
                />
                <div>
                  <div className="font-semibold text-slate-800">فاصلة ( , ) - الافتراضي</div>
                  <div className="text-[10px] text-slate-500">Google Messages ومعظم هواتف أندرويد</div>
                </div>
              </label>

              <label className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 cursor-pointer">
                <input
                  type="radio"
                  name="smsSeparator"
                  checked={separator === ';'}
                  onChange={() => setSeparator(';')}
                  className="accent-emerald-600"
                />
                <div>
                  <div className="font-semibold text-slate-800">فاصلة منقوطة ( ; )</div>
                  <div className="text-[10px] text-slate-500">بعض هواتف سامسونج القديمة والتوافق الإضافي</div>
                </div>
              </label>
            </div>
          </div>

          {/* Desktop QR Code Helper */}
          {!deviceInfo.isMobile && (
            <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between text-blue-900 font-bold">
                <div className="flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-blue-600" />
                  <span>هل تتصفح النظام من جهاز كمبيوتر؟</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQr(!showQr)}
                  className="text-blue-700 hover:text-blue-900 font-semibold underline cursor-pointer"
                >
                  {showQr ? 'إخفاء رمز QR' : 'إظهار رمز QR للمسح بالهاتف'}
                </button>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                نظراً لأن جهاز الكمبيوتر لا يحتوي على تطبيق رسائل هاتف، يمكنك مسح رمز الاستجابة السريعة بكاميرا هاتف Android ليفتح تطبيق الرسائل في الهاتف فوراً!
              </p>

              {showQr && qrDataUrl && (
                <div className="pt-2 flex flex-col items-center justify-center space-y-2 bg-white p-4 rounded-xl border border-blue-200">
                  <img src={qrDataUrl} alt="SMS QR Code" className="w-44 h-44 rounded-lg shadow-xs" />
                  <span className="text-[11px] text-slate-500 text-center">
                    وجّه كاميرا هاتف Android لمسح الرمز وسيطلب الهاتف فتح تطبيق الرسائل مباشرة.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Alternative: Sequential 1-by-1 mode notice */}
          <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-xs text-slate-700 border border-slate-200">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-slate-500" />
              <span>إذا لم يقبل هاتفك رابطاً جماعياً أو أردت إرسالاً مخصصاً:</span>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenSequentialMode();
              }}
              className="text-emerald-700 hover:text-emerald-800 font-bold underline cursor-pointer"
            >
              استخدام وضع الإرسال المتتابع (رقم برقم)
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyNumbersOnly}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              {copiedNumbers ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedNumbers ? 'تم نسخ الأرقام' : 'نسخ الأرقام فقط'}</span>
            </button>
            <button
              type="button"
              onClick={handleCopyFullUri}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              {copiedUri ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUri ? 'تم نسخ الرابط' : 'نسخ رابط sms:'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              إغلاق
            </button>
            <button
              type="button"
              onClick={handleLaunchPrimaryIntent}
              className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>فتح تطبيق الرسائل في الهاتف</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
