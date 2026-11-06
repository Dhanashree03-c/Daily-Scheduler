export type ThemeMode = "light" | "dark" | "system";

const KEY = "theme_mode";
const LEGACY_KEY = "theme";
const ACCENT_KEY = "customColor";

function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveIsDark(mode: ThemeMode): boolean {
  return mode === "dark" || (mode === "system" && systemPrefersDark());
}

export function getStoredTheme(): ThemeMode {
  const stored = localStorage.getItem(KEY) as ThemeMode | null;
  if (stored === "light" || stored === "dark" || stored === "system") return stored;

  const legacy = localStorage.getItem(LEGACY_KEY);
  if (legacy === "light" || legacy === "dark") {
    localStorage.setItem(KEY, legacy);
    localStorage.removeItem(LEGACY_KEY);
    return legacy;
  }

  return "system";
}

function hexToHslComponents(hex: string): string | null {
  const normalized = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;

  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / delta + 2) * 60;
        break;
      default:
        h = ((r - g) / delta + 4) * 60;
    }
  }

  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function applyAccentColor(hex: string) {
  const hsl = hexToHslComponents(hex);
  if (!hsl) return;
  document.documentElement.style.setProperty("--primary", hsl);
  document.documentElement.style.setProperty("--ring", hsl);
  try {
    localStorage.setItem(ACCENT_KEY, hex);
  } catch { /* ignore */ }
}

export function restoreAccentColor() {
  const saved = localStorage.getItem(ACCENT_KEY);
  if (saved) applyAccentColor(saved);
}

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  root.classList.toggle("dark", resolveIsDark(mode));
  localStorage.setItem(KEY, mode);
}

export function initTheme() {
  applyTheme(getStoredTheme());
  restoreAccentColor();

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (getStoredTheme() === "system") applyTheme("system");
  });
}
