import React, { useState } from 'react';
import { 
  Send, Smartphone, Users, Sparkles, AlertCircle, Copy, Check, MessageCircle, FileText, Info
} from 'lucide-react';
import { calculateSmsSegments } from '../utils/smsUtils';
import { Contact } from '../types';

interface MessageComposerProps {
  messageText: string;
  setMessageText: (text: string) => void;
  selectedContacts: Contact[];
  onOpenDispatchModal: () => void;
  onNavigateToContacts: () => void;
}

const SMS_TEMPLATES = [
  {
    title: 'تذكير بالموعد',
    text: 'عزيزي العميل، نذكركم بموعدكم القادم غداً الساعة 4:00 مساءً. نرجو الحضور قبل الموعد بـ 10 دقائق. لتأكيد الحضور أو التعديل، نرجو الرد على هذه الرسالة.',
  },
  {
    title: 'عرض ترويجي وتخفيضات',
    text: 'عروض حصرية لفترة محدودة! استمتع بخصم 30% على كافة خدماتنا ومنتجاتنا عند استخدام الرمز الترويجي SPECIAL30. زوروا فرعنا اليوم أو تواصلوا معنا.',
  },
  {
    title: 'تأكيد استلام الطلب',
    text: 'مرحباً بك! تم استلام طلبك بنجاح وجارٍ تجهيزه بعناية للشحن. سنقوم بإرسال رقم التتبع فور تسليم الشحنة لشركة النقل. شكراً لثقتكم بنا.',
  },
  {
    title: 'إشعار تحديث هام',
    text: 'عملاءنا الأعزاء، نود إحاطتكم علماً بأوقات العمل الجديدة خلال عطلة نهاية الأسبوع من الساعة 9 صباحاً حتى 10 مساءً. نسعد بخدمتكم دائماً.',
  },
  {
    title: 'تهنئة وتواصل',
    text: 'يسر فريقنا أن يتقدم إليكم بأطيب التهاني وأصدق التمنيات، ونتمنى لكم أياماً عامرة بالخير والتوفيق والنجاح الدائم.',
  },
];

export const MessageComposer: React.FC<MessageComposerProps> = ({
  messageText,
  setMessageText,
  selectedContacts,
  onOpenDispatchModal,
  onNavigateToContacts,
}) => {
  const [copiedPreview, setCopiedPreview] = useState(false);
  const counter = calculateSmsSegments(messageText);

  const selectedCount = selectedContacts.length;

  const handleInsertTag = (tag: string) => {
    setMessageText(messageText ? `${messageText} ${tag}` : tag);
  };

  const handleCopyPreview = () => {
    navigator.clipboard.writeText(messageText);
    setCopiedPreview(true);
    setTimeout(() => setCopiedPreview(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Composer Editor (7 cols) */}
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">إنشاء رسالة SMS</h2>
                <p className="text-xs text-slate-500">اكتب نص الرسالة التي سيتم تمريرها لتطبيق الرسائل</p>
              </div>
            </div>

            {/* Recipients Counter Chip */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500">المستلمون:</span>
              <button
                onClick={onNavigateToContacts}
                className="px-2.5 py-1 bg-emerald-50 text-emerald-800 font-bold rounded-md border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer flex items-center gap-1 font-mono"
              >
                <Users className="w-3.5 h-3.5" />
                <span>{selectedCount} مستلم</span>
              </button>
            </div>
          </div>

          {/* Quick Arabic Templates Drawer */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>نماذج رسائل جاهزة سريعة:</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SMS_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMessageText(tmpl.text)}
                  className="px-2.5 py-1 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  {tmpl.title}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div className="space-y-2">
            <div className="relative">
              <textarea
                rows={7}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="اكتب نص الرسالة هنا... مثال: مرحباً بكم، نود تذكيركم بموعدكم..."
                className="w-full p-4 text-sm leading-relaxed bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors resize-y"
              />
            </div>

            {/* Character & Segment Counter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
              <div className="flex items-center gap-3">
                <div>
                  عدد الأحرف: <strong className="font-mono text-slate-900 font-bold">{counter.charCount}</strong>
                </div>
                <span>·</span>
                <div>
                  أجزاء الرسالة: <strong className="font-mono text-emerald-700 font-bold">{counter.segmentCount} SMS</strong>
                </div>
                <span>·</span>
                <div>
                  المتبقي في الجزء: <strong className="font-mono text-slate-900">{counter.remainingInSegment}</strong>
                </div>
              </div>

              <div className="text-[11px] text-slate-500">
                {counter.isUnicode ? (
                  <span className="text-emerald-700 font-medium">ترميز عربي (Unicode / 70 حرفاً للجزء)</span>
                ) : (
                  <span className="text-slate-600">ترميز إنجليزي قياسي (GSM-7 / 160 حرفاً للجزء)</span>
                )}
              </div>
            </div>
          </div>

          {/* Variables helper */}
          <div className="flex items-center gap-2 text-xs text-slate-600 pt-1">
            <span className="font-semibold">إدراج متغيرات:</span>
            <button
              type="button"
              onClick={() => handleInsertTag('{الاسم}')}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-[11px] font-mono cursor-pointer"
            >
              + {'{الاسم}'}
            </button>
            <button
              type="button"
              onClick={() => handleInsertTag('{الرقم}')}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-[11px] font-mono cursor-pointer"
            >
              + {'{الرقم}'}
            </button>
          </div>

          {/* Primary Action Button */}
          <div className="pt-3">
            <button
              onClick={onOpenDispatchModal}
              disabled={!messageText.trim() || selectedCount === 0}
              className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm sm:text-base font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Smartphone className="w-5 h-5" />
              <span>تجهيز وإرسال الرسالة إلى ({selectedCount}) مستلم عبر Android</span>
            </button>

            {selectedCount === 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 mt-2 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>لم يتم تحديد أي أرقام بعد. يرجى الذهاب لجدول جهات الاتصال وتحديد الأرقام أولاً.</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Android Phone Live Preview (5 cols) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>معاينة الرسالة كما ستظهر على هاتف Android</span>
            </div>
            <button
              onClick={handleCopyPreview}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              {copiedPreview ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ النص</span>
                </>
              )}
            </button>
          </div>

          {/* Android Device Mockup Shell */}
          <div className="w-full max-w-sm mx-auto bg-slate-900 rounded-[2.5rem] p-3 shadow-xl border-4 border-slate-800">
            {/* Speaker & camera notch */}
            <div className="w-20 h-4 bg-slate-800 rounded-full mx-auto mb-3 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-950"></div>
            </div>

            {/* Screen */}
            <div className="bg-slate-100 rounded-[2rem] p-4 min-h-[380px] flex flex-col justify-between text-slate-800 font-sans">
              {/* Header inside phone */}
              <div className="border-b border-slate-200 pb-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[11px]">
                    SMS
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">رسائل Google الافتراضية</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {selectedCount} مستلم محدد
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">الآن</div>
              </div>

              {/* Message Bubble area */}
              <div className="my-auto py-4 space-y-2">
                <div className="text-center">
                  <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md">
                    اليوم
                  </span>
                </div>

                {messageText.trim() ? (
                  <div className="bg-emerald-600 text-white p-3.5 rounded-2xl rounded-br-xs max-w-[90%] mr-auto shadow-xs space-y-1">
                    <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">
                      {messageText}
                    </p>
                    <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-100 font-mono">
                      <span>{new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                      <Check className="w-3 h-3 text-emerald-200" />
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center text-xs text-slate-400">
                    اكتب نص الرسالة في المربع ليظهر هنا في شكل رسالة SMS حية...
                  </div>
                )}
              </div>

              {/* Phone Footer Input bar */}
              <div className="bg-white rounded-full px-3 py-1.5 border border-slate-200 flex items-center justify-between text-xs text-slate-400">
                <span>رسالة نصية قصيرة SMS...</span>
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <Send className="w-3 h-3 -rotate-45" />
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>
              عند الضغط على إرسال، سينتقل هذا النص وقائمة المستلمين إلى تطبيق الرسائل المثبت على هاتفك مباشرة.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
