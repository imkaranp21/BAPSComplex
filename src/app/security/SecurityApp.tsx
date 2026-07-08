import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, RefreshCw, Loader2, UserPlus, ArrowRight, ScanLine, X, CheckCircle, XCircle } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';

interface Arrival {
  booking_id: string;
  start_time: string;
  end_time: string;
  space_name: string;
  member_name: string;
  avatar_url: string | null;
  checked_in_at: string | null;
}

function formatTime(t: string) {
  const h = parseInt(t.split(':')[0]);
  const m = parseInt(t.split(':')[1]);
  const pad = String(m).padStart(2, '0');
  if (h === 0) return `12:${pad} AM`;
  if (h < 12) return `${h}:${pad} AM`;
  if (h === 12) return `12:${pad} PM`;
  return `${h - 12}:${pad} PM`;
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
  if (url) return <img src={url} alt={name} className={`${dim} rounded-full object-cover shrink-0 border-2 border-zinc-700`} />;
  return (
    <div className={`${dim} rounded-full bg-violet-600 flex items-center justify-center shrink-0 border-2 border-zinc-700`}>
      <span className={`font-black text-white ${text} leading-none`}>{name[0]?.toUpperCase()}</span>
    </div>
  );
}

// ── QR Scanner ───────────────────────────────────────────────────────────────
interface BookingSummary {
  booking_id: string;
  space_name: string;
  start_time: string;
  end_time: string;
  checked_in_at: string | null;
}

interface ScannedMember {
  full_name: string;
  avatar_url: string | null;
  membership_status: string;
  membership_tier: number | null;
  bookings: BookingSummary[];
}

function CameraScanner({ onResult }: { onResult: (text: string) => void }) {
  const [error, setError] = useState('');

  useEffect(() => {
    const qr = new Html5Qrcode('qr-reader');
    let stopped = false;

    qr.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      async (text) => {
        if (stopped) return;
        stopped = true;
        await qr.stop().catch(() => {});
        onResult(text);
      },
      () => {}
    ).catch(() => setError('Could not access camera. Please allow camera permission and try again.'));

    return () => { if (!stopped) qr.stop().catch(() => {}); };
  }, []);

  return (
    <>
      <div id="qr-reader" className="w-full max-w-xs rounded-2xl overflow-hidden" />
      {error
        ? <p className="text-red-400 text-sm text-center">{error}</p>
        : <p className="text-zinc-500 text-sm">Point the camera at the member's QR code</p>
      }
    </>
  );
}

function QRScanner({ onClose }: { onClose: () => void }) {
  const [scanKey, setScanKey]         = useState(0);
  const [member, setMember]           = useState<ScannedMember | null>(null);
  const [notFound, setNotFound]       = useState(false);
  const [looking, setLooking]         = useState(false);
  const [checkingIn, setCheckingIn]   = useState<string | null>(null);
  const showCamera = !member && !notFound && !looking;

  async function handleResult(text: string) {
    setLooking(true);
    const { data } = await (supabase as any).rpc('lookup_member_by_id', { member_id: text });
    setLooking(false);
    if (data) setMember({ ...data, bookings: data.bookings ?? [] });
    else setNotFound(true);
  }

  async function checkIn(bookingId: string) {
    setCheckingIn(bookingId);
    await (supabase as any).rpc('checkin_booking', { p_booking_id: bookingId });
    setMember(prev => prev ? {
      ...prev,
      bookings: prev.bookings.map(b =>
        b.booking_id === bookingId ? { ...b, checked_in_at: new Date().toISOString() } : b
      )
    } : null);
    setCheckingIn(null);
  }

  function reset() {
    setMember(null);
    setNotFound(false);
    setScanKey(k => k + 1);
  }

  const isActive = member?.membership_status === 'active';

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col overflow-y-auto">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 sticky top-0 bg-zinc-950 z-10">
        <p className="text-white font-black tracking-tight">Scan Member QR</p>
        <button onClick={onClose} className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-6">
        {showCamera && <CameraScanner key={scanKey} onResult={handleResult} />}

        {looking && <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />}

        {member && (
          <div className="w-full max-w-xs space-y-4">
            {/* Member card */}
            <div className={`rounded-3xl border p-6 text-center ${isActive ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
              {member.avatar_url
                ? <img src={member.avatar_url} alt={member.full_name} className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-4 border-zinc-700" />
                : <div className="w-20 h-20 rounded-full bg-violet-600 flex items-center justify-center mx-auto mb-3 text-3xl font-black text-white">{member.full_name[0]}</div>
              }
              {isActive
                ? <CheckCircle className="w-7 h-7 text-emerald-400 mx-auto mb-2" />
                : <XCircle className="w-7 h-7 text-red-400 mx-auto mb-2" />
              }
              <p className="text-white font-black text-xl tracking-tight">{member.full_name}</p>
              {member.membership_tier && <p className="text-zinc-500 text-xs mt-0.5">Tier {member.membership_tier}</p>}
              <span className={`inline-block mt-2 text-xs font-black tracking-widest uppercase px-3 py-1 rounded-full ${isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {member.membership_status}
              </span>
            </div>

            {/* Today's bookings */}
            {member.bookings.length > 0 ? (
              <div className="space-y-2">
                <p className="text-zinc-600 text-[10px] font-black tracking-[0.25em] uppercase">Today's Bookings</p>
                {member.bookings.map(b => (
                  <div key={b.booking_id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-white font-black text-sm">{b.space_name}</p>
                        <p className="text-zinc-500 text-xs mt-0.5">{formatTime(b.start_time)} – {formatTime(b.end_time)}</p>
                      </div>
                      {b.checked_in_at ? (
                        <span className="flex items-center gap-1 text-[10px] font-black tracking-widest uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full shrink-0">
                          <CheckCircle className="w-3 h-3" /> In
                        </span>
                      ) : (
                        <button
                          onClick={() => checkIn(b.booking_id)}
                          disabled={!isActive || checkingIn === b.booking_id}
                          className="flex items-center gap-1 text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-40 shrink-0"
                        >
                          {checkingIn === b.booking_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                          Check In
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
                <p className="text-zinc-500 text-sm">No bookings for today</p>
              </div>
            )}

            <button onClick={reset} className="w-full py-3 rounded-xl bg-zinc-800 text-zinc-300 text-sm font-bold hover:bg-zinc-700 transition-colors">
              Scan Another
            </button>
          </div>
        )}

        {notFound && (
          <div className="w-full max-w-xs rounded-3xl border border-red-500/30 bg-red-500/5 p-7 text-center">
            <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-white font-black text-lg mb-1">Not Found</p>
            <p className="text-zinc-500 text-sm mb-5">This QR code doesn't match any member.</p>
            <button onClick={reset} className="w-full py-3 rounded-xl bg-zinc-800 text-zinc-300 text-sm font-bold hover:bg-zinc-700 transition-colors">Try Again</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Auth screen (login + register) ────────────────────────────────────────────
function StaffAuth() {
  const { signIn } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regDone, setRegDone] = useState(false);

  const inputCls = 'w-full px-4 py-3.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white placeholder:text-zinc-700 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 transition-colors text-sm';
  const labelCls = 'block text-[10px] font-black text-zinc-600 tracking-[0.25em] uppercase mb-2';

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setLoginError('Incorrect email or password.');
      setLoginLoading(false);
    }
    // on success AuthContext updates and SecurityApp re-renders
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegError('');
    setRegLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: { data: { full_name: regName.trim() } },
    });

    if (error) {
      setRegError(error.message);
      setRegLoading(false);
      return;
    }

    // If we have an immediate session, mark is_staff now
    if (data.session && data.user) {
      await supabase.from('profiles').update({ is_staff: true }).eq('id', data.user.id);
    }
    // If email confirmation is required, admin will activate via Members page

    setRegLoading(false);
    setRegDone(true);
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_30%,_rgba(109,40,217,0.15)_0%,_transparent_70%)]" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-violet-900/20 blur-[80px] rounded-full pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-sm">

        {/* Brand */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white tracking-tighter leading-none uppercase">Staff<br />Portal</h1>
          <p className="text-zinc-600 text-[10px] font-black tracking-[0.3em] uppercase mt-2">Yogi Sports Complex · Door Check</p>
        </div>

        {/* Tab toggle */}
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 mb-7">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-3 rounded-lg text-[10px] font-black tracking-[0.2em] uppercase transition-all ${tab === 'login' ? 'bg-zinc-700 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 py-3 rounded-lg text-[10px] font-black tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-1.5 ${tab === 'register' ? 'bg-zinc-700 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            <UserPlus className="w-3 h-3" />
            New Staff
          </button>
        </div>

        <AnimatePresence mode="wait">
          {tab === 'login' ? (
            <motion.form key="login" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="staff@yogisports.com" required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className={inputCls} />
              </div>
              {loginError && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">{loginError}</p>}
              <button type="submit" disabled={loginLoading} className="group w-full flex items-center justify-between bg-violet-600 hover:bg-violet-500 text-white font-black py-5 px-6 rounded-2xl transition-colors disabled:opacity-40">
                <span className="flex items-center gap-2.5">
                  {loginLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span className="text-sm tracking-widest uppercase">{loginLoading ? 'Signing in…' : 'Sign In'}</span>
                </span>
                {!loginLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
              </button>
            </motion.form>
          ) : regDone ? (
            <motion.div key="reg-done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <span className="text-3xl text-emerald-500 font-black">✓</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none mb-2">Account Created</h2>
              <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                Ask an admin to activate your staff access, then sign in.
              </p>
              <button onClick={() => { setTab('login'); setRegDone(false); }} className="text-violet-400 hover:text-violet-300 text-sm font-black tracking-widest uppercase transition-colors">
                Back to Sign In →
              </button>
            </motion.div>
          ) : (
            <motion.form key="register" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className={labelCls}>Full Name</label>
                <input type="text" value={regName} onChange={e => setRegName(e.target.value)} placeholder="Your name" required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="you@example.com" required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Password</label>
                <input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="••••••••" required minLength={6} className={inputCls} />
              </div>
              {regError && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">{regError}</p>}
              <button type="submit" disabled={regLoading} className="group w-full flex items-center justify-between bg-violet-600 hover:bg-violet-500 text-white font-black py-5 px-6 rounded-2xl transition-colors disabled:opacity-40">
                <span className="flex items-center gap-2.5">
                  {regLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span className="text-sm tracking-widest uppercase">{regLoading ? 'Creating…' : 'Create Staff Account'}</span>
                </span>
                {!regLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
              </button>
              <p className="text-[10px] text-zinc-700 text-center leading-relaxed">
                An admin will activate your access after sign-up.
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ── Pending access screen ─────────────────────────────────────────────────────
function PendingAccess() {
  const { signOut, profile } = useAuth();
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6">
      <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mb-6">
        <span className="text-amber-400 text-2xl font-black">⏳</span>
      </div>
      <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none mb-3 text-center">
        Access Pending
      </h2>
      <p className="text-zinc-500 text-sm text-center max-w-xs leading-relaxed mb-2">
        Your account has been created{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}.
      </p>
      <p className="text-zinc-600 text-sm text-center max-w-xs leading-relaxed mb-8">
        Ask an admin to activate your staff access from the admin panel, then refresh this page.
      </p>
      <button
        onClick={signOut}
        className="px-6 py-3 rounded-xl border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700 transition-all text-xs font-black uppercase tracking-widest"
      >
        Sign Out
      </button>
    </div>
  );
}

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function fireNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/baps-logo.png', tag: title });
  }
}

// ── Dashboard (also exported for use in main App) ─────────────────────────────
export function StaffDashboard() {
  const { signOut } = useAuth();
  const [arrivals, setArrivals] = useState<Arrival[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [setupError, setSetupError] = useState(false);
  const [tick, setTick] = useState(0);
  const [showScanner, setShowScanner] = useState(false);
  // track which booking IDs we've already notified so we don't fire twice
  const notifiedRef = useState(() => new Set<string>())[0];

  // Ask for notification permission as soon as staff logs in
  useEffect(() => { requestNotificationPermission(); }, []);

  function checkAndNotify(data: Arrival[]) {
    data.forEach(a => {
      const mins = minutesUntil(a.start_time);
      if (mins >= 0 && mins <= 30 && !notifiedRef.has(a.booking_id)) {
        notifiedRef.add(a.booking_id);
        fireNotification(
          `${a.member_name} arriving in ${mins === 0 ? 'now' : `${mins} min`}`,
          `${a.space_name} · ${formatTime(a.start_time)}`
        );
      }
    });
  }

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    const { data, error } = await (supabase as any).rpc('get_staff_arrivals');
    if (error) {
      setSetupError(true);
    } else {
      const list: Arrival[] = data ?? [];
      setArrivals(list);
      setSetupError(false);
      checkAndNotify(list);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const iv = setInterval(() => load(true), 60_000); return () => clearInterval(iv); }, [load]);
  useEffect(() => { const iv = setInterval(() => setTick(t => t + 1), 30_000); return () => clearInterval(iv); }, []);

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const ch = supabase.channel('staff-arrivals')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings', filter: `date=eq.${today}` }, () => load(true))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const arriving = arrivals.filter(a => { const m = minutesUntil(a.start_time); return m >= -10 && m <= 30; });
  const upcoming = arrivals.filter(a => minutesUntil(a.start_time) > 30);
  const current  = arrivals.filter(a => { const m = minutesUntil(a.start_time); return m < -10 && minutesUntil(a.end_time) > 0; });

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-violet-900/20 blur-[100px] rounded-full z-0" />

      {/* Header */}
      <div className="relative z-10 sticky top-0 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800/60 px-5 h-14 flex items-center justify-between">
        <div>
          <p className="text-zinc-600 text-[9px] font-black tracking-[0.3em] uppercase">Yogi Sports</p>
          <p className="text-white font-black text-sm tracking-tight leading-none">DOOR CHECK</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-violet-500/30 bg-violet-600/10 text-violet-400 hover:bg-violet-600/20 transition-all text-xs font-black uppercase tracking-widest"
          >
            <ScanLine className="w-3.5 h-3.5" />
            Scan
          </button>
          <button onClick={() => load(true)} className={`p-2 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-white transition-all ${refreshing ? 'animate-spin' : ''}`}>
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={signOut} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 text-zinc-600 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 transition-all text-xs font-black uppercase tracking-widest">
            <LogOut className="w-3 h-3" />
            Out
          </button>
        </div>
      </div>

      {showScanner && <QRScanner onClose={() => setShowScanner(false)} />}

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* Notification permission nudge */}
        {'Notification' in window && Notification.permission === 'denied' && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-red-400 text-lg leading-none mt-0.5">🔔</span>
            <div>
              <p className="text-red-400 font-black text-xs uppercase tracking-wide">Notifications blocked</p>
              <p className="text-zinc-500 text-xs mt-1">Enable notifications for this site in your browser settings to receive arrival alerts.</p>
            </div>
          </div>
        )}
        {'Notification' in window && Notification.permission === 'default' && (
          <button
            onClick={() => Notification.requestPermission().then(() => setTick(t => t + 1))}
            className="w-full bg-violet-600/10 border border-violet-500/30 rounded-2xl p-4 flex items-center gap-3 hover:bg-violet-600/15 transition-all text-left"
          >
            <span className="text-2xl">🔔</span>
            <div>
              <p className="text-violet-300 font-black text-xs uppercase tracking-wide">Enable arrival notifications</p>
              <p className="text-zinc-500 text-xs mt-0.5">Tap to allow — you'll get alerted when someone is arriving in 30 min.</p>
            </div>
          </button>
        )}

        {setupError && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
            <p className="text-amber-400 font-black text-sm mb-1 uppercase tracking-tight">Setup Required</p>
            <p className="text-zinc-500 text-xs">Run the SQL migration in Supabase to enable this portal.</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-violet-400 animate-spin" /></div>
        ) : (
          <>
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
                        <span className="text-[9px] font-black tracking-[0.2em] uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">Inside</span>
                        <p className="text-zinc-600 text-[10px] mt-1">Until {formatTime(a.end_time)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <div className="flex items-center justify-between mb-3">
                <p className="text-zinc-600 text-[10px] font-black tracking-[0.3em] uppercase">Arriving Soon</p>
                {arriving.length > 0 && (
                  <span className="text-[9px] font-black tracking-widest uppercase text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-full">{arriving.length} incoming</span>
                )}
              </div>
              <AnimatePresence>
                {arriving.length === 0 ? (
                  <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-8 text-center">
                    <p className="text-zinc-600 text-sm">Nobody arriving in the next 30 minutes</p>
                  </div>
                ) : arriving.map(a => {
                  const mins = minutesUntil(a.start_time);
                  const close = mins <= 10;
                  return (
                    <motion.div key={a.booking_id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                      className={`bg-zinc-900 rounded-2xl p-5 flex items-center gap-5 border mb-3 ${close ? 'border-amber-500/40 shadow-lg shadow-amber-900/20' : 'border-zinc-700'}`}>
                      <div className="relative shrink-0">
                        <AvatarCircle url={a.avatar_url} name={a.member_name} size="lg" />
                        {close && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full border-2 border-zinc-900 animate-pulse" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-white text-xl uppercase tracking-tighter leading-none">{a.member_name}</p>
                        <p className="text-zinc-500 text-sm mt-1">{a.space_name}</p>
                        <p className="text-zinc-700 text-xs mt-0.5">{formatTime(a.start_time)} – {formatTime(a.end_time)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {a.checked_in_at ? (
                          <span className="flex items-center gap-1 text-[9px] font-black tracking-widest uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                            <CheckCircle className="w-3 h-3" /> Checked In
                          </span>
                        ) : (
                          <>
                            <p className={`text-2xl font-black leading-none ${close ? 'text-amber-400' : 'text-white'}`}>{mins <= 0 ? 'Now' : `${mins}m`}</p>
                            <p className="text-zinc-600 text-[9px] tracking-widest uppercase mt-1">{mins <= 0 ? 'overdue' : 'until arrival'}</p>
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </section>

            {upcoming.length > 0 && (
              <section>
                <p className="text-zinc-600 text-[10px] font-black tracking-[0.3em] uppercase mb-3">Later Today</p>
                <div className="space-y-2">
                  {upcoming.map(a => {
                    const mins = minutesUntil(a.start_time);
                    const h = Math.floor(mins / 60), r = mins % 60;
                    return (
                      <div key={a.booking_id} className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 flex items-center gap-4 transition-all">
                        <AvatarCircle url={a.avatar_url} name={a.member_name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-white text-sm uppercase tracking-tight">{a.member_name}</p>
                          <p className="text-zinc-600 text-xs mt-0.5">{a.space_name}</p>
                        </div>
                        <div className="text-right shrink-0">
                          {a.checked_in_at ? (
                            <span className="flex items-center gap-1 text-[9px] font-black tracking-widest uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                              <CheckCircle className="w-3 h-3" /> Checked In
                            </span>
                          ) : (
                            <>
                              <p className="text-white font-black text-sm">{formatTime(a.start_time)}</p>
                              <p className="text-zinc-700 text-[10px] mt-0.5">in {h > 0 ? `${h}h ${r}m` : `${mins}m`}</p>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {arrivals.length === 0 && !setupError && (
              <div className="text-center py-16">
                <p className="text-zinc-600 text-sm">No bookings for today yet.</p>
                <p className="text-zinc-700 text-xs mt-1">{format(new Date(), 'EEEE, MMMM d')}</p>
              </div>
            )}
          </>
        )}
        <p className="text-center text-zinc-800 text-[9px] tracking-[0.3em] uppercase pb-4">
          Auto-refreshes every minute · {format(new Date(), 'h:mm a')}
        </p>
      </div>
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────
export function SecurityApp() {
  const { user, profile, loading, isStaff, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <StaffAuth />;
  if (!profile) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isStaff && !isAdmin) return <PendingAccess />;
  return <StaffDashboard />;
}
