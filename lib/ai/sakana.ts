// QuickGo - Sakana Fugu provider (OpenAI-compatible API)
// Docs: Sakana Fugu exposes an OpenAI-compatible endpoint. Configure your
// account-specific base URL and API key in the Sakana console, then set:
//   SAKANA_API_KEY  - your Sakana API key
//   SAKANA_BASE_URL - the base URL from the Sakana console (e.g. https://api.sakana.ai/v1)
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import type { LanguageModel } from 'ai'

const SAKANA_DEFAULT_BASE_URL = 'https://api.sakana.ai/v1'

// Model ids served by Sakana Fugu.
export const SAKANA_MODEL_IDS = ['fugu', 'fugu-ultra'] as const
export type SakanaModelId = (typeof SAKANA_MODEL_IDS)[number]

// We namespace Sakana models in the UI/registry as `sakana/<model>` so they
// don't collide with the AI Gateway model strings (e.g. `openai/gpt-4o`).
export const SAKANA_PREFIX = 'sakana/'

export function isSakanaModel(modelId: string): boolean {
  return modelId.startsWith(SAKANA_PREFIX)
}

export function isSakanaConfigured(): boolean {
  return Boolean(process.env.SAKANA_API_KEY)
}

let cachedProvider: ReturnType<typeof createOpenAICompatible> | null = null

function getSakanaProvider() {
  if (!cachedProvider) {
    cachedProvider = createOpenAICompatible({
      name: 'sakana',
      apiKey: process.env.SAKANA_API_KEY ?? '',
      baseURL: process.env.SAKANA_BASE_URL ?? SAKANA_DEFAULT_BASE_URL,
    })
  }
  return cachedProvider
}

/**
 * Resolves a model id from the UI into something `streamText` accepts.
 * - Sakana ids (`sakana/fugu`, `sakana/fugu-ultra`) -> Sakana LanguageModel
 * - Everything else -> the raw string, handled by the Vercel AI Gateway
 */
export function resolveModel(modelId: string): LanguageModel {
  if (isSakanaModel(modelId)) {
    const sakanaId = modelId.slice(SAKANA_PREFIX.length) as SakanaModelId
    return getSakanaProvider()(sakanaId)
  }
  return modelId
}
