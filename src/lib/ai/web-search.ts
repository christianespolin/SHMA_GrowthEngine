// Web search using Anthropic's built-in web_search tool
// No additional API key needed — uses the existing ANTHROPIC_API_KEY
import { getAnthropicClient, getModel } from './client'

export async function enrichDiscoveryCriteria(criteria: Record<string, unknown>): Promise<string> {
  const segments = (criteria.segments as string[])?.join(', ') || 'B2B industrial'
  const countries = (criteria.countries as string[])?.join(', ') || 'Europe'
  const region = (criteria.region as string) || ''

  const locationStr = [region, countries].filter(Boolean).join(', ')

  try {
    const client = getAnthropicClient()
    const model = getModel()

    // Use Anthropic's native web search tool
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const message = await (client.messages.create as any)({
      model,
      max_tokens: 1500,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{
        role: 'user',
        content: `Search for real B2B companies in the ${segments} sector in ${locationStr} that sell capital-intensive equipment or asset-heavy solutions where customers face high upfront costs. Focus on mid-market companies ($10M–$500M revenue). List 10 specific companies with their name, website, and a one-sentence description of what they sell.`,
      }],
    })

    // Extract text from response (web search results are returned as text blocks)
    const textBlocks = (message.content || [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((block: any) => block.type === 'text')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((block: any) => block.text as string)
      .join('\n')

    if (!textBlocks.trim()) return ''

    return `\n\nWEB SEARCH RESULTS — real companies found online (strongly prefer suggesting these):\n${textBlocks}`
  } catch (err) {
    // Web search is optional — degrade gracefully if the tool isn't available
    console.warn('Web search enrichment failed (non-fatal):', err)
    return ''
  }
}
