import { NistControl, Language } from '../types';

export interface TranslationResponse {
  controls: NistControl[];
  source: 'gemini-ai' | 'local-fallback' | 'error-fallback';
  warning?: string;
}

/**
 * Dynamically translates NIST controls catalog titles and descriptions using Gemini AI via server API route
 */
export async function translateControlsCatalogWithAi(
  controls: NistControl[],
  targetLanguage: Language
): Promise<TranslationResponse> {
  try {
    const response = await fetch('/api/translate-nist-catalog', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        controls,
        targetLanguage,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.warn('AI translation endpoint unavailable, falling back to local translations:', error);
    return {
      controls,
      source: 'local-fallback',
      warning: error.message || String(error),
    };
  }
}
