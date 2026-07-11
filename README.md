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

## License

MIT © shpongledsummer (original author). See [`LICENSE`](LICENSE).
