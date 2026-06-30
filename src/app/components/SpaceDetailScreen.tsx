import { motion } from 'motion/react';
import { ArrowLeft, Users, CalendarPlus } from 'lucide-react';
import type { SpaceType } from '../App';
import { getSpace } from '../data/spaces';

interface SpaceDetailScreenProps {
  space: SpaceType;
  onBack: () => void;
  onBookClick: () => void;
}

export function SpaceDetailScreen({ space, onBack, onBookClick }: SpaceDetailScreenProps) {
  const spaceData = getSpace(space);

  return (
    <div className="bg-[#FFFBF5]">
      <div className="pb-4 border-b border-stone-200">
        <div className="flex items-center mb-2">
          <button onClick={onBack} className="p-2 -ml-2 rounded-lg hover:bg-stone-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-stone-700" />
          </button>
          <div className="flex-1 text-center">
            <div className="text-stone-400 text-xs">← All Spaces</div>
          </div>
          <div className="w-10" />
        </div>
        <h1 className="text-2xl font-bold text-stone-900">{spaceData.name}</h1>
        <p className="text-stone-500 text-sm mt-1">{spaceData.description}</p>
      </div>

      <div className="py-6">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-stone-400 text-sm mb-6">
          Updated: {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </motion.p>

        {/* Gym — capacity view */}
        {space === 'gym' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="text-stone-400 text-sm font-medium tracking-wide mb-3">CURRENT OCCUPANCY</div>
            <div className="bg-white border border-stone-200 p-5 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-orange-600" />
                  <span className="text-stone-700 font-medium">People inside</span>
                </div>
                <span className="text-2xl font-bold text-stone-900">
                  {spaceData.total - spaceData.available}
                  <span className="text-stone-400 text-base font-normal"> / {spaceData.total}</span>
                </span>
              </div>
              {/* Capacity bar */}
              <div className="w-full bg-stone-100 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    (spaceData.total - spaceData.available) / spaceData.total > 0.8
                      ? 'bg-red-500'
                      : (spaceData.total - spaceData.available) / spaceData.total > 0.5
                      ? 'bg-orange-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${((spaceData.total - spaceData.available) / spaceData.total) * 100}%` }}
                />
              </div>
              <p className="text-stone-400 text-xs mt-2">{spaceData.available} spots remaining</p>
            </div>
          </motion.div>
        )}

        {/* Spaces with units (table tennis, pool table) */}
        {spaceData.units && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
            <div className="text-stone-400 text-sm font-medium tracking-wide mb-3">AVAILABILITY</div>
            <div className="space-y-2">
              {spaceData.units.map(unit => (
                <div key={unit.id} className="bg-white border border-stone-200 p-4 rounded-xl shadow-sm flex items-center justify-between">
                  <h3 className="text-stone-900 font-semibold">{unit.name}</h3>
                  <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                    unit.status === 'open' ? 'bg-green-600 text-white' : 'bg-stone-200 text-stone-700'
                  }`}>
                    {unit.status === 'open' ? 'Open' : 'In use'}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Single courts/spaces without units */}
        {!spaceData.units && space !== 'gym' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
            <div className="text-stone-400 text-sm font-medium tracking-wide mb-3">STATUS</div>
            <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-stone-900 font-semibold">{spaceData.name}</h3>
                <p className="text-stone-500 text-sm">{spaceData.description}</p>
              </div>
              <div className={`px-3 py-1.5 rounded-full text-sm font-medium ml-3 ${
                spaceData.available > 0 ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
              }`}>
                {spaceData.available > 0 ? 'Available' : 'Full'}
              </div>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={onBookClick}
            className="w-full bg-orange-600 text-white font-semibold py-3.5 px-4 rounded-xl hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
          >
            <CalendarPlus className="w-5 h-5" />
            Book a Slot
          </button>
        </motion.div>
      </div>
    </div>
  );
}
