(function() {
"use strict";
/**
 * ATMOSPHERIC WEATHER CARD
 * Version: 5.0
 * https://github.com/shpongledsummer/atmospheric-weather-card
 */
console.info(
    "%c Atmospheric Weather Card ",
    "color: white; font-weight: 700; background: linear-gradient(90deg, #355C7D 0%, #6C5B7B 50%, #C06C84 100%); padding: 6px 12px; border-radius: 6px; font-family: sans-serif; letter-spacing: 0.5px; text-shadow: 0 1px 2px rgba(0,0,0,0.2);"
);
try { CSS.registerProperty({ name: '--awc-ring-pct', syntax: '<percentage>', inherits: true, initialValue: '0%' }); } catch (_) {}
const ACTIVE_STATES = Object.freeze([
    'on', 'true', 'open', 'unlocked', 'home', 'active'
]);

const FALLBACK_WEATHER = Object.freeze({
    state: 'cloudy',
    attributes: {
        temperature: '--',
        temperature_unit: '',
        wind_speed: 0,
        wind_speed_unit: '',
        friendly_name: 'Weather Unavailable'
    }
});

const _h = s => [parseInt(s.slice(1,3),16)/255, parseInt(s.slice(3,5),16)/255, parseInt(s.slice(5,7),16)/255];

const SKY_HEX = {
    'sunny':           { day: ['#B0E8FF','#60B8FF','#4098F0','#3888E0'], night: ['#2E2480','#0F1247','#05081F','#000108'] },
    'clear-night':     { day: ['#B0E0FF','#80B8F0','#6098D8','#5080C8'], night: ['#264080','#262947','#0D0F1F','#030408'] },
    'partlycloudy':    { day: ['#B0E0FF','#80B8F0','#6098D8','#5080C8'], night: ['#404D80','#0D1433','#030514','#000004'] },
    'cloudy':          { day: ['#EDF7FB','#B9D5F1','#96BBDD','#8DA9D5'], night: ['#264080','#262947','#0D0F1F','#030408'] },
    'windy':           { day: ['#ECF7FE','#C5DDF5','#96B9E0','#7FA0D1'], night: ['#1A3359','#0D1A40','#050D26','#000314'] },
    'windy-variant':   { day: ['#ECF7FE','#C5DDF5','#96B9E0','#7FA0D1'], night: ['#1A3359','#0D1A40','#050D26','#000314'] },
    'exceptional':     { day: ['#B0ECFF','#60C0FF','#40A0F0','#3890E0'], night: ['#33758F','#1A3D80','#1A1457','#05051A'] },
    'default':         { day: ['#A8E4FF','#70B8F0','#4898E0','#3888D0'], night: ['#2D2474','#101141','#06081D','#000107'] },
    'fog':             { day: ['#E0F0F4','#C2D8E2','#A2B6C6','#8493A6'], night: ['#323F53','#141E35','#06080F','#010204'] },
    'snowy':           { day: ['#EDF4FC','#CADCF2','#AAC6E6','#93B2D6'], night: ['#1C374E','#0F1E33','#080F20','#040812'] },
    'snowy-rainy':     { day: ['#E6EDF7','#C0D4EC','#A2BEDC','#8AAAC9'], night: ['#1C374E','#0F1E33','#080F20','#040812'] },
    'hail':            { day: ['#7A94B8','#94B8D6','#B3DBED','#D6F2FA'], night: ['#263541','#0F1932','#080920','#01030A'] },
    'rainy':           { day: ['#D7E7F0','#A6C2D6','#5E7E9C','#39506E'], night: ['#193658','#192B45','#0F0A20','#04050A'] },
    'pouring':         { day: ['#BFD4E0','#85A2BB','#4E6B89','#2E445F'], night: ['#152E4A','#15253A','#0D081B','#040408'] },
    'lightning':       { day: ['#B6D0DA','#789AA6','#41607A','#243B54'], night: ['#263541','#0F1932','#080920','#01030A'] },
    'lightning-rainy': { day: ['#B6D0DA','#789AA6','#41607A','#243B54'], night: ['#263541','#0F1932','#080920','#01030A'] },
};

const SKY_COLORS = Object.fromEntries(Object.entries(SKY_HEX).map(
    ([k, v]) => [k, { skyDay: v.day.map(_h), skyNight: v.night.map(_h) }]
));

const VISUAL_DEFAULTS = Object.freeze({
    engine: 'sky',
    cloudCover: 0.00,
    cloudScale: 1.00,
    cloudShadow: 0.00,
    cloudThickness: 0.00,
    clearing: 0.42,
    cloudSpeed: 1.00,
    rain: 0.00,
    lightning: 0.00,
    snowfall: 0.00,
    flakeSize: 1.00,
    hail: 0.00,
    stars: false,
    starCount: 0,
    starsOpacity: 0.00,
    sunrays: false,
    skyDay: null,
    skyNight: null,
});

const WEATHER_VISUALS = Object.freeze({
    'sunny':            { engine: 'sky', cloudCover: 0.05, cloudScale: 1.85, cloudShadow: 0.12, cloudSpeed: 0.20, sunrays: true, stars: true, starsOpacity: 0.90, starCount: 700 },
    'clear-night':      { engine: 'sky', cloudCover: 0.05, cloudScale: 1.35, cloudShadow: 0.10, cloudSpeed: 0.10, stars: true, starsOpacity: 1.00, starCount: 800 },
    'partlycloudy':     { engine: 'sky', cloudCover: 0.28, cloudScale: 2.10, cloudShadow: 0.10, cloudThickness: 0.20, cloudSpeed: 0.45, sunrays: true, stars: true, starsOpacity: 0.70, starCount: 450 },
    'cloudy':           { engine: 'sky', cloudCover: 0.34, cloudScale: 2.20, cloudShadow: 0.35, cloudThickness: 0.25, cloudSpeed: 0.60, stars: true, starsOpacity: 0.50, starCount: 300 },
    'windy':            { engine: 'sky', cloudCover: 0.39, cloudScale: 2.30, cloudShadow: 0.22, cloudThickness: 0.25, cloudSpeed: 1.20, stars: true, starsOpacity: 0.80, starCount: 500 },
    'windy-variant':    { engine: 'sky', cloudCover: 0.34, cloudScale: 1.50, cloudShadow: 0.12, cloudSpeed: 1.20, stars: true, starsOpacity: 0.80, starCount: 600 },
    'exceptional':      { engine: 'sky', cloudCover: 0.01, cloudScale: 1.75, cloudShadow: 0.10, cloudSpeed: 0.10, sunrays: true, stars: true, starsOpacity: 1.00, starCount: 800 },
    'default':          { engine: 'sky', cloudCover: 0.30, cloudScale: 1.45, cloudSpeed: 1.00, stars: true, starsOpacity: 0.80, starCount: 800 },
    'fog':              { engine: 'sky', cloudCover: 0.15, cloudScale: 2.20, cloudShadow: 0.05, clearing: 0.00, cloudSpeed: 0.10, stars: true, starsOpacity: 0.35, starCount: 250 },
    'snowy':            { engine: 'sky', cloudCover: 0.33, cloudScale: 1.80, cloudShadow: 0.22, cloudSpeed: 0.35, snowfall: 1.00, flakeSize: 1.50, stars: true, starsOpacity: 0.40, starCount: 600 },
    'snowy-rainy':      { engine: 'sky', cloudCover: 0.38, cloudScale: 1.70, cloudShadow: 0.26, cloudSpeed: 0.45, snowfall: 0.70, flakeSize: 1.40, stars: true, starsOpacity: 0.30, starCount: 450 },
    'hail':             { engine: 'sky', cloudCover: 0.33, cloudScale: 1.60, cloudShadow: 0.34, cloudSpeed: 0.70, snowfall: 0.90, flakeSize: 2.00, hail: 1.00, stars: true, starsOpacity: 0.45, starCount: 350 },
    'rainy':            { engine: 'water', rain: 0.70 },
    'pouring':          { engine: 'water', rain: 1.00 },
    'lightning':        { engine: 'water', rain: 1.00, lightning: 1.00 },
    'lightning-rainy':  { engine: 'water', rain: 1.00, lightning: 1.00 },
});

function resolveVisuals(weatherState) {
    const key = WEATHER_VISUALS[weatherState] ? weatherState : 'default';
    return { ...VISUAL_DEFAULTS, ...WEATHER_VISUALS[key], ...SKY_COLORS[key] };
}
const WEATHER_ICONS = Object.freeze({
    'clear-night': 'mdi:weather-night',
    'cloudy': 'mdi:weather-cloudy',
    'fog': 'mdi:weather-fog',
    'hail': 'mdi:weather-hail',
    'lightning': 'mdi:weather-lightning',
    'lightning-rainy': 'mdi:weather-lightning-rainy',
    'partlycloudy': 'mdi:weather-partly-cloudy',
    'pouring': 'mdi:weather-pouring',
    'rainy': 'mdi:weather-rainy',
    'snowy': 'mdi:weather-snowy',
    'snowy-rainy': 'mdi:weather-snowy-rainy',
    'sunny': 'mdi:weather-sunny',
    'windy': 'mdi:weather-windy',
    'windy-variant': 'mdi:weather-windy-variant',
    'exceptional': 'mdi:weather-sunny',
    'default': 'mdi:weather-cloudy'
});
const WEATHER_ATTR_ICONS = Object.freeze({
    temperature:    'mdi:thermometer',
    apparent_temperature: 'mdi:thermometer-lines',
    humidity:       'mdi:water-percent',
    pressure:       'mdi:gauge',
    wind_speed:     'mdi:weather-windy',
    wind_bearing:   'mdi:compass-outline',
    wind_gust_speed:'mdi:weather-windy-variant',
    visibility:     'mdi:eye-outline',
    dew_point:      'mdi:thermometer-low',
    uv_index:       'mdi:weather-sunny-alert',
    cloud_coverage: 'mdi:cloud-outline',
    ozone:          'mdi:weather-hazy'
});
const FORECAST_ATTR_ICONS = Object.freeze({
    ...WEATHER_ATTR_ICONS,
    condition: 'mdi:weather-partly-cloudy', templow: 'mdi:thermometer-low',
    precipitation: 'mdi:weather-rainy', precipitation_probability: 'mdi:weather-rainy',
});
// Weather icon glyphs remixed from Lucide (https://lucide.dev), ISC License.
const AWC_BUILTIN_ICONS = Object.freeze({
    'clear-night':     '<g><animateTransform attributeName="transform" type="translate" values="0,0; -0.7,0.7; 0,0" dur="3.5s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="rotate" values="-4 12 12; 4 12 12; -4 12 12" dur="4s" repeatCount="indefinite" additive="sum"/><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" fill="currentColor" fill-opacity="0.12"><animate attributeName="fill-opacity" values="0.06;0.22;0.06" dur="4s" repeatCount="indefinite"/></path></g>',
    'cloudy':          '<g><animateTransform attributeName="transform" type="translate" values="0,0;0.6,0;0,0;-0.6,0;0,0" dur="6s" repeatCount="indefinite"/><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" fill="currentColor" fill-opacity="0.08"/></g>',
    'fog':             '<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" fill="currentColor" fill-opacity="0.08"/><path d="M16 17H7" stroke-dasharray="2 2.5"><animate attributeName="stroke-dashoffset" values="0;9" dur="3s" repeatCount="indefinite"/></path><path d="M17 21H9" stroke-dasharray="2 2.5"><animate attributeName="stroke-dashoffset" values="0;-9" dur="4s" repeatCount="indefinite"/></path>',
    'hail':            '<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" fill="currentColor" fill-opacity="0.08"/><path d="M16 14v2" stroke-opacity="0.8"><animate attributeName="stroke-opacity" values="0.8;0.3;0.8" dur="0.8s" repeatCount="indefinite"/></path><path d="M8 14v2" stroke-opacity="0.8"><animate attributeName="stroke-opacity" values="0.8;0.3;0.8" dur="0.8s" begin="0.3s" repeatCount="indefinite"/></path><circle cx="16" cy="20" r="0.5" fill="currentColor" stroke="none"><animate attributeName="cy" values="18;20;19.2;20" dur="1s" repeatCount="indefinite"/></circle><circle cx="8" cy="20" r="0.5" fill="currentColor" stroke="none"><animate attributeName="cy" values="18;20;19.2;20" dur="1s" begin="0.35s" repeatCount="indefinite"/></circle><path d="M12 16v2" stroke-opacity="0.8"><animate attributeName="stroke-opacity" values="0.8;0.3;0.8" dur="0.8s" begin="0.15s" repeatCount="indefinite"/></path><circle cx="12" cy="22" r="0.5" fill="currentColor" stroke="none"><animate attributeName="cy" values="20;22;21.2;22" dur="1s" begin="0.2s" repeatCount="indefinite"/></circle>',
    'lightning':       '<path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973" fill="currentColor" fill-opacity="0.08"/><path d="m13 12-3 5h4l-3 5" stroke-width="1.75"><animate attributeName="stroke-opacity" values="1;1;0.15;1;1;1;0.1;0.8;1;1;1;1;0.12;1" dur="4s" repeatCount="indefinite"/></path>',
    'lightning-rainy': '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" fill="currentColor" fill-opacity="0.06"><animate attributeName="fill-opacity" values="0.06;0.06;0.2;0.06;0.06;0.06;0.15;0.06" dur="3.5s" repeatCount="indefinite"/><animate attributeName="stroke-opacity" values="1;1;0.2;1;1;1;0.15;1" dur="3.5s" repeatCount="indefinite"/></path>',
    'partlycloudy':    '<g stroke-opacity="0.5"><animate attributeName="stroke-opacity" values="0.5;0.7;0.5" dur="3s" repeatCount="indefinite"/><path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/></g><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"/><g><animateTransform attributeName="transform" type="translate" values="0,0;0.5,0;0,0;-0.5,0;0,0" dur="7s" repeatCount="indefinite"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z" fill="currentColor" fill-opacity="0.08"/></g>',
    'partlycloudy-night': '<path d="M18.376 14.512a6 6 0 0 0 3.461-4.127c.148-.625-.659-.97-1.248-.714a4 4 0 0 1-5.259-5.26c.255-.589-.09-1.395-.716-1.248a6 6 0 0 0-4.594 5.36" fill="currentColor" fill-opacity="0.12"><animate attributeName="fill-opacity" values="0.06;0.22;0.06" dur="4s" repeatCount="indefinite"/></path><g><animateTransform attributeName="transform" type="translate" values="0,0;0.5,0;0,0;-0.5,0;0,0" dur="7s" repeatCount="indefinite"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z" fill="currentColor" fill-opacity="0.08"/></g>',
    'pouring':         '<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" fill="currentColor" fill-opacity="0.08"/><path d="m9.2 22 3-7" stroke-opacity="0.7"><animate attributeName="stroke-opacity" values="0.7;0.2;0.7" dur="0.7s" repeatCount="indefinite"/></path><path d="m9 13-3 7" stroke-opacity="0.7"><animate attributeName="stroke-opacity" values="0.7;0.2;0.7" dur="0.7s" begin="0.25s" repeatCount="indefinite"/></path><path d="m17 13-3 7" stroke-opacity="0.7"><animate attributeName="stroke-opacity" values="0.7;0.2;0.7" dur="0.7s" begin="0.5s" repeatCount="indefinite"/></path>',
    'rainy':           '<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" fill="currentColor" fill-opacity="0.08"/><path d="M16 14v6" stroke-dasharray="3 2"><animate attributeName="stroke-dashoffset" values="0;-5" dur="1s" repeatCount="indefinite"/></path><path d="M8 14v6" stroke-dasharray="3 2"><animate attributeName="stroke-dashoffset" values="0;-5" dur="1s" begin="0.35s" repeatCount="indefinite"/></path><path d="M12 16v6" stroke-dasharray="3 2"><animate attributeName="stroke-dashoffset" values="0;-5" dur="1s" begin="0.7s" repeatCount="indefinite"/></path>',
    'snowy':           '<g><animateTransform attributeName="transform" type="rotate" values="0 12 12;360 12 12" dur="12s" repeatCount="indefinite"/><path d="m10 20-1.25-2.5L6 18"/><path d="M10 4 8.75 6.5 6 6"/><path d="m14 20 1.25-2.5L18 18"/><path d="m14 4 1.25 2.5L18 6"/><path d="m17 21-3-6h-4"/><path d="m17 3-3 6 1.5 3"/><path d="M2 12h6.5L10 9"/><path d="m20 10-1.5 2 1.5 2"/><path d="M22 12h-6.5L14 15"/><path d="m4 10 1.5 2L4 14"/><path d="m7 21 3-6-1.5-3"/><path d="m7 3 3 6h4"/></g>',
    'snowy-rainy':     '<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" fill="currentColor" fill-opacity="0.08"/><circle cx="8" cy="15.5" r="0.5" fill="currentColor" stroke="none"><animate attributeName="cy" values="15;16.5;15" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite"/></circle><circle cx="8" cy="19.5" r="0.5" fill="currentColor" stroke="none"><animate attributeName="cy" values="19;20.5;19" dur="2.2s" begin="0.6s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0.4;1" dur="2.2s" begin="0.6s" repeatCount="indefinite"/></circle><circle cx="12" cy="17.5" r="0.5" fill="currentColor" stroke="none"><animate attributeName="cy" values="17;18.5;17" dur="1.8s" begin="0.3s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0.4;1" dur="1.8s" begin="0.3s" repeatCount="indefinite"/></circle><circle cx="12" cy="21.5" r="0.5" fill="currentColor" stroke="none"><animate attributeName="cy" values="21;22.5;21" dur="2.4s" begin="0.9s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0.4;1" dur="2.4s" begin="0.9s" repeatCount="indefinite"/></circle><circle cx="16" cy="15.5" r="0.5" fill="currentColor" stroke="none"><animate attributeName="cy" values="15;16.5;15" dur="2.1s" begin="0.45s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0.4;1" dur="2.1s" begin="0.45s" repeatCount="indefinite"/></circle><circle cx="16" cy="19.5" r="0.5" fill="currentColor" stroke="none"><animate attributeName="cy" values="19;20.5;19" dur="1.9s" begin="0.75s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0.4;1" dur="1.9s" begin="0.75s" repeatCount="indefinite"/></circle>',
    'sunny':           '<g><animateTransform attributeName="transform" type="rotate" values="0 12 12;360 12 12" dur="30s" repeatCount="indefinite"/><circle cx="12" cy="12" r="4" fill="currentColor" fill-opacity="0.1"><animate attributeName="fill-opacity" values="0.1;0.18;0.1" dur="3s" repeatCount="indefinite"/><animate attributeName="r" values="4;4.25;4" dur="3s" repeatCount="indefinite"/></circle><g stroke-opacity="1"><animate attributeName="stroke-opacity" values="1;0.6;1" dur="3s" repeatCount="indefinite"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></g></g>',
    'windy':           '<path d="M12.8 19.6A2 2 0 1 0 14 16H2" stroke-dasharray="22" stroke-dashoffset="0"><animate attributeName="stroke-dashoffset" values="0;-3;0" dur="2.5s" repeatCount="indefinite"/></path><path d="M17.5 8a2.5 2.5 0 1 1 2 4H2" stroke-dasharray="26" stroke-dashoffset="0"><animate attributeName="stroke-dashoffset" values="0;-4;0" dur="3s" begin="0.3s" repeatCount="indefinite"/></path><path d="M9.8 4.4A2 2 0 1 1 11 8H2" stroke-dasharray="18" stroke-dashoffset="0"><animate attributeName="stroke-dashoffset" values="0;-3;0" dur="2s" begin="0.6s" repeatCount="indefinite"/></path>',
    'windy-variant':   '<path d="M10 2v8" stroke-opacity="0.5"/><path d="M12.8 21.6A2 2 0 1 0 14 18H2" stroke-dasharray="22" stroke-dashoffset="0"><animate attributeName="stroke-dashoffset" values="0;-3;0" dur="2.5s" repeatCount="indefinite"/></path><path d="M17.5 10a2.5 2.5 0 1 1 2 4H2" stroke-dasharray="26" stroke-dashoffset="0"><animate attributeName="stroke-dashoffset" values="0;-4;0" dur="3s" begin="0.3s" repeatCount="indefinite"/></path><g stroke-opacity="0.5"><animate attributeName="stroke-opacity" values="0.5;0.8;0.5" dur="2s" repeatCount="indefinite"/><path d="m6 6 4 4 4-4"/></g>',
    'exceptional':     '<g><animateTransform attributeName="transform" type="rotate" values="0 12 12;360 12 12" dur="30s" repeatCount="indefinite"/><circle cx="12" cy="12" r="4" fill="currentColor" fill-opacity="0.1"><animate attributeName="fill-opacity" values="0.1;0.18;0.1" dur="3s" repeatCount="indefinite"/><animate attributeName="r" values="4;4.25;4" dur="3s" repeatCount="indefinite"/></circle><g stroke-opacity="1"><animate attributeName="stroke-opacity" values="1;0.6;1" dur="3s" repeatCount="indefinite"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></g></g>',
    'default':         '<g><animateTransform attributeName="transform" type="translate" values="0,0;0.6,0;0,0;-0.6,0;0,0" dur="6s" repeatCount="indefinite"/><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" fill="currentColor" fill-opacity="0.08"/></g>'
});
// Colored weather icon glyphs remixed from Meteocons by Bas Milius (https://github.com/basmilius/meteocons), MIT License.
const AWC_COLORED_ICONS = Object.freeze({
    'clear-night':        '<defs><linearGradient id="mo" x1="5" y1="3" x2="15" y2="20" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#86c3db"/><stop offset=".5" stop-color="#86c3db"/><stop offset="1" stop-color="#5eafcf"/></linearGradient></defs><path d="M20.6 13.5A8.6 8.6 0 0 1 11 3.9 8.5 8.5 0 1 0 20.6 13.5Z" fill="url(#mo)" stroke="#72b9d5" stroke-width="0.6" stroke-linejoin="round"><animateTransform attributeName="transform" type="rotate" values="-12 12 12;7 12 12;-12 12 12" dur="6s" repeatCount="indefinite"/></path>',
    'cloudy':             '<g><animateTransform attributeName="transform" type="translate" values="-1 0;1 0;-1 0" dur="6s" repeatCount="indefinite"/><defs><linearGradient id="cl1" x1="7" y1="4" x2="14" y2="19" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f3f7fe"/><stop offset=".55" stop-color="#f3f7fe"/><stop offset="1" stop-color="#deeafb"/></linearGradient></defs><path d="M18.5 18.5H7a5 5 0 0 1-.4-9.98A7 7 0 0 1 19.6 11h.4a4 4 0 0 1-1.5 7.5Z" fill="url(#cl1)" stroke="#e6effc" stroke-width="0.5" stroke-miterlimit="10"/></g>',
    'fog':                '<defs><linearGradient id="fg" x1="7" y1="4" x2="14" y2="19" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#d4d7dd"/><stop offset=".55" stop-color="#d4d7dd"/><stop offset="1" stop-color="#bec1c6"/></linearGradient></defs><path d="M17 19H8a4 4 0 0 1-.3-7.99A5.5 5.5 0 0 1 18 12.5a3.25 3.25 0 0 1-1 6.5Z" fill="url(#fg)" stroke="#cfd3d9" stroke-width="0.5" stroke-miterlimit="10"/><path d="M5 20.5h10" stroke="#a9aeb6" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="6 3"><animate attributeName="stroke-dashoffset" values="0;9" dur="3s" repeatCount="indefinite"/></path><path d="M8 22.7h10" stroke="#a9aeb6" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="6 3"><animate attributeName="stroke-dashoffset" values="0;-9" dur="4s" repeatCount="indefinite"/></path>',
    'hail':               '<defs><linearGradient id="ha" x1="7" y1="4" x2="14" y2="19" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f3f7fe"/><stop offset=".55" stop-color="#f3f7fe"/><stop offset="1" stop-color="#deeafb"/></linearGradient></defs><path d="M17 19H8a4 4 0 0 1-.3-7.99A5.5 5.5 0 0 1 18 12.5a3.25 3.25 0 0 1-1 6.5Z" fill="url(#ha)" stroke="#e6effc" stroke-width="0.5" stroke-miterlimit="10"/><g fill="#86c3db" stroke="none"><circle cx="8" cy="21" r="1.1"><animate attributeName="cy" values="19.6;21.4;20.6;21.4" dur="1s" begin="0.0s" repeatCount="indefinite"/></circle><circle cx="12" cy="21" r="1.1"><animate attributeName="cy" values="19.6;21.4;20.6;21.4" dur="1s" begin="0.25s" repeatCount="indefinite"/></circle><circle cx="16" cy="21" r="1.1"><animate attributeName="cy" values="19.6;21.4;20.6;21.4" dur="1s" begin="0.5s" repeatCount="indefinite"/></circle></g>',
    'lightning':          '<defs><linearGradient id="li" x1="7" y1="4" x2="14" y2="19" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f3f7fe"/><stop offset=".55" stop-color="#f3f7fe"/><stop offset="1" stop-color="#deeafb"/></linearGradient></defs><path d="M17 19H8a4 4 0 0 1-.3-7.99A5.5 5.5 0 0 1 18 12.5a3.25 3.25 0 0 1-1 6.5Z" fill="url(#li)" stroke="#e6effc" stroke-width="0.5" stroke-miterlimit="10"/><defs><linearGradient id="bo" x1="10" y1="13" x2="14" y2="23" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f7b23b"/><stop offset=".5" stop-color="#f7b23b"/><stop offset="1" stop-color="#f59e0b"/></linearGradient></defs><path d="M13.4 13 9.5 18.7h2.7l-2.2 4.6 6.3-7.1h-3.2l2.1-3.2z" fill="url(#bo)" stroke="#f6a823" stroke-width="0.4" stroke-linejoin="round"><animate attributeName="opacity" values="1;1;0.2;1;0.4;1;1" dur="3s" repeatCount="indefinite"/></path>',
    'lightning-rainy':    '<defs><linearGradient id="lr" x1="7" y1="4" x2="14" y2="19" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f3f7fe"/><stop offset=".55" stop-color="#f3f7fe"/><stop offset="1" stop-color="#deeafb"/></linearGradient></defs><path d="M17 19H8a4 4 0 0 1-.3-7.99A5.5 5.5 0 0 1 18 12.5a3.25 3.25 0 0 1-1 6.5Z" fill="url(#lr)" stroke="#e6effc" stroke-width="0.5" stroke-miterlimit="10"/><g fill="none" stroke="#0b65ed" stroke-width="1.5" stroke-linecap="round"><path d="M8 19.4 8 21.8"><animate attributeName="opacity" values="1;0.2;1" dur="0.9s" begin="0.0s" repeatCount="indefinite"/></path><path d="M16 19.4 16 21.8"><animate attributeName="opacity" values="1;0.2;1" dur="0.9s" begin="0.3s" repeatCount="indefinite"/></path></g><defs><linearGradient id="bo" x1="10" y1="13" x2="14" y2="23" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f7b23b"/><stop offset=".5" stop-color="#f7b23b"/><stop offset="1" stop-color="#f59e0b"/></linearGradient></defs><path d="M13.4 13 9.5 18.7h2.7l-2.2 4.6 6.3-7.1h-3.2l2.1-3.2z" fill="url(#bo)" stroke="#f6a823" stroke-width="0.4" stroke-linejoin="round"><animate attributeName="opacity" values="1;1;0.2;1;0.4;1;1" dur="3s" repeatCount="indefinite"/></path>',
    'partlycloudy':       '<defs><linearGradient id="su2" x1="6" y1="3" x2="11" y2="12" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fbbf24"/><stop offset=".5" stop-color="#fbbf24"/><stop offset="1" stop-color="#f59e0b"/></linearGradient></defs><g><animateTransform attributeName="transform" type="rotate" values="0 9 8;45 9 8" dur="6s" repeatCount="indefinite"/><path d="M9 1.8v1.6M9 12.6v1.6M14.2 8h1.6M2.2 8h1.6M12.7 4.3l1.1-1.1M4.2 11.8l1.1-1.1M5.3 4.3 4.2 3.2M13.8 11.8l-1.1-1.1" fill="none" stroke="#fbbf24" stroke-width="1.3" stroke-linecap="round"/><circle cx="9" cy="8" r="3" fill="url(#su2)" stroke="#f8af18" stroke-width="0.5"/></g><g><animateTransform attributeName="transform" type="translate" values="-0.8 0;0.8 0;-0.8 0" dur="7s" repeatCount="indefinite"/><defs><linearGradient id="cl2" x1="7" y1="4" x2="14" y2="19" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f3f7fe"/><stop offset=".55" stop-color="#f3f7fe"/><stop offset="1" stop-color="#deeafb"/></linearGradient></defs><path d="M17 19H8a4 4 0 0 1-.3-7.99A5.5 5.5 0 0 1 18 12.5a3.25 3.25 0 0 1-1 6.5Z" fill="url(#cl2)" stroke="#e6effc" stroke-width="0.5" stroke-miterlimit="10"/></g>',
    'partlycloudy-night': '<defs><linearGradient id="mo2" x1="4" y1="2" x2="12" y2="14" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#86c3db"/><stop offset=".5" stop-color="#86c3db"/><stop offset="1" stop-color="#5eafcf"/></linearGradient></defs><path d="M13.8 8.8A5.5 5.5 0 0 1 8.3 3.3 5.4 5.4 0 1 0 13.8 8.8Z" fill="url(#mo2)" stroke="#72b9d5" stroke-width="0.5" stroke-linejoin="round"><animateTransform attributeName="transform" type="rotate" values="-10 9 7;6 9 7;-10 9 7" dur="6s" repeatCount="indefinite"/></path><g><animateTransform attributeName="transform" type="translate" values="-0.8 0;0.8 0;-0.8 0" dur="7s" repeatCount="indefinite"/><defs><linearGradient id="cl3" x1="7" y1="4" x2="14" y2="19" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f3f7fe"/><stop offset=".55" stop-color="#f3f7fe"/><stop offset="1" stop-color="#deeafb"/></linearGradient></defs><path d="M17 19H8a4 4 0 0 1-.3-7.99A5.5 5.5 0 0 1 18 12.5a3.25 3.25 0 0 1-1 6.5Z" fill="url(#cl3)" stroke="#e6effc" stroke-width="0.5" stroke-miterlimit="10"/></g>',
    'pouring':            '<defs><linearGradient id="po" x1="7" y1="4" x2="14" y2="19" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f3f7fe"/><stop offset=".55" stop-color="#f3f7fe"/><stop offset="1" stop-color="#deeafb"/></linearGradient></defs><path d="M17 19H8a4 4 0 0 1-.3-7.99A5.5 5.5 0 0 1 18 12.5a3.25 3.25 0 0 1-1 6.5Z" fill="url(#po)" stroke="#e6effc" stroke-width="0.5" stroke-miterlimit="10"/><g fill="none" stroke="#0b65ed" stroke-width="1.6" stroke-linecap="round"><path d="M8 18.8 6.8 22.6"><animate attributeName="opacity" values="1;0.2;1" dur="0.7s" begin="0.0s" repeatCount="indefinite"/></path><path d="M11 18.8 9.8 22.6"><animate attributeName="opacity" values="1;0.2;1" dur="0.7s" begin="0.18s" repeatCount="indefinite"/></path><path d="M14 18.8 12.8 22.6"><animate attributeName="opacity" values="1;0.2;1" dur="0.7s" begin="0.36s" repeatCount="indefinite"/></path><path d="M17 18.8 15.8 22.6"><animate attributeName="opacity" values="1;0.2;1" dur="0.7s" begin="0.54s" repeatCount="indefinite"/></path></g>',
    'rainy':              '<defs><linearGradient id="rn" x1="7" y1="4" x2="14" y2="19" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f3f7fe"/><stop offset=".55" stop-color="#f3f7fe"/><stop offset="1" stop-color="#deeafb"/></linearGradient></defs><path d="M17 19H8a4 4 0 0 1-.3-7.99A5.5 5.5 0 0 1 18 12.5a3.25 3.25 0 0 1-1 6.5Z" fill="url(#rn)" stroke="#e6effc" stroke-width="0.5" stroke-miterlimit="10"/><g fill="none" stroke="#0b65ed" stroke-width="1.6" stroke-linecap="round"><path d="M8 19.4 8 22.2"><animate attributeName="opacity" values="1;0.2;1" dur="1s" begin="0.0s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="0 -1;0 1;0 -1" dur="1s" begin="0.0s" repeatCount="indefinite" additive="sum"/></path><path d="M12 19.4 12 22.2"><animate attributeName="opacity" values="1;0.2;1" dur="1s" begin="0.3s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="0 -1;0 1;0 -1" dur="1s" begin="0.3s" repeatCount="indefinite" additive="sum"/></path><path d="M16 19.4 16 22.2"><animate attributeName="opacity" values="1;0.2;1" dur="1s" begin="0.6s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="0 -1;0 1;0 -1" dur="1s" begin="0.6s" repeatCount="indefinite" additive="sum"/></path></g>',
    'snowy':              '<defs><linearGradient id="sn" x1="7" y1="4" x2="14" y2="19" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f3f7fe"/><stop offset=".55" stop-color="#f3f7fe"/><stop offset="1" stop-color="#deeafb"/></linearGradient></defs><path d="M17 19H8a4 4 0 0 1-.3-7.99A5.5 5.5 0 0 1 18 12.5a3.25 3.25 0 0 1-1 6.5Z" fill="url(#sn)" stroke="#e6effc" stroke-width="0.5" stroke-miterlimit="10"/><g fill="#86c3db" stroke="none"><circle cx="8" cy="20.6" r="1"><animate attributeName="cy" values="19.8;21.400000000000002;19.8" dur="2.2s" begin="0.0s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0.4;1" dur="2.2s" begin="0.0s" repeatCount="indefinite"/></circle><circle cx="12" cy="21.8" r="1"><animate attributeName="cy" values="21.0;22.6;21.0" dur="2.2s" begin="0.35s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0.4;1" dur="2.2s" begin="0.35s" repeatCount="indefinite"/></circle><circle cx="16" cy="20.6" r="1"><animate attributeName="cy" values="19.8;21.400000000000002;19.8" dur="2.2s" begin="0.7s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0.4;1" dur="2.2s" begin="0.7s" repeatCount="indefinite"/></circle><circle cx="10" cy="22.8" r="1"><animate attributeName="cy" values="22.0;23.6;22.0" dur="2.2s" begin="1.05s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0.4;1" dur="2.2s" begin="1.05s" repeatCount="indefinite"/></circle><circle cx="14" cy="22.8" r="1"><animate attributeName="cy" values="22.0;23.6;22.0" dur="2.2s" begin="1.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0.4;1" dur="2.2s" begin="1.4s" repeatCount="indefinite"/></circle></g>',
    'snowy-rainy':        '<defs><linearGradient id="sr" x1="7" y1="4" x2="14" y2="19" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f3f7fe"/><stop offset=".55" stop-color="#f3f7fe"/><stop offset="1" stop-color="#deeafb"/></linearGradient></defs><path d="M17 19H8a4 4 0 0 1-.3-7.99A5.5 5.5 0 0 1 18 12.5a3.25 3.25 0 0 1-1 6.5Z" fill="url(#sr)" stroke="#e6effc" stroke-width="0.5" stroke-miterlimit="10"/><g fill="#86c3db" stroke="none"><circle cx="8" cy="20.6" r="1"><animate attributeName="cy" values="19.8;21.4;19.8" dur="2.2s" begin="0.0s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0.4;1" dur="2.2s" begin="0.0s" repeatCount="indefinite"/></circle><circle cx="14" cy="20.6" r="1"><animate attributeName="cy" values="19.8;21.4;19.8" dur="2.2s" begin="0.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0.4;1" dur="2.2s" begin="0.4s" repeatCount="indefinite"/></circle></g><g fill="none" stroke="#0b65ed" stroke-width="1.5" stroke-linecap="round"><path d="M11 19.8 11 22.4"><animate attributeName="opacity" values="1;0.2;1" dur="1s" begin="0.0s" repeatCount="indefinite"/></path><path d="M17 19.8 17 22.4"><animate attributeName="opacity" values="1;0.2;1" dur="1s" begin="0.3s" repeatCount="indefinite"/></path></g>',
    'sunny':              '<defs><linearGradient id="su" x1="8" y1="6" x2="14" y2="17" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fbbf24"/><stop offset=".5" stop-color="#fbbf24"/><stop offset="1" stop-color="#f59e0b"/></linearGradient></defs><g><animateTransform attributeName="transform" type="rotate" values="0 12 12;45 12 12" dur="6s" repeatCount="indefinite"/><path d="M12 2.5v2M12 19.5v2M19.5 12h2M2.5 12h2M17.3 6.7l1.4-1.4M5.3 18.7l1.4-1.4M6.7 6.7 5.3 5.3M18.7 18.7l-1.4-1.4" fill="none" stroke="#fbbf24" stroke-width="1.6" stroke-linecap="round"/><circle cx="12" cy="12" r="4.2" fill="url(#su)" stroke="#f8af18" stroke-width="0.6"/></g>',
    'windy':              '<g fill="none" stroke="#9aa3ae" stroke-width="1.7" stroke-linecap="round"><path d="M3 9h11a2.4 2.4 0 1 0-2.4-2.4"><animate attributeName="stroke-dashoffset" values="0;-3;0" dur="3s" repeatCount="indefinite"/></path><path d="M3 13h15a2.6 2.6 0 1 1-2.6 2.6"><animate attributeName="stroke-dashoffset" values="0;-4;0" dur="2.6s" begin="0.3s" repeatCount="indefinite"/></path><path d="M3 17h9a2.2 2.2 0 1 0-2.2 2.2"><animate attributeName="stroke-dashoffset" values="0;-3;0" dur="2.2s" begin="0.6s" repeatCount="indefinite"/></path></g>',
    'windy-variant':      '<g fill="none" stroke="#9aa3ae" stroke-width="1.7" stroke-linecap="round"><path d="M3 9h11a2.4 2.4 0 1 0-2.4-2.4"><animate attributeName="stroke-dashoffset" values="0;-3;0" dur="3s" repeatCount="indefinite"/></path><path d="M3 13h15a2.6 2.6 0 1 1-2.6 2.6"><animate attributeName="stroke-dashoffset" values="0;-4;0" dur="2.6s" begin="0.3s" repeatCount="indefinite"/></path><path d="M3 17h9a2.2 2.2 0 1 0-2.2 2.2"><animate attributeName="stroke-dashoffset" values="0;-3;0" dur="2.2s" begin="0.6s" repeatCount="indefinite"/></path></g>',
    'exceptional':        '<defs><linearGradient id="su" x1="8" y1="6" x2="14" y2="17" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fbbf24"/><stop offset=".5" stop-color="#fbbf24"/><stop offset="1" stop-color="#f59e0b"/></linearGradient></defs><g><animateTransform attributeName="transform" type="rotate" values="0 12 12;45 12 12" dur="6s" repeatCount="indefinite"/><path d="M12 2.5v2M12 19.5v2M19.5 12h2M2.5 12h2M17.3 6.7l1.4-1.4M5.3 18.7l1.4-1.4M6.7 6.7 5.3 5.3M18.7 18.7l-1.4-1.4" fill="none" stroke="#fbbf24" stroke-width="1.6" stroke-linecap="round"/><circle cx="12" cy="12" r="4.2" fill="url(#su)" stroke="#f8af18" stroke-width="0.6"/></g>',
    'default':            '<g><animateTransform attributeName="transform" type="translate" values="-1 0;1 0;-1 0" dur="6s" repeatCount="indefinite"/><defs><linearGradient id="cl1" x1="7" y1="4" x2="14" y2="19" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f3f7fe"/><stop offset=".55" stop-color="#f3f7fe"/><stop offset="1" stop-color="#deeafb"/></linearGradient></defs><path d="M18.5 18.5H7a5 5 0 0 1-.4-9.98A7 7 0 0 1 19.6 11h.4a4 4 0 0 1-1.5 7.5Z" fill="url(#cl1)" stroke="#e6effc" stroke-width="0.5" stroke-miterlimit="10"/></g>'
});
function parseCSSVal(v) {
    const s = String(v).trim(); if (!s || s === '0') return '0px';
    return /[%a-z]/i.test(s) ? s : s + 'px';
}
function parseAnchor(anchor) {
    if (anchor === 'center') return ['center', 'center']; if (anchor === 'left') return ['center', 'left'];
    if (anchor === 'right') return ['center', 'right'];
    return anchor.includes('-') ? anchor.split('-') : ['top', anchor];
}
function computeGauge(rawVal, min, max, colorRaw, thresholds, mode) {
    const range = max - min || 1;
    const progress = isNaN(rawVal) ? 0 : Math.max(0, Math.min(1, (rawVal - min) / range));
    const pct = (progress * 100).toFixed(1);
    const baseColor = (colorRaw && colorRaw !== 'auto') ? colorRaw : '';
    const valid = thresholds.filter(t => t.value !== '' && t.value !== undefined && t.color);
    let gradient = '', barGradient = '', hasSegments = false, effectiveColor = baseColor;
    if (valid.length && !isNaN(rawVal) && (mode === 'segments' || mode === 'gradient')) {
        const sorted = [...valid].sort((a, b) => parseFloat(a.value) - parseFloat(b.value));
        const toPct = (v) => (Math.max(0, Math.min(1, (parseFloat(v) - min) / range)) * 100).toFixed(1);
        const stops = [], barStops = [];
        for (let i = 0; i < sorted.length; i++) {
            const t = sorted[i], startPct = toPct(t.value);
            const endPct = i < sorted.length - 1 ? toPct(sorted[i + 1].value) : '100';
            if (mode === 'segments') {
                stops.push(`${t.color} ${startPct}%`, `${t.color} ${endPct}%`);
                if (progress > 0) {
                    const bStart = (parseFloat(startPct) / (progress * 100) * 100).toFixed(1);
                    const bEnd = (parseFloat(endPct) / (progress * 100) * 100).toFixed(1);
                    barStops.push(`${t.color} ${bStart}%`, `${t.color} ${bEnd}%`);
                }
            } else {
                stops.push(`${t.color} ${startPct}%`);
                if (progress > 0) {
                    const bStart = (parseFloat(startPct) / (progress * 100) * 100).toFixed(1);
                    barStops.push(`${t.color} ${bStart}%`);
                }
            }
        }
        if (stops.length) { hasSegments = true; gradient = stops.join(', '); }
        if (barStops.length) { barGradient = barStops.join(', '); }
    }
    if (valid.length && !isNaN(rawVal) && mode === 'solid') {
        const sorted = [...valid].sort((a, b) => parseFloat(a.value) - parseFloat(b.value));
        for (const t of sorted) { if (rawVal >= parseFloat(t.value)) effectiveColor = t.color; }
    }
    return { pct, gradient, barGradient, hasSegments, effectiveColor };
}
function fcFilterPast(raw, daily) {
    const now = new Date(), cut = daily ? new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() : now.getTime();
    return raw.filter(f => Date.parse(f.datetime) >= cut);
}
function fcFingerprint(fc) {
    if (!fc || !fc.length) return ''; let s = '' + fc.length;
    for (const f of fc) s += `|${f.datetime}|${f.condition}|${f.temperature}|${f.templow != null ? f.templow : ''}|${f.precipitation_probability != null ? f.precipitation_probability : ''}`;
    return s;
}
function fcLabel(dt, daily, locale) {
    const d = new Date(dt);
    return daily ? d.toLocaleDateString(locale, { weekday: 'short' }) : d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
}
const _AWC_FC_CACHE = new Map();
const _AWC_FC_CACHE_MAX = 50;
const _FC_UNIT_MAP = { temperature: 'temperature_unit', templow: 'temperature_unit', wind_speed: 'wind_speed_unit', precipitation: 'precipitation_unit', pressure: 'pressure_unit', visibility: 'visibility_unit', dew_point: 'temperature_unit' };
const _FC_UNIT_FALLBACK = { humidity: '%', precipitation_probability: '%', cloud_coverage: '%', wind_bearing: '°', uv_index: '' };
const POS_CLASSES = Object.freeze(['pos-top-left','pos-top-center','pos-top-right','pos-left','pos-center','pos-right','pos-bottom-left','pos-bottom-center','pos-bottom-right']);

class AtmosphericWeatherCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._animId = null;
        this._boundAnimate = this._animate.bind(this);
        this._lastFrameTime = 0;
        this._frameInterval = 1000 / 24;
        this._weatherState = 'default';
        this._isTimeNight = false;
        this._isThemeDark = false;
        this._lastState = null;
        this._stateInitialized = false;
        this._hasReceivedFirstHass = false;
        this._windKmh = 0;
        this._initialized = false;
        this._initializationComplete = false;
        this._isVisible = false;
        this._intersectionObserver = null;
        this._renderGate = { hasValidDimensions: false, hasFirstHass: false };
        this._resizeDebounceTimer = null;
        this._cachedDimensions = { width: 0, height: 0, dpr: 1 };
        this._lastInitWidth = 0;
        this._lastSnapshot = null;
        this._prevStyleSig = null;
        this._prevCcSig = null;
        this._prevWeatherClass = null;
        this._prevBottomFade = null;
        this._prevCardPadParsed = null;
        this._entityErrors = new Map();
        this._lastErrorLog = 0;
        this._hass = null;
        this._customCardElements = [];
        this._prevCustomCssClasses = null;
        this._boundVisibilityChange = this._handleVisibilityChange.bind(this);
        this._boundTap = this._handleTap.bind(this);
        this._boundDocVisibility = this._handleDocVisibility.bind(this);
        this._fcData = new Map();
        this._fcSubs = new Map();
        this._fcFmtCache = null;
        this._gl = null;
        this._glProg = null;
        this._glUniforms = null;
        this._shaderParams = null;
        this._shaderBank = null;
        this._activeShaderKey = null;
        this._glBuf = null;
        this._prevShaderParams = null;
        this._prevFxSpeed = null;
        this._glNoiseTex = null;
        this._glSeed = Math.random() * 1000;
        this._starHeroes = null;
        this._starDpr = 1;
        this._starMasterOpacity = 0;
        this._starBgCtx = null;
        this._starCtx = null;
        this._starBgPainted = false;
        this._currentBakedStarCount = 0;
        this._starsDirty = false;
        this._shootingStars = [];
        this._comets = [];
        this._weatherBgActive = false;
        this._weatherBgState = null;
        this._weatherBgDark = null;
        this._weatherBgResolved = null;
        this._simpleBgActive = false;
        this._simpleBgDark = null;
    }
    connectedCallback() {
        if (!this._resizeObserver) {
            this._resizeObserver = new ResizeObserver((entries) => {
                if (!entries.length) return;
                const entry = entries[0]; let w, h;
                if (entry.borderBoxSize && entry.borderBoxSize[0]) {
                    w = entry.borderBoxSize[0].inlineSize; h = entry.borderBoxSize[0].blockSize;
                } else {
                    w = entry.target.offsetWidth; h = entry.target.offsetHeight;
                }
                const changed = this._updateCanvasDimensions(w, h);
                if (!this._initializationComplete) {
                    this._tryInitialize();
                } else if (changed) {
                    this._scheduleResize();
                }
            });
        }
        if (!this._intersectionObserver) {
            this._intersectionObserver = new IntersectionObserver(this._boundVisibilityChange, { threshold: 0.01, rootMargin: '0px' });
        }
        if (this._elements && this._elements.root) {
            this._resizeObserver.observe(this._elements.root); this.addEventListener('click', this._boundTap);
            this._intersectionObserver.observe(this._elements.root);
        }
        document.addEventListener('visibilitychange', this._boundDocVisibility);
        if (this._initializationComplete) {
            this._startAnimation();
        } else if (this._renderGate.hasFirstHass) {
            this._tryInitialize();
        }
    }
    disconnectedCallback() {
        this._stopAnimation(); if (this._resizeObserver) this._resizeObserver.disconnect(); if (this._intersectionObserver) this._intersectionObserver.disconnect();
        if (this._marqueeObserver) this._marqueeObserver.disconnect(); this._marqueeObserver = null; for (const unsub of this._fcSubs.values()) unsub();
        this._fcSubs.clear();
        if (this._resizeDebounceTimer) {
            clearTimeout(this._resizeDebounceTimer); this._resizeDebounceTimer = null;
        }
        this._destroyGL();
        this._isVisible = false; this.removeEventListener('click', this._boundTap); document.removeEventListener('visibilitychange', this._boundDocVisibility); this._customCardElements = []; this._initializationComplete = false; this._lastSnapshot = null; this._starHeroes = null; this._starDpr = 1; this._starMasterOpacity = 0; this._starCtx = null; this._starBgCtx = null; this._starBgPainted = false; this._shootingStars = []; this._comets = [];
    }
    setConfig(config) {
        const prevAreaCount = this._areas ? this._areas.length : -1;
        this._config = config; this._areas = this._deriveAreas(this._config); this._allButtonsCache = null;
        if (this._areas.length !== prevAreaCount) this._areaRenderCache = null;
        this._initDOM();

        if (String(config.card_height).toLowerCase() === 'auto') {
            this.style.height = '100%'; this.style.minHeight = '0'; this.style.aspectRatio = 'auto';
        } else {
            const heightConfig = config.card_height || '200px';
            const cssHeight = typeof heightConfig === 'number' ? `${heightConfig}px` : heightConfig;
            this.style.height = cssHeight; this.style.minHeight = cssHeight; this.style.aspectRatio = 'auto';
        }
        if (this._elements && this._elements.imageSlot) {
            const slot = this._elements.imageSlot;
            const scale = config.image_scale !== undefined ? config.image_scale : 100;
            slot.style.height = `${scale}%`;
            const align = (config.image_alignment || 'top-right').toLowerCase(); slot.style.top = ''; slot.style.bottom = '';
            slot.style.left = ''; slot.style.right = ''; slot.style.transform = '';
            const padH = 'var(--_awc-pad-h, var(--awc-card-padding, var(--ha-space-4, 16px)))';
            const padV = 'var(--_awc-pad-v, var(--awc-card-padding, var(--ha-space-4, 16px)))';
            const [v, h] = align === 'center' ? ['center', 'center'] : align.split('-');
            const t = [];
            if (h === 'left') {
                slot.style.left = padH; slot.style.right = 'auto';
            } else if (h === 'center') {
                slot.style.left = '50%'; slot.style.right = 'auto'; t.push('translateX(-50%)');
            } else {
                slot.style.right = padH; slot.style.left = 'auto';
            }
            if (v === 'top') {
                slot.style.top = padV; slot.style.bottom = 'auto';
            } else if (v === 'center') {
                slot.style.top = '50%'; slot.style.bottom = 'auto'; t.push('translateY(-50%)');
            } else {
                slot.style.bottom = padV; slot.style.top = 'auto';
            }
            slot.style.transform = t.join(' ');
            const ox = config.image_x !== undefined ? String(config.image_x).trim() : '';
            const oy = config.image_y !== undefined ? String(config.image_y).trim() : '';
            if (ox || oy) {
                // Positive offset always increases the gap from the anchored edge.
                const flip = o => o.startsWith('-') ? o.slice(1) : `-${o}`;
                const unit = o => /[%a-z]/i.test(o) ? o : o + 'px';
                const oxe = ox && h === 'right' ? flip(ox) : ox;
                const oye = oy && v === 'bottom' ? flip(oy) : oy;
                const tx2 = oxe ? `translateX(${unit(oxe)})` : '';
                const ty2 = oye ? `translateY(${unit(oye)})` : '';
                const extra = [tx2, ty2].filter(Boolean).join(' ');
                slot.style.transform = t.length ? `${t.join(' ')} ${extra}` : extra;
            }
        }
        const root = this._elements.root;

        const hasTapAction = config.card_tap_action && config.card_tap_action.action && config.card_tap_action.action !== 'none';
        root.classList.toggle('clickable', !!hasTapAction);
        this._hasStatusFeature = !!(config.status_entity && (config.status_day || config.status_night)); this._customCardElements = []; this._prevCcSig = null;
        if (this._elements && this._elements.customCardsWrapper) {
            this._elements.customCardsWrapper.innerHTML = '';
            this._elements.customCardsWrapper.classList.toggle('has-cards', false);
            if (this._prevCustomCssClasses && this._prevCustomCssClasses.length) this._elements.customCardsWrapper.classList.remove(...this._prevCustomCssClasses);
            const userClasses = (config.custom_cards_css_class || '').split(' ').filter(Boolean);
            this._prevCustomCssClasses = userClasses.length ? userClasses : null;
            if (userClasses.length) this._elements.customCardsWrapper.classList.add(...userClasses);
        }
        const customCards = this._config.custom_cards;
        if (Array.isArray(customCards) && customCards.length > 0 && this._elements && this._elements.customCardsWrapper) {
            this._elements.customCardsWrapper.classList.add('has-cards'); const expectedConfig = this._config;
            window.loadCardHelpers().then(helpers => {
                const wrapper = this._elements && this._elements.customCardsWrapper; if (!wrapper) return; if (this._config !== expectedConfig) return;
                for (const cardConfig of customCards) {
                    if (!cardConfig || !cardConfig.type) continue; const el = helpers.createCardElement(cardConfig);
                    if (cardConfig.custom_width) {
                        el.style.width = cardConfig.custom_width; el.style.flex = 'none';
                    }
                    if (cardConfig.custom_height !== undefined) {
                        let ch = String(cardConfig.custom_height).trim(); if (!isNaN(ch) && ch !== '') ch += 'px'; el.style.height = ch;
                    }
                    this._customCardElements.push(el); wrapper.appendChild(el); if (this._hass) el.hass = this._hass;
                }
            });
        }
        this._lastSnapshot = null;
        this._prevCardPadParsed = null;
        this._nativeIconCache = null;
        this._areaStyleCache = null;
        for (const c of this._allButtons()) {
            if (c.forecast && c.entity) {
                const k = `${c.entity}|${c.forecast === 'hourly' ? 'hourly' : 'daily'}`;
                if (!this._fcData.has(k) && _AWC_FC_CACHE.has(k)) {
                    this._fcData.set(k, _AWC_FC_CACHE.get(k));
                }
            }
        }
        this._syncFc();
        this._weatherBgState = null;
        this._simpleBgDark = null;
        if (this._config.simple_background !== true && this._elements && this._elements.root) {
            this._elements.root.classList.remove('has-simple-bg');
            this._simpleBgActive = false;
        }
        this._applyConfigStyles();
        const disabled = this._areShadersDisabled();
        this._applyShaderDisabledState(disabled);
        if (disabled) { this._stopAnimation(); } else if (this._initializationComplete && this._isVisible) {
            if (!this._gl) this._initWebGL();
            this._startAnimation();
        }
    }
    set hass(hass) {
        if (!hass || !this._config) return; this._hass = hass;
        if (this._customCardElements.length > 0) { for (const child of this._customCardElements) child.hass = hass; }
        const cfg = this._config;
        const wObj = (cfg.weather_entity && hass.states[cfg.weather_entity]) || null;
        const sunObj = cfg.sun_entity ? hass.states[cfg.sun_entity] : null;
        const statusObj = cfg.status_entity ? hass.states[cfg.status_entity] : null;
        const themeObj = cfg.theme_entity ? hass.states[cfg.theme_entity] : null;
        if (this._lastSnapshot) {
            let changed = wObj !== this._refW || sunObj !== this._refSun
                || statusObj !== this._refStatus || themeObj !== this._refTheme;
            if (!changed) {
                const allButtons = this._allButtons();
                for (const s of allButtons) {
                    if (s.entity && hass.states[s.entity] !== (this._refButtonEntities ? this._refButtonEntities.get(s.entity) : undefined)) { changed = true; break; }
                    if (s.name_sensor && hass.states[s.name_sensor] !== (this._refButtonEntities ? this._refButtonEntities.get(s.name_sensor) : undefined)) { changed = true; break; }
                    if (s.sub_value_entity && hass.states[s.sub_value_entity] !== (this._refButtonEntities ? this._refButtonEntities.get(s.sub_value_entity) : undefined)) { changed = true; break; }
                    const condEntities = this._collectConditionEntities(s.visibility);
                    for (const ve of condEntities) { if (hass.states[ve] !== (this._refButtonEntities ? this._refButtonEntities.get(ve) : undefined)) { changed = true; break; } }
                    if (changed) break;
                }
            }
            if (!changed) return;
        }
        this._refW = wObj; this._refSun = sunObj; this._refStatus = statusObj; this._refTheme = themeObj;
        const refs = new Map(), allButtons = this._allButtons();
        for (const s of allButtons) {
            if (s.entity) refs.set(s.entity, hass.states[s.entity]);
            if (s.name_sensor) refs.set(s.name_sensor, hass.states[s.name_sensor]);
            if (s.sub_value_entity) refs.set(s.sub_value_entity, hass.states[s.sub_value_entity]);
            for (const ve of this._collectConditionEntities(s.visibility)) refs.set(ve, hass.states[ve]);
        }
        this._refButtonEntities = refs;
        const wEntity = wObj || FALLBACK_WEATHER;
        const sunEntity = sunObj;
        const statusEntity = statusObj;
        const themeEntity = themeObj;
        const haThemeDark = (hass.themes && hass.themes.darkMode) ? 'dark' : 'light';
        const botSig = allButtons.map(s => {
            if (!s.entity) return '';
            if (s.forecast) {
                const t = s.forecast === 'hourly' ? 'hourly' : 'daily';
                const fd = this._fcData.get(`${s.entity}|${t}`);
                return `fc:${s.entity}|${t}:${s.forecast_offset || 0}:${s.attribute || ''}:${(fd && fd.fp) || ''}`;
            }
            const e = hass.states[s.entity]; let sig; if (!e) sig = '|';
            else if (s.attribute) sig = `${e.attributes[s.attribute] != null ? e.attributes[s.attribute] : ''}|${e.attributes[`${s.attribute}_unit`] != null ? e.attributes[`${s.attribute}_unit`] : ''}`;
            else sig = `${e.state}|${e.attributes.unit_of_measurement || ''}`;
            if (s.name_sensor) {
                const ns = hass.states[s.name_sensor];
                if (ns) sig += `|ns:${s.name_attribute ? (ns.attributes[s.name_attribute] != null ? ns.attributes[s.name_attribute] : '') : ns.state}`;
            }
            if (s.sub_value_entity) {
                const sv = hass.states[s.sub_value_entity];
                if (sv) sig += `|sv:${s.sub_value_attribute ? (sv.attributes[s.sub_value_attribute] != null ? sv.attributes[s.sub_value_attribute] : '') : sv.state}`;
            }
            if (Array.isArray(s.visibility) && s.visibility.length) {
                for (const ve of this._collectConditionEntities(s.visibility)) {
                    const ves = hass.states[ve];
                    sig += `|vi:${ve}:${ves ? ves.state : ''}`;
                }
            }
            return sig;
        }).join('||');
        const lang = (hass.locale && hass.locale.language) || 'en';
        const snapshot = {
            weather: (wEntity && wEntity.state) || '',
            temp: (wEntity && wEntity.attributes && wEntity.attributes.temperature != null) ? wEntity.attributes.temperature : '',
            windSpeed: (wEntity && wEntity.attributes && wEntity.attributes.wind_speed != null) ? wEntity.attributes.wind_speed : '',
            windUnit: (wEntity && wEntity.attributes && wEntity.attributes.wind_speed_unit) || '',
            sun: (sunEntity && sunEntity.state) || '',
            sunElev: (sunEntity && sunEntity.attributes && sunEntity.attributes.elevation != null) ? sunEntity.attributes.elevation : '',
            theme: (themeEntity && themeEntity.state) || '',
            haThemeDark,
            status: (statusEntity && statusEntity.state) || '',
            botSig,
            lang
        };
        if (this._lastSnapshot && !this._hasSnapshotChanged(this._lastSnapshot, snapshot)) return;
        this._lastSnapshot = snapshot;
        if (!wEntity) return;
        const isNight = this._resolveAxes(sunEntity).isNight;
        const hasNightChanged = this._isTimeNight !== isNight;
        this._isTimeNight = isNight;
        const colorMode = (cfg.card_color_mode || '').toLowerCase();
        let themeDark;
        if (colorMode === 'light') {
            themeDark = false;
        } else if (colorMode === 'dark') {
            themeDark = true;
        } else if (colorMode === 'ha_theme') {
            themeDark = !!(hass.themes && hass.themes.darkMode);
        } else if (cfg.theme_entity) {
            const te = themeEntity || sunEntity;
            themeDark = te ? te.state.toLowerCase() === 'below_horizon' : isNight;
        } else {
            themeDark = isNight;
        }
        const hasDarkChanged = this._isThemeDark !== themeDark;
        this._isThemeDark = themeDark;
        const adaptEnabled = cfg.theme_adapt !== false;
        const dashDark = !!(hass.themes && hass.themes.darkMode);
        let adaptMode = '';
        if (adaptEnabled) {
            if (dashDark && !themeDark) adaptMode = 'dim';
            else if (!dashDark && themeDark) adaptMode = 'lift';
        }
        if (this._prevAdaptMode !== adaptMode) {
            this._prevAdaptMode = adaptMode;
            if (this._elements) {
                this._elements.root.classList.toggle('adapt-dim', adaptMode === 'dim');
                this._elements.root.classList.toggle('adapt-lift', adaptMode === 'lift');
            }
        }
        let weatherState = (wEntity.state || 'default').toLowerCase();
        if (isNight && weatherState === 'sunny') weatherState = 'clear-night';
        if (!isNight && weatherState === 'clear-night') weatherState = 'sunny';
        if (weatherState === 'exceptional' && isNight) weatherState = 'clear-night';
        this._weatherState = weatherState;
        this._updateSchemeStyles(isNight, weatherState); this._updateTextElements(hass, wEntity, lang, weatherState);
        const windSpeedRaw = this._getEntityAttribute(wEntity, 'wind_speed', 0);
        const windSpeed = typeof windSpeedRaw === 'number' ? windSpeedRaw : parseFloat(windSpeedRaw) || 0;
        const wsu = ((wEntity && wEntity.attributes && wEntity.attributes.wind_speed_unit) || 'km/h').toLowerCase();
        const toKmh = wsu.includes('m/s') ? 3.6 : wsu.includes('mph') ? 1.609 : wsu.includes('kn') ? 1.852 : 1;
        this._windKmh = windSpeed * toKmh;
        this._updateImage(hass, isNight, weatherState);
        this._updateStars(null, weatherState);
        this._updateWeatherBg(weatherState, themeDark);
        this._updateSimpleBg(themeDark);
        if (!this._hasReceivedFirstHass) {
            this._hasReceivedFirstHass = true; this._renderGate.hasFirstHass = true; this._lastState = weatherState;
            this._stateInitialized = true; this._shaderParams = this._weatherToUniforms();
            this._syncFc(); this._tryInitialize();
            return;
        }
        this._handleWeatherChange(weatherState, hasNightChanged || hasDarkChanged);
    }
    static async getConfigElement() {
        return document.createElement(EDITOR_NAME);
    }
    static getStubConfig(hass) {
        const weatherEntity = hass ? Object.keys(hass.states).find(e => e.startsWith('weather.')) || '' : '';
        return {
            weather_entity: weatherEntity,
            sun_entity: 'sun.sun',
            theme_entity: 'sun.sun',
            card_height: '130px',
            button_areas: [
                {
                    position: 'top-left',
                    padding: '0 4px',
                    buttons: [
                        { entity: weatherEntity, text_size: '30px', hide_icon: true, padding: '0px 4px', fancy_unit: true }
                    ]
                },
                {
                    position: 'right',
                    padding: '0px 8px',
                    gap: '8px',
                    background: true,
                    buttons: [
                        {
                            entity: weatherEntity,
                            hide_value: true,
                            icon: 'weather',
                            icon_size: '34px',
                            type: 'ring',
                            ring_thresholds: [
                                { value: '0', color: 'rgba(128, 191, 172, 0.8)' },
                                { value: '1', color: 'rgba(145, 199, 163, 0.8)' },
                                { value: '2', color: 'rgba(163, 206, 155, 0.8)' },
                                { value: '3', color: 'rgba(195, 214, 141, 0.8)' },
                                { value: '4', color: 'rgba(224, 219, 129, 0.8)' },
                                { value: '5', color: 'rgba(235, 198, 113, 0.8)' },
                                { value: '6', color: 'rgba(235, 168, 103, 0.8)' },
                                { value: '7', color: 'rgba(230, 138, 99, 0.8)' },
                                { value: '8', color: 'rgba(219, 106, 99, 0.8)' },
                                { value: '9', color: 'rgba(201, 79, 100, 0.8)' },
                                { value: '10', color: 'rgba(168, 64, 115, 0.8)' }
                            ],
                            padding: '14px',
                            ring_gap: '10px',
                            ring_width: '4px',
                            ring_threshold_mode: 'gradient',
                            ring_max: '11',
                            attribute: 'uv_index'
                        }
                    ]
                },
                {
                    position: 'bottom-left',
                    background: true,
                    button_text_size: '14px',
                    align: 'center',
                    buttons: [
                        {
                            text_size: '12px',
                            sub_value_size: '12px',
                            label_size: '12px',
                            hide_icon: true,
                            padding: '8px 12px',
                            value_weight: '700',
                            text_gap: '5px',
                            entity: weatherEntity,
                            name: 'Today: ',
                            forecast: 'daily',
                            attribute: 'temperature',
                            forecast_precision: 0,
                            sub_value_attribute: 'templow',
                            text_order: 'label,sub,value',
                            sub_value_format: ' –',
                            sub_value_weight: '700'
                        }
                    ]
                }
            ],
            grid_options: { rows: 'auto' }
        };
    }
    getCardSize() { return 4; }
    getGridOptions() {
        return { columns: 12, rows: 'auto', min_columns: 2, min_rows: 2 };
    }
    _deriveAreas(config) {
        const arr = config && config.button_areas;
        if (Array.isArray(arr) && arr.length > 0) {
            return arr.map(a => {
                if (!a || typeof a !== 'object') return { buttons: [] };
                const buttons = Array.isArray(a.buttons)
                    ? a.buttons.map(s => {
                        if (!s || typeof s !== 'object') return {};
                        const c = { ...s };
                        c._ringThresholdsSig = JSON.stringify(s.ring_thresholds || '');
                        c._barThresholdsSig = JSON.stringify(s.bar_thresholds || '');
                        c._colorThresholdsSig = JSON.stringify(s.color_thresholds || '');
                        return c;
                    })
                    : [];
                return { ...a, buttons };
            });
        }
        return [];
    }
    _allButtons() {
        if (this._allButtonsCache) return this._allButtonsCache;
        const out = [];
        for (const area of this._areas) {
            for (const button of area.buttons) out.push(button);
        }
        this._allButtonsCache = out;
        return out;
    }
    _resolveAxes(sunEntity) {
        const sunState = sunEntity ? sunEntity.state.toLowerCase() : null;
        const isNight = sunState === 'below_horizon';
        return { isNight };
    }
    _getEntityState(hass, entityId, defaultValue = null) {
        if (!hass || !entityId) return defaultValue; const entity = hass.states[entityId];
        if (!entity) {
            this._trackEntityError(entityId, 'not_found');
            return defaultValue;
        }
        if (entity.state === 'unavailable' || entity.state === 'unknown') {
            this._trackEntityError(entityId, entity.state);
            return defaultValue;
        }
        this._entityErrors.delete(entityId);
        return entity;
    }
    _getEntityAttribute(entity, attribute, defaultValue = null) {
        if (!entity || !entity.attributes) return defaultValue; const value = entity.attributes[attribute];
        return value !== undefined && value !== null ? value : defaultValue;
    }
    _trackEntityError(entityId, errorType) {
        const now = Date.now(), existing = this._entityErrors.get(entityId);
        if (!existing || existing.type !== errorType) {
            this._entityErrors.set(entityId, { type: errorType, since: now });
            if (now - this._lastErrorLog > 60000) {
                console.warn(`AWC: Entity "${entityId}" is ${errorType}`);
                this._lastErrorLog = now;
            }
        }
    }
    _resolveSensorValue(hass, entityId, attribute) {
        let value, unit = '', haFormatted = false, rawNumeric = null; const sensor = hass.states[entityId];
        if (!sensor) {
            value = 'N/A';
        } else if (attribute) {
            const raw = sensor.attributes[attribute];
            if (raw === undefined || raw === null) {
                value = 'N/A';
            } else if (typeof hass.formatEntityAttributeValue === 'function') {
                value = hass.formatEntityAttributeValue(sensor, attribute); haFormatted = true; rawNumeric = raw;
            } else {
                value = raw;
                unit = sensor.attributes[`${attribute}_unit`] || sensor.attributes.unit_of_measurement || '';
            }
        } else if (typeof hass.formatEntityState === 'function') {
            value = hass.formatEntityState(sensor); haFormatted = true; rawNumeric = sensor.state;
        } else {
            value = sensor.state; unit = sensor.attributes.unit_of_measurement || '';
        }
        let formatted = value;
        if (!haFormatted) {
            formatted = this._formatNumber(value);
        }
        const isoSource = attribute
            ? (sensor && sensor.attributes && sensor.attributes[attribute])
            : (sensor && sensor.state);
        if (typeof isoSource === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(isoSource)) {
            const d = new Date(isoSource);
            if (!isNaN(d)) {
                const locale = (hass.locale && hass.locale.language) || undefined;
                const now = new Date();
                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const targetStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                const dayDiff = Math.round((targetStart - todayStart) / 86400000);
                const timePart = d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
                if (dayDiff === 0) {
                    formatted = timePart;
                } else if (dayDiff >= -1 && dayDiff <= 6) {
                    formatted = `${d.toLocaleDateString(locale, { weekday: 'short' })}, ${timePart}`;
                } else {
                    formatted = d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
                }
                haFormatted = true;
            }
        }
        return { formatted, unit, sensor, haFormatted, rawNumeric };
    }
    _syncFc() {
        if (!(this._hass && this._hass.connection)) return; const needed = new Set();
        for (const c of this._allButtons()) if (c.forecast && c.entity) needed.add(`${c.entity}|${c.forecast === 'hourly' ? 'hourly' : 'daily'}`);
        for (const [k, unsub] of this._fcSubs) if (!needed.has(k)) { unsub(); this._fcSubs.delete(k); this._fcData.delete(k); }
        for (const k of needed) if (!this._fcSubs.has(k)) this._startFcSub(k);
    }
    _startFcSub(key) {
        const [entity, type] = key.split('|'), hass = this._hass; if (!(hass && hass.connection)) return;
        if (!this._fcData.has(key) && _AWC_FC_CACHE.has(key)) {
            this._fcData.set(key, _AWC_FC_CACHE.get(key));
        }
        hass.connection.subscribeMessage(
            (msg) => this._onFcData(key, msg.forecast != null ? msg.forecast : [], type === 'daily'),
            { type: 'weather/subscribe_forecast', forecast_type: type, entity_id: entity }
        ).then(unsub => {
            if (!this.isConnected || (!this._fcSubs.has(key) && !this._allButtons().some(c => c.forecast && c.entity === entity))) { unsub(); return; }
            this._fcSubs.set(key, unsub);
        }).catch(() => {
            const poll = async () => {
                try {
                    const res = await this._hass.callWS({ type: 'call_service', domain: 'weather', service: 'get_forecasts', target: { entity_id: entity }, service_data: { type }, return_response: true });
                    const fcData = res && (res[entity] || (res.response && res.response[entity]));
                    this._onFcData(key, (fcData && fcData.forecast) != null ? fcData.forecast : [], type === 'daily');
                } catch (_) {}
            };
            poll(); const timer = setInterval(poll, 30 * 60_000); this._fcSubs.set(key, () => clearInterval(timer));
        });
    }
    _onFcData(key, raw, daily) {
        const processed = fcFilterPast(raw, daily), fp = fcFingerprint(processed);
        const _existing = this._fcData.get(key);
        if (_existing && _existing.fp === fp) return;
        const entry = { processed, fp };
        this._fcData.set(key, entry); this._lastSnapshot = null;
        _AWC_FC_CACHE.set(key, entry);
        if (_AWC_FC_CACHE.size > _AWC_FC_CACHE_MAX) {
            const oldest = _AWC_FC_CACHE.keys().next().value;
            _AWC_FC_CACHE.delete(oldest);
        }
    }
    _resolveFcValue(hass, button, lang) {
        const type = button.forecast === 'hourly' ? 'hourly' : 'daily', offset = Math.max(0, parseInt(button.forecast_offset, 10) || 0);
        const _fcEntry = this._fcData.get(`${button.entity}|${type}`);
        const fc = _fcEntry && _fcEntry.processed;
        if (!fc || !fc.length) return { formatted: '', unit: '', condition: null, datetime: null, loading: true };
        const entry = fc[Math.min(offset, fc.length - 1)];
        if (!entry) return { formatted: '', unit: '', condition: null, datetime: null, loading: true };
        const attr = button.attribute;
        if (!attr || attr === 'condition') {
            let label = entry.condition || '—';
            if (entry.condition && typeof hass.localize === 'function') label = hass.localize(`component.weather.entity_component._.state.${entry.condition}`) || label;
            return { formatted: label, unit: '', condition: entry.condition, datetime: entry.datetime, entry };
        }
        const raw = entry[attr];
        if (raw == null) return { formatted: 'N/A', unit: '', condition: entry.condition, datetime: entry.datetime, entry };
        const _buttonState = hass.states[button.entity];
        const w = _buttonState && _buttonState.attributes;
        const unit = (w && w[`${attr}_unit`]) || (_FC_UNIT_MAP[attr] && w && w[_FC_UNIT_MAP[attr]]) || _FC_UNIT_FALLBACK[attr] || '';
        let formatted = raw;
        const precision = button.forecast_precision !== undefined ? button.forecast_precision : 0;
        const fmt = (precision !== undefined && precision !== null)
            ? this._getFcFmt(lang, precision) : null;
        formatted = this._formatNumber(raw, fmt);
        return { formatted, unit, condition: entry.condition, datetime: entry.datetime, entry };
    }
    _getFcFmt(lang, precision) {
        const key = `${lang}|${precision}`;
        if ((this._fcFmtCache && this._fcFmtCache[0]) === key) return this._fcFmtCache[1];
        const fmt = new Intl.NumberFormat(lang, { maximumFractionDigits: precision, minimumFractionDigits: 0 });
        this._fcFmtCache = [key, fmt];
        return fmt;
    }
    _cssVar(el, prop, val, cacheKey) {
        if (!this._cssVarCache) this._cssVarCache = {};
        if (this._cssVarCache[cacheKey] === val) return;
        this._cssVarCache[cacheKey] = val;
        if (val) el.style.setProperty(prop, val);
        else el.style.removeProperty(prop);
    }
    _formatNumber(raw, fmt) {
        if (raw === null || raw === '' || isNaN(parseFloat(raw)) || !isFinite(raw)) return String(raw ?? '');
        const f = fmt || this._numFmt;
        return f ? f.format(raw) : String(raw);
    }
    _collectConditionEntities(conditions) {
        const out = [];
        if (!Array.isArray(conditions)) return out;
        for (const c of conditions) {
            if (!c) continue;
            if (c.entity) out.push(c.entity);
            if (c.condition === 'and' || c.condition === 'or' || c.condition === 'not') {
                out.push(...this._collectConditionEntities(c.conditions));
            }
        }
        return out;
    }
    _evaluateCondition(c, hass) {
        if (!c || !c.condition) return true;
        switch (c.condition) {
            case 'state': {
                if (!c.entity) return true;
                const stateObj = hass.states[c.entity];
                if (!stateObj) return false;
                const val = stateObj.state;
                if (c.state != null) {
                    const match = Array.isArray(c.state) ? c.state : [c.state];
                    return match.some(s => String(s) === val);
                }
                if (c.state_not != null) {
                    const match = Array.isArray(c.state_not) ? c.state_not : [c.state_not];
                    return match.every(s => String(s) !== val);
                }
                return true;
            }
            case 'numeric_state': {
                if (!c.entity) return true;
                const stateObj = hass.states[c.entity];
                if (!stateObj) return false;
                const raw = c.attribute ? stateObj.attributes[c.attribute] : stateObj.state;
                const val = parseFloat(raw);
                if (isNaN(val)) return false;
                if (c.above != null && val <= parseFloat(c.above)) return false;
                if (c.below != null && val >= parseFloat(c.below)) return false;
                return true;
            }
            case 'screen': {
                if (!c.media_query) return true;
                return window.matchMedia(c.media_query).matches;
            }
            case 'user': {
                if (!Array.isArray(c.users) || !hass.user) return true;
                return c.users.includes(hass.user.id);
            }
            case 'and': {
                if (!Array.isArray(c.conditions)) return true;
                return c.conditions.every(sub => this._evaluateCondition(sub, hass));
            }
            case 'or': {
                if (!Array.isArray(c.conditions)) return true;
                return c.conditions.some(sub => this._evaluateCondition(sub, hass));
            }
            case 'not': {
                if (!Array.isArray(c.conditions)) return true;
                return c.conditions.every(sub => !this._evaluateCondition(sub, hass));
            }
            default:
                return true;
        }
    }
    _checkButtonVisibility(button, hass) {
        return !Array.isArray(button.visibility) || !button.visibility.length || button.visibility.every(c => this._evaluateCondition(c, hass));
    }
    _checkAreaVisibility(area, hass) { return this._checkButtonVisibility(area, hass); }
    _hasSnapshotChanged(prev, next) {
        for (const k in next) if (prev[k] !== next[k]) return true;
        return false;
    }
    _calculateStatusImage(hass, isNight) {
        if (!this._hasStatusFeature) return null; const entityId = this._config.status_entity; const stateObj = this._getEntityState(hass, entityId);
        if (!stateObj || !stateObj.state) return null; const state = stateObj.state.toLowerCase();
        if (ACTIVE_STATES.includes(state)) {
            return isNight
                ? (this._config.status_night || this._config.status_day)
                : (this._config.status_day || this._config.status_night);
        }
        return null;
    }
    _handleWeatherChange(weatherState, hasNightChanged) {
        const stateChanged = this._lastState !== weatherState;
        this._lastState = weatherState;
        if (stateChanged || hasNightChanged) {
            this._shaderParams = this._weatherToUniforms();
            this._startAnimation();
        }
    }

    static _buildStyles() {
        return `
            :host { display: block; width: 100%; position: relative; background: transparent !important; min-height: 200px; }
            #card-root { position: relative; width: 100%; height: 100%; z-index: var(--awc-stack-order, 1); overflow: hidden; overflow: clip; background: transparent; display: block; transform: translateZ(0); will-change: transform; contain: layout style paint; border-radius: var(--awc-card-border-radius, var(--ha-card-border-radius, 12px)); box-shadow: var(--ha-card-box-shadow, 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12)); background-color: transparent; border-width: var(--awc-card-border-width, var(--ha-card-border-width, 0px)); border-style: solid; border-color: var(--ha-card-border-color, var(--divider-color, #e0e0e0)); box-sizing: border-box; }
            #card-root.clickable { cursor: pointer; -webkit-tap-highlight-color: transparent; }
            #card-root.clickable:active { transform: scale(0.98); transition: transform 0.15s cubic-bezier(0.2, 0, 0.2, 1); }
            #card-root.clickable:not(:active) { transition: transform 0.4s cubic-bezier(0.2, 0, 0.2, 1); }

            #card-root.scheme-day { --awc-text-color: var(--awc-text-day, #2c2c2e); --_button-shadow-avail: var(--awc-button-text-shadow, var(--awc-text-shadow-day, 0 1px 2px rgba(255, 255, 255, 0.85), 0 0 6px rgba(255, 255, 255, 0.5))); --_button-no-bg-shadow: none; --_text-bg: rgba(255, 255, 255, 0.25); --_text-bg-border: rgba(255, 255, 255, 0.2); }
            #card-root.scheme-day .contrast { --_text-bg: rgba(255,255,255,0.52); --_contrast-shadow: inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.08); }
            #card-root.scheme-day .frosted { --_text-bg: rgba(255,255,255,0.18); --_text-bg-border: rgba(255,255,255,0.32); --_frosted-inset: inset 0 1px 2px rgba(0,0,0,0.12), inset 0 -1px 1px rgba(0,0,0,0.06); }
            #card-root.scheme-day .has-icon-bg.with-bg.frosted { --_stacked-icon-border: 1px solid rgba(255,255,255,0.22); }
            #card-root.scheme-day .has-icon-bg.with-bg.contrast { --_stacked-icon-shadow: 0 2px 6px rgba(0,0,0,0.18), 0 1px 2px rgba(0,0,0,0.12); }
            #card-root.scheme-night { --awc-text-color: var(--awc-text-night, #ffffff); --_button-shadow-avail: var(--awc-button-text-shadow, var(--awc-text-shadow-night, 0 1px 3px rgba(0, 0, 0, 0.9), 0 2px 6px rgba(0, 0, 0, 0.6))); --_button-no-bg-shadow: none; --_text-bg: rgba(0, 0, 0, 0.35); --_text-bg-border: rgba(255, 255, 255, 0.08); }
            #card-root.scheme-night .contrast { --_text-bg: rgba(0,0,0,0.58); --_contrast-shadow: inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.3); }
            #card-root.scheme-night .frosted { --_text-bg: rgba(0,0,0,0.26); --_text-bg-border: rgba(255,255,255,0.10); --_frosted-inset: inset 0 1px 2px rgba(0,0,0,0.25), inset 0 -1px 1px rgba(0,0,0,0.15); }
            #card-root.scheme-night .has-icon-bg.with-bg.frosted { --_stacked-icon-border: 1px solid rgba(255,255,255,0.08); }
            #card-root.scheme-night .has-icon-bg.with-bg.contrast { --_stacked-icon-shadow: 0 2px 6px rgba(0,0,0,0.28), 0 1px 2px rgba(0,0,0,0.18); }
            #card-root.is-offscreen .awc-marquee-host .awc-marquee-track { animation-play-state: paused; }
            #gl-canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; filter: brightness(var(--awc-bg-brightness, 1)) saturate(var(--awc-bg-saturation, 1)); border-radius: inherit; will-change: contents; z-index: 1; }
            #star-bg-canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; border-radius: inherit; z-index: 2; }
            #star-canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; border-radius: inherit; will-change: contents; z-index: 3; }

            #awc-sunrays { position: absolute; inset: 0; pointer-events: none; overflow: hidden; border-radius: inherit; z-index: 3; visibility: hidden; mix-blend-mode: screen; -webkit-mask-image: linear-gradient(135deg, white 20%, rgba(255,255,255,0.48) 60%, transparent 90%); mask-image: linear-gradient(135deg, white 20%, rgba(255,255,255,0.48) 60%, transparent 90%); }
            #card-root.has-sunrays #awc-sunrays { visibility: visible; }
            #awc-sunrays::before, #awc-sunrays::after { content: ''; }
            #awc-sunrays::before, #awc-sunrays::after, #awc-sunrays b { position: absolute; inset: -30%; display: block; font-weight: inherit; will-change: transform, opacity; }
            #awc-sunrays::before { background: linear-gradient(42deg, transparent 2%, rgba(255,247,205,0.48) 4%, rgba(255,250,220,0.12) 12%, transparent 16%, transparent 24%, rgba(255,250,215,0.36) 27%, rgba(255,252,230,0.10) 34%, transparent 38%, transparent 50%, rgba(255,245,200,0.54) 52%, rgba(255,250,220,0.24) 60%, rgba(255,252,230,0.06) 68%, transparent 72%, transparent 82%, rgba(255,250,220,0.26) 84%, transparent 92%); animation: awc-ray-a 3s ease-in-out infinite alternate; }
            #awc-sunrays::after { background: linear-gradient(48deg, transparent 0%, rgba(255,248,210,0.42) 3%, rgba(255,250,225,0.12) 18%, transparent 22%, transparent 36%, rgba(255,245,200,0.48) 39%, rgba(255,250,220,0.18) 52%, transparent 58%, transparent 70%, rgba(255,248,215,0.36) 73%, rgba(255,252,230,0.10) 84%, transparent 88%); animation: awc-ray-b 6s ease-in-out infinite alternate; }
            #awc-sunrays b { background: linear-gradient(36deg, transparent 6%, rgba(255,252,225,0.30) 9%, transparent 14%, transparent 30%, rgba(255,248,205,0.46) 33%, rgba(255,250,220,0.22) 44%, rgba(255,252,230,0.05) 52%, transparent 56%, transparent 66%, rgba(255,250,220,0.18) 69%, transparent 78%); animation: awc-ray-c 2s ease-in-out infinite alternate; }
            @keyframes awc-ray-a { from { transform: translate(-5%, -3%); opacity: 0.36; } to { transform: translate(3%, 2%); opacity: 1; } }
            @keyframes awc-ray-b { from { transform: translate(4%, -2%); opacity: 0.42; } to { transform: translate(-3%, 3%); opacity: 1; } }
            @keyframes awc-ray-c { from { transform: translate(-3%, 3%); opacity: 0.30; } to { transform: translate(3%, -2%); opacity: 1; } }
            #card-root.has-sunrays #awc-sunglow { visibility: visible; }

            #card-root.weather-partlycloudy #awc-sunglow { --awc-glow-core: 255, 240, 210; --awc-glow-warm: 255, 200, 125; }
            #awc-sunglow { position: absolute; inset: 0; pointer-events: none; overflow: hidden; border-radius: inherit; z-index: 4; visibility: hidden; --awc-glow-core: 255, 255, 240; --awc-glow-warm: 255, 225, 150; background: radial-gradient(circle at 0% 0%, rgba(var(--awc-glow-core), 0.18) 0%, rgba(var(--awc-glow-core), 0.11) 12%, rgba(var(--awc-glow-warm), 0.06) 28%, transparent 46%), radial-gradient(ellipse 130% 100% at 5% 8%, rgba(var(--awc-glow-warm), 0.10) 0%, rgba(var(--awc-glow-warm), 0.04) 32%, transparent 62%), linear-gradient(135deg, rgba(var(--awc-glow-warm), 0.06) 0%, rgba(var(--awc-glow-warm), 0.02) 32%, transparent 58%), radial-gradient(ellipse at 28% 22%, rgba(var(--awc-glow-warm), 0.04) 0%, rgba(var(--awc-glow-warm), 0.01) 38%, transparent 65%); }
            #awc-sunglow::before, #awc-sunglow::after { content: ''; position: absolute; }
            #awc-sunglow::before { top: -42%; left: -42%; width: 105%; height: 105%; background: radial-gradient(circle, rgba(var(--awc-glow-core), 0.14) 0%, rgba(var(--awc-glow-core), 0.07) 18%, rgba(var(--awc-glow-warm), 0.04) 38%, transparent 58%), radial-gradient(ellipse 75% 110%, rgba(var(--awc-glow-warm), 0.06) 0%, transparent 52%); animation: awc-glow-pulse 4s ease-in-out infinite alternate; }
            #awc-sunglow::after { top: -22%; left: -22%; width: 88%; height: 88%; background: radial-gradient(ellipse 115% 80%, rgba(var(--awc-glow-core), 0.08) 0%, rgba(var(--awc-glow-warm), 0.03) 28%, transparent 52%), radial-gradient(circle, rgba(var(--awc-glow-warm), 0.04) 0%, transparent 48%); animation: awc-glow-shift 7s ease-in-out infinite alternate; }
            @keyframes awc-glow-pulse { from { opacity: 0.09; transform: scale(1); } to { opacity: 0.20; transform: scale(1.18); } }
            @keyframes awc-glow-shift { from { transform: translate(-5%, -5%) scale(0.92); opacity: 0.10; } to { transform: translate(5%, 5%) scale(1.10); opacity: 0.20; } }

            #card-root.shaders-off { background: var(--ha-card-background, var(--card-background-color, var(--primary-background-color))); }
            #awc-bottom-fade { position: absolute; inset: 0; pointer-events: none; z-index: 4; display: none; background: linear-gradient(to bottom, transparent 0%, transparent var(--awc-fade-start, 30%), var(--awc-fade-color, var(--ha-card-background, var(--card-background-color, var(--primary-background-color)))) 100%); }
            #card-root.has-bottom-fade #awc-bottom-fade { display: block; }
            #awc-theme-adapt { position: absolute; inset: 0; pointer-events: none; z-index: 4; border-radius: inherit; }
            #card-root.adapt-dim #awc-theme-adapt { backdrop-filter: brightness(0.75) contrast(1.15) saturate(0.9); -webkit-backdrop-filter: brightness(0.75) contrast(1.15) saturate(0.9); }
            #card-root.adapt-lift #awc-theme-adapt { backdrop-filter: brightness(1.3) contrast(0.92) saturate(0.85); -webkit-backdrop-filter: brightness(1.12) contrast(0.92) saturate(1.05); }
            #awc-weather-bg { position: absolute; inset: 0; pointer-events: none; border-radius: inherit; z-index: 1; display: none; overflow: hidden; overflow: clip; }
            #awc-weather-bg > img, #awc-weather-bg > video { display: block; width: 100%; height: 100%; object-fit: cover; border: none; outline: none; filter: brightness(var(--awc-bg-brightness, 1)) saturate(var(--awc-bg-saturation, 1)); }
            #awc-weather-bg > video { muted: true; }
            #card-root.has-weather-bg #awc-weather-bg { display: block; }
            #card-root.has-weather-bg #gl-canvas { display: none; }
            #awc-simple-bg { position: absolute; inset: 0; pointer-events: none; border-radius: inherit; z-index: 1; display: none; overflow: hidden; overflow: clip; }
            #card-root.has-bg-filter #awc-simple-bg { filter: brightness(var(--awc-bg-brightness, 1)) saturate(var(--awc-bg-saturation, 1)); }
            .awc-sky-layer { position: absolute; inset: 0; border-radius: inherit; }
            #awc-sky-base { transition: background 1.5s ease; background: var(--_sky-base, var(--awc-simple-bg-day, linear-gradient(135deg, #B6CBD3 0%, #CDD4CB 50%, #E5DDC9 100%))); }
            #awc-sky-glow { will-change: background-position; background-image: var(--_sky-glow, none); background-repeat: no-repeat; background-size: 200% 200%; animation: awc-sky-glow 18s ease-in-out infinite; }
            @keyframes awc-sky-glow { 0%, 100% { background-position: 30% 25%; } 25% { background-position: 70% 18%; } 50% { background-position: 78% 70%; } 75% { background-position: 22% 78%; } }
            @media (prefers-reduced-motion: reduce) { #awc-sky-glow { animation: none; will-change: auto; } }
            #card-root.scheme-day.weather-sunny #awc-simple-bg { --_sky-base: var(--awc-simple-base-sunny-day, radial-gradient(ellipse 135% 118% at 19% 16%, #dbe8f0 0%, #cfdfeb 28%, #c2d7e7 55%, #b4cde3 80%, #a9c4df 100%)); --_sky-glow: var(--awc-simple-glow-sunny-day, radial-gradient(ellipse 92% 82% at 23% 21%, rgba(251,248,239,0.55) 0%, rgba(251,248,239,0.34) 31%, rgba(251,248,239,0.16) 57%, transparent 80%)); }
            #card-root.scheme-night.weather-sunny #awc-simple-bg { --_sky-base: var(--awc-simple-base-sunny-night, radial-gradient(ellipse 135% 118% at 19% 16%, #1b2e46 0%, #152138 28%, #10182c 55%, #0e1426 80%, #0c1122 100%)); --_sky-glow: var(--awc-simple-glow-sunny-night, radial-gradient(ellipse 92% 82% at 23% 21%, rgba(46,85,112,0.80) 0%, rgba(46,85,112,0.52) 31%, rgba(46,85,112,0.28) 57%, transparent 80%)); }
            #card-root.scheme-day.weather-clear-night #awc-simple-bg { --_sky-base: var(--awc-simple-base-clear-night-day, radial-gradient(ellipse 135% 118% at 19% 16%, #dbe8f0 0%, #cfdfeb 28%, #c2d7e7 55%, #b4cde3 80%, #a9c4df 100%)); --_sky-glow: var(--awc-simple-glow-clear-night-day, radial-gradient(ellipse 92% 82% at 23% 21%, rgba(251,248,239,0.55) 0%, rgba(251,248,239,0.34) 31%, rgba(251,248,239,0.16) 57%, transparent 80%)); }
            #card-root.scheme-night.weather-clear-night #awc-simple-bg { --_sky-base: var(--awc-simple-base-clear-night-night, radial-gradient(ellipse 135% 118% at 19% 16%, #192f48 0%, #13223a 28%, #0e172d 55%, #0c1225 80%, #0a0e1f 100%)); --_sky-glow: var(--awc-simple-glow-clear-night-night, radial-gradient(ellipse 92% 82% at 23% 21%, rgba(44,91,114,0.80) 0%, rgba(44,91,114,0.52) 31%, rgba(44,91,114,0.28) 57%, transparent 80%)); }
            #card-root.scheme-day.weather-partlycloudy #awc-simple-bg { --_sky-base: var(--awc-simple-base-partlycloudy-day, radial-gradient(ellipse 135% 118% at 19% 16%, #d4e4ed 0%, #c7dbe8 28%, #bad2e4 55%, #adc8e0 80%, #a2bfdd 100%)); --_sky-glow: var(--awc-simple-glow-partlycloudy-day, radial-gradient(ellipse 92% 82% at 23% 21%, rgba(248,246,241,0.55) 0%, rgba(248,246,241,0.34) 31%, rgba(248,246,241,0.16) 57%, transparent 80%)); }
            #card-root.scheme-night.weather-partlycloudy #awc-simple-bg { --_sky-base: var(--awc-simple-base-partlycloudy-night, radial-gradient(ellipse 135% 118% at 19% 16%, #1d2d44 0%, #172236 28%, #11192a 55%, #0f1525 80%, #0e1220 100%)); --_sky-glow: var(--awc-simple-glow-partlycloudy-night, radial-gradient(ellipse 92% 82% at 23% 21%, rgba(52,79,106,0.80) 0%, rgba(52,79,106,0.52) 31%, rgba(52,79,106,0.28) 57%, transparent 80%)); }
            #card-root.scheme-day.weather-cloudy #awc-simple-bg { --_sky-base: var(--awc-simple-base-cloudy-day, radial-gradient(ellipse 135% 118% at 19% 16%, #d2dee5 0%, #d1e0da 28%, #d2ddd0 55%, #dde1ce 80%, #e5decd 100%)); --_sky-glow: var(--awc-simple-glow-cloudy-day, radial-gradient(ellipse 92% 82% at 23% 21%, rgba(248,247,241,0.55) 0%, rgba(248,247,241,0.34) 31%, rgba(248,247,241,0.16) 57%, transparent 80%)); }
            #card-root.scheme-night.weather-cloudy #awc-simple-bg { --_sky-base: var(--awc-simple-base-cloudy-night, radial-gradient(ellipse 135% 118% at 19% 16%, #28323f 0%, #212a35 28%, #1a212b 55%, #161c24 80%, #13171e 100%)); --_sky-glow: var(--awc-simple-glow-cloudy-night, radial-gradient(ellipse 92% 82% at 23% 21%, rgba(72,86,104,0.78) 0%, rgba(72,86,104,0.50) 31%, rgba(72,86,104,0.26) 57%, transparent 80%)); }
            #card-root.scheme-day.weather-windy #awc-simple-bg { --_sky-base: var(--awc-simple-base-windy-day, radial-gradient(ellipse 135% 118% at 19% 16%, #d6e9eb 0%, #cae1e6 28%, #bdd7e2 55%, #b0cddd 80%, #a4c5da 100%)); --_sky-glow: var(--awc-simple-glow-windy-day, radial-gradient(ellipse 92% 82% at 23% 21%, rgba(241,249,247,0.55) 0%, rgba(241,249,247,0.34) 31%, rgba(241,249,247,0.16) 57%, transparent 80%)); }
            #card-root.scheme-night.weather-windy #awc-simple-bg { --_sky-base: var(--awc-simple-base-windy-night, radial-gradient(ellipse 135% 118% at 19% 16%, #1d333e 0%, #172734 28%, #121d2a 55%, #101824 80%, #0e1420 100%)); --_sky-glow: var(--awc-simple-glow-windy-night, radial-gradient(ellipse 92% 82% at 23% 21%, rgba(50,94,103,0.80) 0%, rgba(50,94,103,0.52) 31%, rgba(50,94,103,0.28) 57%, transparent 80%)); }
            #card-root.scheme-day.weather-windy-variant #awc-simple-bg { --_sky-base: var(--awc-simple-base-windy-variant-day, radial-gradient(ellipse 135% 118% at 19% 16%, #d6e6e3 0%, #cce1e2 28%, #c1d8de 55%, #b3cfd9 80%, #a8c5d6 100%)); --_sky-glow: var(--awc-simple-glow-windy-variant-day, radial-gradient(ellipse 92% 82% at 23% 21%, rgba(242,248,244,0.55) 0%, rgba(242,248,244,0.34) 31%, rgba(242,248,244,0.16) 57%, transparent 80%)); }
            #card-root.scheme-night.weather-windy-variant #awc-simple-bg { --_sky-base: var(--awc-simple-base-windy-variant-night, radial-gradient(ellipse 135% 118% at 19% 16%, #21363b 0%, #1a2a31 28%, #141f27 55%, #121a22 80%, #10151e 100%)); --_sky-glow: var(--awc-simple-glow-windy-variant-night, radial-gradient(ellipse 92% 82% at 23% 21%, rgba(55,98,94,0.80) 0%, rgba(55,98,94,0.52) 31%, rgba(55,98,94,0.28) 57%, transparent 80%)); }
            #card-root.scheme-day.weather-exceptional #awc-simple-bg { --_sky-base: var(--awc-simple-base-exceptional-day, radial-gradient(ellipse 135% 118% at 19% 16%, #cbe1ec 0%, #b9d5e7 28%, #a8c8e2 55%, #98bbde 80%, #8bb0da 100%)); --_sky-glow: var(--awc-simple-glow-exceptional-day, radial-gradient(ellipse 92% 82% at 23% 21%, rgba(250,248,239,0.55) 0%, rgba(250,248,239,0.34) 31%, rgba(250,248,239,0.16) 57%, transparent 80%)); }
            #card-root.scheme-night.weather-exceptional #awc-simple-bg { --_sky-base: var(--awc-simple-base-exceptional-night, radial-gradient(ellipse 135% 118% at 19% 16%, #182d49 0%, #12213b 28%, #0e172d 55%, #0c1225 80%, #0a0e1f 100%)); --_sky-glow: var(--awc-simple-glow-exceptional-night, radial-gradient(ellipse 92% 82% at 23% 21%, rgba(41,92,117,0.80) 0%, rgba(41,92,117,0.52) 31%, rgba(41,92,117,0.28) 57%, transparent 80%)); }
            #card-root.scheme-day.weather-default #awc-simple-bg { --_sky-base: var(--awc-simple-base-default-day, radial-gradient(ellipse 135% 118% at 19% 16%, #d9e5ec 0%, #cddce8 28%, #c1d3e3 55%, #b4c9de 80%, #a9c0da 100%)); --_sky-glow: var(--awc-simple-glow-default-day, radial-gradient(ellipse 92% 82% at 23% 21%, rgba(247,246,242,0.55) 0%, rgba(247,246,242,0.34) 31%, rgba(247,246,242,0.16) 57%, transparent 80%)); }
            #card-root.scheme-night.weather-default #awc-simple-bg { --_sky-base: var(--awc-simple-base-default-night, radial-gradient(ellipse 135% 118% at 19% 16%, #1d2e44 0%, #162237 28%, #11182b 55%, #0e1323 80%, #0c0f1d 100%)); --_sky-glow: var(--awc-simple-glow-default-night, radial-gradient(ellipse 92% 82% at 23% 21%, rgba(49,85,109,0.80) 0%, rgba(49,85,109,0.52) 31%, rgba(49,85,109,0.28) 57%, transparent 80%)); }
            #card-root.scheme-day.weather-fog #awc-simple-bg { --_sky-base: var(--awc-simple-base-fog-day, radial-gradient(ellipse 135% 118% at 19% 16%, #ece7df 0%, #dde8df 28%, #dae0e4 55%, #d2d9df 80%, #cbd3dc 100%)); --_sky-glow: var(--awc-simple-glow-fog-day, radial-gradient(ellipse 92% 82% at 23% 21%, rgba(247,246,242,0.55) 0%, rgba(247,246,242,0.34) 31%, rgba(247,246,242,0.16) 57%, transparent 80%)); }
            #card-root.scheme-night.weather-fog #awc-simple-bg { --_sky-base: var(--awc-simple-base-fog-night, radial-gradient(ellipse 135% 118% at 19% 16%, #2b333b 0%, #252c33 28%, #1f252b 55%, #1b2026 80%, #181c21 100%)); --_sky-glow: var(--awc-simple-glow-fog-night, radial-gradient(ellipse 92% 82% at 23% 21%, rgba(86,97,108,0.74) 0%, rgba(86,97,108,0.48) 31%, rgba(86,97,108,0.24) 57%, transparent 80%)); }
            #card-root.scheme-day.weather-snowy #awc-simple-bg { --_sky-base: var(--awc-simple-base-snowy-day, radial-gradient(ellipse 135% 118% at 19% 16%, #e4edf1 0%, #d7e2eb 28%, #c9d6e5 55%, #bdcadf 80%, #b3bfdb 100%)); --_sky-glow: var(--awc-simple-glow-snowy-day, radial-gradient(ellipse 92% 82% at 23% 21%, rgba(241,246,248,0.55) 0%, rgba(241,246,248,0.34) 31%, rgba(241,246,248,0.16) 57%, transparent 80%)); }
            #card-root.scheme-night.weather-snowy #awc-simple-bg { --_sky-base: var(--awc-simple-base-snowy-night, radial-gradient(ellipse 135% 118% at 19% 16%, #233443 0%, #1c2938 28%, #17202e 55%, #141a28 80%, #111522 100%)); --_sky-glow: var(--awc-simple-glow-snowy-night, radial-gradient(ellipse 92% 82% at 23% 21%, rgba(54,91,109,0.80) 0%, rgba(54,91,109,0.52) 31%, rgba(54,91,109,0.28) 57%, transparent 80%)); }
            #card-root.scheme-day.weather-snowy-rainy #awc-simple-bg { --_sky-base: var(--awc-simple-base-snowy-rainy-day, radial-gradient(ellipse 135% 118% at 19% 16%, #d9e2e8 0%, #cad6e0 28%, #bbc9d9 55%, #adbcd2 80%, #a2b2cd 100%)); --_sky-glow: var(--awc-simple-glow-snowy-rainy-day, radial-gradient(ellipse 92% 82% at 23% 21%, rgba(242,246,247,0.55) 0%, rgba(242,246,247,0.34) 31%, rgba(242,246,247,0.16) 57%, transparent 80%)); }
            #card-root.scheme-night.weather-snowy-rainy #awc-simple-bg { --_sky-base: var(--awc-simple-base-snowy-rainy-night, radial-gradient(ellipse 135% 118% at 19% 16%, #232f39 0%, #1c252f 28%, #151c26 55%, #131821 80%, #11141d 100%)); --_sky-glow: var(--awc-simple-glow-snowy-rainy-night, radial-gradient(ellipse 92% 82% at 23% 21%, rgba(57,82,96,0.80) 0%, rgba(57,82,96,0.52) 31%, rgba(57,82,96,0.28) 57%, transparent 80%)); }
            #card-root.scheme-day.weather-hail #awc-simple-bg { --_sky-base: var(--awc-simple-base-hail-day, radial-gradient(ellipse 135% 118% at 19% 16%, #d4dde2 0%, #c4cfd9 28%, #b3c2d1 55%, #a3b4ca 80%, #97a9c4 100%)); --_sky-glow: var(--awc-simple-glow-hail-day, radial-gradient(ellipse 92% 82% at 23% 21%, rgba(243,246,247,0.55) 0%, rgba(243,246,247,0.34) 31%, rgba(243,246,247,0.16) 57%, transparent 80%)); }
            #card-root.scheme-night.weather-hail #awc-simple-bg { --_sky-base: var(--awc-simple-base-hail-night, radial-gradient(ellipse 135% 118% at 19% 16%, #202932 0%, #1a212a 28%, #141a22 55%, #11161e 80%, #0f121a 100%)); --_sky-glow: var(--awc-simple-glow-hail-night, radial-gradient(ellipse 92% 82% at 23% 21%, rgba(54,76,89,0.80) 0%, rgba(54,76,89,0.52) 31%, rgba(54,76,89,0.28) 57%, transparent 80%)); }
            #card-root.scheme-day.weather-rainy #awc-simple-bg { --_sky-base: var(--awc-simple-base-rainy-day, radial-gradient(ellipse 135% 118% at 19% 16%, #d7e3e5 0%, #c8d9dd 28%, #b9ced6 55%, #adc4d0 80%, #a4bccc 100%)); --_sky-glow: var(--awc-simple-glow-rainy-day, radial-gradient(ellipse 92% 82% at 23% 21%, rgba(242,247,247,0.55) 0%, rgba(242,247,247,0.34) 31%, rgba(242,247,247,0.16) 57%, transparent 80%)); }
            #card-root.scheme-night.weather-rainy #awc-simple-bg { --_sky-base: var(--awc-simple-base-rainy-night, radial-gradient(ellipse 135% 118% at 19% 16%, #22343a 0%, #1b2930 28%, #152027 55%, #121b22 80%, #10171e 100%)); --_sky-glow: var(--awc-simple-glow-rainy-night, radial-gradient(ellipse 92% 82% at 23% 21%, rgba(57,94,96,0.80) 0%, rgba(57,94,96,0.52) 31%, rgba(57,94,96,0.28) 57%, transparent 80%)); }
            #card-root.scheme-day.weather-pouring #awc-simple-bg { --_sky-base: var(--awc-simple-base-pouring-day, radial-gradient(ellipse 135% 118% at 19% 16%, #c8dbdf 0%, #b5ced6 28%, #a3c0ce 55%, #95b4c7 80%, #89aac2 100%)); --_sky-glow: var(--awc-simple-glow-pouring-day, radial-gradient(ellipse 92% 82% at 23% 21%, rgba(233,242,241,0.55) 0%, rgba(233,242,241,0.34) 31%, rgba(233,242,241,0.16) 57%, transparent 80%)); }
            #card-root.scheme-night.weather-pouring #awc-simple-bg { --_sky-base: var(--awc-simple-base-pouring-night, radial-gradient(ellipse 135% 118% at 19% 16%, #1d2f34 0%, #17262c 28%, #121d24 55%, #10191f 80%, #0d151b 100%)); --_sky-glow: var(--awc-simple-glow-pouring-night, radial-gradient(ellipse 92% 82% at 23% 21%, rgba(51,89,91,0.80) 0%, rgba(51,89,91,0.52) 31%, rgba(51,89,91,0.28) 57%, transparent 80%)); }
            #card-root.scheme-day.weather-lightning #awc-simple-bg { --_sky-base: var(--awc-simple-base-lightning-day, radial-gradient(ellipse 135% 118% at 19% 16%, #dddbca 0%, #c9cdb8 28%, #afbea7 55%, #97b5ab 80%, #8a9cad 100%)); --_sky-glow: var(--awc-simple-glow-lightning-day, radial-gradient(ellipse 92% 82% at 23% 21%, rgba(244,241,231,0.55) 0%, rgba(244,241,231,0.34) 31%, rgba(244,241,231,0.16) 57%, transparent 80%)); }
            #card-root.scheme-night.weather-lightning #awc-simple-bg { --_sky-base: var(--awc-simple-base-lightning-night, radial-gradient(ellipse 135% 118% at 19% 16%, #232838 0%, #1c2230 28%, #161b27 55%, #131722 80%, #10131c 100%)); --_sky-glow: var(--awc-simple-glow-lightning-night, radial-gradient(ellipse 92% 82% at 23% 21%, rgba(78,80,116,0.80) 0%, rgba(68,74,106,0.52) 31%, rgba(60,70,98,0.28) 57%, transparent 80%)); }
            #card-root.scheme-day.weather-lightning-rainy #awc-simple-bg { --_sky-base: var(--awc-simple-base-lightning-rainy-day, radial-gradient(ellipse 135% 118% at 19% 16%, #d3d2c0 0%, #b0c2ac 28%, #99b4a9 55%, #8baeb0 80%, #7f9aad 100%)); --_sky-glow: var(--awc-simple-glow-lightning-rainy-day, radial-gradient(ellipse 92% 82% at 23% 21%, rgba(234,232,220,0.55) 0%, rgba(234,232,220,0.34) 31%, rgba(234,232,220,0.16) 57%, transparent 80%)); }
            #card-root.scheme-night.weather-lightning-rainy #awc-simple-bg { --_sky-base: var(--awc-simple-base-lightning-rainy-night, radial-gradient(ellipse 135% 118% at 19% 16%, #29281f 0%, #1d231b 28%, #181f1c 55%, #131b1c 80%, #101519 100%)); --_sky-glow: var(--awc-simple-glow-lightning-rainy-night, radial-gradient(ellipse 92% 82% at 23% 21%, rgba(80,76,53,0.80) 0%, rgba(80,76,53,0.52) 31%, rgba(80,76,53,0.28) 57%, transparent 80%)); }
            #card-root.has-simple-bg #awc-simple-bg { display: block; }
            #card-root.has-simple-bg #gl-canvas { display: none; }
            #image-slot { position: absolute; top: 0; height: 100%; width: auto; user-select: none; pointer-events: none; box-sizing: border-box; z-index: 3; }
            #image-slot > img { display: block; height: 100%; width: auto; max-width: 100%; object-fit: contain; border: none; outline: none; }
            #image-slot > img[src=""],
            #image-slot > img:not([src]) { display: none; visibility: hidden; }
            #text-wrapper { position: absolute; inset: 0; pointer-events: none; box-sizing: border-box; overflow: visible; z-index: 5; }
            .awc-pos-slot { position: absolute; left: var(--_awc-pad-h, var(--awc-card-padding, 16px)); display: flex; gap: var(--awc-slot-gap, 8px); pointer-events: none; width: calc(100% - var(--_awc-pad-h, var(--awc-card-padding, 16px)) * 2); max-height: calc(100% - var(--_awc-pad-v, var(--awc-card-padding, 16px)) * 2); box-sizing: border-box; flex-direction: column; align-items: var(--_sa-h, flex-start); justify-content: var(--_sa-v, flex-start); }
            .awc-pos-slot:empty { display: none; }
            .awc-pos-slot.pos-top-left { top: var(--_awc-pad-v, var(--awc-card-padding, 16px)); --_sa-h: flex-start; --_sa-v: flex-start; }
            .awc-pos-slot.pos-top-center { top: var(--_awc-pad-v, var(--awc-card-padding, 16px)); --_sa-h: center; --_sa-v: flex-start; }
            .awc-pos-slot.pos-top-right { top: var(--_awc-pad-v, var(--awc-card-padding, 16px)); --_sa-h: flex-end; --_sa-v: flex-start; }
            .awc-pos-slot.pos-left { top: 50%; transform: translateY(-50%); --_sa-h: flex-start; --_sa-v: center; }
            .awc-pos-slot.pos-center { top: 50%; transform: translateY(-50%); --_sa-h: center; --_sa-v: center; }
            .awc-pos-slot.pos-right { top: 50%; transform: translateY(-50%); --_sa-h: flex-end; --_sa-v: center; }
            .awc-pos-slot.pos-bottom-left { bottom: var(--_awc-pad-v, var(--awc-card-padding, 16px)); --_sa-h: flex-start; --_sa-v: flex-end; }
            .awc-pos-slot.pos-bottom-center { bottom: var(--_awc-pad-v, var(--awc-card-padding, 16px)); --_sa-h: center; --_sa-v: flex-end; }
            .awc-pos-slot.pos-bottom-right { bottom: var(--_awc-pad-v, var(--awc-card-padding, 16px)); --_sa-h: flex-end; --_sa-v: flex-end; }
            .awc-pos-slot.stack-v { flex-direction: column; align-items: var(--_sa-h, flex-start); justify-content: var(--_sa-v, flex-start); }
            .awc-pos-slot.stack-h { flex-direction: row; align-items: var(--_sa-v, flex-start); justify-content: var(--_sa-h, flex-start); }
            .buttons-group { pointer-events: none; font-family: var(--ha-font-family, var(--paper-font-body1_-_font-family, sans-serif)); transition: color 0.3s ease, text-shadow 0.3s ease; min-width: 0; box-sizing: border-box; }
            .buttons-row,
            .button-free { color: var(--awc-text-color); }
            .button-sub { display: block; font-size: var(--awc-sub-size, 0.78em); opacity: var(--awc-sub-opacity, 0.7); font-weight: var(--awc-sub-weight, 500); line-height: 1.2; white-space: var(--awc-sub-wrap, nowrap); overflow: var(--awc-sub-visible, hidden); text-overflow: var(--awc-sub-overflow, ellipsis); flex: 0 0 auto; min-width: 0; }
            .button-val .fancy-unit,
            .button-sub .fancy-unit { font-size: 0.55em; font-weight: 500; opacity: 0.7; vertical-align: baseline; position: relative; top: -0.45em; margin-left: 3px; }
            .buttons-group { pointer-events: auto; width: var(--awc-row-width, auto); box-sizing: border-box; padding: var(--awc-container-padding, 0); }
            .buttons-group.has-row-wrap { width: var(--awc-row-width, auto); }
            .buttons-group.has-row-horizontal-scroll { height: var(--awc-row-height, auto); }
            .buttons-group.has-row-vertical-scroll { height: var(--awc-row-height, calc(100% - var(--_awc-pad-v, var(--awc-card-padding, 16px)) * 2)); }
            .buttons-group.grouped { border-radius: var(--awc-bottom-bg-radius, calc(var(--awc-card-border-radius, var(--ha-card-border-radius, 12px)) - 5px)); }
            .buttons-group.grouped.with-bg { --_bg: var(--awc-container-bg-color, var(--awc-bottom-bg-color, var(--_text-bg))); }
            :where(.buttons-group.grouped, .button).with-bg.contrast { background: var(--_bg); box-shadow: var(--awc-bg-shadow, var(--_contrast-shadow)); }
            :where(.buttons-group.grouped, .button).with-bg.frosted { background: var(--_bg); border: var(--awc-bg-border, 1px solid var(--_text-bg-border)); box-shadow: var(--awc-bg-shadow, var(--_frosted-inset, none)); backdrop-filter: var(--awc-bottom-bg-filter, blur(10px)); -webkit-backdrop-filter: var(--awc-bottom-bg-filter, blur(10px)); }
            :where(.buttons-group.grouped, .button).with-bg.theme { background: var(--ha-card-background, var(--card-background-color, var(--primary-background-color))); border: var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, var(--divider-color)); box-shadow: var(--ha-card-box-shadow, none); }
            .buttons-group.grouped.with-bg > .buttons-row .button.with-bg { background: none; border: none; box-shadow: none; backdrop-filter: none; -webkit-backdrop-filter: none; border-radius: 0; padding: var(--awc-buttons-padding, 0); }
            :where(.buttons-group.grouped.with-bg >) .buttons-row.has-separator:not(.row-grid) > .button { position: relative; overflow: visible; }
            :where(.buttons-group.grouped.with-bg >) .buttons-row.has-separator:not(.row-grid) > .button + .button::before { content: ""; position: absolute; pointer-events: none; top: 0; bottom: 0; inset-inline-start: calc((var(--awc-bottom-gap, 8px) / -2) - (var(--awc-separator-width, 2px) / 2)); width: var(--awc-separator-width, 2px); background: var(--awc-separator-color, color-mix(in srgb, currentColor 10%, transparent)); }
            :where(.buttons-group.grouped.with-bg >) .buttons-row.has-separator:not(.row-grid).row-vertical-scroll > .button + .button::before { top: calc((var(--awc-bottom-gap, 8px) / -2) - (var(--awc-separator-width, 2px) / 2)); bottom: auto; left: 0; right: 0; inset-inline-start: 0; width: auto; height: var(--awc-separator-width, 2px); }
            .buttons-row.has-separator:not(.row-grid) > .button { position: relative; overflow: visible; }
            .buttons-row.has-separator:not(.row-grid) > .button + .button::before { content: ""; position: absolute; pointer-events: none; top: 0; bottom: 0; inset-inline-start: calc((var(--awc-bottom-gap, 8px) / -2) - (var(--awc-separator-width, 2px) / 2)); width: var(--awc-separator-width, 2px); background: var(--awc-separator-color, color-mix(in srgb, currentColor 10%, transparent)); }
            .buttons-row.has-separator:not(.row-grid).row-vertical-scroll > .button + .button::before { top: calc((var(--awc-bottom-gap, 8px) / -2) - (var(--awc-separator-width, 2px) / 2)); bottom: auto; left: 0; right: 0; inset-inline-start: 0; width: auto; height: var(--awc-separator-width, 2px); }
            .buttons-row { font-size: var(--awc-bottom-font-size, 16px); font-weight: var(--awc-bottom-font-weight, 500); display: flex; align-items: center; gap: var(--awc-bottom-gap, 8px); width: 100%; box-sizing: border-box; pointer-events: auto; border-radius: inherit; }
            .buttons-row.row-wrap { flex-wrap: wrap; }
            .buttons-row.row-wrap[class*="pos-top"] { align-items: flex-start; }
            .buttons-row.row-wrap[class*="pos-bottom"] { align-items: flex-end; }
            .buttons-row.row-wrap.pos-left,
            .buttons-row.row-wrap.pos-right { align-items: center; }
            .buttons-row.row-horizontal-scroll { flex-wrap: nowrap; overflow-x: auto; overflow-y: hidden; height: 100%; scroll-snap-type: x proximity; scrollbar-width: none; -ms-overflow-style: none; pointer-events: auto; }
            .buttons-row.row-horizontal-scroll::-webkit-scrollbar { display: none; }
            .buttons-row.row-horizontal-scroll.has-visible-count { display: grid; grid-auto-flow: column; grid-auto-columns: var(--awc-button-basis); scroll-snap-type: x mandatory; }
            .buttons-row.row-horizontal-scroll.has-visible-count > .button { width: 100%; scroll-snap-align: start; }
            .buttons-row.row-vertical-scroll { flex-direction: column; flex-wrap: nowrap; overflow-y: auto; overflow-x: hidden; height: 100%; max-height: var(--awc-row-max-height, none); scroll-snap-type: y proximity; scrollbar-width: none; -ms-overflow-style: none; pointer-events: auto; }
            .buttons-row.row-vertical-scroll::-webkit-scrollbar { display: none; }
            .buttons-row.row-vertical-scroll.has-visible-count { display: grid; grid-auto-flow: row; grid-auto-rows: var(--awc-button-basis-v, auto); max-height: none; scroll-snap-type: y mandatory; }
            .buttons-row.row-vertical-scroll.has-visible-count > .button { height: 100%; scroll-snap-align: start; }
            .buttons-row.row-vertical-scroll:not(.has-visible-count)[class*="pos-bottom"] > :first-child { margin-block-start: auto; }
            .buttons-row.row-vertical-scroll:not(.has-visible-count).pos-center > :first-child { margin-block-start: auto; }
            .buttons-row.row-vertical-scroll:not(.has-visible-count).pos-center > :last-child { margin-block-end: auto; }
            .buttons-row.row-vertical-scroll[class*="right"] { align-items: flex-end; }
            .buttons-row.row-vertical-scroll.pos-top-center,
            .buttons-row.row-vertical-scroll.pos-center,
            .buttons-row.row-vertical-scroll.pos-bottom-center { align-items: center; }
            .buttons-row.row-grid { display: grid; grid-template-columns: repeat(var(--awc-row-columns, 1), minmax(0, 1fr)); align-items: stretch; row-gap: var(--awc-bottom-gap, 8px); column-gap: var(--awc-bottom-gap, 8px); }
            .buttons-row.row-wrap[class*="right"] { justify-content: flex-end; }
            .buttons-row.row-wrap.pos-top-center,
            .buttons-row.row-wrap.pos-center,
            .buttons-row.row-wrap.pos-bottom-center { justify-content: center; }
            .buttons-row.row-grid,
            .buttons-row.has-visible-count { align-items: stretch; }
            .buttons-row.row-grid > .button,
            .buttons-row.has-visible-count > .button { overflow: hidden; }
            .buttons-row.row-grid > .button > .button-content > .button-val,
            .buttons-row.has-visible-count > .button > .button-content > .button-val { flex: 0 1 auto; }
            /* Area-level alignment → button (buttons without own .align-* inherit area alignment) */
            .buttons-row.align-start:where(.row-grid, .has-visible-count) > .button:not(.align-start, .align-center, .align-end, .align-spread) { justify-content: flex-start; text-align: start; }
            .buttons-row.align-center:where(.row-grid, .has-visible-count) > .button:not(.align-start, .align-center, .align-end, .align-spread) { justify-content: center; text-align: center; }
            .buttons-row.align-end:where(.row-grid, .has-visible-count) > .button:not(.align-start, .align-center, .align-end, .align-spread) { justify-content: flex-end; text-align: end; }
            /* Area-level → inline buttons (not stacked/vertical) */
            .buttons-row.align-end > .button:not(.format-stacked, .format-vertical, .align-start, .align-center, .align-end, .align-spread) .button-content { flex: unset; }
            .buttons-row.align-end > .button:not(.format-stacked, .format-vertical, .align-start, .align-center, .align-end, .align-spread) .button-val { flex: 0 0 auto; }
            .buttons-row.align-center > .button:not(.format-stacked, .format-vertical, .align-start, .align-center, .align-end, .align-spread) { justify-content: center; }
            .buttons-row.align-center > .button:not(.format-stacked, .format-vertical, .align-start, .align-center, .align-end, .align-spread) .button-content { flex: unset; }
            .buttons-row.align-center > .button:not(.format-stacked, .format-vertical, .align-start, .align-center, .align-end, .align-spread) .button-val { flex: 0 0 auto; }
            .buttons-row.align-spread > .button:not(.format-stacked, .format-vertical, .align-start, .align-center, .align-end, .align-spread) { flex: 1 1 0; }
            .buttons-row.align-spread > .button:not(.format-stacked, .format-vertical, .align-start, .align-center, .align-end, .align-spread) .button-content { justify-content: flex-start; }
            .buttons-row.align-spread > .button:not(.format-stacked, .format-vertical, .align-start, .align-center, .align-end, .align-spread) .button-content > .button-val { margin-left: auto; }
            .buttons-row.align-spread > .button.no-name:not(.format-stacked, .format-vertical, .align-start, .align-center, .align-end, .align-spread) { justify-content: space-between; }
            .buttons-row.align-spread > .button.no-name:not(.format-stacked, .format-vertical, .align-start, .align-center, .align-end, .align-spread) .button-content { flex: 0 1 auto; }
            /* Area-level → stacked buttons */
            .buttons-row.align-end > .button.format-stacked:not(.align-start, .align-center, .align-end, .align-spread) { flex-direction: row-reverse; }
            .buttons-row.align-end > .button.format-stacked:not(.align-start, .align-center, .align-end, .align-spread) .button-content { align-items: flex-end; text-align: end; }
            .buttons-row.align-end > .button.format-stacked:not(.align-start, .align-center, .align-end, .align-spread).with-bg { padding: var(--awc-buttons-padding, 6px 6px 6px 10px); }
            .buttons-row.align-spread > .button.format-stacked:not(.align-start, .align-center, .align-end, .align-spread) { flex: 1 1 0; }
            .buttons-row.align-spread > .button.format-stacked:not(.align-start, .align-center, .align-end, .align-spread) .button-content { flex: 1 1 auto; }
            /* Area-level → vertical buttons */
            .buttons-row.align-start > .button.format-vertical:not(.align-start, .align-center, .align-end, .align-spread) { align-items: flex-start; text-align: start; }
            .buttons-row.align-start > .button.format-vertical:not(.align-start, .align-center, .align-end, .align-spread) .button-content { align-items: flex-start; text-align: start; }
            .buttons-row.align-end > .button.format-vertical:not(.align-start, .align-center, .align-end, .align-spread) { align-items: flex-end; text-align: end; }
            .buttons-row.align-end > .button.format-vertical:not(.align-start, .align-center, .align-end, .align-spread) .button-content { align-items: flex-end; text-align: end; }
            /* Position-based vertical alignment for stacked/vertical in non-scroll rows */
            .buttons-row[class*="pos-bottom"]:not(.has-visible-count) > .button.format-stacked,
            .buttons-row[class*="pos-bottom"]:not(.has-visible-count) > .button.format-vertical { align-content: end; }
            .buttons-row[class*="pos-top"]:not(.has-visible-count) > .button.format-stacked,
            .buttons-row[class*="pos-top"]:not(.has-visible-count) > .button.format-vertical { align-content: start; }
            .buttons-row:where(.pos-center, .pos-left, .pos-right):not(.has-visible-count) > :where(.button.format-stacked, .button.format-vertical),
            .buttons-row.has-visible-count > :where(.button.format-stacked, .button.format-vertical) { align-content: center; }
            .buttons-row[class*="pos-bottom"]:not(.has-visible-count).has-enhanced-child { align-items: flex-end; }
            .buttons-row[class*="pos-top"]:not(.has-visible-count).has-enhanced-child { align-items: flex-start; }
            /* Button layout: button > [icon][content > name,val]; format sets flex direction, gap sets spacing */
            /* Base button (flex row) */
            .button { display: flex; align-items: center; gap: var(--awc-button-gap, 6px); flex: 0 0 auto; min-width: 0; max-width: 100%; white-space: nowrap; box-sizing: border-box; scroll-snap-align: start; padding: var(--awc-buttons-padding, 0); cursor: pointer; -webkit-tap-highlight-color: transparent; transition: transform 0.4s cubic-bezier(0.2, 0, 0.2, 1), opacity 0.4s cubic-bezier(0.2, 0, 0.2, 1); }
            .button:active { transform: scale(0.94); opacity: 0.75; transition: transform 0.12s cubic-bezier(0.2, 0, 0.2, 1), opacity 0.12s cubic-bezier(0.2, 0, 0.2, 1); }
            /* Button icon */
            .button .button-icon { flex: 0 0 auto; display: flex; align-items: center; justify-content: center; padding: var(--awc-icon-padding, 0); }
            .button .button-icon ha-icon,
            .button .button-icon ha-state-icon { --mdc-icon-size: var(--awc-icon-size, 1.1em); opacity: 0.9; }
            .button .button-icon svg.awc-icon { display: block; width: var(--awc-icon-size, 1.1em); height: var(--awc-icon-size, 1.1em); opacity: 0.9; }
            .button .button-icon svg.awc-icon.awc-colored { opacity: 1; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.15)); }
            .button .button-icon img.custom-bottom-icon { display: block; height: var(--awc-icon-size, 1.1em); width: var(--awc-icon-size, 1.1em); object-fit: contain; }
            /* Button content wrapper (holds name + val) */
            .button .button-content { display: flex; flex-direction: row; align-items: center; gap: var(--awc-button-text-gap, 0.35em); min-width: 0; flex: 1 1 auto; }
            /* Button name */
            .button .button-name { font-size: var(--awc-button-name-font-size, inherit); font-weight: var(--awc-button-name-weight, 500); opacity: var(--awc-button-name-opacity, 0.7); color: var(--awc-button-name-color, inherit); flex: 0 0 auto; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .button:not(.with-bg) .button-name { opacity: var(--awc-button-name-opacity, var(--awc-bottom-opacity, 0.7)); }
            .button.has-icon-bg.frosted:not(.with-bg) .button-name { opacity: var(--awc-button-name-opacity, var(--awc-bottom-opacity, 0.7)); }
            /* Button value */
            .button .button-val { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; display: inline-block; font-weight: var(--awc-button-value-weight, 700); opacity: var(--awc-button-value-opacity, 1); max-width: 100%; }
            .button .button-val,
            .button .button-name { text-shadow: var(--_button-no-bg-shadow, none); }
            .button .button-val .fancy-unit,
            .button .button-sub .fancy-unit { font-size: 0.55em; font-weight: 500; opacity: 0.7; vertical-align: baseline; position: relative; top: -0.45em; margin-left: 3px; }
            /* Element-disabled states */
            .button.icon-only { gap: 0; }
            .button.no-icon .button-content { flex: 1 1 auto; }
            .button.no-name .button-content { flex: 1 1 auto; }
            /* When name is empty in stacked/vertical, value fills the space */
            .button.format-stacked .button-name:empty + .button-val,
            .button.format-vertical .button-name:empty + .button-val { flex: 1 1 auto; }
            /* Overflow modes */
            .button.overflow-clip .button-val { text-overflow: clip; }
            .button.overflow-wrap .button-val { white-space: normal; overflow: visible; text-overflow: clip; }
            .button.overflow-wrap:not(.format-stacked):not(.format-vertical) .button-val { display: inline; }
            /* Background styles */
            .button.with-bg { --_bg: var(--awc-bottom-bg-color, var(--_text-bg)); padding: var(--awc-buttons-padding, 5px 10px); text-shadow: none; border-radius: var(--awc-bottom-bg-radius, calc(var(--awc-card-border-radius, var(--ha-card-border-radius, 12px)) - 5px)); align-items: center; }
            .button.with-bg .button-val,
            .button.with-bg .button-name { text-shadow: none; }
            /* Color tint */
            .button.has-tint { position: relative; }
            .button.has-tint::after { content: ""; position: absolute; inset: 0; border-radius: inherit; background: var(--awc-button-tint); opacity: 0.18; pointer-events: none; transition: background 0.4s ease; z-index: 0; }
            .button.has-tint > * { position: relative; z-index: 1; }
            /* Format: stacked — icon left, name and value in a column */
            .button.format-stacked .button-content { flex-direction: column; gap: var(--awc-button-text-gap, 4px); align-items: flex-start; }
            .button.format-stacked .button-icon { align-self: stretch; aspect-ratio: 1; overflow: visible; border-radius: var(--awc-stacked-icon-radius, calc(var(--awc-bottom-bg-radius, calc(var(--awc-card-border-radius, var(--ha-card-border-radius, 12px)) - 5px)) - var(--awc-stacked-icon-inset, 3px))); padding: var(--awc-icon-padding, 4px); flex: 0 0 auto; }
            .button.format-stacked .button-icon ha-icon,
            .button.format-stacked .button-icon ha-state-icon { --mdc-icon-size: var(--awc-icon-size, 1.3em); opacity: 1; }
            .button.format-stacked .button-icon img.custom-bottom-icon { height: var(--awc-icon-size, 1.3em); width: var(--awc-icon-size, 1.3em); }
            .button.format-stacked .button-icon svg.awc-icon { width: var(--awc-icon-size, 1.3em); height: var(--awc-icon-size, 1.3em); opacity: 1; }
            .button.format-stacked .button-name { font-size: var(--awc-button-name-font-size, var(--awc-stacked-name-size, 0.85em)); opacity: var(--awc-stacked-name-opacity, 0.7); line-height: 1.2; margin: 0; }
            .button.format-stacked .button-name:empty { display: none; }
            .button.format-stacked .button-val { font-weight: var(--awc-stacked-value-weight, 700); line-height: 1.2; flex: 0 0 auto; }
            .button.format-stacked.with-bg { padding: var(--awc-buttons-padding, 6px 10px 6px 6px); }
            .button.format-stacked.empty-name .button-icon { background: none; border: none; box-shadow: none; aspect-ratio: unset; align-self: center; }
            .button.format-stacked.has-icon-bg.with-bg { display: grid; grid-template-columns: auto 1fr; }
            .button.format-stacked.has-icon-bg.with-bg > .button-bar { grid-column: 1 / -1; }
            /* Format: vertical — icon on top, name and value below */
            .button.format-vertical { flex-direction: column; align-items: center; text-align: center; gap: var(--awc-button-gap, 6px); }
            .button.format-vertical .button-content { flex-direction: column; gap: var(--awc-button-text-gap, 4px); align-items: center; text-align: center; flex: 0 0 auto; max-width: 100%; }
            .button.format-vertical .button-icon { aspect-ratio: 1; overflow: visible; border-radius: var(--awc-stacked-icon-radius, calc(var(--awc-bottom-bg-radius, calc(var(--awc-card-border-radius, var(--ha-card-border-radius, 12px)) - 5px)) - var(--awc-stacked-icon-inset, 3px))); padding: var(--awc-icon-padding, 4px); }
            .button.format-vertical .button-icon ha-icon,
            .button.format-vertical .button-icon ha-state-icon { --mdc-icon-size: var(--awc-icon-size, 1.6em); }
            .button.format-vertical .button-icon img.custom-bottom-icon { height: var(--awc-icon-size, 1.6em); width: var(--awc-icon-size, 1.6em); }
            .button.format-vertical .button-icon svg.awc-icon { width: var(--awc-icon-size, 1.6em); height: var(--awc-icon-size, 1.6em); }
            .button.format-vertical .button-name { font-size: var(--awc-button-name-font-size, var(--awc-stacked-name-size, 0.85em)); opacity: var(--awc-stacked-name-opacity, 0.7); line-height: 1.2; margin: 0; }
            .button.format-vertical .button-name:empty { display: none; }
            .button.format-vertical .button-val { font-weight: var(--awc-stacked-value-weight, 700); line-height: 1.2; flex: 0 0 auto; max-width: 100%; }
            .button.format-vertical.with-bg { padding: var(--awc-buttons-padding, 6px 10px); }
            .button.format-vertical:not(.has-icon-bg) .button-icon { background: none; border: none; box-shadow: none; aspect-ratio: unset; border-radius: 0; overflow: visible; padding: var(--awc-icon-padding, 0); }
            .button.format-vertical.empty-name .button-icon { background: none; border: none; box-shadow: none; aspect-ratio: unset; }
            /* Per-button alignment (class on the button itself) */
            /* Inline: per-button */
            .button.align-center:not(.format-stacked):not(.format-vertical) { justify-content: center; }
            .button.align-center:not(.format-stacked):not(.format-vertical), .button.align-center:not(.format-stacked):not(.format-vertical) .button-content { flex: 0 0 auto; text-align: center; }
            .button.align-end:not(.format-stacked):not(.format-vertical) { flex-direction: row-reverse; }
            .button.align-end:not(.format-stacked):not(.format-vertical) .button-val { flex: 0 0 auto; }
            .button.overflow-marquee:not(.marquee-label).align-center .button-val,
            .button.overflow-marquee:not(.marquee-label).align-end .button-val { flex: 1 1 auto; min-width: 0; }
            .button.align-spread:not(.format-stacked):not(.format-vertical) { flex: 1 1 0; }
            .button.align-spread:not(.format-stacked):not(.format-vertical) .button-content { justify-content: space-between; }
            .button.align-spread.no-name:not(.format-stacked):not(.format-vertical) { justify-content: space-between; }
            .button.align-spread.no-name:not(.format-stacked):not(.format-vertical) .button-content { flex: 0 1 auto; }
            /* Stacked: per-button */
            .button.align-end.format-stacked { flex-direction: row-reverse; }
            .button.align-end.format-stacked .button-content { align-items: flex-end; text-align: end; }
            .button.align-end.format-stacked.with-bg { padding: var(--awc-buttons-padding, 6px 6px 6px 10px); }
            .button.align-spread.format-stacked { flex: 1 1 0; }
            .button.align-spread.format-stacked .button-content { flex: 1 1 auto; }
            .button.align-spread.format-stacked .button-val { text-align: right; align-self: flex-end; }
            /* Vertical: per-button */
            .button.align-start.format-vertical { align-items: flex-start; text-align: start; }
            .button.align-start.format-vertical .button-content { align-items: flex-start; text-align: start; }
            .button.align-center.format-vertical { align-items: center; text-align: center; }
            .button.align-center.format-vertical .button-content { align-items: center; text-align: center; }
            .button.align-end.format-vertical { align-items: flex-end; text-align: end; }
            .button.align-end .button-content { text-align: end; justify-content: flex-end; }
            /* Icon background (same rules for all formats) */
            .button.no-icon-bg .button-icon { background: none !important; border: none !important; box-shadow: none !important; aspect-ratio: unset !important; border-radius: 0 !important; overflow: visible !important; padding: var(--awc-icon-padding, 0) !important; }
            .button.has-icon-bg .button-icon { aspect-ratio: 1; overflow: visible; border-radius: var(--awc-stacked-icon-radius, calc(var(--awc-bottom-bg-radius, calc(var(--awc-card-border-radius, var(--ha-card-border-radius, 12px)) - 5px)) - var(--awc-stacked-icon-inset, 3px))); padding: var(--awc-icon-padding, 4px); align-self: stretch; }
            .button.has-icon-bg:not(.with-bg) .button-icon { background: var(--_bg, var(--awc-bottom-bg-color, var(--_text-bg))); border: var(--awc-bg-border, 1px solid var(--_text-bg-border, transparent)); box-shadow: var(--awc-icon-bg-shadow, var(--_frosted-inset, none)); }
            .button.has-icon-bg:not(.with-bg).frosted .button-icon { backdrop-filter: var(--awc-bottom-bg-filter, blur(10px)); -webkit-backdrop-filter: var(--awc-bottom-bg-filter, blur(10px)); }
            .button.has-icon-bg:not(.with-bg).contrast .button-icon { box-shadow: var(--awc-icon-bg-shadow, var(--_contrast-shadow, none)); border: none; }
            .button.has-icon-bg:not(.with-bg).theme .button-icon { background: var(--ha-card-background, var(--card-background-color, var(--primary-background-color))); border: var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, var(--divider-color)); box-shadow: var(--ha-card-box-shadow, none); }
            .button.has-icon-bg.with-bg .button-icon { background: var(--awc-stacked-icon-bg, color-mix(in srgb, var(--ha-card-background, var(--card-background-color, var(--primary-background-color))) 20%, transparent)); border: none; box-shadow: var(--awc-icon-bg-shadow, 0 2px 6px rgba(0,0,0,0.18), 0 1px 2px rgba(0,0,0,0.12)); }
            .button.has-icon-bg.with-bg.frosted .button-icon { border: var(--_stacked-icon-border, none); }
            .button.has-icon-bg.with-bg.contrast .button-icon { box-shadow: var(--awc-icon-bg-shadow, var(--_stacked-icon-shadow, 0 2px 6px rgba(0,0,0,0.18), 0 1px 2px rgba(0,0,0,0.12))); }
            .button.has-icon-bg.with-bg.theme .button-icon { border: var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, var(--divider-color)); }
            .button-free { position: absolute; pointer-events: auto; z-index: 99; font-family: var(--ha-font-family, var(--paper-font-body1_-_font-family, sans-serif)); font-size: var(--awc-bottom-font-size, 16px); font-weight: var(--awc-bottom-font-weight, 500); max-width: calc(100% - var(--_awc-pad-h, var(--awc-card-padding, 16px)) * 2); box-sizing: border-box; text-shadow: var(--_button-no-bg-shadow, none); }
            .button.button-round.with-bg { border-radius: 999px; }
            .button.button-round .button-icon { border-radius: 999px; }
            .button.button-ring { position: relative; border-radius: 50%; aspect-ratio: 1; justify-content: center; align-content: center; z-index: 1; padding: var(--awc-buttons-padding, 10px); }
            .buttons-group.has-row-wrap .button.button-ring { height: 100%; }
            .button.button-ring.with-bg { border-radius: 50%; padding: var(--awc-buttons-padding, 10px); }
            .button-ring-wrap { position: relative; display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; scroll-snap-align: start; }
            .button-ring-wrap::before { content: ""; position: absolute; inset: 0; border-radius: 50%; background: var(--awc-ring-gradient, conic-gradient(var(--awc-ring-color, var(--primary-color, #03a9f4)) var(--awc-ring-pct, 0%), transparent 0)); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - var(--awc-ring-w, 4px) - 0.5px), #000 calc(100% - var(--awc-ring-w, 4px))); mask: radial-gradient(farthest-side, transparent calc(100% - var(--awc-ring-w, 4px) - 0.5px), #000 calc(100% - var(--awc-ring-w, 4px))); transition: --awc-ring-pct 0.6s cubic-bezier(0.4, 0, 0.2, 1); pointer-events: none; z-index: 0; }
            .button-ring-wrap.has-segments::before { -webkit-mask: conic-gradient(#000 var(--awc-ring-pct, 0%), transparent 0), radial-gradient(farthest-side, transparent calc(100% - var(--awc-ring-w, 4px) - 0.5px), #000 calc(100% - var(--awc-ring-w, 4px))); mask: conic-gradient(#000 var(--awc-ring-pct, 0%), transparent 0), radial-gradient(farthest-side, transparent calc(100% - var(--awc-ring-w, 4px) - 0.5px), #000 calc(100% - var(--awc-ring-w, 4px))); -webkit-mask-composite: source-in; mask-composite: intersect; }
            .button-ring-track { position: absolute; inset: 0; border-radius: 50%; -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - var(--awc-ring-w, 4px) - 0.5px), #000 calc(100% - var(--awc-ring-w, 4px))); mask: radial-gradient(farthest-side, transparent calc(100% - var(--awc-ring-w, 4px) - 0.5px), #000 calc(100% - var(--awc-ring-w, 4px))); background: currentColor; opacity: 0.10; pointer-events: none; }
            .button-ring-wrap > .button { margin: var(--awc-ring-gap, 3px); z-index: 1; }
            .buttons-row.row-grid > .button-ring-wrap > .button,
            .buttons-row.has-visible-count > .button-ring-wrap > .button { width: calc(100% - var(--awc-ring-gap, 3px) * 2); }
            .buttons-row.row-grid > .button-ring-wrap { aspect-ratio: 1; }
            .button-bar { --_bar-radius: calc(var(--awc-card-border-radius, var(--ha-card-border-radius, 12px)) * 0.35); position: relative; width: 100%; height: var(--awc-bar-h, 4px); min-height: var(--awc-bar-h, 4px); border-radius: var(--_bar-radius); overflow: hidden; flex-shrink: 0; }
            .button-bar-track { position: absolute; inset: 0; border-radius: inherit; background: currentColor; opacity: 0.10; }
            .button-bar-fill { position: absolute; inset: 0; border-radius: inherit; background: var(--awc-bar-gradient, var(--awc-bar-color, var(--primary-color, #03a9f4))); transform-origin: left center; transform: scaleX(var(--awc-bar-scale, 0)); transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
            .button.button-bar-type { flex-wrap: wrap; }
            .button.button-bar-type.format-vertical { flex-wrap: nowrap; }
            .button.button-bar-type.format-vertical .button-bar { align-self: stretch; }
            .button.button-loading { position: relative; }
            .button.button-loading .button-icon,
            .button.button-loading .button-name,
            .button.button-loading .button-val,
            .button.button-loading .button-bar { visibility: hidden; }
            .button-ring-wrap.button-loading .button-ring-track,
            .button-ring-wrap.button-loading::before { visibility: hidden; }
            .button-loader { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 5px; pointer-events: none; }
            .button-loader span { width: 5px; height: 5px; border-radius: 50%; background: currentColor; opacity: 0.2; animation: awc-dot-pulse 1.2s ease-in-out infinite; }
            .button-loader span:nth-child(2) { animation-delay: 0.2s; }
            .button-loader span:nth-child(3) { animation-delay: 0.4s; }
@keyframes awc-dot-pulse {
                0%, 60%, 100% { opacity: 0.2; transform: scale(0.85); }
                30%           { opacity: 0.7; transform: scale(1); }
            }
            :where(.button .button-val, .button .button-name, .button-sub).awc-marquee-host { overflow: hidden; text-overflow: clip; contain: layout style; }
            .button.marquee-value .button-name { flex: 0 0 auto; }
            .button.marquee-label .button-name { flex: 1 1 auto; min-width: 0; }
            .button.marquee-label .button-val { flex: 0 0 auto; }
            .button.marquee-both .button-name { flex: 1 1 auto; min-width: 0; }
            .button.marquee-both .button-val { flex: 1 1 auto; min-width: 0; }
            :where(.button .button-val, .button .button-name, .button-sub).awc-marquee-host.is-animating { -webkit-mask-image: linear-gradient(to right, transparent 0, #000 var(--awc-marquee-fade, 12px), #000 calc(100% - var(--awc-marquee-fade, 12px)), transparent 100%); mask-image: linear-gradient(to right, transparent 0, #000 var(--awc-marquee-fade, 12px), #000 calc(100% - var(--awc-marquee-fade, 12px)), transparent 100%); }
            .awc-marquee-track { display: inline-block; white-space: nowrap; }
            .awc-marquee-text { display: inline; }
            .awc-marquee-sep { display: inline-block; padding: 0 var(--awc-marquee-sep-gap, 0.4em); opacity: 0.5; }
            .awc-marquee-sep::before { content: var(--awc-marquee-separator, "•"); }
            .awc-marquee-host.is-animating .awc-marquee-track { will-change: transform; animation: awc-marquee var(--awc-marquee-duration, 20s) linear infinite; }
            .awc-marquee-host.awc-marquee-rtl .awc-marquee-track { animation-direction: reverse; }
@keyframes awc-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@media (prefers-reduced-motion: reduce) { .awc-marquee-host.is-animating .awc-marquee-track { animation: none; will-change: auto; } }
            #custom-cards-wrapper { position: absolute; inset: 0; box-sizing: border-box; z-index: 10; display: none; flex-wrap: wrap; flex-direction: var(--awc-custom-cards-direction, row); gap: var(--awc-custom-cards-gap, 8px); justify-content: var(--awc-custom-cards-justify, flex-start); align-items: var(--awc-custom-cards-align, flex-start); padding: var(--awc-card-padding, var(--ha-space-4, 16px)); pointer-events: none; overflow: visible; }
            #custom-cards-wrapper.has-cards { display: flex; }
            #custom-cards-wrapper > * { pointer-events: auto; }
            #custom-cards-wrapper.cc-text-left { justify-content: flex-start; }
            #custom-cards-wrapper.cc-text-right { justify-content: flex-end; }
            #custom-cards-wrapper.cc-text-hcenter { justify-content: center; }
            #custom-cards-wrapper.cc-align-top { align-content: flex-start; }
            #custom-cards-wrapper.cc-align-center { align-content: center; }
            #custom-cards-wrapper.cc-align-bottom { align-content: flex-end; }

`;
    }
    _initDOM() {
        if (this._initialized) return; this._initialized = true;
        if (this._config.card_offset) this.style.margin = this._config.card_offset;
        const style = document.createElement('style'); style.textContent = AtmosphericWeatherCard._buildStyles();
        const root = document.createElement('div'); root.id = 'card-root';
        root.innerHTML = `<canvas id="star-bg-canvas"></canvas><canvas id="star-canvas"></canvas><canvas id="gl-canvas"></canvas><div id="awc-sunrays"><b></b></div><div id="awc-sunglow"></div><div id="awc-bottom-fade"></div><div id="awc-theme-adapt"></div><div id="awc-simple-bg"><div id="awc-sky-base" class="awc-sky-layer"></div><div id="awc-sky-glow" class="awc-sky-layer"></div></div><div id="awc-weather-bg"></div><div id="image-slot"><img /></div><div id="text-wrapper"></div><div id="custom-cards-wrapper"></div>`;
        this.shadowRoot.append(style, root); const q = (sel) => root.querySelector(sel);
        const glCanvas = q('#gl-canvas');
        glCanvas.addEventListener('webglcontextlost', (e) => {
            e.preventDefault(); this._stopAnimation(); this._destroyGL();
        }, false);
        glCanvas.addEventListener('webglcontextrestored', () => { this._initWebGL(); this._shaderParams = this._weatherToUniforms(); this._startAnimation(); }, false);
        const img = q('#image-slot > img');
        img.onerror = () => { img.style.opacity = '0'; };
        img.onload  = () => { img.style.opacity = '1'; };
        const textWrapper = q('#text-wrapper');
        textWrapper.addEventListener('click', (e) => this._handleButtonClick(e));
        const posSlots = {};
        for (const pos of ['top-left','top-center','top-right','left','center','right','bottom-left','bottom-center','bottom-right']) {
            const slot = document.createElement('div');
            slot.className = `awc-pos-slot pos-${pos}`;
            slot.dataset.pos = pos;
            textWrapper.appendChild(slot);
            posSlots[pos] = slot;
        }
        this._elements = {
            root, glCanvas, img, imageSlot: q('#image-slot'),
            starCanvas: q('#star-canvas'), starBgCanvas: q('#star-bg-canvas'),
            textWrapper,
            weatherBg: q('#awc-weather-bg'),
            simpleBg: q('#awc-simple-bg'),
            customCardsWrapper: q('#custom-cards-wrapper'),
            buttonAreaEls: [],
            posSlots,
        };
        this._syncButtonAreaDOM();
    }
    _syncButtonAreaDOM() {
        if (!this._elements || !this._elements.textWrapper) return;
        const wanted = this._areas.length, current = this._elements.buttonAreaEls;
        while (current.length > wanted) {
            const removed = current.pop();
            removed.group.remove();
        }
        while (current.length < wanted) {
            const idx = current.length;
            const group = document.createElement('div');
            group.className = 'buttons-group';
            group.dataset.area = String(idx);
            const row = document.createElement('div');
            row.className = 'buttons-row';
            group.appendChild(row);
            current.push({ group, row });
        }
        for (let i = 0; i < current.length; i++) {
            current[i].group.dataset.area = String(i);
        }
    }
    _applySlotDirections() {
        const slots = this._elements && this._elements.posSlots;
        if (!slots) return;
        const areas = this._areas || [];
        const slotPrefs = {};
        const slotCounts = {};
        for (const area of areas) {
            const pos = (area.position || 'bottom-left').toString().toLowerCase();
            slotCounts[pos] = (slotCounts[pos] || 0) + 1;
            if (!slotPrefs[pos] && area.stack_direction) {
                slotPrefs[pos] = area.stack_direction;
            }
        }
        for (const pos in slotCounts) {
            if (slotCounts[pos] > 1 && !slotPrefs[pos]) slotPrefs[pos] = 'vertical';
        }
        for (const [pos, slot] of Object.entries(slots)) {
            const pref = slotPrefs[pos];
            if (pref) {
                slot.classList.toggle('stack-h', pref === 'horizontal');
                slot.classList.toggle('stack-v', pref === 'vertical');
            } else {
                slot.classList.remove('stack-h', 'stack-v');
            }
        }
    }
    _updateSchemeStyles(isNight, weatherState) {
        const root = this._elements.root;
        const cfg = this._config || {};
        root.classList.toggle('scheme-night', this._isThemeDark);
        root.classList.toggle('scheme-day', !this._isThemeDark);
        const sunEnabled = cfg.sun_effects !== false;
        const styleSig = `${this._isThemeDark}_${weatherState}_${sunEnabled}`;
        if (this._prevStyleSig === styleSig) return; this._prevStyleSig = styleSig;
        if (this._prevWeatherClass) root.classList.remove(this._prevWeatherClass);
        const cls = `weather-${weatherState}`;
        root.classList.add(cls);
        this._prevWeatherClass = cls;
        const vis = WEATHER_VISUALS[weatherState] || WEATHER_VISUALS['default'];
        root.classList.toggle('has-sunrays', !!vis.sunrays && !isNight && sunEnabled);
    }
    _applyConfigStyles() {
        if (!this._elements || !this._elements.buttonAreaEls.length) return; const cfg = this._config;
        const root = this._elements.root;
        this._cssVar(root, '--awc-card-padding', cfg.card_padding || '', '_prevCardPadding');
        const bgB = cfg.bg_brightness != null ? String(cfg.bg_brightness) : '';
        const bgS = cfg.bg_saturation != null ? String(cfg.bg_saturation) : '';
        this._cssVar(root, '--awc-bg-brightness', bgB, '_prevBgBrightness');
        this._cssVar(root, '--awc-bg-saturation', bgS, '_prevBgSaturation');
        root.classList.toggle('has-bg-filter', !!bgB || !!bgS);
        const hasFade = cfg.bottom_fade === true;
        if (this._prevBottomFade !== hasFade) {
            this._prevBottomFade = hasFade;
            root.classList.toggle('has-bottom-fade', hasFade);
        }
        if (cfg.theme_adapt === false && this._prevAdaptMode) {
            root.classList.remove('adapt-dim', 'adapt-lift');
            this._prevAdaptMode = '';
        }
        const padRaw = (cfg.card_padding || '').toString().trim();
        if (padRaw && this._prevCardPadParsed !== padRaw) {
            this._prevCardPadParsed = padRaw; const parts = padRaw.split(/\s+/); root.style.setProperty('--_awc-pad-v', parts[0] || '');
            root.style.setProperty('--_awc-pad-h', parts[1] || parts[0] || '');
        } else if (!padRaw && this._prevCardPadParsed) {
            this._prevCardPadParsed = ''; root.style.removeProperty('--_awc-pad-v'); root.style.removeProperty('--_awc-pad-h');
        }
        if (!this._areaStyleCache) this._areaStyleCache = [];
        for (let ai = 0; ai < this._areas.length; ai++) {
            this._applyAreaStyles(ai, this._areas[ai]);
        }
    }
    _applyAreaStyles(ai, area) {
        const els = this._elements.buttonAreaEls[ai]; if (!els) return;
        const bt = els.row, cg = els.group;
        if (!this._areaStyleCache[ai]) this._areaStyleCache[ai] = {};
        const cache = this._areaStyleCache[ai];
        const showBottom = area.hide !== true;
        const showBottomBg = area.background === true;
        const bgStyle = ['contrast', 'frosted', 'theme'].includes((area.background_style || '').toLowerCase()) ? area.background_style.toLowerCase() : 'frosted';
        const configSig = `${showBottom}|${bgStyle}`;
        if (cache.configSig !== configSig) {
            cache.configSig = configSig;
            bt.style.display = showBottom ? '' : 'none'; cg.style.display = showBottom ? '' : 'none';
        }
        const cssVarArea = (el, prop, val, cacheKey) => {
            if (cache[cacheKey] !== val) { cache[cacheKey] = val; if (val) el.style.setProperty(prop, val); else el.style.removeProperty(prop); }
        };
        for (const [prop, key, ck] of [
            ['--awc-row-width', 'width', 'rowWidth'],
            ['--awc-row-height', 'height', 'rowHeight'],
            ['--awc-buttons-padding', 'button_padding', 'buttonPad'],
            ['--awc-container-padding', 'padding', 'containerPad'],
            ['--awc-container-bg-color', 'background_color', 'containerBgColor'],
            ['--awc-bottom-gap', 'gap', 'buttonsGap'],
            ['--awc-button-gap', 'button_gap', 'buttonGap'],
            ['--awc-button-text-gap', 'button_text_gap', 'buttonTextGap'],
            ['--awc-icon-size', 'button_icon_size', 'buttonIconWidth'],
            ['--awc-icon-padding', 'button_icon_padding', 'buttonIconPad'],
            ['--awc-bottom-font-size', 'button_text_size', 'bottomFS'],
            ['--awc-button-name-font-size', 'button_label_size', 'buttonNameFS'],
            ['--awc-sub-size', 'sub_value_size', 'subValueSize'],
            ['--awc-sub-weight', 'sub_value_weight', 'subValueWeight'],
        ]) cssVarArea(cg, prop, (area[key] || '').toString().trim(), ck);
        const cols = parseInt(area.columns, 10);
        cssVarArea(cg, '--awc-row-columns', Number.isFinite(cols) && cols > 0 ? String(cols) : '', 'rowCols');
        let rowLayout = (area.layout || 'wrap').toString().toLowerCase();
        const isGrouped = area.grouped === true;
        if (cache.rowOverflow !== rowLayout) {
            cache.rowOverflow = rowLayout;
            for (const m of ['horizontal-scroll', 'wrap', 'grid', 'vertical-scroll']) bt.classList.toggle('row-' + m, rowLayout === m);
            for (const m of ['horizontal-scroll', 'wrap', 'vertical-scroll']) cg.classList.toggle('has-row-' + m, rowLayout === m);
        }
        const visCount = parseInt(area.scroll_count, 10), hasVis = Number.isFinite(visCount) && visCount > 0;
        const visKey = `${hasVis}|${visCount}|${rowLayout}`;
        if (cache.visKey !== visKey) {
            cache.visKey = visKey; bt.classList.toggle('has-visible-count', hasVis);
            if (hasVis) {
                const gapVal = (area.gap || '8px').toString().trim() || '8px';
                bt.style.setProperty('--awc-button-basis', `calc((100% - ${visCount - 1} * ${gapVal}) / ${visCount})`);
                if (rowLayout === 'vertical-scroll') {
                    bt.style.setProperty('--awc-button-basis-v', `calc((100% - ${visCount - 1} * ${gapVal}) / ${visCount})`);
                } else {
                    bt.style.removeProperty('--awc-button-basis-v');
                }
            } else {
                bt.style.removeProperty('--awc-button-basis'); bt.style.removeProperty('--awc-button-basis-v');
            }
            if (!hasVis && rowLayout === 'vertical-scroll') {
                requestAnimationFrame(() => this._computeVerticalVisHeight(ai));
            } else if (rowLayout !== 'vertical-scroll' || hasVis) {
                bt.style.removeProperty('--awc-row-max-height');
            }
        }
        const hasSeparator = area.separator === true;
        const groupedKey = `${isGrouped}|${showBottomBg}|${bgStyle}|${hasSeparator}`;
        if (cache.grouped !== groupedKey) {
            cache.grouped = groupedKey; cg.classList.toggle('grouped', isGrouped); bt.classList.toggle('has-separator', hasSeparator);
            if (isGrouped && showBottomBg) {
                cg.classList.add('with-bg');
                for (const s of ['contrast', 'frosted', 'theme']) cg.classList.toggle(s, bgStyle === s);
            } else {
                cg.classList.remove('with-bg', 'contrast', 'frosted', 'theme');
            }
        }
        const gridSepKey = `${hasSeparator}|${rowLayout}|${cols}`;
        if (cache.gridSepKey !== gridSepKey) {
            cache.gridSepKey = gridSepKey;
            let existingSepStyle = cg.querySelector('.awc-grid-sep-style');
            if (hasSeparator && rowLayout === 'grid' && Number.isFinite(cols) && cols > 0) {
                const sel = `.buttons-row.row-grid.has-separator`;
                const sepCss = `
${sel} > .button { position: relative; overflow: visible; }
${sel} > .button::before { content: ""; position: absolute; pointer-events: none; top: 0; bottom: 0; inset-inline-start: calc((var(--awc-bottom-gap, 8px) / -2) - (var(--awc-separator-width, 2px) / 2)); width: var(--awc-separator-width, 2px); background: var(--awc-separator-color, color-mix(in srgb, currentColor 10%, transparent)); }
${sel} > .button::after { content: ""; position: absolute; pointer-events: none; left: 0; right: 0; top: calc((var(--awc-bottom-gap, 8px) / -2) - (var(--awc-separator-width, 2px) / 2)); height: var(--awc-separator-width, 2px); background: var(--awc-separator-color, color-mix(in srgb, currentColor 10%, transparent)); }
${sel} > .button:nth-child(${cols}n+1)::before { content: none; }
${sel} > .button:nth-child(-n+${cols})::after { content: none; }`;
                if (existingSepStyle) {
                    existingSepStyle.textContent = sepCss;
                } else {
                    const styleEl = document.createElement('style');
                    styleEl.className = 'awc-grid-sep-style';
                    styleEl.textContent = sepCss;
                    cg.prepend(styleEl);
                }
            } else {
                if (existingSepStyle) existingSepStyle.remove();
            }
        }
        const align = (area.align || 'start').toString().toLowerCase();
        if (cache.buttonAlign !== align) {
            cache.buttonAlign = align;
            for (const a of ['start', 'center', 'end', 'spread']) bt.classList.toggle(`align-${a}`, align === a);
        }
    }
    _updateTextElements(hass, wEntity, lang, weatherState = 'default') {
        if (!wEntity) return; if (!this._elements || !this._elements.buttonAreaEls.length) return;
        this._syncButtonAreaDOM();
        this._applyConfigStyles();
        if (this._numFmtLang !== lang) {
            this._numFmtLang = lang;
            this._numFmt = new Intl.NumberFormat(lang, { maximumFractionDigits: 1, minimumFractionDigits: 0 });
        }
        if (!this._areaRenderCache) this._areaRenderCache = [];
        let anyRowRebuilt = false, anyFreeRebuilt = false;
        const allRendered = [];
        for (let ai = 0; ai < this._areas.length; ai++) {
            const area = this._areas[ai];
            const els = this._elements.buttonAreaEls[ai]; if (!els) continue;
            const bt = els.row;
            const areaVisible = this._checkAreaVisibility(area, hass);
            els.group.style.display = areaVisible ? '' : 'none';
            if (!areaVisible) continue;
            const showBottomBg = area.background === true;
            const bgStyle = ['contrast', 'frosted', 'theme'].includes((area.background_style || '').toLowerCase()) ? area.background_style.toLowerCase() : 'frosted';
            const buttonFormatRaw = (area.button_style || 'inline').toLowerCase();
            const buttonFormat = buttonFormatRaw === 'stacked' ? 'stacked' : buttonFormatRaw === 'vertical' ? 'vertical' : 'inline';
            const rowLayout = (area.layout || 'wrap').toString().toLowerCase();
            const visCount = parseInt(area.scroll_count, 10), hasVis = Number.isFinite(visCount) && visCount > 0;
            const areaCtx = { button_icon_background: area.button_icon_background, button_background_color: area.button_background_color || '', button_icon_background_color: area.button_icon_background_color || '' };
            const rendered = area.buttons.map((button, idx) =>
                this._renderButton(button, idx, hass, weatherState, lang, showBottomBg, bgStyle, buttonFormat, ai, areaCtx)
            );
            allRendered.push(...rendered.filter(r => !r.hidden));
            if (!this._areaRenderCache[ai]) this._areaRenderCache[ai] = {};
            const ac = this._areaRenderCache[ai];
            const rowButtons = rendered.filter(r => !r.isFree), freeButtons = rendered.filter(r => r.isFree), rowSig = rowButtons.map(r => r.sig).join('§');
            const rowRebuilt = ac.lastLocStr !== rowSig;
            if (rowRebuilt) {
                ac.lastLocStr = rowSig; bt.innerHTML = rowButtons.map(r => r.html).join('');
                this._animateRings(bt, `a${ai}`);
                const hasEnhanced = rowButtons.some(r => r.html.includes('format-stacked') || r.html.includes('format-vertical'));
                bt.classList.toggle('has-enhanced-child', hasEnhanced);
                if (!hasVis && rowLayout === 'vertical-scroll') { requestAnimationFrame(() => this._computeVerticalVisHeight(ai)); }
                anyRowRebuilt = true;
            }
            if (rowLayout !== 'vertical-scroll' || hasVis) {
                if (ac.hadVertVis) { bt.style.removeProperty('--awc-row-max-height'); ac.hadVertVis = false; }
            } else {
                ac.hadVertVis = true;
            }
            const freeSig = freeButtons.map(r => r.sig).join('§'), freeRebuilt = ac.lastFreeSig !== freeSig;
            if (freeRebuilt) {
                ac.lastFreeSig = freeSig; const tw = this._elements.textWrapper;
                tw.querySelectorAll(`.button-free[data-area="${ai}"]`).forEach(el => el.remove());
                for (const r of freeButtons) {
                    const wrapper = document.createElement('div'); wrapper.className = 'button-free';
                    wrapper.dataset.area = String(ai);
                    const [anchorV, anchorH] = parseAnchor(r.posAnchor || 'top-left'); const padH = 'var(--_awc-pad-h, var(--awc-card-padding, 16px))';
                    const padV = 'var(--_awc-pad-v, var(--awc-card-padding, 16px))', ox = r.posX === 'pad' ? padH : parseCSSVal(r.posX);
                    const oy = r.posY === 'pad' ? padV : parseCSSVal(r.posY), tx = [];
                    if (anchorH === 'left') wrapper.style.left = ox;
                    else if (anchorH === 'right') wrapper.style.right = ox;
                    else { wrapper.style.left = '50%'; tx.push('translateX(-50%)'); }
                    if (anchorV === 'top') wrapper.style.top = oy;
                    else if (anchorV === 'bottom') wrapper.style.bottom = oy;
                    else { wrapper.style.top = '50%'; tx.push('translateY(-50%)'); }
                    if (tx.length) wrapper.style.transform = tx.join(' ');
                    if (r.width) { wrapper.style.width = `calc(${r.width})`; wrapper.style.maxWidth = `calc(100% - var(--_awc-pad-h, var(--awc-card-padding, 16px)) * 2)`; }
                    wrapper.innerHTML = r.html;
                    this._animateRings(wrapper, `f${ai}`);
                    tw.appendChild(wrapper);
                }
                anyFreeRebuilt = true;
            }
            const buttonsPos = (area.position || 'bottom-left').toString().toLowerCase();
            if (ac.prevPosSig !== buttonsPos) {
                ac.prevPosSig = buttonsPos;
                bt.classList.remove(...POS_CLASSES); els.group.classList.remove(...POS_CLASSES);
                bt.classList.add(`pos-${buttonsPos}`);
                els.group.classList.add(`pos-${buttonsPos}`);
                const slot = this._elements.posSlots && this._elements.posSlots[buttonsPos];
                if (slot && els.group.parentNode !== slot) {
                    slot.appendChild(els.group);
                }
            } else if (!els.group.parentNode) {
                const slot = this._elements.posSlots && this._elements.posSlots[buttonsPos];
                if (slot) slot.appendChild(els.group);
            }
        }
        this._applySlotDirections();
        if (anyRowRebuilt || anyFreeRebuilt) {
            this._nativeIconCache = null;
            this._refreshMarqueeObservation();
        }
        const hasNativeIcons = allRendered.some(r => r.showIcon && r.iconStrategy === 'native');
        if (hasNativeIcons) {
            if (!this._nativeIconCache || anyRowRebuilt || anyFreeRebuilt) {
                const allContainers = [...this._elements.buttonAreaEls.map(e => e.row), ...this._elements.textWrapper.querySelectorAll('.button-free')];
                this._nativeIconCache = [];
                for (let i = 0; i < allRendered.length; i++) {
                    const r = allRendered[i]; if (!r.showIcon || r.iconStrategy !== 'native') continue;
                    for (const container of allContainers) {
                        const iconEl = container.querySelector(`.button[data-idx="${r.buttonIdx}"][data-area="${r.areaIdx}"] ha-state-icon`);
                        if (iconEl) this._nativeIconCache.push({ rendered: r, el: iconEl });
                    }
                }
            }
            for (let j = 0; j < this._nativeIconCache.length; j++) {
                const entry = this._nativeIconCache[j], r = entry.rendered;
                if (entry.el.hass !== hass || entry.el.stateObj !== r.sensorObj) {
                    entry.el.hass = hass; entry.el.stateObj = r.sensorObj;
                }
            }
        }
        if (this._elements && this._elements.customCardsWrapper) {
            const firstAreaPos = this._areas.length > 0 ? (this._areas[0].position || 'bottom-left').toLowerCase() : 'bottom-left';
            const ccPos = (this._config.custom_cards_position || '').toLowerCase().trim();
            const ccSig = `${ccPos}|${firstAreaPos}`;
            if (this._prevCcSig !== ccSig) {
                this._prevCcSig = ccSig; const ccw = this._elements.customCardsWrapper;
                const allCcClasses = ['cc-text-left', 'cc-text-right', 'cc-text-hcenter', 'cc-align-top', 'cc-align-center', 'cc-align-bottom'];
                ccw.classList.remove(...allCcClasses);
                if (ccPos) {
                    const hClass = ccPos.includes('left') ? 'cc-text-left'
                                 : ccPos.includes('right') ? 'cc-text-right'
                                 : ccPos.includes('center') ? 'cc-text-hcenter'
                                 : null;
                    const vClass = ccPos.includes('top') ? 'cc-align-top'
                                 : ccPos.includes('bottom') ? 'cc-align-bottom'
                                 : ccPos.includes('center') ? 'cc-align-center'
                                 : 'cc-align-bottom';
                    if (hClass) ccw.classList.add(hClass); ccw.classList.add(vClass);
                } else {
                    ccw.classList.add('cc-align-bottom'); const buttonsIsLeft = firstAreaPos.includes('left'); const buttonsIsRight = firstAreaPos.includes('right');
                    ccw.classList.add(buttonsIsLeft ? 'cc-text-right' : buttonsIsRight ? 'cc-text-left' : 'cc-text-hcenter');
                }
            }
        }
    }
    _animateRings(container, prefix) {
        if (!this._ringPrevPct) this._ringPrevPct = new Map();
        const pfx = prefix || '';
        for (const wrap of container.querySelectorAll('.button-ring-wrap')) {
            const key = pfx + wrap.dataset.idx;
            const target = (wrap.style.getPropertyValue('--awc-ring-pct') || '0%').trim();
            const prev = this._ringPrevPct.get(key);
            wrap.style.setProperty('--awc-ring-pct', prev !== undefined ? prev : '0%');
            requestAnimationFrame(() => { wrap.style.setProperty('--awc-ring-pct', target); });
            this._ringPrevPct.set(key, target);
        }
        for (const fill of container.querySelectorAll('.button-bar-fill')) {
            const key = 'b' + pfx + fill.dataset.barIdx;
            const target = (fill.style.getPropertyValue('--awc-bar-scale') || '0').trim();
            const prev = this._ringPrevPct.get(key);
            fill.style.setProperty('--awc-bar-scale', prev !== undefined ? prev : '0');
            requestAnimationFrame(() => { fill.style.setProperty('--awc-bar-scale', target); });
            this._ringPrevPct.set(key, target);
        }
    }
    _renderButton(button, idx, hass, weatherState, lang, rowBg, bgStyle, buttonFormat, areaIdx, areaCtx) {
        if (!button.entity) return { html: '', sig: `skip-${idx}`, sensorObj: null, iconStrategy: 'static', showIcon: false, isFree: false, posAnchor: '', posX: '0', posY: '0', areaIdx, buttonIdx: idx, hidden: false };
        if (!this._checkButtonVisibility(button, hass)) {
            const visSig = JSON.stringify(button.visibility);
            return { html: '', sig: `hidden-${idx}-${visSig}`, sensorObj: null, iconStrategy: 'static', showIcon: false, isFree: false, posAnchor: '', posX: '0', posY: '0', areaIdx, buttonIdx: idx, hidden: true };
        }
        const showIcon = button.hide_icon !== true, showLabel = button.hide_label !== true, showValue = button.hide_value !== true;
        const effectiveFormat = button.style ? button.style : buttonFormat;
        const isEnhanced = effectiveFormat === 'stacked' || effectiveFormat === 'vertical';
        const isRingType = button.type === 'ring';
        let sensorObj = null, iconStrategy = 'static', iconValue = 'mdi:information-outline', formatted, unit;
        const isForecast = !!button.forecast; let fcCondition = null, fcDatetime = null, fcLoading = false, fcEntry = null;
        if (isForecast) {
            const fc = this._resolveFcValue(hass, button, lang);
            formatted = fc.formatted; unit = fc.unit; fcCondition = fc.condition; fcDatetime = fc.datetime;
            fcLoading = !!fc.loading; fcEntry = fc.entry || null;
            iconValue = fcCondition ? (WEATHER_ICONS[fcCondition] || WEATHER_ICONS['default']) : iconValue;
            if (button.attribute && button.attribute !== 'condition') iconValue = FORECAST_ATTR_ICONS[button.attribute] || iconValue;
        } else {
            const resolved = this._resolveSensorValue(hass, button.entity, button.attribute);
            formatted = resolved.formatted; unit = resolved.unit;
            if (resolved.haFormatted && button.unit_format !== undefined && resolved.rawNumeric != null) {
                formatted = this._formatNumber(resolved.rawNumeric);
            }
            const sensor = hass.states[button.entity];
            if (sensor) { if (button.attribute) iconValue = WEATHER_ATTR_ICONS[button.attribute] || 'mdi:information-outline'; else { sensorObj = sensor; iconStrategy = 'native'; } }
        }
        const configIcon = button.icon, configPath = button.icon_path || (configIcon === 'weather' && this._config && this._config.icon_path ? this._config.icon_path : '');
        if (configIcon) {
            const resolvedBase = (configIcon === 'weather') ? (isForecast && fcCondition ? fcCondition : weatherState) : configIcon;
            if (configPath) {
                iconStrategy = 'image';
                const basePath = configPath.endsWith('/') ? configPath : configPath + '/';
                const ext = resolvedBase.includes('.') ? '' : '.svg';
                iconValue = `${basePath}${resolvedBase}${ext}`;
            } else {
                if (configIcon === 'weather' && AWC_BUILTIN_ICONS[resolvedBase]) {
                    iconStrategy = 'builtin';
                    iconValue = (!isForecast && this._isTimeNight && AWC_BUILTIN_ICONS[`${resolvedBase}-night`]) ? `${resolvedBase}-night` : resolvedBase;
                } else {
                    iconStrategy = 'static';
                    iconValue = (configIcon === 'weather') ? (WEATHER_ICONS[resolvedBase] || WEATHER_ICONS['default']) : configIcon;
                }
            }
        }
        const hasUnitFormat = button.unit_format !== undefined; if (hasUnitFormat) unit = button.unit_format;
        const overflowMode = (button.overflow || 'ellipsis').toString().toLowerCase().trim();
        const labelOverflow = (button.label_overflow || 'ellipsis').toString().toLowerCase().trim();
        const isValueMarquee = overflowMode === 'marquee', isLabelMarquee = labelOverflow === 'marquee';
        const subOverflow = (button.sub_value_overflow || 'ellipsis').toString().toLowerCase().trim();
        const isSubMarquee = subOverflow === 'marquee';
        const hasAnyMarquee = isValueMarquee || isLabelMarquee || isSubMarquee;
        const marqueeSpeed = Math.max(5, parseFloat(button.marquee_speed) || 30);
        const marqueeRtl = button.marquee_rtl === true, width = (button.width || '').toString().trim(), height = (button.height || '').toString().trim();
        let name = (button.name || '').toString().trim(), nameSig = name;
        if (!name && !button.name_sensor && isForecast && fcDatetime) {
            name = fcLabel(fcDatetime, button.forecast !== 'hourly', lang);
            nameSig = `fc:${fcDatetime}`;
        }
        if (name && !button.name_sensor && button.name_format !== undefined) {
            name = `${name}${button.name_format}`;
            nameSig = `${nameSig}|nf:${button.name_format}`;
        }
        if (button.name_sensor) {
            const nameResolved = this._resolveSensorValue(hass, button.name_sensor, button.name_attribute);
            const hasNameFormat = button.name_format !== undefined;
            const nameUnit = hasNameFormat ? button.name_format : nameResolved.unit;
            name = hasNameFormat ? `${nameResolved.formatted}${nameUnit}` : (nameUnit ? `${nameResolved.formatted} ${nameUnit}` : `${nameResolved.formatted}`);
            nameSig = `ns:${button.name_sensor}|${button.name_attribute || ''}|${button.name_format != null ? button.name_format : ''}|${name}`;
        } else if (isForecast && button.name_attribute && fcEntry) {
            const nRaw = fcEntry[button.name_attribute];
            if (nRaw != null) {
                if (button.name_attribute === 'condition' && typeof nRaw === 'string') {
                    name = (typeof hass.localize === 'function' && hass.localize(`component.weather.entity_component._.state.${nRaw}`)) || nRaw;
                    if (button.name_format !== undefined) name = `${name}${button.name_format}`;
                } else if (nRaw !== '' && !isNaN(parseFloat(nRaw)) && isFinite(nRaw)) {
                    const _cs = hass.states[button.entity], _w = _cs && _cs.attributes;
                    const hasNameFormat = button.name_format !== undefined;
                    const nUnit = hasNameFormat ? button.name_format : ((_w && _w[`${button.name_attribute}_unit`]) || (_FC_UNIT_MAP[button.name_attribute] && _w && _w[_FC_UNIT_MAP[button.name_attribute]]) || _FC_UNIT_FALLBACK[button.name_attribute] || '');
                    const _nPrec = button.forecast_precision !== undefined ? button.forecast_precision : 0;
                    const _nFmtFn = (_nPrec !== undefined && _nPrec !== null) ? this._getFcFmt(lang, _nPrec) : null;
                    const nFmt = this._formatNumber(nRaw, _nFmtFn);
                    name = hasNameFormat ? `${nFmt}${nUnit}` : (nUnit ? `${nFmt} ${nUnit}` : `${nFmt}`);
                } else {
                    name = String(nRaw);
                    if (button.name_format !== undefined) name = `${name}${button.name_format}`;
                }
                nameSig = `ns-fc:${button.name_attribute}|${button.name_format != null ? button.name_format : ''}|${name}`;
            }
        }
        const useFancyUnit = button.fancy_unit === true;
        const showSubValue = button.hide_sub_value !== true && (button.sub_value_entity || button.sub_value_attribute);
        let subValue = '', subValueSig = '';
        if (showSubValue) {
            const hasSubFormat = button.sub_value_format !== undefined;
            const formatSubValue = (value, unit) => useFancyUnit && unit
                ? `${value}<span class="fancy-unit">${unit}</span>`
                : (hasSubFormat ? `${value}${unit}` : (unit ? `${value} ${unit}` : `${value}`));
            if (button.sub_value_entity) {
                const svResolved = this._resolveSensorValue(hass, button.sub_value_entity, button.sub_value_attribute);
                const attr = button.sub_value_attribute;
                const attrs = svResolved.sensor && svResolved.sensor.attributes;
                const raw = svResolved.sensor && (attr ? attrs[attr] : svResolved.sensor.state);
                const isNumeric = raw != null && raw !== '' && !isNaN(parseFloat(raw)) && isFinite(raw);
                if (useFancyUnit && svResolved.haFormatted && isNumeric) {
                    const toParts = attr ? hass.formatEntityAttributeValueToParts : hass.formatEntityStateToParts;
                    if (typeof toParts === 'function') {
                        // HA owns display precision, derived units and their localized order.
                        const parts = attr ? toParts.call(hass, svResolved.sensor, attr) : toParts.call(hass, svResolved.sensor);
                        subValue = hasSubFormat
                            ? formatSubValue(parts.filter(p => p.type !== 'unit').map(p => p.value).join('').trim(), button.sub_value_format)
                            : parts.map(p => p.type === 'unit' && p.value ? `<span class="fancy-unit">${p.value}</span>` : p.value).join('');
                    } else {
                        // Older HA versions cannot safely separate localized values and units.
                        // Keep the full display rather than losing precision or guessing a unit.
                        subValue = String(svResolved.formatted);
                    }
                } else {
                    let svUnit = hasSubFormat ? button.sub_value_format : svResolved.unit;
                    if (useFancyUnit && !hasSubFormat && isNumeric) {
                        svUnit = attr
                            ? (attrs[`${attr}_unit`] || (_FC_UNIT_MAP[attr] && attrs[_FC_UNIT_MAP[attr]]) || _FC_UNIT_FALLBACK[attr] || attrs.unit_of_measurement || '')
                            : (attrs.unit_of_measurement || '');
                    }
                    subValue = formatSubValue(svResolved.formatted, svUnit);
                }
                subValueSig = `sv:${button.sub_value_entity}|${button.sub_value_attribute || ''}|${subValue}`;
            } else if (isForecast && button.sub_value_attribute && fcEntry) {
                const svRaw = fcEntry[button.sub_value_attribute];
                if (svRaw != null) {
                    let svFmt = svRaw;
                    if (button.sub_value_attribute === 'condition' && typeof svRaw === 'string') {
                        svFmt = (typeof hass.localize === 'function' && hass.localize(`component.weather.entity_component._.state.${svRaw}`)) || svRaw;
                    } else if (svRaw !== '' && !isNaN(parseFloat(svRaw)) && isFinite(svRaw)) {
                        const precision = button.forecast_precision !== undefined ? button.forecast_precision : 0;
                        const fmt = (precision !== undefined && precision !== null)
                            ? this._getFcFmt(lang, precision) : null;
                        svFmt = this._formatNumber(svRaw, fmt);
                    }
                    const _buttonState = hass.states[button.entity];
                    const w = _buttonState && _buttonState.attributes;
                    const svUnit = hasSubFormat ? button.sub_value_format : ((w && w[`${button.sub_value_attribute}_unit`]) || (_FC_UNIT_MAP[button.sub_value_attribute] && w && w[_FC_UNIT_MAP[button.sub_value_attribute]]) || _FC_UNIT_FALLBACK[button.sub_value_attribute] || '');
                    subValue = formatSubValue(svFmt, svUnit);
                    subValueSig = `sv-fc:${button.sub_value_attribute}|${subValue}`;
                }
            }
        }
        let iconHtml = '';
        if (showIcon) {
            let inner;
            if (iconStrategy === 'native') {
                inner = '<ha-state-icon></ha-state-icon>';
            } else if (iconStrategy === 'image') {
                inner = `<img src="${iconValue}" class="custom-bottom-icon" />`;
            } else if (iconStrategy === 'builtin') {
                const useColored = (this._config && this._config.icon_set === 'colored');
                const iconLib = useColored ? AWC_COLORED_ICONS : AWC_BUILTIN_ICONS;
                const svgAttrs = useColored
                    ? 'fill="none" stroke="none"'
                    : 'fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"';
                inner = `<svg class="awc-icon${useColored ? ' awc-colored' : ''}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ${svgAttrs}>${iconLib[iconValue] || iconLib['default']}</svg>`;
            } else {
                inner = `<ha-icon icon="${iconValue}"></ha-icon>`;
            }
            iconHtml = `<span class="button-icon">${inner}</span>`;
        }
        const nameHtml = showLabel && (name || isEnhanced)
            ? (isLabelMarquee
                ? `<span class="button-name awc-marquee-host" data-speed="${marqueeSpeed}" data-rtl="${marqueeRtl ? 1 : 0}"><span class="awc-marquee-track"><span class="awc-marquee-text">${name}</span></span></span>`
                : `<span class="button-name">${name}</span>`)
            : '';
        let inner;
        if (useFancyUnit) {
            let fancyVal = formatted;
            let fancyUnitStr = unit;
            if (!isForecast) {
                const sensor = hass.states[button.entity];
                const isWeather = sensor && sensor.attributes && sensor.attributes.temperature !== undefined;
                if (!button.attribute || button.attribute === 'temperature') {
                    const rawTemp = isWeather ? sensor.attributes.temperature : (sensor && sensor.state);
                    const rawUnit = isWeather ? (sensor.attributes.temperature_unit || '') : (sensor && sensor.attributes && sensor.attributes.unit_of_measurement || '');
                    fancyVal = (rawTemp != null && this._numFmt) ? this._numFmt.format(rawTemp) : (rawTemp != null ? rawTemp : formatted);
                    if (!hasUnitFormat) fancyUnitStr = rawUnit;
                }
            }
            inner = `${fancyVal}<span class="fancy-unit">${fancyUnitStr}</span>`;
        } else {
            inner = hasUnitFormat ? `${formatted}${unit}` : (unit ? `${formatted} ${unit}` : `${formatted}`);
        }
        let subBelowHtml = '';
        if (subValue) {
            if (isSubMarquee) {
                subBelowHtml = `<span class="button-sub awc-marquee-host" data-speed="${marqueeSpeed}" data-rtl="${marqueeRtl ? 1 : 0}"><span class="awc-marquee-track"><span class="awc-marquee-text">${subValue}</span></span></span>`;
            } else {
                subBelowHtml = `<span class="button-sub">${subValue}</span>`;
            }
        }
        const valHtml = !showValue ? ''
            : isValueMarquee
            ? `<span class="button-val awc-marquee-host" data-speed="${marqueeSpeed}" data-rtl="${marqueeRtl ? 1 : 0}"><span class="awc-marquee-track"><span class="awc-marquee-text">${inner}</span></span></span>`
            : `<span class="button-val">${inner}</span>`;
        const isFree = (button.position || '').toString().toLowerCase() === 'custom';
        const posAnchor = isFree ? (button.position_anchor || 'top-left') : '', posX = isFree ? String(button.position_x || 0).trim() : '0';
        const posY = isFree ? String(button.position_y || 0).trim() : '0';
        const effectiveBg = button.background !== undefined ? button.background : rowBg;
        const classes = ['button', `overflow-${overflowMode}`];
        if (hasAnyMarquee) {
            classes.push('overflow-marquee'); if (isLabelMarquee && isValueMarquee) classes.push('marquee-both');
            else if (isLabelMarquee) classes.push('marquee-label');
            else if (isValueMarquee) classes.push('marquee-value');
        }
        if (fcLoading) classes.push('button-loading');
        if (subValue) classes.push('has-sub');
        if (!showIcon) classes.push('no-icon');
        if (!nameHtml) classes.push('no-name');
        else if (isEnhanced && !name) classes.push('empty-name');
        if (!showLabel && !showValue) classes.push('icon-only'); if (effectiveFormat === 'stacked') classes.push('format-stacked');
        else if (effectiveFormat === 'vertical') classes.push('format-vertical');
        if (isRingType) classes.push('button-ring');
        const iconBg = button.icon_background !== undefined ? button.icon_background : areaCtx.button_icon_background;
        if (iconBg === true) classes.push('has-icon-bg');
        else if (iconBg === false) classes.push('no-icon-bg');
        if (effectiveBg) {
            classes.push('with-bg');
            if (bgStyle === 'contrast' || bgStyle === 'frosted' || bgStyle === 'theme') classes.push(bgStyle);
        } else if (iconBg === true || (iconBg !== false && areaCtx.button_icon_background === true)) {
            if (bgStyle === 'contrast' || bgStyle === 'frosted' || bgStyle === 'theme') classes.push(bgStyle);
        }
        const effectiveBgColor = button.background_color || areaCtx.button_background_color || '';
        const effectiveIconBgColor = button.icon_background_color || areaCtx.button_icon_background_color || '';
        let buttonTintColor = '';
        if (Array.isArray(button.color_thresholds) && button.color_thresholds.length) {
            const ctEntity = button.color_threshold_entity || button.entity;
            const ctAttr = button.color_threshold_attribute || button.attribute;
            let ctVal;
            if (isForecast && fcEntry) {
                const fca = button.color_threshold_entity ? button.color_threshold_attribute : (ctAttr || button.attribute);
                if (button.color_threshold_entity) {
                    const ctr = this._resolveSensorValue(hass, button.color_threshold_entity, button.color_threshold_attribute);
                    ctVal = parseFloat(ctr.rawNumeric != null ? ctr.rawNumeric : ctr.formatted);
                } else {
                    ctVal = parseFloat(fcEntry[fca]);
                }
            } else if (ctEntity) {
                const ctr = this._resolveSensorValue(hass, ctEntity, ctAttr);
                ctVal = parseFloat(ctr.rawNumeric != null ? ctr.rawNumeric : ctr.formatted);
            }
            if (!isNaN(ctVal)) {
                const sorted = [...button.color_thresholds].filter(t => t.value !== '' && t.value !== undefined && t.color).sort((a, b) => parseFloat(a.value) - parseFloat(b.value));
                for (const t of sorted) { if (ctVal >= parseFloat(t.value)) buttonTintColor = t.color; }
            }
        }
        const inlineStyles = [];
        if (width) inlineStyles.push(isFree ? 'width:100%;max-width:100%' : `width:${width};max-width:${width}`);
        if (height) inlineStyles.push(`height:${height}`);
        if (effectiveBgColor) inlineStyles.push(`--awc-bottom-bg-color:${effectiveBgColor}`);
        if (effectiveIconBgColor) inlineStyles.push(`--awc-stacked-icon-bg:${effectiveIconBgColor}`);
        if (buttonTintColor) { inlineStyles.push(`--awc-button-tint:${buttonTintColor}`); classes.push('has-tint'); }
        if (button.padding !== undefined && button.padding !== '') inlineStyles.push(`padding:${button.padding}`);
        const _wOp = (w) => { const n = parseFloat(w); if (isNaN(n)) return ''; return Math.min(1, Math.max(0.4, 0.4 + (n - 100) * 0.6 / 800)).toFixed(2); };
        for (const [k, v, v2] of [
            ['text_size','--awc-bottom-font-size'], ['label_size','--awc-button-name-font-size'], ['inner_gap','--awc-button-gap'],
            ['text_gap','--awc-button-text-gap'], ['icon_size','--awc-icon-size'], ['icon_padding','--awc-icon-padding'],
            ['value_weight','--awc-button-value-weight','--awc-stacked-value-weight'], ['label_weight','--awc-button-name-weight'],
            ['sub_value_size','--awc-sub-size'], ['sub_value_weight','--awc-sub-weight'],
        ]) { if (button[k]) { inlineStyles.push(`${v}:${button[k]}`); if (v2) inlineStyles.push(`${v2}:${button[k]}`); } }
        if (button.label_weight) { const o = _wOp(button.label_weight); if (o) { inlineStyles.push(`--awc-button-name-opacity:${o}`); inlineStyles.push(`--awc-stacked-name-opacity:${o}`); } }
        if (button.value_weight) { const o = _wOp(button.value_weight); if (o) inlineStyles.push(`--awc-button-value-opacity:${o}`); }
        if (button.sub_value_weight) { const o = _wOp(button.sub_value_weight); if (o) inlineStyles.push(`--awc-sub-opacity:${o}`); }
        if (button.text_size) inlineStyles.push(`font-size:${button.text_size}`);
        if (button.text_shadow === true) inlineStyles.push('--_button-no-bg-shadow:var(--_button-shadow-avail)');
        if (subOverflow === 'clip') inlineStyles.push('--awc-sub-overflow:clip');
        else if (subOverflow === 'wrap') inlineStyles.push('--awc-sub-overflow:clip;--awc-sub-wrap:normal;--awc-sub-visible:visible');
        const isBarType = button.type === 'bar';
        let gaugeVal = parseFloat(formatted), gaugeSig = '';
        if ((isRingType || isBarType) && button.gauge_entity) {
            const gr = this._resolveSensorValue(hass, button.gauge_entity, button.gauge_attribute);
            gaugeVal = parseFloat(gr.rawNumeric != null ? gr.rawNumeric : gr.formatted);
            gaugeSig = `${button.gauge_entity}|${button.gauge_attribute || ''}|${gaugeVal}`;
        } else if ((isRingType || isBarType) && !button.gauge_entity && isForecast && button.gauge_attribute && fcEntry) {
            const gRaw = fcEntry[button.gauge_attribute];
            if (gRaw != null) gaugeVal = parseFloat(gRaw);
            gaugeSig = `fc-g:${button.gauge_attribute}|${gaugeVal}`;
        }
        let ringHtml = '', ringWrapStyle = '', hasSegments = false, barHtml = '';
        if (isRingType) {
            const ringMin = parseFloat(button.ring_min) || 0, ringMax = parseFloat(button.ring_max) || 100;
            const ringW = parseFloat(button.ring_width) || 4, ringGap = parseFloat(button.ring_gap) || 3;
            const g = computeGauge(gaugeVal, ringMin, ringMax, (button.ring_color || '').trim(), Array.isArray(button.ring_thresholds) ? button.ring_thresholds : [], button.ring_threshold_mode || 'solid');
            hasSegments = g.hasSegments;
            ringHtml = '<div class="button-ring-track"></div>';
            const styleParts = [`--awc-ring-pct:${g.pct}%`, `--awc-ring-w:${ringW}px`, `--awc-ring-gap:${ringGap}px`];
            if (g.gradient) styleParts.push(`--awc-ring-gradient:conic-gradient(${g.gradient})`);
            else if (g.effectiveColor) styleParts.push(`--awc-ring-color:${g.effectiveColor}`);
            ringWrapStyle = styleParts.join(';');
        }
        if (isBarType) {
            const barMin = parseFloat(button.bar_min) || 0, barMax = parseFloat(button.bar_max) || 100;
            const barH = parseFloat(button.bar_height) || 4;
            const g = computeGauge(gaugeVal, barMin, barMax, (button.bar_color || '').trim(), Array.isArray(button.bar_thresholds) ? button.bar_thresholds : [], button.bar_threshold_mode || 'solid');
            classes.push('button-bar-type');
            const scale = (parseFloat(g.pct) / 100).toFixed(4);
            const fillStyles = [`--awc-bar-scale:${scale}`];
            if (g.barGradient) fillStyles.push(`--awc-bar-gradient:linear-gradient(to right, ${g.barGradient})`);
            else if (g.effectiveColor) fillStyles.push(`--awc-bar-color:${g.effectiveColor}`);
            barHtml = `<div class="button-bar" style="--awc-bar-h:${barH}px"><div class="button-bar-track"></div><div class="button-bar-fill" data-bar-idx="${idx}" style="${fillStyles.join(';')}"></div></div>`;
        }
        const buttonAlignClass = button.align || '';
        if (buttonAlignClass) classes.push(`align-${buttonAlignClass}`);
        if (button.button_round === true) classes.push('button-round');
        const loaderHtml = fcLoading ? '<div class="button-loader"><span></span><span></span><span></span></div>' : '';
        const elOrder = button.element_order ? button.element_order.toString().split(',').map(s => s.trim().toLowerCase()) : null;
        let iconOrder = '', contentOrder = '', barOrder = '';
        if (elOrder && elOrder.length >= 2) {
            const textIdx = elOrder.indexOf('text');
            const iconIdx = elOrder.indexOf('icon');
            const barIdx = elOrder.indexOf('bar');
            if (iconIdx >= 0) iconOrder = ` style="order:${iconIdx}"`;
            if (textIdx >= 0) contentOrder = ` style="order:${textIdx}"`;
            else {
                const textEls = [elOrder.indexOf('label'), elOrder.indexOf('value'), elOrder.indexOf('sub')].filter(i => i >= 0);
                if (textEls.length) contentOrder = ` style="order:${Math.min(...textEls)}"`;
            }
            if (barIdx >= 0) barOrder = ` style="order:${barIdx}"`;
        }
        let txtOrder = button.text_order ? button.text_order.toString().split(',').map(s => s.trim().toLowerCase()) : null;
        // Derive text order from element_order when text_order is absent
        if (!txtOrder && elOrder) {
            const legacyTxts = ['label','value','sub'].filter(t => elOrder.indexOf(t) >= 0);
            if (legacyTxts.length >= 2) {
                legacyTxts.sort((a, b) => elOrder.indexOf(a) - elOrder.indexOf(b));
                txtOrder = legacyTxts;
            }
        }
        let nameOrder = '', valOrder = '', subOrder = '';
        if (txtOrder && txtOrder.length >= 2) {
            const li = txtOrder.indexOf('label');
            const vi = txtOrder.indexOf('value');
            const si = txtOrder.indexOf('sub');
            if (li >= 0) nameOrder = ` style="order:${li}"`;
            if (vi >= 0) valOrder = ` style="order:${vi}"`;
            if (si >= 0) subOrder = ` style="order:${si}"`;
        }
        const nameHtmlOrdered = nameHtml ? nameHtml.replace('<span class="button-name', `<span${nameOrder} class="button-name`) : '';
        const valHtmlOrdered = valHtml ? valHtml.replace('<span class="button-val', `<span${valOrder} class="button-val`) : '';
        const subHtmlOrdered = subBelowHtml ? (subOrder ? subBelowHtml.replace('<span class="button-sub', `<span${subOrder} class="button-sub`) : subBelowHtml) : '';
        const contentHtml = (nameHtmlOrdered || valHtmlOrdered || subHtmlOrdered) ? `<span class="button-content"${contentOrder}>${nameHtmlOrdered}${valHtmlOrdered}${subHtmlOrdered}</span>` : '';
        const iconHtmlOrdered = iconHtml && iconOrder ? iconHtml.replace('<span class="button-icon', `<span${iconOrder} class="button-icon`) : (iconHtml || '');
        const barHtmlOrdered = barHtml && barOrder ? barHtml.replace('class="button-bar" style="', `class="button-bar" style="order:${elOrder.indexOf('bar')};`) : (barHtml || '');
        const style = inlineStyles.length ? ` style="${inlineStyles.join(';')}"` : '';
        let buttonHtml = `<div class="${classes.join(' ')}" data-idx="${idx}" data-area="${areaIdx}"${style}>${loaderHtml}${iconHtmlOrdered}${contentHtml}${barHtmlOrdered}</div>`;
        if (isRingType) {
            buttonHtml = `<div class="button-ring-wrap${hasSegments ? ' has-segments' : ''}${fcLoading ? ' button-loading' : ''}" data-idx="${idx}" data-area="${areaIdx}" style="${ringWrapStyle}">${ringHtml}${buttonHtml}</div>`;
        }
        const _n = (v) => v != null ? v : '';
        const sig = [idx, formatted, unit, iconValue, iconStrategy, showIcon, showLabel, showValue, overflowMode, labelOverflow, marqueeSpeed, marqueeRtl, width, height, nameSig, effectiveBg, bgStyle, effectiveFormat, _n(iconBg), isFree, posAnchor, posX, posY, effectiveBgColor, effectiveIconBgColor, _n(button.padding), button.text_size||'', button.label_size||'', button.inner_gap||'', button.text_gap||'', button.icon_size||'', button.icon_padding||'', buttonAlignClass, subValueSig, _n(button.sub_value_format), button.sub_value_size||'', button.sub_value_weight||'', button.sub_value_overflow||'', button.hide_sub_value||'', useFancyUnit, button.value_weight||'', button.label_weight||'', button.button_round||'', button.type||'', _n(button.ring_min), _n(button.ring_max), button.ring_color||'', button.ring_width||'', button.ring_gap||'', button.ring_threshold_mode||'', button._ringThresholdsSig||'', _n(button.bar_min), _n(button.bar_max), button.bar_color||'', button.bar_height||'', button.bar_threshold_mode||'', button._barThresholdsSig||'', gaugeSig, buttonTintColor, button.element_order||'', button.text_order||''].join('|');
        return { html: buttonHtml, sig, sensorObj, iconStrategy, showIcon, isFree, posAnchor, posX, posY, width, areaIdx, buttonIdx: idx, hidden: false };
    }
    _updateImage(hass, isNight, weatherState = 'default') {
        if (!this._elements || !this._elements.imageSlot) return; const img = this._elements.img; const slot = this._elements.imageSlot;
        const statusSrc = this._calculateStatusImage(hass, isNight);
        const baseSrc = isNight ? this._config.image_night : this._config.image_day;
        const src = statusSrc || baseSrc || this._config.image_day || '';
        if (src) {
            if (img.getAttribute('src') !== src) img.src = src;
        } else {
            img.removeAttribute('src');
        }
        slot.hidden = !img.getAttribute('src');
    }
    _updateWeatherBg(weatherState, themeDark) {
        const container = this._elements && this._elements.weatherBg;
        const root = this._elements && this._elements.root;
        if (!container || !root) return;
        const cfg = this._config || {};
        const dayPath = (cfg.weather_image_path || '').trim();
        const nightPath = (cfg.weather_image_path_night || '').trim();
        // Off when no day folder is set.
        if (!dayPath) {
            if (this._weatherBgActive) {
                container.innerHTML = '';
                root.classList.remove('has-weather-bg');
                this._weatherBgActive = false;
                this._weatherBgState = null;
                this._weatherBgDark = null;
                this._weatherBgResolved = null;
                this._restoreShaderAfterBg();
            }
            return;
        }
        // Day folder only → use for both; both set → follow color mode.
        const useNight = !!(themeDark && nightPath);
        const basePath = useNight ? nightPath : dayPath;
        if (this._weatherBgState === weatherState && this._weatherBgDark === useNight) return;
        this._weatherBgState = weatherState;
        this._weatherBgDark = useNight;
        const folder = basePath.endsWith('/') ? basePath : basePath + '/';
        const exts = ['', '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.mp4'];
        container.innerHTML = '';
        this._weatherBgResolved = null;
        this._probeWeatherMedia(container, root, folder, weatherState, exts, 0);
    }
    _probeWeatherMedia(container, root, folder, state, exts, idx) {
        if (idx >= exts.length) {
            root.classList.remove('has-weather-bg');
            const wasActive = this._weatherBgActive;
            this._weatherBgActive = false;
            this._weatherBgResolved = null;
            if (wasActive) {
                this._restoreShaderAfterBg();
            }
            return;
        }
        const url = `${folder}${state}${exts[idx]}`;
        if (exts[idx] === '.mp4') {
            const video = document.createElement('video');
            video.autoplay = true; video.loop = true; video.muted = true; video.playsInline = true;
            video.setAttribute('muted', '');
            video.src = url;
            video.onloadeddata = () => {
                container.innerHTML = '';
                container.appendChild(video);
                root.classList.add('has-weather-bg');
                this._weatherBgActive = true;
                this._weatherBgResolved = url;
                this._applyWeatherBgActive();
            };
            video.onerror = () => {
                this._probeWeatherMedia(container, root, folder, state, exts, idx + 1);
            };
        } else {
            const img = new Image();
            img.onload = () => {
                container.innerHTML = '';
                container.appendChild(img);
                root.classList.add('has-weather-bg');
                this._weatherBgActive = true;
                this._weatherBgResolved = url;
                this._applyWeatherBgActive();
            };
            img.onerror = () => {
                this._probeWeatherMedia(container, root, folder, state, exts, idx + 1);
            };
            img.src = url;
        }
    }
    _applyWeatherBgActive() {
        this._teardownShaderForBg();
        if (!this._isEffectivelyDisabled()) this._startAnimation();
    }
    _teardownShaderForBg() {
        const canvas = this._elements && this._elements.glCanvas;
        if (canvas) canvas.style.display = 'none';
        if (this._gl) this._destroyGL();
    }
    _restoreShaderAfterBg() {
        const disabled = this._areShadersDisabled();
        this._applyShaderDisabledState(disabled);
        if (!disabled) {
            if (this._initializationComplete && this._isVisible && !this._gl) {
                this._initWebGL();
                this._shaderParams = this._weatherToUniforms();
            }
            this._startAnimation();
        } else {
            this._stopAnimation();
        }
    }
    _updateSimpleBg(themeDark) {
        const container = this._elements && this._elements.simpleBg;
        const root = this._elements && this._elements.root;
        if (!container || !root) return;
        const cfg = this._config || {};
        const on = cfg.simple_background === true;
        const useNight = !!themeDark;
        if (!on) {
            if (this._simpleBgActive) {
                root.classList.remove('has-simple-bg');
                this._simpleBgActive = false;
                this._simpleBgDark = null;
            }
            return;
        }
        if (this._simpleBgActive && this._simpleBgDark === useNight) return;
        const wasActive = this._simpleBgActive;
        this._simpleBgActive = true;
        this._simpleBgDark = useNight;
        root.classList.add('has-simple-bg');
        if (!wasActive) this._applyWeatherBgActive();
    }
    _refreshMarqueeObservation() {
        if (!this._marqueeObserver) {
            this._marqueeObserver = new ResizeObserver(entries => {
                for (const entry of entries) {
                    entry.target.querySelectorAll('.awc-marquee-host')
                        .forEach(host => this._measureMarqueeOne(host));
                }
            });
        }
        this._marqueeObserver.disconnect();
        for (const els of (this._elements && this._elements.buttonAreaEls) || []) {
            if (els.row) {
                els.row.querySelectorAll('.button.overflow-marquee')
                  .forEach(button => this._marqueeObserver.observe(button));
            }
        }
        const tw = this._elements && this._elements.textWrapper;
        if (tw) {
            tw.querySelectorAll('.button-free .button.overflow-marquee')
              .forEach(button => this._marqueeObserver.observe(button));
        }
    }
    _measureMarqueeOne(host) {
        const track = host.querySelector('.awc-marquee-track'); if (!track) return; const rtl = host.dataset.rtl === '1';
        host.classList.toggle('awc-marquee-rtl', rtl); if (host.clientWidth === 0) return; const firstText = track.querySelector('.awc-marquee-text');
        if (!firstText) return; const naturalWidth = firstText.offsetWidth; const hostWidth = host.clientWidth;
        const shouldAnimate = naturalWidth > hostWidth + 1;
        if (shouldAnimate) {
            if (track.childElementCount === 1) {
                const sep1 = document.createElement('span'); sep1.className = 'awc-marquee-sep'; const text2 = firstText.cloneNode(true);
                const sep2 = document.createElement('span'); sep2.className = 'awc-marquee-sep'; track.append(sep1, text2, sep2);
            }
            const loopWidth = track.scrollWidth / 2, speed = Math.max(5, parseFloat(host.dataset.speed) || 30), duration = Math.max(2, loopWidth / speed);
            host.style.setProperty('--awc-marquee-duration', `${duration.toFixed(2)}s`);
            host.classList.add('is-animating');
        } else {
            while (track.childElementCount > 1) track.lastElementChild.remove(); host.classList.remove('is-animating');
            host.style.removeProperty('--awc-marquee-duration');
        }
    }
    _computeVerticalVisHeight(areaIdx) {
        const els = this._elements && this._elements.buttonAreaEls && this._elements.buttonAreaEls[areaIdx];
        const bt = els && els.row; if (!bt || !bt.children.length) return;
        const area = this._areas[areaIdx]; if (!area) return;
        const visCount = parseInt(area.scroll_count, 10);
        if (!Number.isFinite(visCount) || visCount < 1) return; const firstButton = bt.children[0]; if (!firstButton || firstButton.offsetHeight < 1) return;
        const gap = parseFloat(getComputedStyle(bt).gap) || 8;
        bt.style.setProperty('--awc-row-max-height', `${firstButton.offsetHeight * visCount + gap * (visCount - 1)}px`);
    }
    _handleVisibilityChange(entries) {
        const entry = entries[0], wasVisible = this._isVisible;
        this._isVisible = entry.isIntersecting;
        if (this._elements && this._elements.root) this._elements.root.classList.toggle('is-offscreen', !this._isVisible);
        if (this._isVisible && !wasVisible) {
            this._shaderParams = this._weatherToUniforms();
            this._startAnimation();
        } else if (!this._isVisible && wasVisible) {
            this._stopAnimation();
        }
    }
    _handleDocVisibility() {
        if (document.hidden) {
            this._stopAnimation();
        } else if (this._isVisible) {
            this._startAnimation();
        }
    }
    _handleTap(e) {
        e.stopPropagation(); const cfg = this._config;
        this.dispatchEvent(new CustomEvent('hass-action', { bubbles: true, composed: true, detail: { config: { entity: cfg.weather_entity, tap_action: cfg.card_tap_action }, action: 'tap' } }));
    }
    _handleButtonClick(e) {
        const buttonEl = e.target.closest('.button'); if (!buttonEl) return; const idx = parseInt(buttonEl.dataset.idx, 10);
        const areaIdx = parseInt(buttonEl.dataset.area, 10);
        const area = this._areas && this._areas[areaIdx]; if (!area) return;
        const button = area.buttons && area.buttons[idx]; if (!button || !button.entity) return; e.stopPropagation();
        const tapAction = button.tap_action || { action: 'more-info' };
        this.dispatchEvent(new CustomEvent('hass-action', { bubbles: true, composed: true, detail: { config: { entity: button.entity, tap_action: tapAction }, action: 'tap' } }));
    }
    _tryInitialize() {
        if (this._initializationComplete) return; if (!this._renderGate.hasFirstHass) return; if (!this._renderGate.hasValidDimensions) return;
        if (!this._cachedDimensions.width || !this._cachedDimensions.height) return;
        this._initializationComplete = true; const w = this._cachedDimensions.width / this._cachedDimensions.dpr;
        const h = this._cachedDimensions.height / this._cachedDimensions.dpr; this._width = w; this._lastInitWidth = w;
        requestAnimationFrame(() => {
            if (!this.isConnected) return;
            if (this._areShadersDisabled()) {
                this._applyShaderDisabledState(true);
                return;
            }
            if (this._gl && !this._gl.isContextLost() && this._shaderBank) {
                this._prevShaderParams = null; this._prevFxSpeed = null;
            } else {
                this._gl = null; this._glProg = null; this._glUniforms = null;
                this._initWebGL();
            }
            this._shaderParams = this._weatherToUniforms();
            this._startAnimation();
        });
    }
    _areShadersDisabled() {
        const cfg = this._config || {};
        if (this._weatherBgActive) return true;
        if ((cfg.weather_image_path || '').trim()) return true;
        if (cfg.simple_background === true) return true;
        return cfg.disable_background === true;
    }
    _applyShaderDisabledState(disabled) {
        const canvas = this._elements && this._elements.glCanvas;
        const root = this._elements && this._elements.root;
        if (canvas) canvas.style.display = disabled ? 'none' : '';
        if (root) root.classList.toggle('shaders-off', disabled);
        if (disabled && this._gl) this._destroyGL();
    }
    _updateCanvasDimensions(forceW = null, forceH = null) {
        if (!this._elements || !this._elements.root) return false;
        let rawW = forceW !== null ? forceW : this._elements.root.clientWidth;
        let rawH = forceH !== null ? forceH : this._elements.root.clientHeight;
        if (rawW === 0 || rawH === 0) return false;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        let scaledWidth = Math.floor(rawW * dpr), scaledHeight = Math.floor(rawH * dpr);
        const maxPx = 1200 * 800;
        if (scaledWidth * scaledHeight > maxPx) {
            const s = Math.sqrt(maxPx / (scaledWidth * scaledHeight));
            scaledWidth = Math.floor(scaledWidth * s);
            scaledHeight = Math.floor(scaledHeight * s);
        }
        const widthChanged = this._cachedDimensions.width !== scaledWidth;
        const heightDiff = Math.abs(this._cachedDimensions.height - scaledHeight);
        if (!widthChanged && heightDiff < 100) return false;
        this._cachedDimensions = { width: scaledWidth, height: scaledHeight, dpr };
        const canvas = this._elements.glCanvas;
        if (canvas) {
            canvas.width = scaledWidth;
            canvas.height = scaledHeight;
            canvas.style.width = `${rawW}px`;
            canvas.style.height = `${rawH}px`;
        }
        const sc = this._elements && this._elements.starCanvas;
        const sbg = this._elements && this._elements.starBgCanvas;
        if (sc) {
            const sw = Math.floor(rawW * dpr);
            const sh = Math.floor(rawH * dpr);
            sc.width = sw; sc.height = sh;
            sc.style.width = `${rawW}px`;
            sc.style.height = `${rawH}px`;
            this._starCtx = null;
            if (sbg) {
                sbg.width = sw; sbg.height = sh;
                sbg.style.width = `${rawW}px`;
                sbg.style.height = `${rawH}px`;
                this._starBgCtx = null;
                this._starBgPainted = false;
            }
        }
        if (scaledWidth > 0 && scaledHeight > 0) {
            this._renderGate.hasValidDimensions = true;
        }
        return true;
    }
    _scheduleResize() {
        if (this._resizeDebounceTimer) clearTimeout(this._resizeDebounceTimer);
        this._resizeDebounceTimer = setTimeout(() => {
            this._resizeDebounceTimer = null;
            if (this._gl) {
                const canvas = this._elements.glCanvas;
                if (canvas) this._gl.viewport(0, 0, canvas.width, canvas.height);
            }
        }, 300);
    }
    _bakeStarLayers(baseCount = 1000) {
        const seed = this._glSeed;
        let s0 = ((seed * 1667.3) | 0) >>> 0;
        const rng = () => { s0 = (s0 * 16807 + 0) % 2147483647; return (s0 & 0x7fffffff) / 0x7fffffff; };
        const sbg = this._elements && this._elements.starBgCanvas;
        if (!sbg || sbg.width === 0 || sbg.height === 0) return;
        const W = sbg.width, H = sbg.height;
        const bgCtx = this._starBgCtx || (this._starBgCtx = sbg.getContext('2d', { alpha: true }));
        if (!bgCtx) return;
        bgCtx.clearRect(0, 0, W, H);

        const palettes = [
            [190, 210, 255],
            [210, 225, 255],
            [255, 250, 245],
            [255, 235, 200],
        ];
        const pickColor = (v) => v < 0.15 ? palettes[0] : v < 0.60 ? palettes[1] : v < 0.85 ? palettes[2] : palettes[3];
        const batches = new Map();
        const addToBatch = (rgb, alpha, x, y, r) => {
            const qA = ((alpha * 15 + 0.5) | 0) / 15;
            const key = `${rgb[0]},${rgb[1]},${rgb[2]}|${qA}`;
            let b = batches.get(key);
            if (!b) { b = { rgb, alpha: qA, pts: [] }; batches.set(key, b); }
            b.pts.push(x, y, r);
        };

        const tinyCount = Math.floor(baseCount * 1.1);
        const smallCount = Math.floor(baseCount * 0.35);
        const clusterCount = Math.floor(baseCount * 0.045);

        const mwActive = baseCount > 750;
        let mwCosA, mwSinA, mwPerpX, mwPerpY, mwCx, mwCy, mwBandW;
        if (mwActive) {
            const mAngle = -0.35 + (rng() - 0.5) * 0.45;
            mwCosA = Math.cos(mAngle); mwSinA = Math.sin(mAngle); mwPerpX = -mwSinA; mwPerpY = mwCosA;
            mwBandW = H * 0.18;
            mwCx = W * 0.5 + (rng() - 0.5) * W * 0.15;
            mwCy = H * 0.42 + (rng() - 0.5) * H * 0.12;
        }

        for (let i = 0; i < tinyCount; i++) {
            let x = rng() * W;
            let y = rng() * H;
            if (mwActive && i % 3 === 0) {
                const bx = mwCx + mwCosA * ((x / W - 0.5) * W * 1.2) + mwPerpX * ((y / H - 0.5) * mwBandW);
                const by = mwCy + mwSinA * ((x / W - 0.5) * W * 1.2) + mwPerpY * ((y / H - 0.5) * mwBandW);
                if (bx >= 0 && bx <= W && by >= 0 && by <= H) { x = bx; y = by; }
            }
            let r = 0.6 + rng() * 0.6;
            if (i % 8 === 0) r *= 1.8;
            r = Math.min(r, 2.5);
            const alpha = 0.35 + rng() * 0.35;
            addToBatch(pickColor(rng()), alpha, x, y, r);
        }

        for (let i = 0; i < smallCount; i++) {
            let x = rng() * W;
            let y = rng() * H;
            if (mwActive && i % 3 === 0) {
                const bx = mwCx + mwCosA * ((x / W - 0.5) * W * 1.2) + mwPerpX * ((y / H - 0.5) * mwBandW * 0.8);
                const by = mwCy + mwSinA * ((x / W - 0.5) * W * 1.2) + mwPerpY * ((y / H - 0.5) * mwBandW * 0.8);
                if (bx >= 0 && bx <= W && by >= 0 && by <= H) { x = bx; y = by; }
            }
            let r = 0.8 + rng() * 0.8;
            if (i % 8 === 0) r *= 1.8;
            r = Math.min(r, 2.5);
            const alpha = 0.55 + rng() * 0.35;
            const rgb = pickColor(rng());
            addToBatch(rgb, alpha, x, y, r);
            if (i % 8 === 0) {
                const glowR = r * 3.0;
                bgCtx.globalAlpha = alpha * 0.12;
                const g = bgCtx.createRadialGradient(x, y, r * 0.5, x, y, glowR);
                g.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},1)`);
                g.addColorStop(0.4, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.2)`);
                g.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
                bgCtx.fillStyle = g;
                bgCtx.beginPath();
                bgCtx.arc(x, y, glowR, 0, 6.2832);
                bgCtx.fill();
            }
        }

        for (let c = 0; c < clusterCount; c++) {
            const cx = 0.15 * W + rng() * 0.7 * W;
            const cy = rng() * H;
            const count = 5 + Math.floor(rng() * 6);
            for (let j = 0; j < count; j++) {
                const x = cx + (rng() - 0.5) * 25;
                const y = cy + (rng() - 0.5) * 18;
                let r = 0.5 + rng() * 0.5;
                if (j % 8 === 0) r *= 1.8;
                r = Math.min(r, 2.5);
                addToBatch(palettes[1], 0.30 + rng() * 0.20, x, y, r);
            }
        }

        for (const batch of batches.values()) {
            bgCtx.globalAlpha = batch.alpha;
            bgCtx.fillStyle = `rgb(${batch.rgb[0]},${batch.rgb[1]},${batch.rgb[2]})`;
            bgCtx.beginPath();
            const pts = batch.pts;
            for (let j = 0; j < pts.length; j += 3) {
                bgCtx.moveTo(pts[j] + pts[j + 2], pts[j + 1]);
                bgCtx.arc(pts[j], pts[j + 1], pts[j + 2], 0, 6.2832);
            }
            bgCtx.fill();
        }
        bgCtx.globalAlpha = 1;
        this._starBgPainted = true;

        const HERO_COUNT = 8;
        const heroes = [];
        const dpr = Math.min(window.devicePixelRatio || 1, 1.4);
        const useOC = typeof OffscreenCanvas !== 'undefined';
        for (let i = 0; i < HERO_COUNT; i++) {
            const isFeature = i < 2;
            const size = Math.min(isFeature ? (1.8 + rng() * 0.4) : (1.3 + rng() * 0.4), 1.8);
            const haloOuterR = isFeature ? 3.8 : 2.8;
            const brightness = 0.85 + rng() * 0.15;
            const rgb = pickColor(rng());
            const texPx = Math.ceil(size * haloOuterR * 2 + 4) * dpr;
            const hc = useOC ? new OffscreenCanvas(texPx, texPx) : document.createElement('canvas');
            if (!useOC) { hc.width = texPx; hc.height = texPx; }
            const hCtx = hc.getContext('2d', { alpha: true });
            const mid = texPx / 2;
            const refSz = size * dpr;
            const haloA = isFeature ? 0.60 : 0.35;
            const hg = hCtx.createRadialGradient(mid, mid, refSz * 0.5, mid, mid, refSz * haloOuterR);
            hg.addColorStop(0, `rgba(255,255,255,${haloA})`);
            hg.addColorStop(0.15, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${(haloA * 0.8).toFixed(3)})`);
            hg.addColorStop(0.4, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${(haloA * 0.25).toFixed(3)})`);
            hg.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
            hCtx.fillStyle = hg;
            hCtx.beginPath();
            hCtx.arc(mid, mid, refSz * haloOuterR, 0, 6.2832);
            hCtx.fill();

            if (isFeature) {
                const rayLen = refSz * 3.5;
                const rayW = refSz * 0.4;
                hCtx.save();
                hCtx.translate(mid, mid);
                for (let r = 0; r < 4; r++) {
                    hCtx.rotate(Math.PI / 4);
                    const rg = hCtx.createLinearGradient(0, 0, rayLen, 0);
                    rg.addColorStop(0, `rgba(255,255,255,${(haloA * 0.9).toFixed(3)})`);
                    rg.addColorStop(0.15, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${(haloA * 0.7).toFixed(3)})`);
                    rg.addColorStop(0.5, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${(haloA * 0.2).toFixed(3)})`);
                    rg.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
                    hCtx.fillStyle = rg;
                    hCtx.fillRect(0, -rayW / 2, rayLen, rayW);
                    const rg2 = hCtx.createLinearGradient(0, 0, -rayLen, 0);
                    rg2.addColorStop(0, `rgba(255,255,255,${(haloA * 0.9).toFixed(3)})`);
                    rg2.addColorStop(0.15, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${(haloA * 0.7).toFixed(3)})`);
                    rg2.addColorStop(0.5, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${(haloA * 0.2).toFixed(3)})`);
                    rg2.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
                    hCtx.fillStyle = rg2;
                    hCtx.fillRect(-rayLen, -rayW / 2, rayLen, rayW);
                }
                hCtx.restore();
            }

            heroes.push({
                x: 0.06 + rng() * 0.88,
                y: 0.06 + rng() * 0.82,
                size, brightness, bodyR: 0.75,
                haloTex: hc, haloTexSize: texPx, haloOuterR, refSize: refSz,
                rgb, fillStr: `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`,
                phase: rng() * 6.2832,
                rate: 0.015 + rng() * 0.035,
                isFeature,
            });
        }
        this._starHeroes = heroes;
        this._starDpr = dpr;
    }
    _updateStars(sunEntity, weatherState) {
        const cfg = this._config || {};
        const isNight = this._isTimeNight;
        const vis = resolveVisuals(weatherState);
        if (!isNight || !vis.stars || cfg.night_sky_effects === false) {
            this._starMasterOpacity = 0;
            return;
        }

        const targetStarCount = vis.starCount;

        if (this._currentBakedStarCount !== targetStarCount) {
            this._currentBakedStarCount = targetStarCount;
            this._starBgPainted = false;
        }
        if (this._starMasterOpacity !== vis.starsOpacity) this._starBgPainted = false;
        this._starMasterOpacity = vis.starsOpacity;
    }
    _renderStars(timestamp) {
        const sc = this._elements && this._elements.starCanvas;
        const sbg = this._elements && this._elements.starBgCanvas;
        if (!sc || this._starMasterOpacity <= 0) {
            if (this._starsDirty && sc && sc.width > 0) {
                const ctx = this._starCtx || (this._starCtx = sc.getContext('2d', { alpha: true }));
                if (ctx) ctx.clearRect(0, 0, sc.width, sc.height);
                this._starsDirty = false;
            }
            if (sbg) sbg.style.opacity = '0';
            return;
        }
        const ctx = this._starCtx || (this._starCtx = sc.getContext('2d', { alpha: true }));
        if (!ctx) return;
        const cw = sc.width; const ch = sc.height;
        const master = this._starMasterOpacity;
        const dpr = this._starDpr || 1;

        if (sbg) sbg.style.opacity = master;

        if (!this._starBgPainted && sbg && sbg.width > 0) {
            this._bakeStarLayers(this._currentBakedStarCount || 800);
        }

        ctx.clearRect(0, 0, cw, ch);
        const heroes = this._starHeroes;
        if (!heroes) { ctx.globalAlpha = 1; this._starsDirty = true; return; }
        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.globalCompositeOperation = 'lighter';
        const cssW = cw / dpr;
        const cssH = ch / dpr;
        for (let i = 0; i < heroes.length; i++) {
            const h = heroes[i];
            h.phase += h.rate;
            const twinkle = Math.sin(h.phase) + Math.sin(h.phase * 2.7) * 0.5 + Math.sin(h.phase * 0.4) * 0.3;
            const size = h.size * (1 + twinkle * 0.35);
            const op = Math.min(1, Math.max(0, h.brightness * (1 + twinkle * 0.40))) * master;
            if (op < 0.05) continue;
            const px = h.x * cssW;
            const py = h.y * cssH;
            if (h.haloTex) {
                ctx.globalAlpha = op;
                const scale = size / h.refSize;
                const drawSize = h.haloTexSize * scale / dpr;
                ctx.drawImage(h.haloTex, px - drawSize * 0.5, py - drawSize * 0.5, drawSize, drawSize);
            }
            ctx.globalAlpha = Math.min(1, op * 1.1);
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(px, py, size * h.bodyR, 0, 6.2832);
            ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
        this._drawShootingStars(ctx, cssW, cssH);
        ctx.restore();
        ctx.globalAlpha = 1;
        this._starsDirty = true;
    }
    _drawShootingStars(ctx, w, h) {
        const m = this._starMasterOpacity, S = this._shootingStars, K = this._comets;
        if (Math.random() < 0.00429 && S.length < 2) {
            const sx = Math.random() < 0.7 ? Math.random() * w * 0.6 : w * 0.6 + Math.random() * w * 0.4;
            const dx = Math.random() < 0.3 ? -1 : 1, bl = Math.random() < 0.18;
            const sp = bl ? 3.5 + Math.random() * 2 : 5 + Math.random() * 5, cr = Math.random();
            const [hr, tr] = cr < 0.55 ? ['rgb(255,255,255)', 'rgb(255,255,240)']
                : cr < 0.75 ? ['rgb(255,245,210)', 'rgb(255,230,180)']
                : cr < 0.92 ? ['rgb(210,255,225)', 'rgb(180,240,200)']
                : ['rgb(255,210,160)', 'rgb(255,185,130)'];
            S.push({ x: sx, y: Math.random() * h * 0.5, vx: sp * dx, vy: 2 + Math.random() * 2,
                life: 1, dc: bl ? 0.032 : 0.045, sz: bl ? 2.5 + Math.random() * 1.5 : 1.5 + Math.random() * 1.5,
                bl, hr, tr, tb: new Float32Array(44), th: 0, tl: 0 });
        }
        ctx.lineCap = 'round';
        for (let i = S.length - 1; i >= 0; i--) {
            const s = S[i]; s.x += s.vx; s.vy += 0.045; s.y += s.vy; s.life -= s.dc;
            s.tb[s.th * 2] = s.x; s.tb[s.th * 2 + 1] = s.y; s.th = (s.th + 1) % 22; if (s.tl < 22) s.tl++;
            if (s.life <= 0) { S.splice(i, 1); continue; }
            const op = s.life * m; ctx.globalAlpha = op; ctx.fillStyle = s.hr;
            const fl = s.bl && s.life < 0.15 ? 1 + (0.15 - s.life) * 8 : 1;
            const hs = s.sz * (0.3 + s.life * 0.7) * fl;
            ctx.beginPath(); ctx.arc(s.x, s.y, hs, 0, 6.2832); ctx.fill();
            ctx.lineWidth = hs * 0.8; ctx.strokeStyle = s.tr;
            const segs = s.tl - 1;
            for (let b = 0; b < 4; b++) {
                const j0 = b * segs >> 2, j1 = (b + 1) * segs >> 2;
                if (j0 >= j1) continue;
                ctx.globalAlpha = op * (1 - (j0 + j1) * 0.5 / s.tl); ctx.beginPath();
                for (let j = j0; j <= j1; j++) {
                    const idx = (((s.th - 1 - j) % 22) + 22) % 22;
                    j === j0 ? ctx.moveTo(s.tb[idx * 2], s.tb[idx * 2 + 1]) : ctx.lineTo(s.tb[idx * 2], s.tb[idx * 2 + 1]);
                }
                ctx.stroke();
            }
        }
        if (!K.length && Math.random() < 0.0005456) {
            const sx = Math.random() < 0.5 ? -60 : w + 60, dir = sx < 0 ? 1 : -1, sp = 2.2 + Math.random() * 1.3, cr = Math.random();
            const [co, gl, tr] = cr < 0.50 ? ['220,240,255', '100,200,255', 'rgb(160,210,255)']
                : cr < 0.78 ? ['200,255,220', '120,220,160', 'rgb(150,230,180)']
                : ['255,240,200', '230,190,100', 'rgb(240,210,150)'];
            K.push({ x: sx, y: Math.random() * h * 0.4, vx: sp * dir, vy: sp * 0.15, sz: 1.5 + Math.random(),
                life: 1.2, co, gl, tr, tb: new Float32Array(200), th: 0, tl: 0, _g: null });
        }
        for (let i = K.length - 1; i >= 0; i--) {
            const c = K[i]; c.x += c.vx; c.y += c.vy; c.life -= 0.005;
            if (c.life <= 0) { K.splice(i, 1); continue; }
            c.tb[c.th * 2] = c.x; c.tb[c.th * 2 + 1] = c.y; c.th = (c.th + 1) % 100; if (c.tl < 100) c.tl++;
            if (c.tl > 2) {
                const ni = (((c.th - 1) % 100) + 100) % 100, oi = (((c.th - c.tl) % 100) + 100) % 100;
                const dx = c.tb[ni * 2] - c.tb[oi * 2], dy = c.tb[ni * 2 + 1] - c.tb[oi * 2 + 1];
                if (dx * dx + dy * dy > 28900) c.tl--;
            }
            const op = Math.min(1, c.life) * m;
            if (!c._g) {
                const r = c.sz * 4, g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
                g.addColorStop(0, `rgba(${c.co},1)`); g.addColorStop(0.4, `rgba(${c.gl},0.4)`); g.addColorStop(1, `rgba(${c.gl},0)`);
                c._g = g;
            }
            ctx.globalAlpha = op; ctx.save(); ctx.translate(c.x, c.y); ctx.fillStyle = c._g;
            ctx.beginPath(); ctx.arc(0, 0, c.sz * 4, 0, 6.2832); ctx.fill(); ctx.restore();
            ctx.lineCap = 'butt'; ctx.strokeStyle = c.tr; const segs = c.tl - 1;
            for (let b = 0; b < 8; b++) {
                const j0 = (b * segs / 8) | 0, j1 = ((b + 1) * segs / 8) | 0;
                if (j0 >= j1) continue; const mp = (j0 + j1) * 0.5 / c.tl;
                ctx.lineWidth = c.sz * (1 - mp * 0.8); ctx.globalAlpha = op * (1 - mp) * 0.6; ctx.beginPath();
                for (let j = j0; j <= j1; j++) {
                    const idx = (((c.th - 1 - j) % 100) + 100) % 100;
                    j === j0 ? ctx.moveTo(c.tb[idx * 2], c.tb[idx * 2 + 1]) : ctx.lineTo(c.tb[idx * 2], c.tb[idx * 2 + 1]);
                }
                ctx.stroke();
            }
        }
        ctx.globalAlpha = 1;
    }
    _glslVert() {
        return `#version 300 es
precision mediump float;
in vec2 a_pos;
out vec2 v_uv;
void main() {
    v_uv = a_pos * 0.5 + 0.5;
    gl_Position = vec4(a_pos, 0.0, 1.0);
}`;
    }
    _glslClouds() {
        return `
float awc_hash(vec2 p){
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}
float awc_noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(awc_hash(i), awc_hash(i+vec2(1.0,0.0)), u.x),
               mix(awc_hash(i+vec2(0.0,1.0)), awc_hash(i+vec2(1.0,1.0)), u.x), u.y);
}
const mat2 AWC_ROT = mat2(0.80, 0.60, -0.60, 0.80);
float awc_fbm(vec2 p){
    float v = 0.0, a = 0.5, tot = 0.0;
    for (int i = 0; i < 3; i++){ v += a * awc_noise(p); tot += a; p = AWC_ROT * p * 2.0; a *= 0.5; }
    return v / tot;
}`;
    }
    _glslFrag(variant = 'sky') {
        const snow = variant === 'snow';
        const snowUniforms = snow ? 'uniform float u_density;\nuniform float u_hail;\nuniform float u_grain;\n' : '';
        const overlay = snow ? `
float awcIce(vec2 FC, float time) {
    vec2 r = u_resolution.xy;
    float fall = mix(1.0, 7.0, u_hail);
    float wob  = mix(1.0, 0.0, u_hail);
    float tilt = mix(0.0, 0.5, u_hail);
    float t = time * fall;
    float acc = 0.0;
    for (float i = 1.0; i < 14.0; i += 1.5) {
        float s = -0.4 + i;
        float v = (2.0 + sin(i)) * s / i;
        vec2 p = (FC / r.x) * s + vec2(sin(t + i) * wob + t * v * tilt, t * v);
        float h = fract(sin(dot(floor(p), floor(p) + i)) * 4e3);
        float rad = 0.024 * (1.0 + 1.6 / i) * u_grain * mix(1.0, 0.7, u_hail);
        acc += smoothstep(rad, -0.5 * rad, length(fract(p) - 0.5 + (h - 0.5) * 0.7));
    }
    return acc;
}
// Snow flakes over the cloud field, with a faint day-only contact rim.
vec3 awcOverlay(vec3 col, vec2 fc, float T){
    float sn = clamp(awcIce(fc, T * 0.5), 0.0, 1.0) * u_density;
    float rim = sn * (1.0 - sn) * 4.0;
    col = mix(col, col * 0.84, rim * (1.0 - u_dark) * 0.5);
    vec3 flake = mix(vec3(1.0), vec3(0.96, 0.98, 1.0), u_dark);
    flake = mix(flake, flake * vec3(0.95, 0.98, 1.0), u_hail);
    col = mix(col, flake, sn * mix(0.90, 1.0, u_dark));
    return col;
}` : `
vec3 awcOverlay(vec3 col, vec2 fc, float T){ return col; }`;
        return `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform float u_time;
uniform vec2  u_resolution;
uniform float u_dark;
uniform float u_wind;
uniform float u_cloud_density;
uniform float u_cloud_shade;
uniform float u_cloud_base;
uniform float u_cloud_size;
uniform float u_cloud_gap;
uniform float u_fx_speed;
uniform vec3 u_sky_top;
uniform vec3 u_sky_mid;
uniform vec3 u_sky_low;
uniform vec3 u_sky_base;
uniform sampler2D u_noise;
${snowUniforms}vec4 vnoise4(vec2 p) {
    vec2 i = floor(p);
    vec2 f = p - i;
    f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    return texture(u_noise, (i + f + 0.5) / 256.0);
}
// 2-octave multichannel value-fbm; the four channels drive the sky-gradient warp.
vec4 fbm4(vec2 p) {
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    vec4 value = vec4(0.0);
    float amp = 0.5, norm = 0.0;
    for (int i = 0; i < 2; i++) {
        value += amp * vnoise4(p);
        norm += amp;
        p = rot * p * 2.02 + vec2(float(i) * 1.7, float(i) * 3.1);
        amp *= 0.5;
    }
    return value / norm;
}

const float AWC_CLOUD_FREQ = 3.0;

float vnoiseS(vec2 p){
    vec2 i = floor(p);
    vec2 f = p - i;
    f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    return textureLod(u_noise, (i + f + 0.5) / 256.0, 0.0).r;
}

float cFbmT(vec2 d, float freq, float gain, int oct, float ev){
    vec2 p = d * freq;
    float v = 0.0, a = 1.0, tot = 0.0;
    for (int i = 0; i < 6; i++){
        if (i >= oct) break;
        vec2 dir = vec2(cos(float(i) * 2.4), sin(float(i) * 2.4));
        v   += a * vnoiseS(p + dir * (ev * (0.3 + float(i) * 0.25)));
        tot += a;
        p    = p * 2.5 + vec2(float(i) * 1.7, float(i) * 2.3);
        a   *= gain;
    }
    return v / tot;
}


float cloudTexture(vec2 dm, float gain, float ev){
    float macroFreq = AWC_CLOUD_FREQ / u_cloud_size;
    float macro  = cFbmT(dm, macroFreq, gain, 4, ev);
    float detail = cFbmT(dm, 9.0, 0.5, 3, ev * 1.3);
    return macro + (detail - 0.5) * 0.26;
}

float coverageMask(vec2 dm, float ev){
    return cFbmT(dm, (AWC_CLOUD_FREQ / u_cloud_size) * 0.34, 0.55, 2, ev * 0.7);
}

vec2 awcFlow(vec2 d, float ev){
    float n1 = vnoiseS(d * 0.4 + vec2(ev * 0.11, -ev * 0.0880));
    float n2 = vnoiseS(d * 0.4 + vec2(5.2 - ev * 0.0990, 1.7 + ev * 0.11));
    vec2 flow = (vec2(n1, n2) - 0.5);
    float ang = (n1 - 0.5) * 6.2831853 + ev * 0.35;
    vec2 swirl = vec2(cos(ang), sin(ang)) * (n2 - 0.5);
    return (flow * 0.14 + swirl * 0.10);
}
vec3 cloudField(vec2 d, float t, float ev, float gain, float thr, float maskAmt){
    vec2 q  = d - vec2(t * 0.07, t * 0.028);
    q += awcFlow(q, ev);
    float tex  = cloudTexture(q, gain, ev);
    float mask = coverageMask(q, ev);
    float localThr = thr - (mask - 0.5) * maskAmt;
    float texUp = cloudTexture(q + vec2(0.0, 0.0800), gain, ev);
    float occ = texUp - localThr;
    return vec3(tex, localThr, occ);
}

vec4 awcClouds(vec2 p){
    float gain  = mix(0.5, 0.56, smoothstep(0.8, 1.3, u_fx_speed));
    float speed = max(u_fx_speed, 0.15);
    float t     = u_time * speed;
    float wind  = u_time * u_wind * 0.05;
    float ev = u_time * (0.065 + u_fx_speed * 0.16);

    vec3 skyAvg = (u_sky_top + u_sky_mid + u_sky_low + u_sky_base) * 0.25;

    vec3 litDay     = mix(vec3(0.99, 0.99, 0.96), u_sky_top, 0.18);
    vec3 litNight   = vec3(0.55, 0.62, 0.79);
    vec3 lit        = mix(litDay, litNight, u_dark);
    vec3 shadeDay   = mix(vec3(0.86, 0.88, 0.92), mix(u_sky_mid, u_sky_low, 0.5), mix(0.45, 0.85, u_cloud_shade));
    vec3 shadeNight = mix(u_sky_mid, vec3(0.10, 0.15, 0.32), 0.62);
    vec3 shade      = mix(shadeDay, shadeNight, u_dark);

    float thr0    = mix(0.56, 0.32, u_cloud_density) - u_cloud_base * 0.06;
    float maskAmt = mix(0.3, 0.42, u_cloud_density);

    vec3 front = cloudField((p - vec2(wind, 0.0)) * 1.30, t, ev, gain, thr0, maskAmt);

    float fd = front.x - front.y;
    float occ = front.z;
    float arv = u_resolution.x / u_resolution.y;
    vec2 seedOff = textureLod(u_noise, vec2(0.137, 0.519), 0.0).rg - 0.5;
    vec2 vigCen = vec2(arv * 0.5, 0.5) + seedOff * vec2(arv * 0.3, 0.26) + vec2(sin(u_time * 0.011) * arv * 0.1, cos(u_time * 0.013) * 0.09);
    vec2 vrel = (p - vigCen) / vec2(arv * 0.6, 0.6);
    fd -= max(0.0, 0.55 - dot(vrel, vrel)) * u_cloud_gap;

    vec3 hilite   = lit + vec3(0.05, 0.05, 0.03) * (1.0 - u_dark) + vec3(0.03, 0.05, 0.1) * u_dark;
    float fCov    = smoothstep(0.0, 0.03, fd);
    float fSoft   = smoothstep(mix(-0.09, -0.045, u_dark), 0.04, fd);
    float form    = smoothstep(-0.04, mix(0.34, 0.46, u_dark), fd);
    float core    = smoothstep(0.2, 0.44, fd);
    vec3 frontCol = mix(shade, lit, form);
    frontCol      = mix(frontCol, hilite, core * mix(0.5, 0.18, u_dark));
    float shadow  = smoothstep(0.0, 0.33, occ) * (1.0 - core * 0.5);
    vec3 shadowCol = mix(frontCol * vec3(0.9, 0.91, 0.93), mix(frontCol, vec3(0.10, 0.14, 0.30), 0.6), u_dark);
    frontCol      = mix(frontCol, shadowCol, shadow);
    float thinness = 1.0 - smoothstep(-0.02, 0.08, fd);
    vec3 thinTarget = mix(skyAvg, mix(skyAvg, litNight, 0.5), u_dark);
    frontCol       = mix(frontCol, thinTarget, thinness * mix(0.22, 0.17, u_dark));
    float rimBand  = smoothstep(0.0, 0.04, fd) * (1.0 - smoothstep(0.04, 0.11, fd));
    vec3 rimDark   = mix(skyAvg, vec3(0.05, 0.06, 0.11), 0.45);
    frontCol       = mix(frontCol, rimDark, rimBand * u_dark * 0.18);
    frontCol       = mix(frontCol, frontCol * 0.82, rimBand * (1.0 - u_dark) * 0.35);
    float frontA   = max(fCov, fSoft * 0.78);

    vec3 col = mix(skyAvg, frontCol, frontA);
    float alpha = frontA;
    float dh = fract(sin(dot(p * 511.0 + u_time, vec2(12.9898, 78.233))) * 43758.5453);
    col += (dh - 0.5) * (1.5 / 255.0);
    return vec4(col, min(alpha, 1.0));
}
${overlay}
void main() {
    vec2 uv = v_uv;
    float ar = u_resolution.x / u_resolution.y;
    vec2 p = vec2(uv.x * ar, uv.y);
    float skyClock = u_time * 0.44 * 0.27;
    float warpClock = u_time * 0.576 * 0.27;
    vec2 warpSeed = vec2(warpClock * 0.34, -warpClock * 0.26);
    vec4 warpA = fbm4(uv * 1.3 + warpSeed);
    vec4 warpB = fbm4(uv * 0.9 - warpSeed * 1.4 + warpA.rg * 1.7);
    vec2 skyWarp = (warpB.rg - 0.5) * 1.7 + (warpA.ba - 0.5) * 0.7;

    vec2 lightCenter = vec2(
        0.18 + sin(skyClock * 0.6) * 0.28 + cos(skyClock * 0.21) * 0.15,
        0.82 + cos(skyClock * 0.45) * 0.22 + sin(skyClock * 0.17) * 0.12
    );
    vec2 warpedUV = uv + skyWarp;
    float radialDist = length(warpedUV - lightCenter);
    float skyGrad = clamp(radialDist * 0.62, 0.0, 1.0);

    float split1 = 0.33 + sin(skyClock * 0.8) * 0.14 + warpA.r * 0.08;
    float split2 = 0.66 + cos(skyClock * 0.65 + 1.7) * 0.14 + warpB.g * 0.08;
    split1 = clamp(split1, 0.08, split2 - 0.08);
    split2 = clamp(split2, split1 + 0.08, 0.92);

    vec3 sky = u_sky_top;
    sky = mix(sky, u_sky_mid, smoothstep(0.0, split2, skyGrad));
    sky = mix(sky, u_sky_low, smoothstep(split1, 1.0, skyGrad));
    sky = mix(sky, u_sky_base, smoothstep(split2, 1.0, skyGrad));

    float breathe = sin(skyClock * 1.1 + warpB.b * 3.0) * 0.5 + 0.5;
    vec3 breatheTint = mix(vec3(-0.030, -0.010, 0.030), vec3(0.030, 0.012, -0.025), breathe);
    sky += breatheTint * (1.0 - u_dark * 0.6);
    sky *= (1.0 - u_cloud_shade * 0.12);
    vec4 clouds = awcClouds(p);
    vec3 final = mix(sky, clouds.rgb, clouds.a);
    final = awcOverlay(final, gl_FragCoord.xy, u_time);
    fragColor = vec4(final, 1.0);
}`;
    }
    // Header, uniforms and helpers for the water (rain-on-glass) shader.
    _glslGlassPreamble(extraUniforms) {
        return `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform float u_time, u_dark;
uniform vec2 u_resolution;
uniform vec3 u_sky_top, u_sky_mid, u_sky_low, u_sky_base;
uniform float u_ref_height;
${extraUniforms}
${this._glslClouds()}
#define S(a,b,t) smoothstep(a,b,t)
${this._glslSkyRefract()}`;
    }
    _glslSkyRefract() {
        return `
vec3 skyRefract(vec2 rUV, float T) {
    float td = T * 0.4;
    vec2 lc = vec2(0.2 + sin(td * 0.7) * 0.35, 0.5 + cos(td * 0.5) * 0.35);
    float breath = 0.40 + sin(T * 0.5) * 0.15 + sin(T * 0.31) * 0.10;
    float nz = awc_fbm(rUV * 3.0 + T * 0.12);
    float rd = length(rUV - lc) + (nz - 0.5) * 0.50;
    float g = clamp(rd * breath + (nz - 0.5) * 0.25, 0.0, 1.0);
    float gSplit1 = clamp(0.33 + sin(T * 0.35) * 0.14 + (nz - 0.5) * 0.16, 0.08, 0.84);
    float gSplit2 = clamp(0.66 + cos(T * 0.28 + 1.7) * 0.14 + (nz - 0.5) * 0.14, gSplit1 + 0.08, 0.92);
    vec3 sky = u_sky_top;
    sky = mix(sky, u_sky_mid, smoothstep(0.0, gSplit2, g));
    sky = mix(sky, u_sky_low, smoothstep(gSplit1, 1.0, g));
    sky = mix(sky, u_sky_base, smoothstep(gSplit2, 1.0, g));
    return sky;
}`;
    }
    // Rain-on-glass remixed from "Heartfelt" https://www.shadertoy.com/view/ltffzl — CC BY-NC-SA 3.0.
    _glslFragWater() {
        return `${this._glslGlassPreamble('uniform float u_fx_speed, u_rain_intensity, u_lightning;')}
vec3 N13(float p){
    vec3 p3=fract(vec3(p)*vec3(.1031,.11369,.13787));
    p3+=dot(p3,p3.yzx+19.19);
    return fract(vec3((p3.x+p3.y)*p3.z,(p3.x+p3.z)*p3.y,(p3.y+p3.z)*p3.x));
}
float N(float t){return fract(sin(t*12345.564)*7658.76);}
float Saw(float b,float t){return S(0.,b,t)*S(1.,b,t);}
vec2 DropLayer2(vec2 uv,float t){
    vec2 UV=uv;
    uv.y+=t*0.75;
    float gridScale = mix(0.95, 0.78, u_rain_intensity);
    vec2 a=vec2(6.,1.) * gridScale;
    vec2 grid=a*2.;
    vec2 id=floor(uv*grid);
    float colShift=N(id.x);
    uv.y+=colShift;
    id=floor(uv*grid);
    vec3 n=N13(id.x*35.2+id.y*2376.1);
    vec2 st=fract(uv*grid)-vec2(.5,0.);
    float x=n.x-.5;
    float y=UV.y*20.;
    float wiggle=sin(y+sin(y));
    x+=wiggle*(.5-abs(x))*(n.z-.5);
    x*=.7;
    float ti=fract(t+n.z);
    y=(Saw(.85,ti)-.5)*.76+.5;
    vec2 p=vec2(x,y);
    float dropRadius = mix(0.44, 0.58, u_rain_intensity);
    float d=length((st-p)*a.yx);
    float mainDrop=S(dropRadius,.0,d);
    float r=sqrt(S(1.,y,st.y));
    float cd=abs(st.x-x);
    float trail=S(.23*r,.15*r*r,cd);
    float trailFront=S(-.02,.02,st.y-y);
    trail*=trailFront*r*r;
    y=UV.y;
    float trail2=S(.2*r,.0,cd);
    float droplets=max(0.,(sin(y*(1.-y)*120.)-st.y))*trail2*trailFront*n.z;
    y=fract(y*10.)+(st.y-.5);
    float dd=length(st-vec2(x,y));
    droplets=S(.3,0.,dd);
    float m=mainDrop+droplets*r*trailFront;
    return vec2(m,trail);
}
float StaticDrops(vec2 uv,float t){
    uv*=40.;
    vec2 id=floor(uv);
    uv=fract(uv)-.5;
    vec3 n=N13(id.x*107.45+id.y*3543.654);
    vec2 p=(n.xy-.5)*.7;
    float d=length(uv-p);
    float fade=Saw(.025,fract(t+n.z));
    float c=S(.3,0.,d)*fract(n.z*10.)*fade;
    return c;
}
vec2 Drops(vec2 uv,float t,float l0,float l1,float l2){
    float s=StaticDrops(uv,t)*l0;
    vec2 m1=DropLayer2(uv,t)*l1;
    vec2 m2 = vec2(0.0);
    if (l2 > 0.001) m2 = DropLayer2(uv*1.85,t)*l2;
    float c=s+m1.x+m2.x;
    c=S(.3,1.,c);
    return vec2(c,max(m1.y*l0,m2.y*l1));
}
void main(){
    vec2 UV = v_uv;
    float T = u_time;
    vec2 uv = (gl_FragCoord.xy - 0.5*u_resolution) / max(u_resolution.y, u_ref_height);
    float t = T * 0.2 * u_fx_speed;

    float sd = S(-.5,1.,u_rain_intensity)*2., l1 = S(.1,.75,u_rain_intensity), l2 = S(.2,.85,u_rain_intensity);
    vec2 c = Drops(uv, t, sd, l1, l2);
    vec2 e = vec2(.001, 0.);
    vec2 n = vec2(Drops(uv+e,t,sd,l1,l2).x - c.x, Drops(uv+e.yx,t,sd,l1,l2).x - c.x);
    vec2 rUV = UV + n * mix(6.0, 28.0, u_dark);
    vec3 col = skyRefract(rUV, T);
    if (u_lightning > 0.0) {
        float s = sin(T * 0.79) + sin(T * 1.49) + sin(T * 0.52);  // quasi-periodic -> irregular timing
        float strike = smoothstep(1.45, 2.35, s); strike *= strike; // sharp onset, fires more often
        strike *= 0.7 + 0.3 * sin(T * 33.0 + s * 5.0);            // gentle flicker while lit
        vec2 cellPos = vec2(0.50 + 0.34 * sin(T * 0.17 + 1.3), 0.70 + 0.12 * sin(T * 0.11 + 0.5));
        float rad    = 0.52 + 0.16 * sin(T * 0.13 + 2.1);        // breathing size
        float aspY   = 1.5 + 0.40 * sin(T * 0.09);
        float blob = smoothstep(rad, 0.0, length((rUV - cellPos) * vec2(1.1, aspY)));
        blob *= 0.55 + 0.45 * awc_fbm(rUV * 1.8 + T * 0.012);     // soft cloud shape
        vec3 cellCol = mix(vec3(0.60, 0.72, 1.0), vec3(0.78, 0.85, 1.0), u_dark);
        col += cellCol * u_lightning * strike * blob * 0.7;
    }
    col += min(c.y, 1.0) * mix(0.033, 0.055, u_dark);
    fragColor = vec4(col, 1.0);
}`;
    }
    _destroyGL() {
        const gl = this._gl;
        if (gl && !gl.isContextLost()) {
            if (this._glBuf) gl.deleteBuffer(this._glBuf);
            if (this._glNoiseTex) gl.deleteTexture(this._glNoiseTex);
            if (this._shaderBank) {
                for (const b of Object.values(this._shaderBank)) {
                    if (b.prog) gl.deleteProgram(b.prog);
                }
            }
        }
        this._gl = null; this._glProg = null; this._glUniforms = null;
        this._glBuf = null; this._shaderBank = null; this._glNoiseTex = null;
        this._activeShaderKey = null; this._prevShaderParams = null;
        this._prevFxSpeed = null;
    }
    _initWebGL() {
        const canvas = this._elements.glCanvas;
        if (!canvas) return;
        const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false });
        if (!gl || gl.isContextLost()) { console.warn('AWC: WebGL2 not available'); this._applyShaderDisabledState(true); return; }
        this._gl = gl;
        this._prevShaderParams = null; this._prevFxSpeed = null;
        this._activeShaderKey = null;
        const vertSrc = this._glslVert();
        const needed = this._shaderParams ? (this._shaderParams.shader || 'sky') : 'sky';
        const shaders = [{ key: 'sky', frag: this._glslFrag() }];
        if (needed !== 'sky') shaders.push({ key: needed, frag: this._glslFragFor(needed) });
        this._vertSrc = vertSrc;
        const compiled = shaders.map(s => {
            const vs = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vs, vertSrc); gl.compileShader(vs);
            const fs = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fs, s.frag); gl.compileShader(fs);
            return { key: s.key, vs, fs };
        });
        const ext = gl.getExtension('KHR_parallel_shader_compile');
        if (ext) {
            this._pollShaderCompile(gl, compiled, ext);
        } else {
            this._finalizeShaders(gl, compiled);
        }
    }
    _pollShaderCompile(gl, compiled, ext) {
        const COMPLETION = 0x91B1;
        const poll = () => {
            if (!this.isConnected) return;
            const allDone = compiled.every(c =>
                gl.getShaderParameter(c.vs, COMPLETION) && gl.getShaderParameter(c.fs, COMPLETION)
            );
            if (allDone) {
                this._finalizeShaders(gl, compiled);
            } else {
                requestAnimationFrame(poll);
            }
        };
        requestAnimationFrame(poll);
    }
    _glslFragFor(key) {
        if (key === 'water') return this._glslFragWater();
        if (key === 'snow') return this._glslFrag('snow');
        return this._glslFrag();
    }
    _uniformNamesFor(key) {
        const sky = ['u_time','u_resolution','u_dark','u_wind','u_cloud_density','u_cloud_shade','u_cloud_base','u_cloud_size','u_cloud_gap','u_fx_speed','u_sky_top','u_sky_mid','u_sky_low','u_sky_base','u_noise'];
        if (key === 'sky') return sky;
        if (key === 'snow') return [...sky, 'u_density','u_hail','u_grain'];
        const base = ['u_time','u_resolution','u_dark','u_fx_speed','u_sky_top','u_sky_mid','u_sky_low','u_sky_base','u_ref_height'];
        if (key === 'water') return [...base, 'u_rain_intensity', 'u_lightning'];
        return base;
    }
    _buildProgram(gl, key, vs, fs) {
        if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) { console.error(`AWC ${key} vertex:`, gl.getShaderInfoLog(vs)); gl.deleteShader(vs); gl.deleteShader(fs); return null; }
        if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) { console.error(`AWC ${key} fragment:`, gl.getShaderInfoLog(fs)); gl.deleteShader(vs); gl.deleteShader(fs); return null; }
        const prog = gl.createProgram();
        gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
        gl.deleteShader(vs); gl.deleteShader(fs);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.error(`AWC ${key} link:`, gl.getProgramInfoLog(prog)); gl.deleteProgram(prog); return null; }
        const uniformNames = this._uniformNamesFor(key);
        const uniforms = {};
        for (const n of uniformNames) uniforms[n] = gl.getUniformLocation(prog, n);
        return { prog, uniforms };
    }
    _finalizeShaders(gl, compiled) {
        if (!this._shaderBank) this._shaderBank = {};
        for (const c of compiled) {
            const built = this._buildProgram(gl, c.key, c.vs, c.fs);
            if (built) this._shaderBank[c.key] = built;
        }
        if (!this._shaderBank.sky) return;

        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
        this._glBuf = buf;
        const skyBank = this._shaderBank.sky;
        this._glProg = skyBank.prog;
        this._glUniforms = skyBank.uniforms;
        gl.useProgram(skyBank.prog);
        const loc = gl.getAttribLocation(skyBank.prog, 'a_pos');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        this._activeShaderKey = 'sky';
        if (!this._glNoiseTex) {
            const NOISE_SIZE = 256;
            const noiseData = new Uint8Array(NOISE_SIZE * NOISE_SIZE * 4);
            const seed = this._glSeed || 0;
            for (let iy = 0; iy < NOISE_SIZE; iy++) {
                for (let ix = 0; ix < NOISE_SIZE; ix++) {
                    const idx = (iy * NOISE_SIZE + ix) * 4;
                    for (let ch = 0; ch < 4; ch++) {
                        const sx = ix + seed * 0.7127 + ch * 53.1;
                        const sy = iy + seed * 1.3517 + ch * 97.3;
                        let v = Math.sin(sx * 127.1 + sy * 311.7) * 43758.5453;
                        v = v - Math.floor(v);
                        noiseData[idx + ch] = v * 255.0;
                    }
                }
            }
            const noiseTex = gl.createTexture();
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, noiseTex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, NOISE_SIZE, NOISE_SIZE, 0, gl.RGBA, gl.UNSIGNED_BYTE, noiseData);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.generateMipmap(gl.TEXTURE_2D);
            this._glNoiseTex = noiseTex;
        }
        if (this._glNoiseTex && this._glUniforms && this._glUniforms.u_noise != null) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this._glNoiseTex);
            gl.uniform1i(this._glUniforms.u_noise, 0);
        }
        this._startAnimation();
    }
    _weatherToUniforms() {
        const key = WEATHER_VISUALS[this._weatherState] ? this._weatherState : 'default';
        const vis = { ...VISUAL_DEFAULTS, ...WEATHER_VISUALS[key] };
        const colors = SKY_COLORS[key] || SKY_COLORS['default'];
        const isDark = this._isThemeDark ? 1.0 : 0.0;
        const skyColors = isDark ? colors.skyNight : colors.skyDay;
        const WIND_FULL_KMH = 80;
        const wind = Math.min(1.0, (this._windKmh || 0) / WIND_FULL_KMH);
        const fxSpeed = vis.engine === 'water' ? (0.4 + vis.rain * 0.9) : vis.cloudSpeed;
        const program = vis.engine === 'water' ? 'water' : (vis.snowfall > 0 ? 'snow' : 'sky');
        const p = this._shaderParams;
        if (p && p.shader === program && p.dark === isDark && p.wind === wind
            && p.fxSpeed === fxSpeed
            && p.cloudDensity === vis.cloudCover && p.cloudShade === vis.cloudShadow && p.cloudBase === vis.cloudThickness && p.cloudSize === vis.cloudScale && p.cloudGap === vis.clearing
            && p.rainIntensity === vis.rain && p.density === vis.snowfall && p.grain === vis.flakeSize && p.hail === vis.hail
            && p.lightning === vis.lightning
            && p.skyColors === skyColors) return p;
        return {
            shader: program, dark: isDark, wind,
            fxSpeed,
            cloudDensity: vis.cloudCover, cloudShade: vis.cloudShadow, cloudBase: vis.cloudThickness, cloudSize: vis.cloudScale, cloudGap: vis.clearing,
            rainIntensity: vis.rain,
            lightning: vis.lightning,
            density: vis.snowfall,
            grain: vis.flakeSize,
            hail: vis.hail,
            skyColors,
        };
    }
    _renderShader(timestamp) {
        const gl = this._gl;
        if (!gl || !this._glProg) return;
        if (gl.isContextLost()) return;
        const canvas = this._elements.glCanvas;
        if (!canvas || canvas.width === 0 || canvas.height === 0) return;
        const s = this._shaderParams;
        if (!s) return;

        const targetKey = s.shader || 'sky';
        if (targetKey !== this._activeShaderKey && this._shaderBank) {
            if (!this._shaderBank[targetKey] && this._gl && this._vertSrc && targetKey !== 'sky') {
                const vs = gl.createShader(gl.VERTEX_SHADER);
                gl.shaderSource(vs, this._vertSrc); gl.compileShader(vs);
                const fs = gl.createShader(gl.FRAGMENT_SHADER);
                gl.shaderSource(fs, this._glslFragFor(targetKey)); gl.compileShader(fs);
                const built = this._buildProgram(gl, targetKey, vs, fs);
                if (built) this._shaderBank[targetKey] = built;
            }
            const bank = this._shaderBank[targetKey] || this._shaderBank.sky;
            if (bank && bank.prog !== this._glProg) {
                gl.useProgram(bank.prog);
                gl.bindBuffer(gl.ARRAY_BUFFER, this._glBuf);
                const loc = gl.getAttribLocation(bank.prog, 'a_pos');
                gl.enableVertexAttribArray(loc);
                gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
                this._glProg = bank.prog;
                this._glUniforms = bank.uniforms;
                this._activeShaderKey = targetKey;
                this._prevShaderParams = null;
                this._prevFxSpeed = null;
                        if (this._glNoiseTex && bank.uniforms.u_noise != null) {
                    gl.activeTexture(gl.TEXTURE0);
                    gl.bindTexture(gl.TEXTURE_2D, this._glNoiseTex);
                    gl.uniform1i(bank.uniforms.u_noise, 0);
                }
            }
        }

        gl.viewport(0, 0, canvas.width, canvas.height);
        const u = this._glUniforms;
        const cfg = this._config || {};
        const fxSpeed = s.fxSpeed;
        gl.uniform1f(u.u_time, timestamp * 0.001);
        gl.uniform2f(u.u_resolution, canvas.width, canvas.height);
        if (u.u_ref_height != null) gl.uniform1f(u.u_ref_height, 300.0 * (this._cachedDimensions.dpr || 1));
        if (s !== this._prevShaderParams) {
            gl.uniform1f(u.u_dark, s.dark);
            if (u.u_wind != null) gl.uniform1f(u.u_wind, s.wind);
            if (u.u_cloud_density != null) gl.uniform1f(u.u_cloud_density, s.cloudDensity);
            if (u.u_cloud_shade != null) gl.uniform1f(u.u_cloud_shade, s.cloudShade);
            if (u.u_cloud_base != null) gl.uniform1f(u.u_cloud_base, s.cloudBase);
            if (u.u_cloud_size != null) gl.uniform1f(u.u_cloud_size, s.cloudSize);
            if (u.u_cloud_gap != null) gl.uniform1f(u.u_cloud_gap, s.cloudGap);
            if (u.u_rain_intensity != null) gl.uniform1f(u.u_rain_intensity, s.rainIntensity);
            if (u.u_lightning != null) gl.uniform1f(u.u_lightning, s.lightning);
            if (u.u_density != null) gl.uniform1f(u.u_density, s.density);
            if (u.u_grain != null) gl.uniform1f(u.u_grain, s.grain);
            if (u.u_hail != null) gl.uniform1f(u.u_hail, s.hail);
            if (s.skyColors) {
                const sc = s.skyColors;
                gl.uniform3f(u.u_sky_top, sc[0][0], sc[0][1], sc[0][2]);
                gl.uniform3f(u.u_sky_mid, sc[1][0], sc[1][1], sc[1][2]);
                gl.uniform3f(u.u_sky_low, sc[2][0], sc[2][1], sc[2][2]);
                gl.uniform3f(u.u_sky_base, sc[3][0], sc[3][1], sc[3][2]);
            }
            this._prevShaderParams = s;
        }
        if (fxSpeed !== this._prevFxSpeed) { if (u.u_fx_speed != null) gl.uniform1f(u.u_fx_speed, fxSpeed); this._prevFxSpeed = fxSpeed; }
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    _animate(now) {
        if (!this.isConnected || this._animId === null || !this._isVisible) { this._stopAnimation(); return; }
        this._animId = requestAnimationFrame(this._boundAnimate);
        if (!this._stateInitialized) return;
        if (now - this._lastFrameTime < this._frameInterval) return;
        this._lastFrameTime = now;
        this._renderStars(now);
        this._renderShader(now);
    }
    _startAnimation() {
        if (this._animId === null && this._isVisible && !this._isEffectivelyDisabled()) {
            this._animId = requestAnimationFrame(this._boundAnimate);
        }
    }
    _stopAnimation() {
        if (this._animId !== null) { cancelAnimationFrame(this._animId); this._animId = null; }
    }
    _isEffectivelyDisabled() {
        const cfg = this._config || {};
        return cfg.disable_background === true;
    }
}
const EDITOR_NAME = 'atmospheric-weather-card-editor';
const CARD_NAME = 'atmospheric-weather-card';
if (!customElements.get(CARD_NAME)) {
    customElements.define(CARD_NAME, AtmosphericWeatherCard); window.customCards = window.customCards || [];
    window.customCards.push({ type: CARD_NAME, name: 'Atmospheric Weather Card', description: 'A detail-oriented Home Assistant Weather Card' });
} else {
    console.info(`%c ${CARD_NAME} already defined`, 'color: orange; font-weight: bold;');
}

})();

/*
 * VISUAL EDITOR — original by shpongledsummer (MIT), recovered from the upstream v5.0 release.
 * Bundled here, together with Lit, so a single HACS file needs no network at runtime.
 * Lit 3.2.1 is BSD-3-Clause, Copyright Google LLC — https://lit.dev
 */
(function() {
"use strict";
/* esm.sh - esbuild bundle(lit@3.2.1) es2022 production */
var O=globalThis,R=O.ShadowRoot&&(O.ShadyCSS===void 0||O.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,I=Symbol(),Q=new WeakMap,C=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==I)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o,e=this.t;if(R&&t===void 0){let s=e!==void 0&&e.length===1;s&&(t=Q.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&Q.set(e,t))}return t}toString(){return this.cssText}},X=r=>new C(typeof r=="string"?r:r+"",void 0,I),ut=(r,...t)=>{let e=r.length===1?r[0]:t.reduce((s,i,o)=>s+(n=>{if(n._$cssResult$===!0)return n.cssText;if(typeof n=="number")return n;throw Error("Value passed to 'css' function must be a 'css' function result: "+n+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+r[o+1],r[0]);return new C(e,r,I)},V=(r,t)=>{if(R)r.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let e of t){let s=document.createElement("style"),i=O.litNonce;i!==void 0&&s.setAttribute("nonce",i),s.textContent=e.cssText,r.appendChild(s)}},N=R?r=>r:r=>r instanceof CSSStyleSheet?(t=>{let e="";for(let s of t.cssRules)e+=s.cssText;return X(e)})(r):r;var{is:$t,defineProperty:_t,getOwnPropertyDescriptor:ft,getOwnPropertyNames:At,getOwnPropertySymbols:mt,getPrototypeOf:gt}=Object,M=globalThis,Y=M.trustedTypes,yt=Y?Y.emptyScript:"",vt=M.reactiveElementPolyfillSupport,w=(r,t)=>r,W={toAttribute(r,t){switch(t){case Boolean:r=r?yt:null;break;case Object:case Array:r=r==null?r:JSON.stringify(r)}return r},fromAttribute(r,t){let e=r;switch(t){case Boolean:e=r!==null;break;case Number:e=r===null?null:Number(r);break;case Object:case Array:try{e=JSON.parse(r)}catch{e=null}}return e}},et=(r,t)=>!$t(r,t),tt={attribute:!0,type:String,converter:W,reflect:!1,hasChanged:et};Symbol.metadata??=Symbol("metadata"),M.litPropertyMetadata??=new WeakMap;var $=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=tt){if(e.state&&(e.attribute=!1),this._$Ei(),this.elementProperties.set(t,e),!e.noAccessor){let s=Symbol(),i=this.getPropertyDescriptor(t,s,e);i!==void 0&&_t(this.prototype,t,i)}}static getPropertyDescriptor(t,e,s){let{get:i,set:o}=ft(this.prototype,t)??{get(){return this[e]},set(n){this[e]=n}};return{get(){return i?.call(this)},set(n){let p=i?.call(this);o.call(this,n),this.requestUpdate(t,p,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??tt}static _$Ei(){if(this.hasOwnProperty(w("elementProperties")))return;let t=gt(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(w("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(w("properties"))){let e=this.properties,s=[...At(e),...mt(e)];for(let i of s)this.createProperty(i,e[i])}let t=this[Symbol.metadata];if(t!==null){let e=litPropertyMetadata.get(t);if(e!==void 0)for(let[s,i]of e)this.elementProperties.set(s,i)}this._$Eh=new Map;for(let[e,s]of this.elementProperties){let i=this._$Eu(e,s);i!==void 0&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){let e=[];if(Array.isArray(t)){let s=new Set(t.flat(1/0).reverse());for(let i of s)e.unshift(N(i))}else t!==void 0&&e.push(N(t));return e}static _$Eu(t,e){let s=e.attribute;return s===!1?void 0:typeof s=="string"?s:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){let t=new Map,e=this.constructor.elementProperties;for(let s of e.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){let t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return V(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$EC(t,e){let s=this.constructor.elementProperties.get(t),i=this.constructor._$Eu(t,s);if(i!==void 0&&s.reflect===!0){let o=(s.converter?.toAttribute!==void 0?s.converter:W).toAttribute(e,s.type);this._$Em=t,o==null?this.removeAttribute(i):this.setAttribute(i,o),this._$Em=null}}_$AK(t,e){let s=this.constructor,i=s._$Eh.get(t);if(i!==void 0&&this._$Em!==i){let o=s.getPropertyOptions(i),n=typeof o.converter=="function"?{fromAttribute:o.converter}:o.converter?.fromAttribute!==void 0?o.converter:W;this._$Em=i,this[i]=n.fromAttribute(e,o.type),this._$Em=null}}requestUpdate(t,e,s){if(t!==void 0){if(s??=this.constructor.getPropertyOptions(t),!(s.hasChanged??et)(this[t],e))return;this.P(t,e,s)}this.isUpdatePending===!1&&(this._$ES=this._$ET())}P(t,e,s){this._$AL.has(t)||this._$AL.set(t,e),s.reflect===!0&&this._$Em!==t&&(this._$Ej??=new Set).add(t)}async _$ET(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[i,o]of this._$Ep)this[i]=o;this._$Ep=void 0}let s=this.constructor.elementProperties;if(s.size>0)for(let[i,o]of s)o.wrapped!==!0||this._$AL.has(i)||this[i]===void 0||this.P(i,this[i],o)}let t=!1,e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(s=>s.hostUpdate?.()),this.update(e)):this._$EU()}catch(s){throw t=!1,this._$EU(),s}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EU(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Ej&&=this._$Ej.forEach(e=>this._$EC(e,this[e])),this._$EU()}updated(t){}firstUpdated(t){}};$.elementStyles=[],$.shadowRootOptions={mode:"open"},$[w("elementProperties")]=new Map,$[w("finalized")]=new Map,vt?.({ReactiveElement:$}),(M.reactiveElementVersions??=[]).push("2.0.4");var K=globalThis,L=K.trustedTypes,st=L?L.createPolicy("lit-html",{createHTML:r=>r}):void 0,Z="$lit$",_=`lit$${Math.random().toFixed(9).slice(2)}$`,F="?"+_,St=`<${F}>`,g=document,P=()=>g.createComment(""),U=r=>r===null||typeof r!="object"&&typeof r!="function",J=Array.isArray,at=r=>J(r)||typeof r?.[Symbol.iterator]=="function",q=`[ 	
\f\r]`,x=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,it=/-->/g,rt=/>/g,A=RegExp(`>|${q}(?:([^\\s"'>=/]+)(${q}*=${q}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),ot=/'/g,nt=/"/g,lt=/^(?:script|style|textarea|title)$/i,G=r=>(t,...e)=>({_$litType$:r,strings:t,values:e}),Ut=G(1),Ht=G(2),Tt=G(3),y=Symbol.for("lit-noChange"),c=Symbol.for("lit-nothing"),ht=new WeakMap,m=g.createTreeWalker(g,129);function ct(r,t){if(!J(r)||!r.hasOwnProperty("raw"))throw Error("invalid template strings array");return st!==void 0?st.createHTML(t):t}var dt=(r,t)=>{let e=r.length-1,s=[],i,o=t===2?"<svg>":t===3?"<math>":"",n=x;for(let p=0;p<e;p++){let h=r[p],l,d,a=-1,u=0;for(;u<h.length&&(n.lastIndex=u,d=n.exec(h),d!==null);)u=n.lastIndex,n===x?d[1]==="!--"?n=it:d[1]!==void 0?n=rt:d[2]!==void 0?(lt.test(d[2])&&(i=RegExp("</"+d[2],"g")),n=A):d[3]!==void 0&&(n=A):n===A?d[0]===">"?(n=i??x,a=-1):d[1]===void 0?a=-2:(a=n.lastIndex-d[2].length,l=d[1],n=d[3]===void 0?A:d[3]==='"'?nt:ot):n===nt||n===ot?n=A:n===it||n===rt?n=x:(n=A,i=void 0);let f=n===A&&r[p+1].startsWith("/>")?" ":"";o+=n===x?h+St:a>=0?(s.push(l),h.slice(0,a)+Z+h.slice(a)+_+f):h+_+(a===-2?p:f)}return[ct(r,o+(r[e]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),s]},H=class r{constructor({strings:t,_$litType$:e},s){let i;this.parts=[];let o=0,n=0,p=t.length-1,h=this.parts,[l,d]=dt(t,e);if(this.el=r.createElement(l,s),m.currentNode=this.el.content,e===2||e===3){let a=this.el.content.firstChild;a.replaceWith(...a.childNodes)}for(;(i=m.nextNode())!==null&&h.length<p;){if(i.nodeType===1){if(i.hasAttributes())for(let a of i.getAttributeNames())if(a.endsWith(Z)){let u=d[n++],f=i.getAttribute(a).split(_),T=/([.?@])?(.*)/.exec(u);h.push({type:1,index:o,name:T[2],strings:f,ctor:T[1]==="."?B:T[1]==="?"?D:T[1]==="@"?j:S}),i.removeAttribute(a)}else a.startsWith(_)&&(h.push({type:6,index:o}),i.removeAttribute(a));if(lt.test(i.tagName)){let a=i.textContent.split(_),u=a.length-1;if(u>0){i.textContent=L?L.emptyScript:"";for(let f=0;f<u;f++)i.append(a[f],P()),m.nextNode(),h.push({type:2,index:++o});i.append(a[u],P())}}}else if(i.nodeType===8)if(i.data===F)h.push({type:2,index:o});else{let a=-1;for(;(a=i.data.indexOf(_,a+1))!==-1;)h.push({type:7,index:o}),a+=_.length-1}o++}}static createElement(t,e){let s=g.createElement("template");return s.innerHTML=t,s}};function v(r,t,e=r,s){if(t===y)return t;let i=s!==void 0?e._$Co?.[s]:e._$Cl,o=U(t)?void 0:t._$litDirective$;return i?.constructor!==o&&(i?._$AO?.(!1),o===void 0?i=void 0:(i=new o(r),i._$AT(r,e,s)),s!==void 0?(e._$Co??=[])[s]=i:e._$Cl=i),i!==void 0&&(t=v(r,i._$AS(r,t.values),i,s)),t}var k=class{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){let{el:{content:e},parts:s}=this._$AD,i=(t?.creationScope??g).importNode(e,!0);m.currentNode=i;let o=m.nextNode(),n=0,p=0,h=s[0];for(;h!==void 0;){if(n===h.index){let l;h.type===2?l=new E(o,o.nextSibling,this,t):h.type===1?l=new h.ctor(o,h.name,h.strings,this,t):h.type===6&&(l=new z(o,this,t)),this._$AV.push(l),h=s[++p]}n!==h?.index&&(o=m.nextNode(),n++)}return m.currentNode=g,i}p(t){let e=0;for(let s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}},E=class r{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,s,i){this.type=2,this._$AH=c,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode,e=this._$AM;return e!==void 0&&t?.nodeType===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=v(this,t,e),U(t)?t===c||t==null||t===""?(this._$AH!==c&&this._$AR(),this._$AH=c):t!==this._$AH&&t!==y&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):at(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==c&&U(this._$AH)?this._$AA.nextSibling.data=t:this.T(g.createTextNode(t)),this._$AH=t}$(t){let{values:e,_$litType$:s}=t,i=typeof s=="number"?this._$AC(t):(s.el===void 0&&(s.el=H.createElement(ct(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===i)this._$AH.p(e);else{let o=new k(i,this),n=o.u(this.options);o.p(e),this.T(n),this._$AH=o}}_$AC(t){let e=ht.get(t.strings);return e===void 0&&ht.set(t.strings,e=new H(t)),e}k(t){J(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,s,i=0;for(let o of t)i===e.length?e.push(s=new r(this.O(P()),this.O(P()),this,this.options)):s=e[i],s._$AI(o),i++;i<e.length&&(this._$AR(s&&s._$AB.nextSibling,i),e.length=i)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t&&t!==this._$AB;){let s=t.nextSibling;t.remove(),t=s}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}},S=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,s,i,o){this.type=1,this._$AH=c,this._$AN=void 0,this.element=t,this.name=e,this._$AM=i,this.options=o,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=c}_$AI(t,e=this,s,i){let o=this.strings,n=!1;if(o===void 0)t=v(this,t,e,0),n=!U(t)||t!==this._$AH&&t!==y,n&&(this._$AH=t);else{let p=t,h,l;for(t=o[0],h=0;h<o.length-1;h++)l=v(this,p[s+h],e,h),l===y&&(l=this._$AH[h]),n||=!U(l)||l!==this._$AH[h],l===c?t=c:t!==c&&(t+=(l??"")+o[h+1]),this._$AH[h]=l}n&&!i&&this.j(t)}j(t){t===c?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}},B=class extends S{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===c?void 0:t}},D=class extends S{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==c)}},j=class extends S{constructor(t,e,s,i,o){super(t,e,s,i,o),this.type=5}_$AI(t,e=this){if((t=v(this,t,e,0)??c)===y)return;let s=this._$AH,i=t===c&&s!==c||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,o=t!==c&&(s===c||i);i&&this.element.removeEventListener(this.name,this,s),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}},z=class{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){v(this,t)}},Ot={M:Z,P:_,A:F,C:1,L:dt,R:k,D:at,V:v,I:E,H:S,N:D,U:j,B,F:z},Et=K.litHtmlPolyfillSupport;Et?.(H,E),(K.litHtmlVersions??=[]).push("3.2.1");var pt=(r,t,e)=>{let s=e?.renderBefore??t,i=s._$litPart$;if(i===void 0){let o=e?.renderBefore??null;s._$litPart$=i=new E(t.insertBefore(P(),o),o,void 0,e??{})}return i._$AI(r),i};var b=class extends ${constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){let e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=pt(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return y}};b._$litElement$=!0,b.finalized=!0,globalThis.litElementHydrateSupport?.({LitElement:b});var bt=globalThis.litElementPolyfillSupport;bt?.({LitElement:b});var Lt={_$AK:(r,t,e)=>{r._$AK(t,e)},_$AL:r=>r._$AL};(globalThis.litElementVersions??=[]).push("4.1.1");var jt=!1;var __awcLit = { LitElement: b, html: Ut, css: ut };
const { LitElement, html, css } = __awcLit;
/**
 * ATMOSPHERIC WEATHER CARD — VISUAL EDITOR
 * https://github.com/shpongledsummer/atmospheric-weather-card
 */

const LABELS = Object.freeze({
  weather_entity: "",
  sun_entity: "",
  theme_entity: "",
  _color_mode: "Color Mode",
  card_height: "Card Height",
  _visual_mode: "Weather background",
  card_padding: "Card Padding",
  card_offset: "Card Offset",
  card_tap_action: "Tap Action",
  card_background_style: "Background Style",

  image_day: "Day Image URL",
  image_night: "Night Image URL",
  image_scale: "Image Scale (%)",
  image_alignment: "Image Position",
  image_x: "Horizontal Offset",
  image_y: "Vertical Offset",
  weather_image_path: "Day folder",
  weather_image_path_night: "Night folder",
  status_entity: "Status Entity",
  status_day: "Status Image (Day)",
  status_night: "Status Image (Night)",
  button_area_hide: "Disable Buttons",
  button_area_position: "Position",
  button_text_size: "Value text size",
  button_label_size: "Label text size",
  button_area_layout: "Layout",
  button_style: "Button style",
  button_area_columns: "Columns",
  button_area_scroll_count: "Show at once",
  button_area_align: "Align content",
  button_area_width: "Width",
  button_area_height: "Height",
  button_padding: "Button padding",
  button_area_padding: "Button Area padding",
  button_area_gap: "Gap between Buttons",
  button_gap: "Icon/text gap",
  button_text_gap: "Text gap",
  button_icon_size: "Icon size",
  button_area_background: "Background",
  button_area_grouped: "One shared background",
  button_area_separator: "Divider between buttons",
  button_icon_background: "Icon background",
  button_icon_padding: "Padding around icon",
  button_sub_value_size: "Sub value size",
  button_sub_value_weight: "Sub value weight",
  custom_cards_position: "Cards Position",
  button_area_background_color: "Container Background Color",
  icon_set: "Icon Set",
  icon_path: "Custom SVG Icon Folder",
  bg_brightness: "Background Brightness",
  bg_saturation: "Color Intensity",
  bg_blur: "Background Blur",
});
const HELPERS = Object.freeze({
  weather_entity: "",
  sun_entity: "",
  theme_entity: "",
  card_height: "In pixels, e.g. 220. Use 'auto' for dashboard grid layouts.",
  card_padding: "Inner padding, e.g. 16px or 12px 20px.",
  card_offset: "",
  card_tap_action: "What happens when the card is tapped.",
  image_night: "Shown at night. Falls back to the day image if left empty.",
  weather_image_path: "",
  image_scale: "",
  image_alignment: "",
  image_x: "Fine-tune horizontal position. Pixels or CSS, e.g. -20 or 10%.",
  image_y: "Fine-tune vertical position. Pixels or CSS, e.g. 10 or -5%.",
  status_entity:
    "Shows a different image when this entity is active, open, or home.",
  status_day: "Day image shown while the status entity is active.",
  status_night: "Night image shown while the status entity is active.",
  button_area_columns: "Number of equal-width columns in grid layout.",
  button_area_align: "Horizontal alignment of buttons within the container.",
  card_background_style:
    "Frosted: translucent glass effect. Contrast: solid and readable. Theme: follows your HA theme colours.",
  bg_brightness: "Makes all weather visuals lighter or darker.",
  bg_saturation: "Controls how vivid or muted the colors appear.",
  bg_blur: "Blurs the weather background image.",
  icon_path:
    "e.g. /local/weather-icons/. Replaces built-in icons for all weather buttons.",
});
const BUTTON_LABELS = Object.freeze({
  entity: "",
  attribute: "Attribute",
  name: "Label",
  name_sensor: "Label Entity",
  name_attribute: "Label Attribute",
  name_format: "Custom unit",
  sub_value_entity: "Sub Value Entity",
  sub_value_attribute: "Sub Value Attribute",
  gauge_entity: "Value Entity",
  gauge_attribute: "Value Attribute",
  width: "Width",
  overflow: "Value overflow",
  label_overflow: "Label overflow",
  sub_value_overflow: "Sub value overflow",
  marquee_speed: "Scroll speed",
  marquee_rtl: "Right-to-left",
  icon: "Icon",
  icon_path: "Icon folder",
  tap_action: "Tap Action",
  unit_format: "Custom unit",
  text_size: "Value text size",
  label_size: "Label text size",
  inner_gap: "Icon/text gap",
  text_gap: "Text gap",
  padding: "Button padding",
});
const BUTTON_HELPERS = Object.freeze({
  name_sensor: "Use a sensor value as the label instead.",
  width: "e.g. 200px or 60%. Constrains the button width.",
  icon: "MDI icon, or type 'weather' for a dynamic icon.",
  icon_path: "e.g. /local/weather-icons/",
  forecast_offset: "0 = today/now, 1 = tomorrow/next hour, etc.",
});
const KEY_ORDER = Object.freeze([
  "type",
  "name",
  "entity",
  "weather_entity",
  "sun_entity",
  "color_mode",
  "card_color_mode",
  "theme_entity",
  "card_height",
  "card_padding",
  "disable_background",
  "simple_background",
  "image_day",
  "image_night",
  "image_scale",
  "image_alignment",
  "weather_image_path",
  "weather_image_path_night",
  "status_entity",
  "status_day",
  "status_night",
  "card_background_style",
  "card_tap_action",
  "hold_action",
  "double_tap_action",
  "card_offset",
  "theme_adapt",
  "bottom_fade",
  "icon_set",
  "icon_path",
  "custom_cards_position",
  "night_sky_effects",
  "sun_effects",
  "bg_brightness",
  "bg_saturation",
  "bg_blur",
  "button_areas",
  "custom_cards",
]);
const DISPLAY_DEFAULTS = Object.freeze({
  card_color_mode: "auto",
  image_alignment: "top-right",
  card_background_style: "frosted",
  bg_brightness: 1.0,
  bg_saturation: 1.0,
  bg_blur: 0,
});
const OPT = Object.freeze({
  visual_mode: [
    { value: "visuals", label: "Animated weather visuals" },
    { value: "images", label: "Custom weather images" },
    { value: "simple", label: "Simple weather background" },
    { value: "none", label: "No background" },
  ],
  color_mode: [
    { value: "ha_theme", label: "Follow my Home Assistant theme" },
    { value: "entity", label: "Follow another entity (e.g. the sun)" },
    { value: "force_light", label: "Force light mode" },
    { value: "force_dark", label: "Force dark mode" },
  ],
  button_overflow: [
    { value: "ellipsis", label: "Ellipsis (…)" },
    { value: "marquee", label: "Scrolling text" },
    { value: "clip", label: "Clip" },
    { value: "wrap", label: "Wrap" },
  ],
  button_area_layout: [
    { value: "wrap", label: "Wrap" },
    { value: "grid", label: "Grid" },
    { value: "horizontal-scroll", label: "Scroll X" },
    { value: "vertical-scroll", label: "Scroll Y" },
  ],
  button_area_align: [
    { value: "start", label: "Left" },
    { value: "center", label: "Center" },
    { value: "end", label: "Right" },
    { value: "spread", label: "Spread" },
  ],
});
const FC_ATTRIBUTES = Object.freeze([
  { value: "condition", label: "Condition" },
  { value: "temperature", label: "Temperature (high)" },
  { value: "templow", label: "Temperature (low)" },
  { value: "precipitation_probability", label: "Rain probability" },
  { value: "precipitation", label: "Precipitation" },
  { value: "humidity", label: "Humidity" },
  { value: "wind_speed", label: "Wind speed" },
  { value: "wind_bearing", label: "Wind bearing" },
  { value: "pressure", label: "Pressure" },
  { value: "cloud_coverage", label: "Cloud coverage" },
  { value: "uv_index", label: "UV index" },
]);
const POSITION_GRIDS = Object.freeze({
  image_alignment: {
    cells: [
      ["top-left", "top-center", "top-right"],
      ["left", "center", "right"],
      ["bottom-left", "bottom-center", "bottom-right"],
    ],
    valueMap: { left: "center-left", right: "center-right" },
  },
  custom_cards_position: {
    cells: [
      ["top-left", "top-center", "top-right"],
      ["left", "center", "right"],
      ["bottom-left", "bottom-center", "bottom-right"],
    ],
    valueMap: { left: "center-left", right: "center-right" },
  },
  button_area_position: {
    cells: [
      ["top-left", "top-center", "top-right"],
      ["left", "center", "right"],
      ["bottom-left", "bottom-center", "bottom-right"],
    ],
  },
});
class AtmosphericWeatherCardEditor extends LitElement {
  static get properties() {
    return {
      _config: { type: Object, state: true },
      _colorModeState: { type: String, state: true },
      _expandedCard: { type: Number, state: true },
      _expandedButton: { type: Number, state: true },
      _expandedArea: { type: Number, state: true },
      _openPanel: { type: String, state: true },
    };
  }
  set hass(val) {
    const old = this._hass;
    this._hass = val;
    if (!old && val) {
      this.requestUpdate();
    } else if (old && val) {
      if (!this._hassThrottle) {
        this._hassThrottle = true;
        setTimeout(() => {
          this._hassThrottle = false;
          this.requestUpdate();
        }, 2000);
      }
    }
  }
  get hass() {
    return this._hass;
  }
  static get styles() {
    return css`
      :host {
        --awc-e-s1: 4px;
        --awc-e-s2: 8px;
        --awc-e-s3: 12px;
        --awc-e-s4: 16px;
        --awc-e-r-box: 10px;
        --awc-e-r-ctrl: 8px;
        --awc-e-r-inline: 6px;
        --awc-e-f-meta: 12px;
        --awc-e-f-label: 13px;
        --awc-e-f-body: 14px;
        --awc-e-f-header: 15px;
        --awc-e-t: 150ms ease;
        --mdc-text-field-fill-color: rgba(
          var(--rgb-primary-text-color, 0, 0, 0),
          0.06
        );
        --mdc-select-fill-color: rgba(
          var(--rgb-primary-text-color, 0, 0, 0),
          0.06
        );
        --mdc-typography-subtitle1-font-size: var(--awc-e-f-label);
        --mdc-typography-subtitle1-font-weight: 400;
        --mdc-typography-body2-font-size: var(--awc-e-f-meta);
        display: block;
      }
      /* Spacing */
      ha-form {
        display: block;
      }
      ha-expansion-panel {
        display: block;
        margin-top: var(--awc-e-s3);
        --ha-card-border-radius: var(--awc-e-r-box);
        & ha-form {
          margin-top: var(--awc-e-s2);
        }
      }
      ha-form + ha-form {
        margin-top: var(--awc-e-s1);
      }
      .button-accordion-body > * + *,
      .settings-group > * + *,
      .disclosure-body > * + * {
        margin-top: var(--awc-e-s2);
      }
      .button-accordion-body > :first-child,
      .settings-group > :first-child,
      .disclosure-body > :first-child {
        margin-top: 0;
      }
      .settings-group > .settings-group-label + *,
      .settings-group > .section-title + * {
        margin-top: 0;
      }
      /* Panel headers */
      .panel-header {
        display: flex;
        align-items: center;
        gap: var(--awc-e-s2);
        font-size: var(--awc-e-f-header);
        font-weight: 500;
        color: var(--primary-text-color);
        & ha-icon {
          --mdc-icon-size: 20px;
          color: var(--secondary-text-color);
        }
      }
      /* Shared backgrounds */
      .info,
      .cards-empty,
      .card-row,
      details.disclosure {
        background: var(--secondary-background-color);
        border-radius: var(--awc-e-r-box);
      }
      details.disclosure details.disclosure,
      details.disclosure .card-row {
        background:
          linear-gradient(
            rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.05),
            rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.05)
          ),
          var(--secondary-background-color);
      }
      .composite,
      .grid-picker {
        background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.09);
        border-radius: var(--awc-e-r-box);
      }
      .composite:last-child,
      .grid-picker:last-child,
      .section-box:last-child {
        margin-bottom: 0;
      }
      .disclosure-body > :last-child {
        margin-bottom: 0;
      }
      /* Info blocks */
      .info {
        padding: var(--awc-e-s3) var(--awc-e-s4);
        margin: 0 0 var(--awc-e-s3) 0;
        font-size: var(--awc-e-f-label);
        line-height: 1.5;
        color: var(--secondary-text-color);
        & b {
          color: var(--primary-text-color);
          font-weight: 500;
        }
        & code {
          background: var(--primary-background-color);
          padding: 1px 6px;
          border-radius: 4px;
          font-size: var(--awc-e-f-meta);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        }
        &.inline-action {
          display: flex;
          align-items: center;
          gap: var(--awc-e-s3);
          justify-content: space-between;
          & > span {
            flex: 1;
          }
        }
      }
      .inline-action-btn {
        flex-shrink: 0;
        padding: var(--awc-e-s2) var(--awc-e-s3);
        border: 0;
        background: var(--primary-color);
        color: var(--text-primary-color, white);
        border-radius: var(--awc-e-r-ctrl);
        font-size: var(--awc-e-f-label);
        font-weight: 500;
        cursor: pointer;
        white-space: nowrap;
        transition: opacity var(--awc-e-t);
        &:hover {
          opacity: 0.85;
        }
      }
      /* Labels & helpers */
      .grid-picker-label,
      .composite-label {
        display: block;
        font-size: var(--awc-e-f-label);
        font-weight: 500;
        margin-bottom: var(--awc-e-s2);
        color: var(--primary-text-color);
      }
      .grid-helper,
      .composite-helper {
        margin-top: var(--awc-e-s2);
        font-size: var(--awc-e-f-meta);
        color: var(--secondary-text-color);
        line-height: 1.5;
      }
      .scope-note {
        font-size: var(--awc-e-f-meta);
        color: var(--secondary-text-color);
        display: flex;
        align-items: center;
        gap: var(--awc-e-s1);
        & ha-icon {
          --mdc-icon-size: 14px;
        }
      }
      /* Grid layouts */
      .card-size-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: var(--awc-e-s2);
        & ha-textfield {
          display: block;
          width: 100%;
          min-width: 0;
        }
      }
      .grid-picker {
        margin: var(--awc-e-s3) 0 var(--awc-e-s4) 0;
        padding: var(--awc-e-s3) var(--awc-e-s4);
      }
      .section-box .grid-picker {
        margin: var(--awc-e-s2) 0 0 0;
        background: transparent;
        padding: 0;
      }
      .field-group .grid-picker {
        margin: 0;
        background: transparent;
        padding: 0;
      }
      .buttons-pos-align-row .grid-picker {
        margin: 0;
        padding: 0;
        background: transparent;
        flex-shrink: 0;
      }
      .grid-3x3 {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--awc-e-s1);
        width: 144px;
        aspect-ratio: 1;
      }
      .grid-cell {
        border: 0;
        background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.16);
        border-radius: var(--awc-e-r-inline);
        cursor: pointer;
        padding: 0;
        transition: background var(--awc-e-t);
        &:hover:not(.disabled):not(.active) {
          background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.28);
        }
        &.active {
          background: var(--primary-color);
        }
        &.empty {
          visibility: hidden;
          pointer-events: none;
        }
        &.disabled {
          opacity: 0.4;
          cursor: not-allowed;
          background: repeating-linear-gradient(
            45deg,
            rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.16) 0 6px,
            var(--divider-color) 6px 7px
          );
        }
      }
      .grid-extras {
        display: flex;
        gap: var(--awc-e-s1);
        margin-top: var(--awc-e-s2);
        flex-wrap: wrap;
      }
      .grid-extra {
        flex: 1;
        min-width: 100px;
        padding: var(--awc-e-s2) var(--awc-e-s3);
        border: 0;
        background: var(--secondary-background-color);
        border-radius: var(--awc-e-r-inline);
        color: var(--primary-text-color);
        font-size: var(--awc-e-f-label);
        cursor: pointer;
        transition:
          background var(--awc-e-t),
          color var(--awc-e-t);
        &:hover:not(.active) {
          background: var(--divider-color);
        }
        &.active {
          background: var(--primary-color);
          color: var(--text-primary-color, white);
        }
      }
      .grid-with-side {
        display: flex;
        gap: var(--awc-e-s4);
        align-items: flex-start;
        flex-wrap: wrap;
      }
      .grid-side {
        flex: 1 1 150px;
        min-width: 150px;
      }
      .img-offset-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--awc-e-s2);
        & label {
          display: flex;
          flex-direction: column;
          gap: var(--awc-e-s1);
          font-size: var(--awc-e-f-meta);
          color: var(--secondary-text-color);
        }
        & input {
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
          padding: var(--awc-e-s2) var(--awc-e-s3);
          border: 1px solid transparent;
          background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.07);
          color: var(--primary-text-color);
          border-radius: var(--awc-e-r-ctrl);
          font-size: var(--awc-e-f-body);
          transition: border-color var(--awc-e-t);
        }
        & input:focus {
          outline: none;
          border-color: var(--primary-color);
        }
      }
      /* Composite field groups */
      .composite {
        margin: var(--awc-e-s3) 0 var(--awc-e-s4) 0;
        padding: var(--awc-e-s3) var(--awc-e-s4);
      }
      .composite-row {
        display: flex;
        align-items: center;
        gap: var(--awc-e-s2);
        flex-wrap: wrap;
      }
      .composite-unit {
        font-size: var(--awc-e-f-label);
        color: var(--secondary-text-color);
      }
      .composite-number,
      .composite-grid-4 input {
        flex: 1;
        min-width: 120px;
        padding: var(--awc-e-s2) var(--awc-e-s3);
        border: 1px solid transparent;
        background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.07);
        color: var(--primary-text-color);
        border-radius: var(--awc-e-r-ctrl);
        font-size: var(--awc-e-f-body);
        box-sizing: border-box;
        transition: border-color var(--awc-e-t);
        &:focus {
          outline: none;
          border-color: var(--primary-color);
        }
      }
      .composite-number:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .composite-grid-4 {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: var(--awc-e-s2);
        & label {
          display: flex;
          flex-direction: column;
          gap: var(--awc-e-s1);
          font-size: var(--awc-e-f-meta);
          color: var(--secondary-text-color);
        }
        & input {
          flex: none;
          min-width: 0;
          width: 100%;
        }
      }
      .composite-textfield {
        flex: 1;
        min-width: 0;
      }
      /* Segmented controls */
      .segmented {
        display: flex;
        flex-wrap: wrap;
        width: 100%;
        background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.07);
        border-radius: var(--awc-e-r-ctrl);
        padding: 0;
        gap: 1px;
        box-sizing: border-box;
        & button {
          flex: 1 1 auto;
          min-width: 52px;
          padding: var(--awc-e-s2) var(--awc-e-s3);
          border: 0;
          background: transparent;
          color: var(--primary-text-color);
          font-size: var(--awc-e-f-body);
          cursor: pointer;
          transition:
            background var(--awc-e-t),
            color var(--awc-e-t);
          text-align: center;
          border-radius: var(--awc-e-r-ctrl);
          &:hover:not(.active) {
            background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.07);
          }
          &.active {
            background: var(--primary-color);
            color: var(--text-primary-color, white);
          }
        }
        &.segmented-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
      }
      .composite-row .segmented {
        flex: 1;
        min-width: 0;
      }
      .segmented.segmented-compact {
        & button {
          min-width: 0;
          padding: var(--awc-e-s2) var(--awc-e-s1);
          font-size: var(--awc-e-f-meta);
        }
      }
      /* Disclosure / details */
      details.disclosure {
        margin-top: var(--awc-e-s3);
        overflow: hidden;
        & > summary {
          list-style: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: var(--awc-e-s2);
          padding: var(--awc-e-s3) var(--awc-e-s4);
          font-size: var(--awc-e-f-label);
          font-weight: 500;
          color: var(--primary-text-color);
          user-select: none;
          transition: background var(--awc-e-t);
          &::-webkit-details-marker {
            display: none;
          }
          &:hover {
            background: var(--divider-color);
          }
          & ha-icon {
            --mdc-icon-size: 18px;
            color: var(--secondary-text-color);
          }
          & .chevron {
            transition: transform var(--awc-e-t);
          }
        }
        &[open] > summary .chevron {
          transform: rotate(90deg);
        }
        & > .disclosure-body {
          padding: var(--awc-e-s4) var(--awc-e-s4) var(--awc-e-s3)
            var(--awc-e-s4);
        }
      }
      details.sub-disclosure {
        border-top: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.06);
        & > summary {
          list-style: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: var(--awc-e-s2);
          padding: 8px 0 2px;
          font-size: var(--awc-e-f-label);
          font-weight: 500;
          color: var(--primary-text-color);
          user-select: none;
          transition: background var(--awc-e-t);
          &::-webkit-details-marker {
            display: none;
          }
          & ha-icon {
            --mdc-icon-size: 16px;
            color: var(--secondary-text-color);
          }
          & .chevron {
            transition: transform var(--awc-e-t);
          }
        }
        &[open] > summary .chevron {
          transform: rotate(90deg);
        }
        & > .disclosure-body {
          padding: var(--awc-e-s2) 0 var(--awc-e-s3);
        }
      }
      /* Card rows (cards editor) */
      .cards-empty {
        padding: var(--awc-e-s4);
        text-align: center;
        font-size: var(--awc-e-f-label);
        color: var(--secondary-text-color);
        margin-bottom: var(--awc-e-s3);
      }
      .card-row {
        margin-bottom: var(--awc-e-s2);
        overflow: hidden;
        & .card-row-head {
          display: flex;
          align-items: center;
          gap: var(--awc-e-s2);
          padding: var(--awc-e-s3) var(--awc-e-s4);
          cursor: pointer;
          user-select: none;
          transition: background var(--awc-e-t);
          &:hover {
            background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.05);
          }
          & > .chevron {
            --mdc-icon-size: 20px;
            color: var(--secondary-text-color);
            transition: transform var(--awc-e-t);
          }
        }
        &.expanded .card-row-head > .chevron {
          transform: rotate(90deg);
        }
        & .card-row-title {
          flex: 1;
          font-size: var(--awc-e-f-body);
          font-weight: 500;
          color: var(--primary-text-color);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        & .card-row-actions {
          display: flex;
          gap: 2px;
          & button {
            width: 32px;
            height: 32px;
            border: 0;
            background: transparent;
            color: var(--secondary-text-color);
            border-radius: var(--awc-e-r-inline);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition:
              background var(--awc-e-t),
              color var(--awc-e-t);
            &:hover:not(:disabled) {
              background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.07);
              color: var(--primary-text-color);
            }
            &:disabled {
              opacity: 0.3;
              cursor: not-allowed;
            }
          }
          & ha-icon {
            --mdc-icon-size: 18px;
          }
        }
        & .card-row-body {
          padding: var(--awc-e-s3) var(--awc-e-s4) var(--awc-e-s4);
          background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.03);
        }
      }
      /* Add buttons */
      .add-card-btn,
      .add-button-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--awc-e-s2);
        width: 100%;
        padding: var(--awc-e-s3);
        border: 1.5px solid rgba(var(--rgb-primary-color, 0, 120, 212), 0.4);
        background: rgba(var(--rgb-primary-color, 0, 120, 212), 0.06);
        color: var(--primary-color);
        border-radius: var(--awc-e-r-box);
        font-size: var(--awc-e-f-body);
        font-weight: 500;
        cursor: pointer;
        transition:
          background var(--awc-e-t),
          border-color var(--awc-e-t);
        &:hover {
          background: rgba(var(--rgb-primary-color, 0, 120, 212), 0.12);
          border-color: var(--primary-color);
        }
        & ha-icon {
          --mdc-icon-size: 20px;
        }
      }
      .sensor-list {
        margin-top: 0;
        &:empty {
          display: none;
        }
      }
      /* Compact fields */
      .compact-fields {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--awc-e-s2);
        margin: var(--awc-e-s3) 0;
      }
      .compact-field {
        display: flex;
        flex-direction: column;
        gap: 2px;
        & .compact-field-label {
          font-size: var(--awc-e-f-meta);
          color: var(--secondary-text-color);
          padding-left: 2px;
        }
        & input,
        & ha-textfield {
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        & input {
          padding: var(--awc-e-s2) var(--awc-e-s3);
          border: 1px solid transparent;
          background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.07);
          color: var(--primary-text-color);
          border-radius: var(--awc-e-r-ctrl);
          font-size: var(--awc-e-f-body);
          transition: border-color var(--awc-e-t);
          &:focus {
            outline: none;
            border-color: var(--primary-color);
          }
        }
      }
      /* Toggle groups */
      .toggle-group {
        background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.06);
        border-radius: var(--awc-e-r-box);
        overflow: hidden;
        margin: var(--awc-e-s2) 0;
      }
      .toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--awc-e-s3);
        padding: 10px var(--awc-e-s2) 10px var(--awc-e-s3);
        cursor: pointer;
        box-sizing: border-box;
        & + .toggle-row {
          border-top: 1px solid
            rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.06);
        }
        & > span {
          font-size: var(--awc-e-f-body);
          color: var(--primary-text-color);
        }
        & ha-switch {
          flex-shrink: 0;
          margin: 0;
          padding: 0;
          --ha-switch-background-color: rgba(
            var(--rgb-primary-text-color, 0, 0, 0),
            0.12
          );
          --ha-switch-thumb-background-color: rgba(
            var(--rgb-primary-text-color, 0, 0, 0),
            0.35
          );
          --ha-switch-border-color: transparent;
          --ha-switch-thumb-border-color: transparent;
          --ha-switch-checked-border-color: transparent;
          --ha-switch-checked-thumb-border-color: transparent;
          --ha-switch-checked-background-color: var(--primary-color);
          --ha-switch-checked-thumb-background-color: var(
            --text-primary-color,
            #fff
          );
          --switch-unchecked-track-color: rgba(
            var(--rgb-primary-text-color, 0, 0, 0),
            0.12
          );
          --switch-unchecked-button-color: rgba(
            var(--rgb-primary-text-color, 0, 0, 0),
            0.35
          );
          --switch-checked-track-color: var(--primary-color);
          --switch-checked-button-color: var(--text-primary-color, #fff);
        }
      }
      /* Section boxes */
      .section-box {
        background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.09);
        border-radius: var(--awc-e-r-box);
        overflow: hidden;
        margin: var(--awc-e-s3) 0 var(--awc-e-s4) 0;
        padding: var(--awc-e-s3) var(--awc-e-s4);
      }
      .section-box.no-pad {
        padding: var(--awc-e-s4);
      }
      .section-box.no-pad > .sensor-list {
        margin-top: 0;
      }
      .section-box .compact-fields {
        margin: 0;
      }
      .fc-box {
        margin: var(--awc-e-s3) 0;
        padding: var(--awc-e-s3) var(--awc-e-s4);
        background: rgba(var(--rgb-primary-color, 0, 120, 212), 0.08);
        border: 1px solid rgba(var(--rgb-primary-color, 0, 120, 212), 0.18);
        border-radius: var(--awc-e-r-box);
      }
      .fc-box ha-form {
        margin-top: var(--awc-e-s2);
      }
      /* Icon combo & weather icon */
      .icon-combo {
        display: flex;
        align-items: center;
        gap: var(--awc-e-s1);
        & ha-icon-picker {
          flex: 1;
          min-width: 0;
        }
        & .icon-weather-btn {
          flex-shrink: 0;
          padding: var(--awc-e-s2) var(--awc-e-s3);
          border: 0;
          border-radius: var(--awc-e-r-ctrl);
          font-size: var(--awc-e-f-meta);
          cursor: pointer;
          transition:
            background var(--awc-e-t),
            color var(--awc-e-t);
          &.active {
            background: var(--primary-color);
            color: var(--text-primary-color, white);
          }
          &:not(.active) {
            background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.09);
            color: var(--primary-text-color);
          }
          &:hover:not(.active) {
            background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.16);
          }
        }
      }
      .weather-icon-active {
        display: flex;
        align-items: center;
        gap: var(--awc-e-s2);
        padding: var(--awc-e-s2) var(--awc-e-s3);
        background: rgba(var(--rgb-primary-color, 0, 120, 212), 0.07);
        border: 1px solid rgba(var(--rgb-primary-color, 0, 120, 212), 0.18);
        border-radius: var(--awc-e-r-ctrl);
      }
      .weather-icon-active-text {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 1px;
        & span:first-child {
          font-size: var(--awc-e-f-label);
          font-weight: 500;
          color: var(--primary-text-color);
        }
      }
      .weather-icon-active-sub {
        font-size: var(--awc-e-f-meta);
        color: var(--secondary-text-color);
      }
      .weather-icon-active .icon-weather-btn {
        flex-shrink: 0;
        padding: var(--awc-e-s1) var(--awc-e-s2);
        border: 0;
        border-radius: var(--awc-e-r-ctrl);
        font-size: var(--awc-e-f-meta);
        cursor: pointer;
        background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.09);
        color: var(--primary-text-color);
        transition: background var(--awc-e-t);
        &:hover {
          background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.16);
        }
      }
      /* Button type picker */
      .button-type-picker {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--awc-e-s2);
        margin: 0 0 var(--awc-e-s3) 0;
      }
      .button-type-btn {
        display: flex;
        align-items: center;
        gap: var(--awc-e-s2);
        padding: var(--awc-e-s2) var(--awc-e-s3);
        border: 1.5px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.12);
        border-radius: var(--awc-e-r-box);
        background: transparent;
        color: var(--primary-text-color);
        text-align: left;
        cursor: pointer;
        transition:
          border-color var(--awc-e-t),
          background var(--awc-e-t);
        &:hover {
          border-color: var(--primary-color);
          background: rgba(var(--rgb-primary-color, 0, 120, 212), 0.05);
        }
        &.active {
          border-color: var(--primary-color);
          background: rgba(var(--rgb-primary-color, 0, 120, 212), 0.08);
        }
        & .button-type-icon {
          --mdc-icon-size: 18px;
          color: var(--secondary-text-color);
          flex-shrink: 0;
        }
        & .button-type-icon.active-icon {
          color: var(--primary-color);
        }
        & .button-type-text {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        & .button-type-name {
          font-size: var(--awc-e-f-label);
          font-weight: 500;
          line-height: 1.2;
        }
        & .button-type-desc {
          font-size: var(--awc-e-f-meta);
          color: var(--secondary-text-color);
          line-height: 1.2;
        }
      }
      /* Button header badges */
      .button-badge-row {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        border-radius: 4px;
        background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.1);
        color: var(--secondary-text-color);
        flex-shrink: 0;
        & ha-icon {
          --mdc-icon-size: 13px;
        }
      }
      .button-badge-free {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        border-radius: 4px;
        background: var(--primary-color, rgba(76, 140, 110, 0.85));
        color: #fff;
        flex-shrink: 0;
        & ha-icon {
          --mdc-icon-size: 13px;
        }
      }
      /* Position grid + align */
      .buttons-pos-align-row {
        display: flex;
        gap: var(--awc-e-s3);
        align-items: flex-start;
      }
      /* CSS value fields */
      .css-field-row {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
        gap: var(--awc-e-s2);
        margin-top: var(--awc-e-s2);
      }
      .css-field-row.cols-2 {
        grid-template-columns: 1fr 1fr;
      }
      .css-field {
        display: flex;
        flex-direction: column;
        gap: 3px;
        & .css-field-label {
          font-size: var(--awc-e-f-meta);
          color: var(--secondary-text-color);
          font-weight: 500;
          padding-left: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        & input {
          width: 100%;
          box-sizing: border-box;
          height: 36px;
          padding: 0 10px;
          border: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.18);
          background: var(
            --mdc-text-field-fill-color,
            rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.06)
          );
          color: var(--primary-text-color);
          border-radius: var(--awc-e-r-ctrl);
          font-size: var(--awc-e-f-body);
          font-family: inherit;
          transition: border-color var(--awc-e-t);
          &:focus {
            outline: none;
            border-color: var(--primary-color);
          }
          &::placeholder {
            color: var(--secondary-text-color);
            opacity: 0.7;
          }
        }
      }
      /* Section headings */
      .settings-group {
        margin-top: 16px;
      }
      .settings-group:first-child {
        margin-top: 0;
      }
      .settings-group-label {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--secondary-text-color);
        margin-bottom: var(--awc-e-s2);
        display: flex;
        align-items: center;
        gap: var(--awc-e-s1);
      }
      .section-title {
        font-size: var(--awc-e-f-label);
        font-weight: 600;
        color: var(--primary-text-color);
        margin-bottom: var(--awc-e-s2);
        display: flex;
        align-items: center;
        gap: var(--awc-e-s1);
      }
      .field-group {
        background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.05);
        border-radius: var(--awc-e-r-box);
        padding: var(--awc-e-s3);
        margin-top: var(--awc-e-s2);
      }
      .field-group > .toggle-group:first-child {
        margin-top: 0;
      }
      .field-group > .toggle-group:last-child {
        margin-bottom: 0;
      }
      .field-group-label {
        font-size: var(--awc-e-f-meta);
        font-weight: 500;
        color: var(--secondary-text-color);
        margin-bottom: var(--awc-e-s2);
      }
      /* Button accordions */
      .button-accordion {
        border: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.09);
        border-radius: var(--awc-e-r-box);
        overflow: hidden;
        margin-top: var(--awc-e-s2);
        background: var(--secondary-background-color);
      }
      .button-accordion + .button-accordion {
        margin-top: var(--awc-e-s1);
      }
      .button-accordion-head {
        display: flex;
        align-items: center;
        gap: var(--awc-e-s2);
        padding: var(--awc-e-s2) var(--awc-e-s3);
        cursor: pointer;
        background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.03);
        user-select: none;
        -webkit-user-select: none;
        & .button-accordion-title {
          flex: 1;
          font-size: var(--awc-e-f-label);
          font-weight: 500;
          color: var(--primary-text-color);
        }
        & .button-accordion-icon {
          --mdc-icon-size: 15px;
          color: var(--secondary-text-color);
          flex-shrink: 0;
        }
        & ha-icon.chevron {
          --mdc-icon-size: 16px;
          color: var(--secondary-text-color);
          transition: transform var(--awc-e-t);
          flex-shrink: 0;
        }
        &.open ha-icon.chevron {
          transform: rotate(90deg);
        }
        &:hover {
          background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.06);
        }
      }
      .button-accordion-body {
        padding: var(--awc-e-s3);
        border-top: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.09);
      }
      .button-accordion-body > .settings-group:first-child {
        margin-top: 0;
      }
      .button-accordion-body .settings-group + .settings-group {
        margin-top: var(--awc-e-s3);
      }
      /* Button nudge strips */
      .button-nudge {
        display: flex;
        align-items: flex-start;
        gap: var(--awc-e-s2);
        padding: var(--awc-e-s2) var(--awc-e-s3);
        margin: var(--awc-e-s1) 0;
        border-radius: var(--awc-e-r-ctrl);
        font-size: var(--awc-e-f-meta);
        color: var(--secondary-text-color);
        line-height: 1.5;
        & code {
          background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.08);
          padding: 0 4px;
          border-radius: 3px;
        }
      }
      .button-nudge.warning {
        background: rgba(var(--rgb-warning-color, 255, 152, 0), 0.1);
        border: 1px solid rgba(var(--rgb-warning-color, 255, 152, 0), 0.25);
      }
      .button-nudge.info {
        background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.04);
        border: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.09);
      }
      /* Button color picker */
      .button-color-box {
        margin-top: var(--awc-e-s2);
        padding: var(--awc-e-s2) var(--awc-e-s3);
        border: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.1);
        border-radius: var(--awc-e-r-ctrl);
        background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.03);
      }
      .button-color-row {
        display: flex;
        align-items: center;
        gap: var(--awc-e-s2);
      }
      .button-color-label {
        flex: 1;
        font-size: var(--awc-e-f-label);
        color: var(--primary-text-color);
      }
      .button-color-swatch {
        width: 36px;
        height: 28px;
        border: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.18);
        border-radius: var(--awc-e-r-inline);
        padding: 1px 2px;
        background: none;
        cursor: pointer;
        flex-shrink: 0;
      }
      .button-color-clear {
        width: 24px;
        height: 24px;
        border: 0;
        border-radius: 50%;
        padding: 0;
        background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.08);
        color: var(--secondary-text-color);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: background var(--awc-e-t);
        &:hover {
          background: rgba(var(--rgb-error-color, 211, 47, 47), 0.15);
          color: var(--error-color);
        }
      }
      .button-color-opacity-row {
        display: flex;
        align-items: center;
        gap: var(--awc-e-s2);
        margin-top: var(--awc-e-s2);
      }
      .button-color-opacity-label {
        font-size: 11px;
        color: var(--secondary-text-color);
        white-space: nowrap;
      }
      .button-color-opacity {
        flex: 1;
        height: 4px;
        accent-color: var(--primary-color);
        cursor: pointer;
      }
      .button-color-opacity-val {
        font-size: 11px;
        color: var(--secondary-text-color);
        width: 32px;
        text-align: right;
        flex-shrink: 0;
      }
      /* Sliders */
      .awc-slider {
        display: flex;
        flex-direction: column;
        gap: var(--awc-e-s1);
        padding: var(--awc-e-s3);
        background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.05);
        border-radius: var(--awc-e-r-box);
      }
      .awc-slider-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--awc-e-s2);
        margin-bottom: var(--awc-e-s1);
      }
      .awc-slider-label {
        font-size: var(--awc-e-f-label);
        color: var(--primary-text-color);
        font-weight: 400;
        flex: 1;
      }
      .awc-slider-num {
        width: 48px;
        flex-shrink: 0;
        text-align: right;
        border: none;
        background: none;
        color: var(--primary-color);
        font-size: var(--awc-e-f-label);
        font-weight: 600;
        font-family: inherit;
        padding: 0;
        outline: none;
        -moz-appearance: textfield;
        &::-webkit-inner-spin-button,
        &::-webkit-outer-spin-button {
          -webkit-appearance: none;
        }
      }
      .awc-slider-range {
        width: 100%;
        height: 4px;
        accent-color: var(--primary-color);
        cursor: pointer;
        appearance: none;
        -webkit-appearance: none;
        display: block;
        background: linear-gradient(
          to right,
          var(--primary-color) 0%,
          var(--primary-color) var(--awc-slider-pct, 50%),
          rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.18)
            var(--awc-slider-pct, 50%)
        );
        border-radius: 2px;
        border: none;
        outline: none;
        &::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--primary-color);
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
        }
        &::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--primary-color);
          cursor: pointer;
          border: none;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
        }
      }
      .awc-slider-helper {
        font-size: var(--awc-e-f-meta);
        color: var(--secondary-text-color);
        margin-top: var(--awc-e-s1);
        line-height: 1.4;
      }
      .awc-slider-status {
        font-size: var(--awc-e-f-meta);
        color: var(--primary-color);
        margin-top: 2px;
        line-height: 1.4;
        font-weight: 500;
      }
      /* Free button positioning */
      .free-pos-layout {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: var(--awc-e-s3);
        align-items: start;
      }
      .offset-fields {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--awc-e-s2);
      }
      .offset-field {
        display: flex;
        flex-direction: column;
        gap: 3px;
        & .offset-field-label {
          font-size: 11px;
          color: var(--secondary-text-color);
          font-weight: 500;
          padding-left: 2px;
        }
        & input {
          width: 100%;
          box-sizing: border-box;
          height: 36px;
          padding: 0 10px;
          border: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.18);
          background: var(
            --mdc-text-field-fill-color,
            rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.06)
          );
          color: var(--primary-text-color);
          border-radius: var(--awc-e-r-ctrl);
          font-size: var(--awc-e-f-body);
          font-family: inherit;
          &:focus {
            outline: none;
            border-color: var(--primary-color);
          }
          &::placeholder {
            color: var(--secondary-text-color);
            opacity: 0.7;
          }
        }
      }
      .free-mode-box {
        background: rgba(var(--rgb-primary-color, 0, 120, 212), 0.05);
        border: 1px solid rgba(var(--rgb-primary-color, 0, 120, 212), 0.14);
        border-radius: var(--awc-e-r-box);
        overflow: hidden;
      }
      .free-mode-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--awc-e-s2) var(--awc-e-s3);
      }
      .free-mode-label {
        font-size: var(--awc-e-f-label);
        font-weight: 500;
        color: var(--primary-text-color);
        display: flex;
        align-items: center;
        gap: var(--awc-e-s1);
      }
      .free-pos-subpanel {
        padding: 0 var(--awc-e-s3) var(--awc-e-s3);
      }
      .free-pos-subpanel::before {
        content: "";
        display: block;
        height: 10px;
      }
      .anchor-grid {
        display: grid;
        grid-template-columns: repeat(3, 30px);
        grid-template-rows: repeat(3, 30px);
        gap: 4px;
      }
      .anchor-cell {
        width: 30px;
        height: 30px;
        border: 1.5px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.15);
        border-radius: var(--awc-e-r-ctrl);
        background: transparent;
        cursor: pointer;
        transition:
          border-color var(--awc-e-t),
          background var(--awc-e-t);
        &:hover:not(.active) {
          border-color: var(--primary-color);
          background: rgba(var(--rgb-primary-color, 0, 120, 212), 0.07);
        }
        &.active {
          border-color: var(--primary-color);
          background: var(--primary-color);
        }
      }
      .clearable-field {
        position: relative;
        & ha-form {
          padding-right: 0;
        }
        & .clear-btn {
          position: absolute;
          top: 8px;
          right: 4px;
          width: 24px;
          height: 24px;
          padding: 0;
          margin: 0;
          border: none;
          background: transparent;
          color: var(--secondary-text-color);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          opacity: 0.6;
          transition:
            opacity var(--awc-e-t),
            color var(--awc-e-t);
          z-index: 1;
          &:hover {
            opacity: 1;
            color: var(--error-color);
          }
          & ha-icon {
            --mdc-icon-size: 16px;
          }
        }
      }
      /* Forecast special box */
      .button-forecast-box {
        border: 1px solid rgba(var(--rgb-primary-color, 0, 120, 212), 0.18);
        border-radius: var(--awc-e-r-box);
        overflow: hidden;
        margin-top: var(--awc-e-s3);
      }
      .button-forecast-header {
        display: flex;
        align-items: center;
        gap: var(--awc-e-s1);
        padding: var(--awc-e-s1) var(--awc-e-s3) 0;
        font-size: 11px;
        font-weight: 600;
        color: var(--primary-color);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .button-forecast-header ha-icon {
        --mdc-icon-size: 13px;
      }
      .button-forecast-body {
        padding: var(--awc-e-s2) var(--awc-e-s3) var(--awc-e-s3);
      }
      .button-forecast-body > * + * {
        margin-top: var(--awc-e-s2);
      }
      /* Ring threshold rows */
      .ring-threshold-row {
        display: flex;
        align-items: center;
        gap: var(--awc-e-s2);
        padding: var(--awc-e-s2) 0;
        & + .ring-threshold-row {
          border-top: 1px solid
            rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.06);
          padding-top: var(--awc-e-s2);
        }
      }
      .ring-threshold-row .button-color-swatch {
        width: 28px;
        height: 22px;
        flex-shrink: 0;
      }
      .ring-threshold-row input[type="text"] {
        flex: 1;
        min-width: 0;
        height: 30px;
        padding: 0 8px;
        border: 1px solid transparent;
        background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.07);
        color: var(--primary-text-color);
        border-radius: var(--awc-e-r-ctrl);
        font-size: var(--awc-e-f-body);
        font-family: inherit;
        &:focus {
          outline: none;
          border-color: var(--primary-color);
        }
      }
      .ring-threshold-row .threshold-label {
        font-size: 11px;
        color: var(--secondary-text-color);
        white-space: nowrap;
      }
      .ring-threshold-del {
        width: 22px;
        height: 22px;
        border: 0;
        border-radius: 50%;
        padding: 0;
        background: transparent;
        color: var(--secondary-text-color);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition:
          background var(--awc-e-t),
          color var(--awc-e-t);
        &:hover {
          background: rgba(var(--rgb-error-color, 211, 47, 47), 0.12);
          color: var(--error-color);
        }
      }
      .ring-threshold-add {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--awc-e-s2);
        width: 100%;
        padding: var(--awc-e-s2);
        margin-top: var(--awc-e-s2);
        border: 1.5px solid rgba(var(--rgb-primary-color, 0, 120, 212), 0.4);
        border-radius: var(--awc-e-r-ctrl);
        background: rgba(var(--rgb-primary-color, 0, 120, 212), 0.06);
        color: var(--primary-color);
        font-size: var(--awc-e-f-label);
        font-weight: 500;
        cursor: pointer;
        transition:
          background var(--awc-e-t),
          border-color var(--awc-e-t);
        &:hover {
          background: rgba(var(--rgb-primary-color, 0, 120, 212), 0.12);
          border-color: var(--primary-color);
        }
        & ha-icon {
          --mdc-icon-size: 16px;
        }
      }
      /* Visual Button Builder */
      .vcb {
        display: flex;
        flex-direction: column;
        gap: var(--awc-e-s2);
      }
      /* Format picker: refined mini diagrams */
      .vcb-format-row {
        display: flex;
        gap: var(--awc-e-s2);
      }
      .vcb-format-card {
        flex: 1;
        border: 1.5px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.1);
        border-radius: var(--awc-e-r-box);
        padding: 8px 6px 6px;
        cursor: pointer;
        background: transparent;
        transition:
          border-color 0.12s,
          background 0.12s;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        list-style: none;
      }
      .vcb-format-card::before,
      .vcb-format-card::marker {
        content: none;
        display: none;
      }
      .vcb-format-card:hover {
        border-color: rgba(var(--rgb-primary-color, 0, 120, 212), 0.4);
        background: rgba(var(--rgb-primary-color, 0, 120, 212), 0.03);
      }
      .vcb-format-card.active {
        border-color: var(--primary-color);
        background: rgba(var(--rgb-primary-color, 0, 120, 212), 0.08);
      }
      .vcb-fmt {
        display: flex;
        gap: 4px;
        align-items: center;
        height: 24px;
      }
      .vcb-fmt.stacked {
        gap: 5px;
      }
      .vcb-fmt.stacked .vcb-fmt-col {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .vcb-fmt.vertical {
        flex-direction: column;
        gap: 3px;
        align-items: center;
        height: auto;
      }
      .vcb-fmt-sq {
        width: 12px;
        height: 12px;
        border-radius: 3px;
        background: var(--primary-color);
        opacity: 0.35;
      }
      .vcb-format-card.active .vcb-fmt-sq {
        opacity: 0.55;
      }
      .vcb-fmt-bar {
        height: 3px;
        border-radius: 1.5px;
      }
      .vcb-fmt-bar.sm {
        width: 14px;
        background: var(--secondary-text-color);
        opacity: 0.25;
      }
      .vcb-fmt-bar.lg {
        width: 18px;
        background: var(--primary-text-color);
        opacity: 0.4;
      }
      .vcb-format-card.active .vcb-fmt-bar.sm {
        opacity: 0.35;
      }
      .vcb-format-card.active .vcb-fmt-bar.lg {
        opacity: 0.55;
      }
      .vcb-format-name {
        font-size: 10px;
        color: var(--secondary-text-color);
        font-weight: 500;
      }
      .vcb-format-card.active .vcb-format-name {
        color: var(--primary-color);
        font-weight: 600;
      }
      .vcb-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--awc-e-s2);
      }
      .vcb-section {
        border-top: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.06);
      }
      .vcb-section-head {
        display: flex;
        align-items: center;
        gap: var(--awc-e-s2);
        padding: 8px 0 2px;
        cursor: pointer;
        user-select: none;
      }
      .vcb-section-head ha-icon {
        --mdc-icon-size: 16px;
        color: var(--secondary-text-color);
      }
      .vcb-section-head ha-icon.chevron {
        transition: transform 0.12s;
      }
      .vcb-section-head.open ha-icon.chevron {
        transform: rotate(90deg);
      }
      .vcb-section-title {
        font-size: var(--awc-e-f-label);
        font-weight: 500;
        color: var(--primary-text-color);
        flex: 1;
      }
      .vcb-section-body {
        padding: var(--awc-e-s2) 0 var(--awc-e-s3);
      }
      .vcb-section-body > * + * {
        margin-top: 6px;
      }
      .vcb-section-head .vcb-reorder {
        display: flex;
        gap: 2px;
        margin-left: auto;
      }
      .vcb-section-head .vcb-reorder button {
        width: 22px;
        height: 20px;
        border: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.1);
        border-radius: 4px;
        background: transparent;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--secondary-text-color);
        padding: 0;
        transition:
          background 0.12s,
          color 0.12s;
      }
      .vcb-section-head .vcb-reorder button:hover {
        background: rgba(var(--rgb-primary-color, 0, 120, 212), 0.12);
        color: var(--primary-color);
      }
      .vcb-section-head .vcb-reorder button:disabled {
        opacity: 0.15;
        cursor: default;
        pointer-events: none;
      }
      .vcb-section-head .vcb-reorder button ha-icon {
        --mdc-icon-size: 13px;
      }
      .vcb-section.dimmed > .vcb-section-head {
        opacity: 0.45;
      }
      .vcb-section.dimmed > .vcb-section-head:hover {
        opacity: 0.7;
      }
      .vcb-nested-group {
        margin-left: 12px;
        padding-left: 10px;
        border-left: 2px solid
          rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.06);
      }
    `;
  }
  setConfig(config) {
    const c = { ...(config || {}) };
    if (c.disable_weather_visuals === true && c.disable_background == null)
      c.disable_background = true;
    delete c.disable_weather_visuals;
    delete c.disable_sky_gradient;
    let autofilled = false;
    if (!c.weather_entity && this.hass && this.hass.states) {
      const firstWeather = Object.keys(this.hass.states).find((id) =>
        id.startsWith("weather."),
      );
      if (firstWeather) {
        c.weather_entity = firstWeather;
        autofilled = true;
      }
    }
    if (
      !c.sun_entity &&
      this.hass &&
      this.hass.states &&
      this.hass.states["sun.sun"]
    ) {
      c.sun_entity = "sun.sun";
      autofilled = true;
    }
    this._config = this._cleanConfig(c);
    if (c.card_color_mode === "light") this._colorModeState = "force_light";
    else if (c.card_color_mode === "dark") this._colorModeState = "force_dark";
    else if (c.theme_entity) this._colorModeState = "entity";
    else this._colorModeState = "ha_theme";
    if (autofilled) Promise.resolve().then(() => this._emit());
  }
  get _formData() {
    if (
      this._cachedFormData &&
      this._cachedFormConfig === this._config &&
      this._cachedFormColorMode === this._colorModeState
    ) {
      return this._cachedFormData;
    }
    const c = { ...DISPLAY_DEFAULTS, ...(this._config || {}) };
    c._color_mode =
      this._colorModeState ||
      (c.card_color_mode === "light"
        ? "force_light"
        : c.card_color_mode === "dark"
          ? "force_dark"
          : c.theme_entity
            ? "entity"
            : "ha_theme");
    c._visual_mode =
      c.disable_background === true
        ? "none"
        : c.weather_image_path || c.weather_image_path_night
          ? "images"
          : c.simple_background === true
            ? "simple"
            : "visuals";
    this._cachedFormData = c;
    this._cachedFormConfig = this._config;
    this._cachedFormColorMode = this._colorModeState;
    return c;
  }
  _colorModeSchema() {
    const c = this._formData,
      showThemeEntity = c._color_mode === "entity";
    return [
      {
        name: "_color_mode",
        selector: { select: { mode: "dropdown", options: OPT.color_mode } },
      },
      ...(showThemeEntity
        ? [{ name: "theme_entity", selector: { entity: {} } }]
        : []),
    ];
  }
  _setVisualMode(mode) {
    const clear = [
      "disable_background",
      "simple_background",
      "weather_image_path",
      "weather_image_path_night",
      "disable_weather_visuals",
      "disable_sky_gradient",
    ];
    if (mode === "none") {
      this._patch(
        {
          disable_background: true,
          night_sky_effects: false,
          sun_effects: false,
          theme_adapt: false,
        },
        { strip: clear.filter((k) => k !== "disable_background") },
      );
    } else if (mode === "simple") {
      this._patch(
        { simple_background: true },
        { strip: clear.filter((k) => k !== "simple_background") },
      );
    } else if (mode === "images") {
      this._patch(
        { weather_image_path: "/local/weather-images/day" },
        { strip: clear.filter((k) => k !== "weather_image_path") },
      );
    } else {
      this._patch({}, { strip: clear });
    }
  }
  _getAreas() {
    const areas = (this._config || {}).button_areas;
    return Array.isArray(areas) && areas.length > 0
      ? areas.map((a) => (a && typeof a === "object" ? a : {}))
      : [];
  }
  _getButtonsForArea(areaIdx) {
    const area = this._getAreas()[areaIdx];
    const buttons = area && area.buttons;
    return Array.isArray(buttons) && buttons.length > 0
      ? buttons.map((s) => (s && typeof s === "object" ? s : {}))
      : [];
  }
  _commitAreas(list) {
    if (!Array.isArray(list) || list.length === 0) {
      this._patch({}, { strip: ["button_areas"] });
      return;
    }
    this._patch({ button_areas: list });
  }
  _updateAreaAt(idx, newArea) {
    const list = this._getAreas().map((a, i) => (i === idx ? newArea : a));
    this._commitAreas(list);
  }
  _commitButtonsInArea(areaIdx, buttons) {
    const areas = [...this._getAreas()];
    const area = { ...areas[areaIdx] };
    if (!buttons || buttons.length === 0) delete area.buttons;
    else area.buttons = buttons;
    areas[areaIdx] = area;
    this._commitAreas(areas);
  }
  _updateAreaField(areaIdx, key, value) {
    const area = { ...(this._getAreas()[areaIdx] || {}) };
    const isEmpty = value === null || value === undefined || value === "";
    if (isEmpty) delete area[key];
    else area[key] = value;
    this._updateAreaAt(areaIdx, area);
  }
  _areaTitle(area, idx) {
    const pos = (area.position || "bottom-left").toString();
    const hasVis = Array.isArray(area.visibility) && area.visibility.length > 0;
    return `${pos}${hasVis ? " · conditional" : ""}`;
  }
  _imageStatusSchema() {
    const c = this._formData,
      hasStatus = !!c.status_entity;
    return [
      { name: "status_entity", selector: { entity: {} } },
      ...(hasStatus
        ? [
            {
              type: "grid",
              name: "",
              schema: [
                { name: "status_day", selector: { text: {} } },
                { name: "status_night", selector: { text: {} } },
              ],
            },
          ]
        : []),
    ];
  }
  _computeLabel = (schema) => {
    if (!schema || !schema.name) return "";
    if (schema.name in LABELS) return LABELS[schema.name];
    return schema.name;
  };
  _computeHelper = (schema) => {
    if (!schema || !schema.name) return undefined;
    return HELPERS[schema.name] || undefined;
  };
  _valueChanged(ev) {
    ev.stopPropagation();
    if (!this._config) return;
    const prev = this._config;
    const incoming = { ...((ev.detail && ev.detail.value) || {}) };
    const strip = [];
    if (incoming._color_mode !== undefined) {
      this._colorModeState = incoming._color_mode;
      switch (incoming._color_mode) {
        case "ha_theme":
          strip.push("theme_entity");
          incoming.card_color_mode = "ha_theme";
          break;
        case "entity":
          strip.push("card_color_mode");
          if (!incoming.theme_entity) {
            incoming.theme_entity =
              incoming.sun_entity ||
              (this.hass && this.hass.states && this.hass.states["sun.sun"]
                ? "sun.sun"
                : "");
          }
          break;
        case "force_light":
          strip.push("theme_entity");
          incoming.card_color_mode = "light";
          break;
        case "force_dark":
          strip.push("theme_entity");
          incoming.card_color_mode = "dark";
          break;
      }
    }
    delete incoming._color_mode;
    if (incoming.status_entity && !prev.status_entity) {
      if (!incoming.status_day && incoming.image_day)
        incoming.status_day = incoming.image_day;
      if (!incoming.status_night && incoming.image_night)
        incoming.status_night = incoming.image_night;
    }
    this._patch(incoming, { replace: true, strip });
  }
  _patch(changes, opts) {
    const options = opts || {};
    const base = options.replace ? {} : { ...(this._config || {}) };
    const next = { ...base, ...changes };
    if (Array.isArray(options.strip)) {
      for (const k of options.strip) delete next[k];
    }
    this._config = this._cleanConfig(next);
    this._emit();
  }
  _computeInactiveKeys(c) {
    const out = new Set();
    if (c.card_color_mode === "light" || c.card_color_mode === "dark")
      out.add("theme_entity");
    return out;
  }
  _cleanConfig(config) {
    const out = { ...config };
    for (const key of Object.keys(out)) {
      if (key === "button_areas") continue;
      const v = out[key];
      if (v === "" || v === null || v === undefined) {
        delete out[key];
        continue;
      }
      if (Array.isArray(v) && v.length === 0) {
        delete out[key];
        continue;
      }
      if (
        typeof v === "object" &&
        !Array.isArray(v) &&
        Object.keys(v).length === 0
      )
        delete out[key];
    }
    for (const [k, defVal] of Object.entries(DISPLAY_DEFAULTS)) {
      if (out[k] === defVal) delete out[k];
    }
    const inactive = this._computeInactiveKeys(out);
    for (const k of inactive) delete out[k];
    delete out._color_mode;
    delete out._visual_mode;
    const ordered = {};
    for (const k of KEY_ORDER) {
      if (k === "custom_cards" || k === "button_areas") continue;
      if (k in out) ordered[k] = out[k];
    }
    for (const k of Object.keys(out)) {
      if (k === "custom_cards" || k === "button_areas") continue;
      if (!(k in ordered)) ordered[k] = out[k];
    }
    if ("button_areas" in out) ordered.button_areas = out.button_areas;
    if ("custom_cards" in out) ordered.custom_cards = out.custom_cards;
    return ordered;
  }
  _emit() {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: { ...(this._config || {}) } },
        bubbles: true,
        composed: true,
      }),
    );
  }
  _renderForm(schema) {
    if (!schema || schema.length === 0) return "";
    return html`<ha-form
      .hass=${this.hass}
      .data=${this._formData}
      .schema=${schema}
      .computeLabel=${this._computeLabel}
      .computeHelper=${this._computeHelper}
      @value-changed=${this._valueChanged}
    ></ha-form>`;
  }
  _renderClearableText(name) {
    const val = (this._formData || {})[name];
    return html`<div class="clearable-field">
      ${this._renderForm([{ name, selector: { text: {} } }])}
      ${val
        ? html`<button
            type="button"
            class="clear-btn"
            title="Clear"
            @click=${() => this._updateField(name, "")}
          >
            <ha-icon icon="mdi:close"></ha-icon>
          </button>`
        : ""}
    </div>`;
  }
  _renderDisclosure(label, content) {
    const isAdvanced = label === "Advanced options";
    return html`<details class="disclosure" @toggle=${this._onDisclosureToggle}>
      <summary>
        <ha-icon class="chevron" icon="mdi:chevron-right"></ha-icon>
        ${isAdvanced ? html`<ha-icon icon="mdi:cog-outline"></ha-icon>` : ""}
        <span>${label}</span>
      </summary>
      <div class="disclosure-body">${content}</div>
    </details>`;
  }
  _renderSubDisclosure(label, content) {
    return html`<details
      class="sub-disclosure"
      @toggle=${this._onSubDisclosureToggle}
    >
      <summary>
        <ha-icon class="chevron" icon="mdi:chevron-right"></ha-icon>
        <span>${label}</span>
      </summary>
      <div class="disclosure-body">${content}</div>
    </details>`;
  }
  _onSubDisclosureToggle(e) {
    const el = e.currentTarget;
    if (!el.open) return;
    const parent = el.parentElement;
    if (!parent) return;
    parent
      .querySelectorAll(":scope > details.sub-disclosure[open]")
      .forEach((d) => {
        if (d !== el) d.open = false;
      });
  }
  _onDisclosureToggle(e) {
    const el = e.currentTarget;
    if (!el.open) return;
    const parent = el.parentElement;
    if (!parent) return;
    parent
      .querySelectorAll(":scope > details.disclosure[open]")
      .forEach((d) => {
        if (d !== el) d.open = false;
      });
  }
  _renderPositionGrid(field, gridDef, noBox, sideContent) {
    const valueMap = gridDef.valueMap || {};
    const reverseMap = Object.fromEntries(
      Object.entries(valueMap).map(([k, v]) => [v, k]),
    );
    const stored = this._formData[field] || "",
      value = reverseMap[stored] || stored,
      cells = gridDef.cells.flat();
    const disabledSet = new Set(gridDef.disabled || []),
      helper = HELPERS[field],
      labelText = LABELS[field] || field;
    const grid = html`<div
      class="grid-3x3"
      role="radiogroup"
      aria-label=${labelText}
    >
      ${cells.map((val) => {
        if (val === null) return html`<div class="grid-cell empty"></div>`;
        const isDisabled = disabledSet.has(val);
        return html`<button
          type="button"
          role="radio"
          class="grid-cell ${value === val ? "active" : ""} ${isDisabled
            ? "disabled"
            : ""}"
          ?disabled=${isDisabled}
          title=${isDisabled ? `${val} (not supported here)` : val}
          aria-label=${val}
          @click=${isDisabled
            ? null
            : () => this._setField(field, valueMap[val] || val)}
        ></button>`;
      })}
    </div>`;
    const inner = html`<div
        class="${noBox ? "settings-group-label" : "grid-picker-label"}"
      >
        ${labelText}
      </div>
      ${sideContent
        ? html`<div class="grid-with-side">
            ${grid}
            <div class="grid-side">${sideContent}</div>
          </div>`
        : grid}
      ${gridDef.extras
        ? html`<div class="grid-extras">
            ${gridDef.extras.map(
              (ex) =>
                html`<button
                  type="button"
                  class="grid-extra ${value === ex.value ? "active" : ""}"
                  aria-pressed=${value === ex.value ? "true" : "false"}
                  @click=${() => this._setField(field, ex.value)}
                >
                  ${ex.label}
                </button>`,
            )}
          </div>`
        : ""}
      ${helper ? html`<div class="grid-helper">${helper}</div>` : ""}`;
    return noBox ? inner : html`<div class="grid-picker">${inner}</div>`;
  }
  _setField(field, value) {
    const current = this._config || {};
    if (current[field] === value) {
      this._patch({}, { strip: [field] });
      return;
    }
    this._patch({ [field]: value });
  }
  _updateField(field, value) {
    const isEmpty = value === null || value === undefined || value === "";
    if (isEmpty) {
      this._patch({}, { strip: [field] });
      return;
    }
    this._patch({ [field]: value });
  }
  _onPanelToggle(id, expanded) {
    if (expanded) this._openPanel = id;
    else if (this._openPanel === id) this._openPanel = null;
  }
  _renderCardStyleSegmented() {
    return html`<div class="compact-fields">
      ${this._renderCompactField("card_height", "e.g. 220 or auto")}
      ${this._renderCompactField("card_padding", "e.g. 16px")}
    </div>`;
  }
  _parseOffset(raw) {
    if (!raw || typeof raw !== "string") return [0, 0, 0, 0];
    const parts = raw
      .trim()
      .split(/\s+/)
      .map((p) => parseInt(p, 10) || 0);
    switch (parts.length) {
      case 0:
        return [0, 0, 0, 0];
      case 1:
        return [parts[0], parts[0], parts[0], parts[0]];
      case 2:
        return [parts[0], parts[1], parts[0], parts[1]];
      case 3:
        return [parts[0], parts[1], parts[2], parts[1]];
      default:
        return [parts[0], parts[1], parts[2], parts[3]];
    }
  }
  _serializeOffset(arr) {
    if (arr.every((v) => v === 0)) return "";
    return arr.map((v) => `${v}px`).join(" ");
  }
  _setOffsetPart(index, rawValue) {
    const parts = this._parseOffset(this._formData.card_offset);
    parts[index] = parseInt(rawValue, 10) || 0;
    this._updateField("card_offset", this._serializeOffset(parts));
  }
  _renderImageOffsetInline() {
    const c = this._formData;
    if (!c.image_day && !c.image_night) return "";
    return html`<div class="grid-picker-label">Image Offset</div>
      <div class="img-offset-grid">
        <label
          ><span>X</span
          ><input
            type="text"
            inputmode="numeric"
            placeholder="0"
            .value=${String(c.image_x || "")}
            @change=${(e) =>
              this._updateField("image_x", e.target.value.trim())}
        /></label>
        <label
          ><span>Y</span
          ><input
            type="text"
            inputmode="numeric"
            placeholder="0"
            .value=${String(c.image_y || "")}
            @change=${(e) =>
              this._updateField("image_y", e.target.value.trim())}
        /></label>
      </div>`;
  }
  _renderOffsetPicker() {
    const parts = this._parseOffset(this._formData.card_offset),
      edges = ["Top", "Right", "Bottom", "Left"];
    return html`<div class="settings-group-label">${LABELS.card_offset}</div>
      <div class="composite-grid-4">
        ${edges.map(
          (label, i) =>
            html`<label>
              <span>${label}</span>
              <input
                type="number"
                step="1"
                .value=${String(parts[i])}
                @change=${(e) => this._setOffsetPart(i, e.target.value)}
            /></label>`,
        )}
      </div>
      ${HELPERS.card_offset
        ? html`<div class="composite-helper">${HELPERS.card_offset}</div>`
        : ""}`;
  }
  _renderCustomCardsEditor() {
    const cards = Array.isArray(this._config && this._config.custom_cards)
      ? this._config.custom_cards
      : [];
    return html`${cards.length === 0
        ? html`<div class="cards-empty">No cards yet.</div>`
        : cards.map((card, idx) =>
            this._renderCardRow(card, idx, cards.length),
          )}
      <button type="button" class="add-card-btn" @click=${this._addBlankCard}>
        <ha-icon icon="mdi:plus"></ha-icon>
        <span>Add card</span>
      </button>`;
  }
  _renderListRow({
    idx,
    total,
    expanded,
    title,
    badge,
    onToggle,
    onMoveUp,
    onMoveDown,
    onRemove,
    onDuplicate,
    body,
  }) {
    return html`<div class="card-row ${expanded ? "expanded" : ""}">
      <div class="card-row-head" @click=${onToggle}>
        <ha-icon class="chevron" icon="mdi:chevron-right"></ha-icon>
        ${badge ? badge : ""}
        <span class="card-row-title">${title}</span>
        <div class="card-row-actions" @click=${(e) => e.stopPropagation()}>
          <button
            type="button"
            title="Move up"
            ?disabled=${idx === 0}
            @click=${onMoveUp}
          >
            <ha-icon icon="mdi:arrow-up"></ha-icon>
          </button>
          <button
            type="button"
            title="Move down"
            ?disabled=${idx === total - 1}
            @click=${onMoveDown}
          >
            <ha-icon icon="mdi:arrow-down"></ha-icon>
          </button>
          ${onDuplicate
            ? html`<button
                type="button"
                title="Duplicate"
                @click=${onDuplicate}
              >
                <ha-icon icon="mdi:content-copy"></ha-icon>
              </button>`
            : ""}
          <button type="button" title="Delete" @click=${onRemove}>
            <ha-icon icon="mdi:delete-outline"></ha-icon>
          </button>
        </div>
      </div>
      ${expanded ? html`<div class="card-row-body">${body}</div>` : ""}
    </div>`;
  }
  _renderCardRow(card, idx, total) {
    const expanded = this._expandedCard === idx;
    const title =
      card && card.type ? String(card.type).replace(/^custom:/, "") : "card";
    const body = html`<div class="card-size-row">
        <div class="offset-field">
          <span class="offset-field-label">Custom Width</span>
          <input
            type="text"
            placeholder="e.g. 140px or 60%"
            .value=${card.custom_width || ""}
            @change=${(e) => {
              const v = e.target.value.trim();
              const nc = { ...card };
              if (v) nc.custom_width = v;
              else delete nc.custom_width;
              this._updateCardAt(idx, nc);
            }}
          />
        </div>
        <div class="offset-field">
          <span class="offset-field-label">Custom Height</span>
          <input
            type="text"
            placeholder="e.g. 110px"
            .value=${card.custom_height || ""}
            @change=${(e) => {
              const v = e.target.value.trim();
              const nc = { ...card };
              if (v) nc.custom_height = v;
              else delete nc.custom_height;
              this._updateCardAt(idx, nc);
            }}
          />
        </div>
      </div>
      <ha-form
        .hass=${this.hass}
        .data=${{ _card: card }}
        .schema=${[{ name: "_card", selector: { object: {} } }]}
        .computeLabel=${() => ""}
        @value-changed=${(e) => {
          e.stopPropagation();
          this._updateCardAt(
            idx,
            (e.detail && e.detail.value && e.detail.value._card) || {},
          );
        }}
      ></ha-form>`;
    return this._renderListRow({
      idx,
      total,
      expanded,
      title,
      body,
      onToggle: () => this._toggleCardExpanded(idx),
      onMoveUp: () => this._moveCard(idx, -1),
      onMoveDown: () => this._moveCard(idx, 1),
      onRemove: () => this._removeCard(idx),
    });
  }
  _toggleCardExpanded(idx) {
    this._expandedCard = this._expandedCard === idx ? null : idx;
  }
  _moveCard(idx, delta) {
    const cards = [...((this._config && this._config.custom_cards) || [])];
    const target = idx + delta;
    if (target < 0 || target >= cards.length) return;
    [cards[idx], cards[target]] = [cards[target], cards[idx]];
    if (this._expandedCard === idx) this._expandedCard = target;
    else if (this._expandedCard === target) this._expandedCard = idx;
    this._updateField("custom_cards", cards);
  }
  _removeCard(idx) {
    const cards = [...((this._config && this._config.custom_cards) || [])];
    cards.splice(idx, 1);
    if (this._expandedCard === idx) this._expandedCard = null;
    else if (
      typeof this._expandedCard === "number" &&
      this._expandedCard > idx
    ) {
      this._expandedCard = this._expandedCard - 1;
    }
    this._updateField("custom_cards", cards);
  }
  _updateCardAt(idx, newCard) {
    const cards = [...((this._config && this._config.custom_cards) || [])];
    cards[idx] = newCard;
    this._updateField("custom_cards", cards);
  }
  _addBlankCard = () => {
    const cards = [
      ...((this._config && this._config.custom_cards) || []),
      { type: "entity", entity: "", custom_width: "100%" },
    ];
    this._expandedCard = cards.length - 1;
    this._updateField("custom_cards", cards);
  };
  _buttonTitle(button) {
    const name = ((button && button.name) || "").toString().trim(),
      entity = ((button && button.entity) || "").toString().trim();
    const attribute = ((button && button.attribute) || "").toString().trim();
    if (!entity) return name ? `${name} — (no entity)` : "(choose an entity)";
    const st = this.hass && this.hass.states && this.hass.states[entity],
      friendly = st && st.attributes && st.attributes.friendly_name;
    const label = friendly || entity;
    if (button.forecast) {
      const type = button.forecast === "hourly" ? "Hourly" : "Daily",
        offset = parseInt(button.forecast_offset, 10) || 0;
      const offsetLabel =
        button.forecast === "hourly"
          ? offset === 0
            ? "now"
            : `+${offset}h`
          : offset === 0
            ? "today"
            : offset === 1
              ? "tomorrow"
              : `+${offset}d`;
      const attrLabel = attribute || "condition";
      const base = `${label} · ${type} ${offsetLabel} [${attrLabel}]`;
      return name ? `${name} — ${base}` : base;
    }
    const withAttr = attribute ? `${label} [${attribute}]` : label;
    return name ? `${name} — ${withAttr}` : withAttr;
  }
  _cleanButton(button) {
    const out = { ...button };
    if (!out.entity) {
      delete out.attribute;
      delete out.forecast;
      delete out.forecast_offset;
    }
    if (!out.forecast) {
      delete out.forecast_offset;
      delete out.forecast_precision;
    }
    if (out.forecast_offset === 0) delete out.forecast_offset;
    if (!out.sub_value_entity && !out.sub_value_attribute) {
      delete out.sub_value_format;
      delete out.sub_value_size;
      delete out.sub_value_weight;
      delete out.hide_sub_value;
    }
    if (out.type !== "ring" && out.type !== "bar") {
      delete out.gauge_entity;
      delete out.gauge_attribute;
    }
    if (out.type !== "ring") {
      delete out.ring_min;
      delete out.ring_max;
      delete out.ring_color;
      delete out.ring_width;
      delete out.ring_gap;
      delete out.ring_thresholds;
      delete out.ring_threshold_mode;
    }
    if (out.type !== "bar") {
      delete out.bar_min;
      delete out.bar_max;
      delete out.bar_color;
      delete out.bar_height;
      delete out.bar_thresholds;
      delete out.bar_threshold_mode;
    }
    if (out.type !== "sun-arc") {
      delete out.arc_body_size;
      delete out.arc_text_size;
      delete out.arc_stroke_width;
      delete out.arc_color_start;
      delete out.arc_color_end;
    }
    if (
      !Array.isArray(out.color_thresholds) ||
      out.color_thresholds.length === 0
    ) {
      delete out.color_thresholds;
      delete out.color_threshold_entity;
      delete out.color_threshold_attribute;
    }
    for (const k of Object.keys(out)) {
      const v = out[k];
      if (
        k === "unit_format" ||
        k === "name_format" ||
        k === "sub_value_format" ||
        k === "ring_min" ||
        k === "bar_min"
      ) {
        if (v === null || v === undefined) delete out[k];
        continue;
      }
      if (k === "background" && v === false) continue;
      if (k === "icon_background" && v === false) continue;
      if (v === "" || v === null || v === undefined || v === false)
        delete out[k];
    }
    return out;
  }
  _updateButtonAt(areaIdx, idx, newButton) {
    const list = this._getButtonsForArea(areaIdx).map((c, i) =>
      i === idx ? this._cleanButton(newButton) : c,
    );
    this._commitButtonsInArea(areaIdx, list);
  }
  _addButton = (areaIdx) => {
    const list = this._getButtonsForArea(areaIdx);
    const weatherEntity = (this._config && this._config.weather_entity) || "";
    const newButton = weatherEntity ? { entity: weatherEntity } : {};
    const next = [...list, newButton];
    this._expandedButton = next.length - 1;
    this._commitButtonsInArea(areaIdx, next);
  };
  _moveButton(areaIdx, idx, delta) {
    const list = [...this._getButtonsForArea(areaIdx)],
      target = idx + delta;
    if (target < 0 || target >= list.length) return;
    [list[idx], list[target]] = [list[target], list[idx]];
    if (this._expandedButton === idx) this._expandedButton = target;
    else if (this._expandedButton === target) this._expandedButton = idx;
    this._commitButtonsInArea(areaIdx, list);
  }
  _removeButton(areaIdx, idx) {
    const list = [...this._getButtonsForArea(areaIdx)];
    list.splice(idx, 1);
    delete this[`_acc_open_${areaIdx}_${idx}`];
    delete this[`_text_acc_${areaIdx}_${idx}`];
    for (let i = idx; i < list.length; i++) {
      this[`_acc_open_${areaIdx}_${i}`] =
        this[`_acc_open_${areaIdx}_${i + 1}`] || null;
      this[`_text_acc_${areaIdx}_${i}`] =
        this[`_text_acc_${areaIdx}_${i + 1}`] || null;
    }
    delete this[`_acc_open_${areaIdx}_${list.length}`];
    delete this[`_text_acc_${areaIdx}_${list.length}`];
    if (this._expandedButton === idx) this._expandedButton = null;
    else if (
      typeof this._expandedButton === "number" &&
      this._expandedButton > idx
    ) {
      this._expandedButton = this._expandedButton - 1;
    }
    this._commitButtonsInArea(areaIdx, list);
  }
  _duplicateButton(areaIdx, idx) {
    const list = [...this._getButtonsForArea(areaIdx)];
    list.splice(idx + 1, 0, { ...list[idx] });
    this._expandedButton = idx + 1;
    this._commitButtonsInArea(areaIdx, list);
  }
  _toggleButtonExpanded(idx) {
    this._expandedButton = this._expandedButton === idx ? null : idx;
    this.requestUpdate();
  }

  _buttonLabel = (schema) => {
    if (!schema || !schema.name) return "";
    if (schema.name in BUTTON_LABELS) return BUTTON_LABELS[schema.name];
    return schema.name;
  };
  _buttonHelper = (schema) => {
    if (!schema || !schema.name) return undefined;
    return BUTTON_HELPERS[schema.name] || undefined;
  };
  _renderButtonRow(button, idx, total, areaIdx) {
    const expanded = this._expandedButton === idx;
    const isFree =
      (button.position || "").toString().toLowerCase() === "custom";
    const isFc = !!button.forecast;
    const buttonType = button.type || "";
    const posBadge = isFree
      ? html`<span class="button-badge-free"
          ><ha-icon icon="mdi:cursor-move"></ha-icon
        ></span>`
      : html`<span class="button-badge-row"
          ><ha-icon icon="mdi:view-grid-outline"></ha-icon
        ></span>`;
    if (!expanded) {
      return this._renderListRow({
        idx,
        total,
        expanded,
        body: "",
        badge: posBadge,
        title: this._buttonTitle(button),
        onToggle: () => this._toggleButtonExpanded(idx),
        onMoveUp: () => this._moveButton(areaIdx, idx, -1),
        onMoveDown: () => this._moveButton(areaIdx, idx, 1),
        onDuplicate: () => this._duplicateButton(areaIdx, idx),
        onRemove: () => this._removeButton(areaIdx, idx),
      });
    }
    /* Helpers */
    const entityId = (button.entity || "").toString().trim();
    const hasEntity = !!entityId;
    const nameSensorId = (button.name_sensor || "").toString().trim();
    const fcEntityMissing =
      isFc && entityId && !entityId.startsWith("weather.");
    const cardWeatherEntity =
      (this._config && this._config.weather_entity) || "";
    const update = (next) => this._updateButtonAt(areaIdx, idx, next);
    const buttonForm = (schema) =>
      html`<ha-form
        .hass=${this.hass}
        .data=${button}
        .schema=${schema}
        .computeLabel=${this._buttonLabel}
        .computeHelper=${this._buttonHelper}
        @value-changed=${(e) => {
          e.stopPropagation();
          update((e.detail && e.detail.value) || {});
        }}
      ></ha-form>`;
    const cssField = (key, label, placeholder) =>
      html`<div class="css-field">
        <span class="css-field-label">${label}</span>
        <input
          type="text"
          placeholder=${placeholder}
          .value=${button[key] !== undefined ? String(button[key]) : ""}
          @change=${(e) => {
            const v = e.target.value;
            const next = { ...button };
            if (
              key === "unit_format" ||
              key === "sub_value_format" ||
              key === "name_format"
            ) {
              next[key] = v;
            } else if (v.trim()) next[key] = v.trim();
            else delete next[key];
            update(next);
          }}
        />
      </div>`;
    /* State — resolve with area fallback */
    const area = this._getAreas()[areaIdx] || {};
    const _r = (buttonKey, areaKey) =>
      button[buttonKey] !== undefined
        ? button[buttonKey]
        : area[areaKey] !== undefined
          ? area[areaKey]
          : undefined;
    const fmt = (_r("style", "button_style") || "inline")
      .toString()
      .toLowerCase();
    const showIcon = button.hide_icon !== true;
    const showLabel = button.hide_label !== true;
    const showValue = button.hide_value !== true;
    const hasSubValue = !!(
      button.sub_value_entity || button.sub_value_attribute
    );
    const showSub = hasSubValue && button.hide_sub_value !== true;
    const subEntityId = (button.sub_value_entity || "").toString().trim();
    const isWeatherIcon =
      (button.icon || "").toString().trim().toLowerCase() === "weather";
    const fcAttr = button.attribute || "condition";
    const fcOff = parseInt(button.forecast_offset, 10) || 0;
    /* Entity state for fancy_unit check */
    const st = this.hass && this.hass.states && this.hass.states[entityId];
    const stAttr = st && st.attributes;
    const isBarType = buttonType === "bar";
    const elOrder = button.element_order
      ? button.element_order
          .toString()
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean)
      : [];
    const BASE_ELS = ["icon", "text"];
    const getOrderedEls = () => {
      const pool = [...BASE_ELS, "bar"];
      if (!elOrder.length) return pool;
      const o = elOrder.filter((e) => pool.includes(e));
      pool.forEach((e) => {
        if (!o.includes(e)) o.push(e);
      });
      return o;
    };
    const elements = getOrderedEls();
    const isElHidden = (el) => {
      if (el === "icon") return !showIcon;
      if (el === "text") return !showLabel && !showValue;
      return false;
    };
    const moveEl = (el, dir) => {
      const cur = [...elements];
      const i = cur.indexOf(el);
      if (i < 0) return;
      const ni = i + dir;
      if (ni < 0 || ni >= cur.length) return;
      [cur[i], cur[ni]] = [cur[ni], cur[i]];
      const defaultEls = [...BASE_ELS, "bar"];
      const isDefault = cur.every((e, j) => e === defaultEls[j]);
      const n = { ...button };
      if (isDefault) delete n.element_order;
      else n.element_order = cur.join(",");
      update(n);
    };
    /* Format picker */
    const formatPicker = html`<div class="vcb-format-row">
      ${[
        { v: "inline", l: "Inline" },
        { v: "stacked", l: "Stacked" },
        { v: "vertical", l: "Vertical" },
      ].map((o) => {
        const areaFmt = (area.button_style || "inline")
          .toString()
          .toLowerCase();
        const effectiveFmt = button.style || areaFmt;
        const a = effectiveFmt === o.v;
        const isAreaDefault = o.v === areaFmt;
        const hasOverride = button.style !== undefined;
        return html`<button
          type="button"
          class="vcb-format-card ${a ? "active" : ""}"
          @click=${() => {
            const n = { ...button };
            if (a && hasOverride) delete n.style;
            else if (isAreaDefault) delete n.style;
            else n.style = o.v;
            update(n);
          }}
        >
          <div class="vcb-fmt ${o.v}">
            ${o.v === "stacked"
              ? html`<div class="vcb-fmt-sq"></div>
                  <div class="vcb-fmt-col">
                    <div class="vcb-fmt-bar sm"></div>
                    <div class="vcb-fmt-bar lg"></div>
                  </div>`
              : o.v === "vertical"
                ? html`<div class="vcb-fmt-sq"></div>
                    <div class="vcb-fmt-bar sm"></div>
                    <div class="vcb-fmt-bar lg"></div>`
                : html`<div class="vcb-fmt-sq"></div>
                    <div class="vcb-fmt-bar sm"></div>
                    <div class="vcb-fmt-bar lg"></div>`}
          </div>
          <span class="vcb-format-name">${o.l}</span>
        </button>`;
      })}
    </div>`;
    /* Button element sections (accordions) */
    const elIdx = (name) => elements.indexOf(name);
    const reorderBtns = (name) => {
      const i = elIdx(name);
      if (i < 0) return "";
      return html`<span
        class="vcb-reorder"
        @click=${(e) => e.stopPropagation()}
      >
        <button
          type="button"
          ?disabled=${i === 0}
          @click=${() => moveEl(name, -1)}
          title="Move up"
        >
          <ha-icon icon="mdi:chevron-up"></ha-icon>
        </button>
        <button
          type="button"
          ?disabled=${i === elements.length - 1}
          @click=${() => moveEl(name, 1)}
          title="Move down"
        >
          <ha-icon icon="mdi:chevron-down"></ha-icon></button
      ></span>`;
    };
    const iconContent = html`<div class="toggle-group">
        <label class="toggle-row"
          ><span>Hide</span>
          <ha-switch
            .checked=${!showIcon}
            @change=${(e) => {
              const n = { ...button };
              if (e.target.checked) n.hide_icon = true;
              else delete n.hide_icon;
              update(n);
            }}
          ></ha-switch
        ></label>
      </div>
      ${showIcon
        ? html`${isWeatherIcon
              ? html`<div class="weather-icon-active">
                  <ha-icon
                    icon="mdi:weather-partly-cloudy"
                    style="--mdc-icon-size:20px;color:var(--primary-color)"
                  ></ha-icon>
                  <div class="weather-icon-active-text">
                    <span>Weather icon</span
                    ><span class="weather-icon-active-sub"
                      >${isFc ? "Matches forecast" : "Matches weather"}</span
                    >
                  </div>
                  <button
                    type="button"
                    class="icon-weather-btn"
                    @click=${() => {
                      const n = { ...button };
                      delete n.icon;
                      update(n);
                    }}
                  >
                    Remove
                  </button>
                </div>`
              : html`<div class="icon-combo">
                  <ha-form
                    style="flex:1;min-width:0"
                    .hass=${this.hass}
                    .data=${{ icon: button.icon || "" }}
                    .schema=${[{ name: "icon", selector: { icon: {} } }]}
                    .computeLabel=${() => ""}
                    @value-changed=${(e) => {
                      e.stopPropagation();
                      update({
                        ...button,
                        icon:
                          (e.detail && e.detail.value && e.detail.value.icon) ||
                          "",
                      });
                    }}
                  ></ha-form>
                  <button
                    type="button"
                    class="icon-weather-btn"
                    title="Weather icon"
                    @click=${() => update({ ...button, icon: "weather" })}
                  >
                    <ha-icon
                      icon="mdi:weather-partly-cloudy"
                      style="--mdc-icon-size:18px"
                    ></ha-icon>
                  </button>
                </div>`}
            <div class="clearable-field">
              ${buttonForm([{ name: "icon_path", selector: { text: {} } }])}
              ${button.icon_path
                ? html`<button
                    type="button"
                    class="clear-btn"
                    title="Clear"
                    @click=${() => {
                      const n = { ...button };
                      delete n.icon_path;
                      update(n);
                    }}
                  >
                    <ha-icon icon="mdi:close"></ha-icon>
                  </button>`
                : ""}
            </div>
            <div class="vcb-grid">
              ${cssField("icon_size", "Size", "auto")}${cssField(
                "icon_padding",
                "Padding",
                "auto",
              )}
            </div>
            <div class="toggle-group">
              <label class="toggle-row"
                ><span>Background</span>
                <ha-switch
                  .checked=${button.icon_background === true}
                  @change=${(e) => {
                    const n = { ...button };
                    if (e.target.checked) n.icon_background = true;
                    else {
                      if (button.icon_background !== undefined)
                        n.icon_background = false;
                      else delete n.icon_background;
                    }
                    update(n);
                  }}
                ></ha-switch
              ></label>
            </div>
            ${button.icon_background === true
              ? this._renderColorPicker(
                  "Color",
                  button.icon_background_color || "",
                  (h, o) => {
                    const next = { ...button };
                    if (!h) delete next.icon_background_color;
                    else
                      next.icon_background_color = this._serializeColor(h, o);
                    update(next);
                  },
                )
              : ""}`
        : ""}`;
    const labelContent = html`<div class="toggle-group">
        <label class="toggle-row"
          ><span>Hide</span>
          <ha-switch
            .checked=${!showLabel}
            @change=${(e) => {
              const n = { ...button };
              if (e.target.checked) n.hide_label = true;
              else delete n.hide_label;
              update(n);
            }}
          ></ha-switch
        ></label>
      </div>
      ${showLabel
        ? html`${buttonForm([{ name: "name", selector: { text: {} } }])}
            ${buttonForm([{ name: "name_sensor", selector: { entity: {} } }])}
            ${nameSensorId
              ? buttonForm([
                  {
                    name: "name_attribute",
                    selector: { attribute: { entity_id: nameSensorId } },
                  },
                ])
              : isFc && !button.name
                ? html`<ha-form
                    .hass=${this.hass}
                    .data=${{ name_attribute: button.name_attribute || "" }}
                    .schema=${[
                      {
                        name: "name_attribute",
                        selector: {
                          select: { mode: "dropdown", options: FC_ATTRIBUTES },
                        },
                      },
                    ]}
                    .computeLabel=${() => "Forecast attribute"}
                    @value-changed=${(e) => {
                      e.stopPropagation();
                      const v =
                        e.detail &&
                        e.detail.value &&
                        e.detail.value.name_attribute;
                      const n = { ...button };
                      if (v) n.name_attribute = v;
                      else delete n.name_attribute;
                      update(n);
                    }}
                  ></ha-form>`
                : ""}
            ${nameSensorId
              ? buttonForm([{ name: "name_format", selector: { text: {} } }])
              : cssField("name_format", "Custom unit", "")}
            ${cssField("label_size", "Size", "auto")}
            <div class="segmented segmented-compact" role="radiogroup">
              ${[
                { v: "", l: "Normal" },
                { v: "500", l: "Light" },
                { v: "600", l: "Medium" },
                { v: "700", l: "Bold" },
              ].map(
                (o) =>
                  html`<button
                    type="button"
                    role="radio"
                    class=${(button.label_weight || "") === o.v ? "active" : ""}
                    @click=${() => {
                      const n = { ...button };
                      if (o.v) n.label_weight = o.v;
                      else delete n.label_weight;
                      update(n);
                    }}
                  >
                    ${o.l}
                  </button>`,
              )}
            </div>
            ${buttonForm([
              {
                name: "label_overflow",
                selector: {
                  select: { mode: "dropdown", options: OPT.button_overflow },
                },
              },
            ])}`
        : ""}`;
    const entitySection = isFc
      ? buttonForm([
          { name: "entity", selector: { entity: { domain: "weather" } } },
        ])
      : buttonForm([
          { name: "entity", selector: { entity: {} } },
          ...(entityId
            ? [
                {
                  name: "attribute",
                  selector: { attribute: { entity_id: entityId } },
                },
              ]
            : []),
        ]);
    const emptyNudge = !hasEntity
      ? html`<div class="button-nudge info">
          <ha-icon
            icon="mdi:information-outline"
            style="--mdc-icon-size:14px;flex-shrink:0"
          ></ha-icon>
          Pick an entity.
        </div>`
      : "";
    const fcWarning = fcEntityMissing
      ? html`<div class="button-nudge warning">
          <ha-icon
            icon="mdi:alert-circle-outline"
            style="--mdc-icon-size:14px;flex-shrink:0"
          ></ha-icon>
          Forecast needs a weather entity.
        </div>`
      : "";
    const valueContent = html`<div class="toggle-group">
        <label class="toggle-row"
          ><span>Hide</span>
          <ha-switch
            .checked=${!showValue}
            @change=${(e) => {
              const n = { ...button };
              if (e.target.checked) n.hide_value = true;
              else delete n.hide_value;
              update(n);
            }}
          ></ha-switch
        ></label>
        ${showValue || isFc
          ? html`<label class="toggle-row"
              ><span>Fancy unit</span>
              <ha-switch
                .checked=${button.fancy_unit === true}
                @change=${(e) => {
                  const n = { ...button };
                  if (e.target.checked) n.fancy_unit = true;
                  else delete n.fancy_unit;
                  update(n);
                }}
              ></ha-switch
            ></label>`
          : ""}
      </div>
      ${showValue
        ? html`${buttonForm([{ name: "unit_format", selector: { text: {} } }])}
            ${cssField("text_size", "Size", "auto")}
            <div class="segmented segmented-compact" role="radiogroup">
              ${[
                { v: "", l: "Normal" },
                { v: "500", l: "Light" },
                { v: "600", l: "Medium" },
                { v: "700", l: "Bold" },
              ].map(
                (o) =>
                  html`<button
                    type="button"
                    role="radio"
                    class=${(button.value_weight || "") === o.v ? "active" : ""}
                    @click=${() => {
                      const n = { ...button };
                      if (o.v) n.value_weight = o.v;
                      else delete n.value_weight;
                      update(n);
                    }}
                  >
                    ${o.l}
                  </button>`,
              )}
            </div>
            ${buttonForm([
              {
                name: "overflow",
                selector: {
                  select: { mode: "dropdown", options: OPT.button_overflow },
                },
              },
            ])}`
        : ""}`;
    const subContent = html`<div class="toggle-group">
        <label class="toggle-row"
          ><span>Hide</span>
          <ha-switch
            .checked=${button.hide_sub_value === true}
            @change=${(e) => {
              const n = { ...button };
              if (e.target.checked) n.hide_sub_value = true;
              else delete n.hide_sub_value;
              update(n);
            }}
          ></ha-switch
        ></label>
      </div>
      ${button.hide_sub_value !== true
        ? html`${buttonForm([
            { name: "sub_value_entity", selector: { entity: {} } },
          ])}
          ${subEntityId
            ? buttonForm([
                {
                  name: "sub_value_attribute",
                  selector: { attribute: { entity_id: subEntityId } },
                },
              ])
            : isFc
              ? html`<ha-form
                  .hass=${this.hass}
                  .data=${{
                    sub_value_attribute: button.sub_value_attribute || "",
                  }}
                  .schema=${[
                    {
                      name: "sub_value_attribute",
                      selector: {
                        select: { mode: "dropdown", options: FC_ATTRIBUTES },
                      },
                    },
                  ]}
                  .computeLabel=${() => "Forecast attribute"}
                  @value-changed=${(e) => {
                    e.stopPropagation();
                    const v =
                      e.detail &&
                      e.detail.value &&
                      e.detail.value.sub_value_attribute;
                    const n = { ...button };
                    if (v) n.sub_value_attribute = v;
                    else delete n.sub_value_attribute;
                    update(n);
                  }}
                ></ha-form>`
              : ""}
          ${hasSubValue
            ? html`<div class="vcb-grid">
                  ${cssField("sub_value_format", "Unit", "")}${cssField(
                    "sub_value_size",
                    "Size",
                    "auto",
                  )}
                </div>
                <div class="segmented segmented-compact" role="radiogroup">
                  ${[
                    { v: "", l: "Normal" },
                    { v: "500", l: "Light" },
                    { v: "600", l: "Medium" },
                    { v: "700", l: "Bold" },
                  ].map(
                    (o) =>
                      html`<button
                        type="button"
                        role="radio"
                        class=${(button.sub_value_weight || "") === o.v
                          ? "active"
                          : ""}
                        @click=${() => {
                          const n = { ...button };
                          if (o.v) n.sub_value_weight = o.v;
                          else delete n.sub_value_weight;
                          update(n);
                        }}
                      >
                        ${o.l}
                      </button>`,
                  )}
                </div>
                ${buttonForm([
                  {
                    name: "sub_value_overflow",
                    selector: {
                      select: {
                        mode: "dropdown",
                        options: OPT.button_overflow,
                      },
                    },
                  },
                ])}`
            : ""}`
        : ""}`;
    /* Accordion section helpers */
    const sk = `_vcbs_${areaIdx}_${idx}`;
    const nk = `_vcbn_${areaIdx}_${idx}`;
    const secOpen = this[sk] || null;
    const nestedOpen = this[nk] || null;
    /* Text order (label / value / sub within button-content) */
    const txtOrder = button.text_order
      ? button.text_order
          .toString()
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean)
      : [];
    const BASE_TXTS = ["label", "value", "sub"];
    const getOrderedTxts = () => {
      if (!txtOrder.length) return [...BASE_TXTS];
      const o = txtOrder.filter((e) => BASE_TXTS.includes(e));
      BASE_TXTS.forEach((e) => {
        if (!o.includes(e)) o.push(e);
      });
      return o;
    };
    const textElements = getOrderedTxts();
    const isTxtHidden = (el) => {
      if (el === "label") return !showLabel;
      if (el === "value") return !showValue;
      if (el === "sub") return button.hide_sub_value === true || !hasSubValue;
      return false;
    };
    const moveTxt = (el, dir) => {
      const cur = [...textElements];
      const i = cur.indexOf(el);
      if (i < 0) return;
      const ni = i + dir;
      if (ni < 0 || ni >= cur.length) return;
      [cur[i], cur[ni]] = [cur[ni], cur[i]];
      const isDefault = cur.every((e, j) => e === BASE_TXTS[j]);
      const n = { ...button };
      if (isDefault) delete n.text_order;
      else n.text_order = cur.join(",");
      update(n);
    };
    const txtElIdx = (name) => textElements.indexOf(name);
    const txtReorderBtns = (name) => {
      const i = txtElIdx(name);
      if (i < 0) return "";
      return html`<span
        class="vcb-reorder"
        @click=${(e) => e.stopPropagation()}
      >
        <button
          type="button"
          ?disabled=${i === 0}
          @click=${() => moveTxt(name, -1)}
          title="Move up"
        >
          <ha-icon icon="mdi:chevron-up"></ha-icon>
        </button>
        <button
          type="button"
          ?disabled=${i === textElements.length - 1}
          @click=${() => moveTxt(name, 1)}
          title="Move down"
        >
          <ha-icon icon="mdi:chevron-down"></ha-icon></button
      ></span>`;
    };
    const nestedElSection = (key, icon, title, content, hidden) => {
      const isOpen = nestedOpen === key;
      return html`<div class="vcb-section ${hidden ? "dimmed" : ""}">
        <div
          class="vcb-section-head ${isOpen ? "open" : ""}"
          @click=${() => {
            this[nk] = isOpen ? null : key;
            this.requestUpdate();
          }}
        >
          <ha-icon class="chevron" icon="mdi:chevron-right"></ha-icon>
          <ha-icon icon=${icon}></ha-icon>
          <span class="vcb-section-title">${title}</span>
          ${txtReorderBtns(key)}
        </div>
        ${isOpen ? html`<div class="vcb-section-body">${content}</div>` : ""}
      </div>`;
    };
    const nestedSection = (key, icon, title, content) => {
      const isOpen = nestedOpen === key;
      return html`<div class="vcb-section">
        <div
          class="vcb-section-head ${isOpen ? "open" : ""}"
          @click=${() => {
            this[nk] = isOpen ? null : key;
            this.requestUpdate();
          }}
        >
          <ha-icon class="chevron" icon="mdi:chevron-right"></ha-icon>
          <ha-icon icon=${icon}></ha-icon>
          <span class="vcb-section-title">${title}</span>
        </div>
        ${isOpen ? html`<div class="vcb-section-body">${content}</div>` : ""}
      </div>`;
    };
    const section = (key, icon, title, content, hidden) => {
      const isOpen = secOpen === key;
      return html`<div class="vcb-section ${hidden ? "dimmed" : ""}">
        <div
          class="vcb-section-head ${isOpen ? "open" : ""}"
          @click=${() => {
            this[sk] = isOpen ? null : key;
            this.requestUpdate();
          }}
        >
          <ha-icon class="chevron" icon="mdi:chevron-right"></ha-icon>
          <ha-icon icon=${icon}></ha-icon>
          <span class="vcb-section-title">${title}</span>
        </div>
        ${isOpen ? html`<div class="vcb-section-body">${content}</div>` : ""}
      </div>`;
    };
    /* Element sections with reorder arrows */
    const elSection = (key, icon, title, content, hidden) => {
      const isOpen = secOpen === key;
      return html`<div class="vcb-section ${hidden ? "dimmed" : ""}">
        <div
          class="vcb-section-head ${isOpen ? "open" : ""}"
          @click=${() => {
            this[sk] = isOpen ? null : key;
            this.requestUpdate();
          }}
        >
          <ha-icon class="chevron" icon="mdi:chevron-right"></ha-icon>
          <ha-icon icon=${icon}></ha-icon>
          <span class="vcb-section-title">${title}</span>
          ${reorderBtns(key)}
        </div>
        ${isOpen ? html`<div class="vcb-section-body">${content}</div>` : ""}
      </div>`;
    };
    /* Button source / type picker */
    const typePicker = html`<div class="button-type-picker">
      <button
        type="button"
        class="button-type-btn ${!isFc ? "active" : ""}"
        @click=${() => {
          const n = { ...button };
          delete n.forecast;
          delete n.forecast_offset;
          delete n.forecast_precision;
          update(n);
        }}
      >
        <ha-icon
          class="button-type-icon ${!isFc ? "active-icon" : ""}"
          icon="mdi:gauge"
        ></ha-icon>
        <div class="button-type-text">
          <span class="button-type-name">Sensor</span
          ><span class="button-type-desc">Live entity</span>
        </div>
      </button>
      <button
        type="button"
        class="button-type-btn ${isFc ? "active" : ""}"
        @click=${() => {
          const cur = entityId;
          const ent =
            cur && cur.startsWith("weather.") ? cur : cardWeatherEntity || cur;
          const n = {
            ...button,
            forecast: "daily",
            attribute: "temperature",
            forecast_offset: 0,
            icon: "weather",
          };
          if (ent) n.entity = ent;
          update(n);
        }}
      >
        <ha-icon
          class="button-type-icon ${isFc ? "active-icon" : ""}"
          icon="mdi:calendar-clock"
        ></ha-icon>
        <div class="button-type-text">
          <span class="button-type-name">Forecast</span
          ><span class="button-type-desc">Weather</span>
        </div>
      </button>
    </div>`;
    const forecastContent =
      isFc && !fcEntityMissing
        ? html`<div class="segmented" role="radiogroup">
              ${[
                { v: "daily", l: "Daily" },
                { v: "hourly", l: "Hourly" },
              ].map(
                (o) =>
                  html`<button
                    type="button"
                    role="radio"
                    class=${button.forecast === o.v ? "active" : ""}
                    @click=${() =>
                      update({ ...button, forecast: o.v, forecast_offset: 0 })}
                  >
                    ${o.l}
                  </button>`,
              )}
            </div>
            ${(() => {
              const mx = button.forecast === "hourly" ? 23 : 6,
                lb =
                  button.forecast === "hourly" ? "Hours ahead" : "Days ahead",
                hp =
                  button.forecast === "hourly"
                    ? fcOff === 0
                      ? "Now"
                      : `+${fcOff}h`
                    : fcOff === 0
                      ? "Today"
                      : fcOff === 1
                        ? "Tomorrow"
                        : `+${fcOff} days`,
                pc = Math.round((fcOff / mx) * 100);
              return html`<div class="awc-slider">
                <div class="awc-slider-head">
                  <span class="awc-slider-label">${lb}</span>
                  <input
                    type="number"
                    class="awc-slider-num"
                    min="0"
                    max=${mx}
                    step="1"
                    .value=${String(fcOff)}
                    @change=${(e) => {
                      const v = Math.min(
                        mx,
                        Math.max(0, parseInt(e.target.value, 10) || 0),
                      );
                      const r = e.target
                        .closest(".awc-slider")
                        .querySelector(".awc-slider-range");
                      if (r) {
                        r.value = v;
                        r.style.setProperty(
                          "--awc-slider-pct",
                          Math.round((v / mx) * 100) + "%",
                        );
                      }
                      update({ ...button, forecast_offset: v });
                    }}
                  />
                </div>
                <input
                  type="range"
                  class="awc-slider-range"
                  min="0"
                  max=${mx}
                  step="1"
                  .value=${String(fcOff)}
                  style="--awc-slider-pct:${pc}%"
                  @input=${(e) => {
                    const v = parseInt(e.target.value, 10);
                    e.target.style.setProperty(
                      "--awc-slider-pct",
                      Math.round((v / mx) * 100) + "%",
                    );
                    const n = e.target
                      .closest(".awc-slider")
                      .querySelector(".awc-slider-num");
                    if (n) n.value = v;
                  }}
                  @change=${(e) =>
                    update({
                      ...button,
                      forecast_offset: parseInt(e.target.value, 10),
                    })}
                />
                <div class="awc-slider-helper">${hp}</div>
              </div>`;
            })()}
            <ha-form
              .hass=${this.hass}
              .data=${{ attribute: fcAttr }}
              .schema=${[
                {
                  name: "attribute",
                  selector: {
                    select: { mode: "dropdown", options: FC_ATTRIBUTES },
                  },
                },
              ]}
              .computeLabel=${() => "Show"}
              @value-changed=${(e) => {
                e.stopPropagation();
                const v =
                  e.detail && e.detail.value && e.detail.value.attribute;
                if (v !== undefined) update({ ...button, attribute: v });
              }}
            ></ha-form>
            ${fcAttr !== "condition" && showValue
              ? html`${(() => {
                  const prec =
                      button.forecast_precision !== undefined
                        ? button.forecast_precision
                        : 0,
                    pc = Math.round((prec / 2) * 100);
                  return html`<div class="awc-slider">
                    <div class="awc-slider-head">
                      <span class="awc-slider-label">Decimals</span>
                      <input
                        type="number"
                        class="awc-slider-num"
                        min="0"
                        max="2"
                        step="1"
                        .value=${String(prec)}
                        @change=${(e) => {
                          const v = Math.min(
                            2,
                            Math.max(0, parseInt(e.target.value, 10) || 0),
                          );
                          const r = e.target
                            .closest(".awc-slider")
                            .querySelector(".awc-slider-range");
                          if (r) {
                            r.value = v;
                            r.style.setProperty(
                              "--awc-slider-pct",
                              Math.round((v / 2) * 100) + "%",
                            );
                          }
                          update({ ...button, forecast_precision: v });
                        }}
                      />
                    </div>
                    <input
                      type="range"
                      class="awc-slider-range"
                      min="0"
                      max="2"
                      step="1"
                      .value=${String(prec)}
                      style="--awc-slider-pct:${pc}%"
                      @input=${(e) => {
                        const v = parseInt(e.target.value, 10);
                        e.target.style.setProperty(
                          "--awc-slider-pct",
                          Math.round((v / 2) * 100) + "%",
                        );
                        const n = e.target
                          .closest(".awc-slider")
                          .querySelector(".awc-slider-num");
                        if (n) n.value = v;
                      }}
                      @change=${(e) =>
                        update({
                          ...button,
                          forecast_precision: parseInt(e.target.value, 10),
                        })}
                    />
                  </div>`;
                })()}`
              : ""}`
        : null;
    /* Scrolling */
    const isValueMarquee = (button.overflow || "").toLowerCase() === "marquee";
    const isLabelMarquee =
      (button.label_overflow || "").toLowerCase() === "marquee";
    const isSubMarquee =
      (button.sub_value_overflow || "").toLowerCase() === "marquee";
    const marqueeContent =
      isValueMarquee || isLabelMarquee || isSubMarquee
        ? html`<div class="toggle-group">
              <label class="toggle-row"
                ><span>Right-to-left</span>
                <ha-switch
                  .checked=${button.marquee_rtl === true}
                  @change=${(e) => {
                    const n = { ...button };
                    if (e.target.checked) n.marquee_rtl = true;
                    else delete n.marquee_rtl;
                    update(n);
                  }}
                ></ha-switch
              ></label>
            </div>
            ${(() => {
              const spd = parseFloat(button.marquee_speed) || 30,
                pc = Math.round(((spd - 5) / 95) * 100);
              return html`<div class="awc-slider">
                <div class="awc-slider-head">
                  <span class="awc-slider-label">Speed</span>
                  <input
                    type="number"
                    class="awc-slider-num"
                    min="5"
                    max="100"
                    step="5"
                    .value=${String(spd)}
                    @change=${(e) => {
                      const v = Math.min(
                        100,
                        Math.max(5, parseInt(e.target.value, 10) || 30),
                      );
                      const r = e.target
                        .closest(".awc-slider")
                        .querySelector(".awc-slider-range");
                      if (r) {
                        r.value = v;
                        r.style.setProperty(
                          "--awc-slider-pct",
                          Math.round(((v - 5) / 95) * 100) + "%",
                        );
                      }
                      update({ ...button, marquee_speed: v });
                    }}
                  />
                </div>
                <input
                  type="range"
                  class="awc-slider-range"
                  min="5"
                  max="100"
                  step="5"
                  .value=${String(spd)}
                  style="--awc-slider-pct:${pc}%"
                  @input=${(e) => {
                    const v = parseInt(e.target.value, 10);
                    e.target.style.setProperty(
                      "--awc-slider-pct",
                      Math.round(((v - 5) / 95) * 100) + "%",
                    );
                    const n = e.target
                      .closest(".awc-slider")
                      .querySelector(".awc-slider-num");
                    if (n) n.value = v;
                  }}
                  @change=${(e) =>
                    update({
                      ...button,
                      marquee_speed: parseInt(e.target.value, 10),
                    })}
                />
              </div>`;
            })()}`
        : null;
    /* Appearance */
    const appearContent = html`${formatPicker}
      <div class="toggle-group">
        <label class="toggle-row"
          ><span>Round shape</span
          ><ha-switch
            .checked=${button.button_round === true}
            @change=${(e) => {
              const n = { ...button };
              if (e.target.checked) n.button_round = true;
              else delete n.button_round;
              update(n);
            }}
          ></ha-switch
        ></label>
        <label class="toggle-row"
          ><span>Background</span
          ><ha-switch
            .checked=${button.background !== false}
            @change=${(e) => {
              const n = { ...button };
              if (!e.target.checked) n.background = false;
              else delete n.background;
              update(n);
            }}
          ></ha-switch
        ></label>
      </div>
      ${button.background !== false
        ? this._renderColorPicker(
            "Background color",
            button.background_color || "",
            (h, o) => {
              const next = { ...button };
              if (!h) delete next.background_color;
              else next.background_color = this._serializeColor(h, o);
              update(next);
            },
          )
        : ""}
      <div class="segmented" role="radiogroup">
        ${[
          { v: "start", l: "Left" },
          { v: "center", l: "Center" },
          { v: "end", l: "Right" },
          { v: "spread", l: "Spread" },
        ].map(
          (o) =>
            html`<button
              type="button"
              role="radio"
              class=${button.align === o.v ? "active" : ""}
              @click=${() => {
                const n = { ...button };
                if (button.align === o.v) delete n.align;
                else n.align = o.v;
                update(n);
              }}
            >
              ${o.l}
            </button>`,
        )}
      </div>
      <div class="vcb-grid">
        ${cssField("width", "Width", "auto")}${cssField(
          "height",
          "Height",
          "auto",
        )}
      </div>
      ${cssField("padding", "Padding", "auto")}
      <div class="vcb-grid">
        ${cssField("inner_gap", "Button gap", "6px")}${cssField(
          "text_gap",
          "Text gap",
          fmt === "inline" ? "0.35em" : "4px",
        )}
      </div>
      <div class="toggle-group">
        <label class="toggle-row"
          ><span>Text shadow</span>
          <ha-switch
            .checked=${button.text_shadow === true}
            @change=${(e) => {
              const n = { ...button };
              if (e.target.checked) n.text_shadow = true;
              else delete n.text_shadow;
              update(n);
            }}
          ></ha-switch
        ></label>
      </div>
      <div class="toggle-group">
        <label class="toggle-row"
          ><span>Color thresholds</span>
          <ha-switch
            .checked=${Array.isArray(button.color_thresholds) &&
            button.color_thresholds.length > 0}
            @change=${(e) => {
              const n = { ...button };
              if (e.target.checked)
                n.color_thresholds = [{ value: "", color: "#ff9800" }];
              else {
                delete n.color_thresholds;
                delete n.color_threshold_entity;
                delete n.color_threshold_attribute;
              }
              update(n);
            }}
          ></ha-switch
        ></label>
      </div>
      ${Array.isArray(button.color_thresholds) &&
      button.color_thresholds.length > 0
        ? html`<div class="field-group">
            <details class="disclosure" @toggle=${this._onDisclosureToggle}>
              <summary>
                <ha-icon class="chevron" icon="mdi:chevron-right"></ha-icon
                ><ha-icon icon="mdi:cog-outline"></ha-icon
                ><span>Threshold entity</span>
              </summary>
              <div class="disclosure-body">
                <ha-form
                  .hass=${this.hass}
                  .data=${{
                    color_threshold_entity: button.color_threshold_entity || "",
                  }}
                  .schema=${[
                    {
                      name: "color_threshold_entity",
                      selector: { entity: {} },
                    },
                  ]}
                  .computeLabel=${() => "Entity"}
                  @value-changed=${(e) => {
                    e.stopPropagation();
                    const v =
                      e.detail &&
                      e.detail.value &&
                      e.detail.value.color_threshold_entity;
                    const n = { ...button };
                    if (v) n.color_threshold_entity = v;
                    else delete n.color_threshold_entity;
                    update(n);
                  }}
                ></ha-form>
                ${(button.color_threshold_entity || "").trim()
                  ? html`<ha-form
                      .hass=${this.hass}
                      .data=${{
                        color_threshold_attribute:
                          button.color_threshold_attribute || "",
                      }}
                      .schema=${[
                        {
                          name: "color_threshold_attribute",
                          selector: {
                            attribute: {
                              entity_id: button.color_threshold_entity,
                            },
                          },
                        },
                      ]}
                      .computeLabel=${() => "Attribute"}
                      @value-changed=${(e) => {
                        e.stopPropagation();
                        const v =
                          e.detail &&
                          e.detail.value &&
                          e.detail.value.color_threshold_attribute;
                        const n = { ...button };
                        if (v) n.color_threshold_attribute = v;
                        else delete n.color_threshold_attribute;
                        update(n);
                      }}
                    ></ha-form>`
                  : ""}
              </div>
            </details>
            ${button.color_thresholds.map(
              (t, ti) =>
                html`<div class="ring-threshold-row">
                  <span class="threshold-label">≥</span>
                  <input
                    type="text"
                    placeholder="value"
                    .value=${String(t.value != null ? t.value : "")}
                    @change=${(e) => {
                      const arr = [...button.color_thresholds];
                      arr[ti] = { ...arr[ti], value: e.target.value.trim() };
                      update({ ...button, color_thresholds: arr });
                    }}
                  />
                  <input
                    type="color"
                    class="button-color-swatch"
                    .value=${t.color || "#ff9800"}
                    @input=${(e) => {
                      const arr = [...button.color_thresholds];
                      arr[ti] = { ...arr[ti], color: e.target.value };
                      update({ ...button, color_thresholds: arr });
                    }}
                  />
                  <button
                    type="button"
                    class="ring-threshold-del"
                    title="Remove"
                    @click=${() => {
                      const arr = [...button.color_thresholds];
                      arr.splice(ti, 1);
                      update({
                        ...button,
                        color_thresholds: arr.length ? arr : undefined,
                      });
                    }}
                  >
                    <ha-icon
                      icon="mdi:close"
                      style="--mdc-icon-size:14px"
                    ></ha-icon>
                  </button>
                </div>`,
            )}
            <button
              type="button"
              class="ring-threshold-add"
              @click=${() =>
                update({
                  ...button,
                  color_thresholds: [
                    ...button.color_thresholds,
                    { value: "", color: "#ff9800" },
                  ],
                })}
            >
              <ha-icon icon="mdi:plus" style="--mdc-icon-size:14px"></ha-icon>
              Add threshold
            </button>
          </div>`
        : ""}`;
    /* Gauge */
    const GAUGE_SUFFIXES = [
      "min",
      "max",
      "color",
      "thresholds",
      "threshold_mode",
    ];
    const gaugeFields = (prefix) => {
      const p = prefix + "_",
        label = prefix === "ring" ? "Ring" : "Bar",
        thresholds = Array.isArray(button[p + "thresholds"])
          ? button[p + "thresholds"]
          : [];
      const gaugeEntityId = (button.gauge_entity || "").toString().trim();
      return html`<div class="vcb-grid">
          ${cssField(p + "min", "Min", "0")}${cssField(p + "max", "Max", "100")}
        </div>
        <div class="vcb-grid">
          ${prefix === "ring"
            ? html`${cssField("ring_width", "Thickness", "4")}${cssField(
                "ring_gap",
                "Gap",
                "3",
              )}`
            : html`${cssField("bar_height", "Thickness", "4")}`}
        </div>
        ${this._renderColorPicker(
          `${label} color`,
          button[p + "color"] || "",
          (h, o) => {
            const next = { ...button };
            if (!h) delete next[p + "color"];
            else next[p + "color"] = this._serializeColor(h, o);
            update(next);
          },
        )}
        <details class="disclosure" @toggle=${this._onDisclosureToggle}>
          <summary>
            <ha-icon class="chevron" icon="mdi:chevron-right"></ha-icon
            ><ha-icon icon="mdi:cog-outline"></ha-icon
            ><span>${label} entity</span>
          </summary>
          <div class="disclosure-body">
            ${buttonForm([{ name: "gauge_entity", selector: { entity: {} } }])}
            ${gaugeEntityId
              ? buttonForm([
                  {
                    name: "gauge_attribute",
                    selector: { attribute: { entity_id: gaugeEntityId } },
                  },
                ])
              : isFc
                ? html`<ha-form
                    .hass=${this.hass}
                    .data=${{ gauge_attribute: button.gauge_attribute || "" }}
                    .schema=${[
                      {
                        name: "gauge_attribute",
                        selector: {
                          select: { mode: "dropdown", options: FC_ATTRIBUTES },
                        },
                      },
                    ]}
                    .computeLabel=${() => "Forecast attribute"}
                    @value-changed=${(e) => {
                      e.stopPropagation();
                      const v =
                        e.detail &&
                        e.detail.value &&
                        e.detail.value.gauge_attribute;
                      const n = { ...button };
                      if (v) n.gauge_attribute = v;
                      else delete n.gauge_attribute;
                      update(n);
                    }}
                  ></ha-form>`
                : ""}
          </div>
        </details>
        <details class="disclosure" @toggle=${this._onDisclosureToggle}>
          <summary>
            <ha-icon class="chevron" icon="mdi:chevron-right"></ha-icon
            ><ha-icon icon="mdi:cog-outline"></ha-icon><span>Thresholds</span>
          </summary>
          <div class="disclosure-body">
            <div class="segmented" role="radiogroup">
              ${[
                { v: "solid", l: "Solid" },
                { v: "segments", l: "Segments" },
                { v: "gradient", l: "Gradient" },
              ].map(
                (o) =>
                  html`<button
                    type="button"
                    role="radio"
                    class=${(button[p + "threshold_mode"] || "solid") === o.v
                      ? "active"
                      : ""}
                    @click=${() => {
                      const n = { ...button };
                      if (o.v === "solid") delete n[p + "threshold_mode"];
                      else n[p + "threshold_mode"] = o.v;
                      update(n);
                    }}
                  >
                    ${o.l}
                  </button>`,
              )}
            </div>
            ${thresholds.map(
              (t, ti) =>
                html`<div class="ring-threshold-row">
                  <span class="threshold-label">≥</span>
                  <input
                    type="text"
                    placeholder="value"
                    .value=${String(t.value != null ? t.value : "")}
                    @change=${(e) => {
                      const arr = [...thresholds];
                      arr[ti] = { ...arr[ti], value: e.target.value.trim() };
                      update({ ...button, [p + "thresholds"]: arr });
                    }}
                  />
                  <input
                    type="color"
                    class="button-color-swatch"
                    .value=${t.color || "#ff0000"}
                    @input=${(e) => {
                      const arr = [...thresholds];
                      arr[ti] = { ...arr[ti], color: e.target.value };
                      update({ ...button, [p + "thresholds"]: arr });
                    }}
                  />
                  <button
                    type="button"
                    class="ring-threshold-del"
                    @click=${() => {
                      const arr = [...thresholds];
                      arr.splice(ti, 1);
                      update({
                        ...button,
                        [p + "thresholds"]: arr.length ? arr : undefined,
                      });
                    }}
                  >
                    <ha-icon
                      icon="mdi:close"
                      style="--mdc-icon-size:14px"
                    ></ha-icon>
                  </button>
                </div>`,
            )}
            <button
              type="button"
              class="ring-threshold-add"
              @click=${() =>
                update({
                  ...button,
                  [p + "thresholds"]: [
                    ...thresholds,
                    { value: "", color: "#ff9800" },
                  ],
                })}
            >
              <ha-icon icon="mdi:plus" style="--mdc-icon-size:14px"></ha-icon>
              Add
            </button>
          </div>
        </details>`;
    };
    const isRingType = buttonType === "ring";
    const ringContent = html`<div class="toggle-group">
        <label class="toggle-row"
          ><span>Enable</span>
          <ha-switch
            .checked=${isRingType}
            @change=${(e) => {
              const n = { ...button };
              if (e.target.checked) {
                n.type = "ring";
                if (buttonType === "bar")
                  for (const s of GAUGE_SUFFIXES) {
                    const src = "bar_" + s,
                      dst = "ring_" + s;
                    if (n[src] !== undefined && n[dst] === undefined)
                      n[dst] = n[src];
                  }
              } else {
                delete n.type;
              }
              update(n);
            }}
          ></ha-switch
        ></label>
      </div>
      ${isRingType ? gaugeFields("ring") : ""}`;
    const barContent = html`<div class="toggle-group">
        <label class="toggle-row"
          ><span>Enable</span>
          <ha-switch
            .checked=${isBarType}
            @change=${(e) => {
              const n = { ...button };
              if (e.target.checked) {
                n.type = "bar";
                if (buttonType === "ring")
                  for (const s of GAUGE_SUFFIXES) {
                    const src = "ring_" + s,
                      dst = "bar_" + s;
                    if (n[src] !== undefined && n[dst] === undefined)
                      n[dst] = n[src];
                  }
              } else {
                delete n.type;
              }
              update(n);
            }}
          ></ha-switch
        ></label>
      </div>
      ${isBarType ? gaugeFields("bar") : ""}`;
    /* Sun Arc */
    const isSunArc = buttonType === "sun-arc";
    const sunArcContent = html`<div class="toggle-group">
        <label class="toggle-row"
          ><span>Enable</span>
          <ha-switch
            .checked=${isSunArc}
            @change=${(e) => {
              const n = { ...button };
              if (e.target.checked) {
                n.type = "sun-arc";
                if (!n.entity) n.entity = "sun.sun";
                n.hide_icon = true;
                n.hide_value = true;
                n.hide_label = true;
              } else {
                delete n.type;
                delete n.hide_icon;
                delete n.hide_value;
                delete n.hide_label;
                delete n.arc_body_size;
                delete n.arc_text_size;
                delete n.arc_stroke_width;
                delete n.arc_color_start;
                delete n.arc_color_end;
              }
              update(n);
            }}
          ></ha-switch
        ></label>
      </div>
      ${isSunArc
        ? html`<div
              class="fc-box"
              style="background:rgba(var(--rgb-primary-text-color,0,0,0),0.03)"
            >
              <div
                style="display:flex;align-items:center;gap:var(--awc-e-s2);font-size:var(--awc-e-f-meta);color:var(--secondary-text-color)"
              >
                <ha-icon
                  icon="mdi:lightbulb-outline"
                  style="--mdc-icon-size:16px;flex-shrink:0"
                ></ha-icon>
                <span
                  >Draws a sun/moon arc using the built-in weather icons. Set
                  the entity to <b>sun.sun</b>.</span
                >
              </div>
            </div>
            <div class="vcb-grid">
              ${cssField("arc_body_size", "Icon size", "6")}
              ${cssField("arc_text_size", "Time text", "0.75em")}
            </div>
            ${cssField("arc_stroke_width", "Stroke width", "1.8")}
            ${this._renderColorPicker(
              "Stroke start",
              button.arc_color_start || "",
              (h, o) => {
                const next = { ...button };
                if (!h) delete next.arc_color_start;
                else next.arc_color_start = this._serializeColor(h, o);
                update(next);
              },
            )}
            ${this._renderColorPicker(
              "Stroke end",
              button.arc_color_end || "",
              (h, o) => {
                const next = { ...button };
                if (!h) delete next.arc_color_end;
                else next.arc_color_end = this._serializeColor(h, o);
                update(next);
              },
            )}`
        : ""}`;
    /* Position */
    const ANCHORS = [
      "top-left",
      "top-center",
      "top-right",
      "left",
      "center",
      "right",
      "bottom-left",
      "bottom-center",
      "bottom-right",
    ];
    const currentAnchor = button.position_anchor || "top-left";
    const posContent = html`<div class="toggle-group">
        <label class="toggle-row"
          ><span>Free positioning</span>
          <ha-switch
            .checked=${isFree}
            @change=${(e) => {
              const n = { ...button };
              if (e.target.checked) {
                n.position = "custom";
                if (!n.position_anchor) n.position_anchor = "top-left";
              } else {
                [
                  "position",
                  "position_anchor",
                  "position_x",
                  "position_y",
                ].forEach((k) => delete n[k]);
              }
              update(n);
            }}
          ></ha-switch
        ></label>
      </div>
      ${isFree
        ? html`<div class="free-pos-layout">
            <div>
              <div class="settings-group-label">Anchor</div>
              <div class="anchor-grid" role="radiogroup">
                ${ANCHORS.map(
                  (v) =>
                    html`<button
                      type="button"
                      role="radio"
                      class="anchor-cell ${currentAnchor === v ? "active" : ""}"
                      title=${v}
                      @click=${() => update({ ...button, position_anchor: v })}
                    ></button>`,
                )}
              </div>
            </div>
            <div>
              <div class="settings-group-label">Offset</div>
              <div class="offset-fields">
                <div class="offset-field">
                  <span class="offset-field-label">X</span
                  ><input
                    type="text"
                    placeholder="0"
                    .value=${String(button.position_x || "")}
                    @change=${(e) => {
                      const n = { ...button },
                        v = e.target.value.trim();
                      if (v) n.position_x = v;
                      else delete n.position_x;
                      update(n);
                    }}
                  />
                </div>
                <div class="offset-field">
                  <span class="offset-field-label">Y</span
                  ><input
                    type="text"
                    placeholder="0"
                    .value=${String(button.position_y || "")}
                    @change=${(e) => {
                      const n = { ...button },
                        v = e.target.value.trim();
                      if (v) n.position_y = v;
                      else delete n.position_y;
                      update(n);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>`
        : ""}`;
    const tapContent = buttonForm([
      { name: "tap_action", selector: { ui_action: {} } },
    ]);
    /* Sub value access for buttons without one yet */
    const subSetupContent = html`${buttonForm([
      { name: "sub_value_entity", selector: { entity: {} } },
    ])}
    ${isFc
      ? html`<ha-form
          .hass=${this.hass}
          .data=${{ sub_value_attribute: button.sub_value_attribute || "" }}
          .schema=${[
            {
              name: "sub_value_attribute",
              selector: {
                select: { mode: "dropdown", options: FC_ATTRIBUTES },
              },
            },
          ]}
          .computeLabel=${() => "Forecast attribute"}
          @value-changed=${(e) => {
            e.stopPropagation();
            const v =
              e.detail && e.detail.value && e.detail.value.sub_value_attribute;
            const n = { ...button };
            if (v) n.sub_value_attribute = v;
            else delete n.sub_value_attribute;
            update(n);
          }}
        ></ha-form>`
      : ""}`;
    /* Reset */
    const BUTTON_STYLE_KEYS = [
      "style",
      "align",
      "background",
      "icon_background",
      "background_color",
      "icon_background_color",
      "padding",
      "text_size",
      "label_size",
      "inner_gap",
      "text_gap",
      "icon_size",
      "icon_padding",
      "width",
      "height",
      "value_weight",
      "label_weight",
      "button_round",
      "sub_value_size",
      "sub_value_weight",
      "color_thresholds",
      "color_threshold_entity",
      "color_threshold_attribute",
      "element_order",
      "text_order",
      "text_shadow",
    ];
    const hasStyleOverrides = BUTTON_STYLE_KEYS.some(
      (k) => button[k] !== undefined && button[k] !== "",
    );
    /* Body assembly */
    const isWeatherEntity = entityId.startsWith("weather.");
    const textContent = html`<div class="vcb-nested-group">
      ${textElements.map((el) =>
        el === "label"
          ? nestedElSection(
              "label",
              "mdi:tag-outline",
              "Label",
              labelContent,
              isTxtHidden("label"),
            )
          : el === "value"
            ? nestedElSection(
                "value",
                "mdi:numeric",
                "Value",
                valueContent,
                isTxtHidden("value"),
              )
            : el === "sub"
              ? nestedElSection(
                  "sub",
                  "mdi:text-box-outline",
                  "Sub Value",
                  hasSubValue ? subContent : subSetupContent,
                  isTxtHidden("sub"),
                )
              : "",
      )}
    </div>`;
    const body = html`<div class="vcb">
      ${typePicker} ${entitySection} ${emptyNudge}${fcWarning}
      ${isFc && isWeatherEntity && forecastContent
        ? section("forecast", "mdi:calendar-clock", "Forecast", forecastContent)
        : ""}
      ${elements.map((el) =>
        el === "icon"
          ? elSection(
              "icon",
              "mdi:image-outline",
              "Icon",
              iconContent,
              isElHidden("icon"),
            )
          : el === "text"
            ? elSection(
                "text",
                "mdi:text-box-outline",
                "Text",
                textContent,
                isElHidden("text"),
              )
            : el === "bar"
              ? elSection("bar", "mdi:chart-bar", "Bar", barContent, !isBarType)
              : "",
      )}
      ${section("ring", "mdi:circle-outline", "Ring", ringContent, !isRingType)}
      ${section(
        "sun-arc",
        "mdi:weather-sunset-up",
        "Sun Arc",
        sunArcContent,
        !isSunArc,
      )}
      ${this._renderDisclosure(
        "Settings",
        html`<div class="vcb">
          ${section(
            "appear",
            "mdi:palette-outline",
            "Appearance",
            appearContent,
          )}
          ${marqueeContent
            ? section(
                "marquee",
                "mdi:motion-play-outline",
                "Scrolling",
                marqueeContent,
              )
            : ""}
          ${section("pos", "mdi:arrow-all", "Position", posContent)}
          ${section("tap", "mdi:gesture-tap", "Tap Action", tapContent)}
          ${section(
            "vis",
            "mdi:eye-outline",
            "Visibility",
            this._renderButtonVisibility(button, areaIdx, idx, update),
          )}
          ${hasStyleOverrides
            ? html`<button
                type="button"
                class="add-card-btn"
                style="border-style:solid;border-color:rgba(var(--rgb-error-color,211,47,47),0.35);color:var(--error-color);margin-top:var(--awc-e-s3)"
                @click=${() => {
                  const n = { ...button };
                  for (const k of BUTTON_STYLE_KEYS) delete n[k];
                  update(n);
                }}
              >
                <ha-icon icon="mdi:restore"></ha-icon
                ><span>Reset all styles</span>
              </button>`
            : ""}
        </div>`,
      )}
    </div>`;
    return this._renderListRow({
      idx,
      total,
      expanded,
      body,
      badge: posBadge,
      title: this._buttonTitle(button),
      onToggle: () => this._toggleButtonExpanded(idx),
      onMoveUp: () => this._moveButton(areaIdx, idx, -1),
      onMoveDown: () => this._moveButton(areaIdx, idx, 1),
      onDuplicate: () => this._duplicateButton(areaIdx, idx),
      onRemove: () => this._removeButton(areaIdx, idx),
    });
  }

  _parseColor(raw) {
    const s = (raw || "").toString().trim();
    const m = s.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/i);
    if (m) {
      const hex = `#${parseInt(m[1]).toString(16).padStart(2, "0")}${parseInt(m[2]).toString(16).padStart(2, "0")}${parseInt(m[3]).toString(16).padStart(2, "0")}`;
      return {
        hex,
        opacity: m[4] !== undefined ? parseFloat(m[4]) : 1,
        hasColor: true,
      };
    }
    if (/^#[0-9a-f]{3,8}$/i.test(s))
      return { hex: s.slice(0, 7), opacity: 1, hasColor: true };
    return { hex: "#ffffff", opacity: 0, hasColor: false };
  }
  _serializeColor(hex, opacity) {
    if (opacity >= 1) return hex;
    const r = parseInt(hex.slice(1, 3), 16),
      g = parseInt(hex.slice(3, 5), 16),
      b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${parseFloat(opacity.toFixed(2))})`;
  }
  _renderColorPicker(label, raw, onWrite) {
    const { hex, opacity, hasColor } = this._parseColor(raw);
    return html`<div class="button-color-box">
      <div class="button-color-row">
        <ha-icon
          icon="mdi:palette-outline"
          style="--mdc-icon-size:15px;color:var(--secondary-text-color);flex-shrink:0"
        ></ha-icon>
        <span class="button-color-label">${label}</span>
        <input
          type="color"
          class="button-color-swatch"
          .value=${hex}
          @input=${(e) => onWrite(e.target.value, opacity || 1)}
        />
        ${hasColor
          ? html`<button
              type="button"
              class="button-color-clear"
              title="Clear color"
              @click=${() => onWrite("", 1)}
            >
              <ha-icon icon="mdi:close" style="--mdc-icon-size:14px"></ha-icon>
            </button>`
          : ""}
      </div>
      ${hasColor
        ? html`<div class="button-color-opacity-row">
            <span class="button-color-opacity-label">Opacity</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              class="button-color-opacity"
              .value=${String(opacity)}
              @input=${(e) => onWrite(hex, parseFloat(e.target.value))}
            />
            <span class="button-color-opacity-val"
              >${Math.round(opacity * 100)}%</span
            >
          </div> `
        : ""}
    </div>`;
  }
  _renderSlider(field, label, min, max, step, helper, statusFn) {
    const val =
        parseFloat(
          this._formData[field] != null ? this._formData[field] : min,
        ) || min,
      pct = Math.round(((val - min) / (max - min)) * 100);
    const onRange = (e) => {
      const v = parseFloat(e.target.value),
        p = Math.round(((v - min) / (max - min)) * 100);
      e.target.style.setProperty("--awc-slider-pct", p + "%");
      const numInput = e.target
        .closest(".awc-slider")
        .querySelector(".awc-slider-num");
      if (numInput) numInput.value = v;
      const statusEl = e.target
        .closest(".awc-slider")
        .querySelector(".awc-slider-status");
      if (statusEl && statusFn) statusEl.textContent = statusFn(v);
    };
    const onCommit = (e) =>
      this._updateField(field, parseFloat(e.target.value));
    const onNumInput = (e) => {
      const v = Math.min(max, Math.max(min, parseFloat(e.target.value) || min));
      const range = e.target
        .closest(".awc-slider")
        .querySelector(".awc-slider-range");
      if (range) {
        range.value = v;
        const p = Math.round(((v - min) / (max - min)) * 100);
        range.style.setProperty("--awc-slider-pct", p + "%");
      }
      this._updateField(field, v);
    };
    const statusText = statusFn ? statusFn(val) : null;
    return html`<div class="awc-slider">
      <div class="awc-slider-head">
        <span class="awc-slider-label">${label}</span>
        <input
          type="number"
          class="awc-slider-num"
          min=${min}
          max=${max}
          step=${step}
          .value=${String(val)}
          @change=${onNumInput}
        />
      </div>
      <input
        type="range"
        class="awc-slider-range"
        min=${min}
        max=${max}
        step=${step}
        .value=${String(val)}
        style="--awc-slider-pct:${pct}%"
        @input=${onRange}
        @change=${onCommit}
      />
      ${statusText != null
        ? html`<div class="awc-slider-status">${statusText}</div>`
        : ""}
      ${helper ? html`<div class="awc-slider-helper">${helper}</div>` : ""}
    </div>`;
  }
  _renderCompactField(field, placeholder) {
    const current = String(this._formData[field] || ""),
      label = LABELS[field] || field;
    return html`<div class="compact-field">
      <span class="compact-field-label">${label}</span>
      <input
        type="text"
        placeholder=${placeholder}
        .value=${current}
        @change=${(e) => this._updateField(field, e.target.value || "")}
      />
    </div>`;
  }
  _renderButtonAreasEditor() {
    const areas = this._getAreas();
    return html` <div class="sensor-list">
        ${areas.map((area, ai) => {
          const expanded = this._expandedArea === ai;
          const title = this._areaTitle(area, ai);
          const body = expanded ? this._renderButtonAreaBody(area, ai) : "";
          return this._renderListRow({
            idx: ai,
            total: areas.length,
            expanded,
            body,
            title: html`<span>Button Area ${ai + 1}</span
              ><span
                style="font-weight:400;color:var(--secondary-text-color);margin-left:var(--awc-e-s2);font-size:var(--awc-e-f-meta)"
                >${title}</span
              >`,
            onToggle: () => {
              this._expandedArea = this._expandedArea === ai ? null : ai;
              this._expandedButton = null;
            },
            onMoveUp: () => this._moveArea(ai, -1),
            onMoveDown: () => this._moveArea(ai, 1),
            onDuplicate: () => this._duplicateArea(ai),
            onRemove: () => this._removeArea(ai),
          });
        })}
      </div>
      <button
        type="button"
        class="add-button-btn"
        @click=${() => this._addArea()}
      >
        <ha-icon icon="mdi:plus"></ha-icon>
        <span>Add Button Area</span>
      </button>`;
  }
  _addArea() {
    const areas = [...this._getAreas(), { position: "bottom-left" }];
    this._expandedArea = areas.length - 1;
    this._expandedButton = null;
    this._commitAreas(areas);
  }
  _moveArea(idx, delta) {
    const areas = [...this._getAreas()],
      target = idx + delta;
    if (target < 0 || target >= areas.length) return;
    [areas[idx], areas[target]] = [areas[target], areas[idx]];
    if (this._expandedArea === idx) this._expandedArea = target;
    else if (this._expandedArea === target) this._expandedArea = idx;
    this._commitAreas(areas);
  }
  _removeArea(idx) {
    const areas = [...this._getAreas()];
    areas.splice(idx, 1);
    if (this._expandedArea === idx) this._expandedArea = null;
    else if (typeof this._expandedArea === "number" && this._expandedArea > idx)
      this._expandedArea--;
    this._expandedButton = null;
    this._commitAreas(areas);
  }
  _duplicateArea(idx) {
    const areas = [...this._getAreas()];
    const clone = JSON.parse(JSON.stringify(areas[idx]));
    areas.splice(idx + 1, 0, clone);
    this._expandedArea = idx + 1;
    this._expandedButton = null;
    this._commitAreas(areas);
  }
  _renderAreaColorPicker(areaIdx, key, label) {
    const area = this._getAreas()[areaIdx] || {};
    const raw = (area[key] || "").toString().trim();
    return this._renderColorPicker(label, raw, (h, o) => {
      this._updateAreaField(areaIdx, key, h ? this._serializeColor(h, o) : "");
    });
  }
  _renderButtonAreaBody(area, areaIdx) {
    const list = this._getButtonsForArea(areaIdx);
    const uf = (key, value) => this._updateAreaField(areaIdx, key, value);
    let layout = (area.layout || "wrap").toString().toLowerCase();
    const isGrid = layout === "grid";
    const isScroll =
      layout === "horizontal-scroll" || layout === "vertical-scroll";
    const align = (area.align || "start").toString().toLowerCase();
    const buttonFormat = (area.button_style || "inline")
      .toString()
      .toLowerCase();
    const bgStyle = area.background_style || "frosted",
      bgActive = !!area.background;
    const sf = (key, label, placeholder) =>
      html`<div class="css-field">
        <span class="css-field-label">${label}</span>
        <input
          type="text"
          placeholder=${placeholder}
          .value=${String(area[key] || "")}
          @change=${(e) => uf(key, e.target.value || "")}
        />
      </div>`;
    const areaSlider = (key, label, min, max, step, helper) => {
      const val = parseFloat(area[key] != null ? area[key] : min) || min,
        pct = Math.round(((val - min) / (max - min)) * 100);
      return html`<div class="awc-slider">
        <div class="awc-slider-head">
          <span class="awc-slider-label">${label}</span>
          <input
            type="number"
            class="awc-slider-num"
            min=${min}
            max=${max}
            step=${step}
            .value=${String(val)}
            @change=${(e) => {
              const v = Math.min(
                max,
                Math.max(min, parseFloat(e.target.value) || min),
              );
              const range = e.target
                .closest(".awc-slider")
                .querySelector(".awc-slider-range");
              if (range) {
                range.value = v;
                const p = Math.round(((v - min) / (max - min)) * 100);
                range.style.setProperty("--awc-slider-pct", p + "%");
              }
              uf(key, v);
            }}
          />
        </div>
        <input
          type="range"
          class="awc-slider-range"
          min=${min}
          max=${max}
          step=${step}
          .value=${String(val)}
          style="--awc-slider-pct:${pct}%"
          @input=${(e) => {
            const v = parseFloat(e.target.value),
              p = Math.round(((v - min) / (max - min)) * 100);
            e.target.style.setProperty("--awc-slider-pct", p + "%");
            const n = e.target
              .closest(".awc-slider")
              .querySelector(".awc-slider-num");
            if (n) n.value = v;
          }}
          @change=${(e) => uf(key, parseFloat(e.target.value))}
        />
        ${helper ? html`<div class="awc-slider-helper">${helper}</div>` : ""}
      </div>`;
    };
    const areaToggle = (toggles) =>
      html`<div class="toggle-group">
        ${toggles.map(
          (t) =>
            html`<label class="toggle-row">
              <span>${t.label}</span>
              <ha-switch
                .checked=${area[t.key] === true}
                @change=${(e) => uf(t.key, e.target.checked || "")}
              ></ha-switch
            ></label>`,
        )}
      </div>`;
    const containerContent = html`<div class="vcb">
      <div style="display:flex;gap:var(--awc-e-s3);align-items:flex-start">
        ${this._renderAreaPositionGrid(
          areaIdx,
          "position",
          POSITION_GRIDS.button_area_position,
        )}
        <div
          style="display:flex;flex-direction:column;gap:var(--awc-e-s2);align-self:center;flex:1;min-width:0"
        >
          <div class="css-field">
            <span class="css-field-label">${LABELS.button_area_width}</span>
            <input
              type="text"
              placeholder="auto"
              .value=${String(area.width || "")}
              @change=${(e) => uf("width", e.target.value || "")}
            />
          </div>
          <div class="css-field">
            <span class="css-field-label">${LABELS.button_area_height}</span>
            <input
              type="text"
              placeholder="auto"
              .value=${String(area.height || "")}
              @change=${(e) => uf("height", e.target.value || "")}
            />
          </div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:var(--awc-e-s2)">
        <span
          style="font-size:var(--awc-e-f-body);color:var(--secondary-text-color);white-space:nowrap"
          >Stacking</span
        >
        <div
          class="segmented"
          role="radiogroup"
          aria-label="Stack direction"
          style="flex:1"
        >
          ${[
            { v: "vertical", l: "↕ Vertical" },
            { v: "horizontal", l: "↔ Horizontal" },
          ].map((o) => {
            const cur = area.stack_direction || "vertical";
            return html`<button
              type="button"
              role="radio"
              class=${cur === o.v ? "active" : ""}
              @click=${() => uf("stack_direction", o.v)}
            >
              ${o.l}
            </button>`;
          })}
        </div>
      </div>
      <div class="segmented" role="radiogroup" aria-label="Layout">
        ${OPT.button_area_layout.map(
          (o) =>
            html`<button
              type="button"
              role="radio"
              class=${layout === o.value ? "active" : ""}
              @click=${() => uf("layout", o.value)}
            >
              ${o.label}
            </button>`,
        )}
      </div>
      ${isGrid
        ? areaSlider("columns", LABELS.button_area_columns, 1, 12, 1)
        : ""}
      ${isScroll
        ? areaSlider("scroll_count", LABELS.button_area_scroll_count, 1, 10, 1)
        : ""}
      <div class="toggle-group">
        <label class="toggle-row">
          <span>${LABELS.button_area_grouped}</span>
          <ha-switch
            .checked=${area.grouped === true}
            @change=${(e) => {
              const on = e.target.checked;
              uf("grouped", on || "");
              if (on && !bgActive) {
                uf("background", true);
                uf("background_style", bgStyle || "frosted");
              }
            }}
          ></ha-switch
        ></label>
      </div>
      ${areaToggle([{ key: "separator", label: LABELS.button_area_separator }])}
      <div class="vcb-grid">
        ${sf("gap", LABELS.button_area_gap, "8px")}
        ${sf("padding", LABELS.button_area_padding, "0")}
      </div>
      ${area.grouped === true && area.background === true
        ? this._renderAreaColorPicker(
            areaIdx,
            "background_color",
            "Container background color",
          )
        : ""}
    </div>`;
    const buttonsContent = html`<div class="vcb">
      ${this._renderSubDisclosure(
        "Layout",
        html`<div class="vcb">
          <div class="vcb-format-row">
            ${[
              { v: "inline", l: "Inline" },
              { v: "stacked", l: "Stacked" },
              { v: "vertical", l: "Vertical" },
            ].map((o) => {
              const a = buttonFormat === o.v;
              return html`<button
                type="button"
                class="vcb-format-card ${a ? "active" : ""}"
                @click=${() => uf("button_style", o.v)}
              >
                <div class="vcb-fmt ${o.v}">
                  ${o.v === "stacked"
                    ? html`<div class="vcb-fmt-sq"></div>
                        <div class="vcb-fmt-col">
                          <div class="vcb-fmt-bar sm"></div>
                          <div class="vcb-fmt-bar lg"></div>
                        </div>`
                    : o.v === "vertical"
                      ? html`<div class="vcb-fmt-sq"></div>
                          <div class="vcb-fmt-col">
                            <div class="vcb-fmt-bar sm"></div>
                            <div class="vcb-fmt-bar lg"></div>
                          </div>`
                      : html`<div class="vcb-fmt-sq"></div>
                          <div class="vcb-fmt-bar sm"></div>
                          <div class="vcb-fmt-bar lg"></div>`}
                </div>
                <span class="vcb-format-name">${o.l}</span>
              </button>`;
            })}
          </div>
          <div
            class="segmented"
            role="radiogroup"
            aria-label="Alignment"
            style="flex-wrap:nowrap"
          >
            ${OPT.button_area_align.map(
              (o) =>
                html`<button
                  type="button"
                  role="radio"
                  class=${align === o.value ? "active" : ""}
                  @click=${() => uf("align", o.value)}
                >
                  ${o.label}
                </button>`,
            )}
          </div>
        </div>`,
      )}
      ${this._renderSubDisclosure(
        "Background",
        html`<div class="vcb">
          <div class="segmented" role="radiogroup" aria-label="Background">
            <button
              type="button"
              role="radio"
              class=${!bgActive ? "active" : ""}
              @click=${() => uf("background", false)}
            >
              Off
            </button>
            ${[
              { value: "frosted", label: "Frosted" },
              { value: "contrast", label: "Contrast" },
              { value: "theme", label: "Theme" },
            ].map(
              (o) =>
                html`<button
                  type="button"
                  role="radio"
                  class=${bgActive && bgStyle === o.value ? "active" : ""}
                  @click=${() => {
                    uf("background", true);
                    uf("background_style", o.value);
                  }}
                >
                  ${o.label}
                </button>`,
            )}
          </div>
          <div class="segmented" role="radiogroup" aria-label="Icon background">
            ${[
              { value: undefined, label: "Default" },
              { value: true, label: "On" },
              { value: false, label: "Off" },
            ].map(
              (o) =>
                html`<button
                  type="button"
                  role="radio"
                  class=${area.button_icon_background === o.value ||
                  (o.value === undefined &&
                    area.button_icon_background === undefined)
                    ? "active"
                    : ""}
                  @click=${() =>
                    uf(
                      "button_icon_background",
                      o.value === undefined ? "" : o.value,
                    )}
                >
                  ${o.label}
                </button>`,
            )}
          </div>
          ${bgActive || area.button_icon_background === true
            ? html` ${this._renderAreaColorPicker(
                areaIdx,
                "button_background_color",
                "Button background",
              )}
              ${this._renderAreaColorPicker(
                areaIdx,
                "button_icon_background_color",
                "Icon background",
              )}`
            : ""}
        </div>`,
      )}
      ${this._renderSubDisclosure(
        "Text & Icon Sizes",
        html`<div class="vcb">
          <div class="vcb-grid">
            ${sf("button_text_size", "Value size", "auto")}
            ${sf("button_label_size", "Label size", "auto")}
          </div>
          <div class="vcb-grid">
            ${sf("button_icon_size", "Icon size", "auto")}
            ${sf("sub_value_size", "Sub value size", "auto")}
          </div>
        </div>`,
      )}
      ${this._renderSubDisclosure(
        "Gaps",
        html`<div class="vcb">
          <div class="vcb-grid">
            ${sf("button_gap", "Button gap", "6px")}
            ${sf("button_text_gap", "Text gap", "0.35em")}
          </div>
        </div>`,
      )}
      ${this._renderSubDisclosure(
        "Padding",
        html`<div class="vcb">
          <div class="vcb-grid">
            ${sf("button_padding", "Button padding", "auto")}
            ${sf("button_icon_padding", "Icon padding", "auto")}
          </div>
        </div>`,
      )}
    </div>`;
    return html` <div class="sensor-list">
        ${list.map((button, idx) =>
          this._renderButtonRow(button, idx, list.length, areaIdx),
        )}
      </div>
      <button
        type="button"
        class="add-button-btn"
        @click=${() => this._addButton(areaIdx)}
      >
        <ha-icon icon="mdi:plus"></ha-icon>
        <span>Add button</span>
      </button>
      ${this._renderDisclosure("Button Area Settings", containerContent)}
      ${this._renderDisclosure(
        "Button Settings",
        html`<div
            class="fc-box"
            style="background:rgba(var(--rgb-primary-text-color,0,0,0),0.03);margin-bottom:var(--awc-e-s3)"
          >
            <div
              style="display:flex;align-items:center;gap:var(--awc-e-s2);font-size:var(--awc-e-f-meta);color:var(--secondary-text-color)"
            >
              <ha-icon
                icon="mdi:lightbulb-outline"
                style="--mdc-icon-size:16px;flex-shrink:0"
              ></ha-icon>
              <span
                >These settings apply to all buttons in this area. Individual
                button settings can override them.</span
              >
            </div>
          </div>
          ${buttonsContent}`,
      )}
      ${this._renderDisclosure(
        "Visibility",
        this._renderAreaVisibility(area, areaIdx),
      )}`;
  }
  _renderAreaPositionGrid(areaIdx, field, gridDef) {
    const area = this._getAreas()[areaIdx] || {};
    const valueMap = gridDef.valueMap || {};
    const reverseMap = Object.fromEntries(
      Object.entries(valueMap).map(([k, v]) => [v, k]),
    );
    const stored = area[field] || "",
      value = reverseMap[stored] || stored,
      cells = gridDef.cells.flat();
    const disabledSet = new Set(gridDef.disabled || []),
      labelText = LABELS["button_area_" + field] || field;
    return html`<div>
      <div class="settings-group-label">${labelText}</div>
      <div class="grid-3x3" role="radiogroup" aria-label=${labelText}>
        ${cells.map((val) => {
          if (val === null) return html`<div class="grid-cell empty"></div>`;
          const isDisabled = disabledSet.has(val);
          return html`<button
            type="button"
            role="radio"
            class="grid-cell ${value === val ? "active" : ""} ${isDisabled
              ? "disabled"
              : ""}"
            ?disabled=${isDisabled}
            title=${isDisabled ? `${val} (not supported here)` : val}
            aria-label=${val}
            @click=${isDisabled
              ? null
              : () =>
                  this._updateAreaField(areaIdx, field, valueMap[val] || val)}
          ></button>`;
        })}
      </div>
    </div>`;
  }
  _renderVisibilityConditions(conditions, emptyLabel, commitList) {
    const CONDITION_TYPES = [
      { value: "state", label: "State" },
      { value: "numeric_state", label: "Numeric state" },
      { value: "screen", label: "Screen size" },
      { value: "user", label: "User" },
    ];
    const removeCondition = (ci) => {
      const arr = [...conditions];
      arr.splice(ci, 1);
      commitList(arr);
    };
    const updateCondition = (ci, patch) => {
      const arr = [...conditions];
      arr[ci] = { ...arr[ci], ...patch };
      commitList(arr);
    };
    const addCondition = () => {
      commitList([
        ...conditions,
        { condition: "state", entity: "", state: "" },
      ]);
    };
    return html`${conditions.map((c, ci) => {
        const cType = c.condition || "state";
        const onTypeChange = (newType) => {
          const base = { condition: newType };
          if (newType === "state") {
            base.entity = c.entity || "";
            base.state = "";
          } else if (newType === "numeric_state") {
            base.entity = c.entity || "";
          } else if (newType === "screen") {
            base.media_query = c.media_query || "(min-width: 768px)";
          } else if (newType === "user") {
            base.users = c.users || [];
          }
          const arr = [...conditions];
          arr[ci] = base;
          commitList(arr);
        };
        return html`<div class="field-group" style="position:relative">
          <div
            style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--awc-e-s2)"
          >
            <span class="field-group-label" style="margin:0"
              >Condition ${ci + 1}</span
            >
            <button
              type="button"
              class="ring-threshold-del"
              title="Remove"
              @click=${() => removeCondition(ci)}
            >
              <ha-icon icon="mdi:close" style="--mdc-icon-size:14px"></ha-icon>
            </button>
          </div>
          <div
            class="segmented segmented-compact"
            role="radiogroup"
            aria-label="Condition type"
          >
            ${CONDITION_TYPES.map(
              (o) =>
                html`<button
                  type="button"
                  role="radio"
                  class=${cType === o.value ? "active" : ""}
                  @click=${() => onTypeChange(o.value)}
                >
                  ${o.label}
                </button>`,
            )}
          </div>
          ${cType === "state"
            ? html`<ha-form
                  .hass=${this.hass}
                  .data=${{ entity: c.entity || "" }}
                  .schema=${[{ name: "entity", selector: { entity: {} } }]}
                  .computeLabel=${() => "Entity"}
                  @value-changed=${(e) => {
                    e.stopPropagation();
                    updateCondition(ci, {
                      entity:
                        (e.detail && e.detail.value && e.detail.value.entity) ||
                        "",
                    });
                  }}
                ></ha-form>
                <div class="css-field-row cols-2">
                  <div class="css-field">
                    <span class="css-field-label">State</span>
                    <input
                      type="text"
                      placeholder="on"
                      .value=${c.state != null ? String(c.state) : ""}
                      @change=${(e) => {
                        const v = e.target.value;
                        const arr = [...conditions];
                        const entry = { ...arr[ci] };
                        if (v !== "") {
                          entry.state = v;
                          delete entry.state_not;
                        } else {
                          delete entry.state;
                        }
                        arr[ci] = entry;
                        commitList(arr);
                      }}
                    />
                  </div>
                  <div class="css-field">
                    <span class="css-field-label">State not</span>
                    <input
                      type="text"
                      placeholder=""
                      .value=${c.state_not != null ? String(c.state_not) : ""}
                      @change=${(e) => {
                        const v = e.target.value;
                        const arr = [...conditions];
                        const entry = { ...arr[ci] };
                        if (v !== "") {
                          entry.state_not = v;
                          delete entry.state;
                        } else {
                          delete entry.state_not;
                        }
                        arr[ci] = entry;
                        commitList(arr);
                      }}
                    />
                  </div>
                </div>`
            : ""}
          ${cType === "numeric_state"
            ? html`<ha-form
                  .hass=${this.hass}
                  .data=${{ entity: c.entity || "" }}
                  .schema=${[{ name: "entity", selector: { entity: {} } }]}
                  .computeLabel=${() => "Entity"}
                  @value-changed=${(e) => {
                    e.stopPropagation();
                    updateCondition(ci, {
                      entity:
                        (e.detail && e.detail.value && e.detail.value.entity) ||
                        "",
                    });
                  }}
                ></ha-form>
                <div class="css-field-row cols-2">
                  <div class="css-field">
                    <span class="css-field-label">Above</span>
                    <input
                      type="text"
                      placeholder=""
                      .value=${c.above != null ? String(c.above) : ""}
                      @change=${(e) => {
                        const v = e.target.value.trim();
                        const arr = [...conditions];
                        if (v !== "")
                          arr[ci] = { ...arr[ci], above: parseFloat(v) };
                        else {
                          arr[ci] = { ...arr[ci] };
                          delete arr[ci].above;
                        }
                        commitList(arr);
                      }}
                    />
                  </div>
                  <div class="css-field">
                    <span class="css-field-label">Below</span>
                    <input
                      type="text"
                      placeholder=""
                      .value=${c.below != null ? String(c.below) : ""}
                      @change=${(e) => {
                        const v = e.target.value.trim();
                        const arr = [...conditions];
                        if (v !== "")
                          arr[ci] = { ...arr[ci], below: parseFloat(v) };
                        else {
                          arr[ci] = { ...arr[ci] };
                          delete arr[ci].below;
                        }
                        commitList(arr);
                      }}
                    />
                  </div>
                </div>`
            : ""}
          ${cType === "screen"
            ? html`<div class="css-field">
                <span class="css-field-label">Media query</span>
                <input
                  type="text"
                  placeholder="(min-width: 768px)"
                  .value=${c.media_query || ""}
                  @change=${(e) =>
                    updateCondition(ci, { media_query: e.target.value.trim() })}
                />
              </div>`
            : ""}
          ${cType === "user"
            ? html`<div class="css-field">
                <span class="css-field-label">User IDs (comma-separated)</span>
                <input
                  type="text"
                  placeholder="abc123, def456"
                  .value=${Array.isArray(c.users) ? c.users.join(", ") : ""}
                  @change=${(e) =>
                    updateCondition(ci, {
                      users: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })}
                />
              </div>`
            : ""}
        </div>`;
      })}
      <button type="button" class="ring-threshold-add" @click=${addCondition}>
        <ha-icon icon="mdi:plus" style="--mdc-icon-size:14px"></ha-icon> Add
        condition
      </button>
      ${conditions.length > 0
        ? html`<div
            style="font-size:var(--awc-e-f-meta);color:var(--secondary-text-color);line-height:1.4;margin-top:var(--awc-e-s2)"
          >
            All conditions must be met to be visible.
          </div>`
        : ""}`;
  }
  _renderAreaVisibility(area, areaIdx) {
    const conditions = Array.isArray(area.visibility) ? area.visibility : [];
    return this._renderVisibilityConditions(
      conditions,
      "This button area is always visible.",
      (arr) => {
        const n = { ...area };
        if (arr.length) n.visibility = arr;
        else delete n.visibility;
        this._updateAreaAt(areaIdx, n);
      },
    );
  }
  _renderButtonVisibility(button, areaIdx, idx, update) {
    const conditions = Array.isArray(button.visibility)
      ? button.visibility
      : [];
    return this._renderVisibilityConditions(
      conditions,
      "This button is always visible.",
      (arr) => {
        const n = { ...button };
        if (arr.length) n.visibility = arr;
        else delete n.visibility;
        update(n);
      },
    );
  }
  _renderImagesPanel() {
    const c = this._formData;
    const mode = c._visual_mode;
    const isNone = mode === "none";
    const showBgFilters = mode === "visuals" || mode === "images";
    const modeHint =
      mode === "images"
        ? "Custom images or videos that change with the weather."
        : mode === "simple"
          ? "A soft gradient that changes with the weather."
          : mode === "none"
            ? "Just a flat card background."
            : "Animated weather backgrounds.";
    const brightnessStatus = (v) => {
      const pct = Math.round(v * 100);
      if (v < 0.5) return `${pct}% — Very dark`;
      if (v < 0.8) return `${pct}% — Dimmed`;
      if (v < 0.95) return `${pct}% — Slightly dimmed`;
      if (v >= 0.95 && v <= 1.05) return "Default brightness";
      if (v < 1.2) return `${pct}% — Slightly brighter`;
      if (v < 1.5) return `${pct}% — Bright`;
      return `${pct}% — Very bright`;
    };
    const saturationStatus = (v) => {
      const pct = Math.round(v * 100);
      if (v === 0) return "Grayscale";
      if (v < 0.4) return `${pct}% — Desaturated`;
      if (v < 0.8) return `${pct}% — Muted colors`;
      if (v >= 0.95 && v <= 1.05) return "Default intensity";
      if (v < 1.4) return `${pct}% — Vivid colors`;
      if (v < 1.8) return `${pct}% — Very vivid`;
      return `${pct}% — Maximum saturation`;
    };
    const blurStatus = (v) => {
      if (v === 0) return "No blur";
      if (v <= 2) return `${v}px — Subtle`;
      if (v <= 6) return `${v}px — Soft`;
      if (v <= 12) return `${v}px — Strong`;
      return `${v}px — Heavy`;
    };
    return html` <div class="fc-box" style="margin-top:0">
        <ha-form
          .hass=${this.hass}
          .data=${{ _visual_mode: mode }}
          .schema=${[
            {
              name: "_visual_mode",
              selector: {
                select: { mode: "dropdown", options: OPT.visual_mode },
              },
            },
          ]}
          .computeLabel=${this._computeLabel}
          @value-changed=${(e) => {
            e.stopPropagation();
            const v = e.detail && e.detail.value && e.detail.value._visual_mode;
            if (v && v !== mode) this._setVisualMode(v);
          }}
        ></ha-form>
        <div
          style="font-size:var(--awc-e-f-meta);color:var(--secondary-text-color);line-height:1.4;margin-top:var(--awc-e-s2)"
        >
          ${modeHint}
        </div>
      </div>
      ${mode === "images"
        ? this._renderDisclosure(
            "Weather Images",
            html` <div class="settings-group">
                ${this._renderClearableText("weather_image_path")}
                ${this._renderClearableText("weather_image_path_night")}
              </div>
              <div
                class="fc-box"
                style="background:rgba(var(--rgb-primary-text-color,0,0,0),0.03)"
              >
                <div
                  style="display:flex;align-items:center;gap:var(--awc-e-s2);font-size:var(--awc-e-f-meta);color:var(--secondary-text-color)"
                >
                  <ha-icon
                    icon="mdi:lightbulb-outline"
                    style="--mdc-icon-size:16px;flex-shrink:0"
                  ></ha-icon>
                  <span
                    >Name each image after the weather state (e.g.
                    <code>sunny.jpg</code>, <code>rainy.png</code>) and put them
                    in the day folder. Add a night folder to swap images at
                    night, or leave it empty to use the day folder all the
                    time.</span
                  >
                </div>
              </div>
              <div
                style="display:flex;flex-direction:column;gap:var(--awc-e-s2);margin-top:var(--awc-e-s3)"
              >
                ${this._renderSlider(
                  "bg_blur",
                  LABELS.bg_blur,
                  0,
                  20,
                  1,
                  null,
                  blurStatus,
                )}
              </div>`,
          )
        : ""}
      ${this._renderDisclosure(
        "Color Settings",
        html` <div class="fc-box" style="margin-top:0">
            <div class="section-title">
              <ha-icon
                icon="mdi:theme-light-dark"
                style="--mdc-icon-size:18px"
              ></ha-icon
              ><span>Color Mode</span>
            </div>
            ${this._renderForm(this._colorModeSchema())}
            ${!isNone
              ? html`<div
                  class="toggle-group"
                  style="margin-top:var(--awc-e-s2)"
                >
                  <label class="toggle-row"
                    ><span>Adapt contrast to theme</span
                    ><ha-switch
                      .checked=${this._formData.theme_adapt !== false}
                      @change=${(e) =>
                        this._updateField(
                          "theme_adapt",
                          e.target.checked ? undefined : false,
                        )}
                    ></ha-switch
                  ></label>
                </div>`
              : ""}
          </div>
          ${showBgFilters
            ? html`<div
                style="display:flex;flex-direction:column;gap:var(--awc-e-s2)"
              >
                ${this._renderSlider(
                  "bg_brightness",
                  LABELS.bg_brightness,
                  0.3,
                  1.7,
                  0.05,
                  null,
                  brightnessStatus,
                )}
                ${this._renderSlider(
                  "bg_saturation",
                  LABELS.bg_saturation,
                  0,
                  2,
                  0.05,
                  null,
                  saturationStatus,
                )}
              </div>`
            : ""}
          ${!isNone
            ? html`<div class="toggle-group" style="margin-top:var(--awc-e-s3)">
                <label class="toggle-row"
                  ><span>Fade to dashboard background</span
                  ><ha-switch
                    .checked=${this._formData.bottom_fade === true}
                    @change=${(e) =>
                      this._updateField("bottom_fade", e.target.checked)}
                  ></ha-switch
                ></label>
              </div>`
            : ""}`,
      )}
      ${mode !== "none"
        ? this._renderDisclosure(
            "Special Effects",
            html`<div class="toggle-group">
              <label class="toggle-row"
                ><span>Night Sky</span
                ><ha-switch
                  .checked=${this._formData.night_sky_effects !== false}
                  @change=${(e) =>
                    this._updateField(
                      "night_sky_effects",
                      e.target.checked ? undefined : false,
                    )}
                ></ha-switch
              ></label>
              <label class="toggle-row"
                ><span>Sun (Glow & Rays)</span
                ><ha-switch
                  .checked=${this._formData.sun_effects !== false}
                  @change=${(e) =>
                    this._updateField(
                      "sun_effects",
                      e.target.checked ? undefined : false,
                    )}
                ></ha-switch
              ></label>
            </div>`,
          )
        : ""}`;
  }
  render() {
    if (!this.hass || !this._config) return html``;
    const c = this._formData;
    return html`${this._renderForm([
        { name: "weather_entity", selector: { entity: { domain: "weather" } } },
      ])}

      <ha-expansion-panel
        outlined
        .expanded=${this._openPanel === "card_settings"}
        @expanded-changed=${(e) =>
          this._onPanelToggle("card_settings", e.detail.expanded)}
      >
        <div slot="header" class="panel-header">
          <ha-icon icon="mdi:cog-outline"></ha-icon>
          <span>General</span>
        </div>
        ${this._renderDisclosure(
          "Dimensions",
          html`<div class="settings-group">
            ${this._renderCardStyleSegmented()} ${this._renderOffsetPicker()}
          </div>`,
        )}
        ${this._renderDisclosure(
          "Icon Settings",
          html`<div class="settings-group">
            <div class="settings-group-label">Icon Set</div>
            <div class="segmented" role="radiogroup" aria-label="Icon set">
              ${[
                { v: "line", l: "Line" },
                { v: "colored", l: "Colored" },
              ].map(
                (o) =>
                  html`<button
                    type="button"
                    role="radio"
                    class=${((this._formData || {}).icon_set || "line") === o.v
                      ? "active"
                      : ""}
                    @click=${() =>
                      this._updateField("icon_set", o.v === "line" ? "" : o.v)}
                  >
                    ${o.l}
                  </button>`,
              )}
            </div>
            <div class="clearable-field">
              ${this._renderForm([
                { name: "icon_path", selector: { text: {} } },
              ])}
              ${(this._formData || {}).icon_path
                ? html`<button
                    type="button"
                    class="clear-btn"
                    title="Clear"
                    @click=${() => this._updateField("icon_path", "")}
                  >
                    <ha-icon icon="mdi:close"></ha-icon>
                  </button>`
                : ""}
            </div>
            <div
              class="fc-box"
              style="background:rgba(var(--rgb-primary-text-color,0,0,0),0.03)"
            >
              <div
                style="display:flex;align-items:center;gap:var(--awc-e-s2);font-size:var(--awc-e-f-meta);color:var(--secondary-text-color)"
              >
                <ha-icon
                  icon="mdi:lightbulb-outline"
                  style="--mdc-icon-size:16px;flex-shrink:0"
                ></ha-icon>
                <span
                  >Set a folder path to use your own SVG weather icons instead
                  of the built-in set.
                  <a
                    href="https://github.com/shpongledsummer/atmospheric-weather-card#weather-icons"
                    target="_blank"
                    rel="noopener"
                    style="color:var(--primary-color)"
                    >How to add them</a
                  ></span
                >
              </div>
            </div>
          </div>`,
        )}
        ${this._renderDisclosure(
          "Custom Image",
          html`
            <div class="settings-group">
              ${this._renderClearableText("image_day")}
              ${this._renderClearableText("image_night")}
            </div>
            ${this._renderSlider(
              "image_scale",
              LABELS.image_scale,
              0,
              200,
              1,
              HELPERS.image_scale,
            )}
            ${this._renderPositionGrid(
              "image_alignment",
              POSITION_GRIDS.image_alignment,
              false,
              this._renderImageOffsetInline(),
            )}
            ${this._renderDisclosure(
              "Status Override",
              this._renderForm(this._imageStatusSchema()),
            )}
          `,
        )}
        ${this._renderDisclosure(
          "Tap Action",
          html`<div class="settings-group">
            ${this._renderForm([
              { name: "card_tap_action", selector: { ui_action: {} } },
            ])}
          </div>`,
        )}</ha-expansion-panel
      >
      <ha-expansion-panel
        outlined
        .expanded=${this._openPanel === "images"}
        @expanded-changed=${(e) =>
          this._onPanelToggle("images", e.detail.expanded)}
      >
        <div slot="header" class="panel-header">
          <ha-icon icon="mdi:image-outline"></ha-icon>
          <span>Visuals</span>
        </div>
        ${this._renderImagesPanel()}</ha-expansion-panel
      >
      <ha-expansion-panel
        outlined
        .expanded=${this._openPanel === "buttons"}
        @expanded-changed=${(e) =>
          this._onPanelToggle("buttons", e.detail.expanded)}
      >
        <div slot="header" class="panel-header">
          <ha-icon icon="mdi:checkbox-multiple-blank-outline"></ha-icon>
          <span>Buttons</span>
        </div>
        ${this._renderButtonAreasEditor()}</ha-expansion-panel
      >
      <ha-expansion-panel
        outlined
        .expanded=${this._openPanel === "cards"}
        @expanded-changed=${(e) =>
          this._onPanelToggle("cards", e.detail.expanded)}
      >
        <div slot="header" class="panel-header">
          <ha-icon icon="mdi:card-outline"></ha-icon>
          <span>Cards</span>
        </div>
        <div class="info">
          Add any Home Assistant card here. You can also use grids or stacks if
          you need a specific layout.
        </div>
        ${this._renderPositionGrid(
          "custom_cards_position",
          POSITION_GRIDS.custom_cards_position,
          true,
        )}
        ${this._renderCustomCardsEditor()}</ha-expansion-panel
      >`;
  }
}
if (!customElements.get("atmospheric-weather-card-editor")) {
  customElements.define(
    "atmospheric-weather-card-editor",
    AtmosphericWeatherCardEditor,
  );
}
})();
