# Archived upstream v5.0 sources

These are **untouched copies of the original files by shpongledsummer**, kept for provenance and
as insurance. They are *not* what HACS installs — HACS only downloads the file named in
[`hacs.json`](../hacs.json), which is [`atmospheric-weather-card.js`](../atmospheric-weather-card.js)
in the repository root.

| File | Size | SHA-256 |
|---|---|---|
| `v5.0/atmospheric-weather-card.js` | 256,721 | `814d5b6cd5f2d0b37d71d2c582e399561630cf5394123b4d184b5d3459ac6646` |
| `v5.0/atmospheric-weather-card-editor.js` | 198,211 | `f8a6789a4d88425a5feeb35bf919e89d23b4f773991af090ed50f5476d1b2386` |

## Where they came from

The original repository was deleted when the author removed his GitHub account around
2026‑07‑01, taking the v5 sources and documentation with it. These files were recovered from the
`legacy/v5/` folder of `ProfessorQuantumUniverse/atmospheric-weather-card` (a fork of the
community continuation `whyisthisbroken/atmo-weather-card`, which carries the original commit
history), at commit `3be85dc8dd4b`.

The editor is the genuine article: its internal version token is `AWC-28062026`, exactly the one
the shipped card used in `import("./atmospheric-weather-card-editor.js?v=AWC-28062026")`. The
issue reporter independently found the same file in a Home Assistant backup, which corroborates it.

## How they relate to the shipped card

- **The editor is what this repository ships.** It is bundled into the card file — together with
  Lit, so it no longer fetches anything at runtime — rather than being served as a separate file,
  because HACS never installed that second file. That was the cause of
  `Failed to fetch dynamically imported module` (see issue #1).
- **The card here is a slightly earlier v5.0 build** than the one this repository distributes.
  Both carry the `AWC-28062026` token, but the shipped card reads `custom_cards_css_class`, which
  this build and the editor predate. The editor preserves that option untouched; it simply has no
  field for it.

## Other surviving upstream material

Not copied here, but useful if you need it: the final v4.5.1 card and the last original README —
the only surviving documentation of the card — are preserved in the `Zerosignal84/ZS-atmospheric-weather-card`
and `Sethur90/atmospheric-weather-card` forks. The v5 README was never mirrored anywhere; the
configuration reference in this repository's [README](../README.md) was rebuilt from the source.

All of this remains the work of **shpongledsummer**, under the MIT licence.
