import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, RefreshCw, ArrowRight, Camera, Loader2, User } from 'lucide-react';
import { format, differenceInMinutes, parseISO } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';

interface Arrival {
  booking_id: string;
  start_time: string;
  end_time: string;
  space_name: string;
  member_name: string;
  avatar_url: string | null;
}

function formatTime(t: string) {
  const h = parseInt(t.split(':')[0]);
  const m = parseInt(t.split(':')[1]);
  if (h === 0) return `12:${String(m).padStart(2,'0')} AM`;
  if (h < 12) return `${h}:${String(m).padStart(2,'0')} AM`;
  if (h === 12) return `12:${String(m).padStart(2,'0')} PM`;
  return `${h-12}:${String(m).padStart(2,'0')} PM`;
}

function minutesUntil(timeStr: string): number {
  const now = new Date();
  const [h, m] = timeStr.split(':').map(Number);
  const target = new Date();
  target.setHours(h, m, 0, 0);
  return differenceInMinutes(target, now);
}

function AvatarCircle({ url, name, size = 'lg' }: { url: string | null; name: string; size?: 'sm' | 'lg' }) {
  const dim = size === 'lg' ? 'w-16 h-16' : 'w-10 h-10';
  const text = size === 'lg' ? 'text-2xl' : 'text-base';
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={`${dim} rounded-full object-cover shrink-0 border-2 border-zinc-700`}
      />
    );
  }
  return (
    <div className={`${dim} rounded-full bg-violet-600 flex items-center justify-center shrink-0 border-2 border-zinc-700`}>
      <span className={`font-black text-white ${text} leading-none`}>
        {name[0]?.toUpperCase()}
      </span>
    </div>
  );
}

// ── Login screen ──────────────────────────────────────────────────────────────
function SecurityLogin({ onSuccess }: { onSuccess: () => void }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await signIn(email, password);
    if (err) {
      setError('Incorrect email or password.');
      setLoading(false);
    } else {
      onSuccess();
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_30%,_rgba(109,40,217,0.15)_0%,_transparent_70%)]" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-violet-900/20 blur-[80px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="mb-10">
          <div className="w-14 h-14 bg-violet-600 rounded-2xl flex items-center justify-center mb-6 relative">
            <div className="absolute w-20 h-20 rounded-full bg-white/10 blur-xl" />
            <User className="relative w-7 h-7 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter leading-none uppercase">Staff<br />Portal</h1>
          <p className="text-zinc-600 text-[10px] font-black tracking-[0.3em] uppercase mt-2">Yogi Sports Complex · Door</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-zinc-600 tracking-[0.25em] uppercase mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="staff@yogisports.com"
              required
              className="w-full px-4 py-3.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white placeholder:text-zinc-700 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 transition-colors text-sm"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-zinc-600 tracking-[0.25em] uppercase mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white placeholder:text-zinc-700 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 transition-colors text-sm"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group w-full flex items-center justify-between bg-violet-600 hover:bg-violet-500 text-white font-black py-5 px-6 rounded-2xl transition-colors disabled:opacity-40 mt-2"
          >
            <span className="flex items-center gap-2.5">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span className="text-sm tracking-widest uppercase">{loading ? 'Signing in…' : 'Sign In'}</span>
            </span>
            {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ── Main dashboard ─────────────────────────────────────────────────────────────
function SecurityDashboard() {
  const { profile, signOut } = useAuth();
  const [arrivals, setArrivals] = useState<Arrival[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick] = useState(0);
  const [setupError, setSetupError] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);

    const { data, error } = await (supabase as any).rpc('get_staff_arrivals');

    if (error) {
      if (error.message?.includes('function') || error.code === '42883') {
        setSetupError(true);
      }
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setArrivals(data ?? []);
    setSetupError(false);
    setLoading(false);
    setRefreshing(false);
  }, []);

  // Initial load + auto-refresh every 60s
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const iv = setInterval(() => load(true), 60_000);
    return () => clearInterval(iv);
  }, [load]);

  // Tick every 30s to update countdowns
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(iv);
  }, []);

  // Realtime: new booking for today
  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const channel = supabase.channel('staff-bookings')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'bookings',
        filter: `date=eq.${today}`,
      }, () => load(true))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  // Split arrivals
  const now = new Date();
  const soonCutoff = 30;

  const arriving = arrivals.filter(a => {
    const mins = minutesUntil(a.start_time);
    return mins >= -10 && mins <= soonCutoff;
  });
  const upcoming = arrivals.filter(a => {
    const mins = minutesUntil(a.start_time);
    return mins > soonCutoff;
  });
  const current = arrivals.filter(a => {
    const mins = minutesUntil(a.start_time);
    return mins < -10 && minutesUntil(a.end_time) > 0;
  });

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Ambient violet glow */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-violet-900/20 blur-[100px] rounded-full z-0" />

      {/* Header */}
      <div className="relative z-10 sticky top-0 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800/60 px-5 h-14 flex items-center justify-between">
        <div>
          <p className="text-zinc-600 text-[9px] font-black tracking-[0.3em] uppercase">Yogi Sports</p>
          <p className="text-white font-black text-sm tracking-tight leading-none">DOOR CHECK</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => load(true)}
            className={`p-2 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-white transition-all ${refreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 text-zinc-600 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 transition-all text-xs font-black uppercase tracking-widest"
          >
            <LogOut className="w-3 h-3" />
            Out
          </button>
        </div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6 space-y-8">

        {/* Setup error */}
        {setupError && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
            <p className="text-amber-400 font-black text-sm mb-2 uppercase tracking-tight">Setup Required</p>
            <p className="text-zinc-500 text-xs leading-relaxed mb-3">
              Run the SQL migration in Supabase to enable this portal. Ask the admin to run <code className="text-violet-400">get_staff_arrivals()</code> setup.
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* Currently inside */}
            {current.length > 0 && (
              <section>
                <p className="text-zinc-600 text-[10px] font-black tracking-[0.3em] uppercase mb-3">Inside Now</p>
                <div className="space-y-2">
                  {current.map(a => (
                    <div key={a.booking_id} className="bg-zinc-900 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-4">
                      <AvatarCircle url={a.avatar_url} name={a.member_name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-white text-sm uppercase tracking-tight">{a.member_name}</p>
                        <p className="text-zinc-500 text-xs mt-0.5">{a.space_name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[9px] font-black tracking-[0.2em] uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                          Inside
                        </span>
                        <p className="text-zinc-600 text-[10px] mt-1">Until {formatTime(a.end_time)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Arriving soon */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <p className="text-zinc-600 text-[10px] font-black tracking-[0.3em] uppercase">Arriving Soon</p>
                {arriving.length > 0 && (
                  <span className="text-[9px] font-black tracking-widest uppercase text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-full">
                    {arriving.length} incoming
                  </span>
                )}
              </div>

              <AnimatePresence>
                {arriving.length === 0 ? (
                  <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-8 text-center">
                    <p className="text-zinc-600 text-sm">Nobody arriving in the next 30 minutes</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {arriving.map(a => {
                      const mins = minutesUntil(a.start_time);
                      const isVeryClose = mins <= 10;
                      return (
                        <motion.div
                          key={a.booking_id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.97 }}
                          className={`bg-zinc-900 rounded-2xl p-5 flex items-center gap-5 border ${
                            isVeryClose ? 'border-amber-500/40 shadow-lg shadow-amber-900/20' : 'border-zinc-700'
                          }`}
                        >
                          <div className="relative shrink-0">
                            <AvatarCircle url={a.avatar_url} name={a.member_name} size="lg" />
                            {isVeryClose && (
                              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full border-2 border-zinc-900 animate-pulse" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-white text-xl uppercase tracking-tighter leading-none">
                              {a.member_name}
                            </p>
                            <p className="text-zinc-500 text-sm mt-1">{a.space_name}</p>
                            <p className="text-zinc-700 text-xs mt-0.5">{formatTime(a.start_time)} – {formatTime(a.end_time)}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-2xl font-black leading-none ${isVeryClose ? 'text-amber-400' : 'text-white'}`}>
                              {mins <= 0 ? 'Now' : `${mins}m`}
                            </p>
                            <p className="text-zinc-600 text-[9px] tracking-widest uppercase mt-1">
                              {mins <= 0 ? 'overdue' : 'until arrival'}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </AnimatePresence>
            </section>

            {/* Rest of today */}
            {upcoming.length > 0 && (
              <section>
                <p className="text-zinc-600 text-[10px] font-black tracking-[0.3em] uppercase mb-3">Later Today</p>
                <div className="space-y-2">
                  {upcoming.map(a => {
                    const mins = minutesUntil(a.start_time);
                    const hours = Math.floor(mins / 60);
                    const rem = mins % 60;
                    const countdown = hours > 0 ? `${hours}h ${rem}m` : `${mins}m`;
                    return (
                      <div key={a.booking_id} className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 flex items-center gap-4 transition-all">
                        <AvatarCircle url={a.avatar_url} name={a.member_name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-white text-sm uppercase tracking-tight">{a.member_name}</p>
                          <p className="text-zinc-600 text-xs mt-0.5">{a.space_name}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-white font-black text-sm">{formatTime(a.start_time)}</p>
                          <p className="text-zinc-700 text-[10px] mt-0.5">in {countdown}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* No bookings at all */}
            {arrivals.length === 0 && !setupError && (
              <div className="text-center py-16">
                <p className="text-zinc-600 text-sm">No bookings for today yet.</p>
                <p className="text-zinc-700 text-xs mt-1">{format(new Date(), 'EEEE, MMMM d')}</p>
              </div>
            )}
          </>
        )}

        {/* Last updated */}
        <p className="text-center text-zinc-800 text-[9px] tracking-[0.3em] uppercase pb-4">
          Auto-refreshes every minute · {format(now, 'h:mm a')}
        </p>
      </div>
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────
export function SecurityApp() {
  const { user, profile, loading, isStaff, isAdmin, signOut } = useAuth();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (user) setAuthed(true);
    else setAuthed(false);
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authed || !user) {
    return <SecurityLogin onSuccess={() => setAuthed(true)} />;
  }

  // Profile is still loading — show spinner
  if (!profile) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Access denied — not staff or admin
  if (!isStaff && !isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6">
        <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-6">
          <span className="text-red-400 text-2xl font-black">!</span>
        </div>
        <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none mb-3 text-center">Access Denied</h2>
        <p className="text-zinc-500 text-sm text-center max-w-xs leading-relaxed">
          This portal is for authorised staff only. Contact an admin to grant you access.
        </p>
        <button
          onClick={signOut}
          className="mt-8 px-6 py-3 rounded-xl border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700 transition-all text-xs font-black uppercase tracking-widest"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return <SecurityDashboard />;
}
