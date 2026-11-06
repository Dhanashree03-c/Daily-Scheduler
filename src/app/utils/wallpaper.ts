/**
 * Wallpaper (background) handling.
 *
 * Previously the background was applied ONLY while Settings was mounted,
 * and only to `body` — while `#root` painted a mostly-opaque glass layer
 * on top (plus its own 60% background). Result: shades/custom images looked
 * missing, and they vanished entirely on reload until Settings was reopened.
 *
 * Now one function applies the choice inline to BOTH `body` (outside the
 * 480px column) and `#root` (inside the column, where the content lives),
 * persists it, and is called at startup so it survives reloads.
 */

export const WALLPAPER_KEY = "wallpaper";

export interface WallpaperOption {
  id: string;
  name: string;
  className: string;
  /** CSS background value to paint (inline, wins over the glass layer). */
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

function paint(el: HTMLElement | null, background: string, size: string) {
  if (!el || background === "none") return;
  el.style.backgroundImage = background;
  el.style.backgroundSize = size;
  el.style.backgroundPosition = "center";
  // Dots pattern tiles; images/gradients must not.
  el.style.backgroundRepeat = size === "20px 20px" ? "repeat" : "no-repeat";
  el.style.backgroundAttachment = "scroll";
}

export function applyWallpaper(value: string) {
  const normalized = (value ?? "").trim() || "none";
  try {
    localStorage.setItem(WALLPAPER_KEY, normalized);
  } catch {
    /* ignore */
  }

  const body = document.body;
  const root = document.getElementById("root");

  // Clear previous preset classes (kept for thumbnail styling / backwards compat).
  const presetClasses = WALLPAPER_OPTIONS.map((o) => o.className);
  body.classList.remove(...presetClasses, "has-wallpaper");
  root?.classList.remove(...presetClasses);

  // Reset inline backgrounds first so "none" fully restores the default.
  for (const el of [body, root]) {
    if (!el) continue;
    el.style.backgroundImage = "";
    el.style.backgroundSize = "";
    el.style.backgroundPosition = "";
    el.style.backgroundRepeat = "";
    el.style.backgroundAttachment = "";
    el.style.backgroundColor = "";
  }

  if (normalized === "none") return;

  const preset = WALLPAPER_OPTIONS.find((o) => o.id === normalized);
  if (preset) {
    paint(body, preset.background, preset.backgroundSize);
    paint(root, preset.background, preset.backgroundSize);
    body.classList.add("has-wallpaper");
    return;
  }

  // Custom image URL — validated by callers via preload; paint unconditionally here.
  const bg = `url("${normalized.replace(/"/g, "%22")}")`;
  paint(body, bg, "cover");
  paint(root, bg, "cover");
  body.classList.add("has-wallpaper");
}

export function initWallpaper() {
  applyWallpaper(getStoredWallpaper());
}

/** Validate a URL is a plausible http(s) image link. */
export function isValidWallpaperUrl(value: string): boolean {
  const url = value.trim();
  if (!url) return false;
  // Block data URLs / javascript: etc. — only http(s) web images.
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
    // Don't send referer surprises; keep cross-origin safe.
    img.referrerPolicy = "no-referrer";
    img.onload = () => resolve(img.naturalWidth > 0);
    img.onerror = () => resolve(false);
    img.src = url;
    // Safety: never hang the UI on a slow host.
    window.setTimeout(() => resolve(false), 12000);
  });
}
