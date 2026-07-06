import { motion } from 'motion/react';
import { ArrowLeft, Users, CalendarPlus, ArrowRight } from 'lucide-react';
import type { SpaceType } from '../App';
import { getSpace } from '../data/spaces';
import { useSpaceAvailability } from '../../lib/useSpaceAvailability';

const SPACE_ICONS: Record<string, string> = {
  gym: '🏋️', cricket: '🏏', futsal: '⚽', volleyball: '🏐',
  'table-tennis': '🏓', 'pool-table': '🎱', darts: '🎯',
};

interface SpaceDetailScreenProps {
  space: SpaceType;
  onBack: () => void;
  onBookClick: () => void;
}

export function SpaceDetailScreen({ space, onBack, onBookClick }: SpaceDetailScreenProps) {
  const spaceData = getSpace(space);
  const { availability } = useSpaceAvailability();
  const av = availability[space];

  const gymCount = av ? av.total - av.available : 0;
  const gymTotal = av?.total ?? spaceData.total;
  const pct = gymTotal > 0 ? (gymCount / gymTotal) * 100 : 0;

  return (
    <div className="bg-zinc-950 min-h-full">
      {/* Back */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={onBack}
          className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-zinc-600 text-xs tracking-widest uppercase font-semibold">All Spaces</span>
      </div>

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-3xl shrink-0">
            {SPACE_ICONS[space] ?? '🏟️'}
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">{spaceData.name}</h1>
            <p className="text-zinc-500 text-sm mt-1">{spaceData.description}</p>
          </div>
        </div>
      </motion.div>

      {/* Gym — capacity bar */}
      {space === 'gym' && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <p className="text-zinc-600 text-[10px] font-bold tracking-[0.25em] uppercase mb-3">Occupancy</p>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-zinc-500" />
                <span className="text-zinc-400 text-sm font-medium">Inside now</span>
              </div>
              <span className="text-white font-black text-2xl tracking-tight">
                {gymCount}
                <span className="text-zinc-600 font-normal text-base"> / {gymTotal}</span>
              </span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-700 ${
                  pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.max(2, pct)}%` }}
              />
            </div>
            <p className="text-zinc-600 text-xs mt-2.5">{av?.available ?? gymTotal} spots remaining</p>
          </div>
        </motion.div>
      )}

      {/* Units (table tennis, pool table) */}
      {spaceData.units && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <p className="text-zinc-600 text-[10px] font-bold tracking-[0.25em] uppercase mb-3">Availability</p>
          <div className="space-y-2">
            {spaceData.units.map((unit, i) => {
              const available = av?.available ?? spaceData.units!.length;
              const inUse = i >= available;
              return (
                <div key={unit.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
                  <h3 className="text-white font-semibold">{unit.name}</h3>
                  <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full ${
                    inUse ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {inUse ? 'In Use' : 'Open'}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Single court status */}
      {!spaceData.units && space !== 'gym' && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <p className="text-zinc-600 text-[10px] font-bold tracking-[0.25em] uppercase mb-3">Status</p>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold">{spaceData.name}</h3>
              <p className="text-zinc-600 text-xs mt-0.5">{spaceData.description}</p>
            </div>
            <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full ${
              av?.inUse ? 'bg-red-500/10 text-red-400 border border-red-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              {av?.inUse ? 'In Use' : 'Open'}
            </span>
          </div>
        </motion.div>
      )}

      {/* Book button */}
      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onBookClick}
        className="group w-full flex items-center justify-between bg-orange-500 hover:bg-orange-400 text-black font-bold py-4 px-5 rounded-xl transition-colors duration-200"
      >
        <div className="flex items-center gap-2.5">
          <CalendarPlus className="w-4 h-4" />
          <span className="text-sm tracking-wide">Book a Slot</span>
        </div>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </motion.button>
    </div>
  );
}
