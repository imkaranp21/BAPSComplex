import { useState, useEffect } from 'react';
import { Calendar, X, Loader2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { supabase } from '../../lib/supabase';

interface Booking {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  spaces: { name: string } | null;
  space_units: { name: string } | null;
  profiles: { full_name: string } | null;
}

function formatTime(t: string) {
  const h = parseInt(t.split(':')[0]);
  return h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
}

const statusBadge: Record<string, string> = {
  confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  no_show:   'bg-zinc-700 text-zinc-400 border-zinc-600',
};

export function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'all'>('today');
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => { load(); }, [dateRange]);

  async function load() {
    setLoading(true);
    let query = (supabase as any)
      .from('bookings')
      .select('id, date, start_time, end_time, status, notes, created_at, spaces(name), space_units(name), profiles(full_name)')
      .order('created_at', { ascending: false });

    const today = format(new Date(), 'yyyy-MM-dd');
    if (dateRange === 'today') query = query.eq('date', today);
    else if (dateRange === 'week') query = query.gte('date', today).lte('date', format(addDays(new Date(), 7), 'yyyy-MM-dd'));

    const { data } = await query;
    setBookings(data ?? []);
    setLoading(false);
  }

  async function cancelBooking(id: string) {
    setCancelling(id);
    const { error } = await (supabase as any).from('bookings').update({ status: 'cancelled' }).eq('id', id);
    if (!error) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
    }
    setCancelling(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Bookings</h1>
          <p className="text-zinc-500 text-sm mt-1">{bookings.length} bookings</p>
        </div>

        <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 gap-1">
          {(['today', 'week', 'all'] as const).map(r => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all capitalize ${
                dateRange === r ? 'bg-zinc-700 text-white' : 'text-zinc-600 hover:text-zinc-300'
              }`}
            >
              {r === 'week' ? 'Next 7 days' : r}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <Calendar className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-600 text-sm">No bookings for this period.</p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-5 py-3.5 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.15em]">Member</th>
                <th className="text-left px-4 py-3.5 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.15em]">Space</th>
                <th className="text-left px-4 py-3.5 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.15em]">Date</th>
                <th className="text-left px-4 py-3.5 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.15em]">Time</th>
                <th className="text-left px-4 py-3.5 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.15em]">Status</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-4 font-bold text-white text-sm">{b.profiles?.full_name ?? '—'}</td>
                  <td className="px-4 py-4 text-zinc-400 text-sm">
                    {b.spaces?.name}{b.space_units?.name ? ` · ${b.space_units.name}` : ''}
                  </td>
                  <td className="px-4 py-4 text-zinc-500 text-sm">{format(new Date(b.date), 'EEE, MMM d')}</td>
                  <td className="px-4 py-4 text-zinc-500 text-sm">{formatTime(b.start_time)} – {formatTime(b.end_time)}</td>
                  <td className="px-4 py-4">
                    <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border capitalize ${statusBadge[b.status] ?? 'bg-zinc-700 text-zinc-400 border-zinc-600'}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    {b.status === 'confirmed' && (
                      <button
                        onClick={() => cancelBooking(b.id)}
                        disabled={cancelling === b.id}
                        className="p-1.5 rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Cancel booking"
                      >
                        {cancelling === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
