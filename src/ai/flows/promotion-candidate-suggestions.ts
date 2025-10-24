'use server';

/**
 * @fileOverview Suggests potential candidates for promotion based on salary increase frequency, years of service, and other criteria.
 *
 * - suggestPromotionCandidates - A function that handles the promotion candidate suggestion process.
 * - SuggestPromotionCandidatesInput - The input type for the suggestPromotionCandidates function.
 * - SuggestPromotionCandidatesOutput - The return type for the suggestPromotionCandidates function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestPromotionCandidatesInputSchema = z.object({
  employeeData: z.array(
    z.object({
      name: z.string().describe('Employee name'),
      yearsOfService: z.number().describe('Years of service at the company'),
      salaryIncreaseFrequency: z
        .number()
        .describe(
          'Number of salary increases in the last 3 years (higher is better)'
        ),
      otherRelevantCriteria: z
        .string()
        .optional()
        .describe('Any other relevant information or qualifications'),
    })
  ).describe('Array of employee data objects'),
  numberOfSuggestions: z
    .number()
    .default(3)
    .describe('Number of promotion candidates to suggest'),
});
export type SuggestPromotionCandidatesInput = z.infer<
  typeof SuggestPromotionCandidatesInputSchema
>;

const SuggestPromotionCandidatesOutputSchema = z.object({
  candidates: z.array(
    z.object({
      name: z.string().describe('Name of the suggested candidate'),
      reason: z.string().describe('Reason for suggesting this candidate'),
    })
  ).describe('List of suggested promotion candidates with reasons'),
});
export type SuggestPromotionCandidatesOutput = z.infer<
  typeof SuggestPromotionCandidatesOutputSchema
>;

export async function suggestPromotionCandidates(
  input: SuggestPromotionCandidatesInput
): Promise<SuggestPromotionCandidatesOutput> {
  return suggestPromotionCandidatesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestPromotionCandidatesPrompt',
  input: {schema: SuggestPromotionCandidatesInputSchema},
  output: {schema: SuggestPromotionCandidatesOutputSchema},
  prompt: `You are an HR expert tasked with identifying potential promotion candidates.

Given the following employee data, suggest the top {{numberOfSuggestions}} candidates for promotion, along with a brief reason for each suggestion.

Employee Data:
{{#each employeeData}}
- Name: {{name}}
  - Years of Service: {{yearsOfService}}
  - Salary Increase Frequency: {{salaryIncreaseFrequency}}
  - Other Relevant Criteria: {{otherRelevantCriteria}}
{{/each}}

Candidates:
`, config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const suggestPromotionCandidatesFlow = ai.defineFlow(
  {
    name: 'suggestPromotionCandidatesFlow',
    inputSchema: SuggestPromotionCandidatesInputSchema,
    outputSchema: SuggestPromotionCandidatesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
