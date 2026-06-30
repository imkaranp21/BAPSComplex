import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { useState } from 'react';

interface ActivityFilterModalProps {
  onClose: () => void;
  onApply: (activity: string) => void;
  currentFilter: string | null;
}

export function ActivityFilterModal({ onClose, onApply, currentFilter }: ActivityFilterModalProps) {
  const [selectedActivity, setSelectedActivity] = useState<string>(currentFilter || '');

  const activities = ['Pickleball', 'Badminton', 'Basketball', 'Volleyball', 'All activities'];

  const handleApply = () => {
    if (selectedActivity && selectedActivity !== 'All activities') {
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
      className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-white rounded-t-3xl p-6 pb-8 shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-stone-900">Filter by Activity</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-6 h-6 text-stone-600" />
          </button>
        </div>

        <p className="text-stone-500 text-sm mb-6">Find spaces by activity type</p>

        {/* Activity Selection */}
        <div className="mb-6">
          <div className="text-stone-400 text-sm font-medium tracking-wide mb-3">SELECT ACTIVITY</div>
          <div className="grid grid-cols-2 gap-2">
            {activities.map((activity) => (
              <button
                key={activity}
                onClick={() => setSelectedActivity(activity)}
                className={`py-3 px-4 rounded-xl font-medium transition-colors ${
                  selectedActivity === activity
                    ? 'bg-orange-600 text-white'
                    : 'bg-stone-100 text-stone-800 hover:bg-stone-200'
                }`}
              >
                {activity}
              </button>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleApply}
            disabled={!selectedActivity}
            className={`w-full font-semibold py-3.5 px-4 rounded-xl transition-colors ${
              selectedActivity
                ? 'bg-orange-600 text-white hover:bg-orange-700'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            Show results
          </button>
          <button
            onClick={handleClear}
            className="w-full bg-stone-100 text-stone-800 font-semibold py-3.5 px-4 rounded-xl hover:bg-stone-200 transition-colors"
          >
            Clear filter
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
