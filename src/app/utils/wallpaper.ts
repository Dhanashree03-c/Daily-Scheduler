/**
 * Wallpaper (background) handling — scrolls-with-content version.
 *
 * Painted on the scrollable `.page-shell` content (via a CSS variable set
 * on <html>), NOT on `body` or the fixed-height `#root` shell. Because the
 * background lives on the content itself, it scrolls WITH the page like a
 * normal website background — unlike the old fixed/pinned paint.
 *
 * Fits:
 *   cover   — fills the area, crops overflow (default)
 *   contain — whole image visible, letterboxed
 *   tile    — repeats at natural size (great for patterns)
 *   stretch — forces 100% x 100% (no crop, may distort)
 */

export const WALLPAPER_KEY = "wallpaper";
export const WALLPAPER_FIT_KEY = "wallpaperFit";

export type WallpaperFit = "cover" | "contain" | "tile" | "stretch";

export const WALLPAPER_FITS: { id: WallpaperFit; name: string; blurb: string }[] = [
  { id: "cover", name: "Fill", blurb: "Covers everything, crops edges." },
  { id: "contain", name: "Fit", blurb: "Whole image visible, may letterbox." },
  { id: "tile", name: "Tile", blurb: "Repeats the image like wallpaper." },
  { id: "stretch", name: "Stretch", blurb: "Stretches to the full screen." },
];

export interface WallpaperOption {
  id: string;
  name: string;
  className: string;
  background: string;
  backgroundSize: string;
}

export const WALLPAPER_OPTIONS: WallpaperOption[] = [
  { id: "none", name: "None", className: "wallpaper-none", background: "none", backgroundSize: "auto" },
  {
    id: "gradient1",
    name: "Sunset",
    className: "wallpaper-gradient1",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    backgroundSize: "cover",
  },
  {
    id: "gradient2",
    name: "Ocean",
    className: "wallpaper-gradient2",
    background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    backgroundSize: "cover",
  },
  {
    id: "gradient3",
    name: "Forest",
    className: "wallpaper-gradient3",
    background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    backgroundSize: "cover",
  },
  {
    id: "gradient4",
    name: "Peach",
    className: "wallpaper-gradient4",
    background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    backgroundSize: "cover",
  },
  {
    id: "pattern1",
    name: "Dots",
    className: "wallpaper-pattern1",
    background: "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)",
    backgroundSize: "20px 20px",
  },
];

export function isPresetWallpaper(value: string): boolean {
  return WALLPAPER_OPTIONS.some((o) => o.id === value);
}

export function getStoredWallpaper(): string {
  try {
    return localStorage.getItem(WALLPAPER_KEY) || "none";
  } catch {
    return "none";
  }
}

export function getStoredWallpaperFit(): WallpaperFit {
  try {
    const v = localStorage.getItem(WALLPAPER_FIT_KEY);
    if (v === "contain" || v === "tile" || v === "stretch") return v;
  } catch {
    /* ignore */
  }
  return "cover";
}

export function setStoredWallpaperFit(fit: WallpaperFit) {
  try {
    localStorage.setItem(WALLPAPER_FIT_KEY, fit);
  } catch {
    /* ignore */
  }
}

function fitToStyles(fit: WallpaperFit, presetSize: string): { size: string; repeat: string } {
  switch (fit) {
    case "tile":
      return { size: presetSize === "20px 20px" ? "20px 20px" : "auto", repeat: "repeat" };
    case "contain":
      return { size: "contain", repeat: "no-repeat" };
    case "stretch":
      return { size: "100% 100%", repeat: "no-repeat" };
    case "cover":
    default:
      return { size: presetSize === "20px 20px" ? "20px 20px" : "cover", repeat: "no-repeat" };
  }
}

export function applyWallpaper(value: string, fit: WallpaperFit = getStoredWallpaperFit()) {
  const normalized = (value ?? "").trim() || "none";
  try {
    localStorage.setItem(WALLPAPER_KEY, normalized);
    localStorage.setItem(WALLPAPER_FIT_KEY, fit);
  } catch {
    /* ignore */
  }

  const body = document.body;
  const root = document.getElementById("root");
  const presetClasses = WALLPAPER_OPTIONS.map((o) => o.className);
  body.classList.remove(...presetClasses, "has-wallpaper");
  root?.classList.remove(...presetClasses);

  // Clear any legacy inline paints (older builds painted body/#root directly).
  for (const el of [body, root]) {
    if (!el) continue;
    el.style.backgroundImage = "";
    el.style.backgroundSize = "";
    el.style.backgroundPosition = "";
    el.style.backgroundRepeat = "";
    el.style.backgroundAttachment = "";
    el.style.backgroundColor = "";
    el.style.backdropFilter = "";
  }

  const html = document.documentElement;

  if (normalized === "none") {
    html.style.setProperty("--wallpaper-bg", "none");
    html.style.setProperty("--wallpaper-size", "auto");
    html.style.setProperty("--wallpaper-repeat", "no-repeat");
    return;
  }

  const preset = WALLPAPER_OPTIONS.find((o) => o.id === normalized);
  const background = preset
    ? preset.background
    : `url("${normalized.replace(/"/g, "%22")}")`;
  const presetSize = preset ? preset.backgroundSize : "cover";
  const { size, repeat } = fitToStyles(fit, presetSize);

  // One CSS variable drives `.page-shell` — the scrolling content — so the
  // wallpaper moves with you as you scroll, like a normal page background.
  html.style.setProperty("--wallpaper-bg", background);
  html.style.setProperty("--wallpaper-size", size);
  html.style.setProperty("--wallpaper-repeat", repeat);
  body.classList.add("has-wallpaper");
}

export function initWallpaper() {
  applyWallpaper(getStoredWallpaper(), getStoredWallpaperFit());
}

/** CSS background value for the current selection (for preview cards). */
export function wallpaperBackground(value: string): string {
  const normalized = (value ?? "").trim() || "none";
  if (normalized === "none") return "none";
  const preset = WALLPAPER_OPTIONS.find((o) => o.id === normalized);
  if (preset) return preset.background;
  return `url("${normalized.replace(/"/g, "%22")}")`;
}

export function wallpaperBackgroundSize(value: string, fit: WallpaperFit = getStoredWallpaperFit()): string {
  const preset = WALLPAPER_OPTIONS.find((o) => o.id === value);
  const presetSize = preset ? preset.backgroundSize : "cover";
  return fitToStyles(fit, presetSize).size;
}

/** Validate a URL is a plausible http(s) image link. */
export function isValidWallpaperUrl(value: string): boolean {
  const url = value.trim();
  if (!url) return false;
  if (!/^https?:\/\//i.test(url)) return false;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Preload an image URL; resolves true only if it actually loads as an image. */
export function preloadWallpaperImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.referrerPolicy = "no-referrer";
    img.onload = () => resolve(img.naturalWidth > 0);
    img.onerror = () => resolve(false);
    img.src = url;
    window.setTimeout(() => resolve(false), 12000);
  });
}
