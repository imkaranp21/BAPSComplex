import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LogOut, User, Package } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';

interface ActiveLoan {
  id: string;
  equipment_name: string;
  space_name: string;
  quantity: number;
  lent_at: string;
}

interface ProfileScreenProps {
  onSignIn: () => void;
}

export function ProfileScreen({ onSignIn }: ProfileScreenProps) {
  const { user, profile, signOut } = useAuth();
  const [loans, setLoans] = useState<ActiveLoan[]>([]);

  useEffect(() => {
    if (user) fetchLoans();
  }, [user]);

  async function fetchLoans() {
    const { data } = await (supabase as any)
      .from('equipment_loans')
      .select('id, quantity, lent_at, equipment(name, spaces(name))')
      .eq('member_id', user!.id)
      .is('returned_at', null)
      .order('lent_at', { ascending: false });
    setLoans(
      (data ?? []).map((l: any) => ({
        id: l.id,
        equipment_name: l.equipment?.name ?? '',
        space_name: l.equipment?.spaces?.name ?? '',
        quantity: l.quantity,
        lent_at: l.lent_at,
      }))
    );
  }

  if (!user) {
    return (
      <div className="bg-zinc-950 min-h-full flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mb-7">
          <User className="w-9 h-9 text-zinc-700" />
        </div>
        <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none mb-2">Sign In</h2>
        <p className="text-zinc-600 text-sm mb-9 text-center max-w-xs">Access your membership details and manage your account.</p>
        <button
          onClick={onSignIn}
          className="bg-orange-500 hover:bg-orange-400 text-black font-black px-10 py-4 rounded-2xl transition-colors text-sm tracking-widest uppercase"
        >
          Sign In
        </button>
      </div>
    );
  }

  const initial = (profile?.full_name ?? user.email ?? 'U')[0].toUpperCase();

  const statusType = profile?.membership_status === 'active'
    ? 'active' : profile?.membership_status === 'pending' ? 'pending' : 'suspended';

  const statusColor = statusType === 'active' ? 'bg-emerald-500' : statusType === 'pending' ? 'bg-amber-500' : 'bg-red-500';
  const statusTextColor = statusType === 'active' ? 'text-emerald-500' : statusType === 'pending' ? 'text-amber-500' : 'text-red-500';

  const membershipLabel = profile?.membership_tier
    ? `Tier ${profile.membership_tier}`
    : statusType === 'active' ? 'Active'
    : statusType === 'pending' ? 'Pending'
    : 'Suspended';

  return (
    <div className="bg-zinc-950 min-h-full">

      {/* Hero section */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-start justify-between mb-6">
          <p className="text-zinc-700 text-[10px] font-black tracking-[0.3em] uppercase">Your Account</p>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-800 text-zinc-600 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 transition-all text-xs font-black uppercase tracking-widest"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>

        <div className="flex items-end gap-5 mb-6">
          <div className="w-20 h-20 bg-orange-500 rounded-2xl flex items-center justify-center shrink-0">
            <span className="text-black font-black text-3xl leading-none">{initial}</span>
          </div>
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className={`w-2 h-2 rounded-full ${statusColor}`} />
              <span className={`text-[10px] font-black tracking-[0.3em] uppercase ${statusTextColor}`}>
                {membershipLabel} Member
              </span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter leading-none">
              {profile?.full_name ?? 'Member'}
            </h1>
          </div>
        </div>

        {/* Contact info */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-zinc-600 text-xs">Email</span>
            <span className="text-zinc-300 text-sm font-medium">{user.email}</span>
          </div>
          {profile?.phone && (
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 text-xs">Phone</span>
              <span className="text-zinc-300 text-sm font-medium">{profile.phone}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-zinc-600 text-xs">Status</span>
            <span className={`text-sm font-black uppercase tracking-tight ${statusTextColor}`}>{statusType}</span>
          </div>
        </div>

        {/* Status notices */}
        {statusType === 'pending' && (
          <div className="mt-3 bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3">
            <p className="text-xs text-amber-400 leading-relaxed">
              Your membership is pending approval. An admin will assign your tier shortly.
            </p>
          </div>
        )}
        {statusType === 'suspended' && (
          <div className="mt-3 bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3">
            <p className="text-xs text-red-400 leading-relaxed">
              Your account has been suspended. Please contact the complex for more information.
            </p>
          </div>
        )}
      </motion.div>

      {/* Active equipment loans */}
      {loans.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-zinc-700 text-[10px] font-black tracking-[0.3em] uppercase mb-4">Equipment Out</p>
          <div className="space-y-2">
            {loans.map(loan => (
              <div key={loan.id} className="bg-zinc-900 border border-amber-500/20 rounded-xl px-4 py-4 flex items-center gap-4">
                <div className="w-9 h-9 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-white text-sm uppercase tracking-tight">
                    {loan.equipment_name}
                    {loan.quantity > 1 && <span className="text-zinc-500 font-normal normal-case"> ×{loan.quantity}</span>}
                  </p>
                  <p className="text-zinc-600 text-xs mt-0.5">
                    {loan.space_name} · {format(new Date(loan.lent_at), 'MMM d, h:mm a')}
                  </p>
                </div>
                <span className="text-[9px] font-black tracking-[0.2em] uppercase text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-full shrink-0">
                  Return to desk
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
