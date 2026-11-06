import React, { useState } from 'react';
import { 
  History, Calendar, Users, FileText, CheckCircle2, Clock, 
  Trash2, Download, Search, AlertCircle, ExternalLink, RefreshCw 
} from 'lucide-react';
import { OperationHistoryItem } from '../types';
import * as XLSX from 'xlsx';

interface HistoryLogProps {
  history: OperationHistoryItem[];
  onClearHistory: () => void;
  onSelectMessageForReuse: (message: string) => void;
}

export const HistoryLog: React.FC<HistoryLogProps> = ({
  history,
  onClearHistory,
  onSelectMessageForReuse,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredHistory = history.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      item.message.toLowerCase().includes(q) ||
      item.recipientsSample.some(r => r.includes(q))
    );
  });

  const exportHistoryToExcel = () => {
    const data = history.map(item => ({
      'تاريخ العملية': new Date(item.timestamp).toLocaleString('ar-SA'),
      'عدد المستلمين': item.recipientsCount,
      'حالة العملية': getStatusLabel(item.status),
      'طريقة الإرسال': getMethodLabel(item.method),
      'نص الرسالة': item.message,
      'عينة من الأرقام': item.recipientsSample.join(', '),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'سجل_العمليات');
    XLSX.writeFile(workbook, `سجل_عمليات_الرسائل_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const getStatusLabel = (status: OperationHistoryItem['status']) => {
    switch (status) {
      case 'confirmed':
        return 'تم تأكيد الإرسال في التطبيق';
      case 'opened':
        return 'تم فتح تطبيق الرسائل بنجاح';
      case 'prepared':
        return 'تم تجهيز الرسالة';
      case 'cancelled':
        return 'تم الإلغاء';
      default:
        return status;
    }
  };

  const getStatusBadge = (status: OperationHistoryItem['status']) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md font-semibold text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>مؤكد من المستخدم</span>
          </span>
        );
      case 'opened':
        return (
          <span className="inline-flex items-center gap-1 text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md font-semibold text-xs">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>تم فتح تطبيق الرسائل</span>
          </span>
        );
      case 'prepared':
        return (
          <span className="inline-flex items-center gap-1 text-purple-800 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-md font-semibold text-xs">
            <FileText className="w-3.5 h-3.5 text-purple-600" />
            <span>تم تجهيز الرسالة</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md font-medium text-xs">
            <span>تم الإلغاء</span>
          </span>
        );
    }
  };

  const getMethodLabel = (method: OperationHistoryItem['method']) => {
    switch (method) {
      case 'bulk_uri':
        return 'رابط أندرويد موحد';
      case 'batch_chunk':
        return 'دفعات مقسمة';
      case 'single_queue':
        return 'إرسال متتابع فردي';
      case 'clipboard':
        return 'نسخ يدوي';
      default:
        return method;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col space-y-0">
      {/* Disclaimer Banner - Mandatory Telecom Accuracy */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
        <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-800">إخلاء مسؤولية فنية:</strong> نظراً لأن النظام يعمل محلياً من المتصفح عبر توجيه الأوامر لتطبيق الرسائل الافتراضي في جهازك بدون وسيط سحابي، فإن السجل هنا يوثق تجهيز الرسائل وفتح التطبيق وتأكيدك اليدوي، ولا يمكن لصفحة الويب تقنياً التحقق من تسليم أبراج الاتصالات للرسائل.
        </p>
      </div>

      {/* Header & Controls Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">سجل عمليات التجهيز والإرسال</h2>
            <p className="text-xs text-slate-500">إجمالي {history.length} عملية مسجلة محلياً</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث في السجل..."
              className="text-xs pr-8 pl-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:border-purple-500 focus:outline-none w-44"
            />
          </div>

          {history.length > 0 && (
            <>
              <button
                onClick={exportHistoryToExcel}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير Excel</span>
              </button>
              <button
                onClick={() => {
                  if (confirm('هل أنت متأكد من مسح جميع سجلات العمليات؟')) {
                    onClearHistory();
                  }
                }}
                className="px-2.5 py-1.5 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="مسح السجل"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* History Items Table */}
      <div className="overflow-x-auto">
        {filteredHistory.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <History className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-slate-700">لا توجد عمليات مسجلة حتى الآن</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              عندما تقوم بتجهيز وفتح تطبيق الرسائل لأي قائمة، سيتم توثيق تفاصيل العملية والوقت هنا تلقائياً.
            </p>
          </div>
        ) : (
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100/80 text-slate-600 border-b border-slate-200 font-bold">
              <tr>
                <th className="py-3 px-4">تاريخ ووقت العملية</th>
                <th className="py-3 px-4">المستلمون</th>
                <th className="py-3 px-4">نص الرسالة</th>
                <th className="py-3 px-4">طريقة التجهيز</th>
                <th className="py-3 px-4">حالة العملية</th>
                <th className="py-3 px-4 text-center w-28">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHistory.map((item) => {
                const isExpanded = expandedId === item.id;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-700 text-[11px] whitespace-nowrap">
                      {new Date(item.timestamp).toLocaleString('ar-SA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Recipients Count */}
                    <td className="py-3 px-4">
                      <span className="font-mono tabular-nums font-bold text-slate-900">
                        {item.recipientsCount} مستلم
                      </span>
                      {item.recipientsSample.length > 0 && (
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]" dir="ltr">
                          {item.recipientsSample.slice(0, 2).join(', ')}...
                        </div>
                      )}
                    </td>

                    {/* Message snippet */}
                    <td className="py-3 px-4 max-w-xs">
                      <p className={`text-slate-800 leading-relaxed ${isExpanded ? 'whitespace-pre-wrap' : 'truncate'}`}>
                        {item.message}
                      </p>
                      {item.message.length > 60 && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          className="text-[10px] text-purple-700 hover:text-purple-900 underline mt-0.5"
                        >
                          {isExpanded ? 'طي النص' : 'عرض النص كاملاً'}
                        </button>
                      )}
                    </td>

                    {/* Method */}
                    <td className="py-3 px-4 text-slate-600">
                      <span className="text-[11px]">{getMethodLabel(item.method)}</span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onSelectMessageForReuse(item.message)}
                        className="px-2.5 py-1 text-xs text-purple-700 hover:bg-purple-50 rounded-md transition-colors font-medium cursor-pointer"
                        title="إعادة استخدام هذا النص في إنشاء رسالة جديدة"
                      >
                        إعادة استخدام
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
