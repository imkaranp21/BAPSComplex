import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, X, Loader2 } from 'lucide-react';
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
  if (h === 0) return '12AM';
  if (h < 12) return `${h}${m ? `:${String(m).padStart(2, '0')}` : ''}AM`;
  if (h === 12) return `12${m ? `:${String(m).padStart(2, '0')}` : ''}PM`;
  return `${h - 12}${m ? `:${String(m).padStart(2, '0')}` : ''}PM`;
}

export function BookingsScreen({ onSignIn }: BookingsScreenProps) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

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
    setCancelError(null);
    const { error } = await (supabase as any)
      .rpc('cancel_own_booking', { p_booking_id: id });
    if (!error) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
    } else {
      setCancelError(error.message ?? 'Could not cancel booking.');
    }
    setCancellingId(null);
  }

  if (!user) {
    return (
      <div className="bg-zinc-950 min-h-full flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mb-7">
          <Calendar className="w-9 h-9 text-zinc-700" />
        </div>
        <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none mb-2">Bookings</h2>
        <p className="text-zinc-600 text-sm mb-9 text-center max-w-xs">Sign in to view your upcoming and past bookings.</p>
        <button
          onClick={onSignIn}
          className="bg-violet-600 hover:bg-violet-500 text-white font-black px-10 py-4 rounded-2xl transition-colors text-sm tracking-widest uppercase"
        >
          Sign In
        </button>
      </div>
    );
  }

  const upcoming = bookings.filter(b => b.status === 'confirmed' && !isPast(parseISO(`${b.date}T${b.end_time}`)));
  const past = bookings.filter(b => b.status !== 'confirmed' || isPast(parseISO(`${b.date}T${b.end_time}`)));

  return (
    <div className="bg-zinc-950 min-h-full">

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <p className="text-zinc-700 text-[10px] font-black tracking-[0.3em] uppercase mb-2">Your</p>
        <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">Bookings</h1>
      </motion.div>

      {cancelError && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <p className="text-red-400 text-xs font-bold">{cancelError}</p>
        </div>
      )}

      {/* Upcoming */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <p className="text-zinc-700 text-[10px] font-black tracking-[0.3em] uppercase">Upcoming</p>
          <span className="text-zinc-700 text-[10px] font-black tracking-widest uppercase">{upcoming.length}</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-14">
            <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
          </div>
        ) : upcoming.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
            <p className="text-zinc-600 text-sm">No upcoming bookings</p>
            <p className="text-zinc-700 text-xs mt-1">Head to a space to book a slot.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((b, i) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4 hover:border-zinc-700 transition-all"
              >
                <div className="w-1 self-stretch bg-emerald-500 rounded-full shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-black text-white text-base uppercase tracking-tight leading-none">
                    {b.spaces?.name}
                  </p>
                  {b.space_units?.name && (
                    <p className="text-zinc-500 text-xs mt-0.5">{b.space_units.name}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-zinc-500 text-xs font-medium">{format(parseISO(b.date), 'EEE, MMM d')}</span>
                    <span className="text-zinc-700">·</span>
                    <span className="text-zinc-500 text-xs font-medium">{formatTime(b.start_time)} – {formatTime(b.end_time)}</span>
                  </div>
                </div>
                <button
                  onClick={() => cancelBooking(b.id)}
                  disabled={cancellingId === b.id}
                  className="p-2.5 rounded-xl border border-zinc-800 text-zinc-600 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 transition-all disabled:opacity-30"
                  title="Cancel"
                >
                  {cancellingId === b.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <X className="w-3.5 h-3.5" />
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
          <p className="text-zinc-700 text-[10px] font-black tracking-[0.3em] uppercase mb-4">History</p>
          <div className="space-y-2">
            {past.slice(0, 20).map(b => (
              <div
                key={b.id}
                className="bg-zinc-900/40 border border-zinc-800/40 rounded-2xl p-4 flex items-center gap-4 opacity-40"
              >
                <div className="w-1 self-stretch bg-zinc-700 rounded-full shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-black text-zinc-300 text-sm uppercase tracking-tight">
                    {b.spaces?.name}{b.space_units?.name ? ` · ${b.space_units.name}` : ''}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-zinc-600 text-xs">{format(parseISO(b.date), 'MMM d')} · {formatTime(b.start_time)}</span>
                    {b.status === 'cancelled' && (
                      <span className="text-[9px] font-black text-red-600 tracking-[0.2em] uppercase">Cancelled</span>
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
