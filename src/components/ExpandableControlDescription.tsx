import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Globe, Sparkles, HelpCircle, FileText, Info } from 'lucide-react';
import { NistControl, Language } from '../types';

interface ExpandableControlDescriptionProps {
  control: NistControl;
  defaultLanguage?: Language;
  showQuestion?: boolean;
  showDiscussion?: boolean;
  compact?: boolean;
  className?: string;
  onLanguageToggle?: (newLang: Language) => void;
}

export const ExpandableControlDescription: React.FC<ExpandableControlDescriptionProps> = ({
  control,
  defaultLanguage = 'ar',
  showQuestion = true,
  showDiscussion = true,
  compact = false,
  className = '',
  onLanguageToggle,
}) => {
  const [lang, setLang] = useState<Language>(defaultLanguage);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const isAr = lang === 'ar';

  const handleToggleLang = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextLang: Language = lang === 'ar' ? 'en' : 'ar';
    setLang(nextLang);
    if (onLanguageToggle) {
      onLanguageToggle(nextLang);
    }
  };

  const title = isAr ? control.titleAr : control.titleEn;
  const familyName = isAr ? control.familyNameAr : control.familyNameEn;
  const description = isAr ? control.descriptionAr : control.descriptionEn;
  const question = isAr ? control.questionAr : control.questionEn;

  // Truncation threshold
  const maxLength = compact ? 120 : 180;
  const needsExpansion = description.length > maxLength || (showDiscussion && control.discussion);

  const displayedDescription = !isExpanded && needsExpansion
    ? `${description.slice(0, maxLength)}...`
    : description;

  return (
    <div className={`space-y-2.5 transition-all ${className}`}>
      {/* Header Badges & Language Switcher Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-emerald-400 border border-slate-700/80 font-mono tracking-wide">
            {control.id}
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800/80 text-slate-300 font-medium border border-slate-700/50">
            {familyName}
          </span>
          {control.privacyFocus && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 font-semibold">
              {isAr ? 'معيار خصوصية PII' : 'Privacy Control'}
            </span>
          )}
        </div>

        {/* Language Switcher Toggle Button */}
        <button
          type="button"
          onClick={handleToggleLang}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-sm select-none"
          title={isAr ? 'عرض النص باللغة الإنجليزية' : 'Switch to Arabic'}
        >
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isAr ? 'English' : 'عربي'}</span>
        </button>
      </div>

      {/* Control Title */}
      <h4 className="text-base font-bold text-white leading-snug">
        {title}
      </h4>

      {/* Description Box */}
      <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/90 text-slate-300 text-xs leading-relaxed space-y-2">
        <div className="flex items-start gap-2">
          <FileText className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <p className="text-slate-200 leading-relaxed font-sans">
              {displayedDescription}
            </p>

            {/* Expanded Content (Full Discussion, Guidelines, Related Controls) */}
            {isExpanded && (
              <div className="space-y-2.5 pt-2 border-t border-slate-800/80 animate-in fade-in duration-200">
                {showQuestion && (
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-xs">
                    <span className="text-emerald-400 font-bold block mb-1">
                      {isAr ? 'السؤال التنفيذي للامتثال:' : 'Executive Question:'}
                    </span>
                    <span className="text-slate-200">{question}</span>
                  </div>
                )}

                {showDiscussion && control.discussion && (
                  <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800 text-xs">
                    <span className="text-teal-400 font-bold block mb-1 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-teal-400" />
                      <span>{isAr ? 'توضيح ومناقشة المعيار التفصيلية:' : 'Supplemental Guidance:'}</span>
                    </span>
                    <span className="text-slate-300 leading-relaxed block">{control.discussion}</span>
                  </div>
                )}

                {control.relatedControls && (
                  <div className="text-[11px] text-slate-400">
                    <span className="font-bold text-slate-300">{isAr ? 'الضوابط المرتبطة: ' : 'Related Controls: '}</span>
                    <span className="font-mono text-teal-300">{control.relatedControls}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expand / Collapse Button */}
      {needsExpansion && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors py-1 cursor-pointer select-none"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              <span>{isAr ? 'إخفاء الوصف التفصيلي 🔼' : 'Show Less 🔼'}</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              <span>{isAr ? 'عرض الوصف التفصيلي الكامل 🔽' : 'Read Full Description 🔽'}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
