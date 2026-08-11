import React, { useState, useMemo } from 'react';
import {
  FileText,
  Building,
  User,
  Calendar,
  Sparkles,
  Upload,
  CheckCircle,
  AlertCircle,
  FileCheck,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Link2,
  Layers,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  GitMerge,
  Network,
  ArrowDown,
  ExternalLink,
} from 'lucide-react';
import { CompanyProfile, ControlEvaluation, Language, AiAuditResponse, UploadedFileRecord } from '../types';
import { NIST_SP800_53_REV5_CONTROLS } from '../data/nist_catalog';
import {
  matchPolicyTextToControls,
  segmentAndMatchPolicy,
  ControlMatchResult,
  PolicyParagraphMatch,
} from '../utils/textMatching';

interface PolicyQuestionnaireTabProps {
  companyProfile: CompanyProfile;
  setCompanyProfile: React.Dispatch<React.SetStateAction<CompanyProfile>>;
  onBatchUpdateEvaluations: (updates: Record<string, Partial<ControlEvaluation>>) => void;
  language: Language;
  onAuditCompleted?: (aiResponse: AiAuditResponse) => void;
  onAddUploadedFile?: (file: UploadedFileRecord) => void;
}

export const PolicyQuestionnaireTab: React.FC<PolicyQuestionnaireTabProps> = ({
  companyProfile,
  setCompanyProfile,
  onBatchUpdateEvaluations,
  language,
  onAuditCompleted,
  onAddUploadedFile,
}) => {
  const isAr = language === 'ar';
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [aiResult, setAiResult] = useState<AiAuditResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live Text Matching & Clause Mapper State
  const [clauseQuery, setClauseQuery] = useState('');
  const [mappedNotification, setMappedNotification] = useState<string | null>(null);
  const [showParagraphBreakdown, setShowParagraphBreakdown] = useState(false);

  // Live top matches for clauseQuery or full policy
  const liveClauseMatches = useMemo(() => {
    const textToMatch = clauseQuery.trim() || companyProfile.policyText;
    if (!textToMatch || textToMatch.trim().length < 3) return [];
    return matchPolicyTextToControls(textToMatch, NIST_SP800_53_REV5_CONTROLS, 8);
  }, [clauseQuery, companyProfile.policyText]);

  // Paragraph segmentation matches
  const paragraphMatches = useMemo(() => {
    if (!companyProfile.policyText || companyProfile.policyText.trim().length < 30) return [];
    return segmentAndMatchPolicy(companyProfile.policyText, NIST_SP800_53_REV5_CONTROLS);
  }, [companyProfile.policyText]);

  // One-click map policy clause to control
  const handleMapClauseToControl = (
    controlId: string,
    clauseSnippet: string,
    matchScore: number
  ) => {
    const isEnglish = /[a-zA-Z]{4,}/.test(clauseSnippet);
    const updates: Record<string, Partial<ControlEvaluation>> = {
      [controlId]: {
        status: 'yes',
        matchingClauseAr: isEnglish
          ? `[النص الأصلي بالإنجليزية]: ${clauseSnippet}\n[درجة المطابقة مع قاعدة بيانات NIST]: ${matchScore}%`
          : clauseSnippet,
        matchingClauseEn: clauseSnippet,
        notes: `تم الربط التلقائي بواسطة محرك مطابقة النصوص مع قاعدة بيانات المعايير (نسبة التوافق: ${matchScore}%)`,
        evidence: `مقتبس من بند السياسة المدخلة: "${clauseSnippet.slice(0, 160)}..."`,
      },
    };

    onBatchUpdateEvaluations(updates);
    setMappedNotification(
      isAr
        ? `تم ربط البند بنجاح بالضابط ${controlId} وتحديث حالة الامتثال إلى (ممتثل)`
        : `Successfully mapped clause to control ${controlId}!`
    );

    setTimeout(() => {
      setMappedNotification(null);
    }, 4000);
  };

  // Batch map policy clause to MULTIPLE NIST controls simultaneously (Relationship Mapping)
  const handleBatchMapClauseToControls = (
    matchResults: ControlMatchResult[],
    clauseSnippet: string
  ) => {
    if (!matchResults || matchResults.length === 0) return;

    const isEnglish = /[a-zA-Z]{4,}/.test(clauseSnippet);
    const updates: Record<string, Partial<ControlEvaluation>> = {};

    matchResults.forEach(({ control, matchScore }) => {
      updates[control.id] = {
        status: 'yes',
        matchingClauseAr: isEnglish
          ? `[النص الأصلي بالإنجليزية]: ${clauseSnippet}\n[درجة المطابقة مع خريطة الترابط NIST]: ${matchScore}%`
          : clauseSnippet,
        matchingClauseEn: clauseSnippet,
        notes: `تم الربط المتعدد التلقائي لخريطة الترابط (NIST Multi-Control Relationship Map) - نسبة التوافق: ${matchScore}%`,
        evidence: `مقتبس من بند السياسة المكتشف في الموقع: "${clauseSnippet.slice(0, 160)}..."`,
      };
    });

    onBatchUpdateEvaluations(updates);
    setMappedNotification(
      isAr
        ? `تم ربط البند بنجاح بـ (${matchResults.length}) ضوابط أمنية متفاوته في NIST وتحديث حالاتها جميعاً إلى (ممتثل)!`
        : `Successfully mapped clause to ALL ${matchResults.length} related NIST controls across catalog!`
    );

    setTimeout(() => {
      setMappedNotification(null);
    }, 4500);
  };

  // Success Toast state
  const [fileSuccessToast, setFileSuccessToast] = useState<string | null>(null);

  // Handle PDF / CSV / TXT / JSON file upload for policy text extraction
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPdf(true);
    setErrorMsg(null);
    const isPdf = file.name.toLowerCase().endsWith('.pdf');
    const isCsv = file.name.toLowerCase().endsWith('.csv');
    const isJson = file.name.toLowerCase().endsWith('.json');

    try {
      if (isPdf) {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64 = reader.result as string;
            const res = await fetch('/api/parse-pdf', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ base64File: base64, filename: file.name }),
            });

            const data = await res.json();
            const extractedText = data.extractedText || (isAr ? 'تم استخراج وتفريغ نص مستند PDF بنجاح.' : 'Extracted PDF content.');

            setCompanyProfile((prev) => ({
              ...prev,
              policyText: prev.policyText
                ? `${prev.policyText}\n\n--- [${file.name}] ---\n${extractedText}`
                : extractedText,
              uploadedPdfNames: Array.from(new Set([...prev.uploadedPdfNames, file.name])),
            }));

            if (onAddUploadedFile) {
              onAddUploadedFile({
                id: `pdf_${Date.now()}`,
                name: file.name,
                type: 'pdf',
                sizeBytes: file.size,
                uploadedAt: new Date().toLocaleString(isAr ? 'ar-SA' : 'en-US'),
                uploadedBy: companyProfile.auditorName || (isAr ? 'المستخدم الحالي' : 'Current User'),
                sourceModule: 'policy',
                summary: `مستند PDF استُخرج منه ${extractedText.length} حرف`,
                extractedText,
              });
            }

            setFileSuccessToast(
              isAr
                ? `تم رفع واستخراج نص مستند PDF (${file.name}) بنجاح وإضافته لسياسة الشركة!`
                : `PDF file (${file.name}) parsed and added to policy text!`
            );
          } catch (err: any) {
            console.error('PDF parsing fetch error:', err);
            setErrorMsg(isAr ? 'حدث خطأ أثناء معالجة ملف PDF.' : 'Failed to parse PDF.');
          } finally {
            setIsUploadingPdf(false);
          }
        };
        reader.readAsDataURL(file);
      } else {
        // Plain text, CSV, or JSON
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = (event.target?.result as string) || '';
          const lineCount = content.split('\n').filter(Boolean).length;
          const fileTypeStr = isCsv ? 'csv' : isJson ? 'json' : 'txt';

          setCompanyProfile((prev) => ({
            ...prev,
            policyText: prev.policyText
              ? `${prev.policyText}\n\n--- [${file.name}] ---\n${content}`
              : content,
            uploadedPdfNames: Array.from(new Set([...prev.uploadedPdfNames, file.name])),
          }));

          if (onAddUploadedFile) {
            onAddUploadedFile({
              id: `file_${Date.now()}`,
              name: file.name,
              type: fileTypeStr as any,
              sizeBytes: file.size,
              uploadedAt: new Date().toLocaleString(isAr ? 'ar-SA' : 'en-US'),
              uploadedBy: companyProfile.auditorName || (isAr ? 'المستخدم الحالي' : 'Current User'),
              itemCount: lineCount,
              sourceModule: 'policy',
              summary: `ملف ${fileTypeStr.toUpperCase()} ينطوي على ${lineCount} سطر / سجل`,
              extractedText: content,
            });
          }

          setFileSuccessToast(
            isAr
              ? `تم رفع وإلحاق ملف (${file.name}) بنجاح بنافذة سياسة الشركة!`
              : `File (${file.name}) attached to policy text!`
          );
          setIsUploadingPdf(false);
        };
        reader.readAsText(file);
      }
    } catch (err: any) {
      console.error('File upload error:', err);
      setErrorMsg(err.message || 'Failed to process file');
      setIsUploadingPdf(false);
    }
  };

  // Run AI Analysis function with enhanced error handling & retry mechanism
  const analyzePolicyWithAI = async () => {
    if (!companyProfile.policyText || companyProfile.policyText.trim().length < 20) {
      setErrorMsg(
        isAr
          ? 'يرجى إدخال نص سياسة الشركة أو رفع ملف PDF يحتوي على نص السياسة أولاً.'
          : 'Please enter company policy text or upload a PDF document first.'
      );
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/analyze-policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policyText: companyProfile.policyText,
          companyName: companyProfile.companyName || 'المؤسسة المستهدفة',
          language,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const status = res.status;
        const msg = errData.error || errData.details || '';

        if (status === 429 || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('rate-limits')) {
          throw new Error(
            isAr
              ? 'تنبيه: تم تجاوز حد الاستدعاءات المتاح مؤقتاً لخدمة Gemini. يرجى الانتظار بضع ثوانٍ ثم الضغط على زر "إعادة المحاولة (Retry)".'
              : 'Warning: Gemini API quota exceeded temporarily. Please wait a few seconds and click "Retry".'
          );
        } else if (status >= 500 || msg.includes('fetch') || msg.includes('network')) {
          throw new Error(
            isAr
              ? 'تنبيه: تعذر الاتصال بخادم تحليل الخصوصية أو حدث انقطاع في الشبكة. اضغط على "إعادة المحاولة (Retry)" لإعادة الإرسال.'
              : 'Warning: Could not connect to policy analysis server or network error. Click "Retry" to attempt re-analyzing.'
          );
        } else {
          throw new Error(
            msg ||
              (isAr
                ? 'فشل تحليل النص عبر الذكاء الاصطناعي. يرجى التحقق من النص والضغط على "إعادة المحاولة".'
                : 'Failed to analyze policy text with AI. Please check text and click "Retry".')
          );
        }
      }

      const data: AiAuditResponse = await res.json();
      setAiResult(data);

      // Map AI results directly to control evaluations
      const evalUpdates: Record<string, Partial<ControlEvaluation>> = {};

      if (Array.isArray(data.evaluations)) {
        data.evaluations.forEach((item) => {
          const isEnglishClause = /[a-zA-Z]{4,}/.test(item.matchingClause || '');
          evalUpdates[item.controlId] = {
            status: item.status as 'yes' | 'partial' | 'no',
            aiSuggestedStatus: item.status as 'yes' | 'partial' | 'no',
            matchingClauseAr: isEnglishClause
              ? `[البند الأصلي بالإنجليزية]: ${item.matchingClause}\n[الشرح والترجمة بالعربية]: ${item.reasoningAr}`
              : item.matchingClause,
            matchingClauseEn: item.matchingClause,
            notes: item.reasoningAr || item.reasoningEn,
            evidence: item.matchingClause
              ? isEnglishClause
                ? `بند من سياسة باللغة الإنجليزية: "${item.matchingClause.slice(0, 180)}..."\nالتحليل بالعربية: ${item.reasoningAr}`
                : `مقتبس من السياسة: "${item.matchingClause.slice(0, 180)}..."`
              : 'تحليل أوتوماتيكي للذكاء الاصطناعي',
          };
        });
      }

      onBatchUpdateEvaluations(evalUpdates);
      if (onAuditCompleted) {
        onAuditCompleted(data);
      }
    } catch (err: any) {
      console.error('AI Audit error:', err);
      setErrorMsg(err.message || (isAr ? 'حدث خطأ أثناء الاتصال بخدمة Gemini.' : 'Error connecting to Gemini service.'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRunAiAudit = analyzePolicyWithAI;

  return (
    <div className="space-y-6">
      {/* Questionnaire Form Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {isAr ? '2. بيانات واستبيان سياسة الشركة' : '2. Company Profile & Policy Questionnaire'}
            </h2>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'أدخل بيانات المؤسسة والصق نص سياسة الخصوصية أو ارفع ملف PDF للتحليل الأوتوماتيكي عبر الذكاء الاصطناعي.'
                : 'Enter company details, paste privacy policy text, or upload PDF files for AI auditing.'}
            </p>
          </div>
        </div>

        {/* Company Profile Form Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Company Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-teal-400" />
              <span>{isAr ? 'اسم الشركة / المؤسسة:' : 'Company Name:'}</span>
            </label>
            <input
              type="text"
              value={companyProfile.companyName}
              onChange={(e) => setCompanyProfile((p) => ({ ...p, companyName: e.target.value }))}
              placeholder={isAr ? 'مثال: شركة التقنية الوطنية' : 'e.g. Acme Tech Solutions'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Auditor Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAr ? 'اسم الفاحص / المدقق المسؤول:' : 'Auditor / Assessor Name:'}</span>
            </label>
            <input
              type="text"
              value={companyProfile.auditorName}
              onChange={(e) => setCompanyProfile((p) => ({ ...p, auditorName: e.target.value }))}
              placeholder={isAr ? 'مثال: م. أحمد العتيبي (أخصائي الخصوصية)' : 'e.g. Alex Morgan, CISSP'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Assessment Date & Sector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAr ? 'تاريخ الفحص والمجال:' : 'Assessment Date & Sector:'}</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={companyProfile.assessmentDate}
                onChange={(e) => setCompanyProfile((p) => ({ ...p, assessmentDate: e.target.value }))}
                className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              <input
                type="text"
                value={companyProfile.industry}
                onChange={(e) => setCompanyProfile((p) => ({ ...p, industry: e.target.value }))}
                placeholder={isAr ? 'القطاع (تقنية/مالي)' : 'Industry Sector'}
                className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Policy Text Area & Upload PDF File */}
        <div className="space-y-3">
          {/* File Success Notification Toast */}
          {fileSuccessToast && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center justify-between shadow-lg animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium">{fileSuccessToast}</span>
              </div>
              <button
                onClick={() => setFileSuccessToast(null)}
                className="text-slate-400 hover:text-white font-mono text-xs p-1"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <span>{isAr ? 'نص سياسة الخصوصية / الشروط والأحكام:' : 'Privacy Policy / Terms Text:'}</span>
              {companyProfile.uploadedPdfNames.length > 0 && (
                <span className="text-[11px] bg-slate-800 text-teal-300 px-2 py-0.5 rounded-full border border-slate-700">
                  {companyProfile.uploadedPdfNames.length} {isAr ? 'ملف مرفق' : 'Uploaded Files'}
                </span>
              )}
            </label>

            <div className="flex items-center gap-2">
              {companyProfile.policyText && (
                <button
                  type="button"
                  onClick={() => {
                    setCompanyProfile((p) => {
                      const updated = { ...p, policyText: '', uploadedPdfNames: [] };
                      localStorage.setItem('compliance_company_profile_v2', JSON.stringify(updated));
                      return updated;
                    });
                    if (setAiResult) setAiResult(null);
                    setEvaluations((prevEval) => {
                      const resetEvalObj: Record<string, ControlEvaluation> = {};
                      Object.keys(prevEval).forEach((cId) => {
                        resetEvalObj[cId] = {
                          controlId: cId,
                          status: 'unanswered',
                          notes: '',
                          evidence: '',
                          matchingClauseAr: '',
                          matchingClauseEn: '',
                        };
                      });
                      localStorage.setItem('compliance_evaluations_v3', JSON.stringify(resetEvalObj));
                      return resetEvalObj;
                    });
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition-all cursor-pointer"
                >
                  {isAr ? 'مسح كافة السياسات والتقييمات 🗑️' : 'Clear Policies & Evaluations 🗑️'}
                </button>
              )}

              <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-emerald-400 border border-slate-700 transition-all">
                <Upload className="w-3.5 h-3.5" />
                <span>
                  {isUploadingPdf
                    ? isAr
                      ? 'جاري تفريغ ومعالجة المستند...'
                      : 'Processing Document...'
                    : isAr
                    ? 'رفع مستند سياسة (PDF / CSV / TXT)'
                    : 'Upload Policy (PDF/CSV/TXT)'}
                </span>
                <input
                  type="file"
                  accept=".pdf,.csv,.json,.txt"
                  onClick={(e) => {
                    (e.target as HTMLInputElement).value = '';
                  }}
                  onChange={handlePdfUpload}
                  disabled={isUploadingPdf}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <textarea
            rows={10}
            value={companyProfile.policyText}
            onChange={(e) => setCompanyProfile((p) => ({ ...p, policyText: e.target.value }))}
            placeholder={
              isAr
                ? 'الصق نص سياسة الخصوصية الخاصة بالمؤسسة هنا (بالعربية أو الإنجليزية)، أو قم برفع مستند PDF للسياسة ليقوم النظام بقراءته واستخراج النصوص منه أوتوماتيكياً...'
                : 'Paste company privacy policy text here (Arabic or English) or upload PDF document...'
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all leading-relaxed"
          />

          {companyProfile.policyText && /[a-zA-Z]{5,}/.test(companyProfile.policyText) && (
            <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl text-xs text-teal-300 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-base">🌐</span>
                <span>
                  {isAr
                    ? 'تم الكشف عن سياسة باللغة الإنجليزية: سيقوم الذكاء الاصطناعي (Gemini) بفرز النصوص الإنجليزية وتحليلها وترجمتها فورياً إلى اللغة العربية في التقرير والضوابط.'
                    : 'English policy detected: AI will automatically analyze, map, and translate clauses to Arabic.'}
                </span>
              </div>
              <span className="shrink-0 px-2 py-0.5 rounded bg-teal-500/20 text-[10px] font-bold text-teal-200 uppercase tracking-wider">
                Cross-Lingual AI
              </span>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="mt-4 p-4 bg-rose-950/40 border border-rose-500/30 rounded-2xl text-xs text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30 shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div className="space-y-1">
                <span className="font-bold text-rose-300 block text-xs">
                  {isAr ? 'تنبيه خطأ في خدمة الفحص (Gemini AI Audit Alert):' : 'Audit Service Error Alert:'}
                </span>
                <p className="leading-relaxed text-rose-200/90">{errorMsg}</p>
              </div>
            </div>

            <button
              onClick={analyzePolicyWithAI}
              disabled={isAnalyzing}
              className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950/50 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAr ? 'إعادة المحاولة (Retry)' : 'Retry Analysis'}</span>
            </button>
          </div>
        )}

        {/* Action Button: Run AI Audit */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleRunAiAudit}
            disabled={isAnalyzing || !companyProfile.policyText}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{isAr ? 'جاري تحليل السياسة بالذكاء الاصطناعي (Gemini)...' : 'Auditing Policy with Gemini AI...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>
                  {isAr
                    ? 'بدء الفحص الآلي ومطابقة السياسة مع معايير NIST'
                    : 'Start AI Policy Audit against NIST Controls'}
                </span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* INTERACTIVE TEXT-MATCHING & NIST CATALOG MAPPING ENGINE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>
                  {isAr
                    ? '3. محرك الربط التلقائي والبحث في قاعدة بيانات معايير NIST'
                    : '3. NIST SP 800-53 Catalog Matching & Linking Engine'}
                </span>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 font-mono font-bold px-2 py-0.5 rounded border border-teal-500/30">
                  Full Catalog DB
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {isAr
                  ? 'ابحث في كافة الضوابط المخزنة في قاعدة البيانات للربط الآلي لأي فقرة أو سياسة (بالعربية أو الإنجليزية) بأقرب معيار أمني مع نسبة التوافق.'
                  : 'Search across all catalog controls to map any policy clause (Arabic or English) to closest NIST security/privacy control.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowParagraphBreakdown((prev) => !prev)}
            disabled={!companyProfile.policyText || paragraphMatches.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer shrink-0"
          >
            <Layers className="w-4 h-4" />
            <span>
              {isAr
                ? showParagraphBreakdown
                  ? 'إخفاء مصفوفة ربط الفقرات'
                  : `مصفوفة ربط فقرات السياسة (${paragraphMatches.length} فقرة)`
                : showParagraphBreakdown
                ? 'Hide Paragraph Matrix'
                : `Policy Paragraphs Matrix (${paragraphMatches.length})`}
            </span>
            {showParagraphBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {mappedNotification && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{mappedNotification}</span>
          </div>
        )}

        {/* Clause Input Search Box */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-200 flex items-center justify-between">
            <span>
              {isAr
                ? 'أدخل أو الصق نص فقرة/سياسة للمطابقة المباشرة وبناء خريطة الترابط المتعددة:'
                : 'Enter or paste a clause/sentence to generate NIST multi-control relationship map:'}
            </span>
            <span className="text-[11px] font-mono text-teal-400 font-semibold flex items-center gap-1">
              <Network className="w-3.5 h-3.5" />
              {isAr ? 'خريطة الترابط المتعدد (Multi-Control Graph)' : 'Multi-Control Mapping'}
            </span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={clauseQuery}
              onChange={(e) => setClauseQuery(e.target.value)}
              placeholder={
                isAr
                  ? 'مثال: نحن نستخدم التشفير لحماية نقل البيانات ونفرض المصادقة الثنائية MFA ونحافظ على السجلات... / We encrypt data in transit & enforce MFA...'
                  : 'e.g. We enforce multi-factor authentication, SSL encryption, and maintain security logs...'
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 pl-10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-all font-mono shadow-inner"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
            {clauseQuery && (
              <button
                onClick={() => setClauseQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* VISUAL MULTI-CONTROL RELATIONSHIP MAP (خريطة الترابط المتعدد) */}
        {liveClauseMatches.length > 0 && (
          <div className="p-4 bg-slate-950 border border-teal-500/30 rounded-2xl space-y-4 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-500/15 text-teal-300 rounded-xl border border-teal-500/30">
                  <GitMerge className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <span>
                      {isAr
                        ? 'خريطة الترابط المتعدد: هذا البند المكتشف يغطي الضوابط التالية في NIST:'
                        : 'Multi-Control Relationship Map: Clause maps to these NIST controls:'}
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      {liveClauseMatches.length} {isAr ? 'ضوابط مرتبطة' : 'Mapped Controls'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {isAr
                      ? 'يوضح الرسم الترابطي كيف تمتد سياسة الموقع المكتشفة لتغطي أكثر من ضابط أمني عبر عائلات NIST المختلفة.'
                      : 'Shows how a single discovered policy text spans across multiple NIST security & privacy control families.'}
                  </p>
                </div>
              </div>

              {/* BATCH LINK ALL CONTROLS BUTTON */}
              <button
                onClick={() =>
                  handleBatchMapClauseToControls(
                    liveClauseMatches,
                    clauseQuery.trim() || companyProfile.policyText.slice(0, 300)
                  )
                }
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-900/40 transition-all cursor-pointer shrink-0"
              >
                <Network className="w-4 h-4" />
                <span>
                  {isAr
                    ? `ربط كـامـل الـ (${liveClauseMatches.length}) ضوابط المرتبطة دفعة واحدة`
                    : `Link to ALL (${liveClauseMatches.length}) Controls At Once`}
                </span>
              </button>
            </div>

            {/* RELATIONAL TREE / CONNECTING GRAPH NODES VIEW */}
            <div className="space-y-2">
              <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center gap-2 font-mono">
                <span className="text-teal-400 font-bold shrink-0">📜 {isAr ? 'مصدر السياسة:' : 'Policy Clause:'}</span>
                <span className="truncate italic">
                  "{clauseQuery.trim() || companyProfile.policyText.slice(0, 150) || '...'}"
                </span>
              </div>

              <div className="flex justify-center my-1">
                <div className="flex items-center gap-1.5 text-[11px] text-teal-400 font-mono bg-slate-900/80 px-3 py-1 rounded-full border border-teal-500/30">
                  <ArrowDown className="w-3.5 h-3.5 animate-bounce text-teal-300" />
                  <span>{isAr ? 'يرتبط وينبثق منه خريطة ترابط مع الضوابط التالية:' : 'Branches into related controls:'}</span>
                </div>
              </div>

              {/* Mapped Control Family Badges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {liveClauseMatches.map(({ control, matchScore, matchedKeywords }) => (
                  <div
                    key={control.id}
                    className="p-2.5 bg-slate-900/80 hover:bg-slate-900 rounded-xl border border-slate-800 hover:border-teal-500/40 text-xs space-y-1.5 transition-all group"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-teal-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
                          {control.id}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                          {control.familyCode}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        {matchScore}% {isAr ? 'مطابقة' : 'match'}
                      </span>
                    </div>

                    <h5 className="font-bold text-slate-200 text-[11px] truncate">
                      {isAr ? control.titleAr : control.titleEn}
                    </h5>

                    <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800/60">
                      <span className="text-[10px] text-slate-400 truncate">
                        {isAr ? control.familyNameAr : control.familyNameEn}
                      </span>

                      <button
                        onClick={() =>
                          handleMapClauseToControl(
                            control.id,
                            clauseQuery.trim() || companyProfile.policyText.slice(0, 300),
                            matchScore
                          )
                        }
                        className="text-[10px] text-teal-300 hover:text-white font-bold bg-teal-500/20 hover:bg-teal-500/30 px-2 py-0.5 rounded border border-teal-500/40 flex items-center gap-1 transition-all cursor-pointer shrink-0"
                      >
                        <Link2 className="w-3 h-3" />
                        <span>{isAr ? 'ربط منفرد' : 'Link'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Live Matching Results Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              {isAr
                ? clauseQuery
                  ? `تفاصيل قائمة الضوابط المطابقة للنص المدخل (${liveClauseMatches.length} ضابط):`
                  : `أقرب الضوابط للنص الإجمالي للسياسة (${liveClauseMatches.length} ضابط):`
                : `Top Matching NIST Controls (${liveClauseMatches.length}):`}
            </span>
            <span className="text-[11px] text-emerald-400 font-mono">
              {isAr ? 'تقنية المطابقة الدلالية النصية' : 'Semantic Text-Matching Engine'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
            {liveClauseMatches.length === 0 ? (
              <div className="col-span-2 p-6 text-center text-xs text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
                {isAr
                  ? 'يرجى إدخال نص في حقل البحث أو لصق سياسة الخصوصية لإجراء البحث في قاعدة البيانات.'
                  : 'Enter text above or paste policy to perform database matching.'}
              </div>
            ) : (
              liveClauseMatches.map(({ control, matchScore, matchedKeywords }) => (
                <div
                  key={control.id}
                  className="bg-slate-950 border border-slate-800 hover:border-teal-500/50 rounded-xl p-3 text-xs flex flex-col justify-between gap-2.5 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-teal-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {control.id}
                        </span>
                        <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
                          {control.familyCode}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        {matchScore}% {isAr ? 'توافق' : 'match'}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-200 line-clamp-1">
                      {isAr ? control.titleAr : control.titleEn}
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-normal">
                      {isAr ? control.descriptionAr : control.descriptionEn}
                    </p>

                    {matchedKeywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {matchedKeywords.slice(0, 4).map((kw, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-slate-900 text-teal-400 px-1.5 py-0.5 rounded border border-slate-800 font-mono"
                          >
                            #{kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() =>
                      handleMapClauseToControl(
                        control.id,
                        clauseQuery.trim() || companyProfile.policyText.slice(0, 300),
                        matchScore
                      )
                    }
                    className="w-full py-1.5 px-3 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/40 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>
                      {isAr ? `ربط بالضابط ${control.id} وتحديث الامتثال` : `Link to Control ${control.id}`}
                    </span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Paragraph Segmentation Breakdown Matrix */}
        {showParagraphBreakdown && paragraphMatches.length > 0 && (
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-teal-400 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>
                  {isAr
                    ? 'مصفوفة التجزئة التلقائية وخريطة ترابط فقرات السياسة بالمعايير:'
                    : 'Automated Policy Paragraphs to Multi-Control Mapping Matrix:'}
                </span>
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">
                {paragraphMatches.length} {isAr ? 'فقرة محللة' : 'analyzed paragraphs'}
              </span>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
              {paragraphMatches.map((pMatch) => (
                <div
                  key={pMatch.paragraphIndex}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-400 text-[11px]">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <GitMerge className="w-3.5 h-3.5 text-teal-400" />
                      <span>{isAr ? `الفقرة رقم #${pMatch.paragraphIndex}` : `Paragraph #${pMatch.paragraphIndex}`}</span>
                    </span>

                    <button
                      onClick={() => handleBatchMapClauseToControls(pMatch.topMatches, pMatch.paragraphText)}
                      className="px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer self-start sm:self-auto"
                    >
                      <Network className="w-3 h-3 text-emerald-400" />
                      <span>
                        {isAr
                          ? `ربط الفقرة بجميع الضوابط الـ (${pMatch.topMatches.length}) دفعة واحدة`
                          : `Batch Link to All (${pMatch.topMatches.length}) Controls`}
                      </span>
                    </button>
                  </div>

                  <p className="text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 leading-relaxed font-mono text-[11px]">
                    "{pMatch.paragraphText}"
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/60">
                    <span className="text-[10px] text-slate-400 font-bold">{isAr ? 'الضوابط الترابطية:' : 'Linked Controls:'}</span>
                    {pMatch.topMatches.map(({ control, matchScore }) => (
                      <button
                        key={control.id}
                        onClick={() =>
                          handleMapClauseToControl(control.id, pMatch.paragraphText, matchScore)
                        }
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-teal-500/40 text-[11px] font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                        title={isAr ? control.titleAr : control.titleEn}
                      >
                        <span className="font-bold text-emerald-400">{control.id}</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1 rounded font-bold">
                          {matchScore}%
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          ({isAr ? control.titleAr.slice(0, 16) : control.titleEn.slice(0, 16)}...)
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Audit Result Overview */}
      {aiResult && (
        <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {isAr ? 'نتائج التقييم الآلي لسياسة الخصوصية' : 'AI Policy Audit Evaluation Results'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isAr
                    ? 'تم مطابقة نصوص السياسة مع معايير NIST SP 800-53 Rev 5 وتحديث نموذج التقييم أوتوماتيكياً.'
                    : 'Policy clauses mapped directly to NIST SP 800-53 Rev 5 controls.'}
                </p>
              </div>
            </div>

            <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center">
              <div className="text-xs text-slate-400">{isAr ? 'درجة الامتثال المقدرة' : 'Estimated Score'}</div>
              <div className="text-xl font-extrabold text-emerald-400">{aiResult.overallScore}%</div>
            </div>
          </div>

          {/* Executive Summaries */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
            <h4 className="font-bold text-emerald-400 mb-1">{isAr ? 'الملخص التنفيذي:' : 'Executive Summary:'}</h4>
            <p>{isAr ? aiResult.summaryAr : aiResult.summaryEn}</p>
          </div>

          {/* Strengths & Weaknesses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4">
              <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-2">
                <CheckCircle className="w-4 h-4" />
                <span>{isAr ? 'نقاط القوة في السياسة:' : 'Policy Strengths:'}</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {(isAr ? aiResult.strengthsAr : aiResult.strengthsEn).map((st, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{st}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses / Gaps */}
            <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-4">
              <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5 mb-2">
                <AlertCircle className="w-4 h-4" />
                <span>{isAr ? 'نقاط الضعف والثغرات التنظيمية:' : 'Policy Compliance Gaps:'}</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {(isAr ? aiResult.weaknessesAr : aiResult.weaknessesEn).map((wk, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>{wk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Individual Control Mapping Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              {isAr ? 'تفاصيل مطابقة الضوابط والمعايير:' : 'NIST Control Clause Mapping:'}
            </h4>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
              {aiResult.evaluations.map((item) => (
                <div
                  key={item.controlId}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-emerald-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                      {item.controlId}
                    </span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 ${
                        item.status === 'yes'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : item.status === 'partial'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {item.status === 'yes' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : item.status === 'partial' ? (
                        <AlertTriangle className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      <span>
                        {item.status === 'yes'
                          ? isAr
                            ? 'نعم'
                            : 'Yes'
                          : item.status === 'partial'
                          ? isAr
                            ? 'جزئي'
                            : 'Partial'
                          : isAr
                          ? 'لا'
                          : 'No'}
                      </span>
                    </span>
                  </div>

                  <div className="flex-1 text-slate-300">
                    <p className="font-semibold text-slate-200">
                      {isAr ? item.reasoningAr : item.reasoningEn}
                    </p>
                    {item.matchingClause && (
                      <p className="text-[11px] text-slate-400 italic mt-0.5">
                        "{item.matchingClause}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
