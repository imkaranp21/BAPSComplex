import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface AlertsScreenProps {
  onBack: () => void;
  onSave: () => void;
}

const ALERT_GROUPS = [
  {
    label: 'COURTS & FIELDS',
    alerts: [
      { key: 'cricket', label: 'Cricket / Futsal', description: 'Notify when the court is available' },
      { key: 'volleyball', label: 'Volleyball', description: 'Notify when the court opens up' },
    ],
  },
  {
    label: 'GAMES',
    alerts: [
      { key: 'tableTennis', label: 'Table Tennis', description: 'Notify when a table is free' },
      { key: 'pool', label: 'Pool Table', description: 'Notify when the table is available' },
      { key: 'darts', label: 'Darts', description: 'Notify when the darts area is open' },
    ],
  },
  {
    label: 'FITNESS',
    alerts: [
      { key: 'gym', label: 'Gym', description: 'Notify when capacity drops below 80%' },
    ],
  },
  {
    label: 'GENERAL',
    alerts: [
      { key: 'availability', label: 'Any space opens up', description: 'Get notified when any space becomes available' },
    ],
  },
];

type AlertKey = 'cricket' | 'volleyball' | 'tableTennis' | 'pool' | 'darts' | 'gym' | 'availability';

export function AlertsScreen({ onBack, onSave }: AlertsScreenProps) {
  const [alerts, setAlerts] = useState<Record<AlertKey, boolean>>({
    cricket: false,
    volleyball: false,
    tableTennis: false,
    pool: false,
    darts: false,
    gym: true,
    availability: true,
  });

  const toggleAlert = (key: AlertKey) => {
    setAlerts(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    const count = Object.values(alerts).filter(Boolean).length;
    toast.success('Alert preferences saved!', {
      description: `${count} ${count === 1 ? 'alert' : 'alerts'} enabled`,
      duration: 2000,
    });
    setTimeout(() => { onSave(); }, 500);
  };

  return (
    <div className="bg-[#FFFBF5]">
      <div className="pb-4 border-b border-stone-200">
        <div className="flex items-center mb-2">
          <button onClick={onBack} className="p-2 -ml-2 rounded-lg hover:bg-stone-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-stone-700" />
          </button>
          <div className="flex-1 text-center">
            <div className="text-stone-400 text-xs">← Home</div>
          </div>
          <div className="w-10" />
        </div>
        <h1 className="text-2xl font-bold text-stone-900">Alerts</h1>
      </div>

      <div className="py-6">
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-stone-500 text-sm mb-6">
          Get notified when spaces become available
        </motion.p>

        {ALERT_GROUPS.map((group, gi) => (
          <motion.div
            key={group.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.1 }}
            className="mb-6"
          >
            <div className="text-stone-400 text-sm font-medium tracking-wide mb-3">{group.label}</div>
            <div className="space-y-3">
              {group.alerts.map(alert => (
                <AlertToggle
                  key={alert.key}
                  label={alert.label}
                  description={alert.description}
                  enabled={alerts[alert.key as AlertKey]}
                  onToggle={() => toggleAlert(alert.key as AlertKey)}
                />
              ))}
            </div>
          </motion.div>
        ))}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-4">
          <button
            onClick={handleSave}
            className="w-full bg-orange-600 text-white font-semibold py-3.5 px-4 rounded-xl hover:bg-orange-700 transition-colors"
          >
            Save preferences
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 bg-orange-50 border border-orange-200 p-4 rounded-xl"
        >
          <p className="text-stone-600 text-sm">
            💡 <span className="text-stone-900 font-medium">Tip:</span> Enable notifications in your device settings to receive real-time alerts.
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
    <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-stone-900 font-semibold mb-1">{label}</h3>
          <p className="text-stone-500 text-sm">{description}</p>
        </div>
        <button
          onClick={onToggle}
          className={`relative w-12 h-7 rounded-full transition-colors ml-4 flex-shrink-0 ${
            enabled ? 'bg-orange-600' : 'bg-stone-300'
          }`}
        >
          <motion.div
            animate={{ x: enabled ? 20 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm"
          />
        </button>
      </div>
    </div>
  );
}
