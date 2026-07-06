import { motion } from 'motion/react';
import { ArrowLeft, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import type { SpaceType } from '../App';
import { SPACES } from '../data/spaces';
import { useSpaceAvailability } from '../../lib/useSpaceAvailability';

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
    spaces = SPACES.filter(s => s.activities.some(a => a.toLowerCase() === activeFilter.toLowerCase()));
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
      <div className="pb-8">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-white hover:border-zinc-700 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-3xl font-black text-white tracking-tighter flex-1 uppercase">All Spaces</h1>
          <button
            onClick={onFilterClick}
            className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-white hover:border-zinc-700 transition-all"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Activity filter chip */}
        {activeFilter && activeFilter !== 'All activities' && (
          <div className="mb-5 inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] px-3 py-1.5 rounded-full font-black tracking-[0.2em] uppercase">
            <span>{activeFilter}</span>
            <button onClick={onClearFilter} className="text-orange-400 hover:text-orange-200 text-sm leading-none ml-1">×</button>
          </div>
        )}

        {/* Status filters */}
        <div className="flex gap-2">
          {(['all', 'available', 'inuse'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-4 py-1.5 text-[10px] font-black tracking-[0.2em] uppercase transition-all rounded-full ${
                filterMode === mode
                  ? 'bg-orange-500 text-black'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-600 hover:border-zinc-700 hover:text-zinc-300'
              }`}
            >
              {mode === 'all' ? 'All' : mode === 'available' ? 'Available' : 'In Use'}
            </button>
          ))}
        </div>
      </div>

      {/* Spaces list */}
      <div className="space-y-3">
        {filteredSpaces.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-600 text-sm">No spaces found{activeFilter ? ` for "${activeFilter}"` : ''}.</p>
            <button onClick={onClearFilter} className="mt-3 text-orange-500 hover:text-orange-400 text-sm font-bold">Clear filter</button>
          </div>
        ) : (
          filteredSpaces.map((space, i) => {
            const av = availability[space.id];
            const isGym = space.id === 'gym';
            const gymCount = isGym && av ? av.total - av.available : 0;
            const gymTotal = isGym && av ? av.total : 30;
            const gymPct = isGym ? (gymCount / gymTotal) * 100 : 0;
            const statusType = av?.statusType ?? 'open';
            const statusLabel = av?.label ?? 'Open';

            return (
              <motion.button
                key={space.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onSpaceClick(space.id)}
                className="group w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 text-left transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      statusType === 'inuse' ? 'bg-red-500' : statusType === 'capacity' ? 'bg-amber-500' : 'bg-emerald-500'
                    } ${statusType !== 'inuse' ? '' : 'animate-pulse'}`} />
                    <span className={`text-[9px] font-black tracking-[0.25em] uppercase ${
                      statusType === 'inuse' ? 'text-red-500' : statusType === 'capacity' ? 'text-amber-500' : 'text-emerald-500'
                    }`}>
                      {statusLabel}
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
                </div>

                <h3 className="text-xl font-black text-white tracking-tighter uppercase leading-none">
                  {space.name}
                </h3>

                {isGym && (
                  <div className="mt-4">
                    <div className="flex items-end justify-between mb-2">
                      <span className="text-zinc-600 text-xs">Occupancy</span>
                      <span className="text-white font-black text-sm">{gymCount} / {gymTotal}</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-1">
                      <div
                        className={`h-1 rounded-full ${gymPct > 80 ? 'bg-red-500' : gymPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.max(1, gymPct)}%` }}
                      />
                    </div>
                  </div>
                )}

                {!isGym && (
                  <p className="text-zinc-600 text-xs mt-2">{space.description}</p>
                )}
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}
