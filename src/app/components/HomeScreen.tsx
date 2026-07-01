import { motion } from 'motion/react';
import { Filter, RefreshCw } from 'lucide-react';
import type { SpaceType } from '../App';
import { SPACES } from '../data/spaces';
import { useSpaceAvailability } from '../../lib/useSpaceAvailability';

interface HomeScreenProps {
  onSpaceClick: (space: SpaceType) => void;
  onViewAllSpaces: () => void;
  onFilterClick: () => void;
  activeFilter: string | null;
  onClearFilter: () => void;
}

export function HomeScreen({ onSpaceClick, onViewAllSpaces, onFilterClick, activeFilter, onClearFilter }: HomeScreenProps) {
  const { availability, loading, lastUpdated, refresh } = useSpaceAvailability();

  const filtered = activeFilter
    ? SPACES.filter(s => s.activities.some(a => a.toLowerCase() === activeFilter.toLowerCase()))
    : SPACES;

  return (
    <div className="bg-[#FFFBF5]">
      <div className="pb-4 border-b border-stone-200">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-stone-900">Available Now</h1>
          <button onClick={onFilterClick} className="p-2 rounded-lg hover:bg-stone-100 transition-colors">
            <Filter className="w-6 h-6 text-stone-600" />
          </button>
        </div>
        {activeFilter && (
          <div className="inline-flex items-center gap-2 bg-orange-600 text-white text-sm px-3 py-1 rounded-full">
            <span>Filter: {activeFilter}</span>
            <button onClick={onClearFilter} className="hover:text-orange-200 text-lg leading-none">×</button>
          </div>
        )}
      </div>

      <div className="py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="text-stone-400 text-sm font-medium tracking-wide">NOW</div>
            <button
              onClick={refresh}
              className="flex items-center gap-1.5 text-stone-400 text-xs hover:text-stone-600 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Updated: {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </button>
          </div>

          <div className="space-y-3">
            {filtered.map(space => {
              const av = availability[space.id];
              const isGym = space.id === 'gym';
              const subtitle = isGym && av
                ? `${av.available} of ${av.total} spots available`
                : space.description;
              const statusLabel = av?.label ?? (isGym ? '…' : 'Open');
              const statusType = av?.statusType ?? 'open';

              return (
                <motion.button
                  key={space.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSpaceClick(space.id)}
                  className="w-full bg-white border border-stone-200 p-4 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-colors text-left shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-stone-900 font-semibold mb-1">{space.name}</h3>
                      <p className="text-stone-500 text-sm">{subtitle}</p>
                    </div>
                    <div className={`px-3 py-1.5 rounded-full text-sm font-medium ml-3 ${
                      statusType === 'inuse' ? 'bg-red-600 text-white'
                      : statusType === 'capacity' ? 'bg-orange-600 text-white'
                      : 'bg-green-600 text-white'
                    }`}>
                      {statusLabel}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <button
            onClick={onViewAllSpaces}
            className="w-full bg-orange-600 text-white font-semibold py-3.5 px-4 rounded-xl hover:bg-orange-700 transition-colors"
          >
            View all spaces
          </button>
          <button
            onClick={onFilterClick}
            className="w-full bg-stone-100 text-stone-800 font-semibold py-3.5 px-4 rounded-xl hover:bg-stone-200 transition-colors"
          >
            Filter by activity
          </button>
        </motion.div>
      </div>
    </div>
  );
}
