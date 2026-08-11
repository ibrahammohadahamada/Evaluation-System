import { NistControl } from '../types';

export interface ControlMatchResult {
  control: NistControl;
  matchScore: number; // 0 to 100 percentage
  matchedKeywords: string[];
  snippetEn?: string;
  snippetAr?: string;
}

export interface PolicyParagraphMatch {
  paragraphText: string;
  paragraphIndex: number;
  topMatches: ControlMatchResult[];
}

/**
 * Normalizes text for Arabic and English term matching
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    // Arabic character normalization
    .replace(/[أإآآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u0652]/g, '') // Remove Arabic diacritics / tashkeel
    .replace(/[^\w\s\u0600-\u06FF]/g, ' ') // Replace non-alphanumeric (except Arabic letters) with space
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * List of common Arabic and English stop words to ignore during matching
 */
const STOP_WORDS = new Set([
  'the', 'and', 'for', 'that', 'this', 'with', 'from', 'are', 'was', 'were', 'been',
  'will', 'have', 'has', 'had', 'our', 'your', 'their', 'all', 'any', 'not', 'can',
  'may', 'should', 'must', 'into', 'upon', 'about', 'more', 'such', 'than', 'them',
  'من', 'في', 'على', 'عن', 'الى', 'إلى', 'أن', 'ان', 'هذا', 'هذه', 'تم', 'تمت',
  'كان', 'كانت', 'يكون', 'تكون', 'مع', 'أو', 'او', 'لا', 'ما', 'لم', 'كل', 'اي', 'أي',
  'التي', 'الذي', 'الذين', 'اللاتي', 'غير', 'حيث', 'بين', 'عند', 'حتى', 'بعد', 'قبل'
]);

/**
 * Extracts unique meaningful keywords from text
 */
export function extractKeywords(text: string): string[] {
  const normalized = normalizeText(text);
  const words = normalized.split(/\s+/);
  const unique = new Set<string>();

  for (const word of words) {
    if (word.length >= 3 && !STOP_WORDS.has(word)) {
      unique.add(word);
    }
  }

  return Array.from(unique);
}

/**
 * Calculates similarity match between query policy text and NIST controls in database catalog
 */
export function matchPolicyTextToControls(
  queryText: string,
  controlsCatalog: NistControl[],
  topN: number = 10
): ControlMatchResult[] {
  if (!queryText || queryText.trim().length === 0) return [];

  const queryKeywords = extractKeywords(queryText);
  const normalizedQuery = normalizeText(queryText);

  if (queryKeywords.length === 0) return [];

  const results: ControlMatchResult[] = [];

  for (const control of controlsCatalog) {
    const controlTextAr = `${control.id} ${control.familyCode} ${control.familyNameAr} ${control.titleAr} ${control.descriptionAr} ${control.questionAr}`;
    const controlTextEn = `${control.id} ${control.familyCode} ${control.familyNameEn} ${control.titleEn} ${control.descriptionEn} ${control.questionEn}`;
    
    const normControlAr = normalizeText(controlTextAr);
    const normControlEn = normalizeText(controlTextEn);

    const matchedKeywords: string[] = [];
    let scorePoints = 0;

    // Check direct ID or family match
    const idLower = control.id.toLowerCase();
    const familyLower = control.familyCode.toLowerCase();

    if (normalizedQuery.includes(idLower)) {
      scorePoints += 40;
      matchedKeywords.push(control.id);
    } else if (normalizedQuery.includes(familyLower)) {
      scorePoints += 15;
    }

    // Check individual keywords
    for (const kw of queryKeywords) {
      let kwScore = 0;
      
      if (normControlAr.includes(kw) || normControlEn.includes(kw)) {
        kwScore += 5;
        // Extra weight if keyword is in title or ID
        if (normalizeText(control.titleAr).includes(kw) || normalizeText(control.titleEn).includes(kw)) {
          kwScore += 10;
        }
        matchedKeywords.push(kw);
      }

      scorePoints += kwScore;
    }

    if (matchedKeywords.length > 0 || scorePoints > 0) {
      // Normalize score into percentage (cap at 98%)
      const maxPossible = Math.max(30, queryKeywords.length * 12);
      let matchPercent = Math.min(98, Math.round((scorePoints / maxPossible) * 100));

      // Minimum threshold for relevance
      if (matchPercent < 15 && matchedKeywords.length <= 1) {
        continue;
      }

      results.push({
        control,
        matchScore: Math.max(25, matchPercent),
        matchedKeywords: Array.from(new Set(matchedKeywords)),
      });
    }
  }

  // Sort by match score descending
  results.sort((a, b) => b.matchScore - a.matchScore);

  return results.slice(0, topN);
}

/**
 * Splits policy text into paragraphs and automatically matches each paragraph to closest NIST controls
 */
export function segmentAndMatchPolicy(
  policyText: string,
  controlsCatalog: NistControl[]
): PolicyParagraphMatch[] {
  if (!policyText) return [];

  // Split by double newlines or single newlines with headings
  const paragraphs = policyText
    .split(/\n\s*\n|\n(?=[0-9]+\.|\#|[A-Z][a-z]+:)/)
    .map((p) => p.trim())
    .filter((p) => p.length >= 25);

  const paragraphMatches: PolicyParagraphMatch[] = [];

  paragraphs.forEach((para, idx) => {
    const topMatches = matchPolicyTextToControls(para, controlsCatalog, 3);
    if (topMatches.length > 0) {
      paragraphMatches.push({
        paragraphText: para,
        paragraphIndex: idx + 1,
        topMatches,
      });
    }
  });

  return paragraphMatches;
}
