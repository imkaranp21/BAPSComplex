import { useState } from 'react';
import { MessageSquarePlus, X, Send, Loader2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';

const CATEGORIES = [
  { value: 'suggestion', label: '💡 Suggestion' },
  { value: 'bug',        label: '🐛 Bug / Problem' },
  { value: 'feature',    label: '✨ Feature request' },
  { value: 'other',      label: '💬 Other' },
];

export function FeedbackSheet() {
  const { user, profile } = useAuth();
  const [open, setOpen]         = useState(false);
  const [category, setCategory] = useState('suggestion');
  const [message, setMessage]   = useState('');
  const [status, setStatus]     = useState<'idle' | 'loading' | 'done'>('idle');

  async function submit() {
    if (!message.trim()) return;
    setStatus('loading');
    await (supabase as any).from('feedback').insert({
      member_id:   user?.id ?? null,
      member_name: profile?.full_name ?? user?.email ?? 'Anonymous',
      category,
      message: message.trim(),
    });
    setStatus('done');
    setTimeout(() => {
      setOpen(false);
      setMessage('');
      setCategory('suggestion');
      setStatus('idle');
    }, 1800);
  }

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-40 w-12 h-12 bg-violet-600 hover:bg-violet-500 text-white rounded-full shadow-lg shadow-violet-900/50 flex items-center justify-center transition-all active:scale-95"
        title="Send feedback"
      >
        <MessageSquarePlus className="w-5 h-5" />
      </button>

      {/* Backdrop + sheet */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => status !== 'loading' && setOpen(false)}
            />
            <motion.div
              key="sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t border-zinc-800 rounded-t-3xl px-5 pt-4 pb-8 max-w-lg mx-auto"
            >
              {/* Handle */}
              <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-5" />

              {status === 'done' ? (
                <div className="flex flex-col items-center py-8 gap-3">
                  <CheckCircle className="w-10 h-10 text-emerald-400" />
                  <p className="text-white font-black text-lg tracking-tight">Thank you!</p>
                  <p className="text-zinc-500 text-sm text-center">Your feedback has been sent to the team.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-white font-black text-lg tracking-tight leading-none">Share feedback</h2>
                      <p className="text-zinc-600 text-xs mt-1">Help us improve the app.</p>
                    </div>
                    <button
                      onClick={() => setOpen(false)}
                      className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Category pills */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {CATEGORIES.map(c => (
                      <button
                        key={c.value}
                        onClick={() => setCategory(c.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                          category === c.value
                            ? 'bg-violet-600 text-white'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>

                  {/* Message */}
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="What's on your mind? Tell us what's working, what's broken, or what you'd like to see…"
                    rows={4}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none leading-relaxed"
                  />

                  <button
                    onClick={submit}
                    disabled={!message.trim() || status === 'loading'}
                    className="mt-3 w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-black py-3.5 rounded-2xl transition-colors text-sm tracking-wide"
                  >
                    {status === 'loading'
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                      : <><Send className="w-4 h-4" /> Send Feedback</>
                    }
                  </button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
