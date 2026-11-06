import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, Check, AlertCircle, ArrowLeft, Download, Layers, Clipboard } from 'lucide-react';
import { parseSpreadsheet, extractContactsFromRows, ParsedSheetData, downloadSampleExcel } from '../utils/excelParser';
import { Contact, SavedList } from '../types';
import { validatePhoneNumber } from '../utils/phoneUtils';

interface FileImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (newContacts: Contact[], listName?: string, replace?: boolean) => void;
  existingContacts: Contact[];
  savedLists: SavedList[];
}

export const FileImportModal: React.FC<FileImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  existingContacts,
  savedLists,
}) => {
  const [activeMode, setActiveMode] = useState<'file' | 'paste'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Parsed step state
  const [parsedData, setParsedData] = useState<ParsedSheetData | null>(null);
  const [phoneCol, setPhoneCol] = useState<string>('');
  const [nameCol, setNameCol] = useState<string>('');
  const [noteCol, setNoteCol] = useState<string>('');

  // Target list settings
  const [importTarget, setImportTarget] = useState<'append' | 'new_list' | 'replace'>('append');
  const [newListName, setNewListName] = useState<string>('');

  // Manual paste state
  const [pastedText, setPastedText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    await processFile(selected);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    await processFile(droppedFile);
  };

  const processFile = async (f: File) => {
    setErrorMsg(null);
    setIsLoading(true);
    setFile(f);

    try {
      const buffer = await f.arrayBuffer();
      const parsed = parseSpreadsheet(buffer);
      setParsedData(parsed);
      setPhoneCol(parsed.detectedPhoneCol || parsed.headers[0] || '');
      setNameCol(parsed.detectedNameCol || '');
      setNoteCol(parsed.detectedNoteCol || '');
      setNewListName(f.name.replace(/\.[^/.]+$/, ''));
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'فشل في قراءة ومعالجة الملف. يرجى التأكد من أن صيغة الملف XLSX أو XLS أو CSV صالحة.');
      setParsedData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Preview calculations based on chosen column
  const getPreviewStats = () => {
    if (!parsedData || !phoneCol) return null;
    const existingSet = importTarget === 'replace' 
      ? new Set<string>() 
      : new Set(existingContacts.map(c => c.cleanPhone));

    return extractContactsFromRows(
      parsedData.rawRows,
      phoneCol,
      nameCol,
      noteCol,
      importTarget === 'new_list' ? `list_${Date.now()}` : 'default',
      existingSet
    );
  };

  const previewStats = getPreviewStats();

  const handleConfirmFileImport = () => {
    if (!previewStats || previewStats.contacts.length === 0) {
      setErrorMsg('لم يتم العثور على أرقام صالحة للاستيراد في العمود المختار.');
      return;
    }

    const replace = importTarget === 'replace';
    const listName = importTarget === 'new_list' ? newListName.trim() || 'قائمة جديدة' : undefined;

    onImportComplete(previewStats.contacts, listName, replace);
    handleReset();
    onClose();
  };

  const handleConfirmPasteImport = () => {
    if (!pastedText.trim()) {
      setErrorMsg('يرجى لصق الأرقام أولاً.');
      return;
    }

    const lines = pastedText.split(/[\n,;،]/).map(l => l.trim()).filter(Boolean);
    const existingSet = importTarget === 'replace'
      ? new Set<string>()
      : new Set(existingContacts.map(c => c.cleanPhone));

    const seenInBatch = new Set<string>();
    const newContacts: Contact[] = [];
    const listId = importTarget === 'new_list' ? `list_${Date.now()}` : 'default';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Check if line contains tab or hyphen (e.g., Name - 0501234567)
      let phone = line;
      let name: string | undefined = undefined;

      if (line.includes('\t') || line.includes('-') || line.includes(':')) {
        const parts = line.split(/[\t\-:]/).map(p => p.trim());
        if (parts.length >= 2) {
          // Find which part has digits
          const part0HasDigits = /\d{5,}/.test(parts[0]);
          const part1HasDigits = /\d{5,}/.test(parts[1]);
          if (part0HasDigits && !part1HasDigits) {
            phone = parts[0];
            name = parts[1];
          } else if (part1HasDigits) {
            phone = parts[1];
            name = parts[0];
          }
        }
      }

      const val = validatePhoneNumber(phone);
      if (!val.cleanPhone) continue;

      if (seenInBatch.has(val.cleanPhone) || existingSet.has(val.cleanPhone)) {
        continue;
      }
      seenInBatch.add(val.cleanPhone);

      newContacts.push({
        id: `c_p_${Date.now()}_${i}`,
        phone,
        cleanPhone: val.cleanPhone,
        name,
        isValid: val.isValid,
        validationReason: val.reason,
        selected: val.isValid,
        importedAt: new Date().toISOString(),
        listId,
      });
    }

    if (newContacts.length === 0) {
      setErrorMsg('لم يتم استخراج أي أرقام جديدة صالحة من النص الملصوق.');
      return;
    }

    const replace = importTarget === 'replace';
    const listName = importTarget === 'new_list' ? newListName.trim() || 'قائمة ملصوقة' : undefined;

    onImportComplete(newContacts, listName, replace);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setFile(null);
    setParsedData(null);
    setErrorMsg(null);
    setPastedText('');
    setImportTarget('append');
    setNewListName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">استيراد أرقام الهواتف</h2>
              <p className="text-xs text-slate-500">يدعم ملفات Excel (XLSX, XLS) وCSV مع فحص التكرار</p>
            </div>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-100/50 px-6 pt-3 gap-2">
          <button
            onClick={() => {
              setActiveMode('file');
              setErrorMsg(null);
            }}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'file'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>استيراد ملف Excel أو CSV</span>
          </button>
          <button
            onClick={() => {
              setActiveMode('paste');
              setErrorMsg(null);
            }}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'paste'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clipboard className="w-4 h-4" />
            <span>لصق الأرقام يدوياً</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeMode === 'file' && (
            <>
              {!parsedData ? (
                /* Step 1: Upload Dropzone */
                <div className="space-y-4">
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/20 rounded-2xl p-8 text-center cursor-pointer transition-all group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-slate-200 group-hover:border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto mb-3 transition-colors">
                      <FileSpreadsheet className="w-7 h-7" />
                    </div>
                    <div className="text-sm font-bold text-slate-800 mb-1">
                      اضغط لاختيار ملف أو اسحب الملف وأفلته هنا
                    </div>
                    <div className="text-xs text-slate-500 mb-4">
                      الملفات المدعومة: Excel (.xlsx, .xls) وCSV
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 group-hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>تحديد ملف من الجهاز</span>
                    </span>
                  </div>

                  <div className="bg-slate-100/70 rounded-xl p-4 flex items-center justify-between text-xs text-slate-600 border border-slate-200/70">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-slate-500" />
                      <span>هل تريد تجربة الاستيراد بملف جاهز؟</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadSampleExcel()}
                      className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer underline"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تحميل عينة Excel للتجربة</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Step 2: Column Selection & Mapping */
                <div className="space-y-5">
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 text-xs text-slate-700 truncate">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold truncate">{file?.name}</span>
                      <span className="text-slate-400">({parsedData.rawRows.length} صفاً)</span>
                    </div>
                    <button
                      onClick={() => setParsedData(null)}
                      className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      تغيير الملف
                    </button>
                  </div>

                  {/* Mapping Selectors */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        عمود أرقام الهواتف <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={phoneCol}
                        onChange={(e) => setPhoneCol(e.target.value)}
                        className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg p-2.5 focus:border-emerald-500 focus:outline-none"
                      >
                        {parsedData.headers.map((h) => (
                          <option key={h} value={h}>
                            {h} {h === parsedData.detectedPhoneCol ? '(تم اكتشافه تلقائياً)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        عمود الاسم (اختياري)
                      </label>
                      <select
                        value={nameCol}
                        onChange={(e) => setNameCol(e.target.value)}
                        className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg p-2.5 focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="">بدون اسم</option>
                        {parsedData.headers.map((h) => (
                          <option key={h} value={h}>
                            {h} {h === parsedData.detectedNameCol ? '(تلقائي)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        عمود الملاحظات (اختياري)
                      </label>
                      <select
                        value={noteCol}
                        onChange={(e) => setNoteCol(e.target.value)}
                        className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg p-2.5 focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="">بدون ملاحظات</option>
                        {parsedData.headers.map((h) => (
                          <option key={h} value={h}>
                            {h} {h === parsedData.detectedNoteCol ? '(تلقائي)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Extraction Summary Box */}
                  {previewStats && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                      <div className="text-xs font-bold text-slate-800">نتيجة الفحص والمعالجة:</div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <span className="text-slate-500 block">إجمالي الصفوف</span>
                          <span className="font-bold font-mono text-slate-900 text-sm">
                            {previewStats.totalRead}
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-emerald-200 text-emerald-800">
                          <span className="text-emerald-600 block">أرقام صالحة جديدة</span>
                          <span className="font-bold font-mono text-sm">
                            {previewStats.validCount}
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-amber-200 text-amber-800">
                          <span className="text-amber-600 block">أرقام غير صالحة</span>
                          <span className="font-bold font-mono text-sm">
                            {previewStats.invalidCount}
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-purple-200 text-purple-800">
                          <span className="text-purple-600 block">مكررات تم استبعادها</span>
                          <span className="font-bold font-mono text-sm">
                            {previewStats.duplicatesRemoved}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Target List Options */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <label className="block text-xs font-bold text-slate-800">
                      مكان حفظ الأرقام المستوردة:
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="importTarget"
                          checked={importTarget === 'append'}
                          onChange={() => setImportTarget('append')}
                          className="accent-emerald-600"
                        />
                        <span>إضافة ودمج مع القائمة الحالية (دون حذف الأرقام السابقة)</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="importTarget"
                          checked={importTarget === 'new_list'}
                          onChange={() => setImportTarget('new_list')}
                          className="accent-emerald-600"
                        />
                        <span>إنشاء قائمة جديدة باسم مخصص</span>
                      </label>

                      {importTarget === 'new_list' && (
                        <input
                          type="text"
                          value={newListName}
                          onChange={(e) => setNewListName(e.target.value)}
                          placeholder="اكتب اسم القائمة الجديدة (مثال: عملاء المعرض)"
                          className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 mr-6 focus:border-emerald-500 focus:outline-none"
                        />
                      )}

                      <label className="flex items-center gap-2 text-xs text-red-600 cursor-pointer">
                        <input
                          type="radio"
                          name="importTarget"
                          checked={importTarget === 'replace'}
                          onChange={() => setImportTarget('replace')}
                          className="accent-red-600"
                        />
                        <span>استبدال وحذف القائمة الحالية بالكامل</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {activeMode === 'paste' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  الصق أرقام الهواتف (كل رقم في سطر أو مفصولة بفواصل):
                </label>
                <textarea
                  rows={6}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`0501234567\n0559876543\n+966543210987 - محمد\n0561122334, 0598877665`}
                  className="w-full text-xs font-mono p-3 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                  dir="ltr"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  يمكنك لصق الأرقام بصيغ مختلفة، سيقوم النظام تلقائياً بتنظيف الأرقام، إزالة التكرار، والتحقق من صحتها.
                </p>
              </div>

              {/* Target List Options for Paste */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-800">
                  مكان حفظ الأرقام:
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="pasteTarget"
                      checked={importTarget === 'append'}
                      onChange={() => setImportTarget('append')}
                      className="accent-emerald-600"
                    />
                    <span>إضافة ودمج مع القائمة الحالية</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="pasteTarget"
                      checked={importTarget === 'new_list'}
                      onChange={() => setImportTarget('new_list')}
                      className="accent-emerald-600"
                    />
                    <span>إنشاء قائمة جديدة باسم مخصص</span>
                  </label>
                  {importTarget === 'new_list' && (
                    <input
                      type="text"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="اسم القائمة الجديدة"
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 mr-6 focus:border-emerald-500 focus:outline-none"
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            إلغاء
          </button>

          {activeMode === 'file' && parsedData && (
            <button
              type="button"
              onClick={handleConfirmFileImport}
              disabled={!previewStats || previewStats.contacts.length === 0}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>استيراد ({previewStats?.contacts.length || 0}) جهة اتصال</span>
            </button>
          )}

          {activeMode === 'paste' && (
            <button
              type="button"
              onClick={handleConfirmPasteImport}
              disabled={!pastedText.trim()}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>معالجة وحفظ الأرقام</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
