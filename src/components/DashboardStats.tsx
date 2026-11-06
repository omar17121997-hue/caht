import React from 'react';
import { Users, CheckCircle2, AlertTriangle, Send, Sparkles, Smartphone, Download, Plus } from 'lucide-react';
import { downloadSampleExcel } from '../utils/excelParser';

interface DashboardStatsProps {
  totalContacts: number;
  selectedCount: number;
  invalidCount: number;
  historyCount: number;
  onSelectAllValid: () => void;
  onNavigateToCompose: () => void;
  onOpenImportModal: () => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  totalContacts,
  selectedCount,
  invalidCount,
  historyCount,
  onSelectAllValid,
  onNavigateToCompose,
  onOpenImportModal,
}) => {
  return (
    <div className="space-y-6">
      {/* Intro hero notice card */}
      <div className="bg-gradient-to-l from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-sm border border-slate-700/50 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-2">
            <Smartphone className="w-4 h-4" />
            <span>نظام إرسال محلي متصل بتطبيق الرسائل في هاتفك</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">
            إرسال رسائل SMS جماعية مباشرة عبر تطبيق الرسائل الافتراضي
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            استورد جهات اتصالك من ملفات Excel وCSV بكل سهولة، وحدد المستلمين، وجهّز نص الرسالة ليتم نقله مباشرة إلى تطبيق رسائل Android على هاتفك بدون أي وسيط أو اشتراكات خارجية.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onNavigateToCompose}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-semibold text-xs sm:text-sm rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow"
            >
              <Send className="w-4 h-4" />
              <span>إنشاء رسالة SMS الآن ({selectedCount} مستلم)</span>
            </button>
            <button
              onClick={onOpenImportModal}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm rounded-lg transition-colors flex items-center gap-2 cursor-pointer border border-white/10"
            >
              <Plus className="w-4 h-4" />
              <span>استيراد ملف أرقام</span>
            </button>
            <button
              onClick={() => downloadSampleExcel()}
              className="px-3 py-2 bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-white/10"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل ملف عينة تجريبي (Excel)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (4 main cards requested) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: إجمالي أرقام الهواتف المستوردة */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">إجمالي الأرقام المستوردة</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {totalContacts.toLocaleString('ar-SA')}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span>من جميع الملفات المحفوظة محلياً</span>
          </div>
        </div>

        {/* KPI 2: عدد الأرقام المحددة للإرسال */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">الأرقام المحددة للإرسال</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600">
            {selectedCount.toLocaleString('ar-SA')}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>جاهزة للنقل لتطبيق الرسائل</span>
            {selectedCount < totalContacts && totalContacts > 0 && (
              <button
                onClick={onSelectAllValid}
                className="text-emerald-700 hover:text-emerald-800 text-[11px] font-medium underline cursor-pointer"
              >
                تحديد الكل
              </button>
            )}
          </div>
        </div>

        {/* KPI 3: عدد الأرقام غير الصالحة */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">الأرقام غير الصالحة</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-600">
            {invalidCount.toLocaleString('ar-SA')}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {invalidCount > 0 ? 'مستبعدة تلقائياً من الإرسال' : 'جميع الأرقام سليمة'}
          </div>
        </div>

        {/* KPI 4: عدد عمليات تجهيز الرسائل */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">عمليات تجهيز الرسائل</span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-purple-600">
            {historyCount.toLocaleString('ar-SA')}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            <span>مسجلة في سجل العمليات</span>
          </div>
        </div>
      </div>

      {/* Quick Tips / Android Guidance Strip */}
      <div className="bg-slate-100/80 rounded-xl p-4 border border-slate-200 text-slate-700 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>نصيحة أندرويد:</strong> عند الضغط على إرسال، يُفتح تطبيق الرسائل تلقائياً مع تعبئة خانة المستلمين ونَص الرسالة لتراجعه قبل تأكيد الإرسال بنفسك.
          </span>
        </div>
        <div className="text-slate-500 shrink-0">
          متوافق مع Google Messages وSamsung Messages
        </div>
      </div>
    </div>
  );
};
