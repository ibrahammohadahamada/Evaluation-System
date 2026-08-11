import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Search,
  Filter,
  FileSpreadsheet,
  Upload,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { NistControl, ControlEvaluation, Language } from '../types';
import { NIST_FAMILIES } from '../data/nist_catalog';
import { translateTitleToAr, translateTextToAr } from '../utils/nistTranslator';
import { ExpandableControlDescription } from './ExpandableControlDescription';

interface EvaluationTabProps {
  controls: NistControl[];
  evaluations: Record<string, ControlEvaluation>;
  onUpdateEvaluation: (controlId: string, update: Partial<ControlEvaluation>) => void;
  language: Language;
  onImportCustomControls?: (newControls: NistControl[]) => void;
}

export const EvaluationTab: React.FC<EvaluationTabProps> = ({
  controls,
  evaluations,
  onUpdateEvaluation,
  language,
  onImportCustomControls,
}) => {
  const isAr = language === 'ar';
  const [selectedFamily, setSelectedFamily] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedControlId, setExpandedControlId] = useState<string | null>(null);
  const [privacyOnly, setPrivacyOnly] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Filter controls
  const filteredControls = controls.filter((ctrl) => {
    const matchesFamily = selectedFamily === 'ALL' || ctrl.familyCode === selectedFamily;
    const matchesSearch =
      ctrl.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ctrl.titleAr.includes(searchQuery) ||
      ctrl.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ctrl.descriptionAr.includes(searchQuery) ||
      ctrl.descriptionEn.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrivacy = !privacyOnly || ctrl.privacyFocus;

    return matchesFamily && matchesSearch && matchesPrivacy;
  });

  // Calculate quick summary metrics
  const totalCount = controls.length;
  let yesCount = 0;
  let partialCount = 0;
  let noCount = 0;
  let naCount = 0;
  let answeredCount = 0;

  Object.values(evaluations).forEach((ev: ControlEvaluation) => {
    if (ev.status === 'yes') {
      yesCount++;
      answeredCount++;
    } else if (ev.status === 'partial') {
      partialCount++;
      answeredCount++;
    } else if (ev.status === 'no') {
      noCount++;
      answeredCount++;
    } else if (ev.status === 'na') {
      naCount++;
      answeredCount++;
    }
  });

  const validTotal = totalCount - naCount;
  const rawScore = validTotal > 0 ? ((yesCount * 1.0 + partialCount * 0.5) / validTotal) * 100 : 0;
  const complianceScore = Math.round(rawScore);

  // Handle uploading PDF standard or custom CSV
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      if (file.name.endsWith('.pdf')) {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result as string;
          const res = await fetch('/api/parse-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64File: base64, filename: file.name }),
          });
          const data = await res.json();
          if (data.extractedText) {
            // Generate custom control item from PDF
            const customCtrl: NistControl = {
              id: `CUSTOM-${Date.now().toString().slice(-4)}`,
              familyCode: 'PT',
              familyNameAr: 'معايير مخصصة مضافة من ملف PDF',
              familyNameEn: 'Custom PDF Imported Controls',
              titleAr: `معيار مستخرج: ${file.name}`,
              titleEn: `Extracted Standard: ${file.name}`,
              descriptionAr: data.extractedText.slice(0, 300) + '...',
              descriptionEn: data.extractedText.slice(0, 300) + '...',
              questionAr: `هل تلتزم المؤسسة بضوابط المعيار المرفق في ملف (${file.name})؟`,
              questionEn: `Does the organization comply with controls in uploaded (${file.name})?`,
              privacyFocus: true,
              sourceFile: file.name,
            };
            if (onImportCustomControls) {
              onImportCustomControls([customCtrl]);
            }
          }
          setIsUploading(false);
        };
        reader.readAsDataURL(file);
      } else {
        // Assume text / csv
        const text = await file.text();
        const lines = text.split('\n').filter((l) => l.trim().length > 0);
        const importedList: NistControl[] = [];

        lines.slice(1, 100).forEach((line, idx) => {
          const parts = line.split(',');
          if (parts.length >= 2) {
            const rawTitle = parts[0]?.replace(/^"|"$/g, '').trim() || `معيار خارجي ${idx + 1}`;
            const rawDesc = parts[1]?.replace(/^"|"$/g, '').trim() || 'وصف المعيار المستورد من القائمة الخارجية';
            const ctrlId = `EXT-${idx + 1}`;

            const titleAr = translateTitleToAr(rawTitle, ctrlId);
            const descAr = translateTextToAr(rawDesc, titleAr);

            importedList.push({
              id: ctrlId,
              familyCode: 'PT',
              familyNameAr: 'معايير مستوردة من ملف خارجي',
              familyNameEn: 'Imported External Standards',
              titleAr,
              titleEn: rawTitle,
              descriptionAr: descAr,
              descriptionEn: rawDesc,
              questionAr: `هل المعيار [${ctrlId}] (${titleAr}) محقق ومطبق بفعالية؟`,
              questionEn: `Is control [${ctrlId}] (${rawTitle}) effectively implemented?`,
              privacyFocus: true,
              sourceFile: file.name,
            });
          }
        });

        if (importedList.length > 0 && onImportCustomControls) {
          onImportCustomControls(importedList);
        }
        setIsUploading(false);
      }
    } catch (err) {
      console.error('File import error:', err);
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <FileSpreadsheet className="w-4 h-4" />
              <span>{isAr ? 'مصدر البيانات والمعايير الأسس' : 'Primary Source Dataset'}</span>
              <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] border border-slate-700">
                NIST_SP-800-53_rev5_catalog_load.csv
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {isAr ? '1. تقييم الامتثال للمعايير والأسئلة' : '1. Interactive Standards Evaluation'}
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              {isAr
                ? 'قم بالإجابة على أسئلة الضوابط بـ (نعم، لا، جزئي، غير منطبق). يمكن إضافة ملاحظات وأدلة إثبات لكل معيار، كما يمكنك استيراد معايير إضافية من ملفات PDF خارجية.'
                : 'Evaluate each control with (Yes, No, Partial, N/A). Add implementation notes and evidence for each item, or import extra PDF/CSV controls.'}
            </p>
          </div>

          {/* Quick Compliance Score Gauge */}
          <div className="flex items-center gap-4 bg-slate-950/80 p-4 rounded-xl border border-slate-800 shrink-0">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-500 transition-all duration-700"
                  strokeDasharray={`${complianceScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-sm font-bold text-white">{complianceScore}%</span>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">
                {isAr ? 'نسبة الامتثال المحققة' : 'Current Compliance Score'}
              </div>
              <div className="text-xs text-emerald-400 font-semibold mt-0.5">
                {answeredCount} / {totalCount} {isAr ? 'تمت الإجابة عليها' : 'Evaluated'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {yesCount} {isAr ? 'نعم' : 'Yes'} | {partialCount} {isAr ? 'جزئي' : 'Partial'} | {noCount}{' '}
                {isAr ? 'لا' : 'No'}
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls & Upload Custom Standard */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="cursor-pointer flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-medium border border-emerald-500/30 transition-all">
              <Upload className="w-4 h-4" />
              <span>
                {isUploading
                  ? isAr
                    ? 'جاري رفع وتفريغ الملف...'
                    : 'Processing file...'
                  : isAr
                  ? 'رفع ملف معايير PDF / CSV إضافي'
                  : 'Import Custom PDF/CSV Standards'}
              </span>
              <input
                type="file"
                accept=".pdf,.csv,.txt"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              {isAr ? 'يدعم قراءة بيانات المعايير من ملفات PDF المرفقة' : 'Supports parsing PDF standards'}
            </span>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={privacyOnly}
              onChange={(e) => setPrivacyOnly(e.target.checked)}
              className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-slate-800"
            />
            <span>{isAr ? 'تصفية معايير الخصوصية و PII فقط' : 'Privacy & PII Controls Only'}</span>
          </label>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400 rtl:right-3.5 ltr:left-3.5 ltr:right-auto" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isAr ? 'ابحث برقم المعيار (مثال: PT-1, AC-1) أو الكلمات المفتاحية...' : 'Search control ID or title...'
            }
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-10 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedFamily}
            onChange={(e) => setSelectedFamily(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-all w-full sm:w-auto"
          >
            {NIST_FAMILIES.map((fam) => (
              <option key={fam.code} value={fam.code}>
                {isAr ? fam.nameAr : fam.nameEn}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Control Checklist Grid */}
      <div className="space-y-4">
        {filteredControls.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
            <Info className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p>{isAr ? 'لا توجد معايير تطابق خيارات البحث والتصفية المحددة' : 'No controls found matching filter.'}</p>
          </div>
        ) : (
          filteredControls.map((ctrl) => {
            const ev = evaluations[ctrl.id] || {
              controlId: ctrl.id,
              status: 'unanswered',
              notes: '',
              evidence: '',
            };

            const isExpanded = expandedControlId === ctrl.id;

            return (
              <div
                key={ctrl.id}
                className={`bg-slate-900 border rounded-2xl transition-all shadow-md overflow-hidden ${
                  ev.status === 'yes'
                    ? 'border-emerald-500/40 bg-emerald-950/10'
                    : ev.status === 'partial'
                    ? 'border-amber-500/40 bg-amber-950/10'
                    : ev.status === 'no'
                    ? 'border-rose-500/40 bg-rose-950/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Control Header Row */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <ExpandableControlDescription
                      control={ctrl}
                      defaultLanguage={language}
                      showQuestion={true}
                      showDiscussion={true}
                    />
                  </div>

                  {/* Status Radio Buttons */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {/* Yes */}
                    <button
                      onClick={() => onUpdateEvaluation(ctrl.id, { status: 'yes' })}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                        ev.status === 'yes'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isAr ? 'نعم (100%)' : 'Yes (100%)'}</span>
                    </button>

                    {/* Partial */}
                    <button
                      onClick={() => onUpdateEvaluation(ctrl.id, { status: 'partial' })}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                        ev.status === 'partial'
                          ? 'bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-600/30'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-amber-500/50 hover:bg-slate-800'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>{isAr ? 'جزئي (50%)' : 'Partial (50%)'}</span>
                    </button>

                    {/* No */}
                    <button
                      onClick={() => onUpdateEvaluation(ctrl.id, { status: 'no' })}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                        ev.status === 'no'
                          ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-rose-500/50 hover:bg-slate-800'
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                      <span>{isAr ? 'لا (0%)' : 'No (0%)'}</span>
                    </button>

                    {/* NA */}
                    <button
                      onClick={() => onUpdateEvaluation(ctrl.id, { status: 'na' })}
                      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                        ev.status === 'na'
                          ? 'bg-slate-700 text-slate-200 border-slate-600'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{isAr ? 'غير منطبق' : 'N/A'}</span>
                    </button>

                    {/* Toggle Expand Notes/Evidence */}
                    <button
                      onClick={() => setExpandedControlId(isExpanded ? null : ctrl.id)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
                      title={isAr ? 'إضافة أدلة وملاحظات' : 'Notes & Evidence'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* AI Suggestion Badge if available */}
                {ev.aiSuggestedStatus && (
                  <div className="px-5 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center gap-2 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span className="text-slate-400">
                      {isAr ? 'اقتراح الذكاء الاصطناعي بناءً على السياسة:' : 'AI Suggested Status from Policy:'}
                    </span>
                    <span
                      className={`font-bold capitalize px-2 py-0.5 rounded text-[11px] ${
                        ev.aiSuggestedStatus === 'yes'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : ev.aiSuggestedStatus === 'partial'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {ev.aiSuggestedStatus === 'yes'
                        ? isAr
                          ? 'نعم'
                          : 'Yes'
                        : ev.aiSuggestedStatus === 'partial'
                        ? isAr
                          ? 'جزئي'
                          : 'Partial'
                        : isAr
                        ? 'لا'
                        : 'No'}
                    </span>
                    {(ev.matchingClauseAr || ev.matchingClauseEn) && (
                      <span className="text-slate-400 truncate max-w-md hidden lg:inline">
                        "{isAr ? ev.matchingClauseAr : ev.matchingClauseEn}"
                      </span>
                    )}
                  </div>
                )}

                {/* Expanded Details: Description, Notes & Evidence */}
                {isExpanded && (
                  <div className="p-5 bg-slate-950 border-t border-slate-800/80 space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                        {isAr ? 'الوصف والتوجيهات الفنية (NIST SP 800-53 Rev 5)' : 'Control Description & Guidance'}
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-900 p-3 rounded-lg border border-slate-800">
                        {isAr ? ctrl.descriptionAr : ctrl.descriptionEn}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Notes */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          {isAr ? 'ملاحظات وتفاصيل التطبيق:' : 'Implementation Notes:'}
                        </label>
                        <textarea
                          rows={2}
                          value={ev.notes}
                          onChange={(e) => onUpdateEvaluation(ctrl.id, { notes: e.target.value })}
                          placeholder={
                            isAr
                              ? 'اكتب الآلية المتبعة داخل الشركة لتطبيق هذا الضابط...'
                              : 'Describe how this control is executed in company...'
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all"
                        />
                      </div>

                      {/* Evidence */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          {isAr ? 'مرجع الأدلة وثائق الإثبات (Evidence):' : 'Evidence & Documentation References:'}
                        </label>
                        <textarea
                          rows={2}
                          value={ev.evidence}
                          onChange={(e) => onUpdateEvaluation(ctrl.id, { evidence: e.target.value })}
                          placeholder={
                            isAr
                              ? 'مثال: سياسة الخصوصية مادة 4، سجل السيرفرات LOG-2026...'
                              : 'e.g. Privacy Manual Sec 4, Server Log Audit Report...'
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
