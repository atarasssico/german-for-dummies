# Design

Direction: **Duden table**. A grammar reference you drill inside, rather than a
flashcard app. Chosen over a Leitner-box card stack and a Bahnhof departure
board because the app's hardest job is the correction, and only a reference
layout has somewhere to put the rule next to the answer. It is also the only
one of the three that survives a six-row Konjunktiv II paradigm.

Ranked adjectives: **precise › calm › tactile**. The first wins ties.

Material drawn from German grammar's own artifacts rather than from other
language apps: Duden declension tables, dictionary headword typography
(`geben · gab · hat gegeben`), the physical Leitner card box, and the
DIN lettering tradition.

## Colour

Gender is the only colour system, using the convention German textbooks already
use so it transfers off the screen:

| Token | Light | Dark | Means |
| --- | --- | --- | --- |
| `--gender-m` | `#2f62c4` | `#7ba3f5` | der |
| `--gender-f` | `#c4327a` | `#ef7cb4` | die |
| `--gender-n` | `#2e7d5b` | `#56be91` | das |
| `--wrong` | `#8a6110` | `#d8a233` | a correction |

Those three hues never mean anything else. Correct and wrong are carried by
form first (a rule, a strike-through, a check) with amber as the only state
colour, so no hue has to carry two meanings. Colour is never the only signal:
gender is always named in words next to its swatch.

Ground and ink: `#fbfbf9` on `#191b1e` in light, `#131518` on `#e8eaec` in
dark. Two rule weights, `--rule` for row separators and `--rule-strong` for
section heads, are what the whole layout is built from.

## Type

Two faces, both self-hosted so typography survives offline.

- **Archivo** (variable) for the interface. DIN lineage: precise, unfussy,
  German-adjacent without being a pastiche.
- **Newsreader** (variable, with italic) for every word of German, and for
  display numbers. German words are dictionary headwords, so they are set as
  headwords. The italic carries English glosses.

Applied through one class, `.de`, so any German string is set correctly by
default. Display sizes use `clamp()` with a 10vw middle term, so the focus word
is genuinely large on a phone.

## Layout

Ruled ledger rows, not cards. Border, fill and shadow are spent only where
something is genuinely a separate object; grouping is done with rules and
whitespace. Radius is sharp throughout (`--radius: 2px`).

Left-anchored, single column, `max-w-3xl`. Mobile-first with a three-item
bottom tab bar; the drill and the paradigm writer take the whole screen with no
chrome, because chrome would only compete with the question.

## Signature element

A 3px rail, coloured by grammatical gender, down the left of anything nominal:
the drill prompt, the noun lookup, list rows. It is functional rather than
decorative. After a week you read gender before you read the word. The same
three bars are the wordmark and the app icon.

The seven-compartment progress strip on the home screen is borrowed from the
Leitner direction that was not chosen, doing a job the Duden direction had not
solved.

## Motion

Almost none, deliberately. Colour and border transitions on hover and focus,
and a 0.5px arrow nudge on row hover. No entrance animations: the drill is used
hundreds of times, and ceremony scales inversely with frequency. Everything
respects `prefers-reduced-motion`.

## Copy

German for the app's own chrome and for every task label (`Welcher Artikel?`,
`Weiter`, `Noch einmal`). English for explanations, because the grammar has to
be unambiguous. Grammatical terms stay German throughout (`Akkusativ`, not
`accusative`), since those are the words the textbooks and exams use.

No em or en dashes anywhere, enforced by a test in `src/engine/copy.test.ts`.
