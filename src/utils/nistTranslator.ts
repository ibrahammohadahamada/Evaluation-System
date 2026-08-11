import { NistControl } from '../types';

// Map of common NIST Family codes/names to Arabic & English names
export const FAMILY_TRANSLATIONS: Record<string, { ar: string; en: string }> = {
  'ACCESS CONTROL': { ar: 'التحكم بالوصول والإدارة (AC)', en: 'Access Control' },
  'AC': { ar: 'التحكم بالوصول والإدارة (AC)', en: 'Access Control' },
  'ACCOUNT MANAGEMENT': { ar: 'إدارة الحسابات والهويات', en: 'Account Management' },
  'AWARENESS AND TRAINING': { ar: 'التوعية والتدريب (AT)', en: 'Awareness and Training' },
  'AT': { ar: 'التوعية والتدريب (AT)', en: 'Awareness and Training' },
  'AUDIT AND ACCOUNTABILITY': { ar: 'المراجعة والتدقيق والمساءلة (AU)', en: 'Audit and Accountability' },
  'AU': { ar: 'المراجعة والتدقيق والمساءلة (AU)', en: 'Audit and Accountability' },
  'SECURITY ASSESSMENT AND AUTHORIZATION': { ar: 'تقييم الأمان والتصريح (CA)', en: 'Security Assessment and Authorization' },
  'CA': { ar: 'تقييم الأمان والتصريح (CA)', en: 'Security Assessment and Authorization' },
  'CONFIGURATION MANAGEMENT': { ar: 'إدارة التهيئة والتكوين (CM)', en: 'Configuration Management' },
  'CM': { ar: 'إدارة التهيئة والتكوين (CM)', en: 'Configuration Management' },
  'CONTINGENCY PLANNING': { ar: 'تخطيط الطوارئ واستمرارية الأعمال (CP)', en: 'Contingency Planning' },
  'CP': { ar: 'تخطيط الطوارئ واستمرارية الأعمال (CP)', en: 'Contingency Planning' },
  'IDENTIFICATION AND AUTHENTICATION': { ar: 'التعريف والمصادقة (IA)', en: 'Identification and Authentication' },
  'IA': { ar: 'التعريف والمصادقة (IA)', en: 'Identification and Authentication' },
  'INCIDENT RESPONSE': { ar: 'الاستجابة للحوادث السيبرانية (IR)', en: 'Incident Response' },
  'IR': { ar: 'الاستجابة للحوادث السيبرانية (IR)', en: 'Incident Response' },
  'MAINTENANCE': { ar: 'الصيانة الفنية للأنظمة (MA)', en: 'Maintenance' },
  'MA': { ar: 'الصيانة الفنية للأنظمة (MA)', en: 'Maintenance' },
  'MEDIA PROTECTION': { ar: 'حماية الوسائط والتخزين (MP)', en: 'Media Protection' },
  'MP': { ar: 'حماية الوسائط والتخزين (MP)', en: 'Media Protection' },
  'PHYSICAL AND ENVIRONMENTAL PROTECTION': { ar: 'الحماية الفيزيائية والبيئية (PE)', en: 'Physical and Environmental Protection' },
  'PE': { ar: 'الحماية الفيزيائية والبيئية (PE)', en: 'Physical and Environmental Protection' },
  'PLANNING': { ar: 'التخطيط الأمني والتشغيلي (PL)', en: 'Planning' },
  'PL': { ar: 'التخطيط الأمني والتشغيلي (PL)', en: 'Planning' },
  'PERSONNEL SECURITY': { ar: 'أمن الأفراد والكوادر (PS)', en: 'Personnel Security' },
  'PS': { ar: 'أمن الأفراد والكوادر (PS)', en: 'Personnel Security' },
  'RISK ASSESSMENT': { ar: 'تقييم المخاطر السيبرانية (RA)', en: 'Risk Assessment' },
  'RA': { ar: 'تقييم المخاطر السيبرانية (RA)', en: 'Risk Assessment' },
  'SYSTEM AND SERVICES ACQUISITION': { ar: 'أكواد وحماية سلاسل التوريد والخدمات (SA)', en: 'System and Services Acquisition' },
  'SA': { ar: 'أكواد وحماية سلاسل التوريد والخدمات (SA)', en: 'System and Services Acquisition' },
  'SYSTEM AND COMMUNICATIONS PROTECTION': { ar: 'حماية الأنظمة والاتصالات الشبكية (SC)', en: 'System and Communications Protection' },
  'SC': { ar: 'حماية الأنظمة والاتصالات الشبكية (SC)', en: 'System and Communications Protection' },
  'SYSTEM AND INFORMATION INTEGRITY': { ar: 'سلامة ونزاهة المعلومات والأنظمة (SI)', en: 'System and Information Integrity' },
  'SI': { ar: 'سلامة ونزاهة المعلومات والأنظمة (SI)', en: 'System and Information Integrity' },
  'PROGRAM MANAGEMENT': { ar: 'إدارة البرنامج الأمني والسياسات (PM)', en: 'Program Management' },
  'PM': { ar: 'إدارة البرنامج الأمني والسياسات (PM)', en: 'Program Management' },
  'PRIVACY': { ar: 'خصوصية وحماية البيانات الشخصية (PT)', en: 'Privacy & Data Protection' },
  'PT': { ar: 'خصوصية وحماية البيانات الشخصية (PT)', en: 'Privacy & Data Protection' },
  'GENERAL': { ar: 'معايير عامة ومستوردة', en: 'General Standards' },
  'CUSTOM': { ar: 'معايير مخصصة ومضافة', en: 'Custom Controls' },
  'IMPORT': { ar: 'سجلات مستوردة', en: 'Imported Records' },
};

// Dictionary of full phrase and sentence replacements for translating NIST controls into clear, professional Arabic
const FULL_SENTENCE_TRANSLATIONS: [RegExp, string][] = [
  [
    /An access control policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance;?/gi,
    'إعداد وتوثيق وتعميم سياسة شاملة للتحكم بالوصول تعالج الغرض والمدى والأدوار والمسؤوليات والتزام الإدارة والتنسيق بين الجهات والامتثال التنظيمي.'
  ],
  [
    /Procedures to facilitate the implementation of the access control policy and associated access controls;?/gi,
    'إعداد وتعميم إجراءات تشغيلية تفصيلية لتسهيل تطبيق وتنفيذ سياسة ضبط الوصول والضوابط الأمنية ذات الصلة.'
  ],
  [
    /Reviews and updates the current access control policy and associated access controls:?/gi,
    'مراجعة وتحديث سياسة وإجراءات التحكم بالوصول الحالية بشكل دوري وعند حدوث تغييرات:'
  ],
  [
    /Reviews and updates the current:?/gi,
    'مراجعة وتحديث السياسات والإجراءات التشغيلية الحالية بشكل دوري:'
  ],
];

const TRANSLATION_DICTIONARY: [RegExp, string][] = [
  [/The organization:/gi, 'تلتزم المنشأة والمؤسسة بما يلي:'],
  [/Develops, documents, and disseminates to/gi, 'تطوير وتوثيق وتعميم السياسات والإجراءات على:'],
  [/An access control policy that addresses/gi, 'إعداد وتوثيق سياسة التحكم بالوصول التي تعالج:'],
  [/Procedures to facilitate the implementation of/gi, 'إجراءات تشغيلية تفصيلية لتسهيل تطبيق وتنفيذ'],
  [/Reviews and updates the current/gi, 'مراجعة وتحديث السياسات والإجراءات الحالية بشكل دوري'],
  [/purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance/gi, 'الغرض، النطاق، الأدوار، المسؤوليات، التزام الإدارة، التنسيق بين الجهات، والامتثال التنظيمي'],
  [/the access control policy and associated access controls/gi, 'سياسة التحكم بالوصول والضوابط الأمنية المرتبطة بها'],
  [/associated access controls/gi, 'الضوابط والضمانات الأمنية المرتبطة بها'],
  [/access control policy/gi, 'سياسة التحكم والضبط بالوصول'],
  [/management commitment/gi, 'التزام الإدارة والقيادة'],
  [/coordination among organizational entities/gi, 'التنسيق والتعاون بين الإدارات والجهات'],
  [/Identifies and selects the following types/gi, 'تحديد واختيار أنواع حسابات الأنظمة المعتمدة لدعم مهام المنشأة:'],
  [/Assigns account managers for/gi, 'تعيين مسؤولين معتمدين عن إدارة وتتبع حسابات الأنظمة'],
  [/Establishes conditions for group and role membership/gi, 'تحديد شروط وضوابط العضوية للمجموعات والأدوار المسموحة'],
  [/Specifies authorized users/gi, 'تحديد وتخصيص المستخدمين المصرح لهم وصلاحيات الوصول والامتيازات لكل حساب'],
  [/Requires approvals by/gi, 'اشتراط الحصول على الموافقات الرسمية المسبقة من أصحاب الصلاحية'],
  [/Creates, enables, modifies, disables, and removes/gi, 'إنشاء وتفعيل وتعديل وتعطيل وإزالة الحسابات وفق الضوابط والإجراءات المعتمدة'],
  [/Monitors the use of/gi, 'مراقبة وتتبع استخدام وتدقيق كافة الحسابات والأنظمة'],
  [/Notifies account managers/gi, 'إشعار مدراء الحسابات فوراً عند انتهاء الحاجة أو نقل/إنهاء خدمات الموظف'],
  [/Authorizes access to the information system/gi, 'المصادقة على منح الوصول للأنظمة استناداً إلى تصريح صالح واستخدام معتمد'],
  [/Reviews accounts for compliance with account management requirements/gi, 'مراجعة الحسابات والتأكد من مطابقتها لمتطلبات إدارة الحسابات بشكل دوري'],
  [/Establishes a process for reissuing/gi, 'وضع آلية لإعادة إصدار واعتماد بيانات الاعتماد والمجموعات عند مغادرة أحد الأعضاء'],
  [/Enforces a limit of consecutive invalid logon attempts/gi, 'فرض حد أقصى محدد لمحاولات تسجيل الدخول الفاشلة المتتالية'],
  [/Automatically locks the account\/node/gi, 'قفل الحساب/العقدة تلقائياً أو تأخير طلب تسجيل الدخول عند تجاوز حد المحاولات'],
  [/The information system implements multifactor authentication/gi, 'يتضمن النظام آلية المصادقة متعددة العوامل (MFA) للوصول الشبكي والمحلي'],
  [/The information system generates audit records/gi, 'يقوم النظام بإنشاء وتوثيق سجلات المراجعة التي تحدد وقت ونوع ومصدر ونتيجة الحدث'],
  [/The information system protects audit information/gi, 'حماية سجلات وأدوات المراجعة والتدقيق من الوصول غير المصرح به أو التعديل أو الحذف'],
  [/The organization protects information at rest/gi, 'تطبق المنشأة آليات تشفير وحماية سرية ونزاهة البيانات المخزنة أثناء السكون'],
  [/The information system protects the confidentiality and integrity of transmitted information/gi, 'تشفير وحماية سرية ونزاهة البيانات والرسائل أثنـاء النقل والعبور عبر الشبكة'],
  [/The organization enforces the principle of least privilege/gi, 'تطبيق مبدأ الحد الأدنى من الصلاحيات (Least Privilege) للمستخدمين والعمليات'],
  [/The organization separates duties of individuals/gi, 'فصل المهام والمسؤوليات (Separation of Duties) بين الأفراد لمنع استغلال الصلاحيات'],
  [/The organization tests, validates, and documents changes/gi, 'اختبار والتحقق من وتوثيق التغييرات على الأنظمة قبل تطبيقها في البيئة التشغيلية'],
  [/Vulnerability scanning/gi, 'فحص الثغرات الأمنية والمسح الدوري للأنظمة والبرامج'],
  [/Incident handling capability/gi, 'الاستجابة للحوادث السيبرانية واحتوائها والتعافي منها'],
  [/Emergency shutoff/gi, 'إمكانية إيقاف الطاقة والأنظمة في حالات الطوارئ'],
  [/Uninterruptible power supply/gi, 'توفير مصادر الطاقة غير المنقطعة (UPS) لضمان الاستمرارية'],
  [/Backup information/gi, 'إجراء أخذ النسخ الاحتياطية للبيانات والأنظمة والتحقق من سلامتها'],
  [/Security awareness training/gi, 'تقديم برامج التوعية والتدريب الأمني لكافة مستخدمي الأنظمة'],
  [/organization-defined frequency/gi, 'الدورية المحددة معتمدًا من المنشأة'],
  [/organization-defined personnel or roles/gi, 'الأفراد أو الأدوار المحددة رسمياً من قبل المنشأة'],
  [/organization-defined/gi, 'المحدد من المنشأة'],
];

/**
 * Smartly translates English text to readable Arabic or provides structured Arabic fallback.
 */
export function translateTextToAr(text: string, titleContext?: string): string {
  if (!text || text.trim().length === 0) return 'لا يوجد وصف متاح';

  // If already contains significant Arabic characters and very few English words, return as is
  const arabicCharCount = (text.match(/[\u0600-\u06FF]/g) || []).length;
  if (arabicCharCount > text.length * 0.4 && !/[a-zA-Z]{5,}/.test(text)) {
    return text.trim();
  }

  let translated = text;

  // First check full sentence matches
  FULL_SENTENCE_TRANSLATIONS.forEach(([pattern, replacement]) => {
    translated = translated.replace(pattern, replacement);
  });

  // Apply dictionary replacements
  TRANSLATION_DICTIONARY.forEach(([pattern, replacement]) => {
    translated = translated.replace(pattern, replacement);
  });

  // Replace parameter bracket placeholders
  translated = translated
    .replace(/\[Assignment:[^\]]+\]/gi, '[تحديد المنشأة/الجهة]')
    .replace(/\[Selection:[^\]]+\]/gi, '[خيارات التحديد]')
    .replace(/\[Withdrawn:[^\]]+\]/gi, '[تم سحبه وإدماجه في ضابط آخر]');

  // Remove leftover trailing English conjunctions and fragments (e.g. "; and", ", and", "and compliance; and")
  translated = translated
    .replace(/\b(and|or|purpose|scope|roles|responsibilities|management|compliance)\b.*?;?\s*$/gi, '')
    .replace(/;\s*and\s*$/gi, '.')
    .replace(/;\s*or\s*$/gi, '.')
    .replace(/;\s*$/gi, '.')
    .replace(/\s+/g, ' ');

  // If there are still large leftover raw English sentences without Arabic, append context smoothly
  const remainingEnglish = translated.match(/[a-zA-Z]{3,}/g) || [];
  if (remainingEnglish.length > 8 && arabicCharCount < 10) {
    if (titleContext) {
      return `متطلبات المعيار وضوابطه التخصصية (${titleContext}): ${translated.replace(/;?\s*(and|or)\s*$/i, '')}`;
    }
  }

  return translated.trim();
}

/**
 * Translate control title or family to Arabic
 */
export function translateTitleToAr(title: string, id?: string): string {
  if (!title) return id ? `ضابط أمني (${id})` : 'ضابط أمني';

  const arabicCharCount = (title.match(/[\u0600-\u06FF]/g) || []).length;
  if (arabicCharCount > title.length * 0.2) return title.trim();

  const upper = title.trim().toUpperCase();
  if (FAMILY_TRANSLATIONS[upper]) {
    return FAMILY_TRANSLATIONS[upper].ar;
  }

  // Common titles
  if (upper.includes('POLICY AND PROCEDURES')) return 'السياسات والإجراءات التشغيلية';
  if (upper.includes('ACCOUNT MANAGEMENT')) return 'إدارة وتدقيق حسابات الأنظمة';
  if (upper.includes('ACCESS ENFORCEMENT')) return 'تطبيق وضبط التحكم بالوصول';
  if (upper.includes('INFORMATION FLOW ENFORCEMENT')) return 'تطبيق وضبط تدفق المعلومات';
  if (upper.includes('SEPARATION OF DUTIES')) return 'فصل المهام والمسؤوليات';
  if (upper.includes('LEAST PRIVILEGE')) return 'صلاحيات الحد الأدنى (الوصول الأقل)';
  if (upper.includes('UNSUCCESSFUL LOGON ATTEMPTS')) return 'محاولات تسجيل الدخول الفاشلة المتتالية';
  if (upper.includes('SYSTEM USE NOTIFICATION')) return 'إشعار وتحذير استخدام النظام';
  if (upper.includes('SESSION LOCK')) return 'قفل الجلسة عند الخمول';
  if (upper.includes('SESSION TERMINATION')) return 'إنهاء الجلسة تلقائياً';
  if (upper.includes('REMOTE ACCESS')) return 'الوصول الشبكي عن بُعد';
  if (upper.includes('WIRELESS ACCESS')) return 'الوصول اللاسلكي وحماية شبكات الواي فاي';
  if (upper.includes('MOBILE DEVICES')) return 'ضوابط وأمن الأجهزة المحمولة';
  if (upper.includes('AUDIT EVENTS')) return 'تحديد وأحداث المراجعة والتدقيق';
  if (upper.includes('CONTENT OF AUDIT RECORDS')) return 'محتوى وبنية سجلات التدقيق';
  if (upper.includes('AUDIT STORAGE CAPACITY')) return 'سعة وسعة تخزين سجلات التدقيق';
  if (upper.includes('FLAW REMEDIATION')) return 'معالجة وثغرات البرمجيات والأنظمة';
  if (upper.includes('MALICIOUS CODE PROTECTION')) return 'الحماية من البرمجيات الخبيثة والضارة';
  if (upper.includes('INFORMATION SYSTEM MONITORING')) return 'مراقبة ورصد الأنظمة والشبكة';

  return title.trim();
}

/**
 * Natural sort helper for Control IDs like AC-1, AC-1a, AC-2, AC-2 (1), AC-10, etc.
 */
export function compareControlIds(idA: string, idB: string): number {
  if (!idA) return 1;
  if (!idB) return -1;

  // Extract prefix (e.g. AC, AU, CM)
  const prefixA = idA.match(/^[A-Za-z]+/)?.[0] || '';
  const prefixB = idB.match(/^[A-Za-z]+/)?.[0] || '';

  if (prefixA !== prefixB) {
    return prefixA.localeCompare(prefixB);
  }

  // Extract primary number (e.g. AC-2 -> 2, AC-10 -> 10)
  const numA = parseInt(idA.match(/\d+/)?.[0] || '0', 10);
  const numB = parseInt(idB.match(/\d+/)?.[0] || '0', 10);

  if (numA !== numB) {
    return numA - numB;
  }

  // Secondary string comparison for sub-parts like (1), a, b
  return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Sorts array of NistControl items logically by Family and ID Hierarchy
 */
export function sortAndStructureControls(controls: NistControl[]): NistControl[] {
  // Family order priority list
  const familyOrder = [
    'ACCESS CONTROL', 'AC',
    'AWARENESS AND TRAINING', 'AT',
    'AUDIT AND ACCOUNTABILITY', 'AU',
    'SECURITY ASSESSMENT AND AUTHORIZATION', 'CA',
    'CONFIGURATION MANAGEMENT', 'CM',
    'CONTINGENCY PLANNING', 'CP',
    'IDENTIFICATION AND AUTHENTICATION', 'IA',
    'INCIDENT RESPONSE', 'IR',
    'MAINTENANCE', 'MA',
    'MEDIA PROTECTION', 'MP',
    'PHYSICAL AND ENVIRONMENTAL PROTECTION', 'PE',
    'PLANNING', 'PL',
    'PERSONNEL SECURITY', 'PS',
    'RISK ASSESSMENT', 'RA',
    'SYSTEM AND SERVICES ACQUISITION', 'SA',
    'SYSTEM AND COMMUNICATIONS PROTECTION', 'SC',
    'SYSTEM AND INFORMATION INTEGRITY', 'SI',
    'PROGRAM MANAGEMENT', 'PM',
    'PRIVACY', 'PT'
  ];

  return [...controls].sort((a, b) => {
    const famCodeA = (a.familyCode || '').trim().toUpperCase();
    const famCodeB = (b.familyCode || '').trim().toUpperCase();

    const idxA = familyOrder.indexOf(famCodeA);
    const idxB = familyOrder.indexOf(famCodeB);

    if (idxA !== -1 && idxB !== -1 && idxA !== idxB) {
      return idxA - idxB;
    }
    if (idxA !== -1 && idxB === -1) return -1;
    if (idxA === -1 && idxB !== -1) return 1;

    if (famCodeA !== famCodeB) {
      return famCodeA.localeCompare(famCodeB);
    }

    return compareControlIds(a.id, b.id);
  });
}
