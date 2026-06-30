import { Home, Grid3x3, Calendar, Bell } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'home' | 'spaces' | 'schedule' | 'alerts';
  onTabChange: (tab: 'home' | 'spaces' | 'schedule' | 'alerts') => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 pb-6 pt-2 shadow-lg">
      <div className="flex items-center justify-around px-4">
        <NavItem
          icon={<Home className="w-6 h-6" />}
          label="Home"
          active={activeTab === 'home'}
          onClick={() => onTabChange('home')}
        />
        <NavItem
          icon={<Grid3x3 className="w-6 h-6" />}
          label="Spaces"
          active={activeTab === 'spaces'}
          onClick={() => onTabChange('spaces')}
        />
        <NavItem
          icon={<Calendar className="w-6 h-6" />}
          label="Schedule"
          active={activeTab === 'schedule'}
          onClick={() => onTabChange('schedule')}
        />
        <NavItem
          icon={<Bell className="w-6 h-6" />}
          label="Alerts"
          active={activeTab === 'alerts'}
          onClick={() => onTabChange('alerts')}
        />
      </div>
    </div>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 py-2 px-3 rounded-lg hover:bg-stone-100 transition-colors"
    >
      <div className={active ? 'text-orange-600' : 'text-stone-400'}>
        {icon}
      </div>
      <span className={`text-xs font-medium ${active ? 'text-orange-600' : 'text-stone-400'}`}>
        {label}
      </span>
    </button>
  );
}
