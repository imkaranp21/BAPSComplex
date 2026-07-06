import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { useState } from 'react';
import { ALL_ACTIVITIES } from '../data/spaces';

interface ActivityFilterModalProps {
  onClose: () => void;
  onApply: (activity: string) => void;
  currentFilter: string | null;
}

export function ActivityFilterModal({ onClose, onApply, currentFilter }: ActivityFilterModalProps) {
  const [selectedActivity, setSelectedActivity] = useState<string>(currentFilter || '');

  const handleApply = () => {
    if (selectedActivity) {
      onApply(selectedActivity);
    } else {
      onClose();
    }
  };

  const handleClear = () => {
    setSelectedActivity('');
    onApply('');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-zinc-900 border-t border-zinc-800 rounded-t-3xl p-6 pb-10"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-white tracking-tight">Filter by Activity</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-zinc-600 text-[10px] font-bold tracking-[0.25em] uppercase mb-3">Select Activity</p>
          <div className="grid grid-cols-2 gap-2">
            {ALL_ACTIVITIES.map((activity) => (
              <button
                key={activity}
                onClick={() => setSelectedActivity(activity)}
                className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all text-left ${
                  selectedActivity === activity
                    ? 'bg-orange-500 text-black'
                    : 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:text-white'
                }`}
              >
                {activity}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleApply}
            disabled={!selectedActivity}
            className="w-full font-bold py-4 px-4 rounded-xl transition-colors bg-orange-500 hover:bg-orange-400 text-black disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Show results
          </button>
          <button
            onClick={handleClear}
            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white font-semibold py-4 px-4 rounded-xl hover:border-zinc-600 transition-all"
          >
            Clear filter
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
