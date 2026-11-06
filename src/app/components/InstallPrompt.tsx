import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { X, Download } from "lucide-react";
import { isAppInstalled, onInstallAvailabilityChange, promptInstall } from "../utils/pwa";
import { toast } from "sonner";

const DISMISS_KEY = "install_prompt_dismissed";

export function InstallPrompt() {
  const [available, setAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isAppInstalled()) return;
    const unsubscribe = onInstallAvailabilityChange(setAvailable);
    return unsubscribe;
  }, []);

  if (!available || dismissed || isAppInstalled()) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch { /* ignore */ }
  };

  async function handleInstall() {
    const accepted = await promptInstall();
    if (accepted) {
      setDismissed(true);
      toast.success("Installing… 🎉");
    } else {
      toast.error("Install not available", {
        description: "Try the browser's install icon, or on iPhone: Share → Add to Home Screen.",
      });
    }
  }

  return (
    <div className="fixed left-4 right-4 z-50 max-w-md mx-auto bg-card border border-border rounded-2xl p-3 flex items-center justify-between shadow-xl bottom-[calc(var(--nav-h,76px)+var(--nav-safe,0px)+12px)]" role="region" aria-label="Install prompt">
      <div className="flex items-center gap-2 min-w-0">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
          <Download className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">Install this app</p>
          <p className="text-xs text-muted-foreground">Quick access + offline, like a real app.</p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button size="sm" onClick={handleInstall} className="min-h-11 px-4">Install</Button>
        <button
          type="button"
          onClick={dismiss}
          className="min-w-11 min-h-11 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-accent"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
