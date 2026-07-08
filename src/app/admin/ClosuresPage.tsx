import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, CalendarOff } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';

interface Space { id: string; name: string; slug: string }
interface DbUnit { id: string; name: string }
interface Closure {
  id: string; space_id: string; date: string; all_day: boolean;
  start_time: string | null; end_time: string | null; reason: string | null;
  spaces: { name: string } | null;
  space_unit_id: string | null;
  space_units: { name: string } | null;
}

const TIME_OPTIONS = Array.from({ length: 16 }, (_, i) => {
  const h = i + 6;
  const label = h === 12 ? '12:00 PM' : h < 12 ? `${h}:00 AM` : `${h - 12}:00 PM`;
  return { value: `${String(h).padStart(2, '0')}:00:00`, label };
});

const fieldClass = 'w-full px-3 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500';
const labelClass = 'block text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-1.5';

export function ClosuresPage() {
  const { user } = useAuth();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [spaceUnits, setSpaceUnits] = useState<DbUnit[]>([]);
  const [closures, setClosures] = useState<Closure[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const [spaceId, setSpaceId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [date, setDate] = useState('');
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState('06:00:00');
  const [endTime, setEndTime] = useState('22:00:00');
  const [reason, setReason] = useState('');

  useEffect(() => { load(); }, []);

  useEffect(() => {
    setUnitId('');
    if (!spaceId) { setSpaceUnits([]); return; }
    (supabase as any).from('space_units').select('id, name').eq('space_id', spaceId).order('name')
      .then(({ data }: any) => setSpaceUnits(data ?? []));
  }, [spaceId]);

  async function load() {
    setLoading(true);
    const [spacesRes, closuresRes] = await Promise.all([
      (supabase as any).from('spaces').select('id, name, slug').order('name'),
      (supabase as any).from('space_closures')
        .select('id, space_id, space_unit_id, date, all_day, start_time, end_time, reason, spaces(name), space_units(name)')
        .gte('date', new Date().toISOString().slice(0, 10)).order('date').order('start_time'),
    ]);
    setSpaces(spacesRes.data ?? []);
    setClosures(closuresRes.data ?? []);
    if (spacesRes.data?.length) setSpaceId(spacesRes.data[0].id);
    setLoading(false);
  }

  async function addClosure() {
    if (!spaceId || !date) return;
    if (!allDay && startTime >= endTime) { setError('End time must be after start time.'); return; }
    setSaving(true); setError('');
    const { error: err } = await (supabase as any).from('space_closures').insert({
      space_id: spaceId,
      space_unit_id: unitId || null,
      date, all_day: allDay,
      start_time: allDay ? null : startTime, end_time: allDay ? null : endTime,
      reason: reason.trim() || null, created_by: user?.id,
    });
    if (err) { setError('Failed to add closure. Please try again.'); }
    else { setShowForm(false); setReason(''); setDate(''); setAllDay(true); setUnitId(''); await load(); }
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
    const fmt = (t: string) => { const h = parseInt(t); return h === 0 ? '12:00 AM' : h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`; };
    return `${d} · ${fmt(c.start_time!)} – ${fmt(c.end_time!)}`;
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Space Closures</h1>
          <p className="text-zinc-500 text-sm mt-1">Block spaces for maintenance, events, or any reason</p>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setError(''); }}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Closure
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">
          <h3 className="font-black text-white text-sm mb-5 tracking-tight">Block a Space</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Space</label>
              <select value={spaceId} onChange={e => setSpaceId(e.target.value)} className={fieldClass}>
                {spaces.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {spaceUnits.length > 1 && (
              <div>
                <label className={labelClass}>Table / Unit</label>
                <select value={unitId} onChange={e => setUnitId(e.target.value)} className={fieldClass}>
                  <option value="">All tables</option>
                  {spaceUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            )}

            <div className={spaceUnits.length > 1 ? '' : ''}>
              <label className={labelClass}>Date</label>
              <input type="date" value={date} min={today} onChange={e => setDate(e.target.value)} className={fieldClass} />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Reason (optional)</label>
              <input type="text" value={reason} onChange={e => setReason(e.target.value)}
                placeholder="e.g. Maintenance, Private event, Renovation…" className={fieldClass} />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer" onClick={() => setAllDay(v => !v)}>
                <div className={`w-10 h-5.5 rounded-full transition-colors relative flex items-center ${allDay ? 'bg-violet-600' : 'bg-zinc-700'}`} style={{ height: '22px' }}>
                  <div className={`absolute w-4 h-4 bg-white rounded-full shadow transition-transform ${allDay ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm font-bold text-zinc-400">All day</span>
              </label>
            </div>
            {!allDay && (
              <>
                <div>
                  <label className={labelClass}>From</label>
                  <select value={startTime} onChange={e => setStartTime(e.target.value)} className={fieldClass}>
                    {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Until</label>
                  <select value={endTime} onChange={e => setEndTime(e.target.value)} className={fieldClass}>
                    {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </>
            )}
          </div>

          {error && <p className="text-red-400 text-xs mt-3">{error}</p>}

          <div className="flex gap-2 mt-5">
            <button
              onClick={addClosure}
              disabled={saving || !spaceId || !date}
              className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold disabled:opacity-40 transition-colors tracking-wide"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarOff className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Block Space'}
            </button>
            <button
              onClick={() => { setShowForm(false); setError(''); }}
              className="px-4 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-xl text-xs font-bold hover:text-white transition-colors tracking-wide"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Closures list */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h2 className="font-black text-white text-sm tracking-tight">Upcoming Closures</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 text-violet-400 animate-spin" /></div>
        ) : closures.length === 0 ? (
          <div className="text-center py-12 text-zinc-600">
            <CalendarOff className="w-7 h-7 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No closures scheduled</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {closures.map(c => (
              <div key={c.id} className="flex items-center justify-between px-5 py-4 hover:bg-zinc-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <CalendarOff className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">
                      {c.spaces?.name}{c.space_units?.name ? ` · ${c.space_units.name}` : ''}
                    </p>
                    <p className="text-zinc-500 text-xs">{formatClosure(c)}</p>
                    {c.reason && <p className="text-zinc-600 text-xs mt-0.5 italic">"{c.reason}"</p>}
                  </div>
                </div>
                <button
                  onClick={() => deleteClosure(c.id)}
                  disabled={deleting === c.id}
                  className="p-2 text-zinc-700 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  title="Remove closure"
                >
                  {deleting === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
