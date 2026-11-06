import React, { useState, useEffect } from 'react';
import { X, Smartphone, Download, Check, Copy, QrCode, ArrowLeft, ExternalLink, CheckCircle2 } from 'lucide-react';
import QRCode from 'qrcode';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallPromptModal: React.FC<InstallPromptModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isAndroid, install } = usePWAInstall();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => {
    if (currentUrl) {
      QRCode.toDataURL(currentUrl, {
        margin: 1,
        width: 260,
        color: { dark: '#0f172a', light: '#ffffff' },
      })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error(err));
    }
  }, [currentUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-emerald-700 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">تثبيت التطبيق على هاتف Android</h2>
              <p className="text-xs text-emerald-100">استخدام كامل كأي تطبيق مثبت على هاتفك بدون متجر</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Status Badge */}
          {isInstalled ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>التطبيق مثبت حالياً ويعمل في وضع ملء الشاشة المستقل (Standalone).</span>
            </div>
          ) : (
            isInstallable && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                <div className="text-xs font-bold text-emerald-900">
                  متصفحك جاهز لتثبيت التطبيق بنقرة واحدة:
                </div>
                <button
                  onClick={handleInstallClick}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>تثبيت التطبيق الآن على الهاتف</span>
                </button>
              </div>
            )
          )}

          {/* Quick QR Code for PC users to scan with mobile */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-center">
            <span className="text-xs font-bold text-slate-800 block">
              امسح الرمز بكاميرا هاتف Android لفتح وتثبيت التطبيق فوراً:
            </span>
            {qrDataUrl && (
              <div className="flex flex-col items-center justify-center">
                <img src={qrDataUrl} alt="رابط التطبيق للجوال" className="w-44 h-44 rounded-xl shadow-xs border border-slate-200 bg-white p-2" />
              </div>
            )}
            <p className="text-[11px] text-slate-500">
              افتح كاميرا الهاتف ووجّهها للرمز، ثم اضغط على الرابط الأصفر الذي يظهر لك.
            </p>
          </div>

          {/* Step by step manual installation steps */}
          <div className="space-y-3 pt-1">
            <span className="text-xs font-bold text-slate-800 block">
              طريقة التثبيت اليدوي من متصفح Chrome على الهاتف:
            </span>
            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-mono">
                  1
                </div>
                <div>
                  افتح الرابط في متصفح <strong>Google Chrome</strong> على الهاتف.
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-mono">
                  2
                </div>
                <div>
                  اضغط على زر <strong>النقاط الثلاث (⋮)</strong> في أعلى زاوية المتصفح.
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-mono">
                  3
                </div>
                <div>
                  اختر <strong>"تثبيت التطبيق" (Install App)</strong> أو <strong>"الإضافة إلى الشاشة الرئيسية"</strong>.
                </div>
              </div>
            </div>
          </div>

          {/* Copy link bar */}
          <div className="pt-2 flex items-center justify-between gap-2 p-3 bg-slate-100 rounded-xl text-xs">
            <div className="truncate text-slate-600 font-mono text-[11px]" dir="ltr">
              {currentUrl}
            </div>
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 font-semibold rounded-lg flex items-center gap-1 shrink-0 transition-colors shadow-2xs"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'تم النسخ' : 'نسخ الرابط'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
