import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { X, Download } from "lucide-react";
import { isAppInstalled, onInstallAvailabilityChange, promptInstall } from "../utils/pwa";

export function InstallPrompt() {
  const [available, setAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isAppInstalled()) return;
    const unsubscribe = onInstallAvailabilityChange(setAvailable);
    return unsubscribe;
  }, []);

  if (!available || dismissed || isAppInstalled()) return null;

  async function handleInstall() {
    const accepted = await promptInstall();
    if (accepted) setDismissed(true);
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-card border rounded-xl p-3 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-2">
        <Download className="h-5 w-5 text-primary" />
        <div>
          <p className="text-sm font-medium">Install Day Scheduler</p>
          <p className="text-xs text-muted-foreground">Use it like a real app, offline too.</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button size="sm" onClick={handleInstall}>Install</Button>
        <button onClick={() => setDismissed(true)} className="p-1 text-muted-foreground" aria-label="Dismiss">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}