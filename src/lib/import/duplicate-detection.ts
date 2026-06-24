// Duplicate detection utilities for Long List import
// Uses weighted matching: exact domain/reg-number = exact duplicate, name similarity = possible

export interface CompanyLike {
  name: string
  website?: string | null
  registration_number?: string | null
  country?: string | null
}

export interface DuplicateMatchResult {
  confidence: 'exact' | 'strong' | 'possible' | 'none'
  score: number
  reasons: string[]
}

const LEGAL_SUFFIXES = [
  'as', 'ab', 'gmbh', 'ltd', 'limited', 'inc', 'bv', 'sa', 'oy', 'sas', 'ag',
  'asa', 'llc', 'plc', 'nv', 'se', 'kft', 'srl', 'spa', 'aps', 'a/s', 'b.v.',
  's.a.', 'gmbh & co. kg', 'gmbh & co kg',
]

export function normalizeCompanyName(name: string): string {
  let n = name.toLowerCase().trim()
  // Remove legal suffixes at end
  for (const suffix of LEGAL_SUFFIXES) {
    const pattern = new RegExp(`[,\\s]+${suffix.replace(/\./g, '\\.')}\\s*$`, 'i')
    n = n.replace(pattern, '')
  }
  // Remove punctuation, normalize whitespace
  n = n.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
  return n
}

export function extractDomain(url: string): string {
  try {
    let u = url.trim()
    if (!u.startsWith('http')) u = 'https://' + u
    const hostname = new URL(u).hostname.toLowerCase()
    // Remove www.
    return hostname.replace(/^www\./, '')
  } catch {
    return url.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]
  }
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)])
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
    }
  }
  return dp[m][n]
}

function nameSimilarity(a: string, b: string): number {
  const na = normalizeCompanyName(a)
  const nb = normalizeCompanyName(b)
  if (na === nb) return 1
  const maxLen = Math.max(na.length, nb.length)
  if (maxLen === 0) return 1
  const dist = levenshtein(na, nb)
  return 1 - dist / maxLen
}

export function calculateCompanySimilarity(
  incoming: CompanyLike,
  existing: CompanyLike
): DuplicateMatchResult {
  const reasons: string[] = []
  let score = 0

  // Exact registration number match — definitive
  if (
    incoming.registration_number && existing.registration_number &&
    incoming.registration_number.trim().toLowerCase() === existing.registration_number.trim().toLowerCase()
  ) {
    return { confidence: 'exact', score: 1, reasons: ['Same company registration number'] }
  }

  // Exact domain match — very strong
  if (incoming.website && existing.website) {
    const domainA = extractDomain(incoming.website)
    const domainB = extractDomain(existing.website)
    if (domainA && domainB && domainA === domainB) {
      return { confidence: 'exact', score: 1, reasons: ['Same website domain'] }
    }
  }

  // Name similarity
  const sim = nameSimilarity(incoming.name, existing.name)
  if (sim === 1) {
    score += 0.7
    reasons.push('Exact company name match')
  } else if (sim >= 0.9) {
    score += 0.5
    reasons.push(`Very similar company name (${Math.round(sim * 100)}% match)`)
  } else if (sim >= 0.75) {
    score += 0.3
    reasons.push(`Similar company name (${Math.round(sim * 100)}% match)`)
  }

  // Same country boosts confidence
  if (incoming.country && existing.country &&
      incoming.country.toLowerCase() === existing.country.toLowerCase()) {
    score += 0.15
    reasons.push('Same country')
  }

  // Partial domain match (e.g. subdomain or TLD difference)
  if (incoming.website && existing.website) {
    const domainA = extractDomain(incoming.website)
    const domainB = extractDomain(existing.website)
    if (domainA && domainB) {
      const rootA = domainA.split('.').slice(-2).join('.')
      const rootB = domainB.split('.').slice(-2).join('.')
      if (rootA === rootB && rootA.length > 3) {
        score += 0.2
        reasons.push('Similar website domain')
      }
    }
  }

  if (score >= 0.85) return { confidence: 'strong', score, reasons }
  if (score >= 0.4) return { confidence: 'possible', score, reasons }
  return { confidence: 'none', score, reasons }
}
