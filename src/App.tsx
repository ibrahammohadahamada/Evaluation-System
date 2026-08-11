import React, { useState, useEffect } from 'react';
import { Lock, ShieldAlert, KeyRound, Sparkles, Loader2 } from 'lucide-react';
import { Header } from './components/Header';
import { EvaluationTab } from './components/EvaluationTab';
import { PolicyQuestionnaireTab } from './components/PolicyQuestionnaireTab';
import { WebCrawlerTab } from './components/WebCrawlerTab';
import { DashboardReportTab } from './components/DashboardReportTab';
import { DatasetStudioTab } from './components/DatasetStudioTab';
import { AdminPanelTab } from './components/AdminPanelTab';
import { AuthModal } from './components/AuthModal';
import { DatabaseFilesManagerModal } from './components/DatabaseFilesManagerModal';
import { NistControl, ControlEvaluation, CompanyProfile, Language, AiAuditResponse, UserAccount, SystemLog, UploadedFileRecord } from './types';
import { NIST_SP800_53_REV5_CONTROLS } from './data/nist_catalog';
import { sortAndStructureControls } from './utils/nistTranslator';
import { translateControlsCatalogWithAi } from './utils/aiTranslatorService';

export default function App() {
  const [language, setLanguage] = useState<Language>('ar');
  const [activeTab, setActiveTab] = useState<'evaluation' | 'policy' | 'crawler' | 'dashboard' | 'dataset' | 'admin'>('evaluation');
  const [isTranslatingWithAi, setIsTranslatingWithAi] = useState(false);
  const [translationStatusMessage, setTranslationStatusMessage] = useState<string | null>(null);

  // Authentication & Users state
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('compliance_users_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse users from localStorage', e);
      }
    }
    return [
      {
        id: 'usr_admin_01',
        username: 'admin',
        password: 'admin123',
        fullName: 'المستخدم الرئيسي (مدير النظام)',
        email: 'admin@compliance-system.com',
        role: 'admin',
        department: 'إدارة الأمن والامتثال السيبراني',
        status: 'active',
        lastLogin: new Date().toLocaleString('ar-SA'),
      },
      {
        id: 'usr_02',
        username: 'auditor1',
        password: 'user123',
        fullName: 'م. خالد السليمان (مدقق مالي وسيبراني)',
        email: 'khaled@company.com',
        role: 'user',
        department: 'قسم الخصوصية وحماية البيانات',
        status: 'active',
        lastLogin: '2026-08-07 11:15',
      },
      {
        id: 'usr_03',
        username: 'sara_audit',
        password: 'user123',
        fullName: 'د. سارة المنصور',
        email: 'sara@company.com',
        role: 'user',
        department: 'إدارة المراجعة الداخلية',
        status: 'active',
        lastLogin: '2026-08-06 09:40',
      },
    ];
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('compliance_current_user_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    // Default logged in user for immediate seamless auditing
    return {
      id: 'usr_admin_01',
      username: 'admin',
      password: 'admin123',
      fullName: 'المستخدم الرئيسي (مدير النظام)',
      email: 'admin@compliance-system.com',
      role: 'admin',
      department: 'إدارة الأمن والامتثال السيبراني',
      status: 'active',
      lastLogin: new Date().toLocaleString('ar-SA'),
    };
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'user' | 'admin'>('user');

  // Sync users to localStorage
  useEffect(() => {
    localStorage.setItem('compliance_users_v2', JSON.stringify(users));
  }, [users]);

  // Sync currentUser to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('compliance_current_user_v2', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('compliance_current_user_v2');
    }
  }, [currentUser]);

  const handleUpdateUser = (updatedUser: UserAccount) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  const handleAddLog = (action: string, details: string) => {
    const newLog: SystemLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleString('ar-SA'),
      user: currentUser ? currentUser.fullName : 'المستخدم الرئيسي',
      action,
      details,
      type: 'auth',
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  // System Security Logs
  const [logs, setLogs] = useState<SystemLog[]>([
    {
      id: 'log_01',
      timestamp: new Date().toLocaleString('ar-SA'),
      user: 'المستخدم الرئيسي (admin)',
      action: 'تسجيل دخول وتأكيد صلاحية مدير النظام',
      details: 'نجاح المصادقة مع كامل صلاحيات الإدارة',
      type: 'auth',
    },
    {
      id: 'log_02',
      timestamp: '2026-08-07 14:00',
      user: 'auditor1',
      action: 'تقييم معيار PT-1',
      details: 'تغيير الحالة إلى متوافق بالكامل',
      type: 'evaluation',
    },
  ]);

  // Controls catalog state (persisted in localStorage)
  const [controls, setControls] = useState<NistControl[]>(() => {
    const saved = localStorage.getItem('compliance_controls_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return sortAndStructureControls(parsed);
        }
      } catch (e) {
        console.error('Failed to parse controls from localStorage', e);
      }
    }
    return sortAndStructureControls(NIST_SP800_53_REV5_CONTROLS);
  });

  // Sync controls to localStorage
  useEffect(() => {
    localStorage.setItem('compliance_controls_v3', JSON.stringify(controls));
  }, [controls]);

  // Evaluations state (mapped by controlId, persisted in localStorage)
  const [evaluations, setEvaluations] = useState<Record<string, ControlEvaluation>>(() => {
    const saved = localStorage.getItem('compliance_evaluations_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse evaluations from localStorage', e);
      }
    }
    const initial: Record<string, ControlEvaluation> = {};
    NIST_SP800_53_REV5_CONTROLS.forEach((ctrl) => {
      initial[ctrl.id] = {
        controlId: ctrl.id,
        status: 'unanswered',
        notes: '',
        evidence: '',
      };
    });
    return initial;
  });

  // Sync evaluations to localStorage
  useEffect(() => {
    localStorage.setItem('compliance_evaluations_v3', JSON.stringify(evaluations));
  }, [evaluations]);

  // Company Profile State (persisted in localStorage)
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => {
    const saved = localStorage.getItem('compliance_company_profile_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse company profile from localStorage', e);
      }
    }
    return {
      companyName: 'شركة تقنية المعلومات والحلول الرقمية',
      auditorName: 'م. خالد السليمان (مدقق خصوصية معتمد)',
      email: 'khaled@company.com',
      phoneNumber: '+966 50 123 4567',
      assessmentDate: new Date().toISOString().split('T')[0],
      industry: 'تقنية المعلومات والخدمات السحابية',
      websiteUrl: 'https://company.example.com',
      policyText: '',
      uploadedPdfNames: [],
    };
  });

  // Sync companyProfile to localStorage
  useEffect(() => {
    localStorage.setItem('compliance_company_profile_v2', JSON.stringify(companyProfile));
  }, [companyProfile]);

  // AI Audit Response State
  const [aiAuditData, setAiAuditData] = useState<AiAuditResponse | null>(null);

  // Uploaded Files State (PDFs, CSVs) for Data Privacy & Storage Management
  const [isDatabaseFilesModalOpen, setIsDatabaseFilesModalOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileRecord[]>(() => {
    const saved = localStorage.getItem('compliance_uploaded_files_v2');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse uploaded files from localStorage', e);
      }
    }
    return [
      {
        id: 'file_pdf_01',
        name: 'سياسة_الخصوصية_وحماية_البيانات_2026.pdf',
        type: 'pdf',
        sizeBytes: 496640,
        uploadedAt: new Date(Date.now() - 3600000 * 24).toLocaleString('ar-SA'),
        uploadedBy: 'المستخدم الرئيسي (admin)',
        sourceModule: 'policy',
        summary: 'وثيقة سياسة الخصوصية والشروط العامة وتدابير الحماية والتشفير.',
        extractedText: 'نلتزم بحماية البيانات الشخصية وتشفير الاتصالات باستخدام بروتوكولات TLS 1.3 وتشفير البيانات المخزنة بـ AES-256، مع الالتزام بالإشعارات الفورية عن أي انتهاك أمني خلال 72 ساعة.',
      },
      {
        id: 'file_csv_02',
        name: 'سجلات_مصفوفة_ضوابط_الامتثال_NIST.csv',
        type: 'csv',
        sizeBytes: 215040,
        uploadedAt: new Date(Date.now() - 3600000 * 48).toLocaleString('ar-SA'),
        uploadedBy: 'م. خالد السليمان',
        itemCount: 68,
        sourceModule: 'dataset',
        summary: 'سجل استيراد CSV يحتوي على 68 عنصر من ضوابط وأسئلة تقييم الخصوصية.',
        extractedText: 'Control_ID,Family,Title_Ar,Title_En,Description_Ar\nAC-1,Access Control,سياسة وإجراءات التحكم بالوصول,Access Control Policy,تطوير وتوثيق سياسة التحكم بالوصول',
      },
      {
        id: 'file_pdf_03',
        name: 'تقرير_الموقع_الالكتروني_المستخرج.pdf',
        type: 'pdf',
        sizeBytes: 911360,
        uploadedAt: new Date(Date.now() - 3600000 * 12).toLocaleString('ar-SA'),
        uploadedBy: 'د. سارة المنصور',
        sourceModule: 'crawler',
        summary: 'نص سياسة الخصوصية المستخرج عبر أداة الزحف التلقائي للموقع.',
        extractedText: 'سياسة الخصوصية للموقع الإلكتروني: يتم جمع ملفات تعريف الارتباط لتحسين تجربة المستخدم مع توفير خيارات الرفض والمطالبة بحذف البيانات.',
      },
    ];
  });

  // Sync uploadedFiles to localStorage
  useEffect(() => {
    localStorage.setItem('compliance_uploaded_files_v2', JSON.stringify(uploadedFiles));
  }, [uploadedFiles]);

  const handleAddUploadedFile = (newFile: UploadedFileRecord) => {
    setUploadedFiles((prev) => [newFile, ...prev.filter((f) => f.name !== newFile.name)]);
    handleAddLog('رفع ملف جديد', `تم رفع الملف ${newFile.name} (${newFile.type.toUpperCase()}) بنجاح إلى التخزين المحلي.`);
  };

  const handleUpdateUploadedFile = (updatedFile: UploadedFileRecord) => {
    const oldFile = uploadedFiles.find((f) => f.id === updatedFile.id);

    setUploadedFiles((prev) =>
      prev.map((f) => (f.id === updatedFile.id ? updatedFile : f))
    );

    if (oldFile) {
      setCompanyProfile((prev) => {
        const newPdfNames = (prev.uploadedPdfNames || []).map((n) => (n === oldFile.name ? updatedFile.name : n));
        let newPolicyText = prev.policyText || '';

        // Update header block title if renamed
        if (oldFile.name !== updatedFile.name && newPolicyText.includes(`--- [${oldFile.name}] ---`)) {
          newPolicyText = newPolicyText.replace(
            `--- [${oldFile.name}] ---`,
            `--- [${updatedFile.name}] ---`
          );
        }

        // Update extracted text inside policyText if changed
        if (
          oldFile.extractedText &&
          updatedFile.extractedText &&
          oldFile.extractedText !== updatedFile.extractedText &&
          newPolicyText.includes(oldFile.extractedText.trim())
        ) {
          newPolicyText = newPolicyText.replace(
            oldFile.extractedText.trim(),
            updatedFile.extractedText.trim()
          );
        }

        return {
          ...prev,
          uploadedPdfNames: newPdfNames,
          policyText: newPolicyText,
        };
      });
    }

    handleAddLog(
      'تعديل بيانات ملف مرفوع',
      `تم تحديث اسم أو محتوى الملف المرفوع (${updatedFile.name}) وتطبيق التعديلات في التخزين المحلي.`
    );
  };

  const handleDeleteUploadedFile = (fileId: string) => {
    const file = uploadedFiles.find((f) => f.id === fileId);
    if (!file) return;

    const remainingFiles = uploadedFiles.filter((f) => f.id !== fileId);
    setUploadedFiles(remainingFiles);

    // Completely scrub this file's name and extracted policy text from companyProfile
    let isPolicyTextNowEmpty = false;
    setCompanyProfile((prev) => {
      const newPdfNames = (prev.uploadedPdfNames || []).filter((n) => n !== file.name);
      let newPolicyText = prev.policyText || '';

      // 1. Remove header block format if present: --- [filename] ---
      if (file.name) {
        const escapedName = file.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const headerBlockRegex = new RegExp(
          `(?:\\r?\\n){0,2}--- \\[${escapedName}\\] ---\\r?\\n[\\s\\S]*?(?=(?:\\r?\\n){2}--- \\[|$)`,
          'g'
        );
        newPolicyText = newPolicyText.replace(headerBlockRegex, '');
      }

      // 2. Remove extracted text if present anywhere in policyText
      if (file.extractedText && file.extractedText.trim()) {
        const trimmedExtracted = file.extractedText.trim();
        if (newPolicyText.trim() === trimmedExtracted) {
          newPolicyText = '';
        } else if (newPolicyText.includes(trimmedExtracted)) {
          newPolicyText = newPolicyText.replace(trimmedExtracted, '');
        }
      }

      // Clean up extraneous newlines
      newPolicyText = newPolicyText.replace(/\n{3,}/g, '\n\n').trim();
      if (!newPolicyText) {
        isPolicyTextNowEmpty = true;
      }

      const updatedProfile = {
        ...prev,
        uploadedPdfNames: newPdfNames,
        policyText: newPolicyText,
      };
      localStorage.setItem('compliance_company_profile_v2', JSON.stringify(updatedProfile));
      return updatedProfile;
    });

    // If no remaining files or policy text is now empty, reset AI audit data and evaluations
    if (remainingFiles.length === 0 || isPolicyTextNowEmpty) {
      setAiAuditData(null);
      const resetEvalObj: Record<string, ControlEvaluation> = {};
      NIST_SP800_53_REV5_CONTROLS.forEach((ctrl) => {
        resetEvalObj[ctrl.id] = {
          controlId: ctrl.id,
          status: 'unanswered',
          notes: '',
          evidence: '',
          matchingClauseAr: '',
          matchingClauseEn: '',
        };
      });
      setEvaluations(resetEvalObj);
      localStorage.setItem('compliance_uploaded_files_v2', JSON.stringify([]));
      localStorage.setItem('compliance_evaluations_v3', JSON.stringify(resetEvalObj));
    } else {
      // Also clean up any evaluations that used the deleted file's extracted text
      if (file.extractedText && file.extractedText.trim()) {
        const snippet = file.extractedText.trim().slice(0, 50);
        setEvaluations((prevEval) => {
          const updatedEval = { ...prevEval };
          Object.keys(updatedEval).forEach((cId) => {
            const ev = updatedEval[cId];
            if (
              ev.matchingClauseAr?.includes(snippet) ||
              ev.matchingClauseEn?.includes(snippet) ||
              ev.evidence?.includes(snippet)
            ) {
              updatedEval[cId] = {
                ...ev,
                status: 'unanswered',
                notes: '',
                evidence: '',
                matchingClauseAr: '',
                matchingClauseEn: '',
              };
            }
          });
          localStorage.setItem('compliance_evaluations_v3', JSON.stringify(updatedEval));
          return updatedEval;
        });
      }
      localStorage.setItem('compliance_uploaded_files_v2', JSON.stringify(remainingFiles));
    }

    handleAddLog(
      'حذف ملف وسياسته من قاعدة البيانات',
      `تم مسح وحذف الملف ${file.name} وجميع بياناته ونصوصه وتقييماته من قاعدة البيانات والتخزين المحلي.`
    );
  };

  const handleClearAllUploadedFiles = () => {
    setUploadedFiles([]);
    
    // Clear companyProfile policy text and uploaded names completely
    const clearedProfile = {
      ...companyProfile,
      uploadedPdfNames: [],
      policyText: '',
    };
    setCompanyProfile(clearedProfile);

    // Clear AI Audit response
    setAiAuditData(null);

    // Reset controls to standard baseline
    const baselineControls = sortAndStructureControls(NIST_SP800_53_REV5_CONTROLS);
    setControls(baselineControls);

    // Reset ALL evaluations to unanswered and clear mapped clauses
    const resetEvalObj: Record<string, ControlEvaluation> = {};
    baselineControls.forEach((ctrl) => {
      resetEvalObj[ctrl.id] = {
        controlId: ctrl.id,
        status: 'unanswered',
        notes: '',
        evidence: '',
        matchingClauseAr: '',
        matchingClauseEn: '',
      };
    });
    setEvaluations(resetEvalObj);

    // Persist empty and reset states to localStorage
    localStorage.setItem('compliance_uploaded_files_v2', JSON.stringify([]));
    localStorage.setItem('compliance_controls_v3', JSON.stringify(baselineControls));
    localStorage.setItem('compliance_evaluations_v3', JSON.stringify(resetEvalObj));
    localStorage.setItem('compliance_company_profile_v2', JSON.stringify(clearedProfile));

    handleAddLog(
      'تفريغ وحذف كامل بيانات قاعدة البيانات والسياسات والمعايير',
      'تم مسح وحذف كافة الملفات المرفوعة، والسياسات، وعناصر قاعدة البيانات، وتقييمات المعايير، ونتائج التدقيق نهائياً 100% من قاعدة البيانات والذاكرة المحلية.'
    );
  };

  // Sync RTL / LTR document direction according to selected language
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const handleOpenAuthModal = (defaultTab: 'user' | 'admin' = 'user') => {
    setAuthModalTab(defaultTab);
    setIsAuthModalOpen(true);
  };

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);

    // Auto-update company profile with user's details for reports & PDF exports
    setCompanyProfile((prev) => ({
      ...prev,
      auditorName: user.fullName || prev.auditorName,
      companyName: user.companyName || prev.companyName,
      email: user.email || prev.email,
      phoneNumber: user.phoneNumber || prev.phoneNumber,
    }));

    // Add audit log
    const newLog: SystemLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US'),
      user: user.fullName,
      action: user.role === 'admin' ? 'تسجيل دخول المستخدم الرئيسي (Admin)' : 'تسجيل دخول مستخدم / حساب جديد',
      details: `تمت المصادقة بنجاح بدور ${user.role}`,
      type: 'auth',
    };
    setLogs((prev) => [newLog, ...prev]);

    if (user.role === 'admin') {
      setActiveTab('admin');
    }
  };

  const handleLogout = () => {
    if (currentUser) {
      const logoutLog: SystemLog = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US'),
        user: currentUser.fullName,
        action: 'تسجيل الخروج',
        details: 'خروج من الجلسة الحالية',
        type: 'auth',
      };
      setLogs((prev) => [logoutLog, ...prev]);
    }
    setCurrentUser(null);
    if (activeTab === 'admin') {
      setActiveTab('evaluation');
    }
  };

  // Handle language toggle with AI translation integration
  const handleToggleLanguage = async () => {
    const nextLang: Language = language === 'ar' ? 'en' : 'ar';
    setLanguage(nextLang);

    // Trigger dynamic Gemini AI translation for NIST controls catalog
    setIsTranslatingWithAi(true);
    setTranslationStatusMessage(
      nextLang === 'ar'
        ? '✨ جاري تحديث وترجمة عناوين وأوصاف معايير NIST بدقة عالية عبر الذكاء الاصطناعي (Gemini)...'
        : '✨ Dynamically translating NIST standards titles and descriptions via Gemini AI...'
    );

    try {
      const res = await translateControlsCatalogWithAi(controls, nextLang);
      if (res && Array.isArray(res.controls) && res.controls.length > 0) {
        setControls(sortAndStructureControls(res.controls));
        setTranslationStatusMessage(
          nextLang === 'ar'
            ? '✅ تم تحديث وتطبيق ترجمة الذكاء الاصطناعي لمعايير NIST بنجاح!'
            : '✅ NIST standards translated & updated via Gemini AI successfully!'
        );
      }
    } catch (err) {
      console.error('Error during AI translation:', err);
    } finally {
      setIsTranslatingWithAi(false);
      setTimeout(() => setTranslationStatusMessage(null), 4000);
    }
  };

  // Update single control evaluation
  const handleUpdateEvaluation = (controlId: string, update: Partial<ControlEvaluation>) => {
    setEvaluations((prev) => ({
      ...prev,
      [controlId]: {
        ...(prev[controlId] || { controlId, status: 'unanswered', notes: '', evidence: '' }),
        ...update,
      },
    }));
  };

  // Batch update evaluations from AI analysis
  const handleBatchUpdateEvaluations = (updates: Record<string, Partial<ControlEvaluation>>) => {
    setEvaluations((prev) => {
      const next = { ...prev };
      Object.entries(updates).forEach(([ctrlId, updateObj]) => {
        next[ctrlId] = {
          ...(next[ctrlId] || { controlId: ctrlId, status: 'unanswered', notes: '', evidence: '' }),
          ...updateObj,
        };
      });
      return next;
    });
  };

  // Import custom controls from PDF/CSV
  const handleImportCustomControls = (newControls: NistControl[]) => {
    setControls((prev) => {
      const existingMap = new Map<string, NistControl>(prev.map((c) => [c.id, c]));
      newControls.forEach((c) => existingMap.set(c.id, c));
      return sortAndStructureControls(Array.from(existingMap.values()));
    });
    setEvaluations((prev) => {
      const next = { ...prev };
      newControls.forEach((c) => {
        if (!next[c.id]) {
          next[c.id] = { controlId: c.id, status: 'unanswered', notes: '', evidence: '' };
        }
      });
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Header Bar */}
      <Header
        language={language}
        onToggleLanguage={handleToggleLanguage}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        companyProfile={companyProfile}
        setCompanyProfile={setCompanyProfile}
        currentUser={currentUser}
        onOpenAuthModal={handleOpenAuthModal}
        onLogout={handleLogout}
        uploadedFilesCount={uploadedFiles.length}
        onOpenDatabaseFilesManager={() => setIsDatabaseFilesModalOpen(true)}
      />

      {/* Main Feature Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* AI Translation Active Status Toast / Banner */}
        {translationStatusMessage && (
          <div className="bg-slate-900/90 border border-emerald-500/40 rounded-xl p-3 shadow-xl backdrop-blur-md flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2.5">
              {isTranslatingWithAi ? (
                <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
              ) : (
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span className="text-slate-200 font-medium">{translationStatusMessage}</span>
            </div>
            <button
              onClick={() => setTranslationStatusMessage(null)}
              className="text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 text-[10px]"
            >
              ✕
            </button>
          </div>
        )}
        {activeTab === 'evaluation' && (
          <EvaluationTab
            controls={controls}
            evaluations={evaluations}
            onUpdateEvaluation={handleUpdateEvaluation}
            language={language}
            onImportCustomControls={handleImportCustomControls}
          />
        )}

        {activeTab === 'policy' && (
          <PolicyQuestionnaireTab
            companyProfile={companyProfile}
            setCompanyProfile={setCompanyProfile}
            onBatchUpdateEvaluations={handleBatchUpdateEvaluations}
            language={language}
            onAuditCompleted={(aiData) => setAiAuditData(aiData)}
            onAddUploadedFile={handleAddUploadedFile}
          />
        )}

        {activeTab === 'crawler' && (
          <WebCrawlerTab
            onBatchUpdateEvaluations={handleBatchUpdateEvaluations}
            language={language}
            onAuditCompleted={(aiData) => setAiAuditData(aiData)}
            onPolicyTextExtracted={(text, url) => {
              setCompanyProfile((p) => ({ ...p, policyText: text, websiteUrl: url }));
            }}
            controls={controls}
            companyProfile={companyProfile}
            setCompanyProfile={setCompanyProfile}
            onNavigateToDashboard={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardReportTab
            controls={controls}
            evaluations={evaluations}
            companyProfile={companyProfile}
            setCompanyProfile={setCompanyProfile}
            language={language}
            aiAuditData={aiAuditData}
            uploadedFiles={uploadedFiles}
            onAddUploadedFile={handleAddUploadedFile}
            onDeleteUploadedFile={handleDeleteUploadedFile}
            onClearAllUploadedFiles={handleClearAllUploadedFiles}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'dataset' && (
          currentUser?.role === 'admin' ? (
            <DatasetStudioTab
              controls={controls}
              setControls={setControls}
              language={language}
              uploadedFiles={uploadedFiles}
              onAddUploadedFile={handleAddUploadedFile}
              onUpdateUploadedFile={handleUpdateUploadedFile}
              onDeleteUploadedFile={handleDeleteUploadedFile}
              onClearAllUploadedFiles={handleClearAllUploadedFiles}
              onOpenFilesManager={() => setIsDatabaseFilesModalOpen(true)}
            />
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-2xl mx-auto text-center space-y-5 my-8 shadow-2xl">
              <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto text-rose-400">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">
                  {language === 'ar'
                    ? 'وصول محمي: استوديو ومحرر بيانات النظام مخصص للمسؤول الرئيسي فقط'
                    : 'Restricted Access: Dataset & Knowledge Studio is for Master Admin only'}
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  {language === 'ar'
                    ? 'لحماية قاعدة بيانات المعايير وقواعد الامتثال الخاصة بالنظام، تقتصر صلاحية التعديل والإضافة والحذف في الاستوديو على حساب المسؤول الرئيسي (Master Admin).'
                    : 'To protect system security standards and baseline rules, editing and managing dataset records is restricted to the Master Admin account.'}
                </p>
              </div>

              <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setAuthModalTab('admin');
                    setIsAuthModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold shadow-lg shadow-teal-600/20"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{language === 'ar' ? 'تسجيل الدخول كمسؤول رئيسي' : 'Login as Master Admin'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('evaluation')}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  {language === 'ar' ? 'العودة لتبويب التقييم' : 'Back to Evaluation'}
                </button>
              </div>
            </div>
          )
        )}

        {activeTab === 'admin' && (
          <AdminPanelTab
            currentUser={currentUser}
            users={users}
            setUsers={setUsers}
            logs={logs}
            controls={controls}
            language={language}
            onUpdateUser={handleUpdateUser}
            onAddLog={handleAddLog}
          />
        )}
      </main>

      {/* Auth Modal for User & Master Admin Login */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        language={language}
        defaultTab={authModalTab}
        users={users}
      />

      {/* Database & Policy Files Control Center Modal */}
      <DatabaseFilesManagerModal
        isOpen={isDatabaseFilesModalOpen}
        onClose={() => setIsDatabaseFilesModalOpen(false)}
        uploadedFiles={uploadedFiles}
        onAddUploadedFile={handleAddUploadedFile}
        onUpdateUploadedFile={handleUpdateUploadedFile}
        onDeleteUploadedFile={handleDeleteUploadedFile}
        onClearAllUploadedFiles={handleClearAllUploadedFiles}
        onApplyPolicyText={(text, fileName) => {
          setCompanyProfile((prev) => ({
            ...prev,
            policyText: text,
            uploadedPdfNames: Array.from(new Set([...prev.uploadedPdfNames, fileName])),
          }));
        }}
        language={language}
      />

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-1">
          <p className="font-semibold text-slate-300">
            {language === 'ar'
              ? 'نظام تقييم حماية البيانات والخصوصية المعتمد على معايير NIST SP 800-53 Rev 5'
              : 'Data Protection & Privacy Compliance Assessment System based on NIST SP 800-53 Rev 5'}
          </p>
        </div>
      </footer>
    </div>
  );
}

