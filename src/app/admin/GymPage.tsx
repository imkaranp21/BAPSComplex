import { useState, useEffect } from 'react';
import { Users, LogIn, LogOut, Loader2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';

const GYM_CAPACITY = 30;

interface Checkin {
  id: string;
  user_id: string | null;
  checked_in_at: string;
  checked_out_at: string | null;
  is_active: boolean;
  profiles: { full_name: string } | null;
}

export function GymPage() {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [checkouting, setCheckouting] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await (supabase as any)
      .from('gym_checkins')
      .select('id, user_id, checked_in_at, checked_out_at, is_active, profiles(full_name)')
      .eq('is_active', true)
      .order('checked_in_at', { ascending: false });
    setCheckins(data ?? []);
    setLoading(false);
  }

  async function checkInWalkIn() {
    setActionLoading(true);
    const { data } = await (supabase as any)
      .from('gym_checkins')
      .insert({ user_id: null })
      .select('id, user_id, checked_in_at, checked_out_at, is_active, profiles(full_name)')
      .single();
    if (data) setCheckins(prev => [data, ...prev]);
    setActionLoading(false);
  }

  async function checkOut(id: string) {
    setCheckouting(id);
    const now = new Date().toISOString();
    await (supabase as any)
      .from('gym_checkins')
      .update({ checked_out_at: now })
      .eq('id', id);
    setCheckins(prev => prev.filter(c => c.id !== id));
    setCheckouting(null);
  }

  const activeCount = checkins.length;
  const pct = Math.min((activeCount / GYM_CAPACITY) * 100, 100);
  const barColor = pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-orange-500' : 'bg-green-500';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Gym Occupancy</h1>
          <p className="text-stone-500 text-sm mt-1">Real-time check-in management</p>
        </div>
        <button
          onClick={load}
          className="p-2.5 rounded-xl border border-stone-200 hover:bg-stone-100 transition-colors text-stone-600"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Occupancy card */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-600" />
            <span className="font-semibold text-stone-900">Currently Inside</span>
          </div>
          <span className="text-3xl font-bold text-stone-900">
            {activeCount}
            <span className="text-stone-400 text-base font-normal"> / {GYM_CAPACITY}</span>
          </span>
        </div>

        <div className="w-full bg-stone-100 rounded-full h-4 mb-2">
          <div
            className={`h-4 rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className={`text-sm font-medium ${
          pct > 80 ? 'text-red-600' : pct > 50 ? 'text-orange-600' : 'text-green-600'
        }`}>
          {GYM_CAPACITY - activeCount} spots remaining
          {pct > 80 ? ' — Almost full!' : ''}
        </p>

        <button
          onClick={checkInWalkIn}
          disabled={actionLoading || activeCount >= GYM_CAPACITY}
          className="mt-4 flex items-center gap-2 bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-40 text-sm"
        >
          {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
          Walk-in Check-in
        </button>
      </div>

      {/* Active checkins list */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-stone-100">
          <h2 className="font-semibold text-stone-900">People Inside Now</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-orange-600 animate-spin" />
          </div>
        ) : activeCount === 0 ? (
          <div className="text-center py-12 text-stone-400">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Gym is empty</p>
          </div>
        ) : (
          <div>
            {checkins.map(c => (
              <div key={c.id} className="flex items-center justify-between px-5 py-4 border-b border-stone-50 last:border-0 hover:bg-stone-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-stone-100 rounded-full flex items-center justify-center text-xs font-bold text-stone-500">
                    {c.profiles?.full_name
                      ? c.profiles.full_name[0].toUpperCase()
                      : 'W'}
                  </div>
                  <div>
                    <p className="font-medium text-stone-900 text-sm">
                      {c.profiles?.full_name ?? 'Walk-in'}
                    </p>
                    <p className="text-stone-400 text-xs">
                      In since {format(new Date(c.checked_in_at), 'h:mm a')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => checkOut(c.id)}
                  disabled={checkouting === c.id}
                  className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-red-700 bg-stone-100 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                >
                  {checkouting === c.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <LogOut className="w-3.5 h-3.5" />
                  }
                  Check Out
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
