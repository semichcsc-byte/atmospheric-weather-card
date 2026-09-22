# Atmospheric Weather Card

Animated weather card for Home Assistant.

> **Community mirror.** The original repository (`shpongledsummer/atmospheric-weather-card`)
> was removed from GitHub. This repository preserves the card (v5.0) so it can keep
> being installed and updated via HACS. All credit for the card goes to the original
> author, **shpongledsummer**. Distributed under the original MIT License (see
> [`LICENSE`](LICENSE)). If you are the original author and want this taken down or
> transferred, please open an issue.

## Install (HACS)

1. HACS → three-dot menu → **Custom repositories**.
2. Add `semichcsc-byte/atmospheric-weather-card`, category **Dashboard**.
3. Install, then refresh your browser cache.

The card resource `atmospheric-weather-card.js` is registered automatically by HACS.

## Visual editor

The visual editor is **bundled inside `atmospheric-weather-card.js`**, so a HACS install of the
single card file is always enough. It covers the full v5.0 option set: card, background and
effects, image and status, icons, embedded cards, and the nested button areas (areas, buttons,
ring/bar gauges, colour thresholds and visibility conditions). Options the editor does not
recognise are preserved untouched, so YAML-only tweaks survive a visual edit.

> The original stand-alone `atmospheric-weather-card-editor.js` was lost when the upstream
> repository was removed, which broke the card's editor with
> `Failed to fetch dynamically imported module`. This editor is a clean reimplementation against
> the v5.0 schema; there is no longer any external file to fetch.

If Home Assistant's form components cannot be loaded, the editor shows a notice instead of an
error and you can configure the card with **Show code editor**.

## Usage

```yaml
type: custom:atmospheric-weather-card
entity: weather.home
```

See the card's visual editor for the full option set (animations, layout, etc.), or configure
everything in YAML.

### Fancy units

Set `fancy_unit: true` on a button to render smaller, raised units for both its
main value and its sub-value (for example, forecast high and low temperatures).
This applies to forecast attributes and `sub_value_entity` sensors, including
units overridden with `sub_value_format`. Set `sub_value_format: ''` to hide the
sub-value unit. With `fancy_unit` disabled or omitted, units remain inline.

Sensor sub-values use Home Assistant's formatted value parts to preserve display
precision, localized number formatting, and derived units (such as climate
temperatures). On older Home Assistant versions without the value-parts API,
native formatted sub-values remain unchanged and inline; `sub_value_format`
overrides are not applied in fancy mode because the unit cannot be safely separated.

### Tests

Run the regression tests with Node.js 18 or newer: `node --test tests/*.test.cjs`.
No dependencies are required.

## License

MIT © shpongledsummer (original author). See [`LICENSE`](LICENSE).
