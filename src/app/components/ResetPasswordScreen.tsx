import { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ResetPasswordScreenProps {
  onDone: () => void;
}

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 transition-colors';

export function ResetPasswordScreen({ onDone }: ResetPasswordScreenProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setSubmitting(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) { setError(err.message); setSubmitting(false); }
    else { setSuccess(true); setTimeout(onDone, 2000); }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-white tracking-tight mb-2">Password updated!</h2>
          <p className="text-zinc-500">Taking you to the app…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-violet-600 rounded-xl mb-5">
            <span className="text-black text-xl font-black">Y</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Set new password</h1>
          <p className="text-zinc-600 text-sm mt-1.5">Choose a new password for your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-500 tracking-widest uppercase mb-2">New Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" className={inputClass} autoComplete="new-password" required minLength={6} />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 tracking-widest uppercase mb-2">Confirm Password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••" className={inputClass} autoComplete="new-password" required />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
