import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PREP_GROUP_LABEL } from '@/data/prepositions'
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

  it('labels its sections in German', () => {
    for (const label of Object.values(PREP_GROUP_LABEL)) {
      expect(label, label).not.toMatch(/\b(always|or|and|the)\b/i)
    }
  })

  it('keeps three separated text tones rather than one flat grey', () => {
    // The flatness this guards: 103 uses of one muted grey against 27 of ink,
    // and a single font weight across the whole app.
    const css = readFileSync('src/index.css', 'utf8')
    for (const token of ['--foreground:', '--foreground-soft:', '--muted-foreground:']) {
      expect(css, token).toContain(token)
    }
    // Section labels carry ink and weight; they are the page's structure.
    expect(css).toMatch(/\.eyebrow\s*\{[^}]*font-semibold/)
    expect(css).toMatch(/\.eyebrow\s*\{[^}]*text-foreground\b/)
  })

  it('does not cap the reference tables by the practice level', () => {
    // The reference is for looking things up, including words above your level.
    // Capping it by the drill setting hid 25 verbs, 13 prepositions and 29
    // valency entries with nothing on screen to say why.
    const src = readFileSync('src/routes/Reference.tsx', 'utf8')
    expect(src).not.toContain('settings.level')
  })

  it('does not restart a round by linking to the route already open', () => {
    // "Neue Runde" was a Link to /ueben/:mode from inside /ueben/:mode. The
    // router had nothing to navigate to, the queue effect never re-ran, and the
    // button did nothing at all. Restarting is an action, not navigation.
    const src = readFileSync('src/routes/Session.tsx', 'utf8')
    expect(src).not.toMatch(/<Link to=\{`\/ueben\/\$\{mode\}`\}/)
  })

  it('waits for stored settings before dealing a round', () => {
    // Loading a drill URL directly runs the queue effect before the provider
    // has read localStorage, so the round used the default length and tenses.
    const src = readFileSync('src/routes/Session.tsx', 'utf8')
    expect(src).toMatch(/if \(!valid \|\| !ready\) return/)
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
