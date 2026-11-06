import React, { useState } from 'react';
import { X, Smartphone, ArrowRight, ArrowLeft, Check, SkipForward, Copy } from 'lucide-react';
import { Contact } from '../types';
import { buildSmsUri } from '../utils/smsUtils';

interface SequentialSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  messageText: string;
  onFinish: () => void;
}

export const SequentialSendModal: React.FC<SequentialSendModalProps> = ({
  isOpen,
  onClose,
  contacts,
  messageText,
  onFinish,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedSet, setCompletedSet] = useState<Set<number>>(new Set());

  if (!isOpen || contacts.length === 0) return null;

  const currentContact = contacts[currentIndex] || contacts[0];
  const total = contacts.length;
  const progressPercent = Math.round((completedSet.size / total) * 100);

  const handleOpenCurrent = () => {
    // Replace variables if present
    let personalizedBody = messageText;
    if (currentContact.name) {
      personalizedBody = personalizedBody.replace(/\{الاسم\}|\{name\}/gi, currentContact.name);
    }
    personalizedBody = personalizedBody.replace(/\{الرقم\}|\{phone\}/gi, currentContact.cleanPhone || currentContact.phone);

    const uri = buildSmsUri([currentContact.cleanPhone || currentContact.phone], personalizedBody);
    window.location.href = uri;

    setCompletedSet(prev => new Set(prev).add(currentIndex));
  };

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onFinish();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">وضع الإرسال المتتابع (رقم برقم)</h2>
              <p className="text-[11px] text-slate-500">حل بديل للأجهزة التي لا تدعم إرسال رابط موحد لأكثر من مستلم</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5">
          <div 
            className="bg-emerald-600 h-1.5 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>
              جهة الاتصال: <strong className="font-mono text-slate-900">{currentIndex + 1}</strong> من <strong className="font-mono">{total}</strong>
            </span>
            <span className="font-mono font-semibold text-emerald-700">
              {progressPercent}% مكتمل
            </span>
          </div>

          {/* Current Contact Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-900 text-sm">
                {currentContact.name || 'بدون اسم مسجل'}
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                completedSet.has(currentIndex)
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {completedSet.has(currentIndex) ? 'تم فتح المحادثة' : 'في الانتظار'}
              </span>
            </div>

            <div className="text-base font-mono font-bold text-emerald-700" dir="ltr">
              {currentContact.cleanPhone || currentContact.phone}
            </div>

            {currentContact.note && (
              <div className="text-xs text-slate-500">
                ملاحظة: {currentContact.note}
              </div>
            )}
          </div>

          {/* Message snippet */}
          <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed max-h-24 overflow-y-auto">
            {messageText}
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleOpenCurrent}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Smartphone className="w-4 h-4" />
              <span>فتح تطبيق الرسائل لهذا الرقم</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="flex-1 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>السابق</span>
              </button>

              <button
                onClick={handleNext}
                className="flex-1 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>{currentIndex === total - 1 ? 'إنهاء' : 'التالي'}</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
