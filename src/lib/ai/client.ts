import Anthropic from '@anthropic-ai/sdk'

let _client: Anthropic | null = null

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }
  return _client
}

export function getModel(): string {
  return process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'
}

export interface AIResponse {
  content: string
  model: string
  usage?: {
    input_tokens: number
    output_tokens: number
  }
}

export async function callClaude(
  prompt: string,
  systemPrompt?: string,
  maxTokens = 4096,
  timeoutMs?: number
): Promise<AIResponse> {
  const client = getAnthropicClient()
  const model = getModel()

  const requestOptions = timeoutMs ? { timeout: timeoutMs } : {}

  const message = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt || 'You are a senior business analyst at SH Management (SHMA), specializing in servitization and As-a-Service business model transformation for asset-heavy B2B companies.',
    messages: [{ role: 'user', content: prompt }],
  }, requestOptions)

  const content = message.content
    .filter(block => block.type === 'text')
    .map(block => (block as { type: 'text'; text: string }).text)
    .join('')

  return {
    content,
    model: message.model,
    usage: {
      input_tokens: message.usage.input_tokens,
      output_tokens: message.usage.output_tokens,
    },
  }
}

/**
 * Like callClaude but with the web_search_20250305 tool enabled.
 * Handles the multi-turn loop: Claude may call web_search one or more times
 * (returning stop_reason "tool_use") before it produces the final text.
 * The server executes each search and embeds results in the assistant message;
 * we just echo back empty tool_results to advance the turn.
 */
export async function callClaudeWithWebSearch(
  prompt: string,
  systemPrompt?: string,
  maxTokens = 8192,
  timeoutMs = 120_000
): Promise<AIResponse> {
  const client = getAnthropicClient()
  const model = getModel()
  const sys = systemPrompt || 'You are a senior business analyst at SH Management (SHMA), specializing in servitization and As-a-Service business model transformation for asset-heavy B2B companies.'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages: any[] = [{ role: 'user', content: prompt }]
  let totalInput = 0
  let totalOutput = 0
  let finalModel = model
  const deadline = Date.now() + timeoutMs

  for (let turn = 0; turn < 12; turn++) {
    if (Date.now() >= deadline) break

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (client.messages.create as any)(
      {
        model,
        max_tokens: maxTokens,
        system: sys,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages,
      },
      { timeout: Math.max(5_000, deadline - Date.now()) }
    )

    totalInput += response.usage?.input_tokens || 0
    totalOutput += response.usage?.output_tokens || 0
    finalModel = response.model || finalModel

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const content: any[] = response.content || []

    if (response.stop_reason === 'end_turn') {
      const text = content
        .filter((b: { type: string }) => b.type === 'text')
        .map((b: { type: string; text: string }) => b.text)
        .join('')
      return { content: text, model: finalModel, usage: { input_tokens: totalInput, output_tokens: totalOutput } }
    }

    if (response.stop_reason === 'tool_use') {
      // Add assistant turn (contains tool_use + web_search_result blocks with actual results)
      messages.push({ role: 'assistant', content })

      // Find all tool_use ids so we can acknowledge them
      const toolUseBlocks = content.filter((b: { type: string }) => b.type === 'tool_use')
      if (toolUseBlocks.length === 0) break

      // For server-side tools (web_search), results are already embedded in the assistant
      // message above. We just acknowledge each tool_use with an empty tool_result.
      messages.push({
        role: 'user',
        content: toolUseBlocks.map((b: { id: string }) => ({
          type: 'tool_result',
          tool_use_id: b.id,
          content: '',
        })),
      })
      continue
    }

    // max_tokens or unexpected stop — extract any text that exists
    const text = content
      .filter((b: { type: string }) => b.type === 'text')
      .map((b: { type: string; text: string }) => b.text)
      .join('')
    if (text) return { content: text, model: finalModel, usage: { input_tokens: totalInput, output_tokens: totalOutput } }
    break
  }

  return { content: '', model: finalModel, usage: { input_tokens: totalInput, output_tokens: totalOutput } }
}

export async function callClaudeJSON<T>(
  prompt: string,
  systemPrompt?: string
): Promise<T> {
  const response = await callClaude(prompt, systemPrompt)
  const jsonMatch = response.content.match(/```json\n?([\s\S]*?)\n?```/) ||
    response.content.match(/(\{[\s\S]*\})/)

  if (!jsonMatch) {
    throw new Error('No valid JSON found in AI response')
  }

  return JSON.parse(jsonMatch[1] || jsonMatch[0])
}
