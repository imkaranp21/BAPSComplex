import { motion } from 'motion/react';
import { RefreshCw, ArrowRight, SlidersHorizontal } from 'lucide-react';
import type { SpaceType } from '../App';
import { SPACES } from '../data/spaces';
import { useSpaceAvailability } from '../../lib/useSpaceAvailability';
import { useAuth } from '../../lib/AuthContext';
import { format } from 'date-fns';

interface HomeScreenProps {
  onSpaceClick: (space: SpaceType) => void;
  onViewAllSpaces: () => void;
  onFilterClick: () => void;
  activeFilter: string | null;
  onClearFilter: () => void;
}

export function HomeScreen({ onSpaceClick, onViewAllSpaces, onFilterClick, activeFilter, onClearFilter }: HomeScreenProps) {
  const { availability, loading, lastUpdated, refresh } = useSpaceAvailability();
  const { profile } = useAuth();

  const firstName = profile?.full_name?.split(' ')[0] ?? null;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const filtered = activeFilter
    ? SPACES.filter(s => s.activities.some(a => a.toLowerCase() === activeFilter.toLowerCase()))
    : SPACES;

  const gymSpace = filtered.find(s => s.id === 'gym');
  const gymAv = availability['gym'];
  const gymCount = gymAv ? gymAv.total - gymAv.available : 0;
  const gymTotal = gymAv?.total ?? 30;
  const gymPct = gymTotal > 0 ? (gymCount / gymTotal) * 100 : 0;

  const otherSpaces = filtered.filter(s => s.id !== 'gym');

  return (
    <div className="bg-zinc-950 min-h-full">

      {/* Greeting header */}
      <div className="pt-2 pb-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-zinc-600 text-[10px] tracking-[0.3em] uppercase font-bold mb-2">
              {format(new Date(), 'EEEE · MMMM d')}
            </p>
            <h1 className="text-4xl font-black text-white tracking-tighter leading-none">
              {greeting}
              {firstName && (
                <>
                  ,<br />
                  <span className="text-violet-400">{firstName}.</span>
                </>
              )}
            </h1>
          </div>
          <button
            onClick={refresh}
            className={`mt-1 p-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-600 hover:text-white hover:border-zinc-700 transition-all ${loading ? 'animate-spin' : ''}`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeFilter && (
          <div className="mt-5 inline-flex items-center gap-2 bg-violet-600/10 border border-violet-500/30 text-violet-300 text-[10px] px-3 py-1.5 rounded-full font-black tracking-[0.2em] uppercase">
            <span>{activeFilter}</span>
            <button onClick={onClearFilter} className="text-violet-300 hover:text-violet-200 text-sm leading-none ml-1">×</button>
          </div>
        )}
      </div>

      {/* Gym — live hero card */}
      {gymSpace && (
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onSpaceClick('gym')}
          className="group w-full bg-zinc-900 border border-zinc-800 hover:border-violet-900/50 rounded-2xl p-6 text-left mb-8 transition-all duration-200 relative overflow-hidden shadow-lg shadow-violet-950/40"
        >
          {/* Subtle violet glow in top-right corner of card */}
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-violet-700/15 blur-2xl rounded-full pointer-events-none" />
          {/* Status dot */}
          <div className="flex items-center gap-2 mb-6">
            <span className={`w-2 h-2 rounded-full animate-pulse ${gymPct > 80 ? 'bg-red-500' : gymPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            <span className="text-[10px] font-black text-zinc-500 tracking-[0.3em] uppercase">Live</span>
          </div>

          <div className="flex items-end justify-between mb-5">
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Gym</h2>
            <div className="text-right">
              <span className="text-5xl font-black text-white tracking-tighter leading-none">{gymCount}</span>
              <span className="text-zinc-600 text-2xl font-black tracking-tighter"> / {gymTotal}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-zinc-800 rounded-full h-1">
            <div
              className={`h-1 rounded-full transition-all duration-700 ${gymPct > 80 ? 'bg-red-500' : gymPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.max(1, gymPct)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-zinc-600 text-xs">{gymTotal - gymCount} spots remaining</p>
            <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
          </div>
        </motion.button>
      )}

      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-zinc-600 text-[10px] font-black tracking-[0.3em] uppercase">Spaces</p>
        <p className="text-zinc-700 text-[10px] tracking-widest uppercase font-bold">
          {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </p>
      </div>

      {/* Other spaces — full-width list */}
      <div className="space-y-2 mb-8">
        {otherSpaces.map((space, i) => {
          const av = availability[space.id];
          const statusType = av?.statusType ?? 'open';
          const statusLabel = av?.label ?? 'Open';
          const stripe = statusType === 'inuse' ? 'bg-red-500' : statusType === 'capacity' ? 'bg-amber-500' : 'bg-emerald-500';
          const dot = statusType === 'inuse' ? 'bg-red-500 animate-pulse' : statusType === 'capacity' ? 'bg-amber-500' : 'bg-emerald-500';
          const txt = statusType === 'inuse' ? 'text-red-500' : statusType === 'capacity' ? 'text-amber-500' : 'text-emerald-500';

          return (
            <motion.button
              key={space.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSpaceClick(space.id)}
              className="group w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl px-5 py-5 text-left flex items-center gap-4 transition-all duration-200"
            >
              <div className={`w-0.5 h-10 rounded-full shrink-0 ${stripe}`} />
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-black text-white tracking-tighter uppercase leading-none">{space.name}</h3>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                  <span className={`text-[9px] font-black tracking-[0.25em] uppercase ${txt}`}>{statusLabel}</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all shrink-0" />
            </motion.button>
          );
        })}
      </div>

      {/* Footer actions */}
      <div className="flex gap-3">
        <button
          onClick={onViewAllSpaces}
          className="group flex-1 flex items-center justify-between bg-violet-600 hover:bg-violet-500 text-white font-black py-4 px-5 rounded-xl transition-colors duration-200 shadow-lg shadow-violet-900/50"
        >
          <span className="text-sm tracking-wide uppercase">All Spaces</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
        <button
          onClick={onFilterClick}
          className="aspect-square h-14 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-white rounded-xl transition-all flex items-center justify-center"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
