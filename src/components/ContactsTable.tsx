import React, { useState, useMemo } from 'react';
import { 
  Search, Trash2, CheckSquare, Square, Filter, Download, 
  Smartphone, FolderPlus, ListFilter, AlertTriangle, CheckCircle2, UserPlus, FileSpreadsheet
} from 'lucide-react';
import { Contact, SavedList } from '../types';
import { exportContactsToExcel } from '../utils/excelParser';
import { buildSmsUri } from '../utils/smsUtils';

interface ContactsTableProps {
  contacts: Contact[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSelectOnlyValid: () => void;
  onDeleteContact: (id: string) => void;
  onDeleteSelected: () => void;
  onClearInvalid: () => void;
  savedLists: SavedList[];
  activeListId: string;
  onSelectList: (listId: string) => void;
  onCreateNewListFromSelected: (name: string) => void;
  onDeleteList: (listId: string) => void;
  onOpenImportModal: () => void;
}

export const ContactsTable: React.FC<ContactsTableProps> = ({
  contacts,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onSelectOnlyValid,
  onDeleteContact,
  onDeleteSelected,
  onClearInvalid,
  savedLists,
  activeListId,
  onSelectList,
  onCreateNewListFromSelected,
  onDeleteList,
  onOpenImportModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'selected' | 'valid' | 'invalid'>('all');
  const [showSaveListInput, setShowSaveListInput] = useState(false);
  const [newListName, setNewListName] = useState('');

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      // List filter
      if (activeListId !== 'all' && c.listId !== activeListId) {
        return false;
      }

      // Status filter
      if (statusFilter === 'selected' && !c.selected) return false;
      if (statusFilter === 'valid' && !c.isValid) return false;
      if (statusFilter === 'invalid' && c.isValid) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesPhone = c.phone.toLowerCase().includes(q) || c.cleanPhone.toLowerCase().includes(q);
        const matchesName = c.name ? c.name.toLowerCase().includes(q) : false;
        const matchesNote = c.note ? c.note.toLowerCase().includes(q) : false;
        return matchesPhone || matchesName || matchesNote;
      }

      return true;
    });
  }, [contacts, activeListId, statusFilter, searchQuery]);

  const selectedCount = useMemo(() => {
    return contacts.filter(c => c.selected).length;
  }, [contacts]);

  const allFilteredSelected = useMemo(() => {
    if (filteredContacts.length === 0) return false;
    return filteredContacts.every(c => c.selected);
  }, [filteredContacts]);

  const handleSaveCurrentAsList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    onCreateNewListFromSelected(newListName.trim());
    setNewListName('');
    setShowSaveListInput(false);
  };

  const handleSendSingleSms = (contact: Contact) => {
    const uri = buildSmsUri([contact.cleanPhone || contact.phone], '');
    window.location.href = uri;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      {/* Top Header & List Management Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Saved Lists Tabs / Dropdown */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1 shrink-0">
              <ListFilter className="w-3.5 h-3.5 text-slate-500" />
              <span>القوائم:</span>
            </span>

            <button
              onClick={() => onSelectList('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeListId === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              جميع القوائم ({contacts.length})
            </button>

            {savedLists.map(list => {
              const count = contacts.filter(c => c.listId === list.id).length;
              return (
                <div key={list.id} className="relative group shrink-0">
                  <button
                    onClick={() => onSelectList(list.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                      activeListId === list.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{list.name}</span>
                    <span className="text-[10px] font-mono opacity-80">({count})</span>
                  </button>
                  {list.id !== 'default' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`هل أنت متأكد من حذف قائمة "${list.name}"؟`)) {
                          onDeleteList(list.id);
                        }
                      }}
                      title="حذف هذه القائمة"
                      className="hidden group-hover:flex absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] items-center justify-center cursor-pointer shadow"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}

            {!showSaveListInput ? (
              <button
                onClick={() => setShowSaveListInput(true)}
                className="px-2.5 py-1.5 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>حفظ كقائمة جديدة</span>
              </button>
            ) : (
              <form onSubmit={handleSaveCurrentAsList} className="flex items-center gap-1.5 shrink-0">
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="اسم القائمة..."
                  className="px-2.5 py-1 text-xs border border-emerald-500 rounded-md bg-white focus:outline-none w-32"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-2 py-1 text-xs bg-emerald-600 text-white font-semibold rounded-md hover:bg-emerald-700 cursor-pointer"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => setShowSaveListInput(false)}
                  className="px-2 py-1 text-xs bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 cursor-pointer"
                >
                  إلغاء
                </button>
              </form>
            )}
          </div>

          {/* Export and Add shortcuts */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => exportContactsToExcel(filteredContacts)}
              title="تصدير الأرقام الحالية إلى ملف Excel"
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير Excel</span>
            </button>
            <button
              onClick={onOpenImportModal}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>استيراد ملف</span>
            </button>
          </div>
        </div>

        {/* Search & Status Filters Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث بالرقم أو الاسم أو الملاحظات..."
              className="w-full text-xs pr-9 pl-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                مسح
              </button>
            )}
          </div>

          {/* Segmented Filter Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg shrink-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الكل ({contacts.length})
            </button>
            <button
              onClick={() => setStatusFilter('selected')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                statusFilter === 'selected'
                  ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              المحددة ({selectedCount})
            </button>
            <button
              onClick={() => setStatusFilter('valid')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                statusFilter === 'valid'
                  ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الصالحة
            </button>
            <button
              onClick={() => setStatusFilter('invalid')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                statusFilter === 'invalid'
                  ? 'bg-white text-amber-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              غير الصالحة
            </button>
          </div>
        </div>

        {/* Selection Toolbar Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <button
              onClick={allFilteredSelected ? onDeselectAll : onSelectAll}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-100 font-medium flex items-center gap-1.5 cursor-pointer"
            >
              {allFilteredSelected ? (
                <>
                  <Square className="w-3.5 h-3.5 text-slate-500" />
                  <span>إلغاء تحديد المعروض</span>
                </>
              ) : (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>تحديد جميع المعروض</span>
                </>
              )}
            </button>

            <button
              onClick={onSelectOnlyValid}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-100 font-medium text-emerald-700 flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>تحديد الصالحة فقط</span>
            </button>

            <button
              onClick={onDeselectAll}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-100 font-medium text-slate-600 cursor-pointer"
            >
              إلغاء تحديد الكل
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="font-semibold text-slate-800">
              تم تحديد <span className="text-emerald-700 font-mono text-sm">{selectedCount}</span> من أصل <span className="font-mono">{contacts.length}</span>
            </div>

            {selectedCount > 0 && (
              <button
                onClick={() => {
                  if (confirm(`هل أنت متأكد من حذف ${selectedCount} جهة اتصال محددة؟`)) {
                    onDeleteSelected();
                  }
                }}
                className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-md hover:bg-red-100 font-medium flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف المحدد ({selectedCount})</span>
              </button>
            )}

            <button
              onClick={() => {
                if (confirm('هل تريد حذف جميع الأرقام غير الصالحة من القائمة؟')) {
                  onClearInvalid();
                }
              }}
              className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
            >
              تنظيف غير الصالح
            </button>
          </div>
        </div>
      </div>

      {/* High Density Table */}
      <div className="overflow-x-auto flex-1">
        {filteredContacts.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-slate-700">لا توجد جهات اتصال تطابق هذا البحث أو الفلتر</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              يمكنك استيراد أرقام جديدة من ملف Excel أو CSV، أو تغيير خيارات التصفية الحالية.
            </p>
            <button
              onClick={onOpenImportModal}
              className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>استيراد ملف جديد</span>
            </button>
          </div>
        ) : (
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100/90 text-slate-600 uppercase border-b border-slate-200 sticky top-0 font-bold">
              <tr>
                <th className="py-3 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={() => (allFilteredSelected ? onDeselectAll() : onSelectAll())}
                    className="accent-emerald-600 rounded cursor-pointer w-4 h-4"
                  />
                </th>
                <th className="py-3 px-4">رقم الهاتف</th>
                <th className="py-3 px-4">الاسم</th>
                <th className="py-3 px-4">حالة الرقم</th>
                <th className="py-3 px-4 hidden md:table-cell">الملاحظات</th>
                <th className="py-3 px-4 hidden lg:table-cell">تاريخ الإضافة</th>
                <th className="py-3 px-4 text-center w-28">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContacts.map((contact) => (
                <tr
                  key={contact.id}
                  onClick={() => onToggleSelect(contact.id)}
                  className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                    contact.selected ? 'bg-emerald-50/40' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <td className="py-2.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={contact.selected}
                      onChange={() => onToggleSelect(contact.id)}
                      className="accent-emerald-600 rounded cursor-pointer w-4 h-4"
                    />
                  </td>

                  {/* Phone Number */}
                  <td className="py-2.5 px-4 font-mono tabular-nums text-slate-900 font-semibold" dir="ltr">
                    {contact.cleanPhone || contact.phone}
                  </td>

                  {/* Name */}
                  <td className="py-2.5 px-4 text-slate-800 font-medium">
                    {contact.name || <span className="text-slate-400 font-normal">-</span>}
                  </td>

                  {/* Status */}
                  <td className="py-2.5 px-4">
                    {contact.isValid ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>صالح</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-medium" title={contact.validationReason}>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{contact.validationReason}</span>
                      </span>
                    )}
                  </td>

                  {/* Note */}
                  <td className="py-2.5 px-4 text-slate-500 hidden md:table-cell truncate max-w-xs">
                    {contact.note || '-'}
                  </td>

                  {/* Added date */}
                  <td className="py-2.5 px-4 text-slate-400 text-[11px] hidden lg:table-cell font-mono tabular-nums">
                    {new Date(contact.importedAt).toLocaleDateString('ar-SA')}
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleSendSingleSms(contact)}
                        title="فتح محادثة فردية في تطبيق الرسائل لهذا الرقم"
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                      >
                        <Smartphone className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteContact(contact.id)}
                        title="حذف هذا الرقم"
                        className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Table Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
        <div>
          عرض <span className="font-mono tabular-nums font-semibold text-slate-800">{filteredContacts.length}</span> من أصل <span className="font-mono tabular-nums font-semibold text-slate-800">{contacts.length}</span> رقم
        </div>
        <div className="text-[11px] text-slate-400">
          اضغط على أي صف لتحديده أو إلغاء تحديده
        </div>
      </div>
    </div>
  );
};
