import { useState, useEffect } from 'react';
import { Calendar, X, Loader2 } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
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
      .select('id, date, start_time, end_time, status, notes, spaces(name), space_units(name), profiles(full_name)')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    const today = format(new Date(), 'yyyy-MM-dd');
    if (dateRange === 'today') {
      query = query.eq('date', today);
    } else if (dateRange === 'week') {
      query = query
        .gte('date', today)
        .lte('date', format(addDays(new Date(), 7), 'yyyy-MM-dd'));
    }

    const { data } = await query;
    setBookings(data ?? []);
    setLoading(false);
  }

  async function cancelBooking(id: string) {
    setCancelling(id);
    await (supabase as any).from('bookings').update({ status: 'cancelled' }).eq('id', id);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
    setCancelling(null);
  }

  function formatTime(t: string) {
    const h = parseInt(t.split(':')[0]);
    return h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
  }

  const statusColors: Record<string, string> = {
    confirmed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    no_show: 'bg-stone-100 text-stone-700',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Bookings</h1>
          <p className="text-stone-500 text-sm mt-1">{bookings.length} bookings</p>
        </div>

        {/* Date range filter */}
        <div className="flex bg-stone-100 rounded-xl p-1 gap-1">
          {(['today', 'week', 'all'] as const).map(r => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                dateRange === r ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
              }`}
            >
              {r === 'week' ? 'Next 7 days' : r}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-stone-200">
          <Calendar className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500">No bookings for this period.</p>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Member</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Space</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Time</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id} className="border-b border-stone-50 hover:bg-stone-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-stone-900">
                    {b.profiles?.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-4 text-stone-700">
                    {b.spaces?.name}
                    {b.space_units?.name ? ` · ${b.space_units.name}` : ''}
                  </td>
                  <td className="px-4 py-4 text-stone-600">
                    {format(new Date(b.date), 'EEE, MMM d')}
                  </td>
                  <td className="px-4 py-4 text-stone-600">
                    {formatTime(b.start_time)} – {formatTime(b.end_time)}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusColors[b.status] ?? 'bg-stone-100 text-stone-700'}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    {b.status === 'confirmed' && (
                      <button
                        onClick={() => cancelBooking(b.id)}
                        disabled={cancelling === b.id}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors"
                        title="Cancel booking"
                      >
                        {cancelling === b.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <X className="w-4 h-4" />
                        }
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
