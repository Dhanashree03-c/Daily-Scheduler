import { createContext, useContext, type ReactNode } from "react";
import { useScheduler, type Scheduler } from "../hooks/useScheduler";

const SchedulerCtx = createContext<Scheduler | null>(null);

export function SchedulerProvider({ children }: { children: ReactNode }) {
  const value = useScheduler();
  return <SchedulerCtx.Provider value={value}>{children}</SchedulerCtx.Provider>;
}

export function useSchedulerContext(): Scheduler {
  const ctx = useContext(SchedulerCtx);
  if (!ctx) throw new Error("useSchedulerContext must be used within SchedulerProvider");
  return ctx;
}
