import { useState, useEffect } from 'react';
import { Bell, X, Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { supabase } from '../../lib/supabase';

interface Announcement {
  id: string;
  title: string;
  body: string;
  created_at: string;
  expires_at: string | null;
}

const STORAGE_KEY = 'yogi_announcements_seen';

export function AnnouncementsBell() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [open, setOpen] = useState(false);
  const [lastSeen, setLastSeen] = useState<string>(() => localStorage.getItem(STORAGE_KEY) ?? '');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  async function fetchAnnouncements() {
    const now = new Date().toISOString();
    const { data } = await (supabase as any)
      .from('announcements')
      .select('id, title, body, created_at, expires_at')
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('created_at', { ascending: false });
    setAnnouncements((data as Announcement[]) ?? []);
  }

  const unreadCount = announcements.filter(a => !lastSeen || a.created_at > lastSeen).length;

  function handleOpen() {
    setOpen(true);
    const now = new Date().toISOString();
    setLastSeen(now);
    localStorage.setItem(STORAGE_KEY, now);
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="relative p-2.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:text-white text-zinc-500 transition-all"
        aria-label="Announcements"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 bg-violet-600 text-white text-[9px] font-black rounded-full flex items-center justify-center px-0.5 leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-zinc-950 border-l border-zinc-800 z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-violet-600/10 border border-violet-500/20 rounded-lg flex items-center justify-center">
                    <Megaphone className="w-4 h-4 text-violet-400" />
                  </div>
                  <h2 className="font-black text-white text-base tracking-tight">Announcements</h2>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 hover:bg-zinc-900 rounded-xl transition-colors text-zinc-600 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {announcements.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-6 h-6 text-zinc-700" />
                    </div>
                    <p className="text-zinc-500 font-bold text-sm tracking-tight">No announcements</p>
                    <p className="text-zinc-700 text-xs mt-1">Check back later for updates.</p>
                  </div>
                ) : (
                  announcements.map(a => (
                    <div
                      key={a.id}
                      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                          <Megaphone className="w-4 h-4 text-black" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-sm leading-tight mb-1">{a.title}</p>
                          <p className="text-zinc-400 text-sm leading-relaxed">{a.body}</p>
                          <p className="text-zinc-600 text-[10px] tracking-wide mt-2.5">
                            {format(parseISO(a.created_at), 'MMM d, yyyy')}
                            {a.expires_at && (
                              <span className="ml-2 text-violet-400/70">
                                · Until {format(parseISO(a.expires_at), 'MMM d, h:mm a')}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-zinc-800">
                <p className="text-center text-[10px] text-zinc-700 tracking-widest uppercase font-bold">Yogi Sports Complex · Nakuru, Kenya</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
