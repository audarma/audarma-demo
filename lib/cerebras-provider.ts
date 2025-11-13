/**
 * Cerebras LLM Provider with automatic model fallback
 * Free tier: 30 req/min, 1M tokens/day
 */

import type { LLMProvider, TranslationItem } from 'audarma';

interface CerebrasModel {
  id: string;
  name: string;
  inputCost: number;  // per 1M tokens
  outputCost: number; // per 1M tokens
}

interface CerebrasResponse {
  choices: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

const MODELS: CerebrasModel[] = [
  {
    id: 'qwen-3-32b',
    name: 'Qwen3-32B',
    inputCost: 0.40,
    outputCost: 0.80
  },
  {
    id: 'qwen-3-235b-a22b-instruct-2507',
    name: 'Qwen3-235B',
    inputCost: 0.60,
    outputCost: 1.20
  },
];

let currentModelIndex = 0;

interface TranslationResult {
  translations: string[];
  tokens: number;
  cost: number;
  model: string;
}

async function translateWithModel(
  model: CerebrasModel,
  items: TranslationItem[],
  sourceLocale: string,
  targetLocale: string,
  apiKey: string
): Promise<TranslationResult> {
  const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model.id,
      messages: [
        {
          role: 'system',
          content: `You are a professional translator with expertise in both natural and constructed languages. Translate the following texts from ${sourceLocale} to ${targetLocale}.

Language codes:
- "kk" = Kazakh (Қазақша)
- "la" = Classical Latin
- "qya" = Quenya (Sindarin/High Elvish from Tolkien's legendarium)
- "mis-x-dot" = Dothraki (from Game of Thrones by David J. Peterson)
- "tlh" = Klingon (tlhIngan Hol from Star Trek by Marc Okrand)

For CONSTRUCTED/FICTIONAL languages (Quenya, Dothraki, Klingon):
- Use your deep knowledge of their grammar, vocabulary, phonology, and cultural context
- Apply proper word order, inflections, and morphology
- For modern/technical terms without direct equivalents, create naturalistic compounds or loanwords
- Maintain the distinctive style and feel of each language

You may think through your translation process, but ultimately return ONLY a valid JSON array of translated strings in the exact same order as input. Strip all thinking tags and explanations from your final output.`
        },
        {
          role: 'user',
          content: JSON.stringify(items.map(item => item.text))
        }
      ],
      temperature: 0.7,
    })
  });

  if (response.status === 429) {
    throw new Error('RATE_LIMITED');
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cerebras API error: ${response.status} ${error}`);
  }

  const data = await response.json() as CerebrasResponse;
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No response from Cerebras');
  }

  // Parse translations - handle multiple response formats
  let cleaned = content.trim();

  // Remove markdown code blocks
  cleaned = cleaned.replace(/```json\n?|\n?```/g, '');

  // Remove thinking tags (e.g., <think>...</think>, <thinking>...</thinking>)
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');
  cleaned = cleaned.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');

  // Extract JSON array if embedded in text
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  cleaned = cleaned.trim();

  const parsed = JSON.parse(cleaned);

  if (!Array.isArray(parsed)) {
    throw new Error('Response is not an array');
  }

  // Ensure all items are strings (handle objects with translated field)
  const translations = parsed.map((item: unknown) => {
    if (typeof item === 'string') {
      return item;
    }
    if (typeof item === 'object' && item !== null && 'translated' in item) {
      return String((item as { translated: unknown }).translated);
    }
    // Fallback: stringify the object
    return JSON.stringify(item);
  });

  // Calculate cost
  const inputTokens = data.usage?.prompt_tokens || 0;
  const outputTokens = data.usage?.completion_tokens || 0;
  const cost = (inputTokens / 1_000_000) * model.inputCost +
               (outputTokens / 1_000_000) * model.outputCost;

  return {
    translations,
    tokens: inputTokens + outputTokens,
    cost,
    model: model.name
  };
}

export function createCerebrasProvider(apiKey: string): LLMProvider {
  return {
    async translateBatch(
      items: TranslationItem[],
      sourceLocale: string,
      targetLocale: string
    ): Promise<string[]> {
      // Try models in order, fallback on rate limit
      for (let i = currentModelIndex; i < MODELS.length; i++) {
        const model = MODELS[i];

        try {
          console.log(`[Cerebras] Trying ${model.name}...`);
          const result = await translateWithModel(model, items, sourceLocale, targetLocale, apiKey);

          console.log(`[Cerebras] ✓ Success with ${result.model}`);
          console.log(`[Cerebras] Tokens: ${result.tokens}, Cost: $${result.cost.toFixed(4)}`);

          // Reset to primary model on success
          currentModelIndex = 0;

          return result.translations;

        } catch (error) {
          if (error instanceof Error && error.message === 'RATE_LIMITED') {
            console.log(`[Cerebras] Rate limited on ${model.name}, trying next model...`);
            currentModelIndex = i + 1;

            if (i === MODELS.length - 1) {
              throw new Error('All Cerebras models are rate limited. Please try again later.');
            }
            continue;
          }

          // Other errors - try next model
          console.error(`[Cerebras] Error with ${model.name}:`, error);
          if (i === MODELS.length - 1) {
            throw error;
          }
        }
      }

      throw new Error('All models failed');
    }
  };
}

// Export for API route usage
export async function translateWithFallback(
  items: TranslationItem[],
  sourceLocale: string,
  targetLocale: string,
  apiKey: string
): Promise<TranslationResult> {
  for (let i = currentModelIndex; i < MODELS.length; i++) {
    const model = MODELS[i];

    try {
      const result = await translateWithModel(model, items, sourceLocale, targetLocale, apiKey);
      currentModelIndex = 0; // Reset on success
      return result;
    } catch (error) {
      if (error instanceof Error && error.message === 'RATE_LIMITED') {
        currentModelIndex = i + 1;
        if (i < MODELS.length - 1) continue;
      }
      throw error;
    }
  }

  throw new Error('All models failed');
}
