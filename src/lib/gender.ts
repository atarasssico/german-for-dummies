import type { Gender } from '@/engine/grammar'

/**
 * The app's only colour system. der = blue, die = pink, das = green, the
 * convention German textbooks already use, so it transfers off the screen.
 * These three hues never mean anything else in the interface.
 */
export const GENDER_ARTICLE: Record<Gender, string> = { m: 'der', f: 'die', n: 'das' }

export const GENDER_NAME: Record<Gender, string> = {
  m: 'maskulin',
  f: 'feminin',
  n: 'neutrum',
}

/** The vivid hue. Fills, rails and washes. */
export const GENDER_FILL: Record<Gender, string> = {
  m: 'var(--gender-m)',
  f: 'var(--gender-f)',
  n: 'var(--gender-n)',
}

/** Text that sits on top of a fill of the same gender. */
export const GENDER_ON: Record<Gender, string> = {
  m: 'var(--gender-m-on)',
  f: 'var(--gender-f-on)',
  n: 'var(--gender-n-on)',
}

/** A darker cut, for coloured letters on the page ground. */
export const GENDER_VAR: Record<Gender, string> = {
  m: 'var(--gender-m-ink)',
  f: 'var(--gender-f-ink)',
  n: 'var(--gender-n-ink)',
}

export const GENDER_TEXT: Record<Gender, string> = {
  m: 'text-gender-m',
  f: 'text-gender-f',
  n: 'text-gender-n',
}

export const GENDERS: Gender[] = ['m', 'f', 'n']

/**
 * A wash of the gender hue over the page ground. Derived from the one hue with
 * color-mix rather than stored as extra tokens, so there is still exactly one
 * value per gender to change.
 */
export function genderTint(gender: Gender | undefined, percent: number): string {
  const hue = gender ? GENDER_FILL[gender] : 'var(--rule-strong)'
  return `color-mix(in srgb, ${hue} ${percent}%, var(--background))`
}

/** The hue at full strength, for borders and marks. */
export function genderEdge(gender: Gender | undefined): string {
  return gender ? GENDER_FILL[gender] : 'var(--rule-strong)'
}

/** Inline style for the `.rail` signature element. */
export function railStyle(gender?: Gender): React.CSSProperties {
  return { '--rail-color': gender ? GENDER_VAR[gender] : 'var(--rule-strong)' } as React.CSSProperties
}
