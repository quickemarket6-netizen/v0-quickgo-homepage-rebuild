import { streamText, convertToModelMessages, UIMessage } from 'ai'
import { QUICKGO_SYSTEM_PROMPT } from '@/lib/ai/multi-assistant'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { messages, model = 'openai/gpt-4o' }: { messages: UIMessage[], model?: string } = await req.json()

    const result = streamText({
      model: model,
      system: QUICKGO_SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      temperature: 0.7,
      maxOutputTokens: 2048,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('[AI Chat Error]', error)
    return new Response(
      JSON.stringify({ error: 'Erreur du service IA' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
