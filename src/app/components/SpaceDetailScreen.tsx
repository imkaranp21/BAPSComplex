import { motion } from 'motion/react';
import { ArrowLeft, Users, CalendarPlus, ArrowRight } from 'lucide-react';
import type { SpaceType } from '../App';
import { getSpace } from '../data/spaces';
import { useSpaceAvailability } from '../../lib/useSpaceAvailability';

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

  const statusType = av?.statusType ?? 'open';
  const statusLabel = av?.label ?? 'Open';

  return (
    <div className="bg-zinc-950 min-h-full">
      {/* Back */}
      <div className="flex items-center gap-3 mb-10">
        <button
          onClick={onBack}
          className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-white hover:border-zinc-700 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-zinc-700 text-[10px] tracking-[0.3em] uppercase font-black">All Spaces</span>
      </div>

      {/* Hero — big name + status */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-2.5 mb-4">
          <span className={`w-2.5 h-2.5 rounded-full ${
            statusType === 'inuse' ? 'bg-red-500 animate-pulse' : statusType === 'capacity' ? 'bg-amber-500' : 'bg-emerald-500'
          }`} />
          <span className={`text-[10px] font-black tracking-[0.3em] uppercase ${
            statusType === 'inuse' ? 'text-red-500' : statusType === 'capacity' ? 'text-amber-500' : 'text-emerald-500'
          }`}>
            {statusLabel}
          </span>
        </div>
        <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none mb-3">
          {spaceData.name}
        </h1>
        <p className="text-zinc-600 text-sm">{spaceData.description}</p>
      </motion.div>

      {/* Gym — capacity section */}
      {space === 'gym' && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-zinc-700 text-[10px] font-black tracking-[0.3em] uppercase mb-4">Occupancy</p>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-end justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-zinc-600" />
                <span className="text-zinc-500 text-sm font-medium">Inside now</span>
              </div>
              <div>
                <span className="text-5xl font-black text-white tracking-tighter leading-none">{gymCount}</span>
                <span className="text-zinc-600 text-2xl font-black tracking-tighter"> / {gymTotal}</span>
              </div>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-700 ${pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.max(1, pct)}%` }}
              />
            </div>
            <p className="text-zinc-600 text-xs mt-3">{av?.available ?? gymTotal} spots remaining</p>
          </div>
        </motion.div>
      )}

      {/* Units (table tennis, pool table) */}
      {spaceData.units && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <p className="text-zinc-700 text-[10px] font-black tracking-[0.3em] uppercase mb-4">Availability</p>
          <div className="space-y-2">
            {spaceData.units.map((unit, i) => {
              const available = av?.available ?? spaceData.units!.length;
              const inUse = i >= available;
              return (
                <div key={unit.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
                  <h3 className="text-white font-black tracking-tight uppercase text-sm">{unit.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${inUse ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                    <span className={`text-[9px] font-black tracking-[0.25em] uppercase ${inUse ? 'text-red-500' : 'text-emerald-500'}`}>
                      {inUse ? 'In Use' : 'Open'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Single court status */}
      {!spaceData.units && space !== 'gym' && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <p className="text-zinc-700 text-[10px] font-black tracking-[0.3em] uppercase mb-4">Status</p>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
            <div>
              <h3 className="text-white font-black tracking-tight uppercase">{spaceData.name}</h3>
              <p className="text-zinc-600 text-xs mt-1">{spaceData.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${av?.inUse ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span className={`text-[9px] font-black tracking-[0.25em] uppercase ${av?.inUse ? 'text-red-500' : 'text-emerald-500'}`}>
                {av?.inUse ? 'In Use' : 'Open'}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Book CTA */}
      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onBookClick}
        className="group w-full flex items-center justify-between bg-violet-600 hover:bg-violet-500 text-white font-black py-5 px-6 rounded-2xl transition-colors duration-200"
      >
        <div className="flex items-center gap-3">
          <CalendarPlus className="w-4 h-4" />
          <span className="text-sm tracking-widest uppercase">Book a Slot</span>
        </div>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </motion.button>
    </div>
  );
}
