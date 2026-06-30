import { motion } from 'motion/react';
import { ArrowLeft, Filter } from 'lucide-react';
import { useState } from 'react';
import type { SpaceType } from '../App';

interface AllSpacesScreenProps {
  onBack: () => void;
  onSpaceClick: (space: SpaceType) => void;
  onFilterClick: () => void;
  activeFilter: string | null;
  onClearFilter: () => void;
}

export function AllSpacesScreen({ onBack, onSpaceClick, onFilterClick, activeFilter, onClearFilter }: AllSpacesScreenProps) {
  const [filterMode, setFilterMode] = useState<'all' | 'available' | 'full'>('all');

  const allSpaces = [
    { type: 'pool-tables' as SpaceType, name: 'Pool Tables', available: 2, total: 4, status: 'open' as const, activities: ['Pool'] },
    { type: 'table-tennis' as SpaceType, name: 'Table Tennis', available: 0, total: 3, status: 'full' as const, activities: ['Table Tennis'] },
    { type: 'squash-courts' as SpaceType, name: 'Squash Courts', available: 1, total: 3, status: 'open' as const, activities: ['Squash'] },
    { type: 'multipurpose-courts' as SpaceType, name: 'Multipurpose - Basketball', available: 1, total: 3, status: 'open' as const, activities: ['Basketball'], subtitle: 'Court 1 available' },
    { type: 'multipurpose-courts' as SpaceType, name: 'Multipurpose - Volleyball', available: 1, total: 3, status: 'open' as const, activities: ['Volleyball'], subtitle: 'Next session 6:00 PM' },
    { type: 'multipurpose-courts' as SpaceType, name: 'Multipurpose - Pickleball', available: 1, total: 3, status: 'open' as const, activities: ['Pickleball'], subtitle: 'Court 3 until 6:00 PM' },
    { type: 'multipurpose-courts' as SpaceType, name: 'Multipurpose - Badminton', available: 1, total: 3, status: 'open' as const, activities: ['Badminton'], subtitle: 'Available for walk-in' },
  ];

  let spaces = allSpaces;
  if (activeFilter && activeFilter !== 'All activities') {
    spaces = allSpaces.filter(space =>
      space.activities.some(a => a.toLowerCase() === activeFilter.toLowerCase())
    );
  }

  const filteredSpaces = spaces.filter(space => {
    if (filterMode === 'all') return true;
    if (filterMode === 'available') return space.available > 0;
    if (filterMode === 'full') return space.available === 0;
    return true;
  });

  return (
    <div className="bg-[#FFFBF5]">
      {/* Header */}
      <div className="pb-4 border-b border-stone-200">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="p-2 -ml-2 rounded-lg hover:bg-stone-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-stone-700" />
          </button>
          <h1 className="text-xl font-bold text-stone-900 flex-1 text-center">All Spaces</h1>
          <button onClick={onFilterClick} className="p-2 -mr-2 rounded-lg hover:bg-stone-100 transition-colors">
            <Filter className="w-6 h-6 text-stone-700" />
          </button>
        </div>

        {activeFilter && activeFilter !== 'All activities' && (
          <div className="mb-3">
            <div className="inline-flex items-center gap-2 bg-orange-600 text-white text-sm px-3 py-1.5 rounded-full">
              <span>Activity: {activeFilter}</span>
              <button onClick={onClearFilter} className="hover:text-orange-200 text-lg">×</button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <FilterChip label="All" active={filterMode === 'all'} onClick={() => setFilterMode('all')} />
          <FilterChip label="Available" active={filterMode === 'available'} onClick={() => setFilterMode('available')} />
          <FilterChip label="Full" active={filterMode === 'full'} onClick={() => setFilterMode('full')} />
        </div>
      </div>

      {/* Spaces List */}
      <div className="py-6 space-y-3">
        {filteredSpaces.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-stone-500">No spaces found for {activeFilter}</p>
            <button onClick={onClearFilter} className="mt-4 text-orange-600 hover:text-orange-700 font-medium">
              Clear filter
            </button>
          </div>
        ) : (
          filteredSpaces.map((space, index) => (
            <motion.button
              key={`${space.type}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSpaceClick(space.type)}
              className="w-full bg-white border border-stone-200 p-4 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-colors text-left shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-stone-900 font-semibold mb-1">{space.name}</h3>
                  <p className="text-stone-500 text-sm">
                    {space.subtitle || `${space.available} of ${space.total} available`}
                  </p>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  space.status === 'open' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                }`}>
                  {space.status === 'open' ? 'Open' : 'Full'}
                </div>
              </div>
            </motion.button>
          ))
        )}
      </div>

      {!activeFilter && (
        <div className="pb-6">
          <button
            onClick={onFilterClick}
            className="w-full bg-stone-100 text-stone-800 font-semibold py-3.5 px-4 rounded-xl hover:bg-stone-200 transition-colors"
          >
            Filter by activity
          </button>
        </div>
      )}
    </div>
  );
}

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
        active
          ? 'bg-orange-600 text-white'
          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
      }`}
    >
      {label}
    </button>
  );
}
