import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Loader2, ArrowRight } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import type { SpaceType } from '../App';
import { getSpace, SPACE_CONFLICTS } from '../data/spaces';

function formatHour(h: number) {
  if (h === 0) return '12AM';
  if (h < 12) return `${h}AM`;
  if (h === 12) return '12PM';
  return `${h - 12}PM`;
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
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : format(d, 'EEE'),
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
      setTimeout(onBooked, 2400);
    }
  }

  const canConfirm = !!selectedDate && !!selectedSlot && (!spaceData.units || !!selectedUnitId) && !submitting;
  const selectedUnitName = dbUnits.find(u => u.id === selectedUnitId)?.name;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-t-3xl md:rounded-3xl max-h-[92vh] overflow-y-auto"
      >
        {step === 'success' ? (
          <div className="p-10 text-center">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', delay: 0.1, stiffness: 200 }}
              className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-7"
            >
              <span className="text-4xl text-emerald-500 font-black leading-none">✓</span>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none mb-1">Confirmed</h2>
              <p className="text-zinc-600 text-[10px] font-black tracking-[0.3em] uppercase mb-5">Booking placed</p>
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 text-xs">Space</span>
                  <span className="text-white font-black text-sm uppercase">{spaceData.name}{selectedUnitName ? ` · ${selectedUnitName}` : ''}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 text-xs">Date</span>
                  <span className="text-white font-black text-sm">{format(new Date(selectedDate), 'EEE, MMM d')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 text-xs">Time</span>
                  <span className="text-white font-black text-sm">{selectedSlot?.label} – {selectedSlot?.endLabel}</span>
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between p-6 pb-4 sticky top-0 bg-zinc-900 border-b border-zinc-800 rounded-t-3xl z-10">
              <div>
                <p className="text-zinc-600 text-[10px] font-black tracking-[0.3em] uppercase mb-1">Book a Slot</p>
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">{spaceData.name}</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors mt-0.5">
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <div className="p-6 space-y-7 pb-8">
              {/* Unit selector */}
              {spaceData.units && dbUnits.length > 0 && (
                <div>
                  <p className="text-zinc-700 text-[10px] font-black tracking-[0.3em] uppercase mb-3">Select Table</p>
                  <div className="grid grid-cols-2 gap-2">
                    {dbUnits.map(unit => (
                      <button
                        key={unit.id}
                        onClick={() => setSelectedUnitId(unit.id)}
                        className={`py-3 px-4 rounded-xl border font-black text-sm uppercase tracking-tight transition-all ${
                          selectedUnitId === unit.id
                            ? 'border-violet-500 bg-violet-600/10 text-violet-300'
                            : 'border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-200'
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
                <p className="text-zinc-700 text-[10px] font-black tracking-[0.3em] uppercase mb-3">Date</p>
                <div className="grid grid-cols-3 gap-2">
                  {dates.map(d => (
                    <button
                      key={d.value}
                      onClick={() => setSelectedDate(d.value)}
                      className={`py-4 px-2 rounded-xl border transition-all text-center ${
                        selectedDate === d.value
                          ? 'border-violet-500 bg-violet-600/10'
                          : 'border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className={`font-black text-sm uppercase tracking-tight ${selectedDate === d.value ? 'text-violet-300' : 'text-zinc-300'}`}>{d.label}</div>
                      <div className={`text-xs mt-0.5 font-medium ${selectedDate === d.value ? 'text-violet-400/70' : 'text-zinc-600'}`}>{d.sublabel}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time slot grid */}
              {selectedDate && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-zinc-700 text-[10px] font-black tracking-[0.3em] uppercase">Time</p>
                    {loadingSlots && <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />}
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
                          className={`py-2.5 px-1 rounded-xl border text-[11px] font-black uppercase tracking-tight transition-all ${
                            past
                              ? 'border-zinc-800/50 bg-transparent text-zinc-800 cursor-not-allowed line-through'
                              : closed
                              ? 'border-red-900/30 bg-red-500/5 text-red-900 cursor-not-allowed'
                              : mine
                              ? 'border-violet-900/40 bg-violet-600/5 text-violet-900 cursor-not-allowed'
                              : taken
                              ? 'border-zinc-800/50 bg-transparent text-zinc-800 cursor-not-allowed'
                              : selected
                              ? 'border-violet-500 bg-violet-600 text-white'
                              : 'border-zinc-800 text-zinc-400 hover:border-violet-500/50 hover:text-white'
                          }`}
                        >
                          {slot.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-4 mt-3.5">
                    {[
                      { color: 'bg-zinc-800/50 border-zinc-800/50', label: 'Taken', textClass: 'text-zinc-600' },
                      { color: 'bg-violet-600/5 border-violet-900/40', label: 'Yours', textClass: 'text-zinc-600' },
                      { color: 'bg-red-500/5 border-red-900/30', label: 'Closed', textClass: 'text-zinc-600' },
                    ].map(({ color, label, textClass }) => (
                      <span key={label} className={`flex items-center gap-1.5 text-[10px] ${textClass} tracking-wide`}>
                        <span className={`w-2.5 h-2.5 rounded border inline-block ${color}`} />
                        {label}
                      </span>
                    ))}
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
                className="group w-full flex items-center justify-between bg-violet-600 hover:bg-violet-500 text-white font-black py-5 px-6 rounded-2xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="flex items-center gap-2.5">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span className="text-sm tracking-widest uppercase">{submitting ? 'Confirming…' : 'Confirm Booking'}</span>
                </span>
                {!submitting && <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
