import { Home, Grid3x3, CalendarCheck, User } from 'lucide-react';

export type NavTab = 'home' | 'spaces' | 'bookings' | 'profile';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home',     label: 'Home',     icon: <Home className="w-6 h-6" /> },
    { id: 'spaces',   label: 'Spaces',   icon: <Grid3x3 className="w-6 h-6" /> },
    { id: 'bookings', label: 'Bookings', icon: <CalendarCheck className="w-6 h-6" /> },
    { id: 'profile',  label: 'Profile',  icon: <User className="w-6 h-6" /> },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 pb-6 pt-2 shadow-lg">
      <div className="flex items-center justify-around px-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex flex-col items-center gap-1 py-2 px-3 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <div className={activeTab === tab.id ? 'text-orange-600' : 'text-stone-400'}>
              {tab.icon}
            </div>
            <span className={`text-xs font-medium ${activeTab === tab.id ? 'text-orange-600' : 'text-stone-400'}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
