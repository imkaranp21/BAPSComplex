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

export function AuthScreen({ onSuccess, onBack, defaultMode = 'login' }: AuthScreenProps) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { signIn, signUp } = useAuth();

  function switchMode(next: Mode) {
    setMode(next);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (mode === 'forgot') {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (err) {
        setError(err.message);
        setSubmitting(false);
      } else {
        setResetSent(true);
        setSubmitting(false);
      }
      return;
    }

    if (mode === 'login') {
      const { error: err } = await signIn(email, password);
      if (err) {
        setError(err.message === 'Invalid login credentials'
          ? 'Incorrect email or password.'
          : err.message);
        setSubmitting(false);
      } else {
        onSuccess();
      }
    } else {
      if (!fullName.trim()) {
        setError('Please enter your full name.');
        setSubmitting(false);
        return;
      }
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

  // Email confirmation waiting screen
  if (awaitingConfirmation) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-2xl mb-6">
            <Mail className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mb-3">Check your email</h2>
          <p className="text-stone-500 mb-2">We sent a confirmation link to</p>
          <p className="font-semibold text-stone-800 mb-6">{email}</p>
          <p className="text-stone-400 text-sm mb-8">
            Click the link in the email to verify your account, then come back to sign in.
          </p>
          <button
            onClick={() => { switchMode('login'); setAwaitingConfirmation(false); }}
            className="w-full bg-orange-600 text-white font-semibold py-3.5 rounded-xl hover:bg-orange-700 transition-colors"
          >
            Back to Sign In
          </button>
        </motion.div>
      </div>
    );
  }

  // Password reset sent screen
  if (resetSent) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-2xl mb-6">
            <Mail className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mb-3">Reset link sent</h2>
          <p className="text-stone-500 mb-2">We sent a password reset link to</p>
          <p className="font-semibold text-stone-800 mb-6">{email}</p>
          <p className="text-stone-400 text-sm mb-8">
            Check your inbox and click the link to set a new password.
          </p>
          <button
            onClick={() => { switchMode('login'); setResetSent(false); }}
            className="w-full bg-orange-600 text-white font-semibold py-3.5 rounded-xl hover:bg-orange-700 transition-colors"
          >
            Back to Sign In
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
      {onBack && (
        <div className="p-4">
          <button
            onClick={mode === 'forgot' ? () => switchMode('login') : onBack}
            className="p-2 -ml-2 hover:bg-stone-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-stone-700" />
          </button>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-600 rounded-2xl mb-4">
              <span className="text-white text-2xl font-bold">Y</span>
            </div>
            <h1 className="text-2xl font-bold text-stone-900">Yogi Sports Complex</h1>
            <p className="text-stone-500 text-sm mt-1">Nakuru, Kenya</p>
          </div>

          {/* Sign In / Sign Up toggle (hidden on forgot) */}
          {mode !== 'forgot' && (
            <div className="flex bg-stone-100 rounded-xl p-1 mb-6">
              <button
                onClick={() => switchMode('login')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  mode === 'login' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => switchMode('signup')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  mode === 'signup' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          {mode === 'forgot' && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-stone-900">Forgot password?</h2>
              <p className="text-stone-500 text-sm mt-1">
                Enter your email and we'll send you a reset link.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">
                    Phone Number <span className="text-stone-400 font-normal">(so admin can identify you)</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+254 700 000 000"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    autoComplete="tel"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                autoComplete="email"
                required
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-stone-700">Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  minLength={6}
                />
              </div>
            )}

            {error && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-100 px-4 py-3 rounded-xl">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-orange-600 text-white font-semibold py-3.5 rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-60 mt-2"
            >
              {submitting
                ? 'Please wait…'
                : mode === 'login'
                ? 'Sign In'
                : mode === 'signup'
                ? 'Create Account'
                : 'Send Reset Link'}
            </button>
          </form>

          {mode === 'forgot' && (
            <button
              onClick={() => switchMode('login')}
              className="w-full text-center text-sm text-stone-500 hover:text-stone-700 mt-4 transition-colors"
            >
              Back to Sign In
            </button>
          )}

          {mode === 'signup' && (
            <p className="text-xs text-stone-400 text-center mt-6 leading-relaxed">
              Your membership tier will be confirmed by an admin after sign-up.
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
