import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, CalendarOff } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';

interface Space {
  id: string;
  name: string;
  slug: string;
}

interface Closure {
  id: string;
  space_id: string;
  date: string;
  all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  spaces: { name: string } | null;
}

const TIME_OPTIONS = Array.from({ length: 16 }, (_, i) => {
  const h = i + 6;
  const label = h === 12 ? '12:00 PM' : h < 12 ? `${h}:00 AM` : `${h - 12}:00 PM`;
  return { value: `${String(h).padStart(2, '0')}:00:00`, label };
});

export function ClosuresPage() {
  const { user } = useAuth();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [closures, setClosures] = useState<Closure[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [spaceId, setSpaceId] = useState('');
  const [date, setDate] = useState('');
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState('06:00:00');
  const [endTime, setEndTime] = useState('22:00:00');
  const [reason, setReason] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [spacesRes, closuresRes] = await Promise.all([
      (supabase as any).from('spaces').select('id, name, slug').order('name'),
      (supabase as any)
        .from('space_closures')
        .select('id, space_id, date, all_day, start_time, end_time, reason, spaces(name)')
        .gte('date', new Date().toISOString().slice(0, 10))
        .order('date')
        .order('start_time'),
    ]);
    setSpaces(spacesRes.data ?? []);
    setClosures(closuresRes.data ?? []);
    if (spacesRes.data?.length) setSpaceId(spacesRes.data[0].id);
    setLoading(false);
  }

  async function addClosure() {
    if (!spaceId || !date) return;
    if (!allDay && startTime >= endTime) {
      setError('End time must be after start time.');
      return;
    }
    setSaving(true);
    setError('');
    const { error: err } = await (supabase as any).from('space_closures').insert({
      space_id: spaceId,
      date,
      all_day: allDay,
      start_time: allDay ? null : startTime,
      end_time: allDay ? null : endTime,
      reason: reason.trim() || null,
      created_by: user?.id,
    });
    if (err) {
      setError('Failed to add closure. Please try again.');
    } else {
      setShowForm(false);
      setReason('');
      setDate('');
      setAllDay(true);
      await load();
    }
    setSaving(false);
  }

  async function deleteClosure(id: string) {
    setDeleting(id);
    await (supabase as any).from('space_closures').delete().eq('id', id);
    setClosures(prev => prev.filter(c => c.id !== id));
    setDeleting(null);
  }

  function formatClosure(c: Closure) {
    const d = format(parseISO(c.date), 'EEE, MMM d yyyy');
    if (c.all_day) return `${d} · All day`;
    const fmt = (t: string) => {
      const h = parseInt(t);
      return h === 0 ? '12:00 AM' : h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`;
    };
    return `${d} · ${fmt(c.start_time!)} – ${fmt(c.end_time!)}`;
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Space Closures</h1>
          <p className="text-stone-500 text-sm mt-1">Block spaces for maintenance, events, or any reason</p>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setError(''); }}
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Closure
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-6">
          <h3 className="font-semibold text-stone-900 mb-4">Block a Space</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Space */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">Space</label>
              <select
                value={spaceId}
                onChange={e => setSpaceId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {spaces.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">Date</label>
              <input
                type="date"
                value={date}
                min={today}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Reason */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">Reason (optional)</label>
              <input
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g. Maintenance, Private event, Renovation…"
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* All day toggle */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setAllDay(v => !v)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${allDay ? 'bg-orange-600' : 'bg-stone-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${allDay ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
                <span className="text-sm font-medium text-stone-700">All day</span>
              </label>
            </div>

            {/* Time range */}
            {!allDay && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">From</label>
                  <select
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wide">Until</label>
                  <select
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </>
            )}
          </div>

          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

          <div className="flex gap-2 mt-4">
            <button
              onClick={addClosure}
              disabled={saving || !spaceId || !date}
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 disabled:opacity-40 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarOff className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Block Space'}
            </button>
            <button
              onClick={() => { setShowForm(false); setError(''); }}
              className="px-4 py-2.5 bg-white border border-stone-200 text-stone-600 rounded-xl text-sm font-semibold hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Closures list */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-stone-100">
          <h2 className="font-semibold text-stone-900">Upcoming Closures</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 text-orange-600 animate-spin" />
          </div>
        ) : closures.length === 0 ? (
          <div className="text-center py-12 text-stone-400">
            <CalendarOff className="w-7 h-7 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No closures scheduled</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-50">
            {closures.map(c => (
              <div key={c.id} className="flex items-center justify-between px-5 py-4 hover:bg-stone-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                    <CalendarOff className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900 text-sm">{c.spaces?.name}</p>
                    <p className="text-stone-500 text-xs">{formatClosure(c)}</p>
                    {c.reason && (
                      <p className="text-stone-400 text-xs mt-0.5 italic">"{c.reason}"</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteClosure(c.id)}
                  disabled={deleting === c.id}
                  className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove closure"
                >
                  {deleting === c.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />
                  }
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
