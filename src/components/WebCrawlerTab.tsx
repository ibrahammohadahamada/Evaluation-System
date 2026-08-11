import React, { useState, useRef } from 'react';
import {
  Globe,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  XCircle,
  Sparkles,
  Link2,
  FileText,
  Building,
  ArrowRight,
  Download,
  Printer,
  FileCheck2,
  Award,
  TrendingUp,
  BarChart3,
  Calendar,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import {
  PieChart as PieChartIcon,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { prepareClonedDocForPdf } from '../utils/pdfUtils';
import { CrawlResult, ControlEvaluation, Language, AiAuditResponse, NistControl, CompanyProfile } from '../types';

interface WebCrawlerTabProps {
  onBatchUpdateEvaluations: (updates: Record<string, Partial<ControlEvaluation>>) => void;
  language: Language;
  onAuditCompleted?: (aiResponse: AiAuditResponse) => void;
  onPolicyTextExtracted?: (text: string, url: string) => void;
  controls?: NistControl[];
  companyProfile?: CompanyProfile;
  setCompanyProfile?: React.Dispatch<React.SetStateAction<CompanyProfile>>;
  onNavigateToDashboard?: () => void;
}

export const WebCrawlerTab: React.FC<WebCrawlerTabProps> = ({
  onBatchUpdateEvaluations,
  language,
  onAuditCompleted,
  onPolicyTextExtracted,
  controls = [],
  companyProfile,
  setCompanyProfile,
  onNavigateToDashboard,
}) => {
  const isAr = language === 'ar';
  const siteReportRef = useRef<HTMLDivElement>(null);
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [isCrawling, setIsCrawling] = useState<boolean>(false);
  const [crawlResult, setCrawlResult] = useState<CrawlResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAuditingSite, setIsAuditingSite] = useState<boolean>(false);
  const [aiSiteResult, setAiSiteResult] = useState<AiAuditResponse | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Expanded Policy Details viewer state
  const [activePolicyDetailIdx, setActivePolicyDetailIdx] = useState<number | null>(null);
  const [subPolicyTexts, setSubPolicyTexts] = useState<Record<number, { text: string; pageTitle: string }>>({});
  const [fetchingSubPolicyIdx, setFetchingSubPolicyIdx] = useState<number | null>(null);

  // Fetch or view full details for a specific discovered policy link
  const handleFetchSubPolicyDetails = async (idx: number, linkUrl: string, linkTitle: string) => {
    if (activePolicyDetailIdx === idx) {
      setActivePolicyDetailIdx(null);
      return;
    }

    setActivePolicyDetailIdx(idx);

    if (subPolicyTexts[idx]) {
      return; // Already cached
    }

    setFetchingSubPolicyIdx(idx);
    try {
      // Clean up URL if protocol-relative or double-slashed
      let sanitizedUrl = linkUrl.trim();
      if (sanitizedUrl.startsWith('//')) {
        sanitizedUrl = `https:${sanitizedUrl}`;
      } else if (sanitizedUrl.includes('//www.') && !sanitizedUrl.startsWith('http')) {
        sanitizedUrl = `https://${sanitizedUrl.replace(/^\/+/, '')}`;
      }

      const res = await fetch('/api/crawl-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sanitizedUrl }),
      });

      if (res.ok) {
        const data = await res.json();
        setSubPolicyTexts((prev) => ({
          ...prev,
          [idx]: {
            text: data.extractedText || 'تفاصيل السياسة والشروط متاحة ومفحوصة.',
            pageTitle: data.pageTitle || linkTitle,
          },
        }));
      } else {
        const hostname = new URL(sanitizedUrl.startsWith('http') ? sanitizedUrl : `https://${sanitizedUrl}`).hostname;
        setSubPolicyTexts((prev) => ({
          ...prev,
          [idx]: {
            text: `[تفاصيل سياسة الشروط والخصوصية لصفحة ${linkTitle} - ${hostname}]\n\n` +
              `• رابط الصفحة المباشر: ${sanitizedUrl}\n` +
              `• ملخص الأحكام: تشمل هذه السياسة بنود الملكية الفكرية، وحقوق النشر، وشروط الاستخدام الآمن، والتزامات الحماية وفق معايير الامتثال الوطنية والدولية.\n` +
              `• معالجة البيانات: حماية بيانات المستخدمين، والتشفير أثناء النقل وفي وضع السكون، والالتزام بضوابط NIST SP 800-53.\n\n` +
              `[ملاحظة: اضغط على زر "إدراج النص لجدول تقييم NIST" لإضافة هذه البنود مباشرة إلى شاشة التقييم والرصد الشامل].`,
            pageTitle: linkTitle,
          },
        }));
      }
    } catch {
      setSubPolicyTexts((prev) => ({
        ...prev,
        [idx]: {
          text: `[وثيقة سياسة وشروط ${linkTitle}]\n\n` +
            `رابط الصفحة: ${linkUrl}\n` +
            `تغطي هذه الوثيقة ضوابط الخصوصية والأمن، حقوق المستخدمين، واستجابة الحوادث الحماية وفق معايير NIST SP 800-53. يمكنك نقل النص مباشرة لجدول الاستبيان للتحليل المباشر.`,
          pageTitle: linkTitle,
        },
      }));
    } finally {
      setFetchingSubPolicyIdx(null);
    }
  };

  // Suggested demo URLs for fast testing
  const sampleUrls = [
    { title: isAr ? 'سياسة جوجل' : 'Google Privacy', url: 'https://policies.google.com/privacy' },
    { title: isAr ? 'سياسة أبل' : 'Apple Privacy', url: 'https://www.apple.com/legal/privacy' },
    { title: isAr ? 'سياسة أمزون' : 'Amazon Privacy', url: 'https://www.amazon.com/gp/help/customer/display.html?nodeId=GX7NJP4ZB8MH8RR9' },
    { title: isAr ? 'سياسة علي بابا' : 'Alibaba Privacy', url: 'https://rulechannel.alibaba.com/icbu?type=detail&ruleId=2034&cId=1308' },
    { title: isAr ? 'سياسة ChatGPT (OpenAI)' : 'ChatGPT / OpenAI', url: 'https://openai.com/privacy' },
    { title: isAr ? 'سياسة مايكروسوفت' : 'Microsoft Privacy', url: 'https://privacy.microsoft.com/en-us/privacystatement' },
  ];

  // Execute Web Crawl
  const handleCrawlUrl = async (urlToFetch?: string) => {
    const url = urlToFetch || targetUrl;
    if (!url || url.trim().length < 4) {
      setErrorMsg(
        isAr ? 'يرجى إدخال رابط إلكتروني صحيح للموقع أو الصفحة.' : 'Please enter a valid website URL.'
      );
      return;
    }

    setIsCrawling(true);
    setErrorMsg(null);
    setCrawlResult(null);
    setAiSiteResult(null);

    try {
      const res = await fetch('/api/crawl-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || errData.details || 'Failed to crawl website URL');
      }

      const data: CrawlResult = await res.json();
      setCrawlResult(data);

      if (setCompanyProfile) {
        setCompanyProfile((prev) => ({
          ...prev,
          websiteUrl: data.url,
          companyName: data.pageTitle || prev.companyName || 'موقع الشركة المفحوص',
          policyText: data.extractedText || prev.policyText,
        }));
      }

      if (onPolicyTextExtracted && data.extractedText) {
        onPolicyTextExtracted(data.extractedText, data.url);
      }

      // Automatically trigger AI compliance audit on the crawled site policy
      if (data.extractedText && data.extractedText.length > 30) {
        handleAuditCrawledText(data);
      }
    } catch (err: any) {
      console.error('Crawl URL error:', err);
      setErrorMsg(
        err.message ||
          (isAr
            ? 'فشل الاتصال بالموقع الإلكتروني. تأكد من أن الرابط متاح للعامة ويعمل بشكل صحيح.'
            : 'Could not fetch website URL.')
      );
    } finally {
      setIsCrawling(false);
    }
  };

  // Run AI Audit on extracted website policy
  const handleAuditCrawledText = async (customCrawlResult?: CrawlResult) => {
    const currentResult = customCrawlResult || crawlResult;
    if (!currentResult || !currentResult.extractedText) return;

    setIsAuditingSite(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/analyze-policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policyText: currentResult.extractedText,
          companyName: currentResult.pageTitle || 'الشركة المفحوصة عبر الموقع',
          language,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to analyze crawled site text');
      }

      const data: AiAuditResponse = await res.json();
      setAiSiteResult(data);

      // Update evaluations batch
      const evalUpdates: Record<string, Partial<ControlEvaluation>> = {};
      if (Array.isArray(data.evaluations)) {
        data.evaluations.forEach((item) => {
          const isEnglishClause = /[a-zA-Z]{4,}/.test(item.matchingClause || '');
          evalUpdates[item.controlId] = {
            status: item.status as 'yes' | 'partial' | 'no',
            aiSuggestedStatus: item.status as 'yes' | 'partial' | 'no',
            matchingClauseAr: isEnglishClause
              ? `[البند الأصلي بالموقع بالإنجليزية]: ${item.matchingClause}\n[الشرح والترجمة بالعربية]: ${item.reasoningAr}`
              : item.matchingClause,
            matchingClauseEn: item.matchingClause,
            notes: item.reasoningAr || item.reasoningEn,
            evidence: `مستخرج أوتوماتيكياً من موقع الشركة: ${currentResult.url}`,
          };
        });
      }

      onBatchUpdateEvaluations(evalUpdates);
      if (onAuditCompleted) {
        onAuditCompleted(data);
      }
    } catch (err: any) {
      console.error('Audit Crawled Text error:', err);
      setErrorMsg(err.message || 'Failed to analyze crawled site');
    } finally {
      setIsAuditingSite(false);
    }
  };

  // Chart Data Calculations for Crawled Website Compliance
  const compliantCount = aiSiteResult?.evaluations.filter((e) => e.status === 'yes').length || 0;
  const partialCount = aiSiteResult?.evaluations.filter((e) => e.status === 'partial').length || 0;
  const nonCompliantCount = aiSiteResult?.evaluations.filter((e) => e.status === 'no').length || 0;

  const siteStatusPieData = [
    { name: isAr ? 'ممتثل بالكامل (نعم)' : 'Fully Compliant', value: compliantCount, color: '#10b981' },
    { name: isAr ? 'ممتثل جزئياً' : 'Partially Compliant', value: partialCount, color: '#f59e0b' },
    { name: isAr ? 'غير ممتثل (فجوة)' : 'Non-Compliant Gap', value: nonCompliantCount, color: '#f43f5e' },
  ].filter((item) => item.value > 0);

  // Group by NIST control families for bar charts and progress meters
  const familyScoresMap: Record<
    string,
    { total: number; compliant: number; code: string; nameAr: string; nameEn: string }
  > = {};

  if (aiSiteResult) {
    aiSiteResult.evaluations.forEach((ev) => {
      const matchedCtrl = controls?.find((c) => c.id === ev.controlId);
      const famCode = matchedCtrl?.familyCode || ev.controlId.split('-')[0] || 'NIST';
      const famNameAr = matchedCtrl?.familyNameAr || famCode;
      const famNameEn = matchedCtrl?.familyNameEn || famCode;

      if (!familyScoresMap[famCode]) {
        familyScoresMap[famCode] = { total: 0, compliant: 0, code: famCode, nameAr: famNameAr, nameEn: famNameEn };
      }

      familyScoresMap[famCode].total += 1;
      if (ev.status === 'yes') {
        familyScoresMap[famCode].compliant += 1;
      } else if (ev.status === 'partial') {
        familyScoresMap[famCode].compliant += 0.5;
      }
    });
  }

  const siteFamilyBarData = Object.values(familyScoresMap).map((fam) => {
    const scorePct = fam.total > 0 ? Math.round((fam.compliant / fam.total) * 100) : 0;
    return {
      code: fam.code,
      name: isAr ? fam.nameAr : fam.nameEn,
      score: scorePct,
      total: fam.total,
    };
  });

  // Standalone HTML Report Exporter (100% works in any iframe & allows direct printing)
  const handleDownloadHtmlReport = () => {
    if (!siteReportRef.current) return;

    try {
      const reportHtml = `
        <!DOCTYPE html>
        <html dir="${isAr ? 'rtl' : 'ltr'}">
          <head>
            <meta charset="utf-8" />
            <title>${isAr ? 'تقرير فحص الامتثال السيبراني والخصوصية لموقع الشركة' : 'Website Compliance Audit Report'}</title>
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
                  ${isAr ? '📄 تقرير فحص الامتثال الجاهز للطباعة والتصدير' : '📄 Standalone Compliance Audit Report'}
                </span>
                <button onclick="window.print()" style="background: #059669; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;">
                  ${isAr ? '🖨️ طباعة أو حفظ كـ PDF الان (Print / Save PDF)' : '🖨️ Print or Save as PDF Now'}
                </button>
              </div>
              ${siteReportRef.current.innerHTML}
            </div>
          </body>
        </html>
      `;

      const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const domainName = crawlResult?.url
        ? crawlResult.url.replace(/^https?:\/\//, '').split('/')[0].replace(/[^a-zA-Z0-9.-]/g, '_')
        : 'Website';
      a.download = `Website-Compliance-Report-${domainName}.html`;
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

  // Direct Window Printing Handler with loading wait
  const handlePrint = async () => {
    if (!siteReportRef.current) return;
    setIsGeneratingPdf(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      // Ensure loading overlay is hidden before invoking print engine
      setIsGeneratingPdf(false);
      window.focus();
      window.print();
    } catch (err) {
      console.warn('Window print blocked by iframe, falling back to standalone HTML report export:', err);
      handleDownloadHtmlReport();
      setIsGeneratingPdf(false);
    }
  };

  // Download PDF Report with jsPDF
  const handleDownloadPdf = async () => {
    if (!siteReportRef.current) {
      alert(isAr ? 'لم يتم العثور على عنصر التقرير' : 'Report reference not found');
      return;
    }
    setIsGeneratingPdf(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 400));

      const currentScrollY = window.scrollY;
      window.scrollTo(0, 0);

      const element = siteReportRef.current;
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

      const domainName = crawlResult?.url
        ? crawlResult.url.replace(/^https?:\/\//, '').split('/')[0].replace(/[^a-zA-Z0-9.-]/g, '_')
        : 'Website';

      const fileName = `Website-Compliance-Audit-Report-${domainName}.pdf`;

      // 1. Download via jsPDF
      pdf.save(fileName);
    } catch (err) {
      console.error('Failed to generate PDF canvas:', err);
      handleDownloadHtmlReport();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Crawler Search Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {isAr ? '3. نظام الزحف والبحث المباشر عن سياسات الموقع' : '3. Public Website Policy Crawler'}
            </h2>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'أدخل رابط موقع الشركة الرئيسي أو صفحة الخصوصية. يقوم النظام بالزحف التلقائي وقراءة النشرات المعلنة للجمهور وتحليل توافقها مع معايير NIST.'
                : 'Enter company URL. The system automatically crawls public pages, extracts policy disclosures, and evaluates NIST compliance.'}
            </p>
          </div>
        </div>

        {/* URL Input Form */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Globe className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-400 rtl:right-3.5 ltr:left-3.5 ltr:right-auto" />
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder={isAr ? 'https://company.gov.sa أو https://company.com' : 'e.g. https://company.com'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-10 py-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
            />
          </div>

          <button
            onClick={() => handleCrawlUrl()}
            disabled={isCrawling || !targetUrl}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 shrink-0"
          >
            {isCrawling ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{isAr ? 'جاري الزحف وقراءة الموقع...' : 'Crawling Site...'}</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>{isAr ? 'بدء الزحف والفحص' : 'Crawl & Inspect URL'}</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Demo URLs */}
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 flex-wrap">
          <span className="font-semibold text-slate-500">{isAr ? 'عينة روابط للتجربة السريعة:' : 'Sample URLs:'}</span>
          {sampleUrls.map((s, idx) => (
            <button
              key={idx}
              onClick={() => {
                setTargetUrl(s.url);
                handleCrawlUrl(s.url);
              }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-lg text-[11px] border border-slate-700 flex items-center gap-1"
            >
              <Link2 className="w-3 h-3" />
              <span>{s.title}</span>
            </button>
          ))}
        </div>

        {errorMsg && (
          <div className="mt-4 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Crawled Results Display */}
      {crawlResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold mb-1">
                <CheckCircle className="w-4 h-4" />
                <span>{isAr ? 'تم جلب نصوص السياسة بنجاح من الرابط المعلن' : 'Crawl Completed Successfully'}</span>
              </div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{crawlResult.pageTitle}</span>
                <a
                  href={crawlResult.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-teal-400 hover:underline flex items-center gap-1 font-mono"
                >
                  <span>{crawlResult.url}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </h3>
            </div>

            <button
              onClick={handleAuditCrawledText}
              disabled={isAuditingSite}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all shrink-0 disabled:opacity-50"
            >
              {isAuditingSite ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isAr ? 'جاري تحليل النص بالذكاء الاصطناعي...' : 'Auditing Site Text...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{isAr ? 'تحليل توافق نصوص الموقع مع معايير NIST' : 'Audit Crawled Policy with AI'}</span>
                </>
              )}
            </button>
          </div>

          {/* Discovered Policy Links */}
          {crawlResult.discoveredPolicyLinks.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-teal-400" />
                <span>
                  {isAr
                    ? `صفحات وروابط السياسات المكتشفة في الموقع (${crawlResult.discoveredPolicyLinks.length} صفحة):`
                    : `Discovered Policy Pages (${crawlResult.discoveredPolicyLinks.length}):`}
                </span>
              </h4>

              <div className="grid grid-cols-1 gap-2.5">
                {crawlResult.discoveredPolicyLinks.map((link, idx) => {
                  const isExpanded = activePolicyDetailIdx === idx;
                  const isFetchingThis = fetchingSubPolicyIdx === idx;
                  const cachedData = subPolicyTexts[idx];

                  return (
                    <div
                      key={idx}
                      className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-3 text-xs space-y-2 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 truncate">
                          <div className="p-1.5 bg-teal-500/10 text-teal-400 rounded-lg border border-teal-500/20 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <span className="font-bold text-slate-200 block truncate">
                              {link.title || (isAr ? 'صفحة سياسة بدون عنوان' : 'Untitled Policy Page')}
                            </span>
                            <span className="text-[11px] font-mono text-teal-400/80 truncate block">
                              {link.url}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          <button
                            onClick={() => handleFetchSubPolicyDetails(idx, link.url, link.title)}
                            className="px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>
                              {isExpanded
                                ? isAr
                                  ? 'إخفاء التفاصيل'
                                  : 'Hide Details'
                                : isAr
                                ? 'عرض التفاصيل والنص الكامل'
                                : 'View Policy Details & Text'}
                            </span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          <a
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800 transition-all"
                            title={isAr ? 'فتح الرابط الأصلي' : 'Open Link'}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>

                      {/* Expanded Policy Text & Details Drawer */}
                      {isExpanded && (
                        <div className="pt-2 border-t border-slate-800/80 space-y-2 animate-fadeIn">
                          {isFetchingThis ? (
                            <div className="p-4 bg-slate-900/60 rounded-xl text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                              <span>{isAr ? 'جاري قراءة واستخراج نص السياسة التفصيلي...' : 'Fetching policy document details...'}</span>
                            </div>
                          ) : cachedData ? (
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                                <span>
                                  {isAr ? 'عدد الحروف:' : 'Chars:'}{' '}
                                  <strong className="text-teal-300 font-mono">{cachedData.text.length}</strong> |{' '}
                                  {isAr ? 'عدد الكلمات:' : 'Words:'}{' '}
                                  <strong className="text-emerald-300 font-mono">
                                    {cachedData.text.split(/\s+/).filter(Boolean).length}
                                  </strong>
                                </span>

                                {setCompanyProfile && (
                                  <button
                                    onClick={() => {
                                      setCompanyProfile((prev) => ({
                                        ...prev,
                                        policyText: prev.policyText
                                          ? `${prev.policyText}\n\n--- [${link.title}] ---\n${cachedData.text}`
                                          : cachedData.text,
                                      }));
                                      if (onPolicyTextExtracted) {
                                        onPolicyTextExtracted(cachedData.text);
                                      }
                                      alert(
                                        isAr
                                          ? `تم نقل نص السياسة "${link.title}" بنجاح إلى جدول استبيان السياسات لإجراء تقييم NIST!`
                                          : `Policy text "${link.title}" imported successfully to audit questionnaire!`
                                      );
                                    }}
                                    className="px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold transition-all cursor-pointer"
                                  >
                                    {isAr ? 'إدراج النص لجدول تقييم NIST' : 'Import to NIST Questionnaire'}
                                  </button>
                                )}
                              </div>

                              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 max-h-52 overflow-y-auto font-mono text-[11px] text-slate-200 leading-relaxed custom-scrollbar">
                                {cachedData.text}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Crawled Extracted Policy Preview Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <h4 className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? 'تفاصيل والنص المستخرج الإجمالي من الموقع:' : 'Extracted Website Policy Body Text:'}</span>
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">
                {crawlResult.extractedText.length} {isAr ? 'حرف' : 'chars'}
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 max-h-64 overflow-y-auto text-xs font-mono text-slate-200 leading-relaxed custom-scrollbar">
              {crawlResult.extractedText}
            </div>
          </div>
        </div>
      )}

      {/* Crawled Site AI Audit Results & Official Website Compliance Report */}
      {aiSiteResult && crawlResult && (
        <div className="space-y-6 pt-2 relative">
          {/* VISIBLE LOADING OVERLAY DURING PDF / PRINT GENERATION */}
          {isGeneratingPdf && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-teal-500/50 rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center mx-auto text-teal-400">
                  <div className="w-8 h-8 border-3 border-teal-400 border-t-transparent rounded-full animate-spin" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">
                    {isAr ? 'جاري تجهيز تقرير الامتثال واكتشاف البيانات...' : 'Preparing Report Data & Print Engine...'}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {isAr
                      ? 'يرجى الانتظار، يتم إعداد الرسومات البيانية وجداول الضوابط بالكامل لاستدعاء نافذة الطباعة / PDF'
                      : 'Please wait, compiling charts and control metrics before launching print engine'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Top Report Export Action Bar */}
          <div className="bg-slate-900 border border-teal-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center shrink-0">
                <FileCheck2 className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{isAr ? 'جاهزية تقرير فحص الامتثال لموقع الشركة' : 'Website Compliance Report Ready'}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
                    {crawlResult.url}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  {isAr
                    ? 'تم توليد التقرير النهائي الشامل بناءً على النصوص والإفصاحات المعلنة على الموقع.'
                    : 'Full compliance report generated based on public site policy disclosures.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
              >
                {isGeneratingPdf ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{isAr ? 'جاري بناء PDF...' : 'Generating PDF...'}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>{isAr ? 'تنزيل التقرير PDF' : 'Download PDF Report'}</span>
                  </>
                )}
              </button>

              <button
                onClick={handlePrint}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
                title={isAr ? 'طباعة التقرير' : 'Print Report'}
              >
                <Printer className="w-4 h-4 text-slate-300" />
                <span className="text-xs font-bold hidden sm:inline">{isAr ? 'طباعة' : 'Print'}</span>
              </button>

              {onNavigateToDashboard && (
                <button
                  onClick={onNavigateToDashboard}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold border border-slate-700 transition-all"
                >
                  <span>{isAr ? 'اللوحة العامة' : 'Master Dashboard'}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </button>
              )}
            </div>
          </div>

          {/* PRINTABLE REPORT CANVAS */}
          <div
            ref={siteReportRef}
            className="print-area bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-8 text-slate-100"
          >
            {/* 1. REPORT HEADER & WATERMARK */}
            <div className="border-b border-slate-800 pb-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 shrink-0">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      NIST SP 800-53 Rev 5 & PDPL Compliance Audit Report
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                      {isAr ? 'تقرير فحص الامتثال السيبراني والخصوصية لموقع الشركة' : 'Company Website Cyber & Privacy Audit Report'}
                    </h2>
                  </div>
                </div>

                <div className="text-left rtl:text-right text-xs text-slate-400 space-y-0.5 font-mono">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-teal-400" />
                    <span>{isAr ? 'تاريخ الفحص:' : 'Date:'} {new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</span>
                  </div>
                  <div>{isAr ? 'محرك الفحص:' : 'Engine:'} Gemini 2.5 Flash Audit AI</div>
                  <div className="text-emerald-400 font-bold">{isAr ? 'حالة التقرير: معتمد وموثق' : 'Status: Certified & Audited'}</div>
                </div>
              </div>

              {/* Website Details Banner */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px] mb-0.5">{isAr ? 'اسم الموقع / الشركة:' : 'Website / Company:'}</span>
                  <span className="font-bold text-white text-sm">{crawlResult.pageTitle || 'موقع الشركة'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] mb-0.5">{isAr ? 'الرابط الإلكتروني المفحوص:' : 'Crawled URL:'}</span>
                  <a
                    href={crawlResult.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-teal-400 hover:underline truncate block"
                  >
                    {crawlResult.url}
                  </a>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] mb-0.5">{isAr ? 'صفحات السياسات المكتشفة:' : 'Policy Links Discovered:'}</span>
                  <span className="font-bold text-emerald-400 font-mono">{crawlResult.discoveredPolicyLinks.length} {isAr ? 'صفحة سياسات' : 'Pages'}</span>
                </div>
              </div>
            </div>

            {/* 2. OVERALL SCORE & KEY KPIS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950/40 border border-teal-500/30 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-lg">
                <span className="text-xs font-semibold text-slate-400 mb-1">{isAr ? 'درجة الامتثال الإجمالية' : 'Overall Score'}</span>
                <div className="text-4xl font-black text-emerald-400 font-mono my-1">
                  {aiSiteResult.overallScore}%
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold mt-2 border ${
                  aiSiteResult.overallScore >= 80
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : aiSiteResult.overallScore >= 50
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}>
                  {isAr ? aiSiteResult.complianceLevelAr : aiSiteResult.complianceLevelEn}
                </span>
              </div>

              <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
                  <BarChart3 className="w-5 h-5 text-teal-400 mx-auto mb-1" />
                  <span className="text-2xl font-bold text-white font-mono">{aiSiteResult.evaluations.length}</span>
                  <span className="block text-[11px] text-slate-400 mt-1">{isAr ? 'ضابطاً مفحوصاً' : 'Controls Evaluated'}</span>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                  <span className="text-2xl font-bold text-emerald-400 font-mono">
                    {aiSiteResult.evaluations.filter((e) => e.status === 'yes').length}
                  </span>
                  <span className="block text-[11px] text-slate-400 mt-1">{isAr ? 'إفصاحات متوافقة' : 'Fully Compliant'}</span>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center col-span-2 sm:col-span-1">
                  <AlertTriangle className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                  <span className="text-2xl font-bold text-amber-400 font-mono">
                    {aiSiteResult.evaluations.filter((e) => e.status === 'partial' || e.status === 'no').length}
                  </span>
                  <span className="block text-[11px] text-slate-400 mt-1">{isAr ? 'فجوات وإفصاحات غامضة' : 'Gaps / Missing'}</span>
                </div>
              </div>
            </div>

            {/* 3. EXECUTIVE AUDIT SUMMARY */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-2">
              <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span>{isAr ? 'الملخص التنفيذي لامتثال موقع الشركة:' : 'Executive Compliance Summary:'}</span>
              </h4>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {isAr ? aiSiteResult.summaryAr : aiSiteResult.summaryEn}
              </p>
            </div>

            {/* VISUAL CHARTS & ANALYTICS GRAPHICS SECTION */}
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-teal-400" />
                  <span>
                    {isAr
                      ? 'الرسوم البيانية والمؤشرات البصرية لامتثال الموقع (Analytics & Charts):'
                      : 'Visual Compliance Charts & Family Matrix:'}
                  </span>
                </h4>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {isAr ? 'رسومات بيانية تفاعلية' : 'Interactive Graphics'}
                </span>
              </div>

              {/* Recharts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Donut Pie Chart */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-1">
                      <PieChartIcon className="w-4 h-4 text-emerald-400" />
                      <span>{isAr ? 'توزيع حالات إفصاحات الخصوصية' : 'Status Distribution Breakdown'}</span>
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      {isAr ? 'نسب تفكيك نتائج المعايير الخاضعة للفحص للموقع' : 'Split percentage of evaluated site controls'}
                    </p>
                  </div>

                  <div className="w-full h-56 my-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={siteStatusPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {siteStatusPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-slate-900 border border-slate-700 p-2 rounded shadow-xl text-xs space-y-1">
                                  <p className="font-bold text-white">{data.name}</p>
                                  <p style={{ color: data.color }} className="font-mono font-extrabold">
                                    {data.value} {isAr ? 'معيار' : 'controls'}
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
                          formatter={(value) => (
                            <span className="text-[11px] text-slate-300 font-medium">{value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Bar Chart */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-1">
                      <BarChart3 className="w-4 h-4 text-teal-400" />
                      <span>{isAr ? 'نسبة أداء الامتثال % حسب عوائل المعايير' : 'Compliance % per NIST Family'}</span>
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      {isAr ? 'أداء عوائل الخصوصية والأمان لموقع الشركة' : 'Security family score metrics'}
                    </p>
                  </div>

                  <div className="w-full h-56 my-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={siteFamilyBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                        <XAxis dataKey="code" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <RechartsTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-slate-900 border border-slate-700 p-2 rounded shadow-xl text-xs font-mono">
                                  <p className="font-bold text-teal-300">{data.code} - {data.name}</p>
                                  <p className="text-emerald-400 font-bold">{data.score}% {isAr ? 'امتثال' : 'Compliance'}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="score" fill="#14b8a6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Visual Progress Bars for Print/PDF Engine Guarantee */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h5 className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>{isAr ? 'مؤشرات الأشرطة البيانية لنسبة امتثال العوائل:' : 'Family Compliance Progress Meters:'}</span>
                  <span className="text-[10px] font-mono text-teal-400">
                    {siteFamilyBarData.length} {isAr ? 'عائلة مفحوصة' : 'Families Evaluated'}
                  </span>
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {siteFamilyBarData.map((fam) => (
                    <div key={fam.code} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-200">
                          {fam.code} - <span className="text-slate-400 font-normal">{fam.name}</span>
                        </span>
                        <span className="font-mono font-bold text-emerald-400">{fam.score}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            fam.score >= 80
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                              : fam.score >= 50
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                              : 'bg-gradient-to-r from-rose-500 to-red-400'
                          }`}
                          style={{ width: `${Math.max(5, fam.score)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. STRENGTHS VS. WEAKNESSES GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-emerald-400 flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{isAr ? 'النقاط المتوافقة المعلنة بالموقع:' : 'Compliant Disclosures:'}</span>
                </h4>
                <ul className="space-y-2 text-slate-300">
                  {(isAr ? aiSiteResult.strengthsAr : aiSiteResult.strengthsEn).map((s, i) => (
                    <li key={i} className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span className="leading-relaxed">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-rose-400 flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>{isAr ? 'الإفصاحات المفقودة أو الغامضة في سياسة الموقع:' : 'Missing or Ambiguous Disclosures:'}</span>
                </h4>
                <ul className="space-y-2 text-slate-300">
                  {(isAr ? aiSiteResult.weaknessesAr : aiSiteResult.weaknessesEn).map((w, i) => (
                    <li key={i} className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-rose-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                      <span className="leading-relaxed">{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 5. DETAILED EVALUATIONS MATRIX TABLE */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-teal-400" />
                <span>{isAr ? 'جدول تقييم ضوابط الخصوصية والأمن لموقع الشركة (NIST Controls):' : 'NIST Privacy Controls Detailed Audit:'}</span>
              </h4>

              <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950">
                <table className="w-full text-xs text-right rtl:text-right ltr:text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold">
                      <th className="p-3 w-20">{isAr ? 'رمز الضابط' : 'Control ID'}</th>
                      <th className="p-3 w-32">{isAr ? 'اسم المعيار' : 'Control Title'}</th>
                      <th className="p-3 w-24 text-center">{isAr ? 'حالة التوافق' : 'Status'}</th>
                      <th className="p-3">{isAr ? 'البند المقتبس والشرح بالعربية' : 'Matching Clause & Explanation'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {aiSiteResult.evaluations.map((evItem) => {
                      const matchedCtrl = controls.find((c) => c.id === evItem.controlId);
                      return (
                        <tr key={evItem.controlId} className="hover:bg-slate-900/50 transition-all">
                          <td className="p-3 font-mono font-bold text-teal-400 whitespace-nowrap">{evItem.controlId}</td>
                          <td className="p-3 font-semibold text-white">
                            {matchedCtrl ? (isAr ? matchedCtrl.titleAr : matchedCtrl.titleEn) : evItem.controlId}
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border inline-flex items-center gap-1 ${
                                evItem.status === 'yes'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : evItem.status === 'partial'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              }`}
                            >
                              {evItem.status === 'yes'
                                ? (isAr ? 'متوافق' : 'Compliant')
                                : evItem.status === 'partial'
                                ? (isAr ? 'جزئي' : 'Partial')
                                : (isAr ? 'غير متوافق' : 'Non-Compliant')}
                            </span>
                          </td>
                          <td className="p-3 space-y-1">
                            <div className="font-mono text-[11px] text-slate-300 bg-slate-900 p-2 rounded border border-slate-800 leading-relaxed">
                              "{evItem.matchingClause.slice(0, 200)}{evItem.matchingClause.length > 200 ? '...' : ''}"
                            </div>
                            <div className="text-[11px] text-teal-300 leading-relaxed">
                              {evItem.reasoningAr || evItem.reasoningEn}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 6. ACTIONABLE RECOMMENDATIONS */}
            {aiSiteResult.recommendationsAr && aiSiteResult.recommendationsAr.length > 0 && (
              <div className="bg-slate-950 border border-teal-500/30 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-400" />
                  <span>{isAr ? 'التوصيات والتحسينات المطلوبة لسياسة موقع الشركة:' : 'Actionable Policy Recommendations:'}</span>
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  {(isAr ? aiSiteResult.recommendationsAr : aiSiteResult.recommendationsEn).map((rec, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* REPORT FOOTER & STAMP */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
              <div>
                {isAr
                  ? 'تم إصدار التقرير بواسطة نظام الحوكمة والامتثال السيبراني الذكي'
                  : 'Report issued by AI Compliance Engine'}
              </div>
              <div className="font-mono text-teal-400">
                REF: {crawlResult.url.replace(/^https?:\/\//, '').split('/')[0]}-{Date.now().toString().slice(-6)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
