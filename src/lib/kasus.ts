import type { Kasus } from '@/engine/grammar'

/**
 * The primary colour system. Every case has one colour and the case name is
 * always written in it, so "Dativ" looks the same in a table, on a drill card
 * and in a preposition list. Gender keeps its own trio and only ever colours
 * letters of German words, so the two systems never have to be told apart by
 * hue alone.
 */
/** The vivid hue. Fills, bars and washes. */
export const KASUS_FILL: Record<Kasus, string> = {
  nom: 'var(--kasus-nom)',
  akk: 'var(--kasus-akk)',
  dat: 'var(--kasus-dat)',
  gen: 'var(--kasus-gen)',
}

/** Text that sits on top of a fill of the same case. */
export const KASUS_ON: Record<Kasus, string> = {
  nom: 'var(--kasus-nom-on)',
  akk: 'var(--kasus-akk-on)',
  dat: 'var(--kasus-dat-on)',
  gen: 'var(--kasus-gen-on)',
}

/** A darker cut, for coloured text on the page ground. */
export const KASUS_VAR: Record<Kasus, string> = {
  nom: 'var(--kasus-nom-ink)',
  akk: 'var(--kasus-akk-ink)',
  dat: 'var(--kasus-dat-ink)',
  gen: 'var(--kasus-gen-ink)',
}

/** A wash of the case colour over the page ground, for surfaces. */
export function kasusTint(kasus: Kasus, percent: number): string {
  return `color-mix(in srgb, ${KASUS_FILL[kasus]} ${percent}%, var(--background))`
}

export function kasusEdge(kasus: Kasus): string {
  return KASUS_FILL[kasus]
}

/** Maps the preposition groups onto the cases they govern. */
export const GROUP_KASUS: Record<string, Kasus[]> = {
  akk: ['akk'],
  dat: ['dat'],
  gen: ['gen'],
  wechsel: ['akk', 'dat'],
}
