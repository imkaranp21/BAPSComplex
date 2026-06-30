import { useState, useEffect } from 'react';
import { Users, CalendarCheck, Dumbbell, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

interface Stats {
  totalMembers: number;
  activeMembers: number;
  pendingMembers: number;
  todayBookings: number;
  gymOccupancy: number;
}

interface TodayBooking {
  id: string;
  start_time: string;
  end_time: string;
  spaces: { name: string } | null;
  profiles: { full_name: string } | null;
}

export function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [todayBookings, setTodayBookings] = useState<TodayBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    async function load() {
      const [membersRes, bookingsRes, checkinRes, todayRes] = await Promise.all([
        (supabase as any).from('profiles').select('membership_status'),
        (supabase as any).from('bookings').select('id').eq('date', today).eq('status', 'confirmed'),
        (supabase as any).from('gym_checkins').select('id').eq('is_active', true),
        (supabase as any)
          .from('bookings')
          .select('id, start_time, end_time, spaces(name), profiles(full_name)')
          .eq('date', today)
          .eq('status', 'confirmed')
          .order('start_time'),
      ]);

      const members = membersRes.data ?? [];
      setStats({
        totalMembers: members.length,
        activeMembers: members.filter((m: any) => m.membership_status === 'active').length,
        pendingMembers: members.filter((m: any) => m.membership_status === 'pending').length,
        todayBookings: (bookingsRes.data ?? []).length,
        gymOccupancy: (checkinRes.data ?? []).length,
      });
      setTodayBookings(todayRes.data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  function formatTime(t: string) {
    const h = parseInt(t.split(':')[0]);
    const label = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
    return label;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
        <p className="text-stone-500 text-sm mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Total Members"
          value={stats?.totalMembers ?? 0}
          color="blue"
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Active Members"
          value={stats?.activeMembers ?? 0}
          color="green"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Pending Approval"
          value={stats?.pendingMembers ?? 0}
          color="amber"
        />
        <StatCard
          icon={<CalendarCheck className="w-5 h-5" />}
          label="Today's Bookings"
          value={stats?.todayBookings ?? 0}
          color="orange"
        />
      </div>

      {/* Gym occupancy */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Dumbbell className="w-5 h-5 text-orange-600" />
          <h2 className="font-semibold text-stone-900">Gym Live Occupancy</h2>
        </div>
        <div className="flex items-end gap-4">
          <span className="text-4xl font-bold text-stone-900">{stats?.gymOccupancy}</span>
          <span className="text-stone-400 text-lg pb-1">/ 30 people</span>
        </div>
        <div className="mt-3 w-full bg-stone-100 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              (stats?.gymOccupancy ?? 0) > 24 ? 'bg-red-500' :
              (stats?.gymOccupancy ?? 0) > 15 ? 'bg-orange-500' : 'bg-green-500'
            }`}
            style={{ width: `${((stats?.gymOccupancy ?? 0) / 30) * 100}%` }}
          />
        </div>
      </div>

      {/* Today's bookings list */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
        <h2 className="font-semibold text-stone-900 mb-4">Today's Schedule</h2>
        {todayBookings.length === 0 ? (
          <p className="text-stone-400 text-sm">No bookings today.</p>
        ) : (
          <div className="space-y-2">
            {todayBookings.map(b => (
              <div
                key={b.id}
                className="flex items-center justify-between py-3 border-b border-stone-50 last:border-0"
              >
                <div>
                  <p className="font-medium text-stone-900 text-sm">{b.profiles?.full_name ?? 'Unknown'}</p>
                  <p className="text-stone-400 text-xs">{b.spaces?.name}</p>
                </div>
                <span className="text-xs font-medium text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full">
                  {formatTime(b.start_time)} – {formatTime(b.end_time)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon, label, value, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'amber' | 'orange';
}) {
  const colorMap = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    amber:  'bg-amber-50 text-amber-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
      <div className={`inline-flex p-2.5 rounded-xl mb-3 ${colorMap[color]}`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-stone-900">{value}</div>
      <div className="text-xs text-stone-500 mt-0.5">{label}</div>
    </div>
  );
}
