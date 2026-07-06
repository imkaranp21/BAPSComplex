import { motion } from 'motion/react';
import { RefreshCw, ChevronRight, ArrowRight } from 'lucide-react';
import type { SpaceType } from '../App';
import { SPACES } from '../data/spaces';
import { useSpaceAvailability } from '../../lib/useSpaceAvailability';
import { useAuth } from '../../lib/AuthContext';
import { format } from 'date-fns';

const SPACE_ICONS: Record<string, string> = {
  gym: '🏋️', cricket: '🏏', futsal: '⚽', volleyball: '🏐',
  'table-tennis': '🏓', 'pool-table': '🎱', darts: '🎯',
};

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

  return (
    <div className="bg-zinc-950 min-h-full">
      {/* Header */}
      <div className="pt-2 pb-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-zinc-600 text-xs tracking-widest uppercase font-semibold mb-1">
              {format(new Date(), 'EEEE, MMMM d')}
            </p>
            <h1 className="text-2xl font-black text-white tracking-tight leading-tight">
              {firstName ? `${greeting},` : greeting}
              {firstName && <span className="text-orange-500"> {firstName}.</span>}
            </h1>
          </div>
          <button
            onClick={refresh}
            className={`mt-1 p-2.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-white hover:border-zinc-700 transition-all ${loading ? 'animate-spin' : ''}`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeFilter && (
          <div className="mt-4 inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs px-3 py-1.5 rounded-full font-semibold tracking-wide uppercase">
            <span>{activeFilter}</span>
            <button onClick={onClearFilter} className="text-orange-500 hover:text-orange-300 text-base leading-none ml-1">×</button>
          </div>
        )}
      </div>

      {/* Section label */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-zinc-600 text-[10px] font-bold tracking-[0.25em] uppercase">Spaces</p>
        <p className="text-zinc-700 text-[10px] tracking-widest uppercase">
          Live · {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </p>
      </div>

      {/* Space cards */}
      <div className="space-y-2.5 mb-8">
        {filtered.map((space, i) => {
          const av = availability[space.id];
          const isGym = space.id === 'gym';
          const subtitle = isGym && av
            ? `${av.available} / ${av.total} spots`
            : space.description;
          const statusLabel = av?.label ?? 'Open';
          const statusType = av?.statusType ?? 'open';

          return (
            <motion.button
              key={space.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSpaceClick(space.id)}
              className="group w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-4 rounded-xl text-left transition-all duration-200 flex items-center gap-4"
            >
              {/* Status stripe */}
              <div className={`w-0.5 self-stretch rounded-full shrink-0 ${
                statusType === 'inuse' ? 'bg-red-500'
                : statusType === 'capacity' ? 'bg-amber-500'
                : 'bg-emerald-500'
              }`} />

              {/* Icon */}
              <span className="text-2xl shrink-0">{SPACE_ICONS[space.id] ?? '🏟️'}</span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-base tracking-tight">{space.name}</h3>
                <p className="text-zinc-600 text-xs mt-0.5 truncate">{subtitle}</p>
              </div>

              {/* Status badge */}
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full ${
                  statusType === 'inuse' ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : statusType === 'capacity' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {statusLabel}
                </span>
                <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="space-y-2.5">
        <button
          onClick={onViewAllSpaces}
          className="group w-full flex items-center justify-between bg-orange-500 hover:bg-orange-400 text-black font-bold py-4 px-5 rounded-xl transition-colors duration-200"
        >
          <span className="text-sm tracking-wide">View all spaces</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
        <button
          onClick={onFilterClick}
          className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white font-semibold py-4 px-5 rounded-xl transition-all duration-200 text-sm"
        >
          Filter by activity
        </button>
      </div>
    </div>
  );
}
