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
      <div className="bg-[#FFFBF5] pt-6 pb-4">
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-stone-100 rounded-2xl mb-5">
            <User className="w-8 h-8 text-stone-400" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 mb-2">Sign in to your account</h2>
          <p className="text-stone-500 text-sm mb-8">Manage your membership and account details.</p>
          <button
            onClick={onSignIn}
            className="bg-orange-600 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-orange-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const membershipLabel = profile
    ? profile.membership_status === 'active'
      ? profile.membership_tier ? `Tier ${profile.membership_tier} Member` : 'Active Member'
      : profile.membership_status === 'pending'
      ? 'Pending Approval'
      : 'Suspended'
    : null;

  const statusColor = profile?.membership_status === 'active'
    ? 'bg-green-100 text-green-700'
    : profile?.membership_status === 'pending'
    ? 'bg-amber-100 text-amber-700'
    : 'bg-red-100 text-red-700';

  return (
    <div className="bg-[#FFFBF5]">
      <h1 className="text-2xl font-bold text-stone-900 mb-6">My Profile</h1>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center">
              <span className="text-orange-600 font-bold text-xl">
                {(profile?.full_name ?? user.email ?? 'U')[0].toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">{profile?.full_name ?? 'Member'}</h2>
              <p className="text-stone-400 text-sm">{user.email}</p>
              {profile?.phone && <p className="text-stone-400 text-sm">{profile.phone}</p>}
              {membershipLabel && (
                <span className={`inline-block mt-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor}`}>
                  {membershipLabel}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {profile?.membership_status === 'pending' && (
          <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <p className="text-sm text-amber-800">
              Your membership is pending approval. An admin will assign your tier shortly.
            </p>
          </div>
        )}
        {profile?.membership_status === 'suspended' && (
          <div className="mt-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <p className="text-sm text-red-800">
              Your account has been suspended. Please contact the complex for more information.
            </p>
          </div>
        )}
      </motion.div>

      {loans.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-4"
        >
          <h2 className="text-stone-400 text-xs font-semibold tracking-widest uppercase mb-3">Equipment Checked Out</h2>
          <div className="space-y-2">
            {loans.map(loan => (
              <div key={loan.id} className="bg-white border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-stone-900 text-sm">
                    {loan.equipment_name}
                    {loan.quantity > 1 && <span className="text-stone-400 font-normal"> ×{loan.quantity}</span>}
                  </p>
                  <p className="text-stone-400 text-xs">
                    {loan.space_name} · Issued {format(new Date(loan.lent_at), 'MMM d, h:mm a')}
                  </p>
                </div>
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full shrink-0">
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
