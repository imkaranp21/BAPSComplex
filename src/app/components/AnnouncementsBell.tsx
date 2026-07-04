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
    fetch();
  }, []);

  async function fetch() {
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
        className="relative p-2 rounded-xl hover:bg-stone-100 transition-colors text-stone-500 hover:text-stone-900"
        aria-label="Announcements"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
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
              className="fixed inset-0 z-50 bg-black/40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white z-50 flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Megaphone className="w-4 h-4 text-orange-600" />
                  </div>
                  <h2 className="font-bold text-stone-900 text-base">Announcements</h2>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 hover:bg-stone-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-stone-500" />
                </button>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {announcements.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-7 h-7 text-stone-300" />
                    </div>
                    <p className="text-stone-500 font-medium text-sm">No announcements</p>
                    <p className="text-stone-400 text-xs mt-1">Check back later for updates.</p>
                  </div>
                ) : (
                  announcements.map((a, i) => (
                    <div
                      key={a.id}
                      className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-orange-600 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                          <Megaphone className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-stone-900 text-sm leading-tight mb-1">{a.title}</p>
                          <p className="text-stone-600 text-sm leading-relaxed">{a.body}</p>
                          <p className="text-stone-400 text-xs mt-2.5">
                            {format(parseISO(a.created_at), 'MMM d, yyyy')}
                            {a.expires_at && (
                              <span className="ml-2 text-orange-400">
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
              <div className="px-5 py-4 border-t border-stone-100">
                <p className="text-center text-xs text-stone-400">Yogi Sports Complex · Nakuru, Kenya</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
