// 'use server';

/**
 * @fileOverview Analyzes an image to identify ingredients and suggests potential recipes.
 *
 * - analyzeImage - A function that handles the image analysis and recipe suggestion process.
 * - AnalyzeImageInput - The input type for the analyzeImage function.
 * - AnalyzeImageOutput - The return type for the analyzeImage function.
 */

'use server';

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';

const AnalyzeImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of ingredients or a dish, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeImageInput = z.infer<typeof AnalyzeImageInputSchema>;

const AnalyzeImageOutputSchema = z.object({
  ingredients: z
    .array(z.string())
    .describe('A list of identified ingredients from the image.'),
  suggestedRecipes: z
    .array(z.string())
    .describe('A list of suggested recipes based on the identified ingredients.'),
});
export type AnalyzeImageOutput = z.infer<typeof AnalyzeImageOutputSchema>;

export async function analyzeImage(input: AnalyzeImageInput): Promise<AnalyzeImageOutput> {
  return analyzeImageFlow(input);
}

const analyzeImagePrompt = ai.definePrompt({
  name: 'analyzeImagePrompt',
  input: {
    schema: z.object({
      photoDataUri: z
        .string()
        .describe(
          "A photo of ingredients or a dish, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
        ),
    }),
  },
  output: {
    schema: z.object({
      ingredients: z
        .array(z.string())
        .describe('A list of identified ingredients from the image.'),
      suggestedRecipes: z
        .array(z.string())
        .describe('A list of suggested recipes based on the identified ingredients.'),
    }),
  },
  prompt: `You are a recipe suggestion AI.  A user will upload a photo of ingredients and/or a dish.

  You will identify the ingredients in the photo and suggest recipes that can be made with those ingredients.

  Here is the photo: {{media url=photoDataUri}}

  Respond in a JSON format.
  `,
});

const analyzeImageFlow = ai.defineFlow<
  typeof AnalyzeImageInputSchema,
  typeof AnalyzeImageOutputSchema
>({
  name: 'analyzeImageFlow',
  inputSchema: AnalyzeImageInputSchema,
  outputSchema: AnalyzeImageOutputSchema,
},
async input => {
  const { output } = await analyzeImagePrompt(input);
  return output!;
});
