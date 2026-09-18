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

## Usage

```yaml
type: custom:atmospheric-weather-card
entity: weather.home
```

See the card's on-screen editor for the full option set (animations, layout, etc.).

### Fancy units

Set `fancy_unit: true` on a button to render smaller, raised units for both its
main value and its sub-value (for example, forecast high and low temperatures).
This applies to forecast attributes and `sub_value_entity` sensors, including
units overridden with `sub_value_format`. Set `sub_value_format: ''` to hide the
sub-value unit. With `fancy_unit` disabled or omitted, units remain inline.

### Tests

Run the regression tests with Node.js 18 or newer: `node --test tests/*.test.cjs`.
No dependencies are required.

## License

MIT © shpongledsummer (original author). See [`LICENSE`](LICENSE).
