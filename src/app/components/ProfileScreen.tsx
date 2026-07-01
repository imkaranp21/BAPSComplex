import { motion } from 'motion/react';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';

interface ProfileScreenProps {
  onSignIn: () => void;
}

export function ProfileScreen({ onSignIn }: ProfileScreenProps) {
  const { user, profile, signOut } = useAuth();

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
    </div>
  );
}
