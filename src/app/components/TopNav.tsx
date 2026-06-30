import { Home, Grid3x3, Calendar, Bell } from 'lucide-react';

interface TopNavProps {
  activeTab: 'home' | 'spaces' | 'schedule' | 'alerts';
  onTabChange: (tab: 'home' | 'spaces' | 'schedule' | 'alerts') => void;
}

export function TopNav({ activeTab, onTabChange }: TopNavProps) {
  const tabs = [
    { id: 'home' as const, label: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'spaces' as const, label: 'Spaces', icon: <Grid3x3 className="w-4 h-4" /> },
    { id: 'schedule' as const, label: 'Schedule', icon: <Calendar className="w-4 h-4" /> },
    { id: 'alerts' as const, label: 'Alerts', icon: <Bell className="w-4 h-4" /> },
  ];

  return (
    <nav className="hidden md:flex items-center justify-between px-8 h-16 border-b border-stone-200 bg-white sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
            <rect x="3" y="3" width="7" height="7" rx="1" fill="white" />
            <rect x="14" y="3" width="7" height="7" rx="1" fill="white" />
            <rect x="3" y="14" width="7" height="7" rx="1" fill="white" />
            <rect x="14" y="14" width="7" height="7" rx="1" fill="white" />
          </svg>
        </div>
        <span className="text-xl font-bold text-stone-900 tracking-tight">TimeSlot</span>
        <span className="text-sm text-stone-400 font-normal hidden lg:block">Yogi Sports Complex · Nakuru</span>
      </div>
      <div className="flex items-center gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-orange-600 text-white'
                : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
