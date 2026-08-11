import React, { useState } from 'react';
import {
  Database,
  Plus,
  Search,
  Bot,
  Sparkles,
  FileSpreadsheet,
  Upload,
  Edit3,
  Trash2,
  CheckCircle2,
  HelpCircle,
  Tag,
  Languages,
  BookOpen,
  Filter,
  ArrowRight,
  Layers,
  FileText,
  AlertCircle,
  Code2,
  RotateCcw,
} from 'lucide-react';
import { NistControl, Language, UploadedFileRecord } from '../types';
import { sortAndStructureControls, translateTextToAr, translateTitleToAr, FAMILY_TRANSLATIONS } from '../utils/nistTranslator';
import { NIST_SP800_53_REV5_CONTROLS } from '../data/nist_catalog';
import { ExpandableControlDescription } from './ExpandableControlDescription';

interface DatasetStudioTabProps {
  controls: NistControl[];
  setControls: React.Dispatch<React.SetStateAction<NistControl[]>>;
  language: Language;
  uploadedFiles?: UploadedFileRecord[];
  onAddUploadedFile?: (file: UploadedFileRecord) => void;
  onUpdateUploadedFile?: (file: UploadedFileRecord) => void;
  onDeleteUploadedFile?: (fileId: string) => void;
  onClearAllUploadedFiles?: () => void;
  onOpenFilesManager?: () => void;
}

export const DatasetStudioTab: React.FC<DatasetStudioTabProps> = ({
  controls,
  setControls,
  language,
  uploadedFiles = [],
  onAddUploadedFile,
  onUpdateUploadedFile,
  onDeleteUploadedFile,
  onClearAllUploadedFiles,
  onOpenFilesManager,
}) => {
  const isAr = language === 'ar';

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'id' | 'family' | 'priority' | 'title'>('family');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'hierarchy'>('table');

  // Edit/Add Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingControl, setEditingControl] = useState<NistControl | null>(null);
  const [showClearDatasetConfirm, setShowClearDatasetConfirm] = useState(false);
  const [showResetBaselineConfirm, setShowResetBaselineConfirm] = useState(false);

  // Form Fields
  const [formId, setFormId] = useState('');
  const [formFamilyCode, setFormFamilyCode] = useState('CUSTOM');
  const [formFamilyNameAr, setFormFamilyNameAr] = useState('مجموعة بيانات مخصصة');
  const [formFamilyNameEn, setFormFamilyNameEn] = useState('Custom Dataset');
  const [formTitleAr, setFormTitleAr] = useState('');
  const [formTitleEn, setFormTitleEn] = useState('');
  const [formDescAr, setFormDescAr] = useState('');
  const [formDescEn, setFormDescEn] = useState('');
  const [formQuestionAr, setFormQuestionAr] = useState('');
  const [formQuestionEn, setFormQuestionEn] = useState('');

  // AI Q&A State
  const [aiQuery, setAiQuery] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiResult, setAiResult] = useState<{
    answerAr: string;
    answerEn: string;
    matchedItemIds: string[];
    insightsAr: string[];
    insightsEn: string[];
  } | null>(null);
  const [aiError, setAiError] = useState('');

  // Dataset Batch Upload File state
  const [uploadMsg, setUploadMsg] = useState('');

  // Open modal for editing
  const handleEdit = (ctrl: NistControl) => {
    setEditingControl(ctrl);
    setFormId(ctrl.id);
    setFormFamilyCode(ctrl.familyCode);
    setFormFamilyNameAr(ctrl.familyNameAr);
    setFormFamilyNameEn(ctrl.familyNameEn);
    setFormTitleAr(ctrl.titleAr);
    setFormTitleEn(ctrl.titleEn);
    setFormDescAr(ctrl.descriptionAr);
    setFormDescEn(ctrl.descriptionEn);
    setFormQuestionAr(ctrl.questionAr || '');
    setFormQuestionEn(ctrl.questionEn || '');
    setShowAddModal(true);
  };

  // Open modal for creating new dataset record
  const handleOpenAdd = () => {
    setEditingControl(null);
    setFormId(`DS-${Date.now().toString().slice(-4)}`);
    setFormFamilyCode('CUSTOM');
    setFormFamilyNameAr('بيانات مخصصة');
    setFormFamilyNameEn('Custom Dataset');
    setFormTitleAr('');
    setFormTitleEn('');
    setFormDescAr('');
    setFormDescEn('');
    setFormQuestionAr('');
    setFormQuestionEn('');
    setShowAddModal(true);
  };

  // Save or Update Record
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId.trim() || (!formTitleAr.trim() && !formTitleEn.trim())) return;

    const cleanId = formId.trim().toUpperCase();
    const titleAr = formTitleAr || translateTitleToAr(formTitleEn, cleanId);
    const titleEn = formTitleEn || formTitleAr;
    const descAr = formDescAr || translateTextToAr(formDescEn, titleAr);
    const descEn = formDescEn || formDescAr;
    const famAr = formFamilyNameAr || translateTitleToAr(formFamilyCode);
    const famEn = formFamilyNameEn || formFamilyCode;

    const newRecord: NistControl = {
      id: cleanId,
      familyCode: formFamilyCode.toUpperCase(),
      familyNameAr: famAr,
      familyNameEn: famEn,
      titleAr,
      titleEn,
      descriptionAr: descAr,
      descriptionEn: descEn,
      questionAr: formQuestionAr || `هل تلبي المنشأة متطلبات الضابط [${cleanId}] (${titleAr})؟`,
      questionEn: formQuestionEn || `Does the entity comply with control [${cleanId}] (${titleEn})?`,
      privacyFocus: true,
    };

    if (editingControl) {
      setControls((prev) => sortAndStructureControls(prev.map((c) => (c.id === editingControl.id ? newRecord : c))));
    } else {
      setControls((prev) => sortAndStructureControls([newRecord, ...prev.filter((c) => c.id !== newRecord.id)]));
    }

    setShowAddModal(false);
  };

  // Delete Single Record
  const handleDelete = (id: string) => {
    setControls((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      localStorage.setItem('compliance_controls_v3', JSON.stringify(updated));
      return updated;
    });
  };

  // Clear ALL Dataset Records to 0
  const handleClearAllControls = () => {
    setControls([]);
    localStorage.setItem('compliance_controls_v3', JSON.stringify([]));
    setShowClearDatasetConfirm(false);
    setUploadMsg(
      isAr
        ? 'تم مسح وتفريغ كافة عناصر وسجلات قاعدة البيانات نهائياً (0 سجلات).'
        : 'All dataset records deleted from database (0 records).'
    );
  };

  // Reset Dataset Records to Standard NIST SP 800-53 Baseline
  const handleResetBaselineControls = () => {
    const baseline = sortAndStructureControls(NIST_SP800_53_REV5_CONTROLS);
    setControls(baseline);
    localStorage.setItem('compliance_controls_v3', JSON.stringify(baseline));
    setShowResetBaselineConfirm(false);
    setUploadMsg(
      isAr
        ? `تم إعادة ضبط قاعدة البيانات واسترجاع المعايير القياسية الأصلية بنجاح (${baseline.length} سجل).`
        : `Reset dataset to standard NIST SP 800-53 baseline (${baseline.length} records).`
    );
  };

  // Organize & Fix Dataset Hierarchy (Carrier inheritance + translation + deduplication)
  const handleAutoOrganizeDataset = () => {
    setControls((prev) => {
      let currentFamily = 'ACCESS CONTROL';
      const seen = new Map<string, NistControl>();

      for (const item of prev) {
        let family = item.familyCode?.trim() || currentFamily;
        if (family && family !== 'GENERAL' && family !== 'CUSTOM') {
          currentFamily = family;
        } else {
          family = currentFamily;
        }

        const famAr = item.familyNameAr && item.familyNameAr !== 'GENERAL' ? item.familyNameAr : translateTitleToAr(family);
        const titleAr = translateTitleToAr(item.titleAr || item.titleEn, item.id);
        const descAr = translateTextToAr(item.descriptionAr || item.descriptionEn, titleAr);

        const structuredItem: NistControl = {
          ...item,
          familyCode: family,
          familyNameAr: famAr,
          familyNameEn: item.familyNameEn && item.familyNameEn !== 'GENERAL' ? item.familyNameEn : family,
          titleAr,
          titleEn: item.titleEn || titleAr,
          descriptionAr: descAr,
          descriptionEn: item.descriptionEn || descAr,
          questionAr: item.questionAr || `هل تلبي المنشأة متطلبات الضابط [${item.id}] (${titleAr})؟`,
          questionEn: item.questionEn || `Does the entity comply with control [${item.id}] (${item.titleEn || titleAr})?`,
        };

        seen.set(item.id, structuredItem);
      }

      return sortAndStructureControls(Array.from(seen.values()));
    });

    setUploadMsg(
      isAr
        ? 'تمت إعادة تنظيم وتنسيق شجرة البيانات، ترجمة المصطلحات، ربط الضوابط بعائلاتها، وترتيبها هرمياً بنجاح!'
        : 'Dataset hierarchy organized, translated, and structured successfully!'
    );
  };

  // Helper function to parse CSV with proper quote handling
  const parseCsvRows = (text: string): string[][] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentField += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') i++;
        currentRow.push(currentField.trim());
        if (currentRow.some((f) => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }

    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      if (currentRow.some((f) => f.length > 0)) {
        rows.push(currentRow);
      }
    }

    return rows;
  };

  // Batch CSV / JSON / PDF Upload Parser with Intelligent Header Recognition & Carrier Inheritance
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileNameLower = file.name.toLowerCase();
    const isPdf = fileNameLower.endsWith('.pdf');
    const isJson = fileNameLower.endsWith('.json');
    const isCsv = fileNameLower.endsWith('.csv');

    if (isPdf) {
      setUploadMsg(isAr ? 'جاري قراءة واستخرج ملف PDF...' : 'Reading and parsing PDF...');
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
          const extractedText = data.extractedText || '';

          const pdfRecord: NistControl = {
            id: `PDF-${Date.now().toString().slice(-4)}`,
            familyCode: 'POLICY-PDF',
            familyNameAr: 'مستند PDF مستورد',
            familyNameEn: 'Imported PDF Document',
            titleAr: `مستند: ${file.name}`,
            titleEn: `Document: ${file.name}`,
            descriptionAr: extractedText,
            descriptionEn: extractedText,
            questionAr: `ما هي التزامات وضوابط الامتثال المذكورة في مستند ${file.name}؟`,
            questionEn: `What are the compliance requirements in ${file.name}?`,
            privacyFocus: true,
          };

          setControls((prev) => [pdfRecord, ...prev]);

          if (onAddUploadedFile) {
            onAddUploadedFile({
              id: `pdf_ds_${Date.now()}`,
              name: file.name,
              type: 'pdf',
              sizeBytes: file.size,
              uploadedAt: new Date().toLocaleString(isAr ? 'ar-SA' : 'en-US'),
              uploadedBy: isAr ? 'مسؤول البيانات' : 'Data Admin',
              sourceModule: 'dataset',
              summary: `تم إضافة سجل بيانات جديد من ملف PDF (${extractedText.length} حرف)`,
              extractedText,
            });
          }

          setUploadMsg(
            isAr
              ? `تم رفع ومعالجة ملف PDF (${file.name}) واستخراج البيانات بنجاح!`
              : `PDF file (${file.name}) successfully imported into dataset!`
          );
        } catch (err) {
          console.error('PDF dataset import error:', err);
          setUploadMsg(isAr ? 'حدث خطأ في معالجة ملف PDF.' : 'Error parsing PDF file.');
        }
      };
      reader.readAsDataURL(file);
    } else {
      // JSON, CSV, or TXT
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = (event.target?.result as string) || '';
          if (isJson) {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed)) {
              const formatted: NistControl[] = parsed.map((item, idx) => {
                const id = (item.id || `DS-IMP-${idx + 1}`).toUpperCase();
                const famCode = (item.familyCode || 'CUSTOM').toUpperCase();
                const famAr = item.familyNameAr || translateTitleToAr(famCode);
                const famEn = item.familyNameEn || famCode;
                const titleAr = translateTitleToAr(item.titleAr || item.title || 'سجل جديد', id);
                const titleEn = item.titleEn || item.title || 'New Record';
                const descAr = translateTextToAr(item.descriptionAr || item.description || '', titleAr);
                const descEn = item.descriptionEn || item.description || descAr;

                return {
                  id,
                  familyCode: famCode,
                  familyNameAr: famAr,
                  familyNameEn: famEn,
                  titleAr,
                  titleEn,
                  descriptionAr: descAr,
                  descriptionEn: descEn,
                  questionAr: item.questionAr || `هل تلبي المنشأة متطلبات الضابط [${id}] (${titleAr})؟`,
                  questionEn: item.questionEn || `Does the entity comply with control [${id}] (${titleEn})?`,
                  privacyFocus: true,
                };
              });

              setControls((prev) => {
                const map = new Map<string, NistControl>(prev.map((c) => [c.id, c]));
                formatted.forEach((item) => map.set(item.id, item));
                return sortAndStructureControls(Array.from(map.values()));
              });

              if (onAddUploadedFile) {
                onAddUploadedFile({
                  id: `json_${Date.now()}`,
                  name: file.name,
                  type: 'json',
                  sizeBytes: file.size,
                  uploadedAt: new Date().toLocaleString(isAr ? 'ar-SA' : 'en-US'),
                  uploadedBy: isAr ? 'مسؤول البيانات' : 'Data Admin',
                  itemCount: formatted.length,
                  sourceModule: 'dataset',
                  summary: `مجموعة بيانات JSON تحتوي على ${formatted.length} سجل مرتبة ومترجمة`,
                  extractedText: text,
                });
              }

              setUploadMsg(
                isAr
                  ? `تم استيراد، ترجمة، وترتيب ${formatted.length} سجل بنجاح في قاعدة البيانات!`
                  : `Successfully imported, translated, and structured ${formatted.length} dataset records!`
              );
            }
          } else {
            // Precise CSV Column Matching with Sequential Parent Family Carrier
            const parsedRows = parseCsvRows(text);
            if (parsedRows.length === 0) {
              setUploadMsg(isAr ? 'الملف فارغ أو لا يحتوي على بيانات.' : 'CSV file is empty.');
              return;
            }

            const rawHeader = parsedRows[0].map((col) => col.trim().toUpperCase());

            // Exact column index detection
            const familyIdx = rawHeader.findIndex((h) => h === 'FAMILY' || h.includes('FAMILY'));
            const nameIdx = rawHeader.findIndex((h) => h === 'NAME' || h === 'ID' || h === 'CONTROL');
            const titleIdx = rawHeader.findIndex((h) => h === 'TITLE' || h.includes('TITLE'));
            const priorityIdx = rawHeader.findIndex((h) => h === 'PRIORITY' || h.includes('PRIORITY'));
            const impactIdx = rawHeader.findIndex((h) => h.includes('BASELINE') || h.includes('IMPACT'));
            const descIdx = rawHeader.findIndex((h) => h === 'DESCRIPTION' || h.includes('DESC'));
            const guidanceIdx = rawHeader.findIndex((h) => h.includes('SUPPLEMENTAL') || h.includes('GUIDANCE'));
            const relatedIdx = rawHeader.findIndex((h) => h === 'RELATED' || h.includes('RELATED'));

            const hasKnownHeaders = familyIdx !== -1 || nameIdx !== -1 || descIdx !== -1;
            const dataRows = hasKnownHeaders ? parsedRows.slice(1) : parsedRows;

            let currentFamily = 'ACCESS CONTROL';
            let currentMainControlId = 'AC-1';

            const newRecords: NistControl[] = [];

            dataRows.forEach((row, idx) => {
              if (row.length === 0 || !row.some((col) => col.trim().length > 0)) return;

              // Read row values safely
              const rawFamily = familyIdx !== -1 ? row[familyIdx]?.trim() : '';
              const rawName = nameIdx !== -1 ? row[nameIdx]?.trim() : '';
              const rawTitle = titleIdx !== -1 ? row[titleIdx]?.trim() : '';
              const rawPriority = priorityIdx !== -1 ? row[priorityIdx]?.trim() : '';
              const rawImpact = impactIdx !== -1 ? row[impactIdx]?.trim() : '';
              const rawDesc = descIdx !== -1 ? row[descIdx]?.trim() : '';
              const rawGuidance = guidanceIdx !== -1 ? row[guidanceIdx]?.trim() : '';
              const rawRelated = relatedIdx !== -1 ? row[relatedIdx]?.trim() : '';

              // Update Carrier Family
              if (rawFamily && rawFamily.length > 0) {
                currentFamily = rawFamily;
              }

              // Identify ID / Code
              let itemCode = rawName || `ITEM-${idx + 1}`;

              // If Title is present, update current main control context
              if (rawTitle && rawTitle.length > 0) {
                currentMainControlId = itemCode;
              }

              // Construct Full Description + Discussion (Merge DESCRIPTION and SUPPLEMENTAL GUIDANCE)
              let fullDescription = '';
              if (rawDesc && rawGuidance) {
                fullDescription = `${rawDesc}\n\n${rawGuidance}`;
              } else {
                fullDescription = rawDesc || rawGuidance || '';
              }

              // Derive title if empty (e.g. sub-controls like AC-1a., AC-1a.1.)
              let itemTitle = rawTitle;
              if (!itemTitle) {
                if (rawDesc && rawDesc.length > 0) {
                  const firstLine = rawDesc.split('\n')[0].replace(/^"|"$/g, '').trim();
                  itemTitle = firstLine.length > 80 ? `${firstLine.slice(0, 80)}...` : firstLine;
                } else if (rawGuidance && rawGuidance.length > 0) {
                  const firstLine = rawGuidance.split('\n')[0].replace(/^"|"$/g, '').trim();
                  itemTitle = firstLine.length > 80 ? `${firstLine.slice(0, 80)}...` : firstLine;
                } else {
                  itemTitle = `ضابط فرعي [${itemCode}] تابع لـ (${currentMainControlId})`;
                }
              }

              // Perform automatic translations
              const famAr = translateTitleToAr(currentFamily);
              const titleAr = translateTitleToAr(itemTitle, itemCode);
              const descAr = translateTextToAr(fullDescription || itemTitle, titleAr);

              newRecords.push({
                id: itemCode,
                familyCode: currentFamily,
                familyNameAr: famAr,
                familyNameEn: currentFamily,
                titleAr,
                titleEn: itemTitle || titleAr,
                descriptionAr: descAr,
                descriptionEn: fullDescription || 'No description provided',
                questionAr: `هل تلبي المنشأة متطلبات الضابط [${itemCode}] (${titleAr})؟`,
                questionEn: `Does the entity comply with control [${itemCode}] (${itemTitle || titleAr})?`,
                priority: rawPriority || (rawImpact ? `Baseline: ${rawImpact}` : undefined),
                discussion: rawGuidance || undefined,
                relatedControls: rawRelated || undefined,
                privacyFocus: true,
              });
            });

            setControls((prev) => {
              const map = new Map<string, NistControl>(prev.map((c) => [c.id, c]));
              newRecords.forEach((rec) => map.set(rec.id, rec));
              const updatedControls = sortAndStructureControls(Array.from(map.values()));
              localStorage.setItem('compliance_controls_v3', JSON.stringify(updatedControls));
              return updatedControls;
            });

            if (onAddUploadedFile) {
              onAddUploadedFile({
                id: `csv_${Date.now()}`,
                name: file.name,
                type: isCsv ? 'csv' : 'txt',
                sizeBytes: file.size,
                uploadedAt: new Date().toLocaleString(isAr ? 'ar-SA' : 'en-US'),
                uploadedBy: isAr ? 'مسؤول البيانات' : 'Data Admin',
                itemCount: newRecords.length,
                sourceModule: 'dataset',
                summary: `تم تحليل وترجمة واستيراد ملف CSV بنجاح: ${newRecords.length} ضابط مرتب ومترجم`,
                extractedText: text,
              });
            }

            setUploadMsg(
              isAr
                ? `تم استيراد، ترجمة، وترتيب ${newRecords.length} ضابط/عنصر بيانات بنجاح من ملف CSV مع ربط الفئات الفرعية بالعائلات الرئيسية!`
                : `Successfully parsed, translated, and structured ${newRecords.length} records from CSV dataset!`
            );
          }
        } catch (err) {
          console.error('CSV Import Error:', err);
          setUploadMsg(isAr ? 'خطأ في تنسيق ملف البيانات.' : 'Invalid file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  // Run Gemini Multilingual Q&A Query over active dataset
  const handleQueryDataset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    setIsAiSearching(true);
    setAiError('');
    setAiResult(null);

    try {
      const res = await fetch('/api/query-dataset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: aiQuery,
          datasetItems: controls,
          language,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to query dataset');
      }

      const data = await res.json();
      setAiResult(data);
    } catch (err: any) {
      setAiError(err.message || String(err));
    } finally {
      setIsAiSearching(false);
    }
  };

  // Unique family codes list
  const families = ['ALL', ...Array.from(new Set(controls.map((c) => c.familyCode)))];
  const priorities = ['ALL', 'P1', 'P2', 'P3'];

  // Filter & Sort Dataset Records
  const filteredControls = controls
    .filter((ctrl) => {
      const matchesFamily = selectedFamily === 'ALL' || ctrl.familyCode === selectedFamily;
      const matchesPriority =
        selectedPriority === 'ALL' || (ctrl.priority && ctrl.priority.includes(selectedPriority));

      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        ctrl.id.toLowerCase().includes(searchLower) ||
        ctrl.familyCode.toLowerCase().includes(searchLower) ||
        ctrl.titleAr.toLowerCase().includes(searchLower) ||
        ctrl.titleEn.toLowerCase().includes(searchLower) ||
        ctrl.descriptionAr.toLowerCase().includes(searchLower) ||
        ctrl.descriptionEn.toLowerCase().includes(searchLower) ||
        (ctrl.discussion && ctrl.discussion.toLowerCase().includes(searchLower));

      return matchesFamily && matchesPriority && matchesSearch;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'id') {
        cmp = a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' });
      } else if (sortBy === 'family') {
        cmp = a.familyCode.localeCompare(b.familyCode);
      } else if (sortBy === 'title') {
        cmp = (isAr ? a.titleAr : a.titleEn).localeCompare(isAr ? b.titleAr : b.titleEn);
      } else if (sortBy === 'priority') {
        const pA = a.priority || 'ZZZ';
        const pB = b.priority || 'ZZZ';
        cmp = pA.localeCompare(pB);
      }

      return sortOrder === 'asc' ? cmp : -cmp;
    });

  // Group controls by family for Hierarchy View
  const groupedByFamily: Record<string, NistControl[]> = {};
  filteredControls.forEach((ctrl) => {
    const fam = ctrl.familyCode || 'GENERAL';
    if (!groupedByFamily[fam]) groupedByFamily[fam] = [];
    groupedByFamily[fam].push(ctrl);
  });

  // Export Cleaned CSV
  const handleExportCsv = () => {
    const header = ['FAMILY', 'NAME', 'TITLE', 'PRIORITY', 'DESCRIPTION', 'SUPPLEMENTAL GUIDANCE', 'RELATED'];
    const rows = filteredControls.map((c) => [
      `"${(c.familyCode || '').replace(/"/g, '""')}"`,
      `"${(c.id || '').replace(/"/g, '""')}"`,
      `"${(c.titleAr || c.titleEn || '').replace(/"/g, '""')}"`,
      `"${(c.priority || '').replace(/"/g, '""')}"`,
      `"${(c.descriptionAr || c.descriptionEn || '').replace(/"/g, '""')}"`,
      `"${(c.discussion || '').replace(/"/g, '""')}"`,
      `"${(c.relatedControls || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `organized_dataset_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Studio Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl p-0.5 shadow-xl shadow-emerald-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Database className="w-8 h-8 text-emerald-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">
                  {isAr
                    ? 'استوديو محرر وإدارة مجموعات البيانات وقواعد المعرفة (Dataset & Knowledge Studio)'
                    : 'Dataset & Knowledge Management Studio'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {controls.length} {isAr ? 'عنصر/سجل بيانات' : 'Dataset Records'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {isAr
                  ? 'ترتيب وتنظيم البيانات الذكي، الفرز الشجري حسب العائلات والأولويات، المعالجة التلقائية للتسلسل، والتصدير المباشر.'
                  : 'Smart dataset sorting, hierarchy grouping by family & priority, automatic parent-child sequence parsing, and instant export.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Database Files Control Center Button */}
            {onOpenFilesManager && (
              <button
                onClick={onOpenFilesManager}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-300 border border-teal-500/40 font-bold text-xs shadow-lg transition-all cursor-pointer ring-1 ring-teal-500/20"
                title={isAr ? 'عرض وتعديل وحذف ملفات قاعدة البيانات والمستندات المرفوعة' : 'Manage uploaded database files'}
              >
                <Database className="w-4 h-4 text-teal-400" />
                <span>{isAr ? 'التحكم بالملفات المرفوعة' : 'Manage Uploaded Files'}</span>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono text-[10px]">
                  {uploadedFiles.length}
                </span>
              </button>
            )}

            {/* Auto-Organize Hierarchy Button */}
            <button
              onClick={handleAutoOrganizeDataset}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 font-bold text-xs transition-all shadow-md cursor-pointer"
              title={isAr ? 'ربط العناصر الفرعية وإزالة المكررات' : 'Auto Fix Hierarchy & Deduplicate'}
            >
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>{isAr ? 'تنظيم وإصلاح الهيكلية' : 'Organize Hierarchy'}</span>
            </button>

            {/* Export Clean CSV */}
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 font-bold text-xs transition-all shadow-md cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'تصدير CSV المنسق' : 'Export Clean CSV'}</span>
            </button>

            {/* File Upload Button */}
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs cursor-pointer transition-all">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'استيراد (PDF/CSV/JSON)' : 'Import (PDF/CSV/JSON)'}</span>
              <input
                type="file"
                accept=".pdf,.csv,.json,.txt"
                onClick={(e) => {
                  (e.target as HTMLInputElement).value = '';
                }}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Reset Baseline Button */}
            <button
              onClick={() => setShowResetBaselineConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-xs transition-all shadow-md cursor-pointer"
              title={isAr ? 'إعادة ضبط واسترجاع معايير NIST SP 800-53 القياسية' : 'Reset to baseline NIST controls'}
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAr ? 'إعادة الضبط القياسي' : 'Reset Baseline'}</span>
            </button>

            {/* Clear Dataset Button */}
            <button
              onClick={() => setShowClearDatasetConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs transition-all shadow-md cursor-pointer"
              title={isAr ? 'مسح كافة سجلات قاعدة البيانات نهائياً' : 'Delete all dataset records'}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isAr ? 'تفريغ السجلات 🗑️' : 'Clear Dataset'}</span>
            </button>

            {/* Add Record Button */}
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إضافة سجل' : 'Add Record'}</span>
            </button>
          </div>
        </div>

        {/* Confirmation Banner for Clear Dataset */}
        {showClearDatasetConfirm && (
          <div className="mt-4 p-4 bg-rose-950/80 border border-rose-500/50 rounded-2xl text-xs text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl shrink-0">
                <AlertCircle className="w-5 h-5 text-rose-400" />
              </div>
              <div className="space-y-1">
                <span className="font-bold text-rose-300 block text-sm">
                  {isAr ? 'تأكيد الحذف الفعلي والتفريغ الكامل لقاعدة البيانات:' : 'Confirm Complete Dataset Wipe:'}
                </span>
                <p className="text-rose-200 leading-relaxed">
                  {isAr
                    ? `هل أنت متاكد من مسح وتفريغ كافة عناصر وسجلات قاعدة البيانات (${controls.length} سجل) نهائياً من محرر الاستوديو وتقييم المعايير؟`
                    : `Are you sure you want to permanently delete all ${controls.length} dataset records?`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleClearAllControls}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg cursor-pointer"
              >
                {isAr ? 'تأكيد المسح الفعلي 🗑️' : 'Yes, Wipe All Data'}
              </button>
              <button
                onClick={() => setShowClearDatasetConfirm(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        )}

        {/* Confirmation Banner for Reset Baseline */}
        {showResetBaselineConfirm && (
          <div className="mt-4 p-4 bg-amber-950/80 border border-amber-500/50 rounded-2xl text-xs text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl shrink-0">
                <RotateCcw className="w-5 h-5 text-amber-400" />
              </div>
              <div className="space-y-1">
                <span className="font-bold text-amber-300 block text-sm">
                  {isAr ? 'تأكيد إعادة الضبط إلى المعايير القياسية:' : 'Confirm Reset to Baseline NIST Controls:'}
                </span>
                <p className="text-amber-200 leading-relaxed">
                  {isAr
                    ? 'سيتم استرجاع ضوابط ومعايير NIST SP 800-53 القياسية وتحديث قاعدة البيانات بالكامل.'
                    : 'Reset dataset records to standard NIST SP 800-53 baseline controls.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleResetBaselineControls}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg cursor-pointer"
              >
                {isAr ? 'تأكيد إعادة الضبط 🔄' : 'Confirm Reset'}
              </button>
              <button
                onClick={() => setShowResetBaselineConfirm(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        )}

        {uploadMsg && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center justify-between shadow-lg animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{uploadMsg}</span>
            </div>
            <button
              onClick={() => setUploadMsg('')}
              className="text-slate-400 hover:text-white font-mono text-xs p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* MULTILINGUAL AI DATASET SEARCH & Q&A PANEL */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
            <h3 className="text-sm font-bold text-white">
              {isAr
                ? 'محرك الاستعلام والفهم بالذكاء الاصطناعي على البيانات (Multilingual Dataset Q&A Engine)'
                : 'AI Dataset Semantic Search & Multilingual Q&A'}
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            {isAr ? 'يفهم العربية والإنجليزية تلبيات متعددة' : 'Arabic & English Multilingual Analysis'}
          </span>
        </div>

        <form onSubmit={handleQueryDataset} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 rtl:left-auto rtl:right-3 top-3" />
            <input
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder={
                isAr
                  ? 'اسأل أي سؤال عن البيانات (مثال: ما هي ضوابط تشفير الحسابات والنسخ الاحتياطي؟)...'
                  : 'Ask any question on the dataset (e.g. Which controls require multi-factor auth and backup?)...'
              }
              className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={isAiSearching || !aiQuery.trim()}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            {isAiSearching ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{isAr ? 'جاري تحليل البيانات...' : 'Analyzing Dataset...'}</span>
              </>
            ) : (
              <>
                <Bot className="w-4 h-4" />
                <span>{isAr ? 'استعلام الذكاء الاصطناعي' : 'Ask AI Dataset Engine'}</span>
              </>
            )}
          </button>
        </form>

        {aiError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{aiError}</span>
          </div>
        )}

        {aiResult && (
          <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-xl text-xs space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{isAr ? 'إجابة وتحليل الذكاء الاصطناعي بناءً على مجموعة البيانات:' : 'AI Dataset Answer:'}</span>
              </span>
              <div className="flex gap-1">
                {aiResult.matchedItemIds?.map((id) => (
                  <span
                    key={id}
                    className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold"
                  >
                    {id}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-slate-200 leading-relaxed font-sans text-xs">
              {isAr ? aiResult.answerAr : aiResult.answerEn}
            </p>

            {/* Insights */}
            {(isAr ? aiResult.insightsAr : aiResult.insightsEn)?.length > 0 && (
              <div className="pt-2 border-t border-slate-800 space-y-1">
                <span className="font-bold text-slate-400 text-[11px]">
                  {isAr ? 'النقاط الرئيسية المستخلصة:' : 'Key Extracted Insights:'}
                </span>
                <ul className="list-disc list-inside text-slate-300 text-[11px] space-y-0.5">
                  {(isAr ? aiResult.insightsAr : aiResult.insightsEn).map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* DATASET MANAGEMENT, SEARCH, SORT & DISPLAY CONTROLS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        {/* Search & Filter & Sort Control Bar */}
        <div className="space-y-4 border-b border-slate-800 pb-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 rtl:left-auto rtl:right-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isAr ? 'بحث حسب المعرف، الفئة، العنوان أو التفاصيل...' : 'Search by ID, Family, Title, or Description...'}
                className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Family Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold shrink-0">{isAr ? 'الفئة:' : 'Family:'}</span>
              <select
                value={selectedFamily}
                onChange={(e) => setSelectedFamily(e.target.value)}
                className="py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="ALL">{isAr ? 'جميع الفئات (All)' : 'All Categories'}</option>
                {families
                  .filter((f) => f !== 'ALL')
                  .map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold shrink-0">{isAr ? 'الأولوية:' : 'Priority:'}</span>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="ALL">{isAr ? 'الكل' : 'All Priorities'}</option>
                {priorities
                  .filter((p) => p !== 'ALL')
                  .map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
              </select>
            </div>

            {/* Sort Control */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold shrink-0">{isAr ? 'الترتيب حسب:' : 'Sort By:'}</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="family">{isAr ? 'حسب الفئة (Family)' : 'By Family'}</option>
                <option value="id">{isAr ? 'حسب المعرف (ID)' : 'By ID'}</option>
                <option value="priority">{isAr ? 'حسب الأولوية (Priority)' : 'By Priority'}</option>
                <option value="title">{isAr ? 'حسب العنوان (Title)' : 'By Title'}</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-teal-400 font-mono font-bold transition-all cursor-pointer"
                title={isAr ? 'تغيير الترتيب تصاعدي / تنازلي' : 'Toggle Ascending/Descending'}
              >
                {sortOrder === 'asc' ? '↑ تصاعدي' : '↓ تنازلي'}
              </button>
            </div>
          </div>

          {/* View Mode & Stats Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            {/* View Switches */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{isAr ? 'عرض جدول إداري' : 'Table View'}</span>
              </button>

              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isAr ? 'عرض بطاقات' : 'Grid Cards'}</span>
              </button>

              <button
                onClick={() => setViewMode('hierarchy')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'hierarchy'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>{isAr ? 'الهيكل الشجري (Tree)' : 'Hierarchy Tree'}</span>
              </button>
            </div>

            <div className="text-xs font-mono text-slate-400">
              {isAr ? 'السجلات المعروضة حالياً:' : 'Showing:'}{' '}
              <strong className="text-emerald-400">{filteredControls.length}</strong> / {controls.length}
            </div>
          </div>
        </div>

        {/* VIEW MODE 1: STRUCTURED ADMINISTRATIVE TABLE VIEW */}
        {viewMode === 'table' && (
          <div className="overflow-x-auto rounded-xl border border-slate-800 custom-scrollbar">
            <table className="w-full text-right rtl:text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase font-mono">
                <tr>
                  <th className="p-3 text-center w-12">#</th>
                  <th className="p-3">{isAr ? 'الفئة (Family)' : 'Family'}</th>
                  <th className="p-3">{isAr ? 'المعرف (ID)' : 'Control ID'}</th>
                  <th className="p-3">{isAr ? 'العنوان' : 'Title'}</th>
                  <th className="p-3">{isAr ? 'الأولوية' : 'Priority'}</th>
                  <th className="p-3">{isAr ? 'الوصف والتفاصيل' : 'Description'}</th>
                  <th className="p-3 text-center w-24">{isAr ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {filteredControls.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 font-mono">
                      {isAr ? 'لا توجد سجلات تطابق معايير البحث والفلترة.' : 'No records match search criteria.'}
                    </td>
                  </tr>
                ) : (
                  filteredControls.map((ctrl, index) => (
                    <tr
                      key={ctrl.id + '_' + index}
                      className="hover:bg-slate-900/80 transition-colors group"
                    >
                      <td className="p-3 text-center font-mono text-slate-500 text-[11px]">
                        {index + 1}
                      </td>
                      <td className="p-3 font-mono font-bold text-teal-300 whitespace-nowrap">
                        <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800">
                          {ctrl.familyCode}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-black text-emerald-400 whitespace-nowrap">
                        <span className="bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                          {ctrl.id}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-white max-w-[220px] leading-snug">
                        {isAr ? ctrl.titleAr : ctrl.titleEn}
                      </td>
                      <td className="p-3 font-mono whitespace-nowrap">
                        {ctrl.priority ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              ctrl.priority.includes('P1')
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                : ctrl.priority.includes('P2')
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {ctrl.priority}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[10px]">-</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-300 max-w-md leading-relaxed text-[11px]">
                        <div className="line-clamp-2">{isAr ? ctrl.descriptionAr : ctrl.descriptionEn}</div>
                        {ctrl.discussion && (
                          <div className="mt-1 text-[10px] text-teal-400 font-mono line-clamp-1">
                            💡 {ctrl.discussion}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEdit(ctrl)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600/30 text-slate-300 hover:text-emerald-300 transition-all cursor-pointer"
                            title={isAr ? 'تعديل السجل' : 'Edit'}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(ctrl.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/30 text-slate-300 hover:text-rose-400 transition-all cursor-pointer"
                            title={isAr ? 'حذف السجل' : 'Delete'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW MODE 2: GRID CARDS VIEW */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredControls.map((ctrl) => (
              <div
                key={ctrl.id}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between gap-3 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(ctrl)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600/20 hover:text-emerald-300 text-slate-400 transition-colors cursor-pointer"
                      title={isAr ? 'تعديل السجل' : 'Edit Record'}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(ctrl.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/20 hover:text-rose-400 text-slate-400 transition-colors cursor-pointer"
                      title={isAr ? 'حذف السجل' : 'Delete Record'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <ExpandableControlDescription
                    control={ctrl}
                    defaultLanguage={language}
                    showQuestion={true}
                    showDiscussion={true}
                  />
                </div>

                <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>{isAr ? ctrl.familyNameAr : ctrl.familyNameEn}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-purple-400 font-bold">Privacy & Security Baseline</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* VIEW MODE 3: HIERARCHY TREE VIEW */}
        {viewMode === 'hierarchy' && (
          <div className="space-y-6">
            {Object.keys(groupedByFamily).length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-mono">
                {isAr ? 'لا توجد بيانات متاحة للعرض الشجري.' : 'No data for tree view.'}
              </div>
            ) : (
              Object.entries(groupedByFamily).map(([family, items]) => (
                <div
                  key={family}
                  className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      <h4 className="font-mono font-black text-sm text-white">
                        {family}
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono bg-slate-900 text-teal-300 px-2.5 py-0.5 rounded border border-slate-800">
                      {items.length} {isAr ? 'عنصر فرعي' : 'controls'}
                    </span>
                  </div>

                  <div className="space-y-2 pl-2 rtl:pl-0 rtl:pr-2 border-l-2 rtl:border-l-0 rtl:border-r-2 border-emerald-500/30">
                    {items.map((ctrl) => (
                      <div
                        key={ctrl.id}
                        className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/60 hover:border-slate-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 max-w-3xl">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                              {ctrl.id}
                            </span>
                            <span className="font-bold text-xs text-slate-200">
                              {isAr ? ctrl.titleAr : ctrl.titleEn}
                            </span>
                            {ctrl.priority && (
                              <span className="text-[9px] font-mono bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded">
                                {ctrl.priority}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                            {isAr ? ctrl.descriptionAr : ctrl.descriptionEn}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleEdit(ctrl)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600/30 text-slate-400 hover:text-emerald-300 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(ctrl.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/30 text-slate-400 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ADD / EDIT DATASET RECORD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto scrollbar-thin">
            <h3 className="text-base font-bold text-white flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <span>
                  {editingControl
                    ? isAr
                      ? `تعديل سجل البيانات [${editingControl.id}]`
                      : `Edit Dataset Record [${editingControl.id}]`
                    : isAr
                    ? 'إضافة عنصر جديد لمجموعة البيانات'
                    : 'Add New Dataset Item'}
                </span>
              </span>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white font-mono"
              >
                ✕
              </button>
            </h3>

            <form onSubmit={handleSaveForm} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">{isAr ? 'معرف العنصر (ID):' : 'Record ID:'}</label>
                  <input
                    type="text"
                    required
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    placeholder="DS-101"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">{isAr ? 'رمز الفئة (Category):' : 'Category Code:'}</label>
                  <input
                    type="text"
                    required
                    value={formFamilyCode}
                    onChange={(e) => setFormFamilyCode(e.target.value)}
                    placeholder="PRIVACY"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">{isAr ? 'العنوان بالعربية:' : 'Arabic Title:'}</label>
                  <input
                    type="text"
                    required
                    value={formTitleAr}
                    onChange={(e) => setFormTitleAr(e.target.value)}
                    placeholder="سياسة حماية بيانات المستخدمين"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">{isAr ? 'العنوان بالإنجليزية:' : 'English Title:'}</label>
                  <input
                    type="text"
                    value={formTitleEn}
                    onChange={(e) => setFormTitleEn(e.target.value)}
                    placeholder="User Data Protection Policy"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">{isAr ? 'الوصف والتفاصيل بالعربية:' : 'Arabic Description:'}</label>
                <textarea
                  rows={3}
                  required
                  value={formDescAr}
                  onChange={(e) => setFormDescAr(e.target.value)}
                  placeholder="اكتب تفاصيل وضوابط هذا العنصر باللغة العربية..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">{isAr ? 'الوصف والتفاصيل بالإنجليزية:' : 'English Description:'}</label>
                <textarea
                  rows={3}
                  value={formDescEn}
                  onChange={(e) => setFormDescEn(e.target.value)}
                  placeholder="Write description and guidelines in English..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/30"
                >
                  {isAr ? 'حفظ البيانات' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
