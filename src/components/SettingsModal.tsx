import React, { useRef } from 'react';
import { X, Settings, Save, Download, Upload, RotateCcw, Smartphone, ShieldCheck } from 'lucide-react';
import { SmsDispatchConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SmsDispatchConfig;
  onSaveConfig: (cfg: SmsDispatchConfig) => void;
  onExportAllData: () => void;
  onImportAllData: (jsonData: string) => void;
  onResetAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onExportAllData,
  onImportAllData,
  onResetAllData,
}) => {
  const [formData, setFormData] = React.useState<SmsDispatchConfig>(config);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportAllData(content);
        onClose();
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">إعدادات نظام الإرسال</h2>
              <p className="text-xs text-slate-500">تخصيص روابط Android والنسخ الاحتياطي</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Separator preference */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              الفاصل بين أرقام الهواتف في الرابط (SMS Separator):
            </label>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="radio"
                  name="separator"
                  checked={formData.separator === ','}
                  onChange={() => setFormData({ ...formData, separator: ',' })}
                  className="accent-emerald-600"
                />
                <div>
                  <strong className="block text-slate-800">فاصلة ( , )</strong>
                  <span className="text-[10px] text-slate-500">Google Messages ومعظم أجهزة Android</span>
                </div>
              </label>

              <label className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="radio"
                  name="separator"
                  checked={formData.separator === ';'}
                  onChange={() => setFormData({ ...formData, separator: ';' })}
                  className="accent-emerald-600"
                />
                <div>
                  <strong className="block text-slate-800">فاصلة منقوطة ( ; )</strong>
                  <span className="text-[10px] text-slate-500">بعض هواتف سامسونج القديمة</span>
                </div>
              </label>
            </div>
          </div>

          {/* Max Batch Size */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              الحد الأقصى للأرقام في الدفعة الواحدة (Batch Limit):
            </label>
            <input
              type="number"
              min={5}
              max={100}
              value={formData.batchSize}
              onChange={(e) => setFormData({ ...formData, batchSize: Number(e.target.value) || 25 })}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              يقوم النظام تلقائياً بتجزئة القائمة الكبيرة إلى دفعات عند تجاوز هذا العدد، لتجنب قيود طول الرابط في متصفحات الهواتف.
            </p>
          </div>

          {/* Default Country Code */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              مفتاح الدولة الافتراضي للأرقام المحلية:
            </label>
            <input
              type="text"
              value={formData.defaultCountryCode}
              onChange={(e) => setFormData({ ...formData, defaultCountryCode: e.target.value })}
              placeholder="+966"
              className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-none"
              dir="ltr"
            />
          </div>

          {/* Backup & Restore LocalStorage section */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 block">
              النسخ الاحتياطي وإدارة البيانات المحلية:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onExportAllData}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير نسخة احتياطية (JSON)</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>استعادة نسخة (JSON)</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div>
              <button
                type="button"
                onClick={() => {
                  if (confirm('هل أنت متأكد من استعادة البيانات الافتراضية التجريبية؟ سيتم استبدال البيانات الحالية.')) {
                    onResetAllData();
                    onClose();
                  }
                }}
                className="text-xs text-red-600 hover:text-red-700 underline flex items-center gap-1 cursor-pointer pt-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>استعادة البيانات الافتراضية التجريبية</span>
              </button>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>حفظ الإعدادات</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
