import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import type { SpaceType } from '../App';

interface SpaceDetailScreenProps {
  space: SpaceType;
  onBack: () => void;
  onScheduleClick: () => void;
  onAlertClick: () => void;
}

export function SpaceDetailScreen({ space, onBack, onScheduleClick, onAlertClick }: SpaceDetailScreenProps) {
  const spaceData = getSpaceData(space);

  return (
    <div className="bg-[#FFFBF5]">
      {/* Header */}
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
        <h1 className="text-2xl font-bold text-stone-900">{spaceData.title}</h1>
      </div>

      <div className="py-6">
        {/* Updated timestamp */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <p className="text-stone-400 text-sm">
            Updated: {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </p>
        </motion.div>

        {/* Stats */}
        {space === 'pool-tables' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 gap-4 mb-6"
          >
            <div className="bg-white border border-stone-200 p-4 rounded-xl text-center shadow-sm">
              <div className="text-4xl font-bold text-orange-600 mb-1">2</div>
              <div className="text-stone-500 text-sm">Available now</div>
            </div>
            <div className="bg-white border border-stone-200 p-4 rounded-xl text-center shadow-sm">
              <div className="text-4xl font-bold text-stone-900 mb-1">4</div>
              <div className="text-stone-500 text-sm">Total tables</div>
            </div>
          </motion.div>
        )}

        {/* Table Availability */}
        {space === 'pool-tables' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <div className="text-stone-400 text-sm font-medium tracking-wide mb-3">TABLE AVAILABILITY</div>
            <div className="space-y-2">
              <TableItem number={1} status="open" />
              <TableItem number={2} status="open" />
              <TableItem number={3} status="in-use" />
              <TableItem number={4} status="in-use" />
            </div>
          </motion.div>
        )}

        {/* Multipurpose Courts */}
        {space === 'multipurpose-courts' && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <div className="text-stone-400 text-sm font-medium tracking-wide mb-3">RIGHT NOW</div>
              <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-stone-900 font-semibold mb-1">Court 3 — Pickleball</h3>
                    <p className="text-stone-500 text-sm">until 6:00 PM</p>
                  </div>
                  <div className="bg-orange-600 text-white px-3 py-1.5 rounded-full text-sm font-medium">
                    Active
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <div className="text-stone-400 text-sm font-medium tracking-wide mb-3">LATER TODAY</div>
              <div className="space-y-2">
                <CourtActivity court="Court 2" activity="Volleyball Club" time="6:00-7:00 PM" status="Up next" />
                <CourtActivity court="Court 1" activity="Open play" time="Open all day" status="Open" />
              </div>
            </motion.div>
          </>
        )}

        {/* Other spaces */}
        {(space === 'table-tennis' || space === 'squash-courts') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <div className="text-stone-400 text-sm font-medium tracking-wide mb-3">STATUS</div>
            <div className="space-y-2">
              {space === 'table-tennis' && (
                <>
                  <TableItem number={1} status="in-use" label="Table" />
                  <TableItem number={2} status="in-use" label="Table" />
                  <TableItem number={3} status="in-use" label="Table" />
                </>
              )}
              {space === 'squash-courts' && (
                <>
                  <TableItem number={1} status="in-use" label="Court" />
                  <TableItem number={2} status="in-use" label="Court" />
                  <TableItem number={3} status="open" label="Court" />
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <button
            onClick={onScheduleClick}
            className="w-full bg-orange-600 text-white font-semibold py-3.5 px-4 rounded-xl hover:bg-orange-700 transition-colors"
          >
            Weekly schedule
          </button>

          <button
            onClick={onAlertClick}
            className="w-full bg-stone-100 text-stone-800 font-semibold py-3.5 px-4 rounded-xl hover:bg-stone-200 transition-colors"
          >
            Set alert — notify when open
          </button>
        </motion.div>
      </div>
    </div>
  );
}

function getSpaceData(space: SpaceType) {
  const data = {
    'pool-tables': { title: 'Pool Tables' },
    'table-tennis': { title: 'Table Tennis' },
    'squash-courts': { title: 'Squash Courts' },
    'multipurpose-courts': { title: 'Multipurpose Courts' }
  };
  return data[space];
}

interface TableItemProps {
  number: number;
  status: 'open' | 'in-use';
  label?: string;
}

function TableItem({ number, status, label = 'Table' }: TableItemProps) {
  return (
    <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-stone-900 font-semibold">{label} {number}</h3>
        <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${
          status === 'open' ? 'bg-green-600 text-white' : 'bg-stone-200 text-stone-700'
        }`}>
          {status === 'open' ? 'Open' : 'In use'}
        </div>
      </div>
    </div>
  );
}

interface CourtActivityProps {
  court: string;
  activity: string;
  time: string;
  status: string;
}

function CourtActivity({ court, activity, time, status }: CourtActivityProps) {
  return (
    <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-stone-900 font-semibold mb-1">{court} — {activity}</h3>
          <p className="text-stone-500 text-sm">{time}</p>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${
          status === 'Open' ? 'bg-green-600 text-white' : 'bg-stone-200 text-stone-700'
        }`}>
          {status}
        </div>
      </div>
    </div>
  );
}
