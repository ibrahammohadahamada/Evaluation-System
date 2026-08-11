import React, { useState } from 'react';
import {
  Database,
  FileText,
  FileSpreadsheet,
  FileCode,
  Trash2,
  Edit3,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  Download,
  Sparkles,
  ShieldCheck,
  Plus,
  RefreshCw,
  HardDrive
} from 'lucide-react';
import { UploadedFileRecord, Language } from '../types';

interface DatabaseFilesManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  uploadedFiles: UploadedFileRecord[];
  onAddUploadedFile: (file: UploadedFileRecord) => void;
  onUpdateUploadedFile: (file: UploadedFileRecord) => void;
  onDeleteUploadedFile: (fileId: string) => void;
  onClearAllUploadedFiles: () => void;
  onApplyPolicyText?: (text: string, fileName: string) => void;
  language: Language;
}

export const DatabaseFilesManagerModal: React.FC<DatabaseFilesManagerModalProps> = ({
  isOpen,
  onClose,
  uploadedFiles,
  onAddUploadedFile,
  onUpdateUploadedFile,
  onDeleteUploadedFile,
  onClearAllUploadedFiles,
  onApplyPolicyText,
  language,
}) => {
  if (!isOpen) return null;

  const isAr = language === 'ar';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Edit State
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editExtractedText, setEditExtractedText] = useState('');

  // Delete & Clear Confirmations (no native window.confirm to avoid iframe blocking)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // New File Upload State
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState<'pdf' | 'csv' | 'json' | 'txt'>('pdf');
  const [newFileContent, setNewFileContent] = useState('');
  const [newFileSummary, setNewFileSummary] = useState('');

  // Notification Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Open Edit Dialog for a file
  const handleStartEdit = (file: UploadedFileRecord) => {
    setEditingFileId(file.id);
    setEditName(file.name);
    setEditSummary(file.summary || '');
    setEditExtractedText(file.extractedText || '');
    setConfirmDeleteId(null);
  };

  // Save Edit
  const handleSaveEdit = (file: UploadedFileRecord, e: React.FormEvent) => {
    e.preventDefault();

    const updated: UploadedFileRecord = {
      ...file,
      name: editName.trim() || file.name,
      summary: editSummary.trim(),
      extractedText: editExtractedText,
      sizeBytes: editExtractedText ? new Blob([editExtractedText]).size : file.sizeBytes,
    };

    onUpdateUploadedFile(updated);
    setEditingFileId(null);
    showNotification(
      isAr
        ? `تم تحديث وحفظ تعديلات الملف (${updated.name}) بنجاح!`
        : `Updated file (${updated.name}) successfully!`
    );
  };

  // Create New File
  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    const newRecord: UploadedFileRecord = {
      id: `file_${Date.now()}`,
      name: newFileName.trim().endsWith(`.${newFileType}`)
        ? newFileName.trim()
        : `${newFileName.trim()}.${newFileType}`,
      type: newFileType,
      sizeBytes: new Blob([newFileContent]).size || 1024,
      uploadedAt: new Date().toLocaleString(isAr ? 'ar-SA' : 'en-US'),
      uploadedBy: 'المستخدم الرئيسي (admin)',
      sourceModule: 'dataset',
      summary: newFileSummary.trim() || (isAr ? 'مستند سياق وقاعدة بيانات مضاف مخصصاً' : 'Custom database policy document'),
      extractedText: newFileContent,
    };

    onAddUploadedFile(newRecord);
    setShowUploadForm(false);
    setNewFileName('');
    setNewFileContent('');
    setNewFileSummary('');
    showNotification(
      isAr
        ? `تم إضافة وتخزين الملف الجديد (${newRecord.name}) في قاعدة البيانات المحلية!`
        : `Added new file (${newRecord.name}) to database successfully!`
    );
  };

  // File Upload Event from system
  const handleDirectFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const ext = file.name.split('.').pop()?.toLowerCase();
      let fileType: 'pdf' | 'csv' | 'json' | 'txt' = 'txt';
      if (ext === 'pdf') fileType = 'pdf';
      else if (ext === 'csv') fileType = 'csv';
      else if (ext === 'json') fileType = 'json';

      const record: UploadedFileRecord = {
        id: `file_${Date.now()}`,
        name: file.name,
        type: fileType,
        sizeBytes: file.size,
        uploadedAt: new Date().toLocaleString(isAr ? 'ar-SA' : 'en-US'),
        uploadedBy: 'المستخدم الرئيسي (admin)',
        sourceModule: 'policy',
        summary: `مستند مرفوع حديثاً: ${file.name}`,
        extractedText: text || `محتوى مستخرج من ${file.name}`,
      };

      onAddUploadedFile(record);
      showNotification(
        isAr ? `تم رفع وحفظ المستند (${file.name}) بنجاح!` : `Uploaded and saved (${file.name})!`
      );
    };
    reader.readAsText(file);
  };

  // Download File Text
  const handleDownloadFile = (file: UploadedFileRecord) => {
    const content = file.extractedText || file.summary || file.name;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered files
  const filteredFiles = uploadedFiles.filter((file) => {
    const matchesSearch =
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (file.summary && file.summary.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (file.extractedText && file.extractedText.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'ALL' || file.type === selectedType;
    return matchesSearch && matchesType;
  });

  const totalBytes = uploadedFiles.reduce((acc, f) => acc + (f.sizeBytes || 0), 0);
  const formattedTotalSize = (totalBytes / (1024 * 1024)).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>
                  {isAr
                    ? 'إدارة ملفات قاعدة البيانات والمستندات المرفوعة'
                    : 'Database & Uploaded Policy Files Manager'}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700 font-mono">
                  {uploadedFiles.length} {isAr ? 'ملفات' : 'files'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <HardDrive className="w-3.5 h-3.5 text-teal-400" />
                <span>
                  {isAr
                    ? `إجمالي الحجم المحفوظ في التخزين المحلي: ${formattedTotalSize} ميجابايت`
                    : `Total Local Storage Used: ${formattedTotalSize} MB`}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إضافة/رفع ملف جديد' : 'Upload/Add File'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {toastMsg && (
          <div className="bg-emerald-950/90 border-b border-emerald-500/40 px-5 py-2.5 text-xs text-emerald-200 font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMsg}</span>
            </div>
          </div>
        )}

        {/* Main Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 custom-scrollbar">
          {/* New File Creation / Direct Upload Section */}
          {showUploadForm && (
            <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/30 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span>{isAr ? 'رفع أو إنشاء مستند جديد في قاعدة البيانات' : 'Upload or Create New Database File'}</span>
                </h4>
                <button
                  onClick={() => setShowUploadForm(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* File Upload Drop Zone */}
                <div className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-xl p-4 text-center space-y-2 bg-slate-900/50 transition-colors flex flex-col justify-center items-center">
                  <Upload className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-xs text-slate-300 font-bold">
                    {isAr ? 'اختر ملف من جهازك (PDF, CSV, JSON, TXT)' : 'Select file from device (PDF, CSV, JSON, TXT)'}
                  </p>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-300 border border-slate-700 cursor-pointer">
                    <span>{isAr ? 'تصفح جهازك 📂' : 'Browse Files 📂'}</span>
                    <input
                      type="file"
                      accept=".pdf,.csv,.json,.txt"
                      onChange={handleDirectFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Manual Text Creation Form */}
                <form onSubmit={handleCreateFile} className="space-y-2.5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={isAr ? 'اسم الملف (مثلاً: سياسة_الأمن_المحدثة.pdf)' : 'File name (e.g. policy.pdf)'}
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      required
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <select
                      value={newFileType}
                      onChange={(e: any) => setNewFileType(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono"
                    >
                      <option value="pdf">PDF</option>
                      <option value="csv">CSV</option>
                      <option value="json">JSON</option>
                      <option value="txt">TXT</option>
                    </select>
                  </div>

                  <input
                    type="text"
                    placeholder={isAr ? 'ملخص أو وصف المستند' : 'Summary / Description'}
                    value={newFileSummary}
                    onChange={(e) => setNewFileSummary(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />

                  <textarea
                    rows={3}
                    placeholder={isAr ? 'أدخل نص السياسة أو محتوى قاعدة البيانات المستخرج هنا...' : 'Paste policy text or dataset content here...'}
                    value={newFileContent}
                    onChange={(e) => setNewFileContent(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />

                  <div className="flex justify-end gap-2">
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow cursor-pointer"
                    >
                      {isAr ? 'حفظ المستند' : 'Save Document'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Search & Type Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-500 absolute top-2.5 right-3 left-auto ltr:right-auto ltr:left-3" />
              <input
                type="text"
                placeholder={isAr ? 'ابحث في أسماء ومحتوى ملفات قاعدة البيانات...' : 'Search database files...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-9 pl-3 ltr:pr-3 ltr:pl-9 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                {isAr ? 'نوع الملف:' : 'Type:'}
              </span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 font-bold focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">{isAr ? 'جميع الأنواع' : 'All Types'}</option>
                <option value="pdf">PDF</option>
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
                <option value="txt">TXT</option>
              </select>

              {uploadedFiles.length > 0 && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                >
                  {isAr ? 'مسح الكل 🗑️' : 'Clear All 🗑️'}
                </button>
              )}
            </div>
          </div>

          {/* Clear All Confirmation Banner */}
          {showClearConfirm && (
            <div className="bg-rose-950/90 border border-rose-500/60 p-3.5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  {isAr
                    ? 'هل أنت تأكد من رغبتك في حذف وحظر جميع ملفات قاعدة البيانات المرفوعة نهائياً؟'
                    : 'Are you sure you want to clear all uploaded database files?'}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    onClearAllUploadedFiles();
                    setShowClearConfirm(false);
                    showNotification(isAr ? 'تم مسح كامل الملفات المرفوعة' : 'All files cleared');
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow cursor-pointer"
                >
                  {isAr ? 'تأكيد مسح كافة الملفات 🗑️' : 'Confirm Clear All'}
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </div>
          )}

          {/* Files Cards List */}
          {filteredFiles.length === 0 ? (
            <div className="text-center py-12 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-3">
              <Database className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-400">
                {isAr ? 'لا توجد ملفات مرفوعة مطابقة للبحث' : 'No database files found'}
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isAr
                  ? 'قم برفع ملفات PDF أو CSV أو JSON لتخزينها والتحكم بها في قاعدة البيانات'
                  : 'Upload PDF, CSV, or JSON files to manage your database.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredFiles.map((file) => {
                const isEditingThis = editingFileId === file.id;
                const isDeletingThis = confirmDeleteId === file.id;

                if (isEditingThis) {
                  return (
                    <div
                      key={file.id}
                      className="bg-slate-950 p-4 rounded-xl border-2 border-teal-500/60 shadow-xl space-y-3 animate-in fade-in duration-200"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <h4 className="text-xs font-bold text-teal-400 flex items-center gap-2">
                          <Edit3 className="w-4 h-4" />
                          <span>{isAr ? `تعديل الملف: ${file.name}` : `Edit File: ${file.name}`}</span>
                        </h4>
                        <button
                          onClick={() => setEditingFileId(null)}
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          ✕
                        </button>
                      </div>

                      <form onSubmit={(e) => handleSaveEdit(file, e)} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">
                              {isAr ? 'اسم الملف:' : 'File Name:'}
                            </label>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              required
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">
                              {isAr ? 'الوصف / الملخص Exec Summary:' : 'Summary:'}
                            </label>
                            <input
                              type="text"
                              value={editSummary}
                              onChange={(e) => setEditSummary(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">
                            {isAr
                              ? 'محتوى السياسة أو نص قاعدة البيانات المستخرج (Extracted Text):'
                              : 'Extracted Policy / Database Content:'}
                          </label>
                          <textarea
                            rows={5}
                            value={editExtractedText}
                            onChange={(e) => setEditExtractedText(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-teal-500"
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingFileId(null)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                          >
                            {isAr ? 'إلغاء' : 'Cancel'}
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow cursor-pointer flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isAr ? 'حفظ التعديلات 💾' : 'Save Changes 💾'}</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  );
                }

                if (isDeletingThis) {
                  return (
                    <div
                      key={file.id}
                      className="bg-rose-950/80 p-4 rounded-xl border-2 border-rose-500/60 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-200"
                    >
                      <div className="flex items-center gap-2.5 text-xs font-bold text-rose-200">
                        <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                        <div>
                          <p>{isAr ? `تأكيد حذف الملف (${file.name}) نهائياً؟` : `Delete (${file.name}) permanently?`}</p>
                          <p className="text-[10px] text-rose-300/80 font-normal mt-0.5">
                            {isAr ? 'سيتم إزالة هذا الملف من التخزين المحلي فوراً.' : 'Will remove from local storage permanently.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            onDeleteUploadedFile(file.id);
                            setConfirmDeleteId(null);
                            showNotification(isAr ? 'تم حذف الملف بنجاح' : 'File deleted');
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{isAr ? 'نعم، احذف الملف' : 'Yes, Delete'}</span>
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                        >
                          {isAr ? 'إلغاء' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={file.id}
                    className="bg-slate-950 p-4 rounded-xl border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={`p-2.5 rounded-xl border shrink-0 ${
                          file.type === 'pdf'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : file.type === 'csv'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : file.type === 'json'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-teal-500/10 text-teal-400 border-teal-500/30'
                        }`}
                      >
                        {file.type === 'pdf' && <FileText className="w-5 h-5" />}
                        {file.type === 'csv' && <FileSpreadsheet className="w-5 h-5" />}
                        {file.type === 'json' && <FileCode className="w-5 h-5" />}
                        {file.type === 'txt' && <FileText className="w-5 h-5" />}
                      </div>

                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-white truncate max-w-md">
                            {file.name}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-emerald-400 border border-slate-800 uppercase font-black">
                            {file.type}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                            {(file.sizeBytes / 1024).toFixed(1)} KB
                          </span>
                          {file.sourceModule && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20 font-medium">
                              {file.sourceModule === 'policy'
                                ? isAr ? 'استبيان السياسات' : 'Policy'
                                : file.sourceModule === 'dataset'
                                ? isAr ? 'استوديو البيانات' : 'Dataset'
                                : file.sourceModule === 'crawler'
                                ? isAr ? 'زاحف الموقع' : 'Crawler'
                                : isAr ? 'تقييم الامتثال' : 'Evaluation'}
                            </span>
                          )}
                        </div>

                        {file.summary && (
                          <p className="text-xs text-slate-300 leading-snug line-clamp-2">
                            {file.summary}
                          </p>
                        )}

                        {file.extractedText && (
                          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 text-[11px] font-mono text-slate-400 line-clamp-2 leading-relaxed">
                            {file.extractedText.slice(0, 200)}...
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-[10.5px] text-slate-500 pt-0.5 font-mono">
                          <span>{isAr ? `تاريخ الرفع: ${file.uploadedAt}` : `Uploaded: ${file.uploadedAt}`}</span>
                          <span>•</span>
                          <span>{isAr ? `بواسطة: ${file.uploadedBy}` : `By: ${file.uploadedBy}`}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons for this file */}
                    <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-900 shrink-0">
                      {/* Apply as active policy button */}
                      {file.extractedText && onApplyPolicyText && (
                        <button
                          onClick={() => {
                            onApplyPolicyText(file.extractedText!, file.name);
                            showNotification(
                              isAr
                                ? `تم تفعيل وتعيين سياسة (${file.name}) كسياسة الامتثال الحالية في النظام!`
                                : `Set (${file.name}) as active policy!`
                            );
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold transition-all cursor-pointer"
                          title={isAr ? 'تعيين النص كسياسة التدقيق النشطة' : 'Use as Active Policy'}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{isAr ? 'تطبيق كسياسة نشطة' : 'Set Active'}</span>
                        </button>
                      )}

                      {/* Download File */}
                      <button
                        onClick={() => handleDownloadFile(file)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title={isAr ? 'تنزيل/تصدير محتوى الملف' : 'Download file'}
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {/* Edit File Button */}
                      <button
                        onClick={() => handleStartEdit(file)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
                        title={isAr ? 'تعديل اسم أو محتوى الملف' : 'Edit file'}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isAr ? 'تعديل' : 'Edit'}</span>
                      </button>

                      {/* Delete File Button */}
                      <button
                        onClick={() => setConfirmDeleteId(file.id)}
                        className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                        title={isAr ? 'حذف الملف من التخزين' : 'Delete file'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              {isAr
                ? 'جميع المستندات وقواعد البيانات مخزنة مشفرة بذاكرة التخزين المحلي (LocalStorage) لضمان الخصوصية.'
                : 'All database files are securely stored in LocalStorage for privacy.'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق Window' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
