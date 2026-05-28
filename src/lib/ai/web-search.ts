// Perplexity web search - gracefully disabled if no API key
export async function searchCompanyInfo(query: string): Promise<string | null> {
  const key = process.env.PERPLEXITY_API_KEY
  if (!key) return null

  try {
    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [{ role: 'user', content: query }],
        max_tokens: 1000,
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.choices?.[0]?.message?.content || null
  } catch {
    return null
  }
}

export async function enrichDiscoveryCriteria(criteria: Record<string, unknown>): Promise<string> {
  const key = process.env.PERPLEXITY_API_KEY
  if (!key) return ''

  const segments = (criteria.segments as string[])?.join(', ') || 'B2B industrial'
  const countries = (criteria.countries as string[])?.join(', ') || 'Europe'

  const query = `List 10 specific B2B companies in ${segments} in ${countries} that sell capital-intensive equipment or asset-heavy solutions with high recurring service potential. Focus on mid-market companies ($10M-$500M revenue). Include company names, websites, and brief descriptions.`

  const result = await searchCompanyInfo(query)
  if (!result) return ''

  return `\n\nWEB SEARCH RESULTS (use as additional reference, prioritize these real companies):\n${result}`
}
