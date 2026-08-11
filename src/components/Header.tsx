import React from 'react';
import { ShieldCheck, FileText, Globe, CheckSquare, Sparkles, Languages, Building2, UserCheck, User, LogOut, Lock, Settings, Database } from 'lucide-react';
import { Language, CompanyProfile, UserAccount } from '../types';

interface HeaderProps {
  language: Language;
  onToggleLanguage: () => void;
  activeTab: 'evaluation' | 'policy' | 'crawler' | 'dashboard' | 'dataset' | 'admin';
  setActiveTab: (tab: 'evaluation' | 'policy' | 'crawler' | 'dashboard' | 'dataset' | 'admin') => void;
  companyProfile: CompanyProfile;
  setCompanyProfile: React.Dispatch<React.SetStateAction<CompanyProfile>>;
  currentUser: UserAccount | null;
  onOpenAuthModal: (defaultTab?: 'user' | 'admin') => void;
  onLogout: () => void;
  uploadedFilesCount?: number;
  onOpenDatabaseFilesManager?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onToggleLanguage,
  activeTab,
  setActiveTab,
  companyProfile,
  setCompanyProfile,
  currentUser,
  onOpenAuthModal,
  onLogout,
  uploadedFilesCount = 0,
  onOpenDatabaseFilesManager,
}) => {
  const isAr = language === 'ar';

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-xl">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-100 font-sans">
                {isAr ? 'نظام تقييم حماية البيانات والخصوصية' : 'Data Protection & Privacy Compliance System'}
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                NIST SP 800-53 Rev 5
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'منصة الفحص الذاتي والامتثال للمعايير الدولية وسياسات الشركات'
                : 'Self-assessment & automated policy compliance audit platform'}
            </p>
          </div>
        </div>

        {/* Auditor & Company Quick Specs + Authentication Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs">
            <Building2 className="w-3.5 h-3.5 text-teal-400" />
            <input
              type="text"
              value={companyProfile.companyName}
              onChange={(e) => setCompanyProfile((p) => ({ ...p, companyName: e.target.value }))}
              placeholder={isAr ? 'اسم الشركة / المؤسسة' : 'Company Name'}
              className="bg-transparent border-none text-slate-200 placeholder-slate-500 focus:outline-none w-32 focus:w-44 transition-all"
            />
          </div>

          {/* User Session or Auth Buttons */}
          {currentUser ? (
            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <div className="px-2.5 py-1 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${currentUser.role === 'admin' ? 'bg-teal-400 animate-ping' : 'bg-emerald-400'}`} />
                <div>
                  <div className="font-bold text-white text-xs leading-tight flex items-center gap-1">
                    <span>{currentUser.fullName}</span>
                    <span className={`text-[9px] px-1.5 rounded font-mono ${currentUser.role === 'admin' ? 'bg-teal-500/20 text-teal-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                      {currentUser.role === 'admin' ? (isAr ? 'الرئيسي' : 'Admin') : (isAr ? 'مستخدم' : 'User')}
                    </span>
                  </div>
                  {currentUser.companyName && (
                    <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                      {currentUser.companyName}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-colors"
                title={isAr ? 'تسجيل الخروج' : 'Logout'}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuthModal('user')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition-all"
              >
                <User className="w-3.5 h-3.5" />
                <span>{isAr ? 'تسجيل الدخول / حساب جديد' : 'Sign In / Register'}</span>
              </button>
            </div>
          )}

          {onOpenDatabaseFilesManager && (
            <button
              onClick={onOpenDatabaseFilesManager}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-teal-300 border border-teal-500/30 transition-all cursor-pointer shadow-sm"
              title={isAr ? 'عرض وإدارة ملفات قاعدة البيانات والمستندات المرفوعة' : 'Manage Uploaded Database Files'}
            >
              <Database className="w-3.5 h-3.5 text-teal-400" />
              <span>{isAr ? 'ملفات قاعدة البيانات' : 'DB Files'}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-mono">
                {uploadedFilesCount}
              </span>
            </button>
          )}

          <button
            onClick={onToggleLanguage}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
            title="Toggle Language / تغيير اللغة"
          >
            <Languages className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isAr ? 'EN' : 'عربي'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-slate-950/60 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-start gap-1 overflow-x-auto py-1.5 scrollbar-none">
          <button
            onClick={() => setActiveTab('evaluation')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'evaluation'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>{isAr ? '1. تقييم المعايير (نعم/لا/جزئي)' : '1. Standard Evaluation'}</span>
          </button>

          <button
            onClick={() => setActiveTab('policy')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'policy'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{isAr ? '2. استبيان وتحليل السياسات' : '2. Policy Audit & Input'}</span>
          </button>

          <button
            onClick={() => setActiveTab('crawler')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'crawler'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>{isAr ? '3. فحص وزحف رابط الموقع' : '3. Website Crawler'}</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'dashboard'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                : 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
            <span>{isAr ? '4. لوحة الامتثال والتقارير PDF' : '4. Dashboard & PDF Report'}</span>
          </button>

          {/* Dataset Studio Tab - Accessible ONLY when Admin is authenticated */}
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('dataset')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'dataset'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-emerald-400 hover:text-emerald-200 hover:bg-slate-800/60'
              }`}
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? '5. استوديو ومحرر البيانات (Dataset)' : '5. Dataset & Knowledge Studio'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>
          )}

          {/* Master Admin Tab - Accessible ONLY when Admin is authenticated */}
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-600/30'
                  : 'text-teal-400 hover:text-teal-200 hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-4 h-4 text-teal-400" />
              <span>{isAr ? '6. إدارة النظام (المستخدم الرئيسي)' : '6. Master Admin Panel'}</span>
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
;
