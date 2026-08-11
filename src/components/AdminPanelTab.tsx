import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Activity,
  Search,
  SlidersHorizontal,
  KeyRound,
  Edit3,
  Check,
  Lock,
  User,
} from 'lucide-react';
import { UserAccount, SystemLog, NistControl, Language } from '../types';

interface AdminPanelTabProps {
  currentUser: UserAccount | null;
  users: UserAccount[];
  setUsers: React.Dispatch<React.SetStateAction<UserAccount[]>>;
  logs: SystemLog[];
  controls: NistControl[];
  language: Language;
  onUpdateUser?: (updatedUser: UserAccount) => void;
  onAddLog?: (action: string, details: string) => void;
}

export const AdminPanelTab: React.FC<AdminPanelTabProps> = ({
  currentUser,
  users,
  setUsers,
  logs,
  controls,
  language,
  onUpdateUser,
  onAddLog,
}) => {
  const isAr = language === 'ar';
  const [activeSubTab, setActiveTab] = useState<'users' | 'controls' | 'logs'>('users');

  // User Management State
  const [searchTerm, setSearchType] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');

  // Edit User / Credentials Modal State
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editSuccessMsg, setEditSuccessMsg] = useState('');

  const openEditUserModal = (usr: UserAccount) => {
    setEditingUser(usr);
    setEditUsername(usr.username || '');
    setEditPassword(usr.password || 'admin123');
    setEditFullName(usr.fullName || '');
    setEditEmail(usr.email || '');
    setEditDepartment(usr.department || '');
    setEditCompanyName(usr.companyName || '');
    setEditSuccessMsg('');
  };

  const handleSaveUserEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const updatedUser: UserAccount = {
      ...editingUser,
      username: editUsername.trim(),
      password: editPassword.trim(),
      fullName: editFullName.trim(),
      email: editEmail.trim(),
      department: editDepartment.trim(),
      companyName: editCompanyName.trim(),
    };

    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    } else {
      setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    }

    if (onAddLog) {
      onAddLog(
        isAr ? 'تعديل بيانات الدخول والاعتماد' : 'Update Credentials',
        isAr
          ? `تم تحديث بيانات المستخدم (${updatedUser.username}) بكلمة مرور جديدة`
          : `Updated account (${updatedUser.username}) details & password`
      );
    }

    setEditSuccessMsg(
      isAr
        ? 'تم حفظ وتحديث بيانات الدخول وكلمة المرور بنجاح!'
        : 'Credentials & password updated successfully!'
    );

    setTimeout(() => {
      setEditingUser(null);
      setEditSuccessMsg('');
    }, 1200);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newFullName || !newEmail) return;

    const user: UserAccount = {
      id: `usr_${Date.now().toString().slice(-5)}`,
      username: newUsername.trim(),
      password: newPassword.trim() || 'user123',
      fullName: newFullName.trim(),
      email: newEmail.trim(),
      department: newDepartment.trim() || (isAr ? 'قسم الحوكمة والالتزام' : 'Governance & Compliance'),
      role: newRole,
      status: 'active',
      lastLogin: isAr ? 'لم يسجل دخول بعد' : 'Never',
    };

    setUsers((prev) => [user, ...prev]);
    setNewUsername('');
    setNewPassword('');
    setNewFullName('');
    setNewEmail('');
    setNewDepartment('');
    setShowAddUserModal(false);

    if (onAddLog) {
      onAddLog(
        isAr ? 'إضافة مستخدم جديد' : 'Add User',
        isAr ? `تم إضافة المستخدم الجديد (${user.username})` : `Added user ${user.username}`
      );
    }
  };

  const toggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, status: u.status === 'active' ? 'suspended' : 'active' } : u
      )
    );
  };

  const deleteUser = (userId: string) => {
    if (userId === currentUser?.id) return; // Prevent deleting oneself
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  return (
    <div className="space-y-6">
      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950/40 to-slate-900 border border-teal-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-2xl p-0.5 shadow-xl shadow-teal-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-teal-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">
                  {isAr ? 'لوحة المستخدم الرئيسي لـ إدارة النظام' : 'Master Admin Management Center'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                  {isAr ? 'مدير النظام' : 'Master Privileges'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {isAr
                  ? `أهلاً بك (${currentUser?.fullName || 'المستخدم الرئيسي'}). يمكنك التحكم في المستخدمين، وتعديل معايير NIST، ومتابعة السجلات.`
                  : `Welcome (${currentUser?.fullName || 'Master Admin'}). Manage users, security logs, and controls catalog.`}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddUserModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isAr ? 'إضافة مستخدم جديد' : 'Add New User'}</span>
          </button>
        </div>

        {/* Sub Navigation Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-6 pt-4 border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'users'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'إدارة المستخدمين' : 'Users Management'}</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-emerald-300">
              {users.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('controls')}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'controls'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-teal-400" />
            <span>{isAr ? 'إدارة المعايير والضوابط' : 'Controls Catalog'}</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-teal-300">
              {controls.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'logs'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4 text-amber-400" />
            <span>{isAr ? 'سجلات أحداث النظام' : 'Security Logs'}</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-amber-300">
              {logs.length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: USER MANAGEMENT */}
      {activeSubTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          {/* Master Admin Profile & Credentials Quick Edit Banner */}
          {currentUser?.role === 'admin' && (
            <div className="bg-gradient-to-r from-teal-950/80 via-slate-950 to-slate-900 border border-teal-500/40 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5 text-teal-400 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{isAr ? 'تغيير بيانات تسجيل الدخول وكلمة المرور للمستخدم الرئيسي' : 'Master Admin Credentials & Password'}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-teal-500/20 text-teal-300 font-mono">
                      {currentUser.username}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isAr
                      ? 'يمكنك هنا تغيير اسم المستخدم، كلمة المرور الرئيسية، البريد الإلكتروني والاسم لمدير النظام.'
                      : 'Update master admin username, secret password, email and profile details.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => openEditUserModal(currentUser)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-600/30 transition-all shrink-0"
              >
                <Edit3 className="w-4 h-4" />
                <span>{isAr ? 'تعديل بيانات الدخول الآن' : 'Edit Credentials & Password'}</span>
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <span>{isAr ? 'قائمة حسابات المستخدمين والمدققين' : 'System User & Auditor Accounts'}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr
                  ? 'يمكنك إضافة، تعليق، وتعديل بيانات الدخول وكلمات المرور للمستخدمين والمدققين.'
                  : 'Manage accounts, suspend access, or edit user login credentials & passwords.'}
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 rtl:left-auto rtl:right-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchType(e.target.value)}
                placeholder={isAr ? 'بحث بالاسم أو البريد...' : 'Search by name or email...'}
                className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-xs text-left rtl:text-right border-collapse">
              <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-3">{isAr ? 'المستخدم' : 'User'}</th>
                  <th className="p-3">{isAr ? 'القسم / الإدارة' : 'Department'}</th>
                  <th className="p-3">{isAr ? 'الدور والحيّز' : 'Role'}</th>
                  <th className="p-3">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="p-3">{isAr ? 'آخر تسجيل دخول' : 'Last Login'}</th>
                  <th className="p-3 text-center">{isAr ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                {users
                  .filter(
                    (u) =>
                      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      u.username.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((usr) => (
                    <tr key={usr.id} className="hover:bg-slate-800/30">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-emerald-400 shrink-0">
                            {usr.fullName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs flex items-center gap-1.5">
                              <span>{usr.fullName}</span>
                              <span className="text-[10px] text-slate-500 font-mono">(@{usr.username})</span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">{usr.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 text-slate-300 font-medium">{usr.department}</td>

                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full text-[10px] ${
                            usr.role === 'admin'
                              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {usr.role === 'admin' ? (
                            <>
                              <ShieldCheck className="w-3 h-3" />
                              <span>{isAr ? 'المستخدم الرئيسي (Admin)' : 'Master Admin'}</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3 h-3" />
                              <span>{isAr ? 'مستخدم تقييم' : 'Standard User'}</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[10px] ${
                            usr.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {usr.status === 'active'
                            ? isAr
                              ? 'نشط'
                              : 'Active'
                            : isAr
                            ? 'معلق'
                            : 'Suspended'}
                        </span>
                      </td>

                      <td className="p-3 text-slate-400 font-mono text-[11px]">{usr.lastLogin}</td>

                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditUserModal(usr)}
                            className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-300 hover:bg-teal-500/20 text-[11px] font-bold transition-all flex items-center gap-1"
                            title={isAr ? 'تعديل بيانات الحساب وكلمة المرور' : 'Edit Account & Password'}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{isAr ? 'تعديل' : 'Edit'}</span>
                          </button>

                          <button
                            onClick={() => toggleUserStatus(usr.id)}
                            className={`p-1.5 rounded-lg border text-[11px] font-bold transition-all ${
                              usr.status === 'active'
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                            }`}
                            title={usr.status === 'active' ? 'تعليق الحساب' : 'تفعيل الحساب'}
                          >
                            {usr.status === 'active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>

                          {usr.id !== currentUser?.id && (
                            <button
                              onClick={() => deleteUser(usr.id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-[11px] font-bold transition-all"
                              title={isAr ? 'حذف الحساب' : 'Delete Account'}
                            >
                              {isAr ? 'حذف' : 'Delete'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: NIST CONTROLS CATALOG MANAGEMENT */}
      {activeSubTab === 'controls' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-teal-400" />
              <span>{isAr ? 'إدارة كتالوج معايير NIST SP 800-53 Rev 5' : 'NIST Controls Catalog Administration'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAr
                ? 'يمكنك التعديل في إعدادات المعايير، تفعيل أو إيقاف ضوابط معينة في الفحص، وتنسيق الأسئلة الموجهة للذكاء الاصطناعي.'
                : 'Enable or disable specific controls or families for custom audit scopes.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {controls.slice(0, 8).map((ctrl) => (
              <div
                key={ctrl.id}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {ctrl.id}
                    </span>
                    <span className="font-bold text-xs text-white">{isAr ? ctrl.titleAr : ctrl.titleEn}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{isAr ? ctrl.descriptionAr : ctrl.descriptionEn}</p>
                </div>

                <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold shrink-0">
                  {isAr ? 'مفعل بالتقييم' : 'Active'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM AUDIT LOGS */}
      {activeSubTab === 'logs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-400" />
              <span>{isAr ? 'سجلات أمان ونشاطات النظام (System Audit Trail)' : 'System Audit Trail & Security Logs'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAr
                ? 'تسجيل آلي لجميع عمليات تسجيل الدخول، وتعديل التقييمات، وتحليل الذكاء الاصطناعي، وإدارة المستخدمين.'
                : 'Automated audit log capturing authentications, evaluation updates, and AI audits.'}
            </p>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {logs.map((log) => (
              <div
                key={log.id}
                className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-[10px] whitespace-nowrap">{log.timestamp}</span>
                  <span className="font-bold text-teal-400">{log.user}:</span>
                  <span className="text-slate-200">{log.action}</span>
                </div>
                <span className="text-slate-400 text-[11px] bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                  {log.details}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <UserPlus className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? 'إضافة مستخدم أو مدقق جديد' : 'Add New User or Auditor'}</span>
            </h3>

            <form onSubmit={handleAddUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">{isAr ? 'الاسم الكامل:' : 'Full Name:'}</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder={isAr ? 'م. عبد الله الشمري' : 'Abdullah Al-Shammari'}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">{isAr ? 'اسم المستخدم:' : 'Username:'}</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="abdullah"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">{isAr ? 'البريد الإلكتروني:' : 'Email Address:'}</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="abdullah@company.com"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">{isAr ? 'القسم / الإدارة:' : 'Department:'}</label>
                <input
                  type="text"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  placeholder={isAr ? 'قسم الأمن والامتثال' : 'Security & Compliance'}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">{isAr ? 'نوع الدور والصلاحية:' : 'Account Role:'}</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'admin' | 'user')}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="user">{isAr ? 'مستخدم تقييم عادي (Auditor/User)' : 'Standard Auditor User'}</option>
                  <option value="admin">{isAr ? 'المستخدم الرئيسي (Master Admin)' : 'Master Admin'}</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/30"
                >
                  {isAr ? 'حفظ المستخدم' : 'Save User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User & Master Admin Credentials Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-teal-500/40 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-teal-400" />
                <span>
                  {editingUser.role === 'admin'
                    ? isAr
                      ? 'تعديل بيانات وتسجيل دخول المستخدم الرئيسي (Master Admin)'
                      : 'Edit Master Admin Credentials & Account'
                    : isAr
                    ? 'تعديل بيانات الحساب وكلمة المرور'
                    : 'Edit User Credentials & Password'}
                </span>
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${editingUser.role === 'admin' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'bg-emerald-500/20 text-emerald-300'}`}>
                {editingUser.role === 'admin' ? (isAr ? 'الرئيسي' : 'Master Admin') : (isAr ? 'مستخدم' : 'User')}
              </span>
            </div>

            {editSuccessMsg && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{editSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveUserEdits} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-3">
                <div className="font-bold text-teal-400 text-xs flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isAr ? 'بيانات الاعتماد والدخول (Login Credentials):' : 'Account Credentials:'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">{isAr ? 'اسم المستخدم (Username):' : 'Username:'}</label>
                    <input
                      type="text"
                      required
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">{isAr ? 'كلمة المرور الجديدة (Password):' : 'New Password:'}</label>
                    <input
                      type="text"
                      required
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">{isAr ? 'الاسم الكامل:' : 'Full Name:'}</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">{isAr ? 'البريد الإلكتروني:' : 'Email Address:'}</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">{isAr ? 'القسم / الإدارة:' : 'Department:'}</label>
                <input
                  type="text"
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">{isAr ? 'اسم الشركة / المؤسسة:' : 'Company / Organization:'}</label>
                <input
                  type="text"
                  value={editCompanyName}
                  onChange={(e) => setEditCompanyName(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold shadow-lg shadow-teal-600/30"
                >
                  {isAr ? 'حفظ وتحديث بيانات الدخول' : 'Save Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
