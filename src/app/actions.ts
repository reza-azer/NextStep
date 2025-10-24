'use server';

import { suggestPromotionCandidates, type SuggestPromotionCandidatesInput } from '@/ai/flows/promotion-candidate-suggestions';

export async function getPromotionSuggestions(input: SuggestPromotionCandidatesInput) {
  try {
    const result = await suggestPromotionCandidates(input);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("AI suggestion failed:", error);
    return { success: false, error: error.message || 'An unknown error occurred during AI analysis.' };
  }
}
