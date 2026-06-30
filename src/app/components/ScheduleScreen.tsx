import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import type { SpaceType } from '../App';

interface ScheduleScreenProps {
  onBack: () => void;
  space: SpaceType | null;
}

export function ScheduleScreen({ onBack, space }: ScheduleScreenProps) {
  const [selectedSpace, setSelectedSpace] = useState<SpaceType>(space || 'multipurpose-courts');

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const times = ['8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM'];

  const scheduleData = {
    'multipurpose-courts': {
      title: 'Multipurpose Courts',
      events: [
        { day: 'Mon', time: '8 AM', activity: 'Open Play', court: 'All Courts' },
        { day: 'Mon', time: '6 PM', activity: 'Volleyball Club', court: 'Court 2' },
        { day: 'Tue', time: '8 AM', activity: 'Basketball', court: 'Court 1' },
        { day: 'Tue', time: '2 PM', activity: 'Pickleball', court: 'Court 3' },
        { day: 'Wed', time: '10 AM', activity: 'Badminton', court: 'Court 2' },
        { day: 'Wed', time: '6 PM', activity: 'Volleyball Club', court: 'Court 2' },
        { day: 'Thu', time: '8 AM', activity: 'Open Play', court: 'All Courts' },
        { day: 'Thu', time: '2 PM', activity: 'Pickleball', court: 'Court 3' },
        { day: 'Fri', time: '8 AM', activity: 'Basketball', court: 'Courts 1-2' },
        { day: 'Fri', time: '4 PM', activity: 'Open Play', court: 'All Courts' },
        { day: 'Sat', time: '10 AM', activity: 'Basketball Tournament', court: 'All Courts' },
        { day: 'Sat', time: '4 PM', activity: 'Open Play', court: 'All Courts' },
        { day: 'Sun', time: '12 PM', activity: 'Open Play', court: 'All Courts' }
      ],
      upcoming: [
        { day: 'Monday', time: '6:00 PM', activity: 'Volleyball Club', location: 'Court 2', spots: '12 spots available' },
        { day: 'Tuesday', time: '2:00 PM', activity: 'Pickleball', location: 'Court 3', spots: 'Walk-in welcome' },
        { day: 'Wednesday', time: '6:00 PM', activity: 'Volleyball Club', location: 'Court 2', spots: '8 spots available' },
        { day: 'Thursday', time: '2:00 PM', activity: 'Pickleball', location: 'Court 3', spots: 'Walk-in welcome' },
        { day: 'Saturday', time: '10:00 AM', activity: 'Basketball Tournament', location: 'All Courts', spots: 'Registration required' }
      ]
    },
    'pool-tables': {
      title: 'Pool Tables',
      events: [
        { day: 'Mon', time: '10 AM', activity: 'Open Play', court: 'All Tables' },
        { day: 'Tue', time: '10 AM', activity: 'Open Play', court: 'All Tables' },
        { day: 'Wed', time: '10 AM', activity: 'Open Play', court: 'All Tables' },
        { day: 'Wed', time: '6 PM', activity: 'Pool League', court: 'Tables 1-2' },
        { day: 'Thu', time: '10 AM', activity: 'Open Play', court: 'All Tables' },
        { day: 'Fri', time: '10 AM', activity: 'Open Play', court: 'All Tables' },
        { day: 'Sat', time: '12 PM', activity: 'Open Play', court: 'All Tables' },
        { day: 'Sun', time: '12 PM', activity: 'Open Play', court: 'All Tables' }
      ],
      upcoming: [
        { day: 'Wednesday', time: '6:00 PM', activity: 'Pool League', location: 'Tables 1-2', spots: 'Members only' },
        { day: 'Daily', time: '10:00 AM - 10:00 PM', activity: 'Open Play', location: 'All tables', spots: 'First come, first served' }
      ]
    },
    'table-tennis': {
      title: 'Table Tennis',
      events: [
        { day: 'Mon', time: '8 AM', activity: 'Open Play', court: 'All Tables' },
        { day: 'Mon', time: '6 PM', activity: 'TT Club', court: 'All Tables' },
        { day: 'Tue', time: '8 AM', activity: 'Open Play', court: 'All Tables' },
        { day: 'Wed', time: '8 AM', activity: 'Open Play', court: 'All Tables' },
        { day: 'Wed', time: '6 PM', activity: 'TT Club', court: 'All Tables' },
        { day: 'Thu', time: '8 AM', activity: 'Open Play', court: 'All Tables' },
        { day: 'Fri', time: '8 AM', activity: 'Open Play', court: 'All Tables' },
        { day: 'Fri', time: '6 PM', activity: 'TT Tournament', court: 'All Tables' },
        { day: 'Sat', time: '10 AM', activity: 'Open Play', court: 'All Tables' },
        { day: 'Sun', time: '10 AM', activity: 'Open Play', court: 'All Tables' }
      ],
      upcoming: [
        { day: 'Monday', time: '6:00 PM', activity: 'Table Tennis Club', location: 'All tables', spots: '15 spots available' },
        { day: 'Wednesday', time: '6:00 PM', activity: 'Table Tennis Club', location: 'All tables', spots: '15 spots available' },
        { day: 'Friday', time: '6:00 PM', activity: 'TT Tournament', location: 'All tables', spots: 'Registration required' }
      ]
    },
    'squash-courts': {
      title: 'Squash Courts',
      events: [
        { day: 'Mon', time: '8 AM', activity: 'Open Play', court: 'All Courts' },
        { day: 'Mon', time: '6 PM', activity: 'Squash Club', court: 'Courts 1-2' },
        { day: 'Tue', time: '8 AM', activity: 'Open Play', court: 'All Courts' },
        { day: 'Wed', time: '8 AM', activity: 'Open Play', court: 'All Courts' },
        { day: 'Wed', time: '6 PM', activity: 'Squash Club', court: 'Courts 1-2' },
        { day: 'Thu', time: '8 AM', activity: 'Open Play', court: 'All Courts' },
        { day: 'Fri', time: '8 AM', activity: 'Open Play', court: 'All Courts' },
        { day: 'Fri', time: '6 PM', activity: 'Squash Club', court: 'Courts 1-2' },
        { day: 'Sat', time: '10 AM', activity: 'Open Play', court: 'All Courts' },
        { day: 'Sun', time: '10 AM', activity: 'Open Play', court: 'All Courts' }
      ],
      upcoming: [
        { day: 'Monday', time: '6:00 PM', activity: 'Squash Club', location: 'Courts 1-2', spots: '8 spots available' },
        { day: 'Wednesday', time: '6:00 PM', activity: 'Squash Club', location: 'Courts 1-2', spots: '8 spots available' },
        { day: 'Friday', time: '6:00 PM', activity: 'Squash Club', location: 'Courts 1-2', spots: '8 spots available' }
      ]
    }
  };

  const currentSchedule = scheduleData[selectedSpace];

  const getActivityColor = (activity: string) => {
    if (activity.includes('Volleyball')) return 'bg-purple-600';
    if (activity.includes('Basketball')) return 'bg-orange-600';
    if (activity.includes('Pickleball')) return 'bg-green-600';
    if (activity.includes('Badminton')) return 'bg-yellow-600';
    if (activity.includes('Squash')) return 'bg-red-600';
    if (activity.includes('TT') || activity.includes('Table Tennis')) return 'bg-pink-600';
    if (activity.includes('Pool')) return 'bg-indigo-600';
    if (activity.includes('Tournament')) return 'bg-red-600';
    if (activity.includes('Club') || activity.includes('League')) return 'bg-blue-600';
    return 'bg-gray-600';
  };

  // If accessed from bottom nav (space is null), show all schedules
  const showAllSchedules = space === null;

  return (
    <div className="bg-[#2d2d2d]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-700">
        <div className="flex items-center mb-2">
          <button onClick={onBack} className="p-2 -ml-2 rounded-lg hover:bg-gray-700 transition-colors">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div className="flex-1 text-center">
            <div className="text-gray-400 text-xs">
              {showAllSchedules ? '← Home' : `← ${currentSchedule.title}`}
            </div>
          </div>
          <div className="w-10" />
        </div>
        <h1 className="text-xl font-bold text-white">
          {showAllSchedules ? 'All Schedules' : 'Weekly Schedule'}
        </h1>
        <p className="text-gray-400 text-sm mt-1">April 21-27, 2026</p>
      </div>

      <div className="px-6 py-6">
        {/* Space Selector Tabs (only show when viewing all schedules) */}
        {showAllSchedules && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 overflow-x-auto"
          >
            <div className="flex gap-2 pb-2">
              <button
                onClick={() => setSelectedSpace('multipurpose-courts')}
                className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
                  selectedSpace === 'multipurpose-courts'
                    ? 'bg-white text-black'
                    : 'bg-[#3d3d3d] text-white hover:bg-[#4d4d4d]'
                }`}
              >
                Multipurpose
              </button>
              <button
                onClick={() => setSelectedSpace('pool-tables')}
                className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
                  selectedSpace === 'pool-tables'
                    ? 'bg-white text-black'
                    : 'bg-[#3d3d3d] text-white hover:bg-[#4d4d4d]'
                }`}
              >
                Pool Tables
              </button>
              <button
                onClick={() => setSelectedSpace('table-tennis')}
                className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
                  selectedSpace === 'table-tennis'
                    ? 'bg-white text-black'
                    : 'bg-[#3d3d3d] text-white hover:bg-[#4d4d4d]'
                }`}
              >
                Table Tennis
              </button>
              <button
                onClick={() => setSelectedSpace('squash-courts')}
                className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
                  selectedSpace === 'squash-courts'
                    ? 'bg-white text-black'
                    : 'bg-[#3d3d3d] text-white hover:bg-[#4d4d4d]'
                }`}
              >
                Squash Courts
              </button>
            </div>
          </motion.div>
        )}

        {/* Current Space Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <h2 className="text-white font-semibold text-lg">{currentSchedule.title}</h2>
        </motion.div>

        {/* Schedule Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#3d3d3d] rounded-xl p-4 overflow-x-auto mb-6"
        >
          <div className="min-w-[600px]">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left text-gray-400 text-xs font-medium pb-3 pr-3 sticky left-0 bg-[#3d3d3d]">Time</th>
                  {days.map(day => (
                    <th key={day} className="text-center text-gray-400 text-xs font-medium pb-3 px-2">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {times.map((time, timeIndex) => (
                  <tr key={time} className="border-t border-gray-700">
                    <td className="text-gray-400 text-xs py-3 pr-3 font-medium sticky left-0 bg-[#3d3d3d]">{time}</td>
                    {days.map((day) => {
                      const events = currentSchedule.events.filter(e => e.day === day && e.time === time);
                      return (
                        <td key={day} className="px-1 py-2">
                          {events.map((event, idx) => (
                            <div
                              key={idx}
                              className={`${getActivityColor(event.activity)} text-white text-[10px] p-1.5 rounded mb-1 text-center leading-tight`}
                            >
                              <div className="font-semibold">{event.activity}</div>
                              <div className="text-[9px] opacity-90">{event.court}</div>
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="text-gray-400 text-sm font-medium mb-3">ACTIVITY KEY</div>
          <div className="flex flex-wrap gap-2">
            {selectedSpace === 'multipurpose-courts' && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-purple-600"></div>
                  <span className="text-gray-400 text-xs">Volleyball</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-orange-600"></div>
                  <span className="text-gray-400 text-xs">Basketball</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-600"></div>
                  <span className="text-gray-400 text-xs">Pickleball</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-yellow-600"></div>
                  <span className="text-gray-400 text-xs">Badminton</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-gray-600"></div>
                  <span className="text-gray-400 text-xs">Open Play</span>
                </div>
              </>
            )}
            {selectedSpace === 'squash-courts' && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-600"></div>
                  <span className="text-gray-400 text-xs">Squash Club</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-gray-600"></div>
                  <span className="text-gray-400 text-xs">Open Play</span>
                </div>
              </>
            )}
            {selectedSpace === 'table-tennis' && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-600"></div>
                  <span className="text-gray-400 text-xs">TT Club</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-600"></div>
                  <span className="text-gray-400 text-xs">Tournament</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-gray-600"></div>
                  <span className="text-gray-400 text-xs">Open Play</span>
                </div>
              </>
            )}
            {selectedSpace === 'pool-tables' && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-600"></div>
                  <span className="text-gray-400 text-xs">Pool League</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-gray-600"></div>
                  <span className="text-gray-400 text-xs">Open Play</span>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Upcoming Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-gray-400 text-sm font-medium mb-3">UPCOMING THIS WEEK</div>
          <div className="space-y-2">
            {currentSchedule.upcoming.map((event, index) => (
              <div key={index} className="bg-[#3d3d3d] p-4 rounded-xl">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-1">{event.activity}</h3>
                    <p className="text-gray-400 text-sm mb-1">{event.day} at {event.time}</p>
                    <p className="text-gray-500 text-xs">{event.location} • {event.spots}</p>
                  </div>
                  <div className={`${getActivityColor(event.activity)} text-white px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ml-2`}>
                    Scheduled
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
