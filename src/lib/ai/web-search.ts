// Web search using Anthropic's built-in web_search tool
// No additional API key needed — uses the existing ANTHROPIC_API_KEY
// Hard 20-second timeout so it never blocks the main discovery call
import { getAnthropicClient, getModel } from './client'

const WEB_SEARCH_TIMEOUT_MS = 20_000

async function _fetchWebContext(criteria: Record<string, unknown>): Promise<string> {
  const segments = (criteria.segments as string[])?.join(', ') || 'B2B industrial'
  const countries = (criteria.countries as string[])?.join(', ') || 'Europe'
  const region = (criteria.region as string) || ''
  const locationStr = [region, countries].filter(Boolean).join(', ')

  const client = getAnthropicClient()
  const model = getModel()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const message = await (client.messages.create as any)({
    model,
    max_tokens: 1000,
    timeout: WEB_SEARCH_TIMEOUT_MS,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    messages: [{
      role: 'user',
      content: `Search for real B2B companies in the ${segments} sector in ${locationStr} that sell capital-intensive equipment or asset-heavy solutions. Focus on mid-market ($10M–$500M revenue). List 8 specific companies with name, website, and one-sentence description.`,
    }],
  })

  const textBlocks = (message.content || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((block: any) => block.type === 'text')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((block: any) => block.text as string)
    .join('\n')

  return textBlocks.trim()
    ? `\n\nWEB SEARCH RESULTS — real companies found online (strongly prefer these):\n${textBlocks}`
    : ''
}

export async function enrichDiscoveryCriteria(criteria: Record<string, unknown>): Promise<string> {
  try {
    // Race against a hard wall-clock timeout — web search must never block the main AI call
    const result = await Promise.race([
      _fetchWebContext(criteria),
      new Promise<string>((resolve) => setTimeout(() => resolve(''), WEB_SEARCH_TIMEOUT_MS + 1000)),
    ])
    return result
  } catch (err) {
    console.warn('Web search enrichment failed (non-fatal):', err)
    return ''
  }
}
