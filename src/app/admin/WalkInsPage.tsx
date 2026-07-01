import { useState, useEffect } from 'react';
import { LogOut, LogIn, Loader2, RefreshCw, Users } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';

const WALK_IN_SPACES = [
  { slug: 'cricket-futsal', label: 'Cricket / Futsal' },
  { slug: 'volleyball',     label: 'Volleyball' },
  { slug: 'table-tennis',   label: 'Table Tennis' },
  { slug: 'pool-table',     label: 'Pool Table' },
  { slug: 'darts',          label: 'Darts' },
];

interface WalkIn {
  id: string;
  space_id: string;
  name: string | null;
  checked_in_at: string;
}

interface SpaceRow {
  id: string;
  slug: string;
}

export function WalkInsPage() {
  const [spaces, setSpaces] = useState<SpaceRow[]>([]);
  const [walkIns, setWalkIns] = useState<WalkIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSpace, setActiveSpace] = useState(WALK_IN_SPACES[0].slug);
  const [name, setName] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [spacesRes, walkInsRes] = await Promise.all([
      (supabase as any)
        .from('spaces')
        .select('id, slug')
        .in('slug', WALK_IN_SPACES.map(s => s.slug)),
      (supabase as any)
        .from('walk_ins')
        .select('id, space_id, name, checked_in_at')
        .eq('is_active', true)
        .order('checked_in_at', { ascending: false }),
    ]);
    setSpaces(spacesRes.data ?? []);
    setWalkIns(walkInsRes.data ?? []);
    setLoading(false);
  }

  function getSpaceId(slug: string) {
    return spaces.find(s => s.slug === slug)?.id ?? null;
  }

  async function checkIn() {
    const spaceId = getSpaceId(activeSpace);
    if (!spaceId) return;
    setCheckingIn(true);
    const { data } = await (supabase as any)
      .from('walk_ins')
      .insert({ space_id: spaceId, name: name.trim() || null })
      .select('id, space_id, name, checked_in_at')
      .single();
    if (data) setWalkIns(prev => [data, ...prev]);
    setName('');
    setCheckingIn(false);
  }

  async function checkOut(id: string) {
    setCheckingOut(id);
    await (supabase as any)
      .from('walk_ins')
      .update({ checked_out_at: new Date().toISOString() })
      .eq('id', id);
    setWalkIns(prev => prev.filter(w => w.id !== id));
    setCheckingOut(null);
  }

  const currentSpaceId = getSpaceId(activeSpace);
  const currentWalkIns = walkIns.filter(w => w.space_id === currentSpaceId);
  const currentSpaceLabel = WALK_IN_SPACES.find(s => s.slug === activeSpace)?.label ?? '';

  // Total across all spaces
  const totalActive = walkIns.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Walk-Ins</h1>
          <p className="text-stone-500 text-sm mt-1">
            {totalActive} {totalActive === 1 ? 'person' : 'people'} currently active across all spaces
          </p>
        </div>
        <button
          onClick={load}
          className="p-2.5 rounded-xl border border-stone-200 hover:bg-stone-100 transition-colors text-stone-600"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Space tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {WALK_IN_SPACES.map(s => {
          const sid = getSpaceId(s.slug);
          const count = walkIns.filter(w => w.space_id === sid).length;
          return (
            <button
              key={s.slug}
              onClick={() => setActiveSpace(s.slug)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                activeSpace === s.slug
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-orange-300 hover:bg-orange-50'
              }`}
            >
              {s.label}
              {count > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  activeSpace === s.slug ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-700'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Check-in form */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-stone-900 mb-1">Check In — {currentSpaceLabel}</h2>
          <p className="text-stone-400 text-sm mb-5">Name is optional for anonymous walk-ins.</p>

          <div className="space-y-3">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !checkingIn && checkIn()}
              placeholder="Name (optional)"
              className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              onClick={checkIn}
              disabled={checkingIn || loading}
              className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white font-semibold py-3 rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-40"
            >
              {checkingIn
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <LogIn className="w-4 h-4" />
              }
              {checkingIn ? 'Checking in…' : 'Check In'}
            </button>
          </div>
        </div>

        {/* Current occupants */}
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
            <h2 className="font-semibold text-stone-900">Currently Here</h2>
            <span className="text-sm text-stone-400">{currentWalkIns.length} people</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-5 h-5 text-orange-600 animate-spin" />
            </div>
          ) : currentWalkIns.length === 0 ? (
            <div className="text-center py-10 text-stone-400">
              <Users className="w-7 h-7 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No one here right now</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-50 max-h-72 overflow-y-auto">
              {currentWalkIns.map(w => (
                <div
                  key={w.id}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-xs font-bold text-stone-500 shrink-0">
                      {w.name ? w.name[0].toUpperCase() : '?'}
                    </div>
                    <div>
                      <p className="font-medium text-stone-900 text-sm">
                        {w.name ?? 'Anonymous'}
                      </p>
                      <p className="text-stone-400 text-xs">
                        In since {format(new Date(w.checked_in_at), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => checkOut(w.id)}
                    disabled={checkingOut === w.id}
                    className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-red-700 bg-stone-100 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {checkingOut === w.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <LogOut className="w-3.5 h-3.5" />
                    }
                    Out
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
