import { NistControl, AiAuditResponse } from '../types';
import { AC_CONTROLS } from './controls_ac';
import { AT_AU_CA_CONTROLS } from './controls_at_au_ca';
import { CM_CP_IA_CONTROLS } from './controls_cm_cp_ia';
import { IR_MA_MP_CONTROLS } from './controls_ir_ma_mp';
import { PE_PL_PM_CONTROLS } from './controls_pe_pl_pm';
import { PS_PT_RA_CONTROLS } from './controls_ps_pt_ra';
import { SA_SC_SI_SR_CONTROLS } from './controls_sa_sc_si_sr';

export const NIST_SP800_53_REV5_CONTROLS: NistControl[] = [
  ...AC_CONTROLS,
  ...AT_AU_CA_CONTROLS,
  ...CM_CP_IA_CONTROLS,
  ...IR_MA_MP_CONTROLS,
  ...PE_PL_PM_CONTROLS,
  ...PS_PT_RA_CONTROLS,
  ...SA_SC_SI_SR_CONTROLS,
];

export const NIST_FAMILIES = [
  { code: 'ALL', nameAr: 'جميع العائلات والمجالات (All Controls)', nameEn: 'All Families' },
  { code: 'AC', nameAr: 'التحكم بالوصول والهوية (AC)', nameEn: 'Access Control (AC)' },
  { code: 'AT', nameAr: 'التوعية والتدريب الأمني (AT)', nameEn: 'Awareness and Training (AT)' },
  { code: 'AU', nameAr: 'التدقيق والمساءلة والتحقق (AU)', nameEn: 'Audit and Accountability (AU)' },
  { code: 'CA', nameAr: 'التقييم والترخيص والمتابعة (CA)', nameEn: 'Assessment, Authorization & Monitoring (CA)' },
  { code: 'CM', nameAr: 'إدارة التهيئة والإعدادات (CM)', nameEn: 'Configuration Management (CM)' },
  { code: 'CP', nameAr: 'تخطيط الطوارئ واستمرارية العمل (CP)', nameEn: 'Contingency Planning (CP)' },
  { code: 'IA', nameAr: 'التعريف والمصادقة (IA)', nameEn: 'Identification and Authentication (IA)' },
  { code: 'IR', nameAr: 'الاستجابة للحوادث والانتهاكات (IR)', nameEn: 'Incident Response (IR)' },
  { code: 'MA', nameAr: 'الصيانة الفنية للأنظمة (MA)', nameEn: 'Maintenance (MA)' },
  { code: 'MP', nameAr: 'حماية وسائط التخزين (MP)', nameEn: 'Media Protection (MP)' },
  { code: 'PE', nameAr: 'الحماية المادية والبيئية (PE)', nameEn: 'Physical & Environmental Protection (PE)' },
  { code: 'PL', nameAr: 'التخطيط الأمني والخصوصية (PL)', nameEn: 'Planning (PL)' },
  { code: 'PM', nameAr: 'إدارة البرامج والأمن المؤسسي (PM)', nameEn: 'Program Management (PM)' },
  { code: 'PS', nameAr: 'أمن الأفراد والموظفين (PS)', nameEn: 'Personnel Security (PS)' },
  { code: 'PT', nameAr: 'معالجة معلومات الخصوصية والشفافية (PT)', nameEn: 'PII Processing & Transparency (PT)' },
  { code: 'RA', nameAr: 'تقييم وتحليل المخاطر (RA)', nameEn: 'Risk Assessment (RA)' },
  { code: 'SA', nameAr: 'استحواذ وشراء الأنظمة والخدمات (SA)', nameEn: 'System & Services Acquisition (SA)' },
  { code: 'SC', nameAr: 'حماية الاتصالات والتشفير (SC)', nameEn: 'System & Communications Protection (SC)' },
  { code: 'SI', nameAr: 'نزاهة النظام والمعلومات (SI)', nameEn: 'System Integrity & Breach Response (SI)' },
  { code: 'SR', nameAr: 'إدارة مخاطر سلاسل الإمداد (SR)', nameEn: 'Supply Chain Risk Management (SR)' },
];

/**
 * Retrieve a specific NIST control by its ID (e.g. "AC-2", "PT-3")
 */
export function getControlById(id: string): NistControl | undefined {
  return NIST_SP800_53_REV5_CONTROLS.find(
    (c) => c.id.toUpperCase() === id.trim().toUpperCase()
  );
}

/**
 * Retrieve all NIST controls belonging to a specific family code (e.g. "AC", "SI")
 */
export function getControlsByFamily(familyCode: string): NistControl[] {
  if (!familyCode || familyCode === 'ALL') {
    return NIST_SP800_53_REV5_CONTROLS;
  }
  return NIST_SP800_53_REV5_CONTROLS.filter(
    (c) => c.familyCode.toUpperCase() === familyCode.trim().toUpperCase()
  );
}

/**
 * Search NIST catalog controls using text query (IDs, titles, descriptions in Ar/En)
 */
export function searchNistCatalog(query: string): NistControl[] {
  if (!query || query.trim().length === 0) {
    return NIST_SP800_53_REV5_CONTROLS;
  }
  const q = query.toLowerCase().trim();
  return NIST_SP800_53_REV5_CONTROLS.filter((c) => {
    return (
      c.id.toLowerCase().includes(q) ||
      c.titleAr.toLowerCase().includes(q) ||
      c.titleEn.toLowerCase().includes(q) ||
      c.descriptionAr.toLowerCase().includes(q) ||
      c.descriptionEn.toLowerCase().includes(q) ||
      c.familyNameAr.toLowerCase().includes(q) ||
      c.familyNameEn.toLowerCase().includes(q) ||
      c.questionAr.toLowerCase().includes(q) ||
      c.questionEn.toLowerCase().includes(q)
    );
  });
}

/**
 * Full deterministic policy audit scanner that evaluates 100% of controls in NIST_SP800_53_REV5_CONTROLS.
 */
export function scanPolicyAgainstNistCatalog(policyText: string): AiAuditResponse {
  const normText = policyText.toLowerCase();
  let metCount = 0;
  let partialCount = 0;

  const evaluations = NIST_SP800_53_REV5_CONTROLS.map((ctrl) => {
    // Extract keywords from control ID, English title, Arabic title, and descriptions
    const idKw = ctrl.id.toLowerCase();
    const kwEn = ctrl.titleEn.toLowerCase().split(/[\s,.-]+/).filter((w) => w.length > 3);
    const kwAr = ctrl.titleAr.split(/[\s,.-]+/).filter((w) => w.length > 3);

    let matchFound = false;
    let snippet = '';

    // Check ID match first
    if (normText.includes(idKw)) {
      matchFound = true;
      const idx = normText.indexOf(idKw);
      snippet = policyText.slice(Math.max(0, idx - 30), Math.min(policyText.length, idx + 140));
    } else {
      // Check keyword matches
      for (const word of [...kwEn, ...kwAr]) {
        const lowerWord = word.toLowerCase();
        if (normText.includes(lowerWord)) {
          matchFound = true;
          const idx = normText.indexOf(lowerWord);
          snippet = policyText.slice(Math.max(0, idx - 40), Math.min(policyText.length, idx + 140));
          break;
        }
      }
    }

    let status: 'yes' | 'partial' | 'no' = 'no';
    if (matchFound) {
      if (snippet.length > 55) {
        status = 'yes';
        metCount++;
      } else {
        status = 'partial';
        partialCount++;
      }
    }

    const reasoningAr =
      status === 'yes'
        ? `تم العثور على مطابقة صريحة في نص السياسة تلبي متطلبات الضابط ${ctrl.id} (${ctrl.titleAr}).`
        : status === 'partial'
        ? `توجد إشارات أو مفاهيم عامة متعلقة بالضابط ${ctrl.id} في النص، ولكنها تتطلب صياغة وإجراءات تفصيلية لتكون ممتثلة بالكامل.`
        : `لم يتم العثور على أي نص أو إفصاح صريح في وثيقة السياسة يغطي متطلبات الضابط ${ctrl.id} (${ctrl.titleAr}).`;

    const reasoningEn =
      status === 'yes'
        ? `Explicit clause matched in policy text fulfilling control ${ctrl.id} (${ctrl.titleEn}).`
        : status === 'partial'
        ? `General concepts for ${ctrl.id} mentioned, but lacks explicit operational or policy details.`
        : `No explicit clause or disclosure found in policy document for control ${ctrl.id} (${ctrl.titleEn}).`;

    const matchingClause =
      snippet.trim() ||
      (status === 'no'
        ? 'لم يتم العثور على نص أو بند صريح يغطي هذا المعيار في الوثيقة'
        : 'بند عام متعلق بالحماية والأمن السيبراني');

    return {
      controlId: ctrl.id,
      status,
      matchingClause,
      reasoningAr,
      reasoningEn,
    };
  });

  const totalControls = NIST_SP800_53_REV5_CONTROLS.length;
  const rawScore = totalControls > 0 ? ((metCount + partialCount * 0.5) / totalControls) * 100 : 50;
  const overallScore = Math.min(100, Math.max(15, Math.round(rawScore)));

  const complianceLevelAr =
    overallScore >= 75
      ? 'ممتثل بدرجة عالية (High Compliance)'
      : overallScore >= 45
      ? 'ممتثل جزئياً (Partial Compliance)'
      : 'يحتاج تحسين جوهري (Non-Compliant Risk)';

  const complianceLevelEn =
    overallScore >= 75 ? 'Highly Compliant' : overallScore >= 45 ? 'Partially Compliant' : 'Non-Compliant Risk';

  // -------------------------------------------------------------
  // Dynamic Strengths, Weaknesses, and Actionable Recommendations
  // -------------------------------------------------------------
  const passedControls = NIST_SP800_53_REV5_CONTROLS.filter((_, idx) => evaluations[idx].status === 'yes');
  const failedControls = NIST_SP800_53_REV5_CONTROLS.filter((_, idx) => evaluations[idx].status === 'no');

  // Group controls by family code
  const failedByFamily: Record<string, NistControl[]> = {};
  failedControls.forEach((c) => {
    if (!failedByFamily[c.familyCode]) failedByFamily[c.familyCode] = [];
    failedByFamily[c.familyCode].push(c);
  });

  const passedByFamily: Record<string, NistControl[]> = {};
  passedControls.forEach((c) => {
    if (!passedByFamily[c.familyCode]) passedByFamily[c.familyCode] = [];
    passedByFamily[c.familyCode].push(c);
  });

  // Dynamic Strengths
  const strengthsAr: string[] = [];
  const strengthsEn: string[] = [];
  const passedFamCodes = Object.keys(passedByFamily);

  if (passedFamCodes.length > 0) {
    passedFamCodes.slice(0, 3).forEach((famCode) => {
      const ctrls = passedByFamily[famCode];
      const famNameAr = ctrls[0].familyNameAr;
      const famNameEn = ctrls[0].familyNameEn;
      const sampleIds = ctrls.slice(0, 3).map((c) => c.id).join(', ');
      strengthsAr.push(`تغطية صريحة وإفصاح ممتثل لضوابط ${famNameAr} (${sampleIds}).`);
      strengthsEn.push(`Explicit coverage and compliance for ${famNameEn} (${sampleIds}).`);
    });
  } else {
    strengthsAr.push('تضمين إفصاحات وإشارات أولية عامة حول شروط الاستخدام والخدمة.');
    strengthsEn.push('Baseline statements regarding general service scope and usage conditions.');
  }

  // Dynamic Weaknesses & Direct Reversing Recommendations Mapping
  const weaknessesAr: string[] = [];
  const weaknessesEn: string[] = [];
  const recommendationsAr: string[] = [];
  const recommendationsEn: string[] = [];

  const familyFixMap: Record<
    string,
    {
      weaknessAr: (c: NistControl[]) => string;
      weaknessEn: (c: NistControl[]) => string;
      recAr: (c: NistControl[]) => string;
      recEn: (c: NistControl[]) => string;
    }
  > = {
    AC: {
      weaknessAr: (c) => `نقص الإفصاحات وآليات التحكم بالوصول وإدارة الحسابات (${c.map((x) => x.id).slice(0, 3).join(', ')}).`,
      weaknessEn: (c) => `Lack of explicit access control and account management terms (${c.map((x) => x.id).slice(0, 3).join(', ')}).`,
      recAr: (c) => `إضافة بنود صريحة تحدد شروط منح وإلغاء صلاحيات الوصول وفرض المصادقة متعددة العوامل لمعالجة الفجوات في (${c.map((x) => x.id).slice(0, 3).join(', ')}).`,
      recEn: (c) => `Incorporate explicit terms for access authorization, MFA, and account deactivation to resolve gaps in (${c.map((x) => x.id).slice(0, 3).join(', ')}).`,
    },
    IR: {
      weaknessAr: (c) => `عدم توضيح آليات وإجراءات الاستجابة للحوادث والانتهاكات الأمنية (${c.map((x) => x.id).slice(0, 3).join(', ')}).`,
      weaknessEn: (c) => `Unspecified incident response mechanisms and breach notification workflows (${c.map((x) => x.id).slice(0, 3).join(', ')}).`,
      recAr: (c) => `تطوير بند تفصيلي يوضح إجراءات الإبلاغ عن الانتهاكات السيبرانية خلال 72 ساعة وإدارة الحوادث طبقاً لـ (${c.map((x) => x.id).slice(0, 3).join(', ')}).`,
      recEn: (c) => `Draft detailed incident notification protocols (72h breach notice) to address risks in (${c.map((x) => x.id).slice(0, 3).join(', ')}).`,
    },
    MP: {
      weaknessAr: (c) => `غياب السياسات الخاصة بحماية وسائط التخزين وإتلاف البيانات عند انتهاء الحاجة (${c.map((x) => x.id).slice(0, 3).join(', ')}).`,
      weaknessEn: (c) => `Missing media protection protocols and data sanitization/disposal rules (${c.map((x) => x.id).slice(0, 3).join(', ')}).`,
      recAr: (c) => `إدراج سياسة صريحة لحفظ البيانات وتدمير وسائط التخزين بصورة آمنة وموثقة سداً لقصور (${c.map((x) => x.id).slice(0, 3).join(', ')}).`,
      recEn: (c) => `Define clear data retention schedules and secure disposal guidelines addressing (${c.map((x) => x.id).slice(0, 3).join(', ')}).`,
    },
    PT: {
      weaknessAr: (c) => `ضعف الشفافية في معالجة معلومات الخصوصية الشخصية وحقوق أصحاب البيانات (${c.map((x) => x.id).slice(0, 3).join(', ')}).`,
      weaknessEn: (c) => `Insufficient transparency regarding PII processing and data subject privacy rights (${c.map((x) => x.id).slice(0, 3).join(', ')}).`,
      recAr: (c) => `صياغة قسم مخصص لشفافية معالجة البيانات الشخصية وتمكين المستخدم من ممارسة حقوقه (تعديل/حذف) لمعالجة القشور في (${c.map((x) => x.id).slice(0, 3).join(', ')}).`,
      recEn: (c) => `Add dedicated privacy notice sections detailing data subject rights (access/rectification/deletion) covering (${c.map((x) => x.id).slice(0, 3).join(', ')}).`,
    },
    SC: {
      weaknessAr: (c) => `نقص الإفصاح عن معايير تشفير الاتصالات وحماية البيانات أثناء النقل والسكون (${c.map((x) => x.id).slice(0, 3).join(', ')}).`,
      weaknessEn: (c) => `Brief disclosures on encryption standards for data in transit and at rest (${c.map((x) => x.id).slice(0, 3).join(', ')}).`,
      recAr: (c) => `تعديل النص للتأكيد الصريح على اعتماد بروتوكولات التشفير المتقدمة (TLS/AES) لحماية البيانات معالجة لـ (${c.map((x) => x.id).slice(0, 3).join(', ')}).`,
      recEn: (c) => `Explicitly confirm implementation of modern encryption protocols (TLS/AES) for transit and rest to fix (${c.map((x) => x.id).slice(0, 3).join(', ')}).`,
    },
    AU: {
      weaknessAr: (c) => `غياب الإفصاح عن آليات التدقيق وسجلات الأحداث المراقبة أمنياً (${c.map((x) => x.id).slice(0, 3).join(', ')}).`,
      weaknessEn: (c) => `Absence of disclosures on audit logging, monitoring, and accountability retention (${c.map((x) => x.id).slice(0, 3).join(', ')}).`,
      recAr: (c) => `تضمين بند يوضح الاحتفاظ بسجلات الأحداث وسجلات الأمن السيبراني ومراقبتها سداً لفجوة (${c.map((x) => x.id).slice(0, 3).join(', ')}).`,
      recEn: (c) => `Include clauses covering security log generation, monitoring, and retention to resolve (${c.map((x) => x.id).slice(0, 3).join(', ')}).`,
    },
    CP: {
      weaknessAr: (c) => `عدم التطرق لخطط استمرارية الأعمال والنسخ الاحتياطي وإعادة التعافي (${c.map((x) => x.id).slice(0, 3).join(', ')}).`,
      weaknessEn: (c) => `No explicit provisions regarding contingency planning, backups, and disaster recovery (${c.map((x) => x.id).slice(0, 3).join(', ')}).`,
      recAr: (c) => `إضافة بند يؤكد وجود خطط طوارئ ونسخ احتياطي منظم لضمان الجاهزية والاستمرارية حلاً للفجوة في (${c.map((x) => x.id).slice(0, 3).join(', ')}).`,
      recEn: (c) => `Incorporate assurances on data backup schedules and business continuity readiness to address (${c.map((x) => x.id).slice(0, 3).join(', ')}).`,
    },
    SI: {
      weaknessAr: (c) => `قصور في بيان تدابير نزاهة النظام والتحديثات الأمنية والحماية من البرمجيات الخبيثة (${c.map((x) => x.id).slice(0, 3).join(', ')}).`,
      weaknessEn: (c) => `Gaps in declaring system integrity measures, patch management, and malware protection (${c.map((x) => x.id).slice(0, 3).join(', ')}).`,
      recAr: (c) => `صياغة فقرة تؤكد على التطبيق الدوري للتحديثات الأمنية وإدارة الثغرات لحماية نزاهة النظام طبقاً لـ (${c.map((x) => x.id).slice(0, 3).join(', ')}).`,
      recEn: (c) => `Draft clauses confirming vulnerability management and patch application to ensure system integrity (${c.map((x) => x.id).slice(0, 3).join(', ')}).`,
    },
    SR: {
      weaknessAr: (c) => `عدم بيان معايير تقييم مخاطر الأطراف الخارجية وسلاسل الإمداد (${c.map((x) => x.id).slice(0, 3).join(', ')}).`,
      weaknessEn: (c) => `Missing guidelines on supply chain risk assessment and third-party vendor security (${c.map((x) => x.id).slice(0, 3).join(', ')}).`,
      recAr: (c) => `تطوير ملحق لمعايير اختيار الأطراف الخارجية وضوابط سلاسل الإمداد للحد من مخاطر (${c.map((x) => x.id).slice(0, 3).join(', ')}).`,
      recEn: (c) => `Establish vendor security assessment guidelines to mitigate supply chain risks in (${c.map((x) => x.id).slice(0, 3).join(', ')}).`,
    },
  };

  const failedFamCodes = Object.keys(failedByFamily);

  if (failedFamCodes.length > 0) {
    failedFamCodes.slice(0, 4).forEach((famCode) => {
      const ctrls = failedByFamily[famCode];
      if (familyFixMap[famCode]) {
        weaknessesAr.push(familyFixMap[famCode].weaknessAr(ctrls));
        weaknessesEn.push(familyFixMap[famCode].weaknessEn(ctrls));
        recommendationsAr.push(familyFixMap[famCode].recAr(ctrls));
        recommendationsEn.push(familyFixMap[famCode].recEn(ctrls));
      } else {
        const famNameAr = ctrls[0].familyNameAr;
        const famNameEn = ctrls[0].familyNameEn;
        const sampleIds = ctrls.slice(0, 3).map((c) => c.id).join(', ');
        weaknessesAr.push(`عدم كفاية الصياغة والتغطية لضوابط مجال ${famNameAr} (${sampleIds}).`);
        weaknessesEn.push(`Insufficient coverage for controls in ${famNameEn} (${sampleIds}).`);
        recommendationsAr.push(`تحديث السياسة لتضمين بنود وإفصاحات تغطي متطلبات ${famNameAr} المتمثلة في (${sampleIds}).`);
        recommendationsEn.push(`Update policy text to include explicit terms satisfying ${famNameEn} requirements (${sampleIds}).`);
      }
    });
  } else {
    weaknessesAr.push('لا توجد فجوات جوهرية حرجة، ولكن يوصى بالمراجعة السنوية الدورية.');
    weaknessesEn.push('No critical gaps identified; annual policy review recommended.');
    recommendationsAr.push('المحافظة على مستوى الامتثال الحالي وإجراء مراجعة وتحديث سنوي للسياسات.');
    recommendationsEn.push('Maintain current compliance posture and conduct annual policy reviews.');
  }

  return {
    overallScore,
    complianceLevelAr,
    complianceLevelEn,
    summaryAr: `تم إجراء مسح شامل لوثيقة السياسة المدخلة (${policyText.length} حرف) مقابل كافة ضوابط كتالوج NIST SP 800-53 Rev 5 البالغ عددها (${totalControls} ضابط). بلغت نسبة الامتثال الإجمالية ${overallScore}٪، مع تحقيق ${metCount} ضابط بامتثال كامل و ${partialCount} ضابط بامتثال جزئي.`,
    summaryEn: `Completed a full catalog scan of policy text (${policyText.length} chars) across all ${totalControls} controls in NIST SP 800-53 Rev 5. Overall compliance score achieved is ${overallScore}%, with ${metCount} fully met controls and ${partialCount} partial disclosures.`,
    strengthsAr,
    strengthsEn,
    weaknessesAr,
    weaknessesEn,
    recommendationsAr,
    recommendationsEn,
    evaluations,
  };
}

