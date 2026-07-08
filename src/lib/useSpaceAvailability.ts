import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { SPACES } from '../app/data/spaces';

const GYM_CAPACITY = 30;

export interface SpaceAvailability {
  available: number;
  total: number;
  inUse: boolean;
  label: string;         // '0/30' for gym, 'Open'/'In Use' for others
  statusType: 'open' | 'inuse' | 'capacity';
}

export function useSpaceAvailability() {
  const [availability, setAvailability] = useState<Record<string, SpaceAvailability>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const refresh = useCallback(async () => {
    setLoading(true);

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

    const [gymRes, spacesRes, walkInsRes, bookingsRes] = await Promise.all([
      (supabase as any).from('gym_checkins').select('id', { count: 'exact' }).eq('is_active', true),
      (supabase as any).from('spaces').select('id, slug'),
      (supabase as any).from('walk_ins').select('space_id').eq('is_active', true),
      (supabase as any).rpc('get_space_availability', { check_date: todayStr, check_time: timeStr }),
    ]);

    // slug → db UUID map
    const idMap: Record<string, string> = {};
    for (const s of (spacesRes.data ?? [])) idMap[s.slug] = s.id;

    // occupied unit count per db UUID (walk-ins + bookings)
    const occupied: Record<string, number> = {};
    for (const w of (walkInsRes.data ?? [])) {
      occupied[w.space_id] = (occupied[w.space_id] ?? 0) + 1;
    }
    for (const b of (bookingsRes.data ?? [])) {
      occupied[b.space_id] = (occupied[b.space_id] ?? 0) + Number(b.booked_units);
    }

    const gymCount = gymRes.count ?? 0;
    const next: Record<string, SpaceAvailability> = {};

    for (const space of SPACES) {
      if (space.id === 'gym') {
        const available = GYM_CAPACITY - gymCount;
        next['gym'] = {
          available,
          total: GYM_CAPACITY,
          inUse: gymCount >= GYM_CAPACITY,
          label: `${gymCount}/${GYM_CAPACITY}`,
          statusType: gymCount >= GYM_CAPACITY ? 'inuse' : gymCount === 0 ? 'open' : 'capacity',
        };
      } else {
        const dbId = idMap[space.id];
        const total = space.total ?? 1;
        const usedCount = dbId ? (occupied[dbId] ?? 0) : 0;
        const available = Math.max(0, total - usedCount);
        const inUse = available === 0;
        next[space.id] = {
          available,
          total,
          inUse,
          label: inUse ? 'In Use' : 'Open',
          statusType: inUse ? 'inuse' : 'open',
        };
      }
    }

    setAvailability(next);
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { availability, loading, lastUpdated, refresh };
}
