import { motion } from 'motion/react';
import { ArrowLeft, Bell, BellOff, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface AlertsScreenProps {
  onBack: () => void;
  onSave: () => void;
}

const PREFS_KEY = 'yogi_alert_prefs';

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

const DEFAULT_PREFS: Record<AlertKey, boolean> = {
  cricket: false, volleyball: false, tableTennis: false,
  pool: false, darts: false, gym: true, availability: true,
};

export function AlertsScreen({ onBack, onSave }: AlertsScreenProps) {
  const [alerts, setAlerts] = useState<Record<AlertKey, boolean>>(() => {
    try {
      const saved = localStorage.getItem(PREFS_KEY);
      return saved ? { ...DEFAULT_PREFS, ...JSON.parse(saved) } : DEFAULT_PREFS;
    } catch { return DEFAULT_PREFS; }
  });

  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (typeof Notification !== 'undefined') setPermission(Notification.permission);
  }, []);

  const toggleAlert = (key: AlertKey) => {
    setAlerts(prev => ({ ...prev, [key]: !prev[key] }));
  };

  async function requestPermission() {
    if (typeof Notification === 'undefined') return;
    setRequesting(true);
    const result = await Notification.requestPermission();
    setPermission(result);
    setRequesting(false);
    if (result === 'granted') {
      new Notification('Yogi Sports Complex', {
        body: 'Notifications enabled! You\'ll be alerted when spaces become available.',
        icon: '/icon-192.png',
      });
    }
  }

  const handleSave = () => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(alerts));
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

        {/* Notification permission banner */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          {permission === 'granted' ? (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 p-4 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
              <div>
                <p className="text-green-800 font-semibold text-sm">Notifications enabled</p>
                <p className="text-green-600 text-xs mt-0.5">You'll be alerted when your selected spaces open up.</p>
              </div>
            </div>
          ) : permission === 'denied' ? (
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <BellOff className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-red-800 font-semibold text-sm">Notifications are blocked</p>
              </div>
              <p className="text-red-700 text-xs font-medium mb-2">To unblock, follow these steps:</p>
              {/android/i.test(navigator.userAgent) ? (
                <ol className="text-red-600 text-xs space-y-1 list-decimal list-inside">
                  <li>Open your phone's <strong>Settings</strong></li>
                  <li>Go to <strong>Apps</strong> → find this app</li>
                  <li>Tap <strong>Permissions</strong> → <strong>Notifications</strong> → Allow</li>
                  <li>Come back and refresh</li>
                </ol>
              ) : /iphone|ipad|ipod/i.test(navigator.userAgent) ? (
                <ol className="text-red-600 text-xs space-y-1 list-decimal list-inside">
                  <li>Open iPhone <strong>Settings</strong></li>
                  <li>Scroll down and find this app</li>
                  <li>Tap <strong>Notifications</strong> → turn on <strong>Allow Notifications</strong></li>
                  <li>Come back and refresh</li>
                </ol>
              ) : (
                <ol className="text-red-600 text-xs space-y-1 list-decimal list-inside">
                  <li>Click the <strong>lock icon</strong> in the browser address bar</li>
                  <li>Click <strong>Site settings</strong></li>
                  <li>Find <strong>Notifications</strong> → change to <strong>Allow</strong></li>
                  <li>Refresh the page</li>
                </ol>
              )}
            </div>
          ) : (
            <button
              onClick={requestPermission}
              disabled={requesting}
              className="w-full flex items-center justify-center gap-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-semibold py-3.5 px-4 rounded-xl transition-colors"
            >
              <Bell className="w-4 h-4" />
              {requesting ? 'Requesting…' : 'Enable Notifications'}
            </button>
          )}
        </motion.div>

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
                  disabled={permission !== 'granted'}
                  onToggle={() => toggleAlert(alert.key as AlertKey)}
                />
              ))}
            </div>
          </motion.div>
        ))}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-4">
          <button
            onClick={handleSave}
            disabled={permission !== 'granted'}
            className="w-full bg-orange-600 text-white font-semibold py-3.5 px-4 rounded-xl hover:bg-orange-700 disabled:opacity-40 transition-colors"
          >
            Save preferences
          </button>
        </motion.div>
      </div>
    </div>
  );
}

interface AlertToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

function AlertToggle({ label, description, enabled, disabled, onToggle }: AlertToggleProps) {
  return (
    <div className={`bg-white border border-stone-200 p-4 rounded-xl shadow-sm transition-opacity ${disabled ? 'opacity-40' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-stone-900 font-semibold mb-1">{label}</h3>
          <p className="text-stone-500 text-sm">{description}</p>
        </div>
        <button
          onClick={onToggle}
          disabled={disabled}
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
