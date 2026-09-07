import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { MODE_BLURB, MODES, buildQuestion, poolFor } from './questions'
import { DEFAULT_SETTINGS } from './questions'

// Built from escapes so this file does not trip its own check.
const DASHES = new RegExp('[\\u2014\\u2013]')

function sourceFiles(dir = 'src'): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...sourceFiles(path))
    else if (/\.(ts|tsx|css|html)$/.test(entry.name)) out.push(path)
  }
  return out
}

describe('interface copy', () => {
  // Em and en dashes are banned in this project, in prose and in the UI alike.
  it('uses no em or en dashes anywhere in the source', () => {
    const offenders: string[] = []
    for (const file of [...sourceFiles(), 'index.html']) {
      const lines = readFileSync(file, 'utf8').split('\n')
      lines.forEach((line, i) => {
        if (DASHES.test(line)) offenders.push(`${file}:${i + 1}: ${line.trim().slice(0, 80)}`)
      })
    }
    expect(offenders).toEqual([])
  })

  it('keeps every generated rule and blurb free of dashes', () => {
    const settings = { ...DEFAULT_SETTINGS, level: 'C1' as const }
    for (const mode of MODES) {
      expect(MODE_BLURB[mode]).not.toMatch(DASHES)
      for (const id of poolFor(mode, settings)) {
        const q = buildQuestion(id, settings)
        if (!q) continue
        for (const text of [q.lead, q.focus, q.sub ?? '', q.cloze ?? '', q.note ?? '', ...q.rules]) {
          expect(text, id).not.toMatch(DASHES)
        }
      }
    }
  })

  it('asks its questions in German', () => {
    const settings = { ...DEFAULT_SETTINGS, level: 'C1' as const }
    const leads = new Set<string>()
    for (const mode of MODES) {
      for (const id of poolFor(mode, settings)) {
        const lead = buildQuestion(id, settings)?.lead
        if (lead) leads.add(lead)
      }
    }
    // Every task label should contain a German cue rather than an English one.
    const english = [...leads].filter((lead) => /\b(which|what|the|fill|your)\b/i.test(lead))
    expect(english).toEqual([])
  })
})
