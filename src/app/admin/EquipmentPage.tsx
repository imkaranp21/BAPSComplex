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

interface EquipmentItem { id: string; name: string; total_quantity: number; out: number }
interface Loan { id: string; equipment_id: string; equipment_name: string; member_id: string | null; member_name: string; quantity: number; lent_at: string; notes: string | null }
interface Member { id: string; full_name: string; phone: string | null; membership_status: string }

const modalFieldClass = 'w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500';
const modalLabelClass = 'text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] block mb-1.5';

export function EquipmentPage() {
  const { user } = useAuth();
  const [activeSpace, setActiveSpace] = useState(SPACES[0].slug);
  const [spaceIds, setSpaceIds] = useState<Record<string, string>>({});
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [spaceLoading, setSpaceLoading] = useState(false);

  const [itemModal, setItemModal] = useState<{ mode: 'add' | 'edit'; item?: EquipmentItem } | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [savingItem, setSavingItem] = useState(false);
  const [itemError, setItemError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [issueItem, setIssueItem] = useState<EquipmentItem | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [issueQty, setIssueQty] = useState(1);
  const [issueNotes, setIssueNotes] = useState('');
  const [issuing, setIssuing] = useState(false);
  const [issueError, setIssueError] = useState('');
  const [returning, setReturning] = useState<string | null>(null);

  useEffect(() => { init(); }, []);
  useEffect(() => { if (Object.keys(spaceIds).length) loadSpace(activeSpace); }, [activeSpace, spaceIds]);

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

    const { data: eqData } = await (supabase as any).from('equipment').select('id, name, total_quantity').eq('space_id', spaceId).order('name');
    const eqList: { id: string; name: string; total_quantity: number }[] = eqData ?? [];
    const eqIds = eqList.map(e => e.id);
    const eqNameMap: Record<string, string> = {};
    eqList.forEach(e => { eqNameMap[e.id] = e.name; });

    let rawLoans: any[] = [];
    if (eqIds.length > 0) {
      const { data: loansData } = await (supabase as any).from('equipment_loans')
        .select('id, equipment_id, member_id, quantity, lent_at, notes')
        .in('equipment_id', eqIds).is('returned_at', null).order('lent_at', { ascending: false });
      rawLoans = loansData ?? [];
    }

    const outCounts: Record<string, number> = {};
    rawLoans.forEach((l: any) => { outCounts[l.equipment_id] = (outCounts[l.equipment_id] ?? 0) + l.quantity; });

    setEquipment(eqList.map(e => ({ id: e.id, name: e.name, total_quantity: e.total_quantity, out: outCounts[e.id] ?? 0 })));
    setLoans(rawLoans.map((l: any) => ({
      id: l.id, equipment_id: l.equipment_id, equipment_name: eqNameMap[l.equipment_id] ?? 'Unknown item',
      member_id: l.member_id, member_name: members.find(m => m.id === l.member_id)?.full_name ?? 'Unknown member',
      quantity: l.quantity, lent_at: l.lent_at, notes: l.notes,
    })));
    setSpaceLoading(false);
  }

  function openAdd() { setItemName(''); setItemQty(1); setItemError(''); setItemModal({ mode: 'add' }); }
  function openEdit(item: EquipmentItem) { setItemName(item.name); setItemQty(item.total_quantity); setItemError(''); setItemModal({ mode: 'edit', item }); }

  async function saveItem() {
    if (!itemName.trim()) { setItemError('Please enter an item name.'); return; }
    if (itemQty < 1) { setItemError('Quantity must be at least 1.'); return; }
    setSavingItem(true); setItemError('');
    if (itemModal?.mode === 'edit' && itemModal.item) {
      const { error } = await (supabase as any).from('equipment').update({ name: itemName.trim(), total_quantity: itemQty }).eq('id', itemModal.item.id);
      if (error) { setItemError(error.message); setSavingItem(false); return; }
    } else {
      const { error } = await (supabase as any).from('equipment').insert({ space_id: spaceIds[activeSpace], name: itemName.trim(), total_quantity: itemQty });
      if (error) { setItemError(error.message); setSavingItem(false); return; }
    }
    setSavingItem(false); setItemModal(null); await loadSpace(activeSpace);
  }

  async function deleteItem(item: EquipmentItem) {
    setDeletingId(item.id);
    await (supabase as any).from('equipment').delete().eq('id', item.id);
    setEquipment(prev => prev.filter(e => e.id !== item.id));
    setDeletingId(null);
  }

  function openIssue(item: EquipmentItem) { setIssueItem(item); setSelectedMember(null); setMemberSearch(''); setIssueQty(1); setIssueNotes(''); setIssueError(''); }

  async function issueLoan() {
    if (!issueItem || !selectedMember) return;
    setIssuing(true); setIssueError('');
    const { error } = await (supabase as any).from('equipment_loans').insert({
      equipment_id: issueItem.id, member_id: selectedMember.id, quantity: issueQty,
      notes: issueNotes.trim() || null, lent_by: user!.id,
    });
    if (error) { setIssueError(error.message); setIssuing(false); return; }
    setIssueItem(null); setIssuing(false); await loadSpace(activeSpace);
  }

  async function returnLoan(id: string) {
    setReturning(id);
    await (supabase as any).from('equipment_loans').update({ returned_at: new Date().toISOString() }).eq('id', id);
    const loan = loans.find(l => l.id === id);
    setLoans(prev => prev.filter(l => l.id !== id));
    if (loan) setEquipment(prev => prev.map(e => e.id === loan.equipment_id ? { ...e, out: Math.max(0, e.out - loan.quantity) } : e));
    setReturning(null);
  }

  const memberResults = memberSearch.trim()
    ? members.filter(m => m.membership_status === 'active' && (m.full_name.toLowerCase().includes(memberSearch.toLowerCase()) || (m.phone ?? '').includes(memberSearch))).slice(0, 6)
    : [];

  const maxIssue = issueItem ? issueItem.total_quantity - issueItem.out : 1;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white tracking-tight">Equipment</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage inventory and track loans to members.</p>
      </div>

      {/* Space tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {SPACES.map(s => (
          <button
            key={s.slug}
            onClick={() => setActiveSpace(s.slug)}
            className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all border ${
              activeSpace === s.slug
                ? 'bg-orange-500 text-black border-orange-500'
                : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-white'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-orange-500 animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inventory */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-black text-white text-sm tracking-tight">Inventory</h2>
              <button onClick={openAdd} className="flex items-center gap-1.5 text-xs font-bold bg-orange-500 hover:bg-orange-400 text-black px-3 py-1.5 rounded-lg transition-colors tracking-wide">
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            {spaceLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-orange-500 animate-spin" /></div>
            ) : equipment.length === 0 ? (
              <div className="bg-zinc-900 border border-dashed border-zinc-700 rounded-xl p-8 text-center">
                <Package className="w-7 h-7 text-zinc-700 mx-auto mb-2" />
                <p className="text-zinc-600 text-sm">No equipment added yet.</p>
                <button onClick={openAdd} className="text-orange-500 text-sm font-bold mt-1 hover:text-orange-400">Add your first item</button>
              </div>
            ) : (
              <div className="space-y-2">
                {equipment.map(item => {
                  const available = item.total_quantity - item.out;
                  return (
                    <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm">{item.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`text-xs font-bold ${available > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{available} available</span>
                          <span className="text-xs text-zinc-600">{item.out} out · {item.total_quantity} total</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg text-zinc-600 hover:text-orange-400 hover:bg-orange-500/10 transition-all" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteItem(item)}
                          disabled={deletingId === item.id || item.out > 0}
                          className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          title={item.out > 0 ? 'Cannot delete — items currently out' : 'Delete'}
                        >
                          {deletingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => openIssue(item)}
                          disabled={available === 0}
                          className="ml-1 flex items-center gap-1 text-xs font-bold bg-orange-500 hover:bg-orange-400 text-black px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed tracking-wide"
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
            <h2 className="font-black text-white text-sm tracking-tight mb-3">
              Currently Out
              {loans.length > 0 && (
                <span className="ml-2 text-[10px] font-black bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full">{loans.length}</span>
              )}
            </h2>
            {loans.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center text-zinc-600 text-sm">
                <Package className="w-7 h-7 mx-auto mb-2 opacity-40" />
                All equipment is in.
              </div>
            ) : (
              <div className="space-y-2">
                {loans.map(loan => (
                  <div key={loan.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-white text-sm">
                        {loan.equipment_name}
                        {loan.quantity > 1 && <span className="text-zinc-500 font-normal"> ×{loan.quantity}</span>}
                      </p>
                      <p className="text-zinc-500 text-xs mt-0.5">{loan.member_name}</p>
                      <p className="text-zinc-600 text-xs">{format(new Date(loan.lent_at), 'MMM d · h:mm a')}</p>
                      {loan.notes && <p className="text-zinc-600 text-xs italic mt-0.5">"{loan.notes}"</p>}
                    </div>
                    <button
                      onClick={() => returnLoan(loan.id)}
                      disabled={returning === loan.id}
                      className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-3 py-2 rounded-lg transition-all disabled:opacity-40"
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

      {/* Add / Edit item modal */}
      {itemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !savingItem && setItemModal(null)} />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black text-white tracking-tight">{itemModal.mode === 'add' ? 'Add Equipment Item' : 'Edit Item'}</h2>
              <button onClick={() => setItemModal(null)} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={modalLabelClass}>Item Name</label>
                <input value={itemName} onChange={e => setItemName(e.target.value)}
                  placeholder="e.g. Cricket Bat" className={modalFieldClass}
                  autoFocus onKeyDown={e => e.key === 'Enter' && saveItem()} />
              </div>
              <div>
                <label className={modalLabelClass}>Total Quantity</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setItemQty(q => Math.max(itemModal.item ? itemModal.item.out : 1, q - 1))}
                    className="w-10 h-10 rounded-xl border border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700 font-bold text-xl flex items-center justify-center">−</button>
                  <span className="text-2xl font-black text-white w-10 text-center">{itemQty}</span>
                  <button onClick={() => setItemQty(q => q + 1)}
                    className="w-10 h-10 rounded-xl border border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700 font-bold text-xl flex items-center justify-center">+</button>
                  {itemModal.mode === 'edit' && itemModal.item && itemModal.item.out > 0 && (
                    <span className="text-xs text-zinc-600">min {itemModal.item.out} (in use)</span>
                  )}
                </div>
              </div>
              {itemError && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{itemError}</p>}
              <button onClick={saveItem} disabled={savingItem}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-black font-bold py-3.5 rounded-xl transition-colors disabled:opacity-40">
                {savingItem ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {savingItem ? 'Saving…' : itemModal.mode === 'add' ? 'Add to Inventory' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issue modal */}
      {issueItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !issuing && setIssueItem(null)} />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-black text-white tracking-tight">Issue Equipment</h2>
                <p className="text-zinc-500 text-sm mt-0.5">{issueItem.name}</p>
              </div>
              <button onClick={() => setIssueItem(null)} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={modalLabelClass}>Member</label>
                {selectedMember ? (
                  <div className="flex items-center justify-between bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-3">
                    <div>
                      <p className="font-bold text-white text-sm">{selectedMember.full_name}</p>
                      {selectedMember.phone && <p className="text-zinc-500 text-xs">{selectedMember.phone}</p>}
                    </div>
                    <button onClick={() => { setSelectedMember(null); setMemberSearch(''); }}>
                      <X className="w-4 h-4 text-zinc-500 hover:text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input
                      value={memberSearch}
                      onChange={e => { setMemberSearch(e.target.value); setShowDropdown(true); }}
                      onFocus={() => setShowDropdown(true)}
                      placeholder="Search by name or phone…"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                    {showDropdown && memberResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl z-10 overflow-hidden max-h-48 overflow-y-auto">
                        {memberResults.map(m => (
                          <button
                            key={m.id}
                            onClick={() => { setSelectedMember(m); setShowDropdown(false); setMemberSearch(''); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800 transition-colors text-left border-b border-zinc-800 last:border-0"
                          >
                            <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-xs font-black text-black shrink-0">
                              {m.full_name[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm">{m.full_name}</p>
                              {m.phone && <p className="text-zinc-500 text-xs">{m.phone}</p>}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {showDropdown && memberSearch.trim() && memberResults.length === 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl z-10 px-4 py-3 text-xs text-zinc-600">
                        No members found.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className={modalLabelClass}>Quantity</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setIssueQty(q => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-xl border border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700 font-bold text-xl flex items-center justify-center">−</button>
                  <span className="text-2xl font-black text-white w-10 text-center">{issueQty}</span>
                  <button onClick={() => setIssueQty(q => Math.min(maxIssue, q + 1))} disabled={issueQty >= maxIssue}
                    className="w-10 h-10 rounded-xl border border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700 font-bold text-xl flex items-center justify-center disabled:opacity-30">+</button>
                  <span className="text-xs text-zinc-600">{maxIssue} available</span>
                </div>
              </div>

              <div>
                <label className={modalLabelClass}>Notes <span className="text-zinc-700 normal-case font-normal tracking-normal">(optional)</span></label>
                <input value={issueNotes} onChange={e => setIssueNotes(e.target.value)}
                  placeholder="e.g. slight damage on grip" className={modalFieldClass} />
              </div>

              {issueError && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{issueError}</p>}

              <button onClick={issueLoan} disabled={!selectedMember || issuing}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-black font-bold py-3.5 rounded-xl transition-colors disabled:opacity-40">
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
