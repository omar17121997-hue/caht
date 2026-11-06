import React, { useState, useEffect, useMemo } from 'react';
import { 
  getStoredContacts, saveStoredContacts, 
  getStoredLists, saveStoredLists, 
  getStoredHistory, saveStoredHistory, 
  getStoredConfig, saveStoredConfig, 
  getStoredDraft, saveStoredDraft,
  DEFAULT_CONFIG 
} from './utils/storage';
import { Contact, SavedList, OperationHistoryItem, SmsDispatchConfig } from './types';
import { Navbar, ActiveTab } from './components/Navbar';
import { DashboardStats } from './components/DashboardStats';
import { ContactsTable } from './components/ContactsTable';
import { MessageComposer } from './components/MessageComposer';
import { HistoryLog } from './components/HistoryLog';
import { FileImportModal } from './components/FileImportModal';
import { SmsDispatchModal } from './components/SmsDispatchModal';
import { SequentialSendModal } from './components/SequentialSendModal';
import { SettingsModal } from './components/SettingsModal';
import { InstallPromptModal } from './components/InstallPromptModal';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Core Data States loaded from LocalStorage
  const [contacts, setContacts] = useState<Contact[]>(() => getStoredContacts());
  const [savedLists, setSavedLists] = useState<SavedList[]>(() => getStoredLists());
  const [activeListId, setActiveListId] = useState<string>('all');
  const [history, setHistory] = useState<OperationHistoryItem[]>(() => getStoredHistory());
  const [config, setConfig] = useState<SmsDispatchConfig>(() => getStoredConfig());
  const [messageText, setMessageText] = useState<string>(() => getStoredDraft());

  // Modal open states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isSequentialModalOpen, setIsSequentialModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // Floating feedback banner
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync contacts with LocalStorage
  useEffect(() => {
    saveStoredContacts(contacts);
  }, [contacts]);

  // Sync savedLists with LocalStorage
  useEffect(() => {
    saveStoredLists(savedLists);
  }, [savedLists]);

  // Sync history with LocalStorage
  useEffect(() => {
    saveStoredHistory(history);
  }, [history]);

  // Sync config with LocalStorage
  useEffect(() => {
    saveStoredConfig(config);
  }, [config]);

  // Sync draft message with LocalStorage
  useEffect(() => {
    saveStoredDraft(messageText);
  }, [messageText]);

  // Computed KPIs
  const selectedContacts = useMemo(() => {
    return contacts.filter(c => c.selected);
  }, [contacts]);

  const selectedCount = selectedContacts.length;

  const invalidCount = useMemo(() => {
    return contacts.filter(c => !c.isValid).length;
  }, [contacts]);

  // Contact Handlers
  const handleToggleSelect = (id: string) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, selected: !c.selected } : c));
  };

  const handleSelectAll = () => {
    setContacts(prev => prev.map(c => ({ ...c, selected: true })));
    showToast('تم تحديد جميع جهات الاتصال');
  };

  const handleDeselectAll = () => {
    setContacts(prev => prev.map(c => ({ ...c, selected: false })));
    showToast('تم إلغاء تحديد جميع جهات الاتصال', 'info');
  };

  const handleSelectOnlyValid = () => {
    setContacts(prev => prev.map(c => ({ ...c, selected: c.isValid })));
    showToast('تم تحديد جميع الأرقام الصالحة فقط');
  };

  const handleDeleteContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
    showToast('تم حذف الرقم بنجاح');
  };

  const handleDeleteSelected = () => {
    const countToDelete = selectedCount;
    setContacts(prev => prev.filter(c => !c.selected));
    showToast(`تم حذف ${countToDelete} رقم محدد`);
  };

  const handleClearInvalid = () => {
    const invalidTotal = invalidCount;
    setContacts(prev => prev.filter(c => c.isValid));
    showToast(`تم تنظيف وحذف ${invalidTotal} أرقام غير صالحة`);
  };

  // List Management Handlers
  const handleCreateNewListFromSelected = (name: string) => {
    const newListId = `list_${Date.now()}`;
    const newList: SavedList = {
      id: newListId,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      count: selectedCount,
    };

    setSavedLists(prev => [...prev, newList]);
    // Assign selected contacts to this list
    setContacts(prev => prev.map(c => c.selected ? { ...c, listId: newListId } : c));
    setActiveListId(newListId);
    showToast(`تم حفظ القائمة "${name}" بنجاح وتعيين الأرقام المحددة لها`);
  };

  const handleDeleteList = (listId: string) => {
    setSavedLists(prev => prev.filter(l => l.id !== listId));
    // Move contacts to default
    setContacts(prev => prev.map(c => c.listId === listId ? { ...c, listId: 'default' } : c));
    setActiveListId('all');
    showToast('تم حذف القائمة بنجاح');
  };

  // Import Handler
  const handleImportComplete = (newContacts: Contact[], newListName?: string, replace?: boolean) => {
    let targetListId = 'default';

    if (newListName) {
      targetListId = `list_${Date.now()}`;
      const newList: SavedList = {
        id: targetListId,
        name: newListName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        count: newContacts.length,
      };
      setSavedLists(prev => [...prev, newList]);
    }

    const assignedContacts = newContacts.map(c => ({
      ...c,
      listId: targetListId,
    }));

    if (replace) {
      setContacts(assignedContacts);
      showToast(`تم استبدال القائمة واستيراد ${assignedContacts.length} جهة اتصال`);
    } else {
      setContacts(prev => [...prev, ...assignedContacts]);
      showToast(`تم إضافة واستيراد ${assignedContacts.length} جهة اتصال بنجاح`);
    }

    setActiveListId(targetListId);
    setActiveTab('contacts');
  };

  // History Recording Handler
  const handleRecordHistory = (
    status: 'opened' | 'confirmed' | 'cancelled',
    method: 'bulk_uri' | 'single_queue' | 'batch_chunk'
  ) => {
    const newItem: OperationHistoryItem = {
      id: `hist_${Date.now()}`,
      timestamp: new Date().toISOString(),
      recipientsCount: selectedCount,
      recipientsSample: selectedContacts.slice(0, 5).map(c => c.cleanPhone || c.phone),
      message: messageText,
      status,
      method,
    };

    setHistory(prev => [newItem, ...prev]);

    if (status === 'confirmed') {
      showToast('تم توثيق تأكيد الإرسال في سجل العمليات');
    } else if (status === 'opened') {
      showToast('تم توثيق فتح تطبيق الرسائل في سجل العمليات');
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    showToast('تم مسح سجل العمليات', 'info');
  };

  // Reuse message from history
  const handleSelectMessageForReuse = (msg: string) => {
    setMessageText(msg);
    setActiveTab('compose');
    showToast('تم نسخ نص الرسالة إلى مربع الإنشاء');
  };

  // Backup & Restore
  const handleExportAllData = () => {
    const fullBackup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      contacts,
      savedLists,
      history,
      config,
      messageText,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `نسخة_نظام_الرسائل_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('تم تصدير ملف النسخة الاحتياطية بنجاح');
  };

  const handleImportAllData = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed.contacts)) setContacts(parsed.contacts);
      if (Array.isArray(parsed.savedLists)) setSavedLists(parsed.savedLists);
      if (Array.isArray(parsed.history)) setHistory(parsed.history);
      if (parsed.config) setConfig(parsed.config);
      if (parsed.messageText) setMessageText(parsed.messageText);
      showToast('تمت استعادة البيانات بنجاح من النسخة الاحتياطية');
    } catch {
      showToast('ملف النسخة الاحتياطية غير صالح', 'error');
    }
  };

  const handleResetAllData = () => {
    localStorage.clear();
    setContacts(getStoredContacts());
    setSavedLists(getStoredLists());
    setHistory([]);
    setConfig(DEFAULT_CONFIG);
    setMessageText(getStoredDraft());
    showToast('تمت استعادة البيانات التجريبية الافتراضية');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        selectedCount={selectedCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Tab 1: Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <DashboardStats
              totalContacts={contacts.length}
              selectedCount={selectedCount}
              invalidCount={invalidCount}
              historyCount={history.length}
              onSelectAllValid={handleSelectOnlyValid}
              onNavigateToCompose={() => setActiveTab('compose')}
              onOpenImportModal={() => setIsImportModalOpen(true)}
              onOpenInstallModal={() => setIsInstallModalOpen(true)}
            />

            {/* Quick Contacts Table Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">
                  قائمة جهات الاتصال السريعة ({contacts.length} رقم)
                </h3>
                <button
                  onClick={() => setActiveTab('contacts')}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold underline cursor-pointer"
                >
                  الانتقال لإدارة جهات الاتصال كاملة
                </button>
              </div>

              <ContactsTable
                contacts={contacts}
                onToggleSelect={handleToggleSelect}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                onSelectOnlyValid={handleSelectOnlyValid}
                onDeleteContact={handleDeleteContact}
                onDeleteSelected={handleDeleteSelected}
                onClearInvalid={handleClearInvalid}
                savedLists={savedLists}
                activeListId={activeListId}
                onSelectList={setActiveListId}
                onCreateNewListFromSelected={handleCreateNewListFromSelected}
                onDeleteList={handleDeleteList}
                onOpenImportModal={() => setIsImportModalOpen(true)}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Contacts Management */}
        {activeTab === 'contacts' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-xl font-bold text-slate-900">إدارة جهات الاتصال والأرقام</h1>
                <p className="text-xs text-slate-500">
                  تحديد الأرقام، إنشاء وحفظ القوائم، واستبعاد التكرارات والأرقام غير الصالحة
                </p>
              </div>

              {selectedCount > 0 && (
                <button
                  onClick={() => setActiveTab('compose')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-1.5 self-start cursor-pointer"
                >
                  <span>كتابة رسالة إلى ({selectedCount}) رقم محدد</span>
                </button>
              )}
            </div>

            <ContactsTable
              contacts={contacts}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onSelectOnlyValid={handleSelectOnlyValid}
              onDeleteContact={handleDeleteContact}
              onDeleteSelected={handleDeleteSelected}
              onClearInvalid={handleClearInvalid}
              savedLists={savedLists}
              activeListId={activeListId}
              onSelectList={setActiveListId}
              onCreateNewListFromSelected={handleCreateNewListFromSelected}
              onDeleteList={handleDeleteList}
              onOpenImportModal={() => setIsImportModalOpen(true)}
            />
          </div>
        )}

        {/* Tab 3: Message Composer */}
        {activeTab === 'compose' && (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">إنشاء وتجهيز رسالة SMS</h1>
              <p className="text-xs text-slate-500">
                صياغة الرسالة وحساب عدد الأجزاء وتجهيزها للإرسال عبر تطبيق الرسائل الافتراضي في Android
              </p>
            </div>

            <MessageComposer
              messageText={messageText}
              setMessageText={setMessageText}
              selectedContacts={selectedContacts}
              onOpenDispatchModal={() => setIsDispatchModalOpen(true)}
              onNavigateToContacts={() => setActiveTab('contacts')}
            />
          </div>
        )}

        {/* Tab 4: History Log */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">سجل عمليات التجهيز والإرسال</h1>
              <p className="text-xs text-slate-500">
                توثيق كامل للعمليات السابقة مع التاريخ وعدد المستلمين ونصوص الرسائل
              </p>
            </div>

            <HistoryLog
              history={history}
              onClearHistory={handleClearHistory}
              onSelectMessageForReuse={handleSelectMessageForReuse}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>نظام إرسال الرسائل الجماعية © {new Date().getFullYear()} · يعمل محلياً بالكامل على جهازك</span>
          <span className="text-[11px] text-slate-400">
            متوافق مع أجهزة Android عبر SMS URI Intent
          </span>
        </div>
      </footer>

      {/* Floating Feedback Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 transition-all transform animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className={`px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 border ${
            toastMessage.type === 'success'
              ? 'bg-slate-900 text-white border-slate-800'
              : toastMessage.type === 'error'
              ? 'bg-red-700 text-white border-red-800'
              : 'bg-slate-800 text-slate-200 border-slate-700'
          }`}>
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-red-300" />}
            {toastMessage.type === 'info' && <Info className="w-4 h-4 text-blue-300" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Modals */}
      <FileImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={handleImportComplete}
        existingContacts={contacts}
        savedLists={savedLists}
      />

      <SmsDispatchModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        selectedContacts={selectedContacts}
        messageText={messageText}
        config={config}
        onRecordHistory={handleRecordHistory}
        onOpenSequentialMode={() => setIsSequentialModalOpen(true)}
      />

      <SequentialSendModal
        isOpen={isSequentialModalOpen}
        onClose={() => setIsSequentialModalOpen(false)}
        contacts={selectedContacts}
        messageText={messageText}
        onFinish={() => {
          setIsSequentialModalOpen(false);
          handleRecordHistory('confirmed', 'single_queue');
        }}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        config={config}
        onSaveConfig={(cfg) => {
          setConfig(cfg);
          showToast('تم حفظ الإعدادات بنجاح');
        }}
        onExportAllData={handleExportAllData}
        onImportAllData={handleImportAllData}
        onResetAllData={handleResetAllData}
      />

      <InstallPromptModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
}
