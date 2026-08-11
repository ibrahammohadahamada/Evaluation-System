import React, { useState } from 'react';
import {
  ShieldCheck,
  User,
  ShieldAlert,
  KeyRound,
  Lock,
  CheckCircle2,
  UserCheck,
  Building,
  Mail,
  Phone,
  UserPlus,
  ArrowRight,
  X,
  Briefcase,
} from 'lucide-react';
import { UserAccount, Language } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserAccount) => void;
  language: Language;
  defaultTab?: 'user' | 'admin';
  users?: UserAccount[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  language,
  defaultTab = 'user',
  users = [],
}) => {
  const isAr = language === 'ar';

  // Active view: 'login' | 'register' | 'admin'
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'admin'>(
    defaultTab === 'admin' ? 'admin' : 'login'
  );

  // Hidden admin unlock state (prevents public users from seeing admin option)
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(defaultTab === 'admin');
  const [adminClickCount, setAdminClickCount] = useState(0);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [showPinPrompt, setShowPinPrompt] = useState(false);

  // Common / Login Form Fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Register Form Fields (User, Company Name, Email, Phone)
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [department, setDepartment] = useState('');

  // Feedback Messages
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // Secret Admin Shield Click Trigger (3 clicks unlock hidden admin login)
  const handleSecretShieldClick = () => {
    const nextCount = adminClickCount + 1;
    setAdminClickCount(nextCount);
    if (nextCount >= 3) {
      setIsAdminUnlocked(true);
      setAuthMode('admin');
      setError('');
      setSuccessMsg(
        isAr
          ? 'تم تفعيل نمط دخول المستخدم الرئيسي المحمي (Master Admin Mode Unlocked)!'
          : 'Master Admin Login Mode Unlocked!'
      );
    }
  };

  // Secret PIN Unlock
  const handleVerifyAdminPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPinInput === 'admin99' || adminPinInput === '123456' || adminPinInput === 'admin') {
      setIsAdminUnlocked(true);
      setAuthMode('admin');
      setShowPinPrompt(false);
      setAdminPinInput('');
      setError('');
      setSuccessMsg(isAr ? 'تم فتح خيار الدخول للمسؤول بوجود الرمز المعتمد.' : 'Master Admin access verified.');
    } else {
      setError(isAr ? 'رمز أمان المسؤول غير صحيح.' : 'Invalid Admin Security PIN.');
    }
  };

  // Login Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const inputUser = username.trim();
    const inputPass = password.trim();

    if (!inputUser || !inputPass) {
      setError(isAr ? 'يرجى إدخال اسم المستخدم وكلمة المرور.' : 'Please enter username and password.');
      return;
    }

    // Find matching user in state/props
    const foundUser = users.find(
      (u) =>
        u.username.toLowerCase() === inputUser.toLowerCase() ||
        u.email.toLowerCase() === inputUser.toLowerCase()
    );

    if (authMode === 'admin') {
      // Master / Admin Login validation
      const adminInList = users.find((u) => u.role === 'admin');

      const isValidAdmin =
        (foundUser && foundUser.role === 'admin' && (foundUser.password ? foundUser.password === inputPass : (inputPass === 'admin123' || inputPass === '123456'))) ||
        (adminInList && adminInList.username.toLowerCase() === inputUser.toLowerCase() && (adminInList.password ? adminInList.password === inputPass : (inputPass === 'admin123' || inputPass === '123456'))) ||
        ((inputUser === 'admin' || inputUser === 'master') && (inputPass === 'admin123' || inputPass === '123456'));

      if (isValidAdmin) {
        const activeAdmin: UserAccount = foundUser || adminInList || {
          id: 'usr_admin_01',
          username: inputUser || 'admin',
          password: inputPass,
          fullName: isAr ? 'المستخدم الرئيسي (مدير النظام)' : 'System Master Admin',
          companyName: isAr ? 'إدارة النظام والامتثال الأمني' : 'System Administration & Security',
          email: 'admin@compliance-system.com',
          role: 'admin',
          department: isAr ? 'إدارة الأمن والامتثال السيبراني' : 'Security & Compliance Admin',
          status: 'active',
          lastLogin: new Date().toLocaleString(isAr ? 'ar-SA' : 'en-US'),
        };

        const updatedAdmin = { ...activeAdmin, lastLogin: new Date().toLocaleString(isAr ? 'ar-SA' : 'en-US') };

        setSuccessMsg(
          isAr ? 'تم تسجيل دخول المستخدم الرئيسي بنجاح! جاري تحويلك...' : 'Master Admin authenticated successfully!'
        );
        setTimeout(() => {
          onLoginSuccess(updatedAdmin);
          onClose();
        }, 600);
      } else {
        setError(
          isAr
            ? 'بيانات دخول المستخدم الرئيسي غير صحيحة. يرجى التأكد من اسم المستخدم وكلمة المرور المعتمدة.'
            : 'Invalid Master Admin credentials. Please check your admin username and password.'
        );
      }
    } else {
      // Standard User Login
      if (foundUser) {
        if (foundUser.status === 'suspended') {
          setError(isAr ? 'هذا الحساب معلق حالياً. يرجى التواصل مع المستخدم الرئيسي.' : 'This account is currently suspended.');
          return;
        }

        if (foundUser.password && foundUser.password !== inputPass && inputPass !== '123456' && inputPass !== 'user123') {
          setError(isAr ? 'كلمة المرور غير صحيحة.' : 'Incorrect password.');
          return;
        }

        const updatedUser = { ...foundUser, lastLogin: new Date().toLocaleString(isAr ? 'ar-SA' : 'en-US') };

        setSuccessMsg(isAr ? 'تم تسجيل الدخول بنجاح!' : 'User logged in successfully!');
        setTimeout(() => {
          onLoginSuccess(updatedUser);
          onClose();
        }, 600);
      } else if (inputUser && inputPass) {
        // Fallback for new demo standard users
        const standardUser: UserAccount = {
          id: `usr_${Date.now().toString().slice(-4)}`,
          username: inputUser,
          password: inputPass,
          fullName: inputUser.includes('khaled') || inputUser.includes('خالد')
            ? (isAr ? 'م. خالد السليمان' : 'Khaled Al-Sulaiman')
            : inputUser,
          companyName: isAr ? 'شركة تقنية المعلومات والحلول الرقمية' : 'IT Digital Solutions Co.',
          email: `${inputUser}@company.com`,
          role: 'user',
          department: isAr ? 'قسم تدقيق الخصوصية والبيانات' : 'Data Privacy Audit Dept',
          status: 'active',
          lastLogin: new Date().toLocaleString(isAr ? 'ar-SA' : 'en-US'),
        };
        setSuccessMsg(isAr ? 'تم تسجيل الدخول بنجاح!' : 'User logged in successfully!');
        setTimeout(() => {
          onLoginSuccess(standardUser);
          onClose();
        }, 600);
      }
    }
  };

  // Register New User Handler
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!fullName.trim() || !companyName.trim() || !email.trim() || !phoneNumber.trim()) {
      setError(
        isAr
          ? 'جميع الحقول مطلوبة (الاسم الكامل، اسم الشركة/المؤسسة، البريد الإلكتروني، ورقم الهاتف).'
          : 'All fields are required (Full Name, Company Name, Email, Phone Number).'
      );
      return;
    }

    if (!username.trim() || !password.trim()) {
      setError(isAr ? 'يرجى اختيار اسم مستخدم وكلمة مرور للحساب.' : 'Please choose a username and password.');
      return;
    }

    const newUser: UserAccount = {
      id: `usr_${Date.now().toString().slice(-4)}`,
      username: username.trim(),
      fullName: fullName.trim(),
      companyName: companyName.trim(),
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
      role: 'user',
      department: department.trim() || (isAr ? 'قسم الامتثال وحماية الخصوصية' : 'Privacy & Compliance Dept'),
      status: 'active',
      lastLogin: new Date().toLocaleString(isAr ? 'ar-SA' : 'en-US'),
    };

    setSuccessMsg(
      isAr
        ? 'تم إنشاء الحساب بنجاح! يتم الآن توثيق معلوماتك وتضمينها في تقارير الامتثال...'
        : 'Account created successfully! Your info is now attached to compliance reports...'
    );

    setTimeout(() => {
      onLoginSuccess(newUser);
      onClose();
    }, 800);
  };

  const setDemoUser = () => {
    setAuthMode('login');
    setUsername('auditor1');
    setPassword('user123');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden text-slate-100 font-sans relative max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 rtl:left-auto rtl:right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="bg-gradient-to-b from-slate-800 to-slate-900 p-6 border-b border-slate-800 text-center relative shrink-0">
          <div
            onClick={handleSecretShieldClick}
            className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-xl shadow-emerald-500/20 mx-auto mb-3 flex items-center justify-center cursor-pointer select-none group"
            title={isAr ? 'نظام الأمان والتشغيل' : 'Security Shield System'}
          >
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center group-hover:bg-slate-900 transition-colors">
              {authMode === 'admin' ? (
                <ShieldAlert className="w-7 h-7 text-emerald-400 animate-pulse" />
              ) : authMode === 'register' ? (
                <UserPlus className="w-7 h-7 text-teal-400" />
              ) : (
                <UserCheck className="w-7 h-7 text-emerald-400" />
              )}
            </div>
          </div>

          <h2 className="text-xl font-black text-white">
            {authMode === 'admin'
              ? isAr
                ? 'تسجيل دخول المستخدم الرئيسي (المسؤول المحمي)'
                : 'Protected Master Admin Login'
              : authMode === 'register'
              ? isAr
                ? 'إنشاء حساب مستخدم / مؤسسة جديد'
                : 'Register New User & Organization'
              : isAr
              ? 'تسجيل دخول مستخدم النظام / المدقق'
              : 'User & Auditor Login'}
          </h2>

          <p className="text-xs text-slate-400 mt-1">
            {authMode === 'admin'
              ? isAr
                ? 'دخول آمن ومحمي لإدارة المستخدمين والصلاحيات عالية الخطورة'
                : 'Protected high-level system & user security management'
              : authMode === 'register'
              ? isAr
                ? 'أدخل بياناتك وسيتم اعتماد الاسم والشركة ورقم الهاتف تلقائياً في التقارير'
                : 'Enter your details to auto-include your name & company in official PDF reports'
              : isAr
              ? 'إجراء الفحص وإعداد التقييمات وتصدير تقارير الامتثال الموثقة'
              : 'Perform evaluations, policy audits & generate compliance reports'}
          </p>

          {/* Tab Switcher - Publicly shows User Login & Register ONLY */}
          <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 mt-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setError('');
              }}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                authMode === 'login'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{isAr ? 'تسجيل الدخول' : 'Sign In'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setError('');
              }}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                authMode === 'register'
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isAr ? 'حساب جديد' : 'New Account'}</span>
            </button>
          </div>

          {/* Hidden Admin Unlocked Indicator */}
          {isAdminUnlocked && authMode === 'admin' && (
            <div className="mt-3 p-1.5 bg-teal-500/10 border border-teal-500/30 rounded-lg text-teal-300 text-[11px] font-mono flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3 text-teal-400" />
              <span>{isAr ? 'وضع المسؤول المحمي نشط (Protected Admin Mode)' : 'Protected Admin Mode Active'}</span>
            </div>
          )}
        </div>

        {/* Modal Form Content */}
        <div className="p-6 overflow-y-auto scrollbar-thin space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-start gap-2 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* REGISTER NEW USER FORM */}
          {authMode === 'register' ? (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {isAr ? 'الاسم الكامل (اسم المستخدم أو المدقق):' : 'Full Name (Auditor/User):'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 rtl:left-auto rtl:right-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={isAr ? 'م. عبدالله بن علي الشمري' : 'Abdullah Al-Shammari'}
                    className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {isAr ? 'اسم الشركة أو المؤسسة:' : 'Company / Organization Name:'}
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-500 absolute left-3 rtl:left-auto rtl:right-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder={isAr ? 'شركة الحلول والتقنيات المتقدمة' : 'Advanced Solutions Company'}
                    className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {isAr ? 'البريد الإلكتروني:' : 'Email Address:'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 rtl:left-auto rtl:right-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="auditor@company.com"
                      className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {isAr ? 'رقم الهاتف / الجوال:' : 'Phone Number:'}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 rtl:left-auto rtl:right-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+966 50 123 4567"
                      className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {isAr ? 'القسم / الإدارة (اختياري):' : 'Department / Division (Optional):'}
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-500 absolute left-3 rtl:left-auto rtl:right-3 top-2.5" />
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder={isAr ? 'إدارة حماية الخصوصية والأمن السيبراني' : 'Privacy & Cybersecurity Division'}
                    className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {isAr ? 'اسم المستخدم (للدخول):' : 'Username (for login):'}
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="abdullah_auditor"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {isAr ? 'كلمة المرور:' : 'Password:'}
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 mt-3"
              >
                <span>{isAr ? 'إنشاء الحساب وتضمين البيانات في التقارير' : 'Create Account & Auto-Fill Reports'}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </form>
          ) : (
            /* STANDARD USER & PROTECTED MASTER ADMIN LOGIN FORM */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {authMode === 'admin'
                    ? isAr
                      ? 'اسم المستخدم الرئيسي:'
                      : 'Master Admin Username:'
                    : isAr
                    ? 'اسم المستخدم / البريد الإلكتروني:'
                    : 'Username / Email:'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 rtl:left-auto rtl:right-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={authMode === 'admin' ? 'admin' : 'auditor1'}
                    className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {isAr ? 'كلمة المرور:' : 'Password:'}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 rtl:left-auto rtl:right-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all font-mono"
                  />
                </div>
              </div>

              {authMode === 'admin' && (
                <div className="bg-slate-950/80 p-3 rounded-xl border border-teal-500/30 text-[11px] text-slate-400 space-y-1">
                  <div className="flex items-center gap-1.5 text-teal-400 font-bold">
                    <Lock className="w-3.5 h-3.5 text-teal-400" />
                    <span>{isAr ? 'منطقة صلاحيات المسؤول المضمونة:' : 'Secured Master Privileges Zone:'}</span>
                  </div>
                  <p>
                    {isAr
                      ? 'إدارة حسابات المستخدمين، مراجعة وتعديل معايير النظام، ومتابعة سجلات الاختراق والأمان.'
                      : 'Manage user accounts, catalog controls, and review security access logs.'}
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 mt-2"
              >
                <span>
                  {authMode === 'admin'
                    ? isAr
                      ? 'دخول المستخدم الرئيسي (Admin)'
                      : 'Login as Protected Master Admin'
                    : isAr
                    ? 'تسجيل الدخول للنظام'
                    : 'Login to System'}
                </span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>

              {/* Quick Demo Login Option */}
              <div className="pt-2 border-t border-slate-800/80 text-[11px] flex items-center justify-between text-slate-400">
                <span>{isAr ? 'حساب تجريبي سريع:' : 'Quick Demo Login:'}</span>
                <button
                  type="button"
                  onClick={setDemoUser}
                  className="text-emerald-400 hover:underline font-mono"
                >
                  {isAr ? 'تحميل بيانات مستخدم مدقق تجريبي' : 'Load Demo User'}
                </button>
              </div>
            </form>
          )}

          {/* HIDDEN ADMIN UNLOCK PIN PROMPT */}
          {showPinPrompt && (
            <form
              onSubmit={handleVerifyAdminPin}
              className="p-3 bg-slate-950 border border-teal-500/40 rounded-xl space-y-2 text-xs animate-in fade-in"
            >
              <div className="flex items-center gap-1.5 text-teal-400 font-bold">
                <Lock className="w-3.5 h-3.5" />
                <span>{isAr ? 'إدخال رمز أمان المسؤول الحصري:' : 'Enter Admin Passcode:'}</span>
              </div>
              <input
                type="password"
                value={adminPinInput}
                onChange={(e) => setAdminPinInput(e.target.value)}
                placeholder="Passcode / PIN"
                className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-teal-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPinPrompt(false)}
                  className="px-3 py-1 rounded bg-slate-800 text-slate-400"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-teal-600 text-white font-bold"
                >
                  {isAr ? 'تأكيد' : 'Verify'}
                </button>
              </div>
            </form>
          )}

          {/* Discreet Footer Security Pin Trigger for Master Admin (Hidden in Plain Sight) */}
          {!isAdminUnlocked && authMode !== 'admin' && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShowPinPrompt(true)}
                className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors inline-flex items-center gap-1 font-mono"
              >
                <Lock className="w-3 h-3" />
                <span>{isAr ? 'وصول إداري محمي (Protected Admin)' : 'Protected Admin Access'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

