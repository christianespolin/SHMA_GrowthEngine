// Web search using Anthropic's built-in web_search tool
// No additional API key needed — uses the existing ANTHROPIC_API_KEY
// Hard timeouts so web search never blocks the main AI call
import { getAnthropicClient, getModel } from './client'

const WEB_SEARCH_TIMEOUT_MS = 20_000
const CONTACT_SEARCH_TIMEOUT_MS = 30_000

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

// ─── Contact name enrichment ──────────────────────────────────────────────────

async function _fetchContactContext(companyName: string, website?: string): Promise<string> {
  const client = getAnthropicClient()
  const model = getModel()

  const siteHint = website ? ` (website: ${website})` : ''

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const message = await (client.messages.create as any)({
    model,
    max_tokens: 2000,
    timeout: CONTACT_SEARCH_TIMEOUT_MS,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    messages: [{
      role: 'user',
      content: `Find real named executives and senior leaders at ${companyName}${siteHint}.

Please search for:
1. "${companyName} leadership team" OR "${companyName} executive team" OR "${companyName} management team"
2. "${companyName} CEO" OR "${companyName} president" OR "${companyName} chief executive"
3. Recent news articles or press releases quoting named ${companyName} executives (look for last 3 years)
4. ${website ? `The /about, /leadership, /team, or /management page at ${website}` : `${companyName} company website team or about page`}

For each real person you find, extract:
- Full name
- Title / role
- Source URL

IMPORTANT: Only include people you are highly confident actually work or recently worked at ${companyName}. Do NOT invent names. List up to 12 people with their exact titles and source URLs where possible.`,
    }],
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const textBlocks = (message.content || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((block: any) => block.type === 'text')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((block: any) => block.text as string)
    .join('\n')

  return textBlocks.trim()
    ? `\n\nWEB SEARCH — REAL NAMED EXECUTIVES FOUND FOR ${companyName.toUpperCase()}:\n${textBlocks}\n\nIMPORTANT: Where a web-found person matches a target role, populate full_name, title, linkedin_url or source_url, and set known_or_hypothesis to "Needs validation". Do NOT invent names — only use names explicitly found above.`
    : ''
}

export async function enrichContactsWithWebSearch(
  companyName: string,
  website?: string
): Promise<string> {
  try {
    const result = await Promise.race([
      _fetchContactContext(companyName, website),
      new Promise<string>((resolve) => setTimeout(() => resolve(''), CONTACT_SEARCH_TIMEOUT_MS + 2000)),
    ])
    return result
  } catch (err) {
    console.warn('Contact web search enrichment failed (non-fatal):', err)
    return ''
  }
}

// ─── Company discovery enrichment ─────────────────────────────────────────────

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
