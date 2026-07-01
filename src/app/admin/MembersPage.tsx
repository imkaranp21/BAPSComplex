import { useState, useEffect, useRef } from 'react';
import { Search, UserPlus, Shield, ShieldOff, Loader2, Trash2, AlertTriangle } from 'lucide-react';
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
  created_at: string;
  email?: string;
}

interface AdminRole {
  user_id: string;
  role: string;
}

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
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const [membersRes, adminsRes] = await Promise.all([
      (supabase as any)
        .from('profiles')
        .select('id, full_name, phone, membership_group, membership_tier, membership_status, created_at')
        .order('created_at', { ascending: false }),
      (supabase as any).from('admin_roles').select('user_id, role'),
    ]);
    setMembers(membersRes.data ?? []);
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
      .from('admin_roles')
      .insert({ user_id: selectedMember.id, role: 'admin', created_by: currentUser?.id });

    if (insertErr) {
      setAddAdminError(insertErr.message.includes('duplicate') ? 'This member is already an admin.' : insertErr.message);
    } else {
      setAdminRoles(prev => [...prev, { user_id: selectedMember.id, role: 'admin' }]);
      setSelectedMember(null);
      setAdminSearch('');
      setShowAddAdmin(false);
    }
    setAddAdminLoading(false);
  }

  const adminIds = new Set(adminRoles.map(a => a.user_id));

  const adminSearchResults = adminSearch.trim()
    ? members.filter(m =>
        !adminIds.has(m.id) &&
        (m.full_name.toLowerCase().includes(adminSearch.toLowerCase()) ||
         (m.phone ?? '').includes(adminSearch))
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
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (m.phone ?? '').includes(search)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Members</h1>
          <p className="text-stone-500 text-sm mt-1">{members.length} total accounts</p>
        </div>
        <button
          onClick={() => setShowAddAdmin(v => !v)}
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add Admin
        </button>
      </div>

      {/* Add admin panel */}
      {showAddAdmin && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-6">
          <h3 className="font-semibold text-stone-900 mb-1">Promote member to Admin</h3>
          <p className="text-sm text-stone-500 mb-4">Search by name or phone number.</p>

          <div className="relative" ref={dropdownRef}>
            {/* Selected member pill */}
            {selectedMember ? (
              <div className="flex items-center justify-between bg-white border-2 border-orange-500 rounded-xl px-4 py-3">
                <div>
                  <p className="font-medium text-stone-900 text-sm">{selectedMember.full_name}</p>
                  {selectedMember.phone && <p className="text-stone-400 text-xs">{selectedMember.phone}</p>}
                </div>
                <button
                  onClick={() => { setSelectedMember(null); setAdminSearch(''); }}
                  className="text-stone-400 hover:text-stone-600 text-lg leading-none"
                >×</button>
              </div>
            ) : (
              <input
                value={adminSearch}
                onChange={e => { setAdminSearch(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Type a name or phone number…"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            )}

            {/* Dropdown results */}
            {showDropdown && adminSearchResults.length > 0 && !selectedMember && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg z-10 overflow-hidden">
                {adminSearchResults.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedMember(m); setShowDropdown(false); setAdminSearch(''); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors text-left border-b border-stone-50 last:border-0"
                  >
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-xs font-bold text-orange-700 shrink-0">
                      {m.full_name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-stone-900 text-sm">{m.full_name}</p>
                      <p className="text-stone-400 text-xs">{m.phone ?? 'No phone'}</p>
                    </div>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                      m.membership_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {m.membership_status}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {showDropdown && adminSearch.trim() && adminSearchResults.length === 0 && !selectedMember && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg z-10 px-4 py-3 text-sm text-stone-400">
                No members found matching "{adminSearch}"
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={addAdmin}
              disabled={!selectedMember || addAdminLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 disabled:opacity-40 transition-colors"
            >
              {addAdminLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              Make Admin
            </button>
            <button
              onClick={() => { setShowAddAdmin(false); setSelectedMember(null); setAdminSearch(''); setAddAdminError(''); }}
              className="px-4 py-2.5 bg-white border border-stone-200 text-stone-600 rounded-xl text-sm font-semibold hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
          </div>

          {addAdminError && (
            <p className="text-red-600 text-sm mt-2">{addAdminError}</p>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or phone…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Member</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Group</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Tier</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Role</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Joined</th>
              <th className="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {filtered.map(member => {
              const isCurrentAdmin = adminIds.has(member.id);
              const isSelf = member.id === currentUser?.id;
              return (
                <tr key={member.id} className="border-b border-stone-50 hover:bg-stone-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-xs font-bold text-orange-700">
                        {member.full_name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-stone-900">{member.full_name}</p>
                        {member.phone && <p className="text-stone-400 text-xs">{member.phone}</p>}
                      </div>
                    </div>
                  </td>

                  {/* Membership group */}
                  <td className="px-4 py-4">
                    <select
                      value={member.membership_group ?? ''}
                      onChange={e => updateMember(member.id, { membership_group: e.target.value || null } as any)}
                      disabled={saving === member.id}
                      className="text-xs border border-stone-200 rounded-lg px-2 py-1.5 bg-white text-stone-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      <option value="">— unset —</option>
                      <option value="satsangi">Satsangi</option>
                      <option value="non_satsangi">Non-Satsangi</option>
                    </select>
                  </td>

                  {/* Tier */}
                  <td className="px-4 py-4">
                    <select
                      value={member.membership_tier ?? ''}
                      onChange={e => updateMember(member.id, { membership_tier: e.target.value ? Number(e.target.value) : null } as any)}
                      disabled={saving === member.id}
                      className="text-xs border border-stone-200 rounded-lg px-2 py-1.5 bg-white text-stone-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      <option value="">— unset —</option>
                      <option value="1">Tier 1</option>
                      <option value="2">Tier 2</option>
                    </select>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    <select
                      value={member.membership_status}
                      onChange={e => updateMember(member.id, { membership_status: e.target.value } as any)}
                      disabled={saving === member.id}
                      className={`text-xs border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                        member.membership_status === 'active'
                          ? 'border-green-200 bg-green-50 text-green-700'
                          : member.membership_status === 'pending'
                          ? 'border-amber-200 bg-amber-50 text-amber-700'
                          : 'border-red-200 bg-red-50 text-red-700'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </td>

                  {/* Admin role */}
                  <td className="px-4 py-4">
                    {saving === member.id ? (
                      <Loader2 className="w-4 h-4 text-orange-600 animate-spin" />
                    ) : isCurrentAdmin ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-orange-700 bg-orange-100 px-2 py-1 rounded-full flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          {adminRoles.find(a => a.user_id === member.id)?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                        </span>
                        {!isSelf && isAdmin && (
                          <button
                            onClick={() => removeAdmin(member.id)}
                            className="p-1 hover:bg-red-50 rounded text-stone-400 hover:text-red-600 transition-colors"
                            title="Remove admin"
                          >
                            <ShieldOff className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-stone-400">Member</span>
                    )}
                  </td>

                  <td className="px-4 py-4 text-xs text-stone-400">
                    {format(new Date(member.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-4">
                    {!isSelf && (
                      <button
                        onClick={() => setDeleteConfirm(member)}
                        className="p-1.5 rounded-lg text-stone-300 hover:text-red-600 hover:bg-red-50 transition-colors"
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
          <div className="text-center py-12 text-stone-400">
            No members found{search ? ` for "${search}"` : ''}.
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !deleting && setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-stone-900 text-center mb-2">Delete Member?</h2>
            <p className="text-stone-500 text-sm text-center mb-1">
              You are about to permanently delete
            </p>
            <p className="font-semibold text-stone-900 text-center mb-4">{deleteConfirm.full_name}</p>
            <p className="text-xs text-stone-400 text-center mb-6 leading-relaxed">
              This will remove their account, all bookings, and all records from the database. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-700 font-semibold text-sm hover:bg-stone-50 transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={deleteMember}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
