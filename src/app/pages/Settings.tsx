import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Palette, ImageIcon, Moon, Sun, Monitor, Download, Bell, Wifi, WifiOff, RotateCcw } from "lucide-react";
import { isAppInstalled, promptInstall, requestNotificationPermission } from "../utils/pwa";
import { applyTheme, applyAccentColor, getStoredTheme, type ThemeMode } from "../utils/theme";
import { previewTaskNotification } from "../utils/notifications";
import { getAllItems } from "../utils/storage";
import { getLocalDateStr } from "../utils/date";
import { cn } from "../components/ui/utils";

interface WallpaperOption {
  id: string;
  name: string;
  className: string;
}

const WALLPAPER_OPTIONS: WallpaperOption[] = [
  { id: "none", name: "None", className: "wallpaper-none" },
  { id: "gradient1", name: "Sunset", className: "wallpaper-gradient1" },
  { id: "gradient2", name: "Ocean", className: "wallpaper-gradient2" },
  { id: "gradient3", name: "Forest", className: "wallpaper-gradient3" },
  { id: "gradient4", name: "Peach", className: "wallpaper-gradient4" },
  { id: "pattern1", name: "Dots", className: "wallpaper-pattern1" },
];

const DEFAULT_ACCENT = "#7c3aed";

export function Settings() {
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme());
  const [wallpaper, setWallpaper] = useState<string>(() => {
    try {
      return localStorage.getItem("wallpaper") || "none";
    } catch {
      return "none";
    }
  });
  const [wallpaperUrl, setWallpaperUrl] = useState("");
  const [customColor, setCustomColor] = useState<string>(() => {
    try {
      return localStorage.getItem("customColor") || DEFAULT_ACCENT;
    } catch {
      return DEFAULT_ACCENT;
    }
  });
  const [installed, setInstalled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    setInstalled(isAppInstalled());
    if ("Notification" in window) setNotificationPermission(Notification.permission);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem("wallpaper", wallpaper);
    } catch { /* ignore */ }
    const isPreset = WALLPAPER_OPTIONS.some((o) => o.id === wallpaper);
    document.body.classList.remove(...WALLPAPER_OPTIONS.map((o) => o.className));
    document.body.classList.remove("has-wallpaper");
    document.body.style.backgroundImage = "";
    if (isPreset) {
      const option = WALLPAPER_OPTIONS.find((o) => o.id === wallpaper)!;
      if (option.id !== "none") document.body.classList.add(option.className, "has-wallpaper");
    } else if (wallpaper !== "none") {
      document.body.style.backgroundImage = `url(${wallpaper})`;
      document.body.classList.add("has-wallpaper");
    }
  }, [wallpaper]);

  useEffect(() => {
    applyAccentColor(customColor);
  }, [customColor]);

  const handleInstallApp = async () => {
    const success = await promptInstall();
    if (success) {
      setInstalled(true);
      toast.success("Installing… 🎉");
    } else {
      toast.error("Install not available here", {
        description: "On iPhone, tap Share → “Add to Home Screen”. On desktop, use the browser install icon.",
      });
    }
  };

  const handleRequestNotifications = async () => {
    const permission = await requestNotificationPermission();
    setNotificationPermission(permission);
    if (permission === "granted") toast.success("Notifications on 🔔", { description: "You'll get reminders for your tasks." });
    else if (permission === "denied") toast.error("Notifications blocked", { description: "Allow notifications in your browser site settings." });
    else toast.info("Notifications not enabled", { description: "You can enable them any time from here or your browser settings." });
  };

  const handleTestNotification = async () => {
    const tasks = getAllItems();
    const target =
      tasks.find((t) => t.date === getLocalDateStr() && t.alarmEnabled) ?? tasks.find((t) => t.alarmEnabled);
    if (!target) {
      toast.info("No alarm task yet", {
        description: "Add a task with the reminder switch on, then test here.",
      });
      return;
    }
    if (notificationPermission === "default") {
      await handleRequestNotifications();
    }
    void previewTaskNotification(target);
    toast.success("Test notification sent 🔔", {
      description: `Preview for "${target.title}" — look above the bottom bar.`,
    });
  };

  const applyWallpaperUrl = () => {
    const url = wallpaperUrl.trim();
    if (!url) {
      toast.error("Paste an image link first", { description: "Add a direct image URL to use a custom background." });
      return;
    }
    try {
      const parsed = new URL(url);
      if (!/^https?:$/.test(parsed.protocol)) throw new Error("bad protocol");
    } catch {
      toast.error("That doesn't look like a valid URL", { description: "Check the link and try again." });
      return;
    }
    setWallpaper(url);
    toast.success("Custom background applied 🖼️");
  };

  const themeOptions: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
    { mode: "light", label: "Light", icon: Sun },
    { mode: "dark", label: "Dark", icon: Moon },
    { mode: "system", label: "System", icon: Monitor },
  ];

  return (
    <main className="page-shell max-w-2xl mx-auto" aria-label="Settings">
      <div className="page-head">
        <div>
          <p className="page-subtitle mb-0.5">Make it yours ✨</p>
          <h1 className="page-title">Settings</h1>
        </div>
      </div>

      <section className="settings-card" aria-label="App settings">
        <h2 className="text-base font-bold mb-3 flex items-center gap-2">
          <Download className="size-5 text-primary" aria-hidden /> App
        </h2>

        <div className="settings-row">
          <div className="flex items-center gap-3">
            <Download className="size-5 text-muted-foreground" aria-hidden />
            <div>
              <div className="font-medium">Install app</div>
              <div className="text-xs text-muted-foreground">
                {installed ? "Installed on this device" : "Add to home screen for quick access"}
              </div>
            </div>
          </div>
          {installed ? (
            <span className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-1.5" role="status">
              <span aria-hidden>✓</span> Installed
            </span>
          ) : (
            <button type="button" onClick={handleInstallApp} className="min-h-11 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
              Install
            </button>
          )}
        </div>

        <div className="settings-row">
          <div className="flex items-center gap-3">
            <Bell className="size-5 text-muted-foreground" aria-hidden />
            <div>
              <div className="font-medium">Notifications</div>
              <div className="text-xs text-muted-foreground">
                {notificationPermission === "granted"
                  ? "On — reminders enabled"
                  : notificationPermission === "denied"
                    ? "Blocked — open browser site settings to allow"
                    : "Get reminders for your tasks"}
              </div>
            </div>
          </div>
          {notificationPermission === "granted" ? (
            <div className="flex items-center gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold" role="status">✓ On</span>
              <button type="button" onClick={handleTestNotification} className="min-h-11 px-3 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-accent transition-colors">
                Test 🔔
              </button>
            </div>
          ) : notificationPermission === "denied" ? (
            <span className="text-rose-500 text-sm font-semibold" role="status">Blocked</span>
          ) : (
            <button type="button" onClick={handleRequestNotifications} className="min-h-11 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
              Enable
            </button>
          )}
        </div>

        <div className="settings-row">
          <div className="flex items-center gap-3">
            {isOnline ? <Wifi className="size-5 text-muted-foreground" aria-hidden /> : <WifiOff className="size-5 text-muted-foreground" aria-hidden />}
            <div>
              <div className="font-medium">Connection</div>
              <div className="text-xs text-muted-foreground">
                {isOnline ? "Online — everything works" : "Offline — still works! Data is saved on this device."}
              </div>
            </div>
          </div>
          <span className={cn("text-sm font-semibold", isOnline ? "text-emerald-600 dark:text-emerald-400" : "text-orange-500")} role="status">
            {isOnline ? "● Online" : "● Offline"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Your tasks, notes, and goals live on this device — no account or sync needed. After saving a task, a preview pops above the bottom bar and a system notification fires if allowed.
        </p>
      </section>

      <section className="settings-card" aria-label="Theme">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="size-5 text-primary" aria-hidden />
          <h2 className="text-base font-bold">Theme</h2>
        </div>
        <div className="flex gap-2" role="radiogroup" aria-label="Theme mode">
          {themeOptions.map(({ mode, label, icon: Icon }) => (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={theme === mode}
              aria-pressed={theme === mode}
              onClick={() => setTheme(mode)}
              className={cn("theme-btn", theme === mode && "theme-btn-active")}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-card" aria-label="Accent color">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="size-5 text-primary" aria-hidden />
          <h2 className="text-base font-bold">Accent color</h2>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <label htmlFor="accent-color-input" className="text-sm font-semibold">Pick a color</label>
          <input
            id="accent-color-input"
            type="color"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            aria-label="Choose accent color"
            className="w-16 h-12 rounded-lg border border-border cursor-pointer bg-transparent"
          />
          <span className="text-sm text-muted-foreground font-mono">{customColor}</span>
          <button
            type="button"
            onClick={() => {
              setCustomColor(DEFAULT_ACCENT);
              toast.success("Reset to default violet 💜");
            }}
            className="min-h-11 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-accent transition-colors"
          >
            <RotateCcw className="size-4" aria-hidden /> Reset
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Tip: very light colors may make white text hard to read — mid-tone colors look best.</p>
      </section>

      <section className="settings-card" aria-label="Background">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon className="size-5 text-primary" aria-hidden />
          <h2 className="text-base font-bold">Background</h2>
        </div>
        <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Background style">
          {WALLPAPER_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={wallpaper === option.id}
              onClick={() => setWallpaper(option.id)}
              aria-label={`Background: ${option.name}`}
              className={cn(
                "aspect-square rounded-xl border-2 overflow-hidden transition-all hover:scale-[1.02] min-h-11",
                option.className,
                wallpaper === option.id ? "border-primary ring-2 ring-primary/30" : "border-border"
              )}
            >
              <span className="sr-only">{option.name}{wallpaper === option.id ? " (selected)" : ""}</span>
              {option.id === "none" && (
                <span className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-semibold">None</span>
              )}
              {wallpaper === option.id && option.id !== "none" && (
                <span className="w-full h-full flex items-end justify-center pb-1 text-[10px] font-bold text-white drop-shadow">{option.name} ✓</span>
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">Tap a style above — it applies instantly.</p>
      </section>

      <section className="settings-card" aria-label="Custom background">
        <label htmlFor="custom-wallpaper-url" className="mb-2 block font-semibold">Custom image URL</label>
        <div className="flex gap-2 flex-wrap">
          <input
            id="custom-wallpaper-url"
            type="url"
            placeholder="https://…/your-wallpaper.jpg"
            value={wallpaperUrl}
            onChange={(e) => setWallpaperUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyWallpaperUrl();
            }}
            aria-describedby="wp-help"
            className="flex-1 min-w-52 min-h-11 px-3 py-2.5 border border-border rounded-xl bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
          <button type="button" onClick={applyWallpaperUrl} className="min-h-11 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90">Apply</button>
        </div>
        <p id="wp-help" className="text-xs text-muted-foreground mt-2">Paste a direct link to any image, then press Apply or Enter.</p>
        <p className="text-xs text-muted-foreground mt-1">Reminders fire while the app is open. Keep it open on your home screen for the best experience.</p>
      </section>
    </main>
  );
}
