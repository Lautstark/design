# vorlaut — board screen mock

`vorlaut-board.html` is the board screen, drawn with `tokens/vorlaut.css` and
nothing else. It exists so the screen can be argued about before it is built in
Compose, where every round trip costs a rebuild and an emulator.

Open it directly — it needs no server:

```
open docs/mocks/vorlaut-board.html
```

Change `--rows` / `--cols` on `<body>` to see another board shape. The layout
takes them from there and has no breakpoint of its own, which is the same
promise the Compose grid makes.

## What it is showing

A 3×5 board — the size `boot_data.ts` starts a tablet Sammlung at — with a
sentence of three entries already in the bar, and one degraded button
(`Wasser`) whose picture the package promised and did not contain.

Colour on this screen comes from the Fitzgerald key and from nowhere else.
Every surface around it is a neutral token, so that a tint always means a word
class rather than decoration. The key's ten hexes live in vorlaut's
`boot_data.ts` (`WORD_CLASSES`).

## The symbols

ARASAAC, fetched once from the public API and committed so the mock renders
offline — the family's stated no-CDN rule applies here too.

> Author: Sergio Palao. Origin: ARASAAC (<https://arasaac.org>). Licence:
> CC BY-NC-SA 4.0. Owner: Government of Aragón (Spain).

**Not METACOM**, deliberately. METACOM is licensed per person and
`bildquelle/src/metacom.ts` states the rule this repository has to respect:
*no METACOM image byte is ever uploaded, transmitted, or written to any
server.* This repository is public, so METACOM could not live here whatever
was on the machine that built the mock.

The words are real and the pictograms were checked against their German
keywords by hand. The first search hit was wrong for several of them —
`will` resolved to a pictogram meaning *ich will **nicht***, and `mehr` to a
map of a disability workshop. A board of placeholder squares would have hidden
that, and would also have made any spacing look fine.
