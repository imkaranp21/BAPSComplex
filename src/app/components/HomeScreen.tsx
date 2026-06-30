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
    <div className="bg-[#2d2d2d]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-white">Available Now</h1>
          <button
            onClick={onFilterClick}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Filter className="w-6 h-6 text-white" />
          </button>
        </div>
        {activeFilter && (
          <div className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm px-3 py-1 rounded-full">
            <span>Filter: {activeFilter}</span>
            <button onClick={onClearFilter} className="hover:text-gray-200 text-lg">×</button>
          </div>
        )}
      </div>

      <div className="px-6 py-6">
        {/* NOW Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-400 text-sm font-medium">NOW</div>
            <div className="text-gray-500 text-xs">
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
            className="w-full bg-white text-black font-semibold py-3.5 px-4 rounded-xl hover:bg-gray-200 transition-colors"
          >
            View all spaces
          </button>

          <button
            onClick={onFilterClick}
            className="w-full bg-[#3d3d3d] text-white font-semibold py-3.5 px-4 rounded-xl hover:bg-[#4d4d4d] transition-colors"
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
    active: 'bg-white text-black'
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full bg-[#3d3d3d] p-4 rounded-xl hover:bg-[#4d4d4d] transition-colors text-left"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-white font-semibold mb-1">{title}</h3>
          <p className="text-gray-400 text-sm">{subtitle}</p>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusColors[statusType]}`}>
          {status}
        </div>
      </div>
    </motion.button>
  );
}
