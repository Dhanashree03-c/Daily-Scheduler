import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BellRing, X, Clock } from "lucide-react";
import { NOTIFICATION_WIDGET_EVENT, type WidgetPayload } from "../utils/notifyWidget";
import { formatTimeRange } from "../utils/date";
import { cn } from "./ui/utils";

const AUTO_DISMISS_MS = 9000;

/**
 * Floating in-app notification widget.
 * Pops up above the bottom nav whenever a task/alarm notification fires —
 * right after saving a task, and when a real reminder/start/end fires.
 * Mount once in AppShell so it persists across tab switches.
 */
export function NotificationWidget() {
  const [payload, setPayload] = useState<WidgetPayload | null>(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);

  const dismiss = useCallback(() => {
    setVisible(false);
    window.setTimeout(() => setPayload(null), 280);
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    const onWidget = (e: Event) => {
      const detail = (e as CustomEvent<WidgetPayload>).detail;
      if (!detail) return;
      setPayload(detail);
      setVisible(true);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        setVisible(false);
        window.setTimeout(() => setPayload(null), 280);
      }, AUTO_DISMISS_MS);
    };
    window.addEventListener(NOTIFICATION_WIDGET_EVENT, onWidget);
    return () => {
      window.removeEventListener(NOTIFICATION_WIDGET_EVENT, onWidget);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  if (!payload) return null;

  const { task, title, body, whenLabel } = payload;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed left-4 right-4 z-[60] max-w-md mx-auto",
        "bottom-[calc(var(--nav-h,76px)+var(--nav-safe,0px)+12px)]"
      )}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity .28s ease, transform .28s ease",
      }}
    >
      <div className="rounded-2xl border border-border bg-card shadow-2xl shadow-black/20 overflow-hidden pop-in">
        <div className="h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400" aria-hidden />
        <div className="p-3 flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md shadow-fuchsia-500/25">
            <BellRing className="size-5" aria-hidden />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold leading-snug break-words">{title}</p>
            <p className="text-xs text-muted-foreground mt-0.5 break-words">{body}</p>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-primary mt-1.5">
              <Clock className="size-3.5 shrink-0" aria-hidden />
              {whenLabel} · {formatTimeRange(task.startTime, task.endTime)}
            </p>
            <div className="flex gap-2 mt-2.5">
              <Link
                to={`/edit/${task.id}`}
                className="min-h-11 inline-flex items-center px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90"
              >
                View task
              </Link>
              <button
                type="button"
                onClick={dismiss}
                className="min-h-11 inline-flex items-center px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-accent"
              >
                Got it
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss notification"
            className="min-w-11 min-h-11 -mr-1 -mt-1 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-accent"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
