import { useState, useEffect, useRef } from 'react';
import { Search, UserPlus, Shield, ShieldOff, Loader2, Trash2, AlertTriangle, BellRing } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { format } from 'date-fns';

interface Member {
  id: string;
  full_name: string;
  phone: string | null;
  membership_group: string | null;
  membership_tier: number | null;
  membership_status: string;
  is_staff: boolean;
  created_at: string;
  email?: string;
}

interface AdminRole { user_id: string; role: string }

const selectBase = 'text-xs border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500 bg-zinc-800 border-zinc-700 text-zinc-300';

export function MembersPage() {
  const { isAdmin, user: currentUser } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [adminRoles, setAdminRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [adminSearch, setAdminSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [addAdminError, setAddAdminError] = useState('');
  const [addAdminLoading, setAddAdminLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Member | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [staffConfirm, setStaffConfirm] = useState<{ member: Member; grantAccess: boolean } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const [membersRes, adminsRes] = await Promise.all([
      (supabase as any).from('profiles')
        .select('id, full_name, phone, membership_group, membership_tier, membership_status, is_staff, created_at')
        .order('created_at', { ascending: false }),
      (supabase as any).from('admin_roles').select('user_id, role'),
    ]);

    if (membersRes.error) {
      // is_staff column may not exist yet — fall back without it
      const { data: fallback } = await (supabase as any).from('profiles')
        .select('id, full_name, phone, membership_group, membership_tier, membership_status, created_at')
        .order('created_at', { ascending: false });
      setMembers((fallback ?? []).map((m: any) => ({ ...m, is_staff: false })));
    } else {
      setMembers(membersRes.data ?? []);
    }

    setAdminRoles(adminsRes.data ?? []);
    setLoading(false);
  }

  async function updateMember(id: string, patch: Partial<Member>) {
    setSaving(id);
    await (supabase as any).from('profiles').update(patch).eq('id', id);
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
    setSaving(null);
  }

  async function addAdmin() {
    if (!selectedMember) return;
    setAddAdminLoading(true);
    setAddAdminError('');
    const { error: insertErr } = await (supabase as any)
      .from('admin_roles').insert({ user_id: selectedMember.id, role: 'admin', created_by: currentUser?.id });
    if (insertErr) {
      setAddAdminError(insertErr.message.includes('duplicate') ? 'This member is already an admin.' : insertErr.message);
    } else {
      setAdminRoles(prev => [...prev, { user_id: selectedMember.id, role: 'admin' }]);
      setSelectedMember(null); setAdminSearch(''); setShowAddAdmin(false);
    }
    setAddAdminLoading(false);
  }

  const adminIds = new Set(adminRoles.map(a => a.user_id));

  const adminSearchResults = adminSearch.trim()
    ? members.filter(m =>
        !adminIds.has(m.id) &&
        (m.full_name.toLowerCase().includes(adminSearch.toLowerCase()) || (m.phone ?? '').includes(adminSearch))
      ).slice(0, 6)
    : [];

  async function deleteMember() {
    if (!deleteConfirm) return;
    setDeleting(true);
    const { error } = await (supabase as any).rpc('delete_member', { target_user_id: deleteConfirm.id });
    if (!error) {
      setMembers(prev => prev.filter(m => m.id !== deleteConfirm.id));
      setAdminRoles(prev => prev.filter(a => a.user_id !== deleteConfirm.id));
    }
    setDeleting(false);
    setDeleteConfirm(null);
  }

  async function removeAdmin(userId: string) {
    setSaving(userId);
    await (supabase as any).from('admin_roles').delete().eq('user_id', userId);
    setAdminRoles(prev => prev.filter(a => a.user_id !== userId));
    setSaving(null);
  }

  const filtered = members.filter(m =>
    !m.is_staff &&
    (m.full_name.toLowerCase().includes(search.toLowerCase()) || (m.phone ?? '').includes(search))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Members</h1>
          <p className="text-zinc-500 text-sm mt-1">{members.length} total accounts</p>
        </div>
        <button
          onClick={() => setShowAddAdmin(v => !v)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add Admin
        </button>
      </div>

      {/* Add admin panel */}
      {showAddAdmin && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">
          <h3 className="font-black text-white text-sm mb-1 tracking-tight">Promote member to Admin</h3>
          <p className="text-xs text-zinc-500 mb-4">Search by name or phone number.</p>

          <div className="relative" ref={dropdownRef}>
            {selectedMember ? (
              <div className="flex items-center justify-between bg-zinc-800 border border-violet-500/50 rounded-xl px-4 py-3">
                <div>
                  <p className="font-bold text-white text-sm">{selectedMember.full_name}</p>
                  {selectedMember.phone && <p className="text-zinc-500 text-xs">{selectedMember.phone}</p>}
                </div>
                <button onClick={() => { setSelectedMember(null); setAdminSearch(''); }} className="text-zinc-500 hover:text-white text-xl leading-none">×</button>
              </div>
            ) : (
              <input
                value={adminSearch}
                onChange={e => { setAdminSearch(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Type a name or phone number…"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
              />
            )}

            {showDropdown && adminSearchResults.length > 0 && !selectedMember && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl z-10 overflow-hidden">
                {adminSearchResults.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedMember(m); setShowDropdown(false); setAdminSearch(''); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 transition-colors text-left border-b border-zinc-800 last:border-0"
                  >
                    <div className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center text-xs font-black text-black shrink-0">
                      {m.full_name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{m.full_name}</p>
                      <p className="text-zinc-500 text-xs">{m.phone ?? 'No phone'}</p>
                    </div>
                    <span className={`ml-auto text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full border ${
                      m.membership_status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {m.membership_status}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {showDropdown && adminSearch.trim() && adminSearchResults.length === 0 && !selectedMember && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl z-10 px-4 py-3 text-xs text-zinc-500">
                No members found matching "{adminSearch}"
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={addAdmin}
              disabled={!selectedMember || addAdminLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold disabled:opacity-40 transition-colors tracking-wide"
            >
              {addAdminLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              Make Admin
            </button>
            <button
              onClick={() => { setShowAddAdmin(false); setSelectedMember(null); setAdminSearch(''); setAddAdminError(''); }}
              className="px-4 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-xl text-xs font-bold hover:text-white transition-colors tracking-wide"
            >
              Cancel
            </button>
          </div>
          {addAdminError && <p className="text-red-400 text-xs mt-2">{addAdminError}</p>}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or phone…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
        />
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-5 py-3.5 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.15em]">Member</th>
              <th className="text-left px-4 py-3.5 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.15em]">Group</th>
              <th className="text-left px-4 py-3.5 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.15em]">Tier</th>
              <th className="text-left px-4 py-3.5 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.15em]">Status</th>
              <th className="text-left px-4 py-3.5 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.15em]">Role</th>
              <th className="text-left px-4 py-3.5 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.15em]">Joined</th>
              <th className="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {filtered.map(member => {
              const isCurrentAdmin = adminIds.has(member.id);
              const isSelf = member.id === currentUser?.id;
              return (
                <tr key={member.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center text-xs font-black text-black shrink-0">
                        {member.full_name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{member.full_name}</p>
                        {member.phone && <p className="text-zinc-600 text-xs">{member.phone}</p>}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <select
                      value={member.membership_group ?? ''}
                      onChange={e => updateMember(member.id, { membership_group: e.target.value || null } as any)}
                      disabled={saving === member.id}
                      className={selectBase}
                    >
                      <option value="">— unset —</option>
                      <option value="satsangi">Satsangi</option>
                      <option value="non_satsangi">Non-Satsangi</option>
                    </select>
                  </td>

                  <td className="px-4 py-4">
                    <select
                      value={member.membership_tier ?? ''}
                      onChange={e => updateMember(member.id, { membership_tier: e.target.value ? Number(e.target.value) : null } as any)}
                      disabled={saving === member.id}
                      className={selectBase}
                    >
                      <option value="">— unset —</option>
                      <option value="1">Tier 1</option>
                      <option value="2">Tier 2</option>
                    </select>
                  </td>

                  <td className="px-4 py-4">
                    <select
                      value={member.membership_status}
                      onChange={e => updateMember(member.id, { membership_status: e.target.value } as any)}
                      disabled={saving === member.id}
                      className={`text-xs border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500 ${
                        member.membership_status === 'active'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : member.membership_status === 'pending'
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                          : 'border-red-500/30 bg-red-500/10 text-red-400'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </td>

                  <td className="px-4 py-4">
                    {saving === member.id ? (
                      <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {isCurrentAdmin && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold tracking-widest uppercase text-violet-300 bg-violet-600/10 border border-violet-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              {adminRoles.find(a => a.user_id === member.id)?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                            </span>
                            {!isSelf && isAdmin && (
                              <button
                                onClick={() => removeAdmin(member.id)}
                                className="p-1 rounded text-zinc-600 hover:text-red-400 transition-colors"
                                title="Remove admin"
                              >
                                <ShieldOff className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                        {/* Staff / door-check toggle — always asks first */}
                        <button
                          onClick={() => setStaffConfirm({ member, grantAccess: !member.is_staff })}
                          title={member.is_staff ? 'Revoke staff portal access' : 'Grant staff portal access'}
                          className={`flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border transition-all ${
                            member.is_staff
                              ? 'text-amber-300 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20'
                              : 'text-zinc-600 border-zinc-800 hover:border-zinc-700 hover:text-zinc-400'
                          }`}
                        >
                          <BellRing className="w-3 h-3" />
                          {member.is_staff ? 'Staff' : 'Member'}
                        </button>
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-4 text-xs text-zinc-600">
                    {format(new Date(member.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-4">
                    {!isSelf && (
                      <button
                        onClick={() => setDeleteConfirm(member)}
                        className="p-1.5 rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Delete member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-zinc-600 text-sm">
            No members found{search ? ` for "${search}"` : ''}.
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !deleting && setDeleteConfirm(null)} />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full text-center">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <h2 className="text-base font-black text-white tracking-tight mb-2">Delete Member?</h2>
            <p className="text-zinc-500 text-sm mb-1">You are about to permanently delete</p>
            <p className="font-bold text-white mb-4">{deleteConfirm.full_name}</p>
            <p className="text-xs text-zinc-600 mb-6 leading-relaxed">
              This will remove their account, all bookings, and all records. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-400 font-bold text-sm hover:text-white hover:border-zinc-600 transition-all disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={deleteMember}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-sm transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff promote / demote confirmation */}
      {staffConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setStaffConfirm(null)} />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full text-center">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
              staffConfirm.grantAccess
                ? 'bg-amber-500/10 border border-amber-500/20'
                : 'bg-zinc-800 border border-zinc-700'
            }`}>
              <BellRing className={`w-6 h-6 ${staffConfirm.grantAccess ? 'text-amber-400' : 'text-zinc-500'}`} />
            </div>
            <h2 className="text-base font-black text-white tracking-tight mb-2">
              {staffConfirm.grantAccess ? 'Give Staff Access?' : 'Remove Staff Access?'}
            </h2>
            <p className="text-zinc-500 text-sm mb-1">
              {staffConfirm.grantAccess
                ? 'This will let'
                : 'This will prevent'}
            </p>
            <p className="font-bold text-white mb-3">{staffConfirm.member.full_name}</p>
            <p className="text-xs text-zinc-600 mb-6 leading-relaxed">
              {staffConfirm.grantAccess
                ? 'log into the staff door-check portal. They will no longer appear as a member.'
                : 'from accessing the staff portal. They will return to the members list.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setStaffConfirm(null)}
                className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-400 font-bold text-sm hover:text-white hover:border-zinc-600 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const { member, grantAccess } = staffConfirm;
                  setStaffConfirm(null);
                  await updateMember(member.id, { is_staff: grantAccess } as any);
                }}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
                  staffConfirm.grantAccess
                    ? 'bg-amber-500 hover:bg-amber-400 text-black'
                    : 'bg-zinc-700 hover:bg-zinc-600 text-white'
                }`}
              >
                <BellRing className="w-4 h-4" />
                {staffConfirm.grantAccess ? 'Grant Access' : 'Remove Access'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
