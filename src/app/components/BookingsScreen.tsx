import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, X, Loader2 } from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';

interface Booking {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  spaces: { name: string } | null;
  space_units: { name: string } | null;
}

interface BookingsScreenProps {
  onSignIn: () => void;
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  if (h === 0) return '12:00 AM';
  if (h < 12) return `${h}:${String(m).padStart(2, '0')} AM`;
  if (h === 12) return '12:00 PM';
  return `${h - 12}:${String(m).padStart(2, '0')} PM`;
}

export function BookingsScreen({ onSignIn }: BookingsScreenProps) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchBookings();
  }, [user]);

  async function fetchBookings() {
    setLoading(true);
    const { data } = await (supabase as any)
      .from('bookings')
      .select('id, date, start_time, end_time, status, spaces(name), space_units(name)')
      .eq('user_id', user!.id)
      .order('date', { ascending: false })
      .order('start_time', { ascending: false })
      .limit(30);
    setBookings((data as Booking[]) ?? []);
    setLoading(false);
  }

  async function cancelBooking(id: string) {
    setCancellingId(id);
    await (supabase as any).rpc('cancel_booking', { booking_id: id });
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
    setCancellingId(null);
  }

  if (!user) {
    return (
      <div className="bg-zinc-950 min-h-full pt-6 pb-4">
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl mb-5">
            <Calendar className="w-7 h-7 text-zinc-600" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight mb-2">Sign in to view bookings</h2>
          <p className="text-zinc-600 text-sm mb-8">Your upcoming and past bookings will appear here.</p>
          <button
            onClick={onSignIn}
            className="bg-orange-500 hover:bg-orange-400 text-black font-bold px-8 py-3.5 rounded-xl transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const upcoming = bookings.filter(b => b.status === 'confirmed' && !isPast(parseISO(`${b.date}T${b.end_time}`)));
  const past = bookings.filter(b => b.status !== 'confirmed' || isPast(parseISO(`${b.date}T${b.end_time}`)));

  return (
    <div className="bg-zinc-950 min-h-full">
      <h1 className="text-2xl font-black text-white tracking-tight mb-6">Bookings</h1>

      {/* Upcoming */}
      <section className="mb-8">
        <p className="text-zinc-600 text-[10px] font-bold tracking-[0.25em] uppercase mb-3">Upcoming</p>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
          </div>
        ) : upcoming.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
            <Calendar className="w-7 h-7 text-zinc-700 mx-auto mb-2" />
            <p className="text-zinc-600 text-sm">No upcoming bookings</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((b, i) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-0.5 self-stretch bg-emerald-500 rounded-full shrink-0" />
                  <div>
                    <p className="font-bold text-white text-sm">
                      {b.spaces?.name}
                      {b.space_units?.name ? <span className="text-zinc-500 font-normal"> · {b.space_units.name}</span> : ''}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-zinc-500 text-xs">
                        <Calendar className="w-3 h-3" />
                        {format(parseISO(b.date), 'EEE, MMM d')}
                      </span>
                      <span className="flex items-center gap-1 text-zinc-500 text-xs">
                        <Clock className="w-3 h-3" />
                        {formatTime(b.start_time)} – {formatTime(b.end_time)}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => cancelBooking(b.id)}
                  disabled={cancellingId === b.id}
                  className="ml-3 p-2 rounded-lg border border-zinc-800 text-zinc-600 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 transition-all disabled:opacity-30"
                  title="Cancel booking"
                >
                  {cancellingId === b.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <X className="w-4 h-4" />
                  }
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section>
          <p className="text-zinc-600 text-[10px] font-bold tracking-[0.25em] uppercase mb-3">Past</p>
          <div className="space-y-2">
            {past.slice(0, 20).map(b => (
              <div
                key={b.id}
                className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 flex items-center justify-between opacity-50"
              >
                <div>
                  <p className="font-medium text-zinc-300 text-sm">
                    {b.spaces?.name}
                    {b.space_units?.name ? ` · ${b.space_units.name}` : ''}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-zinc-600 text-xs">
                      {format(parseISO(b.date), 'MMM d')} · {formatTime(b.start_time)}
                    </span>
                    {b.status === 'cancelled' && (
                      <span className="text-[10px] font-bold text-red-600 tracking-widest uppercase">Cancelled</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
