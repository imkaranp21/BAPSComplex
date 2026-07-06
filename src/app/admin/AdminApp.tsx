import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router';
import { LayoutDashboard, Users, CalendarDays, Dumbbell, LogOut, Shield, Footprints, CalendarOff, Megaphone, Package, BellRing } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { DashboardPage } from './DashboardPage';
import { MembersPage } from './MembersPage';
import { StaffPage } from './StaffPage';
import { BookingsPage } from './BookingsPage';
import { GymPage } from './GymPage';
import { WalkInsPage } from './WalkInsPage';
import { ClosuresPage } from './ClosuresPage';
import { AnnouncementsPage } from './AnnouncementsPage';
import { EquipmentPage } from './EquipmentPage';

export function AdminApp() {
  const { user, loading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl mb-5">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight mb-2">Access Denied</h1>
          <p className="text-zinc-500 text-sm mb-6">
            {user ? 'Your account does not have admin privileges.' : 'You must be signed in as an admin to access this page.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            Go to App
          </button>
        </div>
      </div>
    );
  }

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, end: true },
    { to: '/admin/members', label: 'Members', icon: <Users className="w-4 h-4" />, end: false },
    { to: '/admin/staff',   label: 'Staff',   icon: <BellRing className="w-4 h-4" />, end: false },
    { to: '/admin/bookings', label: 'Bookings', icon: <CalendarDays className="w-4 h-4" />, end: false },
    { to: '/admin/gym', label: 'Gym', icon: <Dumbbell className="w-4 h-4" />, end: false },
    { to: '/admin/walk-ins', label: 'Walk-Ins', icon: <Footprints className="w-4 h-4" />, end: false },
    { to: '/admin/closures', label: 'Closures', icon: <CalendarOff className="w-4 h-4" />, end: false },
    { to: '/admin/equipment', label: 'Equipment', icon: <Package className="w-4 h-4" />, end: false },
    { to: '/admin/announcements', label: 'Announcements', icon: <Megaphone className="w-4 h-4" />, end: false },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-zinc-950 border-r border-zinc-800 flex flex-col fixed h-full z-30">
        <div className="px-4 py-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-black" />
            </div>
            <div>
              <div className="text-sm font-black text-white tracking-tight">Admin Portal</div>
              <div className="text-[10px] text-zinc-600 tracking-widest uppercase">Yogi Sports Complex</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
                  isActive
                    ? 'bg-violet-600 text-white'
                    : 'text-zinc-500 hover:bg-zinc-900 hover:text-white'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-2.5 border-t border-zinc-800">
          <button
            onClick={async () => { await signOut(); navigate('/'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:bg-red-500/10 hover:text-red-400 hover:border hover:border-red-500/20 transition-all tracking-wide"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-56 p-8 overflow-y-auto min-h-screen bg-zinc-950">
        <Routes>
          <Route index element={<DashboardPage />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="staff"   element={<StaffPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="gym" element={<GymPage />} />
          <Route path="walk-ins" element={<WalkInsPage />} />
          <Route path="closures" element={<ClosuresPage />} />
          <Route path="equipment" element={<EquipmentPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}
