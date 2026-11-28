export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  textMain: string;
  textMuted: string;
}

export interface CuratedColorPalette {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
}

export const CURATED_COLOR_PALETTES: CuratedColorPalette[] = [
  {
    id: 'navy-executive',
    name: 'كحلي ليلي فخم (داكن احترافي)',
    description: 'خلفية كحلية عميقة مع بطاقات بارزة وأزرار زرقاء ساطعة',
    colors: {
      primary: '#3b82f6',
      secondary: '#0d9488',
      background: '#071326',
      surface: '#0f1f3d',
      textMain: '#f8fafc',
      textMuted: '#94a3b8',
    },
  },
  {
    id: 'slate-obsidian',
    name: 'أسود تقني حديث',
    description: 'تصميم ليلي أنيق يناسب المستقلين والتقنية',
    colors: {
      primary: '#6366f1',
      secondary: '#06b6d4',
      background: '#0b0f19',
      surface: '#111827',
      textMain: '#f9fafb',
      textMuted: '#9ca3af',
    },
  },
  {
    id: 'emerald-midnight',
    name: 'زمردي داكن ملكي',
    description: 'درجات الأخضر الليلي الهادئ مع إبراز زمردي',
    colors: {
      primary: '#10b981',
      secondary: '#0d9488',
      background: '#061614',
      surface: '#0d2622',
      textMain: '#ecfdf5',
      textMuted: '#99b8b0',
    },
  },
  {
    id: 'executive-light',
    name: 'أبيض كلاسيكي احترافي',
    description: 'خلفية فاتحة نظيفة مع بطاقات بيضاء ولمسة فيروزية',
    colors: {
      primary: '#0d9488',
      secondary: '#0f172a',
      background: '#f8fafc',
      surface: '#ffffff',
      textMain: '#0f172a',
      textMuted: '#64748b',
    },
  },
  {
    id: 'royal-blue-light',
    name: 'أزرق سماوي ناصع',
    description: 'واجهة فاتحة بلمسة زرقاء رسمية للاستشارات والتدريب',
    colors: {
      primary: '#2563eb',
      secondary: '#0ea5e9',
      background: '#f0f7ff',
      surface: '#ffffff',
      textMain: '#0f172a',
      textMuted: '#475569',
    },
  },
  {
    id: 'cream-luxury',
    name: 'كريمي ذهبي دافئ',
    description: 'طابع دافئ وراقي يناسب العلامات التراثية والفاخرة',
    colors: {
      primary: '#92400e',
      secondary: '#d97706',
      background: '#fdfbf7',
      surface: '#ffffff',
      textMain: '#451a03',
      textMuted: '#78716c',
    },
  },
];

/**
 * Normalizes any `#rgb` / `#rrggbb` hex string to a valid lowercase `#rrggbb` string
 * so `<input type="color" />` controls never break on partial or shorthand values.
 */
export function toSafeColorInputHex(color: string | undefined | null, fallback = '#0f172a'): string {
  const safeFallback = /^#[0-9a-fA-F]{6}$/.test(fallback) ? fallback.toLowerCase() : '#0f172a';
  if (!color || typeof color !== 'string') return safeFallback;

  let cleaned = color.trim();
  if (!cleaned.startsWith('#')) cleaned = `#${cleaned}`;

  const shortMatch = cleaned.match(/^#([0-9a-fA-F]{3})$/);
  if (shortMatch) {
    const [r, g, b] = shortMatch[1].split('');
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  if (/^#[0-9a-fA-F]{6}$/.test(cleaned)) {
    return cleaned.toLowerCase();
  }

  return safeFallback;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const safe = toSafeColorInputHex(hex, '#0f172a');
  const num = parseInt(safe.slice(1), 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
  );
}

/**
 * Computes perceived brightness [0..1] for adaptive surface, border, and contrast checks.
 */
export function getHexLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const toLinear = (c: number) => {
    const srgb = c / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function isDarkColor(hex: string): boolean {
  return getHexLuminance(hex) < 0.42;
}

/**
 * Mixes two hex colors linearly by ratio t in [0..1] towards colorB.
 */
function mixHex(colorA: string, colorB: string, t: number): string {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  return rgbToHex(
    a.r + (b.r - a.r) * t,
    a.g + (b.g - a.g) * t,
    a.b + (b.b - a.b) * t
  );
}

/**
 * Updates theme colors when background changes so cards and text keep crisp contrast
 * even when switching between light and dark backgrounds with a single click.
 */
export function applySmartBackgroundChange(
  currentColors: Partial<ThemeColors> | undefined,
  rawNewBg: string
): ThemeColors {
  const current: ThemeColors = {
    primary: currentColors?.primary || '#0d9488',
    secondary: currentColors?.secondary || '#0f172a',
    background: currentColors?.background || '#f8fafc',
    surface: currentColors?.surface || '#ffffff',
    textMain: currentColors?.textMain || '#0f172a',
    textMuted: currentColors?.textMuted || '#64748b',
  };

  if (!/^#?[0-9a-fA-F]{6}$/.test(rawNewBg.trim())) {
    // Allow partial manual typing in hex box without scrambling sibling colors yet
    return { ...current, background: rawNewBg };
  }

  const newBg = toSafeColorInputHex(rawNewBg, current.background);
  const nextIsDark = isDarkColor(newBg);
  const oldSurfaceIsDark = isDarkColor(current.surface);
  const oldTextIsDark = isDarkColor(current.textMain);

  const nextSurface =
    nextIsDark !== oldSurfaceIsDark
      ? nextIsDark
        ? mixHex(newBg, '#ffffff', 0.08)
        : '#ffffff'
      : current.surface;

  const nextTextMain =
    nextIsDark && oldTextIsDark
      ? '#f8fafc'
      : !nextIsDark && !oldTextIsDark
      ? '#0f172a'
      : current.textMain;

  const nextTextMuted =
    nextIsDark && oldTextIsDark
      ? '#94a3b8'
      : !nextIsDark && !oldTextIsDark
      ? '#64748b'
      : current.textMuted;

  return {
    ...current,
    background: newBg,
    surface: nextSurface,
    textMain: nextTextMain,
    textMuted: nextTextMuted,
  };
}

export interface ResolvedStorePalette extends ThemeColors {
  isDark: boolean;
  isSurfaceDark: boolean;
  headerBg: string;
  surfaceAlt: string;
  border: string;
  inputBg: string;
}

/**
 * Resolves safe, high-contrast runtime surface/text/border palette tokens from merchant theme colors.
 */
export function resolveStorePalette(
  colors?: Partial<ThemeColors> | null,
  fallbackPrimary?: string | null
): ResolvedStorePalette {
  const primary = toSafeColorInputHex(colors?.primary || fallbackPrimary, '#0d9488');
  const secondary = toSafeColorInputHex(colors?.secondary, '#0f172a');
  const background = toSafeColorInputHex(colors?.background, '#f8fafc');
  const bgDark = isDarkColor(background);

  const rawSurface = colors?.surface ? toSafeColorInputHex(colors.surface, bgDark ? '#0f1f3d' : '#ffffff') : (bgDark ? mixHex(background, '#ffffff', 0.08) : '#ffffff');
  const surface = rawSurface;
  const surfaceDark = isDarkColor(surface);

  // Guarantee legible contrast if text polarity matches surface polarity (e.g. legacy partial themeConfig)
  const rawTextMain = colors?.textMain ? toSafeColorInputHex(colors.textMain, surfaceDark ? '#f8fafc' : '#0f172a') : (surfaceDark ? '#f8fafc' : '#0f172a');
  const textMain =
    surfaceDark && isDarkColor(rawTextMain)
      ? '#f8fafc'
      : !surfaceDark && !isDarkColor(rawTextMain)
      ? '#0f172a'
      : rawTextMain;

  const rawTextMuted = colors?.textMuted ? toSafeColorInputHex(colors.textMuted, surfaceDark ? '#94a3b8' : '#64748b') : (surfaceDark ? '#94a3b8' : '#64748b');
  const textMuted =
    surfaceDark && isDarkColor(rawTextMuted)
      ? '#94a3b8'
      : !surfaceDark && !isDarkColor(rawTextMuted)
      ? '#64748b'
      : rawTextMuted;

  const sRgb = hexToRgb(surface);
  const headerBg = `rgba(${sRgb.r}, ${sRgb.g}, ${sRgb.b}, 0.94)`;
  const surfaceAlt = surfaceDark ? mixHex(surface, '#ffffff', 0.07) : mixHex(surface, '#0f172a', 0.04);
  const inputBg = surfaceDark ? mixHex(background, '#ffffff', 0.05) : '#f8fafc';
  const border = surfaceDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.10)';

  return {
    primary,
    secondary,
    background,
    surface,
    textMain,
    textMuted,
    isDark: bgDark,
    isSurfaceDark: surfaceDark,
    headerBg,
    surfaceAlt,
    border,
    inputBg,
  };
}
