/**
 * Service Worker — alarm scheduler.
 *
 * Why this file exists:
 * The page's own setTimeout/interval dies when the tab closes, so alarms
 * stopped. This worker keeps alarm timers alive in the browser (tab
 * closed/minimised, browser still open), shows the OS notification, and
 * tells any open page to pop the in-app dialog/widget.
 *
 * Honest limitation (built into the copy in Settings):
 * Without a server doing Web Push, NO local-only web page can wake the OS
 * after the browser process itself is fully closed/killed. This worker is
 * the best a PWA can do: it covers tab-closed/browser-open, lock-screen
 * and sleep edge cases, plus missed-alarm catch-up on reopen.
 *
 * Type-check note: this runs in a Worker context (no DOM lib). We cast
 * `self` to any so `tsc` with DOM lib still passes.
 */
const sw = self as any;

// @ts-expect-error - injected by vite-plugin-pwa at build time
const WB_MANIFEST = self.__WB_MANIFEST;

const PRECACHE = "nowplan-precache-v1";
const SCHEDULE_CACHE = "nowplan-alarm-schedule-v1";

interface ScheduledAlarm {
  id: string; // `${taskId}-${type}-${date}` — same key the page uses
  fireAt: number; // epoch ms
  title: string;
  body: string;
  tag: string;
  taskId: string;
  type: string;
}

let timers = new Map<string, ReturnType<typeof setTimeout>>();

function clearAllTimers() {
  for (const t of timers.values()) clearTimeout(t);
  timers.clear();
}

async function persistSchedule(alarms: ScheduledAlarm[]) {
  try {
    const cache = await caches.open(SCHEDULE_CACHE);
    await cache.put(
      "/alarm-schedule.json",
      new Response(JSON.stringify(alarms), { headers: { "Content-Type": "application/json" } })
    );
  } catch {
    /* ignore */
  }
}

async function loadPersistedSchedule(): Promise<ScheduledAlarm[]> {
  try {
    const cache = await caches.open(SCHEDULE_CACHE);
    const res = await cache.match("/alarm-schedule.json");
    if (!res) return [];
    const data = (await res.json()) as ScheduledAlarm[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function fireAlarm(alarm: ScheduledAlarm) {
  timers.delete(alarm.id);
  const windows = (await sw.clients.matchAll({ type: "window", includeControlled: true })) as any[];
  // OS notification (survives tab close — the worker shows it).
  try {
    await sw.registration.showNotification(alarm.title, {
      body: alarm.body,
      tag: alarm.tag,
      icon: "/icons/scheduler-app.png",
      badge: "/icons/scheduler-app.png",
      vibrate: [200, 100, 200],
      requireInteraction: true,
      data: { url: "/", taskId: alarm.taskId },
    } as any);
  } catch {
    /* notification permission revoked mid-flight */
  }
  // Tell any open page so it can show the in-app dialog/widget too.
  for (const client of windows) {
    try {
      client.postMessage({ type: "ALARM_FIRED", alarm });
    } catch {
      /* client gone */
    }
  }
}

function schedule(alarms: ScheduledAlarm[]) {
  clearAllTimers();
  const now = Date.now();
  const MAX_DELAY = 2_147_483_647; // setTimeout cap (~24.8 days)
  for (const alarm of alarms) {
    const delay = alarm.fireAt - now;
    if (delay <= 0) {
      // Past-due on (re)sync: fire immediately so nothing is silently lost.
      void fireAlarm(alarm);
      continue;
    }
    const clamped = Math.min(delay, MAX_DELAY);
    const t = setTimeout(() => void fireAlarm(alarm), clamped);
    timers.set(alarm.id, t);
  }
  void persistSchedule(alarms);
}

sw.addEventListener("install", (event: any) => {
  const manifest = (WB_MANIFEST ?? []) as Array<{ url: string }>;
  const urls = manifest.map((m) => m.url);
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(urls))
      .then(() => sw.skipWaiting())
  );
});

sw.addEventListener("activate", (event: any) => {
  event.waitUntil(
    (async () => {
      await sw.clients.claim();
      // After a worker restart, re-arm alarms from the persisted schedule.
      const saved = await loadPersistedSchedule();
      if (saved.length) schedule(saved);
    })()
  );
});

sw.addEventListener("fetch", (event: any) => {
  const { request } = event;
  if (request.method !== "GET") return;
  // Cache-first for precached assets, network fallback, page navigations passthrough.
  event.respondWith(
    caches.match(request).then((hit) => hit ?? fetch(request).then((res) => {
      if (res && res.status === 200 && request.url.startsWith("http")) {
        const copy = res.clone();
        caches.open(PRECACHE).then((c) => c.put(request, copy)).catch(() => undefined);
      }
      return res;
    }).catch(() => hit ?? Promise.reject(new Error("offline"))))
  );
});

sw.addEventListener("message", (event: any) => {
  const msg = event.data;
  if (!msg) return;
  if (msg.type === "SCHEDULE_ALARMS" && Array.isArray(msg.alarms)) {
    schedule(msg.alarms as ScheduledAlarm[]);
    if (event.source) (event.source as any).postMessage?.({ type: "SCHEDULE_ACK", count: msg.alarms.length });
  } else if (msg.type === "CLEAR_ALARMS") {
    clearAllTimers();
    void persistSchedule([]);
  } else if (msg.type === "SKIP_WAITING") {
    void sw.skipWaiting();
  }
});

sw.addEventListener("notificationclick", (event: any) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    (async () => {
      const windows = (await sw.clients.matchAll({ type: "window", includeControlled: true })) as any[];
      for (const client of windows) {
        if ("focus" in client) {
          try {
            await client.focus();
            if ("navigate" in client) {
              try {
                await client.navigate(url);
              } catch {
                /* navigate unsupported */
              }
            }
            return;
          } catch {
            /* try next */
          }
        }
      }
      await sw.clients.openWindow(url);
    })()
  );
});

sw.addEventListener("notificationclose", () => {
  /* no extra handling needed */
});
