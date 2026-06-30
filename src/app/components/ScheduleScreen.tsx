import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import type { SpaceType } from '../App';
import { SPACES } from '../data/spaces';

interface ScheduleScreenProps {
  onBack: () => void;
  space: SpaceType | null;
}

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const times = ['6 AM', '8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM'];

const scheduleEvents: Record<SpaceType, { day: string; time: string; activity: string; note: string }[]> = {
  gym: [
    { day: 'Mon', time: '6 AM', activity: 'Open', note: 'All members' },
    { day: 'Tue', time: '6 AM', activity: 'Open', note: 'All members' },
    { day: 'Wed', time: '6 AM', activity: 'Open', note: 'All members' },
    { day: 'Thu', time: '6 AM', activity: 'Open', note: 'All members' },
    { day: 'Fri', time: '6 AM', activity: 'Open', note: 'All members' },
    { day: 'Sat', time: '8 AM', activity: 'Open', note: 'All members' },
    { day: 'Sun', time: '8 AM', activity: 'Open', note: 'All members' },
  ],
  'cricket-futsal': [
    { day: 'Mon', time: '8 AM', activity: 'Cricket', note: 'Open play' },
    { day: 'Mon', time: '6 PM', activity: 'Futsal', note: 'League night' },
    { day: 'Wed', time: '8 AM', activity: 'Cricket', note: 'Open play' },
    { day: 'Wed', time: '6 PM', activity: 'Futsal', note: 'League night' },
    { day: 'Fri', time: '8 AM', activity: 'Cricket', note: 'Open play' },
    { day: 'Sat', time: '10 AM', activity: 'Cricket', note: 'Match day' },
    { day: 'Sun', time: '10 AM', activity: 'Futsal', note: 'Open play' },
  ],
  volleyball: [
    { day: 'Mon', time: '8 AM', activity: 'Volleyball', note: 'Open play' },
    { day: 'Tue', time: '6 PM', activity: 'Volleyball', note: 'Club session' },
    { day: 'Thu', time: '8 AM', activity: 'Volleyball', note: 'Open play' },
    { day: 'Thu', time: '6 PM', activity: 'Volleyball', note: 'Club session' },
    { day: 'Sat', time: '10 AM', activity: 'Volleyball', note: 'Open play' },
    { day: 'Sun', time: '12 PM', activity: 'Volleyball', note: 'Open play' },
  ],
  'table-tennis': [
    { day: 'Mon', time: '8 AM', activity: 'Table Tennis', note: 'Open play' },
    { day: 'Tue', time: '8 AM', activity: 'Table Tennis', note: 'Open play' },
    { day: 'Wed', time: '6 PM', activity: 'Table Tennis', note: 'Club night' },
    { day: 'Thu', time: '8 AM', activity: 'Table Tennis', note: 'Open play' },
    { day: 'Fri', time: '6 PM', activity: 'Table Tennis', note: 'Tournament' },
    { day: 'Sat', time: '10 AM', activity: 'Table Tennis', note: 'Open play' },
    { day: 'Sun', time: '10 AM', activity: 'Table Tennis', note: 'Open play' },
  ],
  'pool-table': [
    { day: 'Mon', time: '10 AM', activity: 'Pool', note: 'Open play' },
    { day: 'Tue', time: '10 AM', activity: 'Pool', note: 'Open play' },
    { day: 'Wed', time: '10 AM', activity: 'Pool', note: 'Open play' },
    { day: 'Wed', time: '6 PM', activity: 'Pool', note: 'League' },
    { day: 'Thu', time: '10 AM', activity: 'Pool', note: 'Open play' },
    { day: 'Fri', time: '10 AM', activity: 'Pool', note: 'Open play' },
    { day: 'Sat', time: '12 PM', activity: 'Pool', note: 'Open play' },
    { day: 'Sun', time: '12 PM', activity: 'Pool', note: 'Open play' },
  ],
  darts: [
    { day: 'Mon', time: '10 AM', activity: 'Darts', note: 'Open play' },
    { day: 'Tue', time: '10 AM', activity: 'Darts', note: 'Open play' },
    { day: 'Wed', time: '10 AM', activity: 'Darts', note: 'Open play' },
    { day: 'Thu', time: '10 AM', activity: 'Darts', note: 'Open play' },
    { day: 'Fri', time: '6 PM', activity: 'Darts', note: 'Club night' },
    { day: 'Sat', time: '12 PM', activity: 'Darts', note: 'Open play' },
    { day: 'Sun', time: '12 PM', activity: 'Darts', note: 'Open play' },
  ],
};

const activityColors: Record<string, string> = {
  Open: 'bg-stone-400',
  Cricket: 'bg-green-600',
  Futsal: 'bg-blue-600',
  Volleyball: 'bg-purple-600',
  'Table Tennis': 'bg-pink-600',
  Pool: 'bg-indigo-600',
  Darts: 'bg-yellow-600',
  League: 'bg-orange-600',
  Tournament: 'bg-red-600',
};

function getColor(activity: string) {
  return activityColors[activity] || 'bg-stone-400';
}

export function ScheduleScreen({ onBack, space }: ScheduleScreenProps) {
  const [selectedSpace, setSelectedSpace] = useState<SpaceType>(space || 'gym');
  const showAllSchedules = space === null;
  const events = scheduleEvents[selectedSpace] || [];
  const selectedSpaceData = SPACES.find(s => s.id === selectedSpace)!;

  return (
    <div className="bg-[#FFFBF5]">
      <div className="pb-4 border-b border-stone-200">
        <div className="flex items-center mb-2">
          <button onClick={onBack} className="p-2 -ml-2 rounded-lg hover:bg-stone-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-stone-700" />
          </button>
          <div className="flex-1 text-center">
            <div className="text-stone-400 text-xs">
              {showAllSchedules ? '← Home' : `← ${selectedSpaceData.name}`}
            </div>
          </div>
          <div className="w-10" />
        </div>
        <h1 className="text-xl font-bold text-stone-900">
          {showAllSchedules ? 'All Schedules' : 'Weekly Schedule'}
        </h1>
        <p className="text-stone-400 text-sm mt-1">Yogi Sports Complex · Nakuru</p>
      </div>

      <div className="py-6">
        {/* Space selector */}
        {showAllSchedules && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 overflow-x-auto">
            <div className="flex gap-2 pb-2">
              {SPACES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSpace(s.id)}
                  className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors text-sm ${
                    selectedSpace === s.id
                      ? 'bg-orange-600 text-white'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-stone-900 font-semibold text-lg mb-4">
          {selectedSpaceData.name}
        </motion.h2>

        {/* Schedule grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-stone-200 rounded-xl p-4 overflow-x-auto mb-6 shadow-sm"
        >
          <div className="min-w-[600px]">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left text-stone-400 text-xs font-medium pb-3 pr-3 sticky left-0 bg-white">Time</th>
                  {days.map(day => (
                    <th key={day} className="text-center text-stone-400 text-xs font-medium pb-3 px-2">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {times.map(time => (
                  <tr key={time} className="border-t border-stone-100">
                    <td className="text-stone-400 text-xs py-3 pr-3 font-medium sticky left-0 bg-white whitespace-nowrap">{time}</td>
                    {days.map(day => {
                      const cellEvents = events.filter(e => e.day === day && e.time === time);
                      return (
                        <td key={day} className="px-1 py-2 min-w-[70px]">
                          {cellEvents.map((event, idx) => (
                            <div
                              key={idx}
                              className={`${getColor(event.activity)} text-white text-[10px] p-1.5 rounded mb-1 text-center leading-tight`}
                            >
                              <div className="font-semibold">{event.activity}</div>
                              <div className="text-[9px] opacity-90">{event.note}</div>
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Legend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="text-stone-400 text-sm font-medium tracking-wide mb-3">ACTIVITY KEY</div>
          <div className="flex flex-wrap gap-3">
            {[...new Set(events.map(e => e.activity))].map(activity => (
              <div key={activity} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${getColor(activity)}`} />
                <span className="text-stone-500 text-xs">{activity}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
