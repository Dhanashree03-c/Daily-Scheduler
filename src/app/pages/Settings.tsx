import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Palette, ImageIcon, Moon, Sun, Monitor, Download, Bell, Wifi, WifiOff, RotateCcw } from "lucide-react";
import { isAppInstalled, promptInstall, requestNotificationPermission } from "../utils/pwa";
import { applyTheme, applyAccentColor, getStoredTheme, type ThemeMode } from "../utils/theme";
import { previewTaskNotification } from "../utils/notifications";
import { getAllItems } from "../utils/storage";
import { getLocalDateStr } from "../utils/date";
import { syncAlarmsToServiceWorker, requestWakeLock } from "../utils/alarmScheduler";
import {
  applyWallpaper,
  getStoredWallpaper,
  getStoredWallpaperFit,
  isPresetWallpaper,
  isValidWallpaperUrl,
  preloadWallpaperImage,
  WALLPAPER_FITS,
  WALLPAPER_OPTIONS,
  type WallpaperFit,
} from "../utils/wallpaper";
import { ALARM_TONES, getStoredAlarmTone, playAlarmTone, setStoredAlarmTone, type AlarmToneId } from "../utils/alarmTones";
import { cn } from "../components/ui/utils";

const DEFAULT_ACCENT = "#7c3aed";

export function Settings() {
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme());
  const [wallpaper, setWallpaper] = useState<string>(() => getStoredWallpaper());
  const [wallpaperUrl, setWallpaperUrl] = useState(() => {
    const stored = getStoredWallpaper();
    return stored !== "none" && !isPresetWallpaper(stored) ? stored : "";
  });
  const [applyingWallpaper, setApplyingWallpaper] = useState(false);
  const isCustomWallpaper = wallpaper !== "none" && !isPresetWallpaper(wallpaper);
  const [wallpaperFit, setWallpaperFit] = useState<WallpaperFit>(() => getStoredWallpaperFit());
  const [alarmTone, setAlarmTone] = useState<AlarmToneId>(() => getStoredAlarmTone());
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
  const [wakeLockState, setWakeLockState] = useState<string>("Unknown");
  const [serviceWorkerState, setServiceWorkerState] = useState<string>("Registering…");

  useEffect(() => {
    setInstalled(isAppInstalled());
    if ("Notification" in window) setNotificationPermission(Notification.permission);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    if ("wakeLock" in navigator) {
      setWakeLockState("Supported — requested while app is open");
    } else {
      setWakeLockState("Not supported on this browser");
    }
    navigator.serviceWorker?.ready
      .then((reg) => {
        setServiceWorkerState(reg.active ? "Active — ringing even if you close this tab" : "Waiting…");
        void syncAlarmsToServiceWorker(getAllItems());
      })
      .catch(() => setServiceWorkerState("Unavailable"));
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    // Centralized: paints one continuous background on body and matches
    // what initWallpaper() does on reload.
    applyWallpaper(wallpaper, wallpaperFit);
  }, [wallpaper, wallpaperFit]);

  useEffect(() => {
    setStoredAlarmTone(alarmTone);
  }, [alarmTone]);

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

  const handleKeepAwake = async () => {
    const ok = await requestWakeLock();
    if (ok) {
      setWakeLockState("On — screen woken while app is open");
      toast.success("Keeping your screen awake 🔆", {
        description: "Alarms will fire on time even with the screen off (while this app stays open).",
      });
    } else {
      setWakeLockState("Unavailable or blocked");
      toast.error("Wake lock unavailable", {
        description: "Your browser/OS blocked it — alarms still ring while the app is open.",
      });
    }
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

  const selectWallpaper = (id: string, name: string) => {
    setWallpaper(id);
    toast.success(`${name} background applied 🖼️`, {
      description: "Look behind the cards — it's live everywhere.",
    });
  };

  const applyWallpaperUrl = async () => {
    const url = wallpaperUrl.trim();
    if (!url) {
      toast.error("Paste an image link first", { description: "Add a direct image URL to use a custom background." });
      return;
    }
    if (!isValidWallpaperUrl(url)) {
      toast.error("Use an http(s) image link", {
        description: "Copy the direct link to the image (ends in .jpg/.png/.webp), not a page or Google Drive link.",
      });
      return;
    }
    if (applyingWallpaper) return;
    setApplyingWallpaper(true);
    try {
      const ok = await preloadWallpaperImage(url);
      if (!ok) {
        toast.error("Couldn't load that image", {
          description: "Check the link is a direct image and try again.",
        });
        return;
      }
      setWallpaper(url);
      toast.success("Custom background applied 🖼️");
    } finally {
      setApplyingWallpaper(false);
    }
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
        <div className="mt-3 rounded-2xl bg-accent p-3 text-xs leading-relaxed">
          <p className="font-bold">📱 Run it like a real Android app:</p>
          <ol className="list-decimal pl-4 mt-1 space-y-0.5 text-muted-foreground">
            <li>Open your deployed link in <strong>Chrome</strong> (HTTPS) → tap <strong>⋮ → Install app / Add to Home screen</strong>.</li>
            <li>Grant <strong>Notifications</strong> when asked, then in Android <em>Settings → Apps → DayFlow → Notifications</em> allow <strong>Sounds + Vibration</strong>.</li>
            <li>Keep the installed app open (or the browser) — see Alarm behaviour below for on-time ringing.</li>
          </ol>
        </div>
      </section>

      <section className="settings-card" aria-label="Alarm behaviour">
        <h2 className="text-base font-bold mb-2 flex items-center gap-2">
          <Bell className="size-5 text-primary" aria-hidden /> Alarm behaviour
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Alarms now ring in three ways so they don&apos;t die with the tab:
        </p>
        <ul className="text-xs text-muted-foreground leading-relaxed list-disc pl-4 mt-1 space-y-1">
          <li><strong className="text-foreground">Service worker:</strong> {serviceWorkerState}. Scheduled alarms still fire if you close/minimise this tab (browser kept open).</li>
          <li><strong className="text-foreground">Wake lock:</strong> {wakeLockState}.</li>
          <li><strong className="text-foreground">Catch-up:</strong> anything missed while the app was closed fires as “Missed” the moment you reopen.</li>
        </ul>
        <div className="flex gap-2 mt-3 flex-wrap">
          <button type="button" onClick={handleKeepAwake} className="min-h-11 px-3 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-accent transition-colors">
            Keep screen awake 🔆
          </button>
          <button type="button" onClick={handleTestNotification} className="min-h-11 px-3 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-accent transition-colors">
            Test alarm 🔔
          </button>
        </div>
        <div className="mt-4 pt-3 border-t border-border">
          <h3 className="text-sm font-bold mb-2">Alarm tones 🎵</h3>
          <p className="text-xs text-muted-foreground mb-3">Synthesized live — no files needed. Plays when an alarm pops in the app. (OS notifications keep the system sound.)</p>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Alarm tone">
            {ALARM_TONES.map((tone) => {
              const selected = alarmTone === tone.id;
              return (
                <div
                  key={tone.id}
                  className={cn(
                    "rounded-2xl border-2 p-3 transition-all",
                    selected ? "border-primary bg-accent" : "border-border hover:border-primary/40"
                  )}
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-pressed={selected}
                    onClick={() => {
                      setAlarmTone(tone.id);
                      playAlarmTone(tone.id);
                    }}
                    className="w-full text-left"
                  >
                    <span className={cn("flex size-9 items-center justify-center rounded-xl text-white bg-gradient-to-br mb-2", tone.gradient)}>
                      <span aria-hidden className="text-lg">{tone.emoji}</span>
                    </span>
                    <span className="block text-sm font-bold">{tone.name}{selected ? " ✓" : ""}</span>
                    <span className="block text-xs text-muted-foreground mt-0.5 leading-snug">{tone.blurb}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => playAlarmTone(tone.id)}
                    className="min-h-9 w-full mt-2 px-2 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90"
                    aria-label={`Preview ${tone.name} tone`}
                  >
                    ▶ Preview
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
          Honest limit: without a server doing Web Push, no local-only web page can wake the OS after the browser
          itself is fully closed &amp; killed. For a guaranteed ring in that case you&apos;d need a push server or a native
          app. Everything above is the best a PWA can do — keep the browser/app open for on-time rings.
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
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="size-5 text-primary" aria-hidden />
            <h2 className="text-base font-bold">Background</h2>
          </div>
          <span className="text-xs text-muted-foreground" role="status">
            {isCustomWallpaper ? "Custom image" : wallpaper === "none" ? "Default" : `${WALLPAPER_OPTIONS.find((o) => o.id === wallpaper)?.name ?? wallpaper} applied`}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Background style">
          {WALLPAPER_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={wallpaper === option.id}
              aria-pressed={wallpaper === option.id}
              onClick={() => selectWallpaper(option.id, option.name)}
              aria-label={`Background: ${option.name}`}
              className={cn(
                "aspect-square rounded-xl border-2 overflow-hidden relative transition-all hover:scale-[1.02] min-h-11",
                option.className,
                wallpaper === option.id ? "border-primary ring-2 ring-primary/40 scale-[1.03]" : "border-border"
              )}
            >
              <span className="sr-only">{option.name}{wallpaper === option.id ? " (selected)" : ""}</span>
              {option.id === "none" && (
                <span className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-semibold">None</span>
              )}
              {wallpaper === option.id && option.id !== "none" && (
                <span className="absolute bottom-1 inset-x-0 text-center text-[10px] font-bold text-white drop-shadow">{option.name} ✓</span>
              )}
            </button>
          ))}
          {isCustomWallpaper && (
            <button
              type="button"
              role="radio"
              aria-checked
              aria-pressed
              onClick={() => selectWallpaper(wallpaper, "Custom")}
              aria-label="Background: Custom image (current)"
              className="aspect-square rounded-xl border-2 border-primary ring-2 ring-primary/40 overflow-hidden relative min-h-11"
              style={{ backgroundImage: `url("${wallpaper}")`, backgroundSize: "cover", backgroundPosition: "center" }}
            >
              <span className="sr-only">Custom image (selected)</span>
              <span className="absolute bottom-1 inset-x-0 text-center text-[10px] font-bold text-white drop-shadow">Custom ✓</span>
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-3">Tap a style above — it paints as one seamless background behind every tab (no seams), and survives reloads.</p>
        <div className="mt-4">
          <p id="wallpaper-fit-label" className="text-sm font-bold mb-2">How it spreads 🖼️</p>
          <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-labelledby="wallpaper-fit-label">
            {WALLPAPER_FITS.map((fit) => (
              <button
                key={fit.id}
                type="button"
                role="radio"
                aria-checked={wallpaperFit === fit.id}
                aria-pressed={wallpaperFit === fit.id}
                title={fit.blurb}
                onClick={() => {
                  setWallpaperFit(fit.id);
                  toast.success(`${fit.name} applied`, { description: fit.blurb });
                }}
                className={cn(
                  "min-h-11 px-2 py-2 rounded-xl border-2 text-xs font-bold transition-all",
                  wallpaperFit === fit.id ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border hover:bg-accent"
                )}
              >
                {fit.name}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">{WALLPAPER_FITS.find((f) => f.id === wallpaperFit)?.blurb}</p>
        </div>
        {isCustomWallpaper && (
          <button
            type="button"
            onClick={() => selectWallpaper("none", "Default")}
            className="mt-2 min-h-11 px-3 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-accent transition-colors"
          >
            Remove custom image
          </button>
        )}
      </section>

      <section className="settings-card" aria-label="Custom background">
        <label htmlFor="custom-wallpaper-url" className="mb-2 block font-semibold">Custom image URL</label>
        <div className="flex gap-2 flex-wrap">
          <input
            id="custom-wallpaper-url"
            type="url"
            inputMode="url"
            placeholder="https://…/your-wallpaper.jpg"
            value={wallpaperUrl}
            onChange={(e) => setWallpaperUrl(e.target.value)}
            onPaste={(e) => {
              // Apply immediately on paste so users don't have to find Apply.
              const pasted = e.clipboardData.getData("text").trim();
              if (pasted) {
                setWallpaperUrl(pasted);
                // Validate + apply in the next tick once state is set.
                window.setTimeout(() => {
                  const url = pasted;
                  if (isValidWallpaperUrl(url)) {
                    setApplyingWallpaper(true);
                    preloadWallpaperImage(url).then((ok) => {
                      setApplyingWallpaper(false);
                      if (ok) {
                        setWallpaper(url);
                        toast.success("Custom background applied 🖼️");
                      } else {
                        toast.error("Couldn't load that image", {
                          description: "Check the link is a direct image and try again.",
                        });
                      }
                    });
                  }
                }, 0);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void applyWallpaperUrl();
              }
            }}
            aria-describedby="wp-help"
            className="flex-1 min-w-52 min-h-11 px-3 py-2.5 border border-border rounded-xl bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
          <button
            type="button"
            onClick={() => void applyWallpaperUrl()}
            disabled={applyingWallpaper}
            className="min-h-11 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {applyingWallpaper ? "Loading…" : "Apply"}
          </button>
        </div>
        {wallpaperUrl.trim() && (() => {
          const valid = isValidWallpaperUrl(wallpaperUrl.trim());
          return (
            <p id="wp-help" className={cn("text-xs mt-2", valid ? "text-muted-foreground" : "text-destructive font-medium")} role={valid ? undefined : "alert"}>
              {valid ? "Looks good — press Apply or Enter. We'll check it loads first." : "Enter a direct image link (https://…/photo.jpg). Pages like Drive share links won't work."}
            </p>
          );
        })()}
        {!wallpaperUrl.trim() && (
          <p id="wp-help" className="text-xs text-muted-foreground mt-2">Paste a direct link to any image — it applies right away on paste, Apply, or Enter.</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">Reminders fire while the app is open. Keep it open on your home screen for the best experience.</p>
      </section>
    </main>
  );
}
