import { useEffect } from 'react';
import { registerServiceWorker, setupInstallPrompt } from '../utils/pwa';

export function PWASetup() {
  useEffect(() => {
    // Register service worker
    registerServiceWorker();

    // Setup install prompt listener
    setupInstallPrompt();

    // Add PWA meta tags dynamically
    const addMetaTag = (name: string, content: string, property?: boolean) => {
      const existingTag = document.querySelector(
        property ? `meta[property="${name}"]` : `meta[name="${name}"]`
      );

      if (!existingTag) {
        const meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
      }
    };

    const addLinkTag = (rel: string, href: string, sizes?: string) => {
      const link = document.createElement('link');
      link.rel = rel;
      link.href = href;
      if (sizes) link.sizes = sizes;
      document.head.appendChild(link);
    };

    // PWA meta tags
    addMetaTag('mobile-web-app-capable', 'yes');
    addMetaTag('apple-mobile-web-app-capable', 'yes');
    addMetaTag('apple-mobile-web-app-status-bar-style', 'black-translucent');
    addMetaTag('apple-mobile-web-app-title', 'NowPlan');
    addMetaTag('application-name', 'NowPlan');
    addMetaTag('theme-color', '#3b82f6');
    addMetaTag('description', 'A comprehensive day scheduler app with tasks, calendar, music, notes, diary, and goals');

    // Manifest link
    addLinkTag('manifest', '/manifest.json');

    // Apple touch icons
    addLinkTag('apple-touch-icon', '/icons/icon-152x152.png', '152x152');
    addLinkTag('apple-touch-icon', '/icons/icon-192x192.png', '192x192');

    // Favicon
    addLinkTag('icon', '/icons/icon-192x192.png');

    // Viewport for mobile
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute(
        'content',
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
      );
    }
  }, []);

  return null;
}
