import { motion } from 'motion/react';
import { Filter } from 'lucide-react';
import type { SpaceType } from '../App';

interface HomeScreenProps {
  onSpaceClick: (space: SpaceType) => void;
  onViewAllSpaces: () => void;
  onFilterClick: () => void;
  activeFilter: string | null;
  onClearFilter: () => void;
}

export function HomeScreen({ onSpaceClick, onViewAllSpaces, onFilterClick, activeFilter, onClearFilter }: HomeScreenProps) {
  return (
    <div className="bg-[#FFFBF5]">
      {/* Header */}
      <div className="pb-4 border-b border-stone-200">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-stone-900">Available Now</h1>
          <button
            onClick={onFilterClick}
            className="p-2 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <Filter className="w-6 h-6 text-stone-600" />
          </button>
        </div>
        {activeFilter && (
          <div className="inline-flex items-center gap-2 bg-orange-600 text-white text-sm px-3 py-1 rounded-full">
            <span>Filter: {activeFilter}</span>
            <button onClick={onClearFilter} className="hover:text-orange-200 text-lg">×</button>
          </div>
        )}
      </div>

      <div className="py-6">
        {/* NOW Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-stone-400 text-sm font-medium tracking-wide">NOW</div>
            <div className="text-stone-400 text-xs">
              Updated: {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </div>
          </div>

          <div className="space-y-3">
            <SpaceCard
              title="Pool Tables"
              subtitle="4 tables total"
              status="2 available"
              statusType="available"
              onClick={() => onSpaceClick('pool-tables')}
            />
            <SpaceCard
              title="Table Tennis"
              subtitle="3 tables total"
              status="Full"
              statusType="full"
              onClick={() => onSpaceClick('table-tennis')}
            />
            <SpaceCard
              title="Squash Courts"
              subtitle="3 courts total"
              status="1 open"
              statusType="available"
              onClick={() => onSpaceClick('squash-courts')}
            />
            <SpaceCard
              title="Court 3 — Pickleball"
              subtitle="until 6:00 PM"
              status="Active"
              statusType="active"
              onClick={() => onSpaceClick('multipurpose-courts')}
            />
          </div>
        </motion.div>

        {/* Action Buttons */}
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

interface SpaceCardProps {
  title: string;
  subtitle: string;
  status: string;
  statusType: 'available' | 'full' | 'active';
  onClick: () => void;
}

function SpaceCard({ title, subtitle, status, statusType, onClick }: SpaceCardProps) {
  const statusColors = {
    available: 'bg-green-600 text-white',
    full: 'bg-red-600 text-white',
    active: 'bg-orange-600 text-white'
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full bg-white border border-stone-200 p-4 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-colors text-left shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-stone-900 font-semibold mb-1">{title}</h3>
          <p className="text-stone-500 text-sm">{subtitle}</p>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusColors[statusType]}`}>
          {status}
        </div>
      </div>
    </motion.button>
  );
}
