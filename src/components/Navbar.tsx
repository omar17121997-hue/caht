import React from 'react';
import { MessageSquare, Upload, Users, Send, History, Settings, Smartphone } from 'lucide-react';

export type ActiveTab = 'dashboard' | 'contacts' | 'compose' | 'history';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenImportModal: () => void;
  onOpenSettingsModal: () => void;
  selectedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenImportModal,
  onOpenSettingsModal,
  selectedCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Zone: 1 text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-200">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight block">
                نظام إرسال الرسائل الجماعية
              </span>
              <span className="text-[11px] text-slate-500 hidden sm:block">
                عبر تطبيق رسائل Android الافتراضي
              </span>
            </div>
          </div>

          {/* Navigation Links (desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              لوحة التحكم
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'contacts'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>جهات الاتصال</span>
              {selectedCount > 0 && (
                <span className="bg-emerald-100 text-emerald-800 text-xs px-1.5 py-0.2 rounded-md font-mono">
                  {selectedCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('compose')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'compose'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>إنشاء رسالة SMS</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <History className="w-4 h-4" />
              <span>سجل العمليات</span>
            </button>
          </nav>

          {/* Action Zone: 1 Primary CTA + Settings */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenImportModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm whitespace-nowrap cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>استيراد ملف الأرقام</span>
            </button>
            <button
              onClick={onOpenSettingsModal}
              title="إعدادات الإرسال"
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden border-t border-slate-100 py-2 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'dashboard' ? 'bg-slate-200 text-slate-900 font-bold' : 'text-slate-600'
            }`}
          >
            لوحة التحكم
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'contacts' ? 'bg-slate-200 text-slate-900 font-bold' : 'text-slate-600'
            }`}
          >
            <span>جهات الاتصال</span>
            {selectedCount > 0 && (
              <span className="bg-emerald-600 text-white text-[10px] px-1 rounded">
                {selectedCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('compose')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'compose' ? 'bg-slate-200 text-slate-900 font-bold' : 'text-slate-600'
            }`}
          >
            إنشاء رسالة
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'history' ? 'bg-slate-200 text-slate-900 font-bold' : 'text-slate-600'
            }`}
          >
            سجل العمليات
          </button>
        </div>
      </div>
    </header>
  );
};
