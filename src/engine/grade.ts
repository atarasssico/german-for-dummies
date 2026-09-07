// Answer checking. The point of the app is the correction, so this module is
// deliberately generous about how an answer is typed and strict about what the
// answer actually is.

export type Verdict = 'correct' | 'wrong'

/** Why an answer counted as correct even though it was not typed exactly. */
export type Leniency = 'exact' | 'capitalisation' | 'umlaut' | 'variant'

export type DiffOp = 'same' | 'extra' | 'missing'

export interface DiffPart {
  op: DiffOp
  text: string
}

export interface GradeResult {
  verdict: Verdict
  /** The canonical answer, for display. */
  expected: string
  /** The accepted spelling the input actually matched. */
  matched?: string
  leniency: Leniency
  /** Alignment of the input against the expected answer, for highlighting. */
  diff: DiffPart[]
  /** Set when the answer is a single character away from correct. */
  nearMiss: boolean
  /** A short nudge about how the answer was typed, when it was not exact. */
  hint?: string
}

const UMLAUT_FOLD: Record<string, string> = {
  ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss',
  Ä: 'Ae', Ö: 'Oe', Ü: 'Ue',
}

export function collapse(s: string): string {
  return s.trim().replace(/\s+/g, ' ').replace(/[!?.]+$/, '')
}

/**
 * Folds umlauts and ß down to their ASCII spellings on BOTH sides of a
 * comparison, so a phone keyboard is not a handicap. Folding rather than
 * expanding keeps a -> ä a real mistake while making ae -> ä acceptable.
 */
export function foldUmlauts(s: string): string {
  return s.replace(/[äöüßÄÖÜ]/g, (c) => UMLAUT_FOLD[c] ?? c)
}

function levenshtein(a: string, b: string, cap = 2): number {
  if (Math.abs(a.length - b.length) > cap) return cap + 1
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const curr = [i]
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(
        (prev[j] ?? 0) + 1,
        (curr[j - 1] ?? 0) + 1,
        (prev[j - 1] ?? 0) + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
    }
    prev = curr
  }
  return prev[b.length] ?? cap + 1
}

/** Character alignment of the answer against the expected string. */
export function diffChars(actual: string, expected: string): DiffPart[] {
  const n = actual.length
  const m = expected.length
  // lcs[i][j] = length of the longest common subsequence of the suffixes
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      const row = lcs[i]
      const next = lcs[i + 1]
      if (!row || !next) continue
      row[j] = actual[i] === expected[j]
        ? (next[j + 1] ?? 0) + 1
        : Math.max(next[j] ?? 0, row[j + 1] ?? 0)
    }
  }
  const parts: DiffPart[] = []
  const push = (op: DiffOp, ch: string) => {
    const last = parts[parts.length - 1]
    if (last && last.op === op) last.text += ch
    else parts.push({ op, text: ch })
  }
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (actual[i] === expected[j]) {
      push('same', actual[i] as string)
      i++
      j++
    } else if ((lcs[i + 1]?.[j] ?? 0) >= (lcs[i]?.[j + 1] ?? 0)) {
      push('extra', actual[i] as string)
      i++
    } else {
      push('missing', expected[j] as string)
      j++
    }
  }
  while (i < n) push('extra', actual[i++] as string)
  while (j < m) push('missing', expected[j++] as string)
  return parts
}

export interface GradeOptions {
  /** Accept ae/oe/ue/ss for ä/ö/ü/ß. On by default; it is a keyboard problem, not a grammar one. */
  tolerateAsciiUmlauts?: boolean
  /** Accept a lowercase noun. Off by default, because capitalisation is grammar in German. */
  tolerateCase?: boolean
}

export function grade(
  input: string,
  expected: string,
  alts: string[] = [],
  opts: GradeOptions = {},
): GradeResult {
  const { tolerateAsciiUmlauts = true, tolerateCase = false } = opts
  const answer = collapse(input)
  const candidates = [expected, ...alts].map(collapse)

  const base: Omit<GradeResult, 'verdict' | 'leniency' | 'diff' | 'nearMiss'> = { expected }

  for (const [index, candidate] of candidates.entries()) {
    if (answer === candidate) {
      return {
        ...base,
        verdict: 'correct',
        matched: candidate,
        leniency: index === 0 ? 'exact' : 'variant',
        diff: [{ op: 'same', text: answer }],
        nearMiss: false,
        hint: index === 0 ? undefined : `Also correct. The form we were after is “${expected}”.`,
      }
    }
  }

  for (const candidate of candidates) {
    if (answer.toLowerCase() === candidate.toLowerCase()) {
      const ok = tolerateCase
      return {
        ...base,
        verdict: ok ? 'correct' : 'wrong',
        matched: ok ? candidate : undefined,
        leniency: 'capitalisation',
        diff: diffChars(answer, candidate),
        nearMiss: true,
        hint: 'Right letters, wrong capitalisation. German nouns always start with a capital.',
      }
    }
  }

  if (tolerateAsciiUmlauts) {
    const folded = foldUmlauts(answer).toLowerCase()
    for (const candidate of candidates) {
      if (folded === foldUmlauts(candidate).toLowerCase()) {
        const capsOk = foldUmlauts(answer) === foldUmlauts(candidate)
        return {
          ...base,
          verdict: capsOk || tolerateCase ? 'correct' : 'wrong',
          matched: candidate,
          leniency: 'umlaut',
          diff: diffChars(answer, candidate),
          nearMiss: true,
          hint: capsOk
            ? `Accepted. Written out properly it is “${candidate}”.`
            : 'Right letters, wrong capitalisation.',
        }
      }
    }
  }

  const distance = Math.min(...candidates.map((c) => levenshtein(answer.toLowerCase(), c.toLowerCase())))
  return {
    ...base,
    verdict: 'wrong',
    leniency: 'exact',
    diff: diffChars(answer, candidates[0] ?? expected),
    nearMiss: distance <= 1 && answer.length > 0,
    hint: answer.length === 0 ? undefined : distance <= 1 ? 'One character off.' : undefined,
  }
}
