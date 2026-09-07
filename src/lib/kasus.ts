import type { Kasus } from '@/engine/grammar'

/**
 * The primary colour system. Every case has one colour and the case name is
 * always written in it, so "Dativ" looks the same in a table, on a drill card
 * and in a preposition list. Gender keeps its own trio and only ever colours
 * letters of German words, so the two systems never have to be told apart by
 * hue alone.
 */
export const KASUS_VAR: Record<Kasus, string> = {
  nom: 'var(--kasus-nom)',
  akk: 'var(--kasus-akk)',
  dat: 'var(--kasus-dat)',
  gen: 'var(--kasus-gen)',
}

/** A wash of the case colour over the page ground, for surfaces. */
export function kasusTint(kasus: Kasus, percent: number): string {
  return `color-mix(in srgb, ${KASUS_VAR[kasus]} ${percent}%, var(--background))`
}

export function kasusEdge(kasus: Kasus): string {
  return KASUS_VAR[kasus]
}

/** Maps the preposition groups onto the cases they govern. */
export const GROUP_KASUS: Record<string, Kasus[]> = {
  akk: ['akk'],
  dat: ['dat'],
  gen: ['gen'],
  wechsel: ['akk', 'dat'],
}
