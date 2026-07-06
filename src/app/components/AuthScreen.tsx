import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Mail } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';

type Mode = 'login' | 'signup' | 'forgot';

interface AuthScreenProps {
  onSuccess: () => void;
  onBack?: () => void;
  defaultMode?: 'login' | 'signup';
}

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors';
const labelClass = 'block text-xs font-bold text-zinc-500 tracking-widest uppercase mb-2';

export function AuthScreen({ onSuccess, onBack, defaultMode = 'login' }: AuthScreenProps) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { signIn, signUp } = useAuth();

  function switchMode(next: Mode) { setMode(next); setError(''); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (mode === 'forgot') {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (err) {
        setError('Could not send reset link. Please wait a few minutes and try again.');
      } else {
        setResetSent(true);
      }
      setSubmitting(false);
      return;
    }

    if (mode === 'login') {
      const { error: err } = await signIn(email, password);
      if (err) {
        setError(err.message === 'Invalid login credentials' ? 'Incorrect email or password.' : err.message);
        setSubmitting(false);
      } else {
        onSuccess();
      }
    } else {
      const fullName = [firstName.trim(), middleName.trim(), lastName.trim()].filter(Boolean).join(' ');
      const { error: err, needsConfirmation } = await signUp(email, password, fullName, phone);
      if (err) {
        setError(err.message);
        setSubmitting(false);
      } else if (needsConfirmation) {
        setAwaitingConfirmation(true);
        setSubmitting(false);
      } else {
        onSuccess();
      }
    }
  }

  // Shared info-screen layout for confirmation / reset-sent
  function InfoScreen({ title, body }: { title: string; body: React.ReactNode }) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl mb-8">
            <Mail className="w-7 h-7 text-orange-500" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mb-3">{title}</h2>
          {body}
        </motion.div>
      </div>
    );
  }

  if (awaitingConfirmation) {
    return (
      <InfoScreen
        title="Check your email"
        body={
          <>
            <p className="text-zinc-500 text-sm mb-1">We sent a confirmation link to</p>
            <p className="font-bold text-white mb-6">{email}</p>
            <p className="text-zinc-600 text-xs mb-8 leading-relaxed">
              Click the link in the email to verify your account, then come back to sign in.
            </p>
            <button
              onClick={() => { switchMode('login'); setAwaitingConfirmation(false); }}
              className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-4 rounded-xl transition-colors"
            >
              Back to Sign In
            </button>
          </>
        }
      />
    );
  }

  if (resetSent) {
    return (
      <InfoScreen
        title="Reset link sent"
        body={
          <>
            <p className="text-zinc-500 text-sm mb-1">We sent a password reset link to</p>
            <p className="font-bold text-white mb-6">{email}</p>
            <p className="text-zinc-600 text-xs mb-8 leading-relaxed">
              Check your inbox and click the link to set a new password.
            </p>
            <button
              onClick={() => { switchMode('login'); setResetSent(false); }}
              className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-4 rounded-xl transition-colors"
            >
              Back to Sign In
            </button>
          </>
        }
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {onBack && (
        <div className="p-5">
          <button
            onClick={mode === 'forgot' ? () => switchMode('login') : onBack}
            className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          {/* Brand */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-500 rounded-xl mb-5">
              <span className="text-black text-xl font-black">Y</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Yogi Sports Complex</h1>
            <p className="text-zinc-600 text-xs mt-1.5 tracking-widest uppercase">Nakuru, Kenya</p>
          </div>

          {/* Mode toggle */}
          {mode !== 'forgot' && (
            <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 mb-8">
              <button
                onClick={() => switchMode('login')}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold tracking-widest uppercase transition-all ${
                  mode === 'login' ? 'bg-zinc-700 text-white' : 'text-zinc-600 hover:text-zinc-400'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => switchMode('signup')}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold tracking-widest uppercase transition-all ${
                  mode === 'signup' ? 'bg-zinc-700 text-white' : 'text-zinc-600 hover:text-zinc-400'
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          {mode === 'forgot' && (
            <div className="mb-8">
              <h2 className="text-xl font-black text-white tracking-tight">Forgot password?</h2>
              <p className="text-zinc-500 text-sm mt-1.5">Enter your email and we'll send you a reset link.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>First Name</label>
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                      placeholder="First" className={inputClass} autoComplete="given-name" required />
                  </div>
                  <div>
                    <label className={labelClass}>Last Name</label>
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                      placeholder="Last" className={inputClass} autoComplete="family-name" required />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>
                    Middle Name <span className="text-zinc-700 normal-case font-normal tracking-normal">(optional)</span>
                  </label>
                  <input type="text" value={middleName} onChange={e => setMiddleName(e.target.value)}
                    placeholder="Middle" className={inputClass} autoComplete="additional-name" />
                </div>
                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="+254 700 000 000" className={inputClass} autoComplete="tel" required />
                </div>
              </>
            )}

            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" className={inputClass} autoComplete="email" required />
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={labelClass}>Password</label>
                  {mode === 'login' && (
                    <button type="button" onClick={() => switchMode('forgot')}
                      className="text-[10px] text-orange-500 hover:text-orange-400 font-bold tracking-widest uppercase">
                      Forgot?
                    </button>
                  )}
                </div>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" className={inputClass}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={6} />
              </div>
            )}

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-4 rounded-xl transition-colors disabled:opacity-40 mt-2"
            >
              {submitting ? 'Please wait…'
                : mode === 'login' ? 'Sign In'
                : mode === 'signup' ? 'Create Account'
                : 'Send Reset Link'}
            </button>
          </form>

          {mode === 'forgot' && (
            <button onClick={() => switchMode('login')}
              className="w-full text-center text-xs text-zinc-600 hover:text-zinc-400 mt-5 tracking-widest uppercase font-bold transition-colors">
              Back to Sign In
            </button>
          )}

          {mode === 'signup' && (
            <p className="text-[10px] text-zinc-700 text-center mt-6 leading-relaxed">
              Your membership will be confirmed by an admin after sign-up.
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
