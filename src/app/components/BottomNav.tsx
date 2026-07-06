import { Home, Grid3x3, CalendarCheck, User } from 'lucide-react';

export type NavTab = 'home' | 'spaces' | 'bookings' | 'profile';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home',     label: 'Home',     icon: <Home className="w-5 h-5" /> },
    { id: 'spaces',   label: 'Spaces',   icon: <Grid3x3 className="w-5 h-5" /> },
    { id: 'bookings', label: 'Bookings', icon: <CalendarCheck className="w-5 h-5" /> },
    { id: 'profile',  label: 'Profile',  icon: <User className="w-5 h-5" /> },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/60">
      <div className="flex">
        {tabs.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex-1 relative flex flex-col items-center gap-1.5 py-3.5 transition-colors"
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-orange-500 rounded-b-full" />
              )}
              <span className={active ? 'text-orange-500' : 'text-zinc-600'}>
                {tab.icon}
              </span>
              <span className={`text-[9px] font-bold tracking-[0.12em] uppercase ${active ? 'text-orange-500' : 'text-zinc-600'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
