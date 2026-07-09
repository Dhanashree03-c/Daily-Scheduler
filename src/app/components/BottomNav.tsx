import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Plus, Menu, X, Music, Pen, StickyNote, Book, Target, Settings } from 'lucide-react';
import { cn } from './ui/utils';

export function BottomNav() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/' && (location.pathname === '/' || location.pathname === '/today')) return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const menuItems = [
    { path: '/music', icon: Music, label: 'Music Player' },
    { path: '/doodle', icon: Pen, label: 'Doodle Drawer' },
    { path: '/notes', icon: StickyNote, label: 'Notes' },
    { path: '/diary', icon: Book, label: 'Diary' },
    { path: '/goals', icon: Target, label: 'Goals' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const navLinkClass = (active: boolean) =>
    cn(
      'flex flex-col items-center gap-1 py-2.5 px-4 rounded-xl transition-all duration-200',
      active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
    );

  return (
    <>
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div
        className={cn(
          'fixed top-0 right-0 h-full w-72 z-50 transform transition-transform duration-300 ease-out',
          'bg-card/95 backdrop-blur-xl border-l border-border shadow-2xl',
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">More Features</h2>
          <button
            onClick={() => setMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>
        <nav className="p-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all duration-200',
                  active
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground/80 hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className="size-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <nav
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/60 nav-bar"
      >
        <div className="flex items-center justify-around max-w-2xl mx-auto px-2">
          <Link to="/" className={navLinkClass(isActive('/'))}>
            <Home className={cn('size-6', isActive('/') && 'drop-shadow-sm')} />
            <span className="text-xs font-medium">Today</span>
          </Link>

          <Link to="/calendar" className={navLinkClass(isActive('/calendar'))}>
            <Calendar className="size-6" />
            <span className="text-xs font-medium">Calendar</span>
          </Link>

          <Link to="/add" className={navLinkClass(isActive('/add'))}>
            <Plus className="size-6" />
            <span className="text-xs font-medium">Add</span>
          </Link>

          <button
            onClick={() => setMenuOpen(true)}
            className={navLinkClass(false)}
          >
            <Menu className="size-6" />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
