import { useState, useEffect } from 'react';
import { Users, LogOut, Loader2, RefreshCw, UserCheck } from 'lucide-react';
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

interface Member { id: string; full_name: string; phone: string | null; membership_status: string }

export function GymPage() {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkouting, setCheckouting] = useState<string | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [checkinsRes, membersRes] = await Promise.all([
      (supabase as any).from('gym_checkins')
        .select('id, user_id, checked_in_at, checked_out_at, is_active, profiles(full_name)')
        .eq('is_active', true).order('checked_in_at', { ascending: false }),
      (supabase as any).from('profiles')
        .select('id, full_name, phone, membership_status')
        .eq('membership_status', 'active').order('full_name'),
    ]);
    setCheckins(checkinsRes.data ?? []);
    setMembers(membersRes.data ?? []);
    setLoading(false);
  }

  async function checkInMember(memberId: string) {
    setCheckingIn(true);
    const { data } = await (supabase as any).from('gym_checkins')
      .insert({ user_id: memberId })
      .select('id, user_id, checked_in_at, checked_out_at, is_active, profiles(full_name)').single();
    if (data) setCheckins(prev => [data, ...prev]);
    setShowCheckIn(false); setMemberSearch(''); setCheckingIn(false);
  }

  async function checkOut(id: string) {
    setCheckouting(id);
    await (supabase as any).from('gym_checkins').update({ checked_out_at: new Date().toISOString() }).eq('id', id);
    setCheckins(prev => prev.filter(c => c.id !== id));
    setCheckouting(null);
  }

  const checkedInIds = new Set(checkins.map(c => c.user_id));
  const availableMembers = members.filter(m =>
    !checkedInIds.has(m.id) &&
    (memberSearch.trim() === '' || m.full_name.toLowerCase().includes(memberSearch.toLowerCase()) || (m.phone ?? '').includes(memberSearch))
  );

  const activeCount = checkins.length;
  const pct = Math.min((activeCount / GYM_CAPACITY) * 100, 100);
  const barColor = pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Gym Occupancy</h1>
          <p className="text-zinc-500 text-sm mt-1">Members only — real-time tracking</p>
        </div>
        <button onClick={load} className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700 text-zinc-500 hover:text-white transition-all" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Occupancy card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-violet-400" />
            <span className="font-black text-white text-sm tracking-tight">Currently Inside</span>
          </div>
          <span className="text-3xl font-black text-white tracking-tight">
            {activeCount}<span className="text-zinc-600 text-base font-normal"> / {GYM_CAPACITY}</span>
          </span>
        </div>

        <div className="w-full bg-zinc-800 rounded-full h-3 mb-3">
          <div className={`h-3 rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.max(2, pct)}%` }} />
        </div>
        <p className={`text-sm font-bold ${pct > 80 ? 'text-red-400' : pct > 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
          {GYM_CAPACITY - activeCount} spots remaining{pct > 80 ? ' — Almost full!' : ''}
        </p>

        <button
          onClick={() => setShowCheckIn(v => !v)}
          disabled={activeCount >= GYM_CAPACITY}
          className="mt-5 flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-bold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-40 text-sm"
        >
          <UserCheck className="w-4 h-4" />
          Check In Member
        </button>

        {showCheckIn && (
          <div className="mt-5 border-t border-zinc-800 pt-5">
            <p className="text-[10px] font-bold text-zinc-500 tracking-[0.25em] uppercase mb-3">Search active member</p>
            <input
              value={memberSearch}
              onChange={e => setMemberSearch(e.target.value)}
              placeholder="Type name or phone…"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500 mb-2"
              autoFocus
            />
            <div className="max-h-48 overflow-y-auto rounded-xl border border-zinc-800 divide-y divide-zinc-800">
              {availableMembers.length === 0 ? (
                <p className="text-zinc-600 text-sm px-4 py-3">
                  {memberSearch ? 'No members found' : 'All active members are already inside'}
                </p>
              ) : (
                availableMembers.slice(0, 8).map(m => (
                  <button
                    key={m.id}
                    onClick={() => checkInMember(m.id)}
                    disabled={checkingIn}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-700 transition-colors text-left"
                  >
                    <div className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center text-xs font-black text-black shrink-0">
                      {m.full_name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{m.full_name}</p>
                      {m.phone && <p className="text-zinc-500 text-xs">{m.phone}</p>}
                    </div>
                    {checkingIn && <Loader2 className="w-4 h-4 animate-spin text-violet-400 ml-auto" />}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Active checkins list */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h2 className="font-black text-white text-sm tracking-tight">Members Inside Now</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
          </div>
        ) : activeCount === 0 ? (
          <div className="text-center py-12 text-zinc-600">
            <Users className="w-7 h-7 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Gym is empty</p>
          </div>
        ) : (
          checkins.map(c => (
            <div key={c.id} className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/60 last:border-0 hover:bg-zinc-800/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-violet-600 rounded-full flex items-center justify-center text-xs font-black text-black shrink-0">
                  {(c.profiles?.full_name ?? '?')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{c.profiles?.full_name ?? 'Unknown Member'}</p>
                  <p className="text-zinc-600 text-xs">In since {format(new Date(c.checked_in_at), 'h:mm a')}</p>
                </div>
              </div>
              <button
                onClick={() => checkOut(c.id)}
                disabled={checkouting === c.id}
                className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-red-400 bg-zinc-800 hover:bg-red-500/10 border border-zinc-700 hover:border-red-500/30 px-3 py-2 rounded-lg transition-all"
              >
                {checkouting === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                Check Out
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
