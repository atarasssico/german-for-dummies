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

Two systems, kept apart by hue and by role, so no colour has to be read twice.

**Case is the primary system.** It appears on nearly every screen, so the case
name is always written in its own colour and any surface belonging to a case is
washed with it. Hues sit on axes the gender trio leaves free, and are checked
against each other as well: Genitiv started as plum and had to move to olive
because plum and the feminine pink read as one colour, and Dativ moved from
violet to purple for the same reason against the masculine blue. Seven
categorical hues is near the limit of what stays legible, so every one is
checked against the other six by CIE76 distance rather than by eye:

| Pair | dE | |
| --- | --- | --- |
| Nominativ teal vs das green | 30.9 | the tightest pair, acceptable |
| Genitiv olive vs das green | 32.2 | |
| Dativ purple vs der blue | 33.0 | was 21.5 as violet |
| Genitiv olive vs die pink | 60+ | was 27.4 as plum |

Anything under about 25 reads as the same colour and has to move.

The one knowing exception is the correction amber, which sits 22.6 from the
Akkusativ orange. It is a state rather than a category, only ever appears as a
border, a strike-through or an icon next to the word FALSCH, and never as a
pill, so it cannot be mistaken for a case label. Every replacement searched for
scored worse against the orange or came back near-black.

Each category carries **three** values, because one value cannot do both jobs
on a light ground:

- **base** the vivid hue, for fills, bars and washes
- **-on** the text that sits on top of that fill
- **-ink** a darker cut, for coloured text on the page ground

The first attempt used one value per category and required it to be legible as
small text on a 20% wash of itself. That constraint forces low lightness, and
the light theme came out at mean L38 with the Nominativ teal down at chroma 22,
which is almost grey. It looked dead next to the dark theme's L70. Splitting the
roles lifts the light fills to mean L58 and chroma 58, brighter and more
saturated than the dark theme, while the -ink cut keeps small coloured text
above 4.5:1.

| Case | Fill (light) | Ink (light) | Dark |
| --- | --- | --- | --- |
| Nominativ | `#1f9cb0` | `#0d5b66` | `#4fb3c4` |
| Akkusativ | `#e07b23` | `#94430f` | `#e08a52` |
| Dativ | `#9b4fc0` | `#6f2d91` | `#cb9ae8` |
| Genitiv | `#9aad2e` | `#4f5c15` | `#b9c95e` |

| Gender | Fill (light) | Ink (light) | Dark |
| --- | --- | --- | --- |
| der | `#2f62c4` | `#2f62c4` | `#7ba3f5` |
| die | `#e0479a` | `#c4327a` | `#ef7cb4` |
| das | `#2f9e70` | `#2e7d5b` | `#56be91` |

The correction amber is `#8a6110` in light and `#d8a233` in dark.

In dark mode base and -ink coincide: a light hue reads on a dark ground whether
it is a fill or a letter.

Tints are derived from the one base hue with `color-mix` rather than stored as
extra tokens, so there is a single value to change per category.

Two rules learned by measuring rather than by eye:

1. **A hue on a wash of itself cannot reach 4.5:1.** Both palettes are dark
   enough that coloured text on even a 5% tint of the same hue fails AA. So
   where a surface needs to be strongly coloured, it goes solid and the text
   becomes the page ground: the declension table's case column and gender row,
   and the gender chip, all work this way.
2. **Muted grey must not sit on a tinted surface.** It passes on the page
   ground at 5.3:1 and fails at about 3.8:1 on a 20% wash, so anything on a
   tinted card uses the soft tone or ink instead.

Both are verified by a script that walks every visible text node on nine pages
in both themes and computes the real ratio, resolving `color-mix` and `oklab`
through a canvas rather than parsing the string. Current state: zero AA
failures across 1,314 nodes.

Colour is never the only signal: the case is always named, the gender chip
spells out `der maskulin`, and a correction carries a strike-through and an
icon as well as amber.

Ground and ink: `#fbfbf9` on `#14171a` in light, `#131518` on `#eceef1` in
dark, with a third `--foreground-soft` tone for prose that has to be read.
Two rule weights, `--rule` for row separators and `--rule-strong` for section
heads, are what the layout is built from.

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

A 5px rail, coloured by grammatical gender, down the left of anything nominal:
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
