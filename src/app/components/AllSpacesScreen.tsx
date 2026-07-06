import { motion } from 'motion/react';
import { ArrowLeft, Filter, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { SpaceType } from '../App';
import { SPACES } from '../data/spaces';
import { useSpaceAvailability } from '../../lib/useSpaceAvailability';

const SPACE_ICONS: Record<string, string> = {
  gym: '🏋️', cricket: '🏏', futsal: '⚽', volleyball: '🏐',
  'table-tennis': '🏓', 'pool-table': '🎱', darts: '🎯',
};

interface AllSpacesScreenProps {
  onBack: () => void;
  onSpaceClick: (space: SpaceType) => void;
  onFilterClick: () => void;
  activeFilter: string | null;
  onClearFilter: () => void;
}

export function AllSpacesScreen({ onBack, onSpaceClick, onFilterClick, activeFilter, onClearFilter }: AllSpacesScreenProps) {
  const [filterMode, setFilterMode] = useState<'all' | 'available' | 'inuse'>('all');
  const { availability } = useSpaceAvailability();

  let spaces = SPACES;
  if (activeFilter && activeFilter !== 'All activities') {
    spaces = SPACES.filter(s =>
      s.activities.some(a => a.toLowerCase() === activeFilter.toLowerCase())
    );
  }

  const filteredSpaces = spaces.filter(space => {
    const av = availability[space.id];
    if (filterMode === 'available') return !av?.inUse;
    if (filterMode === 'inuse') return av?.inUse;
    return true;
  });

  return (
    <div className="bg-zinc-950 min-h-full">
      {/* Header */}
      <div className="pb-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-2xl font-black text-white tracking-tight flex-1">All Spaces</h1>
          <button
            onClick={onFilterClick}
            className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Activity filter chip */}
        {activeFilter && activeFilter !== 'All activities' && (
          <div className="mb-4 inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs px-3 py-1.5 rounded-full font-bold tracking-widest uppercase">
            <span>{activeFilter}</span>
            <button onClick={onClearFilter} className="text-orange-500 hover:text-orange-300 text-base leading-none">×</button>
          </div>
        )}

        {/* Status filters */}
        <div className="flex gap-2">
          {(['all', 'available', 'inuse'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-4 py-1.5 text-[10px] font-bold tracking-widest uppercase transition-all rounded-full ${
                filterMode === mode
                  ? 'bg-orange-500 text-black'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
              }`}
            >
              {mode === 'all' ? 'All' : mode === 'available' ? 'Available' : 'In Use'}
            </button>
          ))}
        </div>
      </div>

      {/* Spaces list */}
      <div className="space-y-2.5">
        {filteredSpaces.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-600 text-sm">No spaces found{activeFilter ? ` for "${activeFilter}"` : ''}.</p>
            <button onClick={onClearFilter} className="mt-3 text-orange-500 hover:text-orange-400 text-sm font-semibold">
              Clear filter
            </button>
          </div>
        ) : (
          filteredSpaces.map((space, i) => {
            const av = availability[space.id];
            const isGym = space.id === 'gym';
            const subtitle = isGym && av ? `${av.available} / ${av.total} spots` : space.description;
            const statusLabel = av?.label ?? 'Open';
            const statusType = av?.statusType ?? 'open';

            return (
              <motion.button
                key={space.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onSpaceClick(space.id)}
                className="group w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-4 rounded-xl text-left transition-all duration-200 flex items-center gap-4"
              >
                <div className={`w-0.5 self-stretch rounded-full shrink-0 ${
                  statusType === 'inuse' ? 'bg-red-500' : statusType === 'capacity' ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />
                <span className="text-2xl shrink-0">{SPACE_ICONS[space.id] ?? '🏟️'}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold tracking-tight">{space.name}</h3>
                  <p className="text-zinc-600 text-xs mt-0.5 truncate">{subtitle}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full ${
                    statusType === 'inuse' ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : statusType === 'capacity' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {statusLabel}
                  </span>
                  <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
                </div>
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}
