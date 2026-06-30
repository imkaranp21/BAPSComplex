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
    <nav className="hidden md:flex items-center justify-between px-8 h-16 border-b border-gray-700 bg-[#2d2d2d] sticky top-0 z-40">
      <span className="text-xl font-bold text-white tracking-tight">TimeSlot</span>
      <div className="flex items-center gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-black'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
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
