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
      <div className="bg-[#FFFBF5] pt-6 pb-4">
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-stone-100 rounded-2xl mb-5">
            <Calendar className="w-8 h-8 text-stone-400" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 mb-2">Sign in to view bookings</h2>
          <p className="text-stone-500 text-sm mb-8">Your upcoming and past bookings will appear here.</p>
          <button
            onClick={onSignIn}
            className="bg-orange-600 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-orange-700 transition-colors"
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
    <div className="bg-[#FFFBF5]">
      <h1 className="text-2xl font-bold text-stone-900 mb-6">My Bookings</h1>

      {/* Upcoming */}
      <section className="mb-8">
        <h3 className="text-stone-400 text-xs font-semibold tracking-widest uppercase mb-3">
          Upcoming
        </h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-orange-600 animate-spin" />
          </div>
        ) : upcoming.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-xl p-6 text-center shadow-sm">
            <Calendar className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-stone-400 text-sm">No upcoming bookings</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map(b => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-stone-900">
                    {b.spaces?.name}
                    {b.space_units?.name ? ` · ${b.space_units.name}` : ''}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-stone-500 text-xs">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(parseISO(b.date), 'EEE, MMM d')}
                    </span>
                    <span className="flex items-center gap-1 text-stone-500 text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      {formatTime(b.start_time)} – {formatTime(b.end_time)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => cancelBooking(b.id)}
                  disabled={cancellingId === b.id}
                  className="ml-3 p-2 rounded-xl hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors disabled:opacity-40"
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
          <h3 className="text-stone-400 text-xs font-semibold tracking-widest uppercase mb-3">
            Past
          </h3>
          <div className="space-y-2">
            {past.slice(0, 20).map(b => (
              <div
                key={b.id}
                className="bg-white border border-stone-100 rounded-xl p-4 flex items-center justify-between opacity-60"
              >
                <div>
                  <p className="font-medium text-stone-700 text-sm">
                    {b.spaces?.name}
                    {b.space_units?.name ? ` · ${b.space_units.name}` : ''}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-stone-400 text-xs">
                      {format(parseISO(b.date), 'MMM d')} · {formatTime(b.start_time)}
                    </span>
                    {b.status === 'cancelled' && (
                      <span className="text-xs text-red-500 font-medium">Cancelled</span>
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
