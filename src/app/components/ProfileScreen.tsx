import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LogOut, Calendar, Clock, X, User, Loader2 } from 'lucide-react';
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

interface ProfileScreenProps {
  onSignIn: () => void;
}

export function ProfileScreen({ onSignIn }: ProfileScreenProps) {
  const { user, profile, signOut } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchBookings();
  }, [user]);

  async function fetchBookings() {
    setLoadingBookings(true);
    const { data } = await (supabase as any)
      .from('bookings')
      .select('id, date, start_time, end_time, status, spaces(name), space_units(name)')
      .order('date', { ascending: false })
      .order('start_time', { ascending: false })
      .limit(30);
    setBookings((data as Booking[]) ?? []);
    setLoadingBookings(false);
  }

  async function cancelBooking(id: string) {
    setCancellingId(id);
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
    setCancellingId(null);
  }

  function formatTime(t: string) {
    const [h, m] = t.split(':').map(Number);
    if (h === 0) return '12:00 AM';
    if (h < 12) return `${h}:${String(m).padStart(2, '0')} AM`;
    if (h === 12) return '12:00 PM';
    return `${h - 12}:${String(m).padStart(2, '0')} PM`;
  }

  if (!user) {
    return (
      <div className="bg-[#FFFBF5] pt-6 pb-4">
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-stone-100 rounded-2xl mb-5">
            <User className="w-8 h-8 text-stone-400" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 mb-2">Sign in to access your profile</h2>
          <p className="text-stone-500 text-sm mb-8">View your bookings and manage your account.</p>
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

  const membershipLabel = profile
    ? profile.membership_status === 'active'
      ? profile.membership_tier ? `Tier ${profile.membership_tier} Member` : 'Active Member'
      : profile.membership_status === 'pending'
      ? 'Pending Approval'
      : 'Suspended'
    : null;

  const statusColor = profile?.membership_status === 'active'
    ? 'bg-green-100 text-green-700'
    : profile?.membership_status === 'pending'
    ? 'bg-amber-100 text-amber-700'
    : 'bg-red-100 text-red-700';

  return (
    <div className="bg-[#FFFBF5]">
      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-stone-200 rounded-2xl p-5 mb-6 shadow-sm"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center">
              <span className="text-orange-600 font-bold text-xl">
                {(profile?.full_name ?? user.email ?? 'U')[0].toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">{profile?.full_name ?? 'Member'}</h2>
              <p className="text-stone-400 text-sm">{user.email}</p>
              {membershipLabel && (
                <span className={`inline-block mt-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor}`}>
                  {membershipLabel}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {profile?.membership_status === 'pending' && (
          <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <p className="text-sm text-amber-800">
              Your membership is pending approval. An admin will assign your tier shortly.
            </p>
          </div>
        )}
      </motion.div>

      {/* Upcoming bookings */}
      <section className="mb-8">
        <h3 className="text-stone-400 text-xs font-semibold tracking-widest uppercase mb-3">
          Upcoming Bookings
        </h3>
        {loadingBookings ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-orange-600 animate-spin" />
          </div>
        ) : upcoming.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-xl p-5 text-center shadow-sm">
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

      {/* Past / cancelled */}
      {past.length > 0 && (
        <section>
          <h3 className="text-stone-400 text-xs font-semibold tracking-widest uppercase mb-3">
            Past Bookings
          </h3>
          <div className="space-y-2">
            {past.slice(0, 10).map(b => (
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
