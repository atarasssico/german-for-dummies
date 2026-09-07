# Product

## What this is

A single-user PWA for drilling German grammar. One person uses it: the author,
learning German while working in an English-speaking job.

## The user

A designer who works on design systems, so dense, precise interfaces read as
respect rather than clutter. Learns well from colour. Two usage scenes:

1. **Phone, a few minutes at a time.** Couch or commute. Tapping, one hand.
2. **Desktop, longer.** Writing out full conjugation paradigms on a keyboard.

Emotional state on arrival: mild frustration at `der/die/das` and the strong
verbs. Wants reps and corrections, not lessons. A gamified, cartoon treatment
would read as condescending.

## Jobs

1. Learn noun gender, and the case endings that follow from it.
2. Conjugate verbs, especially strong and irregular ones, across tenses.
3. Know which case a verb governs, and how its meaning shifts with the frame
   (`bestehen auf` / `aus` / `in`; `halten von` / `für` / `sich an`).
4. Know each preposition's case, including the nine that take both.

## Constraints

- No account and no database. Stated as a requirement, not an inference.
- Must work offline.
- Hosted on Vercel as a static build.
- German grammar has to be correct. A wrong form teaches the wrong thing, which
  is worse than showing nothing, so the grammar is rule-generated and tested
  rather than hand-typed.

## Not doing

- Vocabulary translation drills. Other apps do this well and it is not the gap.
- Audio and pronunciation. No assets, and not the stated problem.
- Sync across devices. Would need the backend the user explicitly ruled out.
- Streak pressure beyond a day counter. This is a tool, not a habit product.
