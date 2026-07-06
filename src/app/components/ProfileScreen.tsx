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
      <div className="bg-zinc-950 min-h-full pt-6 pb-4">
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl mb-5">
            <User className="w-7 h-7 text-zinc-600" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight mb-2">Sign in to your account</h2>
          <p className="text-zinc-600 text-sm mb-8">Manage your membership and account details.</p>
          <button
            onClick={onSignIn}
            className="bg-orange-500 hover:bg-orange-400 text-black font-bold px-8 py-3.5 rounded-xl transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const initial = (profile?.full_name ?? user.email ?? 'U')[0].toUpperCase();

  const membershipLabel = profile
    ? profile.membership_status === 'active'
      ? profile.membership_tier ? `Tier ${profile.membership_tier} Member` : 'Active Member'
      : profile.membership_status === 'pending'
      ? 'Pending Approval'
      : 'Suspended'
    : null;

  const statusBadge = profile?.membership_status === 'active'
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    : profile?.membership_status === 'pending'
    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    : 'bg-red-500/10 text-red-400 border-red-500/20';

  return (
    <div className="bg-zinc-950 min-h-full">
      <h1 className="text-2xl font-black text-white tracking-tight mb-6">Profile</h1>

      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-black font-black text-xl">{initial}</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">{profile?.full_name ?? 'Member'}</h2>
              <p className="text-zinc-500 text-xs mt-0.5">{user.email}</p>
              {profile?.phone && <p className="text-zinc-600 text-xs mt-0.5">{profile.phone}</p>}
              {membershipLabel && (
                <span className={`inline-block mt-2 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border ${statusBadge}`}>
                  {membershipLabel}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={signOut}
            className="p-2.5 rounded-lg border border-zinc-800 text-zinc-600 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 transition-all"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {profile?.membership_status === 'pending' && (
          <div className="mt-4 bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3">
            <p className="text-xs text-amber-400 leading-relaxed">
              Your membership is pending approval. An admin will assign your tier shortly.
            </p>
          </div>
        )}
        {profile?.membership_status === 'suspended' && (
          <div className="mt-4 bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3">
            <p className="text-xs text-red-400 leading-relaxed">
              Your account has been suspended. Please contact the complex for more information.
            </p>
          </div>
        )}
      </motion.div>

      {/* Active loans */}
      {loans.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6"
        >
          <p className="text-zinc-600 text-[10px] font-bold tracking-[0.25em] uppercase mb-3">Equipment Checked Out</p>
          <div className="space-y-2">
            {loans.map(loan => (
              <div key={loan.id} className="bg-zinc-900 border border-amber-500/20 rounded-xl px-4 py-3.5 flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm">
                    {loan.equipment_name}
                    {loan.quantity > 1 && <span className="text-zinc-500 font-normal"> ×{loan.quantity}</span>}
                  </p>
                  <p className="text-zinc-600 text-xs mt-0.5">
                    {loan.space_name} · Issued {format(new Date(loan.lent_at), 'MMM d, h:mm a')}
                  </p>
                </div>
                <span className="text-[10px] font-bold tracking-widest uppercase text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full shrink-0">
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
