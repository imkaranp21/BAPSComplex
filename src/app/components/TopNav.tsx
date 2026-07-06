import { useState } from 'react';
import { Home, Grid3x3, CalendarCheck, User } from 'lucide-react';
import type { NavTab } from './BottomNav';
import { AnnouncementsBell } from './AnnouncementsBell';
import { TransparentLogo } from './TransparentLogo';

interface TopNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export function TopNav({ activeTab, onTabChange }: TopNavProps) {
  const [logoError, setLogoError] = useState(false);

  const tabs: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home',     label: 'Home',     icon: <Home className="w-4 h-4" /> },
    { id: 'spaces',   label: 'Spaces',   icon: <Grid3x3 className="w-4 h-4" /> },
    { id: 'bookings', label: 'Bookings', icon: <CalendarCheck className="w-4 h-4" /> },
    { id: 'profile',  label: 'Profile',  icon: <User className="w-4 h-4" /> },
  ];

  return (
    <nav className="hidden md:flex items-center justify-between px-8 h-16 border-b border-zinc-800/60 bg-zinc-950/95 backdrop-blur-xl sticky top-0 z-40">
      {/* Brand */}
      <div className="flex items-center gap-3">
        {logoError ? (
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-black font-black text-sm leading-none">Y</span>
          </div>
        ) : (
          <TransparentLogo
            src="/baps-logo.png"
            className="w-8 h-8 object-contain shrink-0"
            fallback={
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-black font-black text-sm leading-none">Y</span>
              </div>
            }
          />
        )}
        <div>
          <span className="text-white font-black text-base tracking-tight">YOGI SPORTS</span>
          <span className="text-zinc-600 text-xs font-medium ml-2 tracking-widest uppercase hidden lg:inline">Nakuru</span>
        </div>
      </div>

      {/* Nav tabs */}
      <div className="flex items-center gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold tracking-widest uppercase transition-all duration-200 ${
              activeTab === tab.id
                ? 'text-orange-500 border-b-2 border-orange-500 pb-1.5'
                : 'text-zinc-500 hover:text-zinc-200 border-b-2 border-transparent pb-1.5'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <AnnouncementsBell />
    </nav>
  );
}
