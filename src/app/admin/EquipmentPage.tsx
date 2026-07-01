import { useState, useEffect } from 'react';
import { Package, ArrowLeftRight, Loader2, Search, Check, X, Plus, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';

const SPACES = [
  { slug: 'cricket',      label: 'Cricket' },
  { slug: 'futsal',       label: 'Futsal' },
  { slug: 'volleyball',   label: 'Volleyball' },
  { slug: 'pool-table',   label: 'Pool Table' },
  { slug: 'table-tennis', label: 'Table Tennis' },
  { slug: 'darts',        label: 'Darts' },
];

interface EquipmentItem {
  id: string;
  name: string;
  total_quantity: number;
  out: number;
}

interface Loan {
  id: string;
  equipment_id: string;
  equipment_name: string;
  member_id: string | null;
  member_name: string;
  quantity: number;
  lent_at: string;
  notes: string | null;
}

interface Member {
  id: string;
  full_name: string;
  phone: string | null;
  membership_status: string;
}

export function EquipmentPage() {
  const { user } = useAuth();
  const [activeSpace, setActiveSpace] = useState(SPACES[0].slug);
  const [spaceIds, setSpaceIds] = useState<Record<string, string>>({});
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [spaceLoading, setSpaceLoading] = useState(false);

  // Add / edit modal
  const [itemModal, setItemModal] = useState<{ mode: 'add' | 'edit'; item?: EquipmentItem } | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [savingItem, setSavingItem] = useState(false);
  const [itemError, setItemError] = useState('');

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Issue modal
  const [issueItem, setIssueItem] = useState<EquipmentItem | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [issueQty, setIssueQty] = useState(1);
  const [issueNotes, setIssueNotes] = useState('');
  const [issuing, setIssuing] = useState(false);
  const [issueError, setIssueError] = useState('');

  // Return
  const [returning, setReturning] = useState<string | null>(null);

  useEffect(() => { init(); }, []);

  useEffect(() => {
    if (Object.keys(spaceIds).length) loadSpace(activeSpace);
  }, [activeSpace, spaceIds]);

  async function init() {
    setLoading(true);
    const [spacesRes, membersRes] = await Promise.all([
      (supabase as any).from('spaces').select('id, slug').in('slug', SPACES.map(s => s.slug)),
      (supabase as any).from('profiles').select('id, full_name, phone, membership_status').order('full_name'),
    ]);
    const ids: Record<string, string> = {};
    (spacesRes.data ?? []).forEach((s: any) => { ids[s.slug] = s.id; });
    setSpaceIds(ids);
    setMembers(membersRes.data ?? []);
    setLoading(false);
  }

  async function loadSpace(slug: string) {
    const spaceId = spaceIds[slug];
    if (!spaceId) return;
    setSpaceLoading(true);

    // 1. Fetch equipment for this space
    const { data: eqData } = await (supabase as any)
      .from('equipment')
      .select('id, name, total_quantity')
      .eq('space_id', spaceId)
      .order('name');

    const eqList: { id: string; name: string; total_quantity: number }[] = eqData ?? [];
    const eqIds = eqList.map(e => e.id);
    const eqNameMap: Record<string, string> = {};
    eqList.forEach(e => { eqNameMap[e.id] = e.name; });

    // 2. Fetch active loans for those equipment items (no join to profiles — we resolve names from members state)
    let rawLoans: any[] = [];
    if (eqIds.length > 0) {
      const { data: loansData } = await (supabase as any)
        .from('equipment_loans')
        .select('id, equipment_id, member_id, quantity, lent_at, notes')
        .in('equipment_id', eqIds)
        .is('returned_at', null)
        .order('lent_at', { ascending: false });
      rawLoans = loansData ?? [];
    }

    // Count out per equipment item
    const outCounts: Record<string, number> = {};
    rawLoans.forEach((l: any) => {
      outCounts[l.equipment_id] = (outCounts[l.equipment_id] ?? 0) + l.quantity;
    });

    setEquipment(eqList.map(e => ({
      id: e.id,
      name: e.name,
      total_quantity: e.total_quantity,
      out: outCounts[e.id] ?? 0,
    })));

    setLoans(rawLoans.map((l: any) => ({
      id: l.id,
      equipment_id: l.equipment_id,
      equipment_name: eqNameMap[l.equipment_id] ?? 'Unknown item',
      member_id: l.member_id,
      member_name: members.find(m => m.id === l.member_id)?.full_name ?? 'Unknown member',
      quantity: l.quantity,
      lent_at: l.lent_at,
      notes: l.notes,
    })));

    setSpaceLoading(false);
  }

  // ── Inventory CRUD ──

  function openAdd() {
    setItemName('');
    setItemQty(1);
    setItemError('');
    setItemModal({ mode: 'add' });
  }

  function openEdit(item: EquipmentItem) {
    setItemName(item.name);
    setItemQty(item.total_quantity);
    setItemError('');
    setItemModal({ mode: 'edit', item });
  }

  async function saveItem() {
    if (!itemName.trim()) { setItemError('Please enter an item name.'); return; }
    if (itemQty < 1) { setItemError('Quantity must be at least 1.'); return; }
    setSavingItem(true);
    setItemError('');

    if (itemModal?.mode === 'edit' && itemModal.item) {
      const { error } = await (supabase as any)
        .from('equipment')
        .update({ name: itemName.trim(), total_quantity: itemQty })
        .eq('id', itemModal.item.id);
      if (error) { setItemError(error.message); setSavingItem(false); return; }
    } else {
      const spaceId = spaceIds[activeSpace];
      const { error } = await (supabase as any).from('equipment').insert({
        space_id: spaceId,
        name: itemName.trim(),
        total_quantity: itemQty,
      });
      if (error) { setItemError(error.message); setSavingItem(false); return; }
    }

    setSavingItem(false);
    setItemModal(null);
    await loadSpace(activeSpace);
  }

  async function deleteItem(item: EquipmentItem) {
    setDeletingId(item.id);
    await (supabase as any).from('equipment').delete().eq('id', item.id);
    setEquipment(prev => prev.filter(e => e.id !== item.id));
    setDeletingId(null);
  }

  // ── Issue ──

  function openIssue(item: EquipmentItem) {
    setIssueItem(item);
    setSelectedMember(null);
    setMemberSearch('');
    setIssueQty(1);
    setIssueNotes('');
    setIssueError('');
  }

  async function issueLoan() {
    if (!issueItem || !selectedMember) return;
    setIssuing(true);
    setIssueError('');

    const { error } = await (supabase as any).from('equipment_loans').insert({
      equipment_id: issueItem.id,
      member_id: selectedMember.id,
      quantity: issueQty,
      notes: issueNotes.trim() || null,
      lent_by: user!.id,
    });

    if (error) {
      setIssueError(error.message);
      setIssuing(false);
      return;
    }

    setIssueItem(null);
    setIssuing(false);
    await loadSpace(activeSpace);
  }

  async function returnLoan(id: string) {
    setReturning(id);
    await (supabase as any).from('equipment_loans').update({ returned_at: new Date().toISOString() }).eq('id', id);
    const loan = loans.find(l => l.id === id);
    setLoans(prev => prev.filter(l => l.id !== id));
    if (loan) {
      setEquipment(prev => prev.map(e =>
        e.id === loan.equipment_id ? { ...e, out: Math.max(0, e.out - loan.quantity) } : e
      ));
    }
    setReturning(null);
  }

  const memberResults = memberSearch.trim()
    ? members.filter(m =>
        m.membership_status === 'active' &&
        (m.full_name.toLowerCase().includes(memberSearch.toLowerCase()) ||
         (m.phone ?? '').includes(memberSearch))
      ).slice(0, 6)
    : [];

  const maxIssue = issueItem ? issueItem.total_quantity - issueItem.out : 1;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Equipment</h1>
        <p className="text-stone-500 text-sm mt-1">Manage inventory and track loans to members.</p>
      </div>

      {/* Space tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {SPACES.map(s => (
          <button
            key={s.slug}
            onClick={() => setActiveSpace(s.slug)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
              activeSpace === s.slug
                ? 'bg-orange-600 text-white border-orange-600'
                : 'bg-white text-stone-600 border-stone-200 hover:border-orange-300 hover:bg-orange-50'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-orange-600 animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Inventory */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-stone-900">Inventory</h2>
              <button
                onClick={openAdd}
                className="flex items-center gap-1.5 text-xs font-semibold bg-orange-600 text-white px-3 py-1.5 rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            {spaceLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-orange-600 animate-spin" /></div>
            ) : equipment.length === 0 ? (
              <div className="bg-white border border-dashed border-stone-300 rounded-xl p-8 text-center">
                <Package className="w-7 h-7 text-stone-300 mx-auto mb-2" />
                <p className="text-stone-400 text-sm">No equipment added yet.</p>
                <button onClick={openAdd} className="text-orange-600 text-sm font-semibold mt-1 hover:underline">
                  Add your first item
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {equipment.map(item => {
                  const available = item.total_quantity - item.out;
                  return (
                    <div key={item.id} className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-stone-900 text-sm">{item.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`text-xs font-medium ${available > 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {available} available
                          </span>
                          <span className="text-xs text-stone-400">{item.out} out · {item.total_quantity} total</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteItem(item)}
                          disabled={deletingId === item.id || item.out > 0}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title={item.out > 0 ? 'Cannot delete — items currently out' : 'Delete'}
                        >
                          {deletingId === item.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />
                          }
                        </button>
                        <button
                          onClick={() => openIssue(item)}
                          disabled={available === 0}
                          className="ml-1 flex items-center gap-1 text-xs font-semibold bg-orange-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <ArrowLeftRight className="w-3 h-3" />
                          Issue
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active loans */}
          <div>
            <h2 className="font-semibold text-stone-900 mb-3">
              Currently Out
              {loans.length > 0 && (
                <span className="ml-2 text-xs font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{loans.length}</span>
              )}
            </h2>
            {loans.length === 0 ? (
              <div className="bg-white border border-stone-200 rounded-xl p-6 text-center text-stone-400 text-sm">
                <Package className="w-7 h-7 mx-auto mb-2 opacity-40" />
                All equipment is in.
              </div>
            ) : (
              <div className="space-y-2">
                {loans.map(loan => (
                  <div key={loan.id} className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-stone-900 text-sm">
                        {loan.equipment_name}
                        {loan.quantity > 1 && <span className="text-stone-400 font-normal"> ×{loan.quantity}</span>}
                      </p>
                      <p className="text-stone-500 text-xs mt-0.5">{loan.member_name}</p>
                      <p className="text-stone-400 text-xs">{format(new Date(loan.lent_at), 'MMM d · h:mm a')}</p>
                      {loan.notes && <p className="text-stone-400 text-xs italic mt-0.5">"{loan.notes}"</p>}
                    </div>
                    <button
                      onClick={() => returnLoan(loan.id)}
                      disabled={returning === loan.id}
                      className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-3 py-2 rounded-lg transition-colors disabled:opacity-40"
                    >
                      {returning === loan.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Returned
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Add / Edit item modal ── */}
      {itemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !savingItem && setItemModal(null)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-stone-900">{itemModal.mode === 'add' ? 'Add Equipment Item' : 'Edit Item'}</h2>
              <button onClick={() => setItemModal(null)} className="p-1 hover:bg-stone-100 rounded-lg">
                <X className="w-5 h-5 text-stone-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide block mb-1.5">Item Name</label>
                <input
                  value={itemName}
                  onChange={e => setItemName(e.target.value)}
                  placeholder="e.g. Cricket Bat"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && saveItem()}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide block mb-2">Total Quantity</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setItemQty(q => Math.max(itemModal.item ? itemModal.item.out : 1, q - 1))}
                    className="w-10 h-10 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 font-bold text-xl flex items-center justify-center"
                  >−</button>
                  <span className="text-2xl font-bold text-stone-900 w-10 text-center">{itemQty}</span>
                  <button
                    onClick={() => setItemQty(q => q + 1)}
                    className="w-10 h-10 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 font-bold text-xl flex items-center justify-center"
                  >+</button>
                  {itemModal.mode === 'edit' && itemModal.item && itemModal.item.out > 0 && (
                    <span className="text-xs text-stone-400">min {itemModal.item.out} (in use)</span>
                  )}
                </div>
              </div>
              {itemError && (
                <p className="text-red-600 text-sm bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{itemError}</p>
              )}
              <button
                onClick={saveItem}
                disabled={savingItem}
                className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white font-semibold py-3 rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-40"
              >
                {savingItem ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {savingItem ? 'Saving…' : itemModal.mode === 'add' ? 'Add to Inventory' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Issue modal ── */}
      {issueItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !issuing && setIssueItem(null)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-stone-900">Issue Equipment</h2>
                <p className="text-stone-400 text-sm mt-0.5">{issueItem.name}</p>
              </div>
              <button onClick={() => setIssueItem(null)} className="p-1 hover:bg-stone-100 rounded-lg">
                <X className="w-5 h-5 text-stone-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Member search */}
              <div>
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide block mb-1.5">Member</label>
                {selectedMember ? (
                  <div className="flex items-center justify-between bg-orange-50 border-2 border-orange-400 rounded-xl px-4 py-3">
                    <div>
                      <p className="font-medium text-stone-900 text-sm">{selectedMember.full_name}</p>
                      {selectedMember.phone && <p className="text-stone-400 text-xs">{selectedMember.phone}</p>}
                    </div>
                    <button onClick={() => { setSelectedMember(null); setMemberSearch(''); }}>
                      <X className="w-4 h-4 text-stone-400 hover:text-stone-600" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      value={memberSearch}
                      onChange={e => { setMemberSearch(e.target.value); setShowDropdown(true); }}
                      onFocus={() => setShowDropdown(true)}
                      placeholder="Search by name or phone…"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    {showDropdown && memberResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg z-10 overflow-hidden max-h-48 overflow-y-auto">
                        {memberResults.map(m => (
                          <button
                            key={m.id}
                            onClick={() => { setSelectedMember(m); setShowDropdown(false); setMemberSearch(''); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 transition-colors text-left border-b border-stone-50 last:border-0"
                          >
                            <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center text-xs font-bold text-orange-700 shrink-0">
                              {m.full_name[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-stone-900 text-sm">{m.full_name}</p>
                              {m.phone && <p className="text-stone-400 text-xs">{m.phone}</p>}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {showDropdown && memberSearch.trim() && memberResults.length === 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg z-10 px-4 py-3 text-sm text-stone-400">
                        No members found.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div>
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide block mb-2">Quantity</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIssueQty(q => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 font-bold text-xl flex items-center justify-center"
                  >−</button>
                  <span className="text-2xl font-bold text-stone-900 w-10 text-center">{issueQty}</span>
                  <button
                    onClick={() => setIssueQty(q => Math.min(maxIssue, q + 1))}
                    disabled={issueQty >= maxIssue}
                    className="w-10 h-10 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 font-bold text-xl flex items-center justify-center disabled:opacity-30"
                  >+</button>
                  <span className="text-xs text-stone-400">{maxIssue} available</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide block mb-1.5">
                  Notes <span className="font-normal text-stone-400 normal-case">(optional)</span>
                </label>
                <input
                  value={issueNotes}
                  onChange={e => setIssueNotes(e.target.value)}
                  placeholder="e.g. slight damage on grip"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {issueError && (
                <p className="text-red-600 text-sm bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{issueError}</p>
              )}

              <button
                onClick={issueLoan}
                disabled={!selectedMember || issuing}
                className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white font-semibold py-3 rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-40"
              >
                {issuing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowLeftRight className="w-4 h-4" />}
                {issuing ? 'Issuing…' : selectedMember ? `Issue to ${selectedMember.full_name}` : 'Select a member first'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
