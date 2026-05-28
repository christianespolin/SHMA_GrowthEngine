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
  maxTokens = 4096
): Promise<AIResponse> {
  const client = getAnthropicClient()
  const model = getModel()

  const message = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt || 'You are a senior business analyst at SH Management (SHMA), specializing in servitization and As-a-Service business model transformation for asset-heavy B2B companies.',
    messages: [{ role: 'user', content: prompt }],
  })

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
