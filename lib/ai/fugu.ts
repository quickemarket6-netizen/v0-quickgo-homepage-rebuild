// Sakana Fugu provider — OpenAI-compatible multi-agent model.
// Docs: https://api.sakana.ai/v1  (Authorization: Bearer <SAKANA_API_KEY>)
//
// Fugu is exposed as a single model id but orchestrates multiple agents
// internally. Two variants:
//   - "fugu"       → balanced latency/quality (good default)
//   - "fugu-ultra" → best quality on complex, multi-step reasoning
//
// The API key MUST come from the SAKANA_API_KEY environment variable.
// Never hard-code it in source.

import { createOpenAICompatible } from "@ai-sdk/openai-compatible"

export const SAKANA_BASE_URL =
  process.env.SAKANA_BASE_URL?.replace(/\/$/, "") ?? "https://api.sakana.ai/v1"

// Model ids selectable in the UI are namespaced "sakana/..." to match the
// gateway "provider/model" convention used elsewhere. These map to the bare
// ids the Sakana API expects.
export const FUGU_MODEL_MAP: Record<string, string> = {
  "sakana/fugu": "fugu",
  "sakana/fugu-ultra": "fugu-ultra",
}

export function isFuguModel(modelId: string): boolean {
  return modelId.startsWith("sakana/") || modelId === "fugu" || modelId === "fugu-ultra"
}

/** Resolve a UI model id (e.g. "sakana/fugu-ultra") to the Sakana API id. */
export function toFuguApiId(modelId: string): string {
  return FUGU_MODEL_MAP[modelId] ?? modelId.replace(/^sakana\//, "")
}

let _provider: ReturnType<typeof createOpenAICompatible> | null = null

function getProvider() {
  const apiKey = process.env.SAKANA_API_KEY
  if (!apiKey) {
    throw new Error(
      "SAKANA_API_KEY manquante. Ajoutez-la dans les variables d'environnement pour utiliser Sakana Fugu.",
    )
  }
  if (!_provider) {
    _provider = createOpenAICompatible({
      name: "sakana",
      baseURL: SAKANA_BASE_URL,
      apiKey,
    })
  }
  return _provider
}

/** Returns a LanguageModel for the given Fugu model id, ready for streamText(). */
export function fuguModel(modelId: string) {
  return getProvider()(toFuguApiId(modelId))
}
