import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, CheckCircle, Loader2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import type { SpaceType } from '../App';
import { getSpace } from '../data/spaces';

function formatHour(h: number) {
  if (h === 0) return '12:00 AM';
  if (h < 12) return `${h}:00 AM`;
  if (h === 12) return '12:00 PM';
  return `${h - 12}:00 PM`;
}

const TIME_SLOTS = Array.from({ length: 16 }, (_, i) => {
  const hour = i + 6; // 6 AM to 9 PM (last slot ends at 10 PM)
  return {
    start: `${String(hour).padStart(2, '0')}:00:00`,
    end: `${String(hour + 1).padStart(2, '0')}:00:00`,
    label: formatHour(hour),
    endLabel: formatHour(hour + 1),
  };
});

interface DbUnit {
  id: string;
  name: string;
}

interface SelectedSlot {
  start: string;
  end: string;
  label: string;
  endLabel: string;
}

interface BookingModalProps {
  space: SpaceType;
  onClose: () => void;
  onBooked: () => void;
}

export function BookingModal({ space, onClose, onBooked }: BookingModalProps) {
  const { user } = useAuth();
  const spaceData = getSpace(space);

  const [step, setStep] = useState<'select' | 'success'>('select');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [dbSpaceId, setDbSpaceId] = useState<string | null>(null);
  const [dbUnits, setDbUnits] = useState<DbUnit[]>([]);
  const [unavailableSlots, setUnavailableSlots] = useState<Set<string>>(new Set());
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const dates = Array.from({ length: 3 }, (_, i) => {
    const d = addDays(new Date(), i);
    return {
      value: format(d, 'yyyy-MM-dd'),
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : format(d, 'EEE d MMM'),
      sublabel: format(d, 'MMM d'),
    };
  });

  // Fetch space ID and units from DB on mount
  useEffect(() => {
    async function init() {
      const { data: spaceRow } = await supabase
        .from('spaces')
        .select('id')
        .eq('slug', space)
        .single();
      if (spaceRow) {
        setDbSpaceId(spaceRow.id);
        if (spaceData.units) {
          const { data: units } = await supabase
            .from('space_units')
            .select('id, name')
            .eq('space_id', spaceRow.id)
            .eq('is_active', true)
            .order('name');
          setDbUnits(units ?? []);
          if (units && units.length > 0) setSelectedUnitId(units[0].id);
        }
      }
    }
    init();
  }, [space]);

  // Fetch unavailable slots when date or unit changes
  useEffect(() => {
    if (!selectedDate || !dbSpaceId) return;
    setLoadingSlots(true);
    setSelectedSlot(null);

    async function fetchUnavailable() {
      let query = supabase
        .from('bookings')
        .select('start_time, end_time')
        .eq('date', selectedDate)
        .eq('status', 'confirmed');

      if (selectedUnitId) {
        query = query.eq('space_unit_id', selectedUnitId);
      } else {
        query = query.eq('space_id', dbSpaceId!);
      }

      const { data } = await query;
      const blocked = new Set<string>();
      (data ?? []).forEach(b => {
        TIME_SLOTS.forEach(slot => {
          if (slot.start < b.end_time && slot.end > b.start_time) {
            blocked.add(slot.start);
          }
        });
      });
      setUnavailableSlots(blocked);
      setLoadingSlots(false);
    }

    fetchUnavailable();
  }, [selectedDate, selectedUnitId, dbSpaceId]);

  async function handleConfirm() {
    if (!selectedDate || !selectedSlot || !user || !dbSpaceId) return;
    setSubmitting(true);
    setError('');

    const { error: err } = await supabase.from('bookings').insert({
      user_id: user.id,
      space_id: dbSpaceId,
      space_unit_id: selectedUnitId,
      date: selectedDate,
      start_time: selectedSlot.start,
      end_time: selectedSlot.end,
      status: 'confirmed',
    });

    if (err) {
      setError(
        err.message.includes('conflict') || err.message.includes('already taken')
          ? 'That slot was just taken — please choose another time.'
          : 'Booking failed. Please try again.'
      );
      setSubmitting(false);
    } else {
      setStep('success');
      setTimeout(onBooked, 2200);
    }
  }

  const canConfirm =
    !!selectedDate &&
    !!selectedSlot &&
    (!spaceData.units || !!selectedUnitId) &&
    !submitting;

  const selectedUnitName = dbUnits.find(u => u.id === selectedUnitId)?.name;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="relative w-full max-w-lg bg-white rounded-t-3xl md:rounded-3xl max-h-[90vh] overflow-y-auto"
      >
        {step === 'success' ? (
          <div className="p-10 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
            >
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-5" />
            </motion.div>
            <h2 className="text-2xl font-bold text-stone-900 mb-2">Booking Confirmed!</h2>
            <p className="text-stone-500 text-sm leading-relaxed">
              {spaceData.name}
              {selectedUnitName ? ` · ${selectedUnitName}` : ''}
              {' · '}
              {format(new Date(selectedDate), 'EEE, MMM d')}
              {' · '}
              {selectedSlot?.label} – {selectedSlot?.endLabel}
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-stone-100 sticky top-0 bg-white rounded-t-3xl md:rounded-t-3xl">
              <div>
                <h2 className="text-lg font-bold text-stone-900">Book {spaceData.name}</h2>
                <p className="text-xs text-stone-400 mt-0.5">1-hour slots · up to 2 days ahead</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-stone-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-stone-500" />
              </button>
            </div>

            <div className="p-5 space-y-6 pb-8">
              {/* Unit selector */}
              {spaceData.units && dbUnits.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-stone-700 mb-3">Select Table</p>
                  <div className="grid grid-cols-2 gap-2">
                    {dbUnits.map(unit => (
                      <button
                        key={unit.id}
                        onClick={() => setSelectedUnitId(unit.id)}
                        className={`py-3 px-4 rounded-xl border-2 font-medium text-sm transition-colors ${
                          selectedUnitId === unit.id
                            ? 'border-orange-600 bg-orange-50 text-orange-700'
                            : 'border-stone-200 text-stone-700 hover:border-stone-300'
                        }`}
                      >
                        {unit.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Date selector */}
              <div>
                <p className="text-sm font-semibold text-stone-700 mb-3">Select Date</p>
                <div className="grid grid-cols-3 gap-2">
                  {dates.map(d => (
                    <button
                      key={d.value}
                      onClick={() => setSelectedDate(d.value)}
                      className={`py-3 px-2 rounded-xl border-2 transition-colors text-center ${
                        selectedDate === d.value
                          ? 'border-orange-600 bg-orange-50 text-orange-700'
                          : 'border-stone-200 text-stone-700 hover:border-stone-300'
                      }`}
                    >
                      <div className="font-semibold text-sm">{d.label}</div>
                      <div className="text-xs text-stone-400 mt-0.5">{d.sublabel}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time slot grid */}
              {selectedDate && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-stone-700">Select Time</p>
                    {loadingSlots && (
                      <Loader2 className="w-4 h-4 text-orange-600 animate-spin" />
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {TIME_SLOTS.map(slot => {
                      const taken = unavailableSlots.has(slot.start);
                      const selected = selectedSlot?.start === slot.start;
                      return (
                        <button
                          key={slot.start}
                          onClick={() => !taken && setSelectedSlot(slot)}
                          disabled={taken || loadingSlots}
                          className={`py-2.5 px-1 rounded-xl border-2 text-xs font-medium transition-colors ${
                            taken
                              ? 'border-stone-100 bg-stone-50 text-stone-300 cursor-not-allowed line-through'
                              : selected
                              ? 'border-orange-600 bg-orange-600 text-white'
                              : 'border-stone-200 text-stone-700 hover:border-orange-300 hover:bg-orange-50'
                          }`}
                        >
                          {slot.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-stone-400 mt-2">Strikethrough = already booked</p>
                </div>
              )}

              {error && (
                <p className="text-red-600 text-sm bg-red-50 border border-red-100 px-4 py-3 rounded-xl">
                  {error}
                </p>
              )}

              <button
                onClick={handleConfirm}
                disabled={!canConfirm}
                className="w-full bg-orange-600 text-white font-semibold py-3.5 rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Confirming…' : 'Confirm Booking'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
