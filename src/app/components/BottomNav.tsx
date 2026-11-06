import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  CalendarDays,
  Plus,
  LayoutGrid,
  X,
  Music,
  PenTool,
  StickyNote,
  BookOpen,
  Target,
  Settings,
} from "lucide-react";
import { cn } from "./ui/utils";

const groups = [
  {
    heading: "Plan",
    items: [
      { path: "/calendar", icon: CalendarDays, label: "Calendar", emoji: null },
    ],
  },
  {
    heading: "Create",
    items: [
      { path: "/notes", icon: StickyNote, label: "Notes", emoji: null },
      { path: "/diary", icon: BookOpen, label: "Diary", emoji: null },
      { path: "/doodle", icon: PenTool, label: "Doodle drawer", emoji: null },
      { path: "/music", icon: Music, label: "Music player", emoji: null },
    ],
  },
  {
    heading: "Grow",
    items: [
      { path: "/goals", icon: Target, label: "Goals", emoji: null },
      { path: "/settings", icon: Settings, label: "Settings", emoji: null },
    ],
  },
];

const morePaths = groups.flatMap((g) => g.items.map((i) => i.path));

export function BottomNav() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/" || location.pathname === "/today";
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const inMoreSection = morePaths.some((p) => isActive(p)) || location.pathname.startsWith("/edit");

  useEffect(() => {
    if (!menuOpen) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const tabClass = (active: boolean) =>
    cn(
      "relative nav-tab rounded-2xl transition-all",
      active ? "text-primary" : "text-muted-foreground hover:text-foreground"
    );

  return (
    <>
      {menuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 cursor-default"
        />
      )}

      <div
        role="dialog"
        aria-modal="true"
        aria-label="More features"
        aria-hidden={!menuOpen}
        inert={!menuOpen}
        style={{
          transform: menuOpen ? "translateX(0)" : "translateX(105%)",
          visibility: menuOpen ? "visible" : "hidden",
        }}
        className={cn(
          "fixed top-0 right-0 inset-y-0 w-80 max-w-[85vw] z-50 transition-transform duration-300 ease-out",
          "bg-card/95 backdrop-blur-xl border-l border-border shadow-2xl flex flex-col will-change-transform"
        )}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">✨ More features</h2>
          <button
            ref={closeRef}
            onClick={() => setMenuOpen(false)}
            className="min-w-11 min-h-11 flex items-center justify-center rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="p-3 overflow-y-auto pb-8">
          {groups.map((group) => (
            <section key={group.heading} className="mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-3 mb-1.5">
                {group.heading}
              </h3>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 min-h-12 rounded-xl mb-1 transition-all",
                      active
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground/80 hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className="size-5 shrink-0" aria-hidden />
                    <span>{item.label}</span>
                    {active && <span className="ml-auto text-xs font-bold" aria-hidden>•</span>}
                  </Link>
                );
              })}
            </section>
          ))}
        </div>
      </div>

      <nav aria-label="Primary" className="z-30 nav-bar">
        <div className="nav-bar-inner">
          <Link to="/" aria-current={isActive("/") ? "page" : undefined} className={tabClass(isActive("/"))}>
            <Home className="size-6" aria-hidden />
            <span className="text-xs font-medium">Today</span>
            {isActive("/") && <span aria-hidden className="absolute bottom-1 h-1 w-6 rounded-full bg-primary" />}
          </Link>

          <Link to="/calendar" aria-current={isActive("/calendar") ? "page" : undefined} className={tabClass(isActive("/calendar"))}>
            <CalendarDays className="size-6" aria-hidden />
            <span className="text-xs font-medium">Calendar</span>
            {isActive("/calendar") && <span aria-hidden className="absolute bottom-1 h-1 w-6 rounded-full bg-primary" />}
          </Link>

          <Link
            to="/add"
            aria-label="Add task"
            aria-current={isActive("/add") ? "page" : undefined}
            className={tabClass(isActive("/add"))}
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-amber-400 text-white shadow-lg shadow-fuchsia-500/30 ring-4 ring-background active:scale-90 transition-transform">
              <Plus className="size-6" aria-hidden />
            </span>
            <span className={cn("text-xs", isActive("/add") ? "font-bold text-primary" : "font-medium")}>Add</span>
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            aria-current={inMoreSection ? "page" : undefined}
            className={tabClass(inMoreSection)}
          >
            <LayoutGrid className="size-6" aria-hidden />
            <span className="text-xs font-medium">More</span>
            {inMoreSection && <span aria-hidden className="absolute bottom-1 h-1 w-6 rounded-full bg-primary" />}
          </button>
        </div>
      </nav>
    </>
  );
}
