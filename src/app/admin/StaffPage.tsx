import { useState, useEffect } from 'react';
import { Loader2, Trash2, BellRing, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';

interface StaffMember {
  id: string;
  full_name: string;
  is_staff: boolean;
  created_at: string;
}

export function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [revokeConfirm, setRevokeConfirm] = useState<StaffMember | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await (supabase as any)
      .from('profiles')
      .select('id, full_name, is_staff, created_at')
      .eq('is_staff', true)
      .order('created_at', { ascending: false });
    setStaff(data ?? []);
    setLoading(false);
  }

  async function revokeAccess(id: string) {
    setSaving(id);
    await (supabase as any).from('profiles').update({ is_staff: false }).eq('id', id);
    setStaff(prev => prev.filter(s => s.id !== id));
    setSaving(null);
    setRevokeConfirm(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white tracking-tight">Staff</h1>
        <p className="text-zinc-500 text-sm mt-1">
          {staff.length} staff account{staff.length !== 1 ? 's' : ''} with portal access
        </p>
      </div>

      {/* How-to card */}
      <div className="bg-violet-600/5 border border-violet-500/20 rounded-2xl p-5 mb-6">
        <p className="text-violet-300 font-black text-sm mb-1 flex items-center gap-2">
          <BellRing className="w-4 h-4" />
          How to add staff
        </p>
        <ol className="text-zinc-500 text-xs leading-relaxed space-y-1 mt-2 list-decimal list-inside">
          <li>Staff member goes to <span className="text-violet-400 font-mono">/staff</span> and creates an account</li>
          <li>They appear in the Members page with status Pending</li>
          <li>Go to Members, find their name, click the <span className="text-amber-400">Member</span> badge to promote them to Staff</li>
          <li>They can now log in and access the door-check portal</li>
        </ol>
      </div>

      {staff.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
          <BellRing className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No staff accounts yet.</p>
          <p className="text-zinc-700 text-xs mt-1">Staff register at /staff then you promote them here.</p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-5 py-3.5 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.15em]">Name</th>
                <th className="text-left px-4 py-3.5 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.15em]">Added</th>
                <th className="text-left px-4 py-3.5 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.15em]">Portal</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {staff.map(s => (
                <tr key={s.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center text-xs font-black text-amber-400 shrink-0">
                        {s.full_name[0]?.toUpperCase()}
                      </div>
                      <p className="font-bold text-white text-sm">{s.full_name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs text-zinc-600">
                    {format(new Date(s.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full flex items-center gap-1 w-fit">
                      <BellRing className="w-3 h-3" />
                      Active
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {saving === s.id ? (
                      <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                    ) : (
                      <button
                        onClick={() => setRevokeConfirm(s)}
                        className="p-1.5 rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Revoke staff access"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Revoke confirm modal */}
      {revokeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setRevokeConfirm(null)} />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full text-center">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <h2 className="text-base font-black text-white tracking-tight mb-2">Revoke Staff Access?</h2>
            <p className="text-zinc-500 text-sm mb-5">
              <span className="font-bold text-white">{revokeConfirm.full_name}</span> will no longer be able to access the staff portal.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setRevokeConfirm(null)} className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-400 font-bold text-sm hover:text-white transition-all">
                Cancel
              </button>
              <button onClick={() => revokeAccess(revokeConfirm.id)} disabled={saving === revokeConfirm.id} className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-sm transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                {saving === revokeConfirm.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Revoke
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
