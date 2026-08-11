import React, { useRef, useState } from 'react';
import {
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Building,
  UserCheck,
  Calendar,
  Award,
  FileCheck2,
  FileText,
  Sparkles,
  BarChart3,
  Printer,
  ChevronRight,
  TrendingUp,
  Mail,
  Phone,
  PieChart as PieChartIcon,
  Trash2,
  Eye,
  Upload,
  FileSpreadsheet,
  Search,
  Lock,
  HardDrive,
  Copy,
  Check,
  Filter,
  Layers,
  Database,
  ShieldAlert,
  FolderCheck,
  RotateCcw,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { prepareClonedDocForPdf } from '../utils/pdfUtils';
import { NistControl, ControlEvaluation, CompanyProfile, Language, AiAuditResponse, UploadedFileRecord, UserAccount } from '../types';
import { NIST_FAMILIES } from '../data/nist_catalog';
import { ExpandableControlDescription } from './ExpandableControlDescription';

interface DashboardReportTabProps {
  controls: NistControl[];
  evaluations: Record<string, ControlEvaluation>;
  companyProfile: CompanyProfile;
  setCompanyProfile?: React.Dispatch<React.SetStateAction<CompanyProfile>>;
  language: Language;
  aiAuditData: AiAuditResponse | null;
  uploadedFiles?: UploadedFileRecord[];
  onAddUploadedFile?: (file: UploadedFileRecord) => void;
  onDeleteUploadedFile?: (fileId: string) => void;
  onClearAllUploadedFiles?: () => void;
  currentUser?: UserAccount | null;
}

export const DashboardReportTab: React.FC<DashboardReportTabProps> = ({
  controls,
  evaluations,
  companyProfile,
  setCompanyProfile,
  language,
  aiAuditData,
  uploadedFiles = [],
  onAddUploadedFile,
  onDeleteUploadedFile,
  onClearAllUploadedFiles,
  currentUser,
}) => {
  const isAr = language === 'ar';
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Sub-tab switcher inside Dashboard: 'report' vs 'files'
  const [dashboardSubTab, setDashboardSubTab] = useState<'report' | 'files'>('report');

  // File Manager States
  const [fileSearchTerm, setFileSearchTerm] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<'all' | 'pdf' | 'csv' | 'other'>('all');
  const [previewFile, setPreviewFile] = useState<UploadedFileRecord | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [showConfirmClearAll, setShowConfirmClearAll] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isUploadingDashboardFile, setIsUploadingDashboardFile] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Compute metrics
  const totalControls = controls.length;
  let yesCount = 0;
  let partialCount = 0;
  let noCount = 0;
  let naCount = 0;

  controls.forEach((ctrl) => {
    const ev = evaluations[ctrl.id];
    if (ev) {
      if (ev.status === 'yes') yesCount++;
      else if (ev.status === 'partial') partialCount++;
      else if (ev.status === 'no') noCount++;
      else if (ev.status === 'na') naCount++;
    }
  });

  const validTotal = totalControls - naCount;
  const overallScore = validTotal > 0 ? Math.round(((yesCount * 1.0 + partialCount * 0.5) / validTotal) * 100) : 0;

  // Compliance Status Label
  let complianceLevelAr = 'ممتثل بالكامل';
  let complianceLevelEn = 'Fully Compliant';
  let levelColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

  if (overallScore < 50) {
    complianceLevelAr = 'غير ممتثل (مخاطر عالية)';
    complianceLevelEn = 'Non-Compliant (High Risk)';
    levelColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  } else if (overallScore < 80) {
    complianceLevelAr = 'ممتثل جزئياً (يتطلب إجراءات تصحيحية)';
    complianceLevelEn = 'Partially Compliant';
    levelColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  }

  // Family Score Breakdown
  const familyBreakdown = NIST_FAMILIES.filter((f) => f.code !== 'ALL').map((fam) => {
    const famControls = controls.filter((c) => c.familyCode === fam.code);
    let fYes = 0;
    let fPart = 0;
    let fNa = 0;

    famControls.forEach((c) => {
      const ev = evaluations[c.id];
      if (ev?.status === 'yes') fYes++;
      else if (ev?.status === 'partial') fPart++;
      else if (ev?.status === 'na') fNa++;
    });

    const fValid = famControls.length - fNa;
    const fScore = fValid > 0 ? Math.round(((fYes * 1.0 + fPart * 0.5) / fValid) * 100) : 0;

    return {
      familyCode: fam.code,
      familyNameAr: fam.nameAr,
      familyNameEn: fam.nameEn,
      score: fScore,
      total: famControls.length,
      yesCount: fYes,
      partialCount: fPart,
    };
  });

  // Chart Datasets for Recharts
  const statusPieData = [
    { name: isAr ? 'ممتثل بالكامل (نعم)' : 'Fully Compliant', value: yesCount, color: '#10b981' },
    { name: isAr ? 'ممتثل جزئياً' : 'Partially Compliant', value: partialCount, color: '#f59e0b' },
    { name: isAr ? 'غير ممتثل (ثغرات)' : 'Non-Compliant Gaps', value: noCount, color: '#f43f5e' },
    { name: isAr ? 'غير منطبق (مستثناة)' : 'N/A Excluded', value: naCount, color: '#64748b' },
  ].filter((d) => d.value > 0);

  const familyBarData = familyBreakdown.map((fam) => ({
    code: fam.familyCode,
    name: isAr ? fam.familyNameAr : fam.familyNameEn,
    score: fam.score,
    yes: fam.yesCount,
    partial: fam.partialCount,
  }));

  // Strengths and Weaknesses derived from evaluations or AI
  const derivedStrengthsAr =
    aiAuditData?.strengthsAr ||
    controls
      .filter((c) => evaluations[c.id]?.status === 'yes')
      .slice(0, 5)
      .map((c) => `التزام تام بمعيار (${c.id}): ${c.titleAr}`);

  const derivedWeaknessesAr =
    aiAuditData?.weaknessesAr ||
    controls
      .filter((c) => evaluations[c.id]?.status === 'no' || evaluations[c.id]?.status === 'partial')
      .slice(0, 5)
      .map((c) => `قصور في معيار (${c.id}): ${c.titleAr}`);

  const derivedRecommendationsAr =
    aiAuditData?.recommendationsAr || [
      'اعتماد سياسات معالجة وتصنيف البيانات الشخصية رسمياً وتوزيعها على الأقسام.',
      'تحديث إشعارات الخصوصية المعلنة على الموقع الإلكتروني لتضمن الحقوق الدقيقة للمستخدمين.',
      'تفعيل التشفير الإجباري للبيانات المخزنة وفي أثناء النقل باستخدام بروتوكولات TLS 1.3.',
      'إجراء اختبارات اختراق وتقييم أثر الخصوصية (PIA) دورياً وتوثيق نتائجها.',
    ];

  // Standalone HTML Report Exporter (100% works in any iframe & allows direct printing)
  const handleDownloadHtmlReport = () => {
    if (!reportRef.current) return;

    try {
      const reportHtml = `
        <!DOCTYPE html>
        <html dir="${isAr ? 'rtl' : 'ltr'}">
          <head>
            <meta charset="utf-8" />
            <title>${isAr ? 'تقرير تقييم الامتثال لحماية البيانات والخصوصية' : 'Data Protection Compliance Report'}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body {
                background-color: #0f172a;
                color: #f8fafc;
                padding: 30px;
                font-family: system-ui, -apple-system, sans-serif;
              }
              @media print {
                body { padding: 0; background-color: #0f172a !important; }
                .no-print { display: none !important; }
              }
            </style>
          </head>
          <body>
            <div style="max-width: 1000px; margin: 0 auto;">
              <div class="no-print" style="margin-bottom: 24px; display: flex; gap: 12px; align-items: center; justify-content: space-between; background: #1e293b; padding: 16px; border-radius: 12px; border: 1px solid #334155;">
                <span style="font-weight: bold; color: #38bdf8; font-size: 14px;">
                  ${isAr ? '📄 تقرير الامتثال النهائي الشامل' : '📄 Master Compliance Audit Report'}
                </span>
                <button onclick="window.print()" style="background: #059669; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;">
                  ${isAr ? '🖨️ طباعة أو حفظ كـ PDF الان (Print / Save PDF)' : '🖨️ Print or Save as PDF Now'}
                </button>
              </div>
              ${reportRef.current.innerHTML}
            </div>
          </body>
        </html>
      `;

      const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = `NIST-Privacy-Report-${companyProfile.companyName || 'Company'}.html`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      console.error('HTML export error:', err);
    }
  };

  // Direct Window Printing Handler with explicit loading delay
  const handlePrint = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPdf(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      // Ensure overlay is hidden right before calling print
      setIsGeneratingPdf(false);
      window.focus();
      window.print();
    } catch (err) {
      console.warn('Window print error or blocked, falling back to standalone HTML report export:', err);
      handleDownloadHtmlReport();
      setIsGeneratingPdf(false);
    }
  };

  // PDF Export Logic with html2canvas and jsPDF
  const handleDownloadPdf = async () => {
    if (!reportRef.current) {
      alert(isAr ? 'لم يتم العثور على التقرير' : 'Report reference not found');
      return;
    }
    setIsGeneratingPdf(true);

    try {
      // Pause to ensure React DOM state and charts settle
      await new Promise((resolve) => setTimeout(resolve, 400));

      const currentScrollY = window.scrollY;
      window.scrollTo(0, 0);

      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#0f172a',
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1200,
        onclone: (clonedDoc) => {
          prepareClonedDocForPdf(clonedDoc);
        },
      });

      window.scrollTo(0, currentScrollY);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const fileName = `NIST-SP800-53-Privacy-Audit-${companyProfile.companyName || 'Company'}-${
        companyProfile.assessmentDate || 'Report'
      }.pdf`;

      // 1. Primary download trigger via jsPDF
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      // Fallback: If canvas or jsPDF fails, export standalone HTML report file
      handleDownloadHtmlReport();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // File Upload Handler directly inside Dashboard
  const handleDashboardFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDashboardFile(true);
    const fileNameLower = file.name.toLowerCase();
    const fileType = fileNameLower.endsWith('.pdf')
      ? 'pdf'
      : fileNameLower.endsWith('.csv')
      ? 'csv'
      : fileNameLower.endsWith('.json')
      ? 'json'
      : 'txt';

    try {
      if (fileType === 'pdf') {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result as string;
          try {
            const res = await fetch('/api/parse-pdf', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ base64File: base64, filename: file.name }),
            });
            const data = await res.json();
            const extractedText = data.extractedText || (isAr ? 'تم استخراج وتخزين محتوى PDF في التخزين المحلي بنجاح.' : 'Extracted PDF text saved to local storage.');

            if (setCompanyProfile && extractedText) {
              setCompanyProfile((prev) => ({
                ...prev,
                policyText: prev.policyText
                  ? `${prev.policyText}\n\n--- [${file.name}] ---\n${extractedText}`
                  : extractedText,
                uploadedPdfNames: Array.from(new Set([...prev.uploadedPdfNames, file.name])),
              }));
            }

            if (onAddUploadedFile) {
              onAddUploadedFile({
                id: `pdf_${Date.now()}`,
                name: file.name,
                type: 'pdf',
                sizeBytes: file.size,
                uploadedAt: new Date().toLocaleString(isAr ? 'ar-SA' : 'en-US'),
                uploadedBy: currentUser?.fullName || companyProfile.auditorName || (isAr ? 'المستخدم الحالي' : 'Current User'),
                sourceModule: 'policy',
                summary: `مستند PDF مستخرج بنجاح (${extractedText.length} حرف)`,
                extractedText,
              });
            }

            setToastMsg(isAr ? `تم رفع وحفظ ملف PDF (${file.name}) في التخزين المحلي بنجاح!` : `PDF file (${file.name}) saved to local storage!`);
          } catch (err) {
            console.error('Failed to parse PDF', err);
          } finally {
            setIsUploadingDashboardFile(false);
          }
        };
        reader.readAsDataURL(file);
      } else {
        // CSV, TXT, JSON
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          const lineCount = content.split('\n').filter(Boolean).length;

          if (onAddUploadedFile) {
            onAddUploadedFile({
              id: `file_${Date.now()}`,
              name: file.name,
              type: fileType,
              sizeBytes: file.size,
              uploadedAt: new Date().toLocaleString(isAr ? 'ar-SA' : 'en-US'),
              uploadedBy: currentUser?.fullName || companyProfile.auditorName || (isAr ? 'المستخدم الحالي' : 'Current User'),
              itemCount: lineCount,
              sourceModule: fileType === 'csv' ? 'dataset' : 'evaluation',
              summary: `ملف ${fileType.toUpperCase()} يحتوي على ${lineCount} سطر / سجل.`,
              extractedText: content,
            });
          }

          setToastMsg(isAr ? `تم رفع وحفظ ملف ${fileType.toUpperCase()} (${file.name}) في التخزين المحلي بنجاح!` : `File (${file.name}) saved to local storage!`);
          setIsUploadingDashboardFile(false);
        };
        reader.readAsText(file);
      }
    } catch (err) {
      console.error(err);
      setIsUploadingDashboardFile(false);
    }
  };

  // Toast Timer
  React.useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  // Compute Storage Size
  const totalStorageBytes = uploadedFiles.reduce((acc, f) => acc + (f.sizeBytes || 0), 0);
  const totalStorageFormatted =
    totalStorageBytes > 1024 * 1024
      ? `${(totalStorageBytes / (1024 * 1024)).toFixed(2)} MB`
      : `${(totalStorageBytes / 1024).toFixed(1)} KB`;

  const pdfCount = uploadedFiles.filter((f) => f.type === 'pdf').length;
  const csvCount = uploadedFiles.filter((f) => f.type === 'csv').length;

  // Filtered files list
  const filteredUploadedFiles = uploadedFiles.filter((f) => {
    const matchesSearch =
      !fileSearchTerm.trim() ||
      f.name.toLowerCase().includes(fileSearchTerm.toLowerCase()) ||
      f.uploadedBy.toLowerCase().includes(fileSearchTerm.toLowerCase()) ||
      (f.summary && f.summary.toLowerCase().includes(fileSearchTerm.toLowerCase()));

    const matchesType =
      fileTypeFilter === 'all' ||
      (fileTypeFilter === 'pdf' && f.type === 'pdf') ||
      (fileTypeFilter === 'csv' && f.type === 'csv') ||
      (fileTypeFilter === 'other' && f.type !== 'pdf' && f.type !== 'csv');

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8 relative">
      {/* Toast Notification Notification Banner */}
      {toastMsg && (
        <div className="fixed top-20 right-8 z-50 bg-emerald-900 border border-emerald-500/50 text-emerald-200 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-xs font-bold">{toastMsg}</span>
        </div>
      )}

      {/* SUB-TAB NAVIGATION HEADER SWITCHER */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-2 rounded-2xl shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setDashboardSubTab('report')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              dashboardSubTab === 'report'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>{isAr ? 'لوحة القياس وتقرير الامتثال النهائي' : 'Compliance Dashboard & Report'}</span>
          </button>

          <button
            onClick={() => setDashboardSubTab('files')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              dashboardSubTab === 'files'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FolderCheck className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'إدارة وقاعدة المستندات المرفوعة (PDF / CSV)' : 'Uploaded Documents & Privacy Manager'}</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-950 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
              {uploadedFiles.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-[11px] text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{isAr ? 'التخزين المحلي آمن 100% (Local Offline Storage)' : '100% Local Privacy Guaranteed'}</span>
        </div>
      </div>
      {/* VISIBLE LOADING OVERLAY FOR PDF / PRINT ENGINE */}
      {isGeneratingPdf && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-teal-500/50 rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center mx-auto text-teal-400">
              <div className="w-8 h-8 border-3 border-teal-400 border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">
                {isAr ? 'جاري تجهيز بيانات التقرير ومحرك الطباعة...' : 'Preparing Report Data & Print Engine...'}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? 'يرجى الانتظار، يتم معالجة الرسومات البيانية وجداول الضوابط بالكامل قبل استدعاء نافذة الطباعة / PDF'
                  : 'Please wait while all data and charts are being packaged before print'}
              </p>
            </div>
          </div>
        </div>
      )}
      {/* VIEW 1: UPLOADED FILES & DATA PRIVACY STORAGE MANAGER */}
      {dashboardSubTab === 'files' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Privacy & Security Header Alert */}
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      {isAr ? 'أرشيف وقاعدة المستندات المرفوعة (PDF & CSV) لضمان خصوصية البيانات' : 'Uploaded PDF & CSV Files Privacy Archive'}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                      100% Local Storage
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
                    {isAr
                      ? 'جميع المستندات وملفات الـ PDF و CSV المرفوعة سلفاً أو المرفوعة جديداً تُحفظ وتُعالج بالكامل في ذاكرة التخزين المحلي للمتصفح (Local Storage). لا يتم نقل أو تخزين ملفاتك على أي خوادم خارجية دائمة، وتملك التحكم المطلق لمعاينة النص أو حذف أي ملف نهائياً بضغط زر واحدة.'
                      : 'All uploaded PDF and CSV documents are securely stored and processed in browser local storage. Your files are never persisted on cloud servers. You hold full control to inspect, download, or permanently purge any file at any time.'}
                  </p>
                </div>
              </div>

              {uploadedFiles.length > 0 && (
                <button
                  onClick={() => setShowConfirmClearAll(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-300 text-xs font-bold transition-all shrink-0 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>{isAr ? 'تفريغ وحذف جميع الملفات دفعة واحدة' : 'Bulk Wipe All Files'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-slate-400 text-[11px] block">{isAr ? 'إجمالي الملفات المخزنة' : 'Total Uploaded Files'}</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold font-mono text-white">{uploadedFiles.length}</span>
                <FolderCheck className="w-5 h-5 text-emerald-400" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-slate-400 text-[11px] block">{isAr ? 'حجم التخزين المحلي' : 'Local Storage Size'}</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold font-mono text-teal-300">{totalStorageFormatted}</span>
                <HardDrive className="w-5 h-5 text-teal-400" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-slate-400 text-[11px] block">{isAr ? 'مستندات PDF' : 'PDF Documents'}</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold font-mono text-rose-300">{pdfCount}</span>
                <FileText className="w-5 h-5 text-rose-400" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-slate-400 text-[11px] block">{isAr ? 'جداول CSV / بيانات' : 'CSV Datasets'}</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold font-mono text-emerald-300">{csvCount}</span>
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Search, Filter & Direct Upload Toolbar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2 right-3 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto pointer-events-none" />
                <input
                  type="text"
                  value={fileSearchTerm}
                  onChange={(e) => setFileSearchTerm(e.target.value)}
                  placeholder={isAr ? 'بحث باسم المستند أو اسم المرفِق...' : 'Search file name or uploader...'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 ltr:pl-9 ltr:pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Type Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded-xl shrink-0">
                <button
                  onClick={() => setFileTypeFilter('all')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    fileTypeFilter === 'all' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isAr ? 'الكل' : 'All'}
                </button>
                <button
                  onClick={() => setFileTypeFilter('pdf')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    fileTypeFilter === 'pdf' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  PDF
                </button>
                <button
                  onClick={() => setFileTypeFilter('csv')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    fileTypeFilter === 'csv' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  CSV
                </button>
              </div>
            </div>

            {/* Direct Upload Button */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <label className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 cursor-pointer transition-all">
                {isUploadingDashboardFile ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{isAr ? 'جاري رفع ومعالجة المستند...' : 'Processing Document...'}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>{isAr ? 'رفع مستند جديد (PDF / CSV)' : 'Upload New File (PDF/CSV)'}</span>
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf,.csv,.json,.txt"
                  onClick={(e) => {
                    (e.target as HTMLInputElement).value = '';
                  }}
                  onChange={handleDashboardFileUpload}
                  disabled={isUploadingDashboardFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Uploaded Files Table / List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {filteredUploadedFiles.length === 0 ? (
              <div className="p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                  <FolderCheck className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">
                    {uploadedFiles.length === 0
                      ? isAr
                        ? 'لا توجد مستندات مرفوعة حالياً في ذاكرة التخزين المحلي'
                        : 'No files currently stored in local storage'
                      : isAr
                      ? 'لا توجد مستندات مطابقة لمعايير البحث'
                      : 'No files match your search filter'}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {isAr
                      ? 'قم برفع ملفات PDF الخاصة بسياسات الشركة أو ملفات CSV لقواعد البيانات للبدء في التحليل التلقائي مع حفظها محلياً.'
                      : 'Upload company policy PDFs or CSV datasets to begin auditing and store them securely.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left rtl:text-right border-collapse">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="p-4">{isAr ? 'اسم المستند والنوع' : 'Document Name & Format'}</th>
                      <th className="p-4">{isAr ? 'الحجم' : 'Size'}</th>
                      <th className="p-4">{isAr ? 'تاريخ الرفع' : 'Upload Date'}</th>
                      <th className="p-4">{isAr ? 'المستخدم الفاحص' : 'Uploaded By'}</th>
                      <th className="p-4">{isAr ? 'المصدر' : 'Source'}</th>
                      <th className="p-4">{isAr ? 'الملخص' : 'Summary'}</th>
                      <th className="p-4 text-center">{isAr ? 'إجراءات الخصوصية' : 'Privacy Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-900/50">
                    {filteredUploadedFiles.map((file) => {
                      const sizeKb = (file.sizeBytes / 1024).toFixed(1);
                      const isPdf = file.type === 'pdf';
                      const isCsv = file.type === 'csv';

                      return (
                        <tr key={file.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 font-medium text-white">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                  isPdf
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                    : isCsv
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                                }`}
                              >
                                {isPdf ? (
                                  <FileText className="w-5 h-5" />
                                ) : isCsv ? (
                                  <FileSpreadsheet className="w-5 h-5" />
                                ) : (
                                  <Database className="w-5 h-5" />
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-slate-100 block">{file.name}</span>
                                <span
                                  className={`inline-block text-[10px] uppercase font-mono px-1.5 py-0.5 rounded font-bold mt-0.5 ${
                                    isPdf
                                      ? 'bg-rose-500/20 text-rose-300'
                                      : isCsv
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : 'bg-teal-500/20 text-teal-300'
                                  }`}
                                >
                                  {file.type.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="p-4 font-mono font-bold text-slate-300 whitespace-nowrap">
                            {file.sizeBytes > 1024 * 1024
                              ? `${(file.sizeBytes / (1024 * 1024)).toFixed(2)} MB`
                              : `${sizeKb} KB`}
                          </td>

                          <td className="p-4 text-slate-400 whitespace-nowrap">{file.uploadedAt}</td>

                          <td className="p-4 text-slate-300 whitespace-nowrap font-medium">{file.uploadedBy}</td>

                          <td className="p-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-teal-400 font-medium">
                              {file.sourceModule === 'policy'
                                ? isAr
                                  ? 'استبيان السياسة'
                                  : 'Policy Module'
                                : file.sourceModule === 'dataset'
                                ? isAr
                                  ? 'قاعدة البيانات'
                                  : 'Dataset Studio'
                                : isAr
                                ? 'زاحف المواقع'
                                : 'Web Crawler'}
                            </span>
                          </td>

                          <td className="p-4 text-slate-400 max-w-xs truncate">
                            {file.summary || (isAr ? 'مستند مخصص' : 'Custom Document')}
                          </td>

                          <td className="p-4 whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                              {/* Preview Button */}
                              <button
                                onClick={() => setPreviewFile(file)}
                                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
                                title={isAr ? 'معاينة محتوى المستند' : 'Preview Document Text'}
                              >
                                <Eye className="w-4 h-4 text-teal-400" />
                              </button>

                              {/* Download Text Button */}
                              {file.extractedText && (
                                <button
                                  onClick={() => {
                                    const blob = new Blob([file.extractedText || ''], { type: 'text/plain;charset=utf-8' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `Extracted-${file.name}.txt`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                  }}
                                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
                                  title={isAr ? 'تنزيل النص المستخرج' : 'Download Extracted Text'}
                                >
                                  <Download className="w-4 h-4 text-emerald-400" />
                                </button>
                              )}

                              {/* Delete File Button */}
                              <button
                                onClick={() => setDeletingFileId(file.id)}
                                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
                                title={isAr ? 'حذف الملف نهائياً من التخزين المحلي' : 'Delete File from Local Storage'}
                              >
                                <Trash2 className="w-4 h-4 text-rose-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: COMPLIANCE AUDIT DASHBOARD REPORT */}
      {dashboardSubTab === 'report' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Top Action Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Award className="w-6 h-6 text-emerald-400" />
                <span>
                  {isAr ? '4. لوحة ملخص الامتثال والتقرير النهائي PDF' : '4. Compliance Dashboard & PDF Report'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr
                  ? 'تقرير موثق ومتكامل يحتسب الامتثال الكلي لمعايير NIST SP 800-53 Rev 5 ويتضمن اسم الفاحص، والشركة، ونقاط القوة والضعف.'
                  : 'Official compliance report with auditor name, company details, score breakdown, and strengths/weaknesses.'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-xl shadow-emerald-600/30 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isGeneratingPdf ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{isAr ? 'جاري إنشاء وتقفيل ملف PDF...' : 'Generating PDF File...'}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>{isAr ? 'تحميل تقرير الامتثال PDF' : 'Download PDF Report'}</span>
                  </>
                )}
              </button>

              <button
                onClick={handlePrint}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
                title={isAr ? 'طباعة التقرير' : 'Print Report'}
              >
                <Printer className="w-4 h-4 text-slate-300" />
                <span className="text-xs font-bold hidden sm:inline">{isAr ? 'طباعة' : 'Print'}</span>
              </button>
            </div>
          </div>

      {/* PRINTABLE / PDF REPORT CANVAS CONTAINER */}
      <div
        ref={reportRef}
        className="print-area bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-slate-200 space-y-8 font-sans"
      >
        {/* Document Header Seal / Watermark Header */}
        <div className="border-b-2 border-emerald-500/40 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl p-0.5 shadow-lg flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
              </div>
            </div>

            <div>
              <div className="text-xs uppercase font-extrabold tracking-wider text-emerald-400">
                NIST SP 800-53 Rev 5 Standard Assessment
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {isAr
                  ? 'تقرير فحص وامتثال لوائح حماية البيانات والخصوصية'
                  : 'Privacy & Data Protection Compliance Audit Report'}
              </h1>
              <div className="text-xs text-slate-400 mt-1">
                {isAr
                  ? 'صادر وفق المراجعة الشاملة لضوابط NIST والسياسات الداخلية'
                  : 'Issued under comprehensive NIST SP 800-53 Rev 5 control audit'}
              </div>
            </div>
          </div>

          <div className="text-right rtl:text-left text-xs bg-slate-950 p-3.5 rounded-xl border border-slate-800 shrink-0">
            <div className="text-slate-400 font-medium">Ref No: NIST-AUDIT-{Date.now().toString().slice(-6)}</div>
            <div className="text-emerald-400 font-bold mt-0.5">
              {isAr ? 'الحالة:' : 'Status:'} {isAr ? complianceLevelAr : complianceLevelEn}
            </div>
          </div>
        </div>

        {/* Auditor & Company Info Metadata Table */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-teal-400" />
              <span>{isAr ? 'اسم الشركة / الجهة:' : 'Company Name:'}</span>
            </span>
            <span className="font-bold text-white text-sm truncate block">
              {companyProfile.companyName || (isAr ? 'غير محدد' : 'Not Specified')}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAr ? 'اسم الفاحص / المدقق:' : 'Auditor Name:'}</span>
            </span>
            <span className="font-bold text-white text-sm truncate block">
              {companyProfile.auditorName || (isAr ? 'المدقق المعتمد' : 'Certified Auditor')}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-teal-400" />
              <span>{isAr ? 'البريد الإلكتروني:' : 'Email Address:'}</span>
            </span>
            <span className="font-bold text-white text-xs font-mono truncate block">
              {companyProfile.email || 'auditor@company.com'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAr ? 'رقم الهاتف / الجوال:' : 'Phone Number:'}</span>
            </span>
            <span className="font-bold text-white text-xs font-mono truncate block">
              {companyProfile.phoneNumber || '+966 50 000 0000'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAr ? 'تاريخ الفحص:' : 'Assessment Date:'}</span>
            </span>
            <span className="font-bold text-white text-xs font-mono block">{companyProfile.assessmentDate}</span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-teal-400" />
              <span>{isAr ? 'القطاع / المجال:' : 'Industry Sector:'}</span>
            </span>
            <span className="font-bold text-white text-xs truncate block">{companyProfile.industry || 'Technology / Services'}</span>
          </div>
        </div>

        {/* Score Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Overall Gauge Score */}
          <div className="md:col-span-2 bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-6">
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-400 transition-all duration-1000"
                  strokeDasharray={`${overallScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-2xl font-black text-white">{overallScore}%</span>
              </div>
            </div>

            <div>
              <span className={`text-xs px-2.5 py-1 rounded-full border font-bold ${levelColor}`}>
                {isAr ? complianceLevelAr : complianceLevelEn}
              </span>
              <h3 className="text-base font-bold text-white mt-2">
                {isAr ? 'درجة الامتثال التنفيذي الكلية' : 'Overall Compliance Score'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isAr
                  ? `مستند إلى تقييم ${validTotal} معيار من أصل ${totalControls} معايير فنية وتنظيمية.`
                  : `Calculated from ${validTotal} active controls evaluated.`}
              </p>
            </div>
          </div>

          {/* Stat Counters */}
          <div className="md:col-span-2 grid grid-cols-2 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-500/30 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <div className="text-lg font-black text-white">{yesCount}</div>
                <div className="text-[11px] text-emerald-400 font-semibold">
                  {isAr ? 'معايير ممتثلة بالكامل (نعم)' : 'Fully Compliant'}
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-amber-500/30 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <div className="text-lg font-black text-white">{partialCount}</div>
                <div className="text-[11px] text-amber-400 font-semibold">
                  {isAr ? 'معايير ممتثلة جزئياً' : 'Partially Compliant'}
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-rose-500/30 flex items-center gap-3">
              <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
              <div>
                <div className="text-lg font-black text-white">{noCount}</div>
                <div className="text-[11px] text-rose-400 font-semibold">
                  {isAr ? 'غير ممتثلة (ثغرات)' : 'Non-Compliant Gaps'}
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
              <HelpCircle className="w-6 h-6 text-slate-400 shrink-0" />
              <div>
                <div className="text-lg font-black text-white">{naCount}</div>
                <div className="text-[11px] text-slate-400 font-semibold">
                  {isAr ? 'غير منطبق (مستثناة)' : 'N/A Excluded'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* INTERACTIVE RECHARTS AUDIT ANALYTICS SECTION */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-teal-400" />
              <span>
                {isAr
                  ? 'الرسوم البيانية التفاعلية لنِسَب الامتثال والتغطية السيبرانية (Recharts Analytics)'
                  : 'Interactive Recharts Compliance & Coverage Analytics'}
              </span>
            </h3>
            <span className="text-[11px] text-teal-400 font-mono bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/30">
              {isAr ? 'تفاعلي للمدققين' : 'Auditor Interactive'}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Donut Pie Chart - Status Distribution */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-1">
                  <PieChartIcon className="w-4 h-4 text-emerald-400" />
                  <span>{isAr ? 'توزيع حالات تقييم الضوابط' : 'Control Assessment Status Breakdown'}</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  {isAr ? 'نسب تفكيك نتائج المعايير الخاضعة للفحص' : 'Percentage split of evaluated controls'}
                </p>
              </div>

              <div className="w-full h-56 my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const percent = Math.round((data.value / totalControls) * 100);
                          return (
                            <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-2xl text-xs space-y-1 font-sans">
                              <p className="font-bold text-white">{data.name}</p>
                              <p style={{ color: data.color }} className="font-mono font-extrabold">
                                {data.value} {isAr ? 'معيار' : 'controls'} ({percent}%)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span className="text-[11px] text-slate-300 font-medium">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Bar Chart - Compliance % per NIST Family */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between lg:col-span-2">
              <div>
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-1">
                  <BarChart3 className="w-4 h-4 text-teal-400" />
                  <span>{isAr ? 'مقارنة نسبة الامتثال % حسب عوائل NIST' : 'Compliance % per NIST Control Family'}</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  {isAr ? 'مؤشر أداء ومقاييس مجالات الأمان والخصوصية' : 'Security and privacy performance matrix'}
                </p>
              </div>

              <div className="w-full h-56 my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={familyBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis
                      dataKey="code"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} unit="%" />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1 font-sans">
                              <p className="font-bold text-teal-400">
                                {data.code} - {data.name}
                              </p>
                              <p className="text-emerald-400 font-mono font-bold">
                                {isAr ? 'نسبة الامتثال:' : 'Compliance Score:'} {data.score}%
                              </p>
                              <p className="text-slate-300 font-mono text-[11px]">
                                {isAr ? 'ممتثل:' : 'Compliant:'} {data.yes} | {isAr ? 'جزئي:' : 'Partial:'} {data.partial}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="score" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={45}>
                      {familyBarData.map((entry, index) => (
                        <Cell
                          key={`bar-${index}`}
                          fill={entry.score >= 80 ? '#10b981' : entry.score >= 50 ? '#f59e0b' : '#f43f5e'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Chart 3: Radar Chart - Multi-domain Coverage Mesh */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'شبكة التغطية الجدارية لتقييم المخاطر (Radar Mesh)' : 'Security & Privacy Radar Coverage Mesh'}</span>
            </h4>
            <p className="text-[11px] text-slate-400 mb-2">
              {isAr ? 'تحليل مساحي متوازن لإبراز أبعاد القوة والفجوات التنظيمية' : 'Balanced visual breakdown highlighting organizational gaps and strength vectors'}
            </p>

            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={familyBarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="code" stroke="#94a3b8" fontSize={11} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={10} />
                  <Radar
                    name={isAr ? 'نسبة الامتثال' : 'Compliance %'}
                    dataKey="score"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.35}
                  />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-2xl text-xs space-y-1 font-sans">
                            <p className="font-bold text-emerald-400">{data.code} - {data.name}</p>
                            <p className="text-white font-mono font-extrabold">{isAr ? 'درجة الامتثال:' : 'Compliance:'} {data.score}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* NIST Controls Family Progress Bars */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'درجات الامتثال حسب مجالات معايير NIST:' : 'Compliance Score per Control Family:'}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {familyBreakdown.map((fam) => (
              <div key={fam.familyCode} className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-200">{isAr ? fam.familyNameAr : fam.familyNameEn}</span>
                  <span className="font-mono font-bold text-emerald-400">{fam.score}%</span>
                </div>

                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${fam.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* STRENGTHS & WEAKNESSES SECTIONS (نقاط القوة ونقاط الضعف) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Strengths (نقاط القوة) */}
          <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-3 border-b border-emerald-500/20 pb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? 'أولاً: نقاط القوة ومواضع الامتثال:' : '1. Key Compliance Strengths:'}</span>
            </h3>

            <ul className="space-y-2 text-xs text-slate-300">
              {derivedStrengthsAr.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-emerald-400 font-bold shrink-0">✓</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses / Gaps (نقاط الضعف والثغرات) */}
          <div className="bg-slate-950 border border-rose-500/30 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2 mb-3 border-b border-rose-500/20 pb-2">
              <XCircle className="w-5 h-5 text-rose-400" />
              <span>{isAr ? 'ثانياً: نقاط الضعف والمخاطر التنظيمية:' : '2. Key Compliance Weaknesses & Risks:'}</span>
            </h3>

            <ul className="space-y-2 text-xs text-slate-300">
              {derivedWeaknessesAr.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-rose-400 font-bold shrink-0">✗</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* RECOMMENDATIONS & ACTION PLAN (التوصيات والإجراءات التصحيحية) */}
        <div className="bg-slate-950 border border-teal-500/30 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-teal-400 flex items-center gap-2 mb-3 border-b border-teal-500/20 pb-2">
            <TrendingUp className="w-5 h-5 text-teal-400" />
            <span>{isAr ? 'ثالثاً: التوصيات وخطة العمل التصحيحية:' : '3. Actionable Recommendations Plan:'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
            {derivedRecommendationsAr.map((rec, idx) => (
              <div key={idx} className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{rec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FULL AUDIT TRAIL CONTROLS MATRIX TABLE */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'رابعاً: جدول حالة تفاصيل الامتثال لجميع المعايير:' : '4. Comprehensive Control Audit Matrix:'}</span>
          </h3>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-xs text-left rtl:text-right border-collapse">
              <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-3 font-mono">{isAr ? 'الرمز' : 'ID'}</th>
                  <th className="p-3">{isAr ? 'اسم المعيار والضابط' : 'Control Title'}</th>
                  <th className="p-3">{isAr ? 'حالة الامتثال' : 'Compliance'}</th>
                  <th className="p-3">{isAr ? 'الملاحظات والأدلة' : 'Notes & Evidence'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900/50">
                {controls.map((ctrl) => {
                  const ev = evaluations[ctrl.id] || { status: 'unanswered' };
                  return (
                    <tr key={ctrl.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 font-mono font-bold text-emerald-400 whitespace-nowrap align-top">{ctrl.id}</td>
                      <td className="p-3 font-medium text-slate-200 min-w-[280px]">
                        <ExpandableControlDescription
                          control={ctrl}
                          defaultLanguage={language}
                          showQuestion={false}
                          showDiscussion={true}
                          compact={true}
                        />
                      </td>
                      <td className="p-3 whitespace-nowrap align-top">
                        <span
                          className={`inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-lg text-xs ${
                            ev.status === 'yes'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : ev.status === 'partial'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : ev.status === 'no'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {ev.status === 'yes'
                            ? isAr
                              ? 'نعم (100%)'
                              : 'Yes'
                            : ev.status === 'partial'
                            ? isAr
                              ? 'جزئي (50%)'
                              : 'Partial'
                            : ev.status === 'no'
                            ? isAr
                              ? 'لا (0%)'
                              : 'No'
                            : isAr
                            ? 'غير محدد'
                            : 'Unanswered'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300 text-xs align-top max-w-xs leading-relaxed">
                        {ev.notes || ev.evidence || (isAr ? 'لم تسجل ملاحظات' : 'No notes recorded')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* POLICY DOCUMENT DETAILS & EVALUATED TEXT SECTION */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-teal-400 flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-400" />
              <span>
                {isAr
                  ? 'خامساً: تفاصيل ومحتوى نص وثيقة السياسة المعاينة والمفحوصة:'
                  : '5. Detailed Evaluated Policy Text & Document Content:'}
              </span>
            </div>
            {companyProfile.policyText && (
              <span className="text-[11px] font-mono text-slate-400 font-medium bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                {companyProfile.policyText.length} {isAr ? 'حرف' : 'chars'} | {companyProfile.policyText.split(/\s+/).filter(Boolean).length} {isAr ? 'كلمة' : 'words'}
              </span>
            )}
          </h3>

          {companyProfile.policyText ? (
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed max-h-80 overflow-y-auto custom-scrollbar">
              {companyProfile.policyText}
            </div>
          ) : (
            <div className="p-4 bg-slate-900/40 rounded-xl text-center text-xs text-slate-500 italic">
              {isAr
                ? 'لم يتم إدخال نص صريح للسياسة بعد في حقل استبيان السياسة أو جلبها عبر الزاحف.'
                : 'No explicit policy text entered yet in questionnaire or crawled.'}
            </div>
          )}
        </div>

        {/* AUDITOR SIGNATURE & STAMP FOOTER */}
        <div className="pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-6 text-xs text-slate-400">
          <div>
            <p className="font-bold text-slate-200 mb-1">{isAr ? 'يعتمد الفحص والتقييم:' : 'Auditor Authorization:'}</p>
            <p>{companyProfile.auditorName || (isAr ? 'أخصائي الخصوصية والأمن' : 'Privacy Assessor')}</p>
            <p className="text-[11px] text-slate-500">{isAr ? 'تاريخ الفحص: ' : 'Date: '} {companyProfile.assessmentDate}</p>
          </div>

          <div className="w-36 h-20 border-2 border-dashed border-emerald-500/30 rounded-xl flex items-center justify-center text-center p-2 text-[10px] text-emerald-400 font-mono bg-emerald-950/20">
            <div>
              <ShieldCheck className="w-5 h-5 mx-auto text-emerald-400 mb-0.5" />
              <span>OFFICIAL NIST AUDIT SEAL</span>
            </div>
          </div>
        </div>
      </div>
        </div>
      )}

      {/* MODAL 1: FILE TEXT PREVIEW MODAL */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    previewFile.type === 'pdf'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {previewFile.type === 'pdf' ? <FileText className="w-5 h-5" /> : <FileSpreadsheet className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{previewFile.name}</h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>{previewFile.uploadedAt}</span>
                    <span>•</span>
                    <span className="font-mono">{(previewFile.sizeBytes / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setPreviewFile(null);
                  setCopiedText(false);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Text Preview Box */}
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 leading-relaxed overflow-y-auto custom-scrollbar whitespace-pre-wrap">
              {previewFile.extractedText || previewFile.summary || (isAr ? 'لا يوجد نص مستخرج متاح' : 'No extracted text available')}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-3">
              <div className="text-[11px] text-slate-400 font-mono">
                {previewFile.extractedText ? (
                  <span>
                    {previewFile.extractedText.length} {isAr ? 'حرف' : 'chars'} | {previewFile.extractedText.split(/\s+/).filter(Boolean).length} {isAr ? 'كلمة' : 'words'}
                  </span>
                ) : (
                  <span>{isAr ? 'معاينة ملخص المستند' : 'Summary Preview'}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {previewFile.extractedText && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(previewFile.extractedText || '');
                      setCopiedText(true);
                      setTimeout(() => setCopiedText(false), 2000);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                  >
                    {copiedText ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>{isAr ? 'تم النسخ!' : 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-teal-400" />
                        <span>{isAr ? 'نسخ النص' : 'Copy Text'}</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={() => {
                    setPreviewFile(null);
                    setCopiedText(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  {isAr ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRM DELETE SINGLE FILE */}
      {deletingFileId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-white">
                {isAr ? 'تأكيد حذف المستند نهائياً من التخزين المحلي؟' : 'Confirm Permanent Local Deletion?'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? 'سيتم حذف هذا الملف ومسح بياناته المستخرجة بالكامل من ذاكرة التخزين المحلي لمتصفحك ولن يمكن استرجاعه، وذلك لضمان خصوصية بياناتك.'
                  : 'This document and its extracted contents will be permanently erased from local storage.'}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeletingFileId(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                onClick={() => {
                  if (onDeleteUploadedFile && deletingFileId) {
                    onDeleteUploadedFile(deletingFileId);
                    setToastMsg(isAr ? 'تم حذف المستند بنجاح من التخزين المحلي' : 'Document permanently deleted from local storage');
                  }
                  setDeletingFileId(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                {isAr ? 'نعم، احذف الملف الان' : 'Yes, Delete Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRM CLEAR ALL FILES */}
      {showConfirmClearAll && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-white">
                {isAr ? 'تأكيد تفريغ ومسح جميع الملفات المرفوعة؟' : 'Purge All Files From Local Storage?'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? 'سيتم مسح وتفريغ جميع ملفات الـ PDF و CSV المرفوعة سلفاً من التخزين المحلي 100% لضمان صفحة بيضاء وخالية تماماً من الآثار.'
                  : 'All previously uploaded PDF and CSV files will be completely wiped from browser local storage.'}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowConfirmClearAll(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                onClick={() => {
                  if (onClearAllUploadedFiles) {
                    onClearAllUploadedFiles();
                    setToastMsg(isAr ? 'تم تفريغ ومسح جميع المستندات من التخزين المحلي' : 'All local files successfully wiped');
                  }
                  setShowConfirmClearAll(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                {isAr ? 'نعم، تفريغ كافة الملفات' : 'Yes, Purge All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
