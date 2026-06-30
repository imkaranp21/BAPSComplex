import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface AlertsScreenProps {
  onBack: () => void;
  onSave: () => void;
}

export function AlertsScreen({ onBack, onSave }: AlertsScreenProps) {
  const [alerts, setAlerts] = useState({
    volleyball: true,
    pickleball: false,
    basketball: false,
    badminton: false,
    squash: false,
    tableTennis: false,
    pool: false,
    availability: true
  });

  const toggleAlert = (key: keyof typeof alerts) => {
    setAlerts(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    const enabledAlerts = Object.entries(alerts)
      .filter(([_, enabled]) => enabled)
      .map(([key]) => key);

    toast.success('Alert preferences saved!', {
      description: `${enabledAlerts.length} ${enabledAlerts.length === 1 ? 'alert' : 'alerts'} enabled`,
      duration: 2000,
    });

    setTimeout(() => {
      onSave();
    }, 500);
  };

  return (
    <div className="bg-[#2d2d2d]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-700">
        <div className="flex items-center mb-2">
          <button onClick={onBack} className="p-2 -ml-2 rounded-lg hover:bg-gray-700 transition-colors">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div className="flex-1 text-center">
            <div className="text-gray-400 text-xs">← Home</div>
          </div>
          <div className="w-10" />
        </div>
        <h1 className="text-2xl font-bold text-white">Alerts</h1>
      </div>

      <div className="px-6 py-6">
        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-gray-400 text-sm mb-6"
        >
          Get notified when spaces become available or activities start
        </motion.p>

        {/* Activity Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3 mb-6"
        >
          <div className="text-gray-400 text-sm font-medium mb-3">MULTIPURPOSE COURTS</div>

          <AlertToggle
            label="Volleyball Club"
            description="Notify when sessions start"
            enabled={alerts.volleyball}
            onToggle={() => toggleAlert('volleyball')}
          />

          <AlertToggle
            label="Pickleball"
            description="Notify when courts are available"
            enabled={alerts.pickleball}
            onToggle={() => toggleAlert('pickleball')}
          />

          <AlertToggle
            label="Basketball"
            description="Notify when courts are open"
            enabled={alerts.basketball}
            onToggle={() => toggleAlert('basketball')}
          />

          <AlertToggle
            label="Badminton"
            description="Notify when courts are available"
            enabled={alerts.badminton}
            onToggle={() => toggleAlert('badminton')}
          />
        </motion.div>

        {/* Other Activity Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3 mb-6"
        >
          <div className="text-gray-400 text-sm font-medium mb-3">OTHER ACTIVITIES</div>

          <AlertToggle
            label="Squash Courts"
            description="Notify when courts open up"
            enabled={alerts.squash}
            onToggle={() => toggleAlert('squash')}
          />

          <AlertToggle
            label="Table Tennis"
            description="Notify when tables are free"
            enabled={alerts.tableTennis}
            onToggle={() => toggleAlert('tableTennis')}
          />

          <AlertToggle
            label="Pool Tables"
            description="Notify when tables are available"
            enabled={alerts.pool}
            onToggle={() => toggleAlert('pool')}
          />
        </motion.div>

        {/* General Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <div className="text-gray-400 text-sm font-medium mb-3">GENERAL ALERTS</div>

          <AlertToggle
            label="Space availability"
            description="Get notified when any space opens up"
            enabled={alerts.availability}
            onToggle={() => toggleAlert('availability')}
          />
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <button
            onClick={handleSave}
            className="w-full bg-white text-black font-semibold py-3.5 px-4 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Save preferences
          </button>
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 bg-[#3d3d3d] p-4 rounded-xl"
        >
          <p className="text-gray-400 text-sm">
            💡 <span className="text-white font-medium">Tip:</span> Enable notifications in your device settings to receive real-time alerts.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

interface AlertToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}

function AlertToggle({ label, description, enabled, onToggle }: AlertToggleProps) {
  return (
    <div className="bg-[#3d3d3d] p-4 rounded-xl">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-white font-semibold mb-1">{label}</h3>
          <p className="text-gray-400 text-sm">{description}</p>
        </div>
        <button
          onClick={onToggle}
          className={`relative w-12 h-7 rounded-full transition-colors ${
            enabled ? 'bg-blue-600' : 'bg-gray-600'
          }`}
        >
          <motion.div
            animate={{ x: enabled ? 20 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-1 w-5 h-5 bg-white rounded-full"
          />
        </button>
      </div>
    </div>
  );
}
