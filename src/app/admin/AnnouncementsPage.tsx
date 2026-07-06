import { useState, useEffect } from 'react';
import { Megaphone, Trash2, Loader2, Plus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';

interface Announcement {
  id: string; title: string; body: string; expires_at: string | null; created_at: string;
}

const fieldClass = 'w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500';
const labelClass = 'text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] block mb-1.5';

export function AnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await (supabase as any).from('announcements')
      .select('id, title, body, expires_at, created_at').order('created_at', { ascending: false });
    setAnnouncements((data as Announcement[]) ?? []);
    setLoading(false);
  }

  async function create() {
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true);
    await (supabase as any).from('announcements').insert({
      title: title.trim(), body: body.trim(), expires_at: expiresAt || null, created_by: user!.id,
    });
    setTitle(''); setBody(''); setExpiresAt('');
    await load();
    setSubmitting(false);
  }

  async function remove(id: string) {
    setDeletingId(id);
    await (supabase as any).from('announcements').delete().eq('id', id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    setDeletingId(null);
  }

  const nowLocal = format(new Date(), "yyyy-MM-dd'T'HH:mm");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white tracking-tight">Announcements</h1>
        <p className="text-zinc-500 text-sm mt-1">Send notices to all members via the bell icon in the app.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create form */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-7 h-7 bg-violet-600/10 border border-violet-500/20 rounded-lg flex items-center justify-center">
              <Plus className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <h2 className="font-black text-white text-sm tracking-tight">New Announcement</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className={labelClass}>Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Court maintenance on Saturday" className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Message</label>
              <textarea value={body} onChange={e => setBody(e.target.value)}
                placeholder="Write your announcement here…" rows={4}
                className={`${fieldClass} resize-none`} />
            </div>
            <div>
              <label className={labelClass}>
                Expires At <span className="text-zinc-700 normal-case font-normal tracking-normal">(optional)</span>
              </label>
              <input type="datetime-local" value={expiresAt} min={nowLocal}
                onChange={e => setExpiresAt(e.target.value)} className={fieldClass} />
            </div>
            <button
              onClick={create}
              disabled={submitting || !title.trim() || !body.trim()}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-40"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
              {submitting ? 'Sending…' : 'Send Announcement'}
            </button>
          </div>
        </div>

        {/* Existing announcements */}
        <div>
          <h2 className="font-black text-white text-sm tracking-tight mb-4">All Announcements</h2>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 text-violet-400 animate-spin" /></div>
          ) : announcements.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
              <Megaphone className="w-7 h-7 text-zinc-700 mx-auto mb-2" />
              <p className="text-zinc-600 text-sm">No announcements yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map(a => {
                const expired = a.expires_at && new Date(a.expires_at) < new Date();
                return (
                  <div
                    key={a.id}
                    className={`bg-zinc-900 border rounded-xl p-4 flex gap-4 ${expired ? 'opacity-40 border-zinc-800' : 'border-zinc-800 hover:border-zinc-700'} transition-all`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-bold text-white text-sm">{a.title}</p>
                        {expired && (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">Expired</span>
                        )}
                      </div>
                      <p className="text-zinc-400 text-sm leading-relaxed">{a.body}</p>
                      <p className="text-zinc-600 text-xs mt-2">
                        Posted {format(parseISO(a.created_at), 'MMM d, yyyy')}
                        {a.expires_at && ` · Expires ${format(parseISO(a.expires_at), 'MMM d, yyyy · h:mm a')}`}
                      </p>
                    </div>
                    <button
                      onClick={() => remove(a.id)}
                      disabled={deletingId === a.id}
                      className="shrink-0 p-2 rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40"
                    >
                      {deletingId === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
