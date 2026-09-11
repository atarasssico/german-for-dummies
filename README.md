# Deutsch

A PWA for drilling the parts of German grammar that only stick through
repetition: noun gender, the four cases, verb conjugation, verb valency and
prepositions. No account, no server, no database. Progress lives in
`localStorage` and the app works offline.

Modelled on the SmarterGerman trio (Article Trainer, Verb Wizard, Dative
Doctor), merged into one app with a shared scheduler.

## The four trainers

| Trainer | What it drills |
| --- | --- |
| **Artikel & Kasus** | Gender of 285 nouns, then the full noun phrase in any case, with any determiner, optionally with an adjective |
| **Verben** | Any of 228 verbs in ten tenses, typed form by form |
| **Verbkasus** | Which case a verb governs, its fixed prepositions, and the 24 verbs whose meaning changes with the frame |
| **Präpositionen** | Each preposition's case, and the nine two-way ones drilled both ways (wo? and wohin?) |

Plus **Konjugation schreiben**: write out a whole paradigm, six cells at a time,
and get corrected cell by cell. Each cell is the same scheduled card as the
single-form drill, so a writeout feeds the same box.

## Grammar is generated, not typed out

This is the core design decision. Storing 228 verbs × 10 tenses × 6 persons as
data would be 13,680 hand-typed forms and a permanent source of errors.
Instead each verb stores only its principal parts:

```ts
{ id: 'geben', infinitive: 'geben', aux: 'haben', class: 'strong',
  present: { du: 'gibst', er: 'gibt' },
  praet: 'gab', partizip2: 'gegeben', imperativSg: 'gib' }
```

Everything else falls out of rules in `src/engine/conjugate.ts`: the linking
`-e-` (`du arbeitest` but `du lernst`, and `du rechnest` but `du wohnst`),
sibilant merging (`du heißt`), separable prefixes (`rufe an` / `angerufen`),
Konjunktiv II by umlauting the Präteritum stem (`gab` → `gäbe`), and so on.
Only the forms the rules get wrong are declared, so `werfen` carries
`konj2: 'würfe'` because the rule would produce `wärfe`.

The same holds for nouns. A noun stores gender, plural and any irregularity;
`src/engine/grammar.ts` derives all sixteen determiner/case/number
combinations, the adjective ending under all three patterns, the dative plural
`-n`, the genitive `-s`/`-es`, and the n-declension.

A wrong form is therefore a bug in one rule in one place, not a typo in one of
thousands of rows. 113 tests pin the rules against known-correct paradigms,
including an exhaustive pass that every verb in every tense in every person
produces a form, and that no strong verb's Konjunktiv II collides with its
Präteritum.

## Scheduling

Leitner boxes, seven compartments, intervals `0 1 2 4 8 16 32` days. Right
answer moves a card one compartment right; a wrong answer sends it back to the
first, so it returns in the same session. `src/engine/srs.ts`.

Cards are keyed by skill, not by rendering: `decl:kind:dat` is "Kind in the
dative", and the determiner and number are re-rolled each time it comes up.

## Corrections

The correction is the product, so `src/engine/grade.ts` is deliberately fussy:

- `ae oe ue ss` are accepted for `ä ö ü ß`, and the answer then shows the real
  spelling. A phone keyboard should not cost you marks.
- A missing umlaut is still wrong. `gabe` is not `gäbe`, because that is a
  grammar mistake rather than a keyboard one.
- A lowercase noun is wrong by default, with the reason given. Capitalisation
  is grammar in German. Switchable in Settings.
- Wrong answers get a character-level diff: what you typed struck through,
  what was missing underlined.
- Every correction shows the rule that produces the right form.

## Colour

Gender is the only colour system: **der** blue, **die** pink, **das** green,
the convention German textbooks already use, so it transfers off the screen.
Those three hues never mean anything else. Right and wrong are carried by form
(a rule, a strike-through) plus amber, so no colour has to mean two things.

## Where progress is kept

`localStorage`, under one key, in whichever browser you used. There is no
server, so nothing is transmitted and two people using the app never see each
other's progress.

Three things keep that from being fragile:

- **Migration, never reset.** An unrecognised schema version is salvaged field
  by field rather than discarded, so a future change to the data shape cannot
  cost you a year of reviews.
- **A last-known-good copy.** Every write first copies the previous value to a
  backup key. Text that fails to parse is quarantined under a third key instead
  of being overwritten, and the backup is loaded instead.
- **Persistent storage.** The app calls `navigator.storage.persist()`, which
  exempts the data from eviction when the disk runs low. Settings reports the
  real state rather than assuming a browser: granted, not granted yet, or
  unsupported. Safari implements no such API and additionally clears storage
  for sites unopened for 7 days, so it is told to install to the home screen,
  which gets its own counter of days used.

What still deletes it: clearing site data, deleting an installed copy, or a
different browser or device. So Settings has **Exportieren**, which downloads
your progress as a dated JSON file, and two imports:

- **Zusammenführen** keeps whichever copy of each card was reviewed more
  recently, so a phone and a desktop merge to the same result in either
  direction. Day counts take the larger value rather than the sum, so importing
  the same file twice changes nothing.
- **Ersetzen** overwrites everything with the file.

Progress is only ever cleared by you, from Settings, behind a confirmation.

## Development

```sh
npm install
npm run dev        # vite dev server
npm test           # 113 tests, mostly grammar
npm run build      # typecheck, bundle, generate the service worker
npm run icons      # regenerate the PWA icons from geometry
```

## Why these counts

The datasets are curated, not exhaustive. German has thousands of verbs; this has 377, chosen to cover what the trainers
need. The split matters more than the total: an irregular verb has to be
recorded because its forms cannot be derived, while a weak verb is generated
from its infinitive alone.

| | Count | What it is |
| --- | --- | --- |
| Verbs | 377 | 160 irregular (3 auxiliaries, 6 modals, 140 strong, 11 mixed) and 206 weak. German has roughly 170 to 200 strong and irregular verbs in ordinary use, so that half is close to complete; the weak half is a large sample rather than a list, since weak verbs are fully predictable and cost one line each |
| Nouns | 308 | Across 14 topics, weighted to A1 and A2, including the 17 weak masculines and the Name/Herz oddities |
| Prepositions | 47 | All of them worth knowing: 8 accusative, 14 dative, 9 two-way, 16 genitive |
| Valency entries | 116 | 145 frames, of which 24 are verbs whose meaning changes with the frame |

Level tags (A1 to C1) do two jobs. They cap the drill pools through Settings,
and they set **teaching order**: pools are sorted commonest first, and a session
introduces unseen cards in that order rather than at random, so a first session
opens on Mann, Frau, Kind and sein, haben, werden rather than on Zeuge and
Automat. The tag is a frequency proxy, checked against standard frequency lists
for the top few hundred words rather than derived from a corpus.

They They do **not** filter the reference tables: those show
everything, with their own visible filters, because looking a word up is not
the same as practising it.

## Adding words

- **Nouns** `src/data/nouns.ts`, one tuple per noun:
  `['Wohnung', 'f', 'Wohnungen', 'flat, apartment', 'home', { level: 'A1' }]`.
  Gender hints come from suffix rules automatically.
- **Verbs** `src/data/verbs.ts`. Weak verbs need no principal parts at all.
  For anything else, give `praet` and `partizip2` and let the rules do the rest,
  then run `npm test`: the integrity tests will tell you if a stem is missing.
- **Prepositions** `src/data/prepositions.ts`, **valency**
  `src/data/valency.ts`.

## Deploying

Static SPA. `vercel.json` handles the rewrites and cache headers. Push to
`main` and Vercel builds it.
