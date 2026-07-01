import { useState, useEffect } from 'react';
import { Megaphone, Trash2, Loader2, Plus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';

interface Announcement {
  id: string;
  title: string;
  body: string;
  expires_at: string | null;
  created_at: string;
}

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
    const { data } = await (supabase as any)
      .from('announcements')
      .select('id, title, body, expires_at, created_at')
      .order('created_at', { ascending: false });
    setAnnouncements((data as Announcement[]) ?? []);
    setLoading(false);
  }

  async function create() {
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true);
    await (supabase as any).from('announcements').insert({
      title: title.trim(),
      body: body.trim(),
      expires_at: expiresAt || null,
      created_by: user!.id,
    });
    setTitle('');
    setBody('');
    setExpiresAt('');
    await load();
    setSubmitting(false);
  }

  async function remove(id: string) {
    setDeletingId(id);
    await (supabase as any).from('announcements').delete().eq('id', id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    setDeletingId(null);
  }

  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Announcements</h1>
        <p className="text-stone-500 text-sm mt-1">Send notices to all members. They see these via the bell icon in the app.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create form */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Plus className="w-4 h-4 text-orange-600" />
            <h2 className="font-semibold text-stone-900">New Announcement</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide block mb-1.5">Title</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Court maintenance on Saturday"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide block mb-1.5">Message</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Write your announcement here…"
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide block mb-1.5">
                Expiry Date <span className="font-normal normal-case text-stone-400">(optional — hides automatically after this date)</span>
              </label>
              <input
                type="date"
                value={expiresAt}
                min={today}
                onChange={e => setExpiresAt(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <button
              onClick={create}
              disabled={submitting || !title.trim() || !body.trim()}
              className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white font-semibold py-3 rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-40"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
              {submitting ? 'Sending…' : 'Send Announcement'}
            </button>
          </div>
        </div>

        {/* Existing announcements */}
        <div>
          <h2 className="font-semibold text-stone-900 mb-4">Active Announcements</h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-5 h-5 text-orange-600 animate-spin" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center shadow-sm">
              <Megaphone className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="text-stone-400 text-sm">No announcements yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map(a => {
                const expired = a.expires_at && a.expires_at < today;
                return (
                  <div
                    key={a.id}
                    className={`bg-white border rounded-xl p-4 shadow-sm flex gap-4 ${expired ? 'opacity-50 border-stone-100' : 'border-stone-200'}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-stone-900 text-sm">{a.title}</p>
                        {expired && (
                          <span className="text-[10px] font-bold uppercase tracking-wide text-red-400 bg-red-50 px-1.5 py-0.5 rounded">Expired</span>
                        )}
                      </div>
                      <p className="text-stone-600 text-sm leading-relaxed">{a.body}</p>
                      <p className="text-stone-400 text-xs mt-2">
                        Posted {format(parseISO(a.created_at), 'MMM d, yyyy')}
                        {a.expires_at && ` · Expires ${format(parseISO(a.expires_at), 'MMM d, yyyy')}`}
                      </p>
                    </div>
                    <button
                      onClick={() => remove(a.id)}
                      disabled={deletingId === a.id}
                      className="shrink-0 p-2 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      {deletingId === a.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />
                      }
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
