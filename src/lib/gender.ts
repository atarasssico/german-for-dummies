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

export const GENDER_VAR: Record<Gender, string> = {
  m: 'var(--gender-m)',
  f: 'var(--gender-f)',
  n: 'var(--gender-n)',
}

export const GENDER_TEXT: Record<Gender, string> = {
  m: 'text-gender-m',
  f: 'text-gender-f',
  n: 'text-gender-n',
}

export const GENDERS: Gender[] = ['m', 'f', 'n']

/** Inline style for the `.rail` signature element. */
export function railStyle(gender?: Gender): React.CSSProperties {
  return { '--rail-color': gender ? GENDER_VAR[gender] : 'var(--rule-strong)' } as React.CSSProperties
}
