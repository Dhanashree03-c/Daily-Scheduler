// src/utils/pwa.ts

// ------------------------------
// Extended Notification Types
// ------------------------------
type ExtendedNotificationOptions = NotificationOptions & {
  vibrate?: number[];
};

// ------------------------------
// Service Worker Registration
// ------------------------------
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};

// ------------------------------
// Notification Permission
// ------------------------------
export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
  }
  return 'denied';
};

// ------------------------------
// Show Notification (Fixed)
// ------------------------------
export const showNotification = async (
  title: string,
  options?: ExtendedNotificationOptions
) => {
  if ('serviceWorker' in navigator && 'Notification' in window) {
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      const registration = await navigator.serviceWorker.ready;

      await registration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        requireInteraction: true,
        vibrate: [200, 100, 200],
        ...options,
      });
    }
  }
};

// ------------------------------
// Check if App is Installed
// ------------------------------
export const isAppInstalled = () => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
};

// ------------------------------
// Install Prompt Handling
// ------------------------------
let deferredPrompt: any = null;

export const setupInstallPrompt = () => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('Install prompt ready');
    notifyInstallListeners();          // <-- add this line
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notifyInstallListeners();          // <-- add this too
  });
};

// ------------------------------
// Trigger Install Prompt
// ------------------------------
export const promptInstall = async () => {
  if (!deferredPrompt) {
    console.log('Install prompt not available');
    return false;
  }

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;

  console.log(`User response to install prompt: ${outcome}`);

  deferredPrompt = null;
  notifyInstallListeners();            // <-- add this line

  return outcome === 'accepted';
};

// ------------------------------
// Task Notification Scheduler
// IMPORTANT: PWA limitation (not reliable if app is closed)
// ------------------------------
export const scheduleTaskNotification = (
  taskTitle: string,
  time: Date
) => {
  const now = Date.now();
  const targetTime = time.getTime();
  const delay = targetTime - now;

  if (delay <= 0) return;

  setTimeout(() => {
    showNotification('Task Reminder', {
      body: taskTitle,
      tag: `task-${time.toISOString()}`,
      vibrate: [200, 100, 200],
      requireInteraction: true,
    });
  }, delay);
};

// ------------------------------
// Reactive install-availability (so React components can subscribe)
// ------------------------------
type InstallListener = (available: boolean) => void;
const installListeners = new Set<InstallListener>();

export const onInstallAvailabilityChange = (cb: InstallListener) => {
  installListeners.add(cb);
  cb(deferredPrompt !== null);
  return () => {
    installListeners.delete(cb);
  };
};

const notifyInstallListeners = () => {
  installListeners.forEach((cb) => cb(deferredPrompt !== null));
};