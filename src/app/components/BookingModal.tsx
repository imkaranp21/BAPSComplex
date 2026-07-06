import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, CheckCircle, Loader2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import type { SpaceType } from '../App';
import { getSpace, SPACE_CONFLICTS } from '../data/spaces';

function formatHour(h: number) {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

const TIME_SLOTS = Array.from({ length: 16 }, (_, i) => {
  const hour = i + 6;
  return {
    start: `${String(hour).padStart(2, '0')}:00:00`,
    end: `${String(hour + 1).padStart(2, '0')}:00:00`,
    label: formatHour(hour),
    endLabel: formatHour(hour + 1),
  };
});

interface DbUnit { id: string; name: string }
interface SelectedSlot { start: string; end: string; label: string; endLabel: string }

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
  const [myBookedSlots, setMyBookedSlots] = useState<Set<string>>(new Set());
  const [closedSlots, setClosedSlots] = useState<Set<string>>(new Set());
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

  useEffect(() => {
    async function init() {
      const { data: spaceRow } = await supabase
        .from('spaces').select('id').eq('slug', space).single();
      if (spaceRow) {
        setDbSpaceId(spaceRow.id);
        if (spaceData.units) {
          const { data: units } = await supabase
            .from('space_units').select('id, name')
            .eq('space_id', spaceRow.id).eq('is_active', true).order('name');
          setDbUnits(units ?? []);
          if (units && units.length > 0) setSelectedUnitId(units[0].id);
        }
      }
    }
    init();
  }, [space]);

  useEffect(() => {
    if (!selectedDate || !dbSpaceId) return;
    setLoadingSlots(true);
    setSelectedSlot(null);

    async function fetchUnavailable() {
      const conflictSlugs = SPACE_CONFLICTS[space] ?? [];
      const allSlugs = [space, ...conflictSlugs];

      const [blockedRes, myRes, closuresRes] = await Promise.all([
        (supabase as any).rpc('get_blocked_slots', { p_space_slugs: allSlugs, p_date: selectedDate }),
        supabase.from('bookings').select('start_time, end_time')
          .eq('date', selectedDate).eq('status', 'confirmed').eq('user_id', user!.id),
        (supabase as any).from('space_closures').select('all_day, start_time, end_time')
          .eq('space_id', dbSpaceId!).eq('date', selectedDate),
      ]);

      const blocked = new Set<string>();
      (blockedRes.data ?? []).forEach((b: any) => {
        TIME_SLOTS.forEach(slot => { if (slot.start < b.end_time && slot.end > b.start_time) blocked.add(slot.start); });
      });
      setUnavailableSlots(blocked);

      const mine = new Set<string>();
      (myRes.data ?? []).forEach((b: any) => {
        TIME_SLOTS.forEach(slot => { if (slot.start < b.end_time && slot.end > b.start_time) mine.add(slot.start); });
      });
      setMyBookedSlots(mine);

      const closed = new Set<string>();
      (closuresRes.data ?? []).forEach((c: any) => {
        TIME_SLOTS.forEach(slot => { if (c.all_day || (slot.start < c.end_time && slot.end > c.start_time)) closed.add(slot.start); });
      });
      setClosedSlots(closed);
      setLoadingSlots(false);
    }

    fetchUnavailable();
  }, [selectedDate, selectedUnitId, dbSpaceId, space]);

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
        err.message.includes('already have a booking')
          ? 'You already have a booking during this time slot.'
          : err.message.includes('shared court') || err.message.includes('conflict') || err.message.includes('already taken')
          ? 'That slot is blocked — a conflicting space is already booked at this time.'
          : 'Booking failed. Please try again.'
      );
      setSubmitting(false);
    } else {
      setStep('success');
      setTimeout(onBooked, 2200);
    }
  }

  const canConfirm = !!selectedDate && !!selectedSlot && (!spaceData.units || !!selectedUnitId) && !submitting;
  const selectedUnitName = dbUnits.find(u => u.id === selectedUnitId)?.name;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-t-3xl md:rounded-3xl max-h-[92vh] overflow-y-auto"
      >
        {step === 'success' ? (
          <div className="p-12 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}>
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-5" />
            </motion.div>
            <h2 className="text-2xl font-black text-white tracking-tight mb-2">Booking Confirmed</h2>
            <p className="text-zinc-500 text-sm leading-relaxed">
              {spaceData.name}
              {selectedUnitName ? ` · ${selectedUnitName}` : ''}
              {' · '}{format(new Date(selectedDate), 'EEE, MMM d')}
              {' · '}{selectedSlot?.label} – {selectedSlot?.endLabel}
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-800 sticky top-0 bg-zinc-900 rounded-t-3xl md:rounded-t-3xl z-10">
              <div>
                <h2 className="text-base font-black text-white tracking-tight">Book {spaceData.name}</h2>
                <p className="text-xs text-zinc-600 mt-0.5 tracking-wide">1-hour slots · up to 2 days ahead</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors">
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <div className="p-5 space-y-6 pb-8">
              {/* Unit selector */}
              {spaceData.units && dbUnits.length > 0 && (
                <div>
                  <p className="text-zinc-600 text-[10px] font-bold tracking-[0.25em] uppercase mb-3">Select Table</p>
                  <div className="grid grid-cols-2 gap-2">
                    {dbUnits.map(unit => (
                      <button
                        key={unit.id}
                        onClick={() => setSelectedUnitId(unit.id)}
                        className={`py-3 px-4 rounded-xl border font-semibold text-sm transition-all ${
                          selectedUnitId === unit.id
                            ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                            : 'border-zinc-800 bg-zinc-800/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
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
                <p className="text-zinc-600 text-[10px] font-bold tracking-[0.25em] uppercase mb-3">Select Date</p>
                <div className="grid grid-cols-3 gap-2">
                  {dates.map(d => (
                    <button
                      key={d.value}
                      onClick={() => setSelectedDate(d.value)}
                      className={`py-3 px-2 rounded-xl border transition-all text-center ${
                        selectedDate === d.value
                          ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                          : 'border-zinc-800 bg-zinc-800/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <div className="font-bold text-sm">{d.label}</div>
                      <div className={`text-xs mt-0.5 ${selectedDate === d.value ? 'text-orange-500/70' : 'text-zinc-600'}`}>{d.sublabel}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time slot grid */}
              {selectedDate && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-zinc-600 text-[10px] font-bold tracking-[0.25em] uppercase">Select Time</p>
                    {loadingSlots && <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />}
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {TIME_SLOTS.map(slot => {
                      const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');
                      const past = isToday && slot.end <= `${String(new Date().getHours()).padStart(2,'0')}:${String(new Date().getMinutes()).padStart(2,'0')}:00`;
                      const closed = !past && closedSlots.has(slot.start);
                      const mine = !past && !closed && myBookedSlots.has(slot.start);
                      const taken = !past && !closed && !mine && unavailableSlots.has(slot.start);
                      const blocked = past || closed || mine || taken;
                      const selected = selectedSlot?.start === slot.start;
                      return (
                        <button
                          key={slot.start}
                          onClick={() => !blocked && setSelectedSlot(slot)}
                          disabled={blocked || loadingSlots}
                          title={closed ? 'Space is closed' : mine ? 'Your booking' : undefined}
                          className={`py-2.5 px-1 rounded-xl border text-[11px] font-semibold transition-all ${
                            past
                              ? 'border-zinc-800 bg-transparent text-zinc-700 cursor-not-allowed line-through'
                              : closed
                              ? 'border-red-900/30 bg-red-500/5 text-red-800 cursor-not-allowed'
                              : mine
                              ? 'border-orange-900/30 bg-orange-500/5 text-orange-800 cursor-not-allowed'
                              : taken
                              ? 'border-zinc-800 bg-transparent text-zinc-700 cursor-not-allowed line-through'
                              : selected
                              ? 'border-orange-500 bg-orange-500 text-black'
                              : 'border-zinc-800 bg-zinc-800/50 text-zinc-300 hover:border-orange-500/50 hover:text-white'
                          }`}
                        >
                          {slot.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-4 mt-3">
                    <span className="flex items-center gap-1.5 text-[10px] text-zinc-600 tracking-wide">
                      <span className="w-2.5 h-2.5 rounded bg-zinc-800 border border-zinc-700 inline-block" />
                      Taken
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] text-orange-800 tracking-wide">
                      <span className="w-2.5 h-2.5 rounded bg-orange-500/10 border border-orange-900/30 inline-block" />
                      Yours
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] text-red-800 tracking-wide">
                      <span className="w-2.5 h-2.5 rounded bg-red-500/5 border border-red-900/30 inline-block" />
                      Closed
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
                  {error}
                </p>
              )}

              <button
                onClick={handleConfirm}
                disabled={!canConfirm}
                className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-4 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
