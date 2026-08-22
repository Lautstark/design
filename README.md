# design

The look the Lautstark products share, and the thing that generates it.

Three products — [mitreden](https://github.com/Lautstark/mitreden),
[bildhaft](https://github.com/Lautstark/bildhaft),
[vorlaut](https://github.com/Lautstark/vorlaut) — are one tool with three outputs.
You type a sentence; one gives it a voice, one gives it symbols, one puts it on a
key you can press. They should look like siblings, and this is where that is
decided.

**[The gallery →](https://lautstark.github.io/design/)**
· **[The rule set →](docs/design.md)**

## What is here

- **[docs/design.md](docs/design.md)** — the agreement. Token names, the three
  button tiers, fields, chips, menus, dialogs, empty states, and a vocabulary
  glossary so the same thing has the same name in every product.
- **[docs/index.html](docs/index.html)** — the gallery. Every component drawn with
  live tokens, a light/dark switch, and an accent picker.
- **[docs/components.css](docs/components.css)** — the components layer. The
  button tiers, fields, chips, the focus policy, the overflow menu, the sheet
  skeleton and the message furniture, written once against the token names. The
  gallery imports it, and a product imports it beside its token file.
- **[docs/lib/](docs/lib/)** — the generator. Colour maths, the derivation, and the
  emitter. No dependencies.
- **[products/](products/)** — one small JSON file per product.
- **[build.js](build.js)** — writes each product's token file.

## One input

A product declares one thing about itself: its accent.

```json
{ "product": "vorlaut", "accent": "#9B7BFF", "schemes": "dark", "state": false }
```

Everything else follows. The planes, the hairline, the three weights of text, the
five accent tokens, the danger family — derived, and every value that has to clear
a contrast ratio is *solved* for it rather than picked by eye.

That last part is the point. Between them these products shipped white-on-salmon at
2.48:1 on the button that deletes everything, a `--text-faint` at 2.89:1, and a
replacement for it — ported from a sibling — that still read 4.04:1 on the ground it
actually sat on. Nobody was careless. Judging a contrast ratio by eye is not a thing
people can do, and judging it in whichever scheme your laptop happens to be set to
guarantees the other scheme goes unchecked.

## The gallery is the generator

[docs/index.html](docs/index.html) imports the same modules `build.js` does and
applies their output straight to the page. It is not a picture of the design system;
it is the design system with a hue picker on it. Pick an accent — including one no
product uses — and every component, every token and every contrast ratio re-derives
live.

Try it on a hue you are considering for a fourth product. If it looks wrong there,
it will look wrong shipped.

## Running it

Node, no install, no build step.

```bash
node build.js --check
```

Audits every product and exits non-zero on a failure, writing nothing. This is what
CI runs.

```bash
node build.js
```

Writes each product's token file, provided that product is checked out beside this
repository. A product that fails the audit is never written.

```bash
python3 -m http.server 8899 --directory docs
```

Serves the gallery at [localhost:8899](http://localhost:8899). Any static server
will do; the page is three files and imports nothing from the network.

## How a change reaches the products

By npm, for anything with a build step — as a `github:` dependency, which is how
this family already shares code (`@lautstark/bildquelle`, `@lautstark/stimmquelle`):

```json
"@lautstark/design": "github:Lautstark/design#v1.0.0"
```

```css
@import '@lautstark/design/tokens/bildhaft.css';
@import '@lautstark/design/components.css';
```

Vite resolves the bare specifier, so there is no plugin and no copy step. The pin
is a real pin, `npm update` is the whole update story, and `prepare` regenerates
`tokens/` from source on install rather than trusting what was committed — which
costs nothing, because the generator has no dependencies.

Not by a CDN. All three products run offline, and a stylesheet fetched from a
remote host at page load would cost them that. npm is a build-time fetch that
leaves a local file; a `<link>` to another origin is a runtime dependency. Those
are different things.

**Every product pins a version.** vorlaut has no build step and never gained
one — it serves plain ES modules — so it keeps `static/tokens.css` committed and
refreshes it with a one-line script:

```json
"scripts": { "tokens": "cp node_modules/@lautstark/design/tokens/vorlaut.css static/tokens.css" }
```

The page still runs for anyone who never touches npm; npm is only there to hold
the pin.

Nothing here reaches into another repository, and there is no secret anywhere.
An earlier version pushed outward, which needed a personal access token with
write access to two other repositories, stored here and readable by every
workflow in this repo — a long-lived cross-repository credential for a file of
colour values. The one after that had each product clone this repo on a weekly
schedule, which removed the credential but spent about fifty CI runs a year to
find nothing: these files change roughly twice. Both are gone. A version pin in
a `package.json` was the whole of what anybody wanted.

| product | how | where |
| --- | --- | --- |
| bildhaft | `@import` | `src/main.tsx` |
| mitreden | `@import`, once its rewrite lands | `src/` |
| mitreden | inline | `ui.html`, by hand until that page retires |
| vorlaut | `npm run tokens` | copied to `static/tokens.css`, committed |

## What is not shared

The accent hue, by design — it is what tells three otherwise identical-looking
programs apart. Whether a product follows the OS or commits to one ground. Its
navigation shell. Its density — list rows stay per product, because a 200-row
archive and a dozen worked-on cards want different furniture.

"And no code" used to end this list. It stopped being true the day the copying
became measurable: vorlaut and mitreden carried the identical `button.primary`
rule, bildhaft carried the same values under its own class names, and the
one-line focus policy travelled between repositories by hand. Those components
now cross deliberately, as `components.css`, by the same road the tokens take.
What travels between the repositories is the document, the generated file and
that one stylesheet — always by version pin, never by hand.

## Licence

MIT.
