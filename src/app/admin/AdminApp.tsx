import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router';
import { LayoutDashboard, Users, CalendarDays, Dumbbell, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { DashboardPage } from './DashboardPage';
import { MembersPage } from './MembersPage';
import { BookingsPage } from './BookingsPage';
import { GymPage } from './GymPage';

export function AdminApp() {
  const { user, loading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-5">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-stone-900 mb-2">Access Denied</h1>
          <p className="text-stone-500 text-sm mb-6">
            {user ? 'Your account does not have admin privileges.' : 'You must be signed in as an admin to access this page.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-orange-700 transition-colors"
          >
            Go to App
          </button>
        </div>
      </div>
    );
  }

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, end: true },
    { to: '/admin/members', label: 'Members', icon: <Users className="w-5 h-5" />, end: false },
    { to: '/admin/bookings', label: 'Bookings', icon: <CalendarDays className="w-5 h-5" />, end: false },
    { to: '/admin/gym', label: 'Gym', icon: <Dumbbell className="w-5 h-5" />, end: false },
  ];

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-stone-200 flex flex-col shadow-sm fixed h-full z-30">
        <div className="p-5 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-stone-900">Admin Portal</div>
              <div className="text-xs text-stone-400">Yogi Sports Complex</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-orange-600 text-white'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-stone-100">
          <button
            onClick={async () => { await signOut(); navigate('/'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-stone-600 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-60 p-8 overflow-y-auto min-h-screen">
        <Routes>
          <Route index element={<DashboardPage />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="gym" element={<GymPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}
