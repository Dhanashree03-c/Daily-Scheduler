import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  emoji: string;
  title: string;
  message: string;
  ctaLabel?: string;
  ctaTo?: string;
  children?: ReactNode;
}

export function EmptyState({ emoji, title, message, ctaLabel, ctaTo, children }: EmptyStateProps) {
  return (
    <div className="empty-state" role="status">
      <span className="empty-emoji" aria-hidden="true">{emoji}</span>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground max-w-60">{message}</p>
      {ctaLabel && ctaTo && (
        <Link
          to={ctaTo}
          className="mt-2 min-h-11 inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/25 hover:bg-primary/90 active:scale-95 transition-all"
        >
          {ctaLabel}
        </Link>
      )}
      {children}
    </div>
  );
}
