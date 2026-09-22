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

The card ships **the original visual editor written by shpongledsummer**, recovered from the
upstream v5.0 release. It is bundled inside `atmospheric-weather-card.js` together with its Lit
dependency, so a HACS install of the single card file is all that is needed and the editor works
without any network access.

> The editor was originally a separate `atmospheric-weather-card-editor.js` that was never part of
> this mirror, so the card failed with `Failed to fetch dynamically imported module`. It also
> loaded Lit from a CDN at runtime. Bundling removes both failure modes.

Lit 3.2.1 is included under its BSD-3-Clause licence (Copyright Google LLC).

## Usage

```yaml
type: custom:atmospheric-weather-card
weather_entity: weather.home
sun_entity: sun.sun
card_height: 180px
button_areas:
  - position: bottom-left
    background: true
    buttons:
      - entity: weather.home
        attribute: temperature
        fancy_unit: true
```

## Configuration

> The upstream v5 documentation was never mirrored — the original repository was deleted and its
> v5 release page is gone. This reference was reconstructed by reading the card's source, and
> every option below is one the card actually reads at runtime. Options from v4.x (`chips`,
> `card_style`, `celestial_*`, `perf_*`, `moon_phase_entity`) are **ignored** by v5.

The layout is made of **button areas** placed in one of nine positions, each holding **buttons**.
Anything the card does not recognise is left untouched, so hand-written YAML survives a visual edit.

### Card options

| Option | Type | Default | Description |
|---|---|---|---|
| `weather_entity` | entity | — | Weather entity driving state, icons and forecasts |
| `sun_entity` | entity | — | Used for the day/night cycle |
| `theme_entity` | entity | — | Entity whose state switches light/dark |
| `card_color_mode` | `light` \| `dark` \| `ha_theme` | follows sun/theme | Forces a colour mode |
| `theme_adapt` | boolean | `true` | Adapts the card to the dashboard's dark/light mode |
| `card_height` | string | `200px` | Card height; `auto` for dashboard grid layouts |
| `card_padding` | string | — | Inner padding, e.g. `16px` |
| `card_offset` | string | — | Outer margin, e.g. `40px 0px` |
| `card_tap_action` | action | — | Action when the card itself is tapped |
| `simple_background` | boolean | `false` | Flat background instead of the animated one |
| `disable_background` | boolean | `false` | Disables the animated background entirely |
| `sun_effects` | boolean | `true` | Sun rays |
| `night_sky_effects` | boolean | `true` | Stars and night sky |
| `bottom_fade` | boolean | `false` | Soft fade along the bottom edge |
| `bg_brightness` / `bg_saturation` | number | — | Filters applied to the background |
| `weather_image_path` | string | — | Folder with weather background images |
| `weather_image_path_night` | string | — | Night variant of that folder |
| `image_day` / `image_night` | string | — | Image shown in the image slot |
| `image_scale` | number | `100` | Image height, as a percentage of the card |
| `image_alignment` | position | `top-right` | Anchor for the image slot |
| `image_x` / `image_y` | string | — | Fine-tunes the image position |
| `status_entity` | entity | — | Shows a different image while active/open/home |
| `status_day` / `status_night` | string | — | Images used while the status entity is active |
| `icon_set` | `colored` | built-in | Uses the multi-colour built-in icon set |
| `icon_path` | string | — | Folder with your own icon images |
| `custom_cards` | list | — | Lovelace cards embedded in the card |
| `custom_cards_position` | position | — | Where the embedded cards sit |
| `custom_cards_css_class` | string | — | Extra CSS classes for the embedded cards wrapper |
| `button_areas` | list | — | The layout itself, described below |

Positions are `top-left`, `top-center`, `top-right`, `left`, `center`, `right`, `bottom-left`,
`bottom-center` and `bottom-right`.

### Button area options

| Option | Type | Default | Description |
|---|---|---|---|
| `position` | position | `bottom-left` | Where the area sits |
| `stack_direction` | `vertical` \| `horizontal` | — | How areas sharing a position stack |
| `hide` | boolean | `false` | Hides the area |
| `layout` | `wrap` \| `grid` \| `horizontal-scroll` \| `vertical-scroll` | `wrap` | Row layout |
| `columns` | number | — | Columns, in `grid` layout |
| `scroll_count` | number | — | Buttons visible at once, in grid/scrolling layouts |
| `align` | `start` \| `center` \| `end` \| `spread` | `start` | Alignment inside the row |
| `background` | boolean | `false` | Gives the buttons a background |
| `background_style` | `frosted` \| `contrast` \| `theme` | `frosted` | Background treatment |
| `grouped` | boolean | `false` | One shared background instead of one per button |
| `separator` | boolean | `false` | Dividers between buttons (needs `grouped`) |
| `background_color` | colour | — | Background colour of the grouped container |
| `width` / `height` | string | — | Size of the area |
| `padding` | string | — | Padding of the container |
| `gap` | string | `8px` | Gap between buttons |
| `button_padding`, `button_gap`, `button_text_gap` | string | — | Spacing defaults for the buttons |
| `button_icon_size`, `button_icon_padding` | string | — | Icon defaults |
| `button_text_size`, `button_label_size` | string | — | Text defaults |
| `sub_value_size`, `sub_value_weight` | string | — | Sub-value defaults |
| `button_style` | `inline` \| `stacked` \| `vertical` | `inline` | Default button layout |
| `button_background_color`, `button_icon_background`, `button_icon_background_color` | — | — | Button colour defaults |
| `visibility` | conditions | — | Home Assistant visibility conditions |
| `buttons` | list | — | The buttons in this area |

### Button options

**Content**

| Option | Type | Default | Description |
|---|---|---|---|
| `entity` | entity | — | Entity shown by the button |
| `attribute` | string | — | Attribute to display instead of the state |
| `name` | string | — | Fixed label |
| `name_sensor` / `name_attribute` | entity / string | — | Use an entity value as the label |
| `name_format` | string | — | Suffix appended to the label |
| `unit_format` | string | — | Replaces the unit, attached with no space |
| `fancy_unit` | boolean | `false` | Smaller, raised units on value and sub-value |
| `sub_value_entity` / `sub_value_attribute` | entity / string | — | Secondary value |
| `sub_value_format` | string | — | Replaces the sub-value unit; `''` hides it |
| `forecast` | `daily` \| `hourly` | — | Reads from the forecast instead of the state |
| `forecast_offset` | number | `0` | `0` is today/now, `1` the next entry, … |
| `forecast_precision` | number | `0` | Decimal places for forecast values |
| `tap_action` | action | `more-info` | Action when the button is tapped |
| `visibility` | conditions | — | Home Assistant visibility conditions |

**Icon and style**

| Option | Type | Default | Description |
|---|---|---|---|
| `icon` | icon | — | MDI icon, or `weather` for the dynamic weather icon |
| `icon_path` | string | — | Folder with your own icon images |
| `icon_size`, `icon_padding` | string | — | Icon sizing |
| `icon_background`, `icon_background_color` | boolean / colour | — | Background behind the icon |
| `style` | `inline` \| `stacked` \| `vertical` | area default | Layout of this button |
| `hide_icon`, `hide_label`, `hide_value`, `hide_sub_value` | boolean | `false` | Hides parts of the button |
| `background`, `background_color` | boolean / colour | area default | Button background |
| `text_size`, `label_size`, `sub_value_size` | string | — | Font sizes |
| `value_weight`, `label_weight`, `sub_value_weight` | string | — | Font weights |
| `inner_gap`, `text_gap`, `padding` | string | — | Spacing |
| `width`, `height` | string | — | Explicit size |
| `align` | `start` \| `center` \| `end` | — | Alignment inside the button |
| `button_round` | boolean | `false` | Fully rounded button |
| `text_shadow` | boolean | `false` | Shadow behind the text |
| `element_order` | string | — | Order of `icon`, `text`, `bar` |
| `text_order` | string | — | Order of `label`, `value`, `sub` |

**Overflow**

| Option | Type | Default | Description |
|---|---|---|---|
| `overflow`, `label_overflow`, `sub_value_overflow` | `ellipsis` \| `clip` \| `wrap` \| `marquee` | `ellipsis` | Overflow behaviour |
| `marquee_speed` | number | `30` | Scrolling speed |
| `marquee_rtl` | boolean | `false` | Scrolls right to left |

**Free positioning** — place a button anywhere on the card

| Option | Type | Default | Description |
|---|---|---|---|
| `position` | `custom` | — | Detaches the button from its area |
| `position_anchor` | position | `top-left` | Corner it is measured from |
| `position_x`, `position_y` | string | `0` | Offset from that corner |

**Ring and bar gauges** — set `type: ring` or `type: bar`

| Option | Type | Default | Description |
|---|---|---|---|
| `gauge_entity`, `gauge_attribute` | entity / string | the button's own value | Value driving the gauge |
| `ring_min` / `bar_min` | number | `0` | Lower bound |
| `ring_max` / `bar_max` | number | `100` | Upper bound |
| `ring_width` / `bar_height` | number | `4` | Thickness |
| `ring_gap` | number | `3` | Gap between ring and icon |
| `ring_color` / `bar_color` | colour | — | Base colour |
| `ring_threshold_mode` / `bar_threshold_mode` | `solid` \| `gradient` | `solid` | How thresholds blend |
| `ring_thresholds` / `bar_thresholds` | list | — | `{ value, color }` entries |
| `color_thresholds` | list | — | Tints the whole button, `{ value, color }` |
| `color_threshold_entity`, `color_threshold_attribute` | entity / string | the button's own value | Value driving the tint |

## Examples

### The author's original layout

Large temperature and a UV ring on the left, a scrolling forecast panel on the right — the layout
from the original documentation, translated to v5.

```yaml
type: custom:atmospheric-weather-card
weather_entity: weather.home
sun_entity: sun.sun
card_height: 180px
card_padding: 16px
icon_set: colored
button_areas:
  - position: top-left
    padding: 0px
    buttons:
      - entity: weather.home
        attribute: temperature
        position: custom
        position_anchor: top-left
        position_x: 16px
        position_y: 16px
        text_size: 32px
        hide_icon: true
        hide_label: true
        background: false
        fancy_unit: true
        value_weight: "700"
      - entity: weather.home
        attribute: uv_index
        name: UV
        type: ring
        position: custom
        position_anchor: bottom-left
        position_x: 20px
        position_y: 20px
        style: vertical
        align: center
        hide_icon: true
        ring_min: 0
        ring_max: 11
        ring_width: 4px
        ring_gap: 4px
        ring_color: "#ffffff"
        height: 50px
        text_size: 13px
        label_size: 8px
        padding: 6px
  - position: top-right
    layout: horizontal-scroll
    scroll_count: 3
    width: 180px
    height: 100%
    align: center
    padding: 16px
    gap: 2px
    button_gap: 6px
    button_icon_size: 32px
    button_text_size: 14px
    button_label_size: 11px
    button_style: vertical
    background: true
    grouped: true
    separator: true
    buttons:
      - &day
        entity: weather.home
        forecast: daily
        forecast_offset: 0
        attribute: temperature
        sub_value_attribute: templow
        forecast_precision: 0
        icon: weather
        unit_format: °
        sub_value_format: °
        padding: 0px
      - { <<: *day, forecast_offset: 1 }
      - { <<: *day, forecast_offset: 2 }
      - { <<: *day, forecast_offset: 3 }
      - { <<: *day, forecast_offset: 4 }
```

YAML anchors (`&day` / `<<:`) are shown here for brevity; Home Assistant's YAML editor does not
accept them, so repeat the block for each day when pasting into a dashboard.

### Transparent forecast with raised units

The same panel without a background, letting the sky show through, with the unit raised on both
temperatures.

```yaml
  - position: top-right
    layout: horizontal-scroll
    scroll_count: 3
    width: 200px
    height: 100%
    align: center
    padding: 10px
    gap: 2px
    button_gap: 6px
    button_icon_size: 30px
    button_style: vertical
    background: false
    buttons:
      - entity: weather.home
        forecast: daily
        forecast_offset: 0
        attribute: temperature
        sub_value_attribute: templow
        forecast_precision: 0
        icon: weather
        fancy_unit: true
        label_weight: "700"
        label_size: 13px
        text_size: 14px
        padding: 4px 10px
```

Leave `unit_format` and `sub_value_format` out so `fancy_unit` can raise the entity's own unit.

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
No dependencies are required. The suite also checks that every option documented below is one
the card actually reads, so the reference cannot drift from the code.

## License

MIT © shpongledsummer (original author). See [`LICENSE`](LICENSE).
