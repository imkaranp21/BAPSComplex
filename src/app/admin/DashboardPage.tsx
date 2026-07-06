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

function formatTime(t: string) {
  const h = parseInt(t.split(':')[0]);
  return h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
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
          .eq('date', today).eq('status', 'confirmed').order('start_time'),
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const gymPct = ((stats?.gymOccupancy ?? 0) / 30) * 100;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white tracking-tight">Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Users className="w-4 h-4" />} label="Total Members" value={stats?.totalMembers ?? 0} accent="zinc" />
        <StatCard icon={<Users className="w-4 h-4" />} label="Active Members" value={stats?.activeMembers ?? 0} accent="emerald" />
        <StatCard icon={<Clock className="w-4 h-4" />} label="Pending Approval" value={stats?.pendingMembers ?? 0} accent="amber" />
        <StatCard icon={<CalendarCheck className="w-4 h-4" />} label="Today's Bookings" value={stats?.todayBookings ?? 0} accent="orange" />
      </div>

      {/* Gym occupancy */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2.5 mb-4">
          <Dumbbell className="w-4 h-4 text-violet-400" />
          <h2 className="font-black text-white text-sm tracking-tight">Gym Live Occupancy</h2>
        </div>
        <div className="flex items-end gap-3 mb-4">
          <span className="text-4xl font-black text-white tracking-tight">{stats?.gymOccupancy}</span>
          <span className="text-zinc-600 text-base pb-1 font-medium">/ 30 people</span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-700 ${
              (stats?.gymOccupancy ?? 0) > 24 ? 'bg-red-500' :
              (stats?.gymOccupancy ?? 0) > 15 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.max(2, gymPct)}%` }}
          />
        </div>
      </div>

      {/* Today's bookings list */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="font-black text-white text-sm tracking-tight mb-5">Today's Schedule</h2>
        {todayBookings.length === 0 ? (
          <p className="text-zinc-600 text-sm">No bookings today.</p>
        ) : (
          <div className="space-y-0">
            {todayBookings.map(b => (
              <div key={b.id} className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0">
                <div>
                  <p className="font-bold text-white text-sm">{b.profiles?.full_name ?? 'Unknown'}</p>
                  <p className="text-zinc-600 text-xs mt-0.5">{b.spaces?.name}</p>
                </div>
                <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-full">
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

function StatCard({ icon, label, value, accent }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: 'zinc' | 'emerald' | 'amber' | 'orange';
}) {
  const accentMap = {
    zinc:    'bg-zinc-800 text-zinc-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    amber:   'bg-amber-500/10 text-amber-400',
    orange:  'bg-violet-600/10 text-violet-300',
  };
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className={`inline-flex p-2.5 rounded-xl mb-3 ${accentMap[accent]}`}>
        {icon}
      </div>
      <div className="text-2xl font-black text-white tracking-tight">{value}</div>
      <div className="text-[10px] text-zinc-600 mt-0.5 tracking-widest uppercase font-bold">{label}</div>
    </div>
  );
}
