import { useState, useEffect } from 'react';
import { Palette, ImageIcon, Moon, Sun, Monitor, Download, Bell, Wifi, WifiOff } from 'lucide-react';
import { isAppInstalled, promptInstall, requestNotificationPermission } from '../utils/pwa';
import { applyTheme, applyAccentColor, getStoredTheme, type ThemeMode } from '../utils/theme';

interface WallpaperOption {
  id: string;
  name: string;
  className: string;
}

const WALLPAPER_OPTIONS: WallpaperOption[] = [
  { id: 'none', name: 'None', className: 'wallpaper-none' },
  { id: 'gradient1', name: 'Sunset', className: 'wallpaper-gradient1' },
  { id: 'gradient2', name: 'Ocean', className: 'wallpaper-gradient2' },
  { id: 'gradient3', name: 'Forest', className: 'wallpaper-gradient3' },
  { id: 'gradient4', name: 'Peach', className: 'wallpaper-gradient4' },
  { id: 'pattern1', name: 'Dots', className: 'wallpaper-pattern1' },
];

export function Settings() {
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme());

  const [wallpaper, setWallpaper] = useState<string>(() => {
    return localStorage.getItem('wallpaper') || 'none';
  });

  const [customColor, setCustomColor] = useState<string>(() => {
    return localStorage.getItem('customColor') || '#7c3aed';
  });

  const [installed, setInstalled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    setInstalled(isAppInstalled());
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('wallpaper', wallpaper);

    const isPreset = WALLPAPER_OPTIONS.some((o) => o.id === wallpaper);
    document.body.classList.remove(...WALLPAPER_OPTIONS.map((o) => o.className));
    document.body.classList.remove('has-wallpaper');
    document.body.style.backgroundImage = '';

    if (isPreset) {
      const option = WALLPAPER_OPTIONS.find((o) => o.id === wallpaper)!;
      if (option.id !== 'none') {
        document.body.classList.add(option.className, 'has-wallpaper');
      }
    } else if (wallpaper !== 'none') {
      document.body.style.backgroundImage = `url(${wallpaper})`;
      document.body.classList.add('has-wallpaper');
    }
  }, [wallpaper]);

  useEffect(() => {
    applyAccentColor(customColor);
  }, [customColor]);

  const handleInstallApp = async () => {
    const success = await promptInstall();
    if (success) {
      setInstalled(true);
    }
  };

  const handleRequestNotifications = async () => {
    const permission = await requestNotificationPermission();
    setNotificationPermission(permission);
  };

  const themeOptions: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
    { mode: 'light', label: 'Light', icon: Sun },
    { mode: 'dark', label: 'Dark', icon: Moon },
    { mode: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="page-shell max-w-2xl mx-auto">
      <h1 className="page-title">Settings</h1>

      <div className="settings-card">
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Download className="size-5 text-primary" />
          App Settings
        </h2>

        <div className="settings-row">
          <div className="flex items-center gap-3">
            <Download className="size-5 text-muted-foreground" />
            <div>
              <div className="font-medium">Install App</div>
              <div className="text-xs text-muted-foreground">
                {installed ? 'Installed on device' : 'Add to home screen'}
              </div>
            </div>
          </div>
          {installed ? (
            <div className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">✓ Installed</div>
          ) : (
            <button
              onClick={handleInstallApp}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Install
            </button>
          )}
        </div>

        <div className="settings-row">
          <div className="flex items-center gap-3">
            <Bell className="size-5 text-muted-foreground" />
            <div>
              <div className="font-medium">Notifications</div>
              <div className="text-xs text-muted-foreground">
                {notificationPermission === 'granted'
                  ? 'Enabled'
                  : notificationPermission === 'denied'
                  ? 'Blocked'
                  : 'Not enabled'}
              </div>
            </div>
          </div>
          {notificationPermission === 'granted' ? (
            <div className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">✓ Enabled</div>
          ) : notificationPermission === 'denied' ? (
            <div className="text-red-500 text-sm font-medium">Blocked</div>
          ) : (
            <button
              onClick={handleRequestNotifications}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Enable
            </button>
          )}
        </div>

        <div className="settings-row">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <Wifi className="size-5 text-muted-foreground" />
            ) : (
              <WifiOff className="size-5 text-muted-foreground" />
            )}
            <div>
              <div className="font-medium">Connection</div>
              <div className="text-xs text-muted-foreground">
                {isOnline ? 'Online — syncing enabled' : 'Offline — using cached data'}
              </div>
            </div>
          </div>
          <div className={`text-sm font-medium ${isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-500'}`}>
            {isOnline ? '● Online' : '● Offline'}
          </div>
        </div>
      </div>

      <div className="settings-card">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="size-5 text-primary" />
          <h2 className="text-base font-semibold">Theme</h2>
        </div>
        <div className="flex gap-2">
          {themeOptions.map(({ mode, label, icon: Icon }) => (
            <button
              key={mode}
              onClick={() => setTheme(mode)}
              className={`theme-btn ${theme === mode ? 'theme-btn-active' : ''}`}
            >
              <Icon className="size-5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-card">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="size-5 text-primary" />
          <h2 className="text-base font-semibold">Accent Color</h2>
        </div>
        <div className="flex items-center gap-4">
          <label htmlFor="accent-color-input" className="sr-only">
            Choose accent color
          </label>
          <input
            id="accent-color-input"
            type="color"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            aria-label="Choose accent color"
            title="Choose accent color"
            className="w-16 h-12 rounded-lg border border-border cursor-pointer bg-transparent"
          />
          <span className="text-sm text-muted-foreground font-mono">{customColor}</span>
        </div>
      </div>

      <div className="settings-card">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon className="size-5 text-primary" />
          <h2 className="text-base font-semibold">Background</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {WALLPAPER_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setWallpaper(option.id)}
              aria-label={`Set background to ${option.name}`}
              title={option.name}
              className={`aspect-square rounded-xl border-2 overflow-hidden transition-all hover:scale-[1.02] ${option.className} ${
                wallpaper === option.id
                  ? 'border-primary ring-2 ring-primary/30'
                  : 'border-border'
              }`}
            >
              {option.id === 'none' && (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                  None
                </div>
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">Select a background style for your app</p>
      </div>

      <div className="settings-card">
        <label htmlFor="custom-wallpaper-url" className="mb-2 block font-medium">
          Custom Image URL
        </label>
        <input
          id="custom-wallpaper-url"
          type="text"
          placeholder="Enter image URL..."
          aria-label="Custom wallpaper image URL"
          className="w-full px-3 py-2.5 border border-border rounded-lg bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          onBlur={(e) => {
            if (e.target.value) {
              setWallpaper(e.target.value);
            }
          }}
        />
        <p className="text-xs text-muted-foreground mt-2">Paste a direct link to an image</p>
      </div>
    </div>
  );
}
