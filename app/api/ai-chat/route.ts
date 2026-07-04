import { streamText, convertToModelMessages, UIMessage } from 'ai'
import { QUICKGO_SYSTEM_PROMPT } from '@/lib/ai/multi-assistant'
import { isFuguModel, fuguModel } from '@/lib/ai/fugu'
import { guardAIRequest } from '@/lib/ai/guard'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { messages, model = 'openai/gpt-4o' }: { messages: UIMessage[], model?: string } = await req.json()

    const guard = await guardAIRequest(model)
    if (!guard.ok) return guard.response

    // Sakana Fugu uses a dedicated OpenAI-compatible endpoint; every other
    // model id (openai/*, anthropic/*, google/*) is resolved by the AI Gateway.
    const resolvedModel = isFuguModel(model) ? fuguModel(model) : model

    const result = streamText({
      model: resolvedModel,
      system: QUICKGO_SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      temperature: 0.7,
      maxOutputTokens: 2048,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('[AI Chat Error]', error)
    const message = error instanceof Error ? error.message : 'Erreur du service IA'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
