import { useState, useEffect } from 'react';
import { Package, ArrowLeftRight, Loader2, Search, Check, X } from 'lucide-react';
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

interface Equipment {
  id: string;
  name: string;
  total_quantity: number;
  out: number;
}

interface Loan {
  id: string;
  equipment_id: string;
  equipment_name: string;
  member_id: string;
  member_name: string;
  quantity: number;
  lent_at: string;
  notes: string | null;
}

interface Member {
  id: string;
  full_name: string;
  phone: string | null;
}

export function EquipmentPage() {
  const { user } = useAuth();
  const [activeSpace, setActiveSpace] = useState(SPACES[0].slug);
  const [spaceIds, setSpaceIds] = useState<Record<string, string>>({});
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Issue modal state
  const [issueItem, setIssueItem] = useState<Equipment | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [issueQty, setIssueQty] = useState(1);
  const [issueNotes, setIssueNotes] = useState('');
  const [issuing, setIssuing] = useState(false);
  const [returning, setReturning] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { if (Object.keys(spaceIds).length) loadSpace(); }, [activeSpace, spaceIds]);

  async function loadAll() {
    setLoading(true);
    const [spacesRes, membersRes] = await Promise.all([
      (supabase as any).from('spaces').select('id, slug').in('slug', SPACES.map(s => s.slug)),
      (supabase as any).from('profiles').select('id, full_name, phone').order('full_name'),
    ]);
    const ids: Record<string, string> = {};
    (spacesRes.data ?? []).forEach((s: any) => { ids[s.slug] = s.id; });
    setSpaceIds(ids);
    setMembers(membersRes.data ?? []);
    setLoading(false);
  }

  async function loadSpace() {
    const spaceId = spaceIds[activeSpace];
    if (!spaceId) return;

    const [eqRes, loansRes] = await Promise.all([
      (supabase as any).from('equipment').select('id, name, total_quantity').eq('space_id', spaceId).order('name'),
      (supabase as any)
        .from('equipment_loans')
        .select('id, equipment_id, quantity, lent_at, notes, member_id, profiles(full_name), equipment(name)')
        .is('returned_at', null)
        .eq('equipment.space_id', spaceId),
    ]);

    const rawLoans = loansRes.data ?? [];

    // Count how many of each equipment item is currently out
    const outCounts: Record<string, number> = {};
    rawLoans.forEach((l: any) => {
      if (l.equipment_id) outCounts[l.equipment_id] = (outCounts[l.equipment_id] ?? 0) + l.quantity;
    });

    const eqList: Equipment[] = (eqRes.data ?? []).map((e: any) => ({
      id: e.id,
      name: e.name,
      total_quantity: e.total_quantity,
      out: outCounts[e.id] ?? 0,
    }));
    setEquipment(eqList);

    const loanList: Loan[] = rawLoans
      .filter((l: any) => l.equipment?.name)
      .map((l: any) => ({
        id: l.id,
        equipment_id: l.equipment_id,
        equipment_name: l.equipment?.name ?? '',
        member_id: l.member_id,
        member_name: l.profiles?.full_name ?? 'Unknown',
        quantity: l.quantity,
        lent_at: l.lent_at,
        notes: l.notes,
      }));
    setLoans(loanList);
  }

  async function issueLoan() {
    if (!issueItem || !selectedMember) return;
    setIssuing(true);
    await (supabase as any).from('equipment_loans').insert({
      equipment_id: issueItem.id,
      member_id: selectedMember.id,
      quantity: issueQty,
      notes: issueNotes.trim() || null,
      lent_by: user!.id,
    });
    setIssueItem(null);
    setSelectedMember(null);
    setMemberSearch('');
    setIssueQty(1);
    setIssueNotes('');
    setIssuing(false);
    await loadSpace();
  }

  async function returnLoan(id: string) {
    setReturning(id);
    await (supabase as any).from('equipment_loans').update({ returned_at: new Date().toISOString() }).eq('id', id);
    setLoans(prev => prev.filter(l => l.id !== id));
    // Update out count
    const loan = loans.find(l => l.id === id);
    if (loan) {
      setEquipment(prev => prev.map(e =>
        e.id === loan.equipment_id ? { ...e, out: Math.max(0, e.out - loan.quantity) } : e
      ));
    }
    setReturning(null);
  }

  const memberResults = memberSearch.trim()
    ? members.filter(m =>
        m.full_name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        (m.phone ?? '').includes(memberSearch)
      ).slice(0, 6)
    : [];

  const maxIssue = issueItem ? issueItem.total_quantity - issueItem.out : 1;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Equipment</h1>
        <p className="text-stone-500 text-sm mt-1">Issue and track equipment loans to members.</p>
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
          {/* Equipment inventory */}
          <div>
            <h2 className="font-semibold text-stone-900 mb-3">Inventory</h2>
            <div className="space-y-2">
              {equipment.length === 0 ? (
                <div className="bg-white border border-stone-200 rounded-xl p-6 text-center text-stone-400 text-sm">
                  No equipment listed for this space.
                </div>
              ) : equipment.map(item => {
                const available = item.total_quantity - item.out;
                return (
                  <div key={item.id} className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-stone-900 text-sm">{item.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-xs font-medium ${available > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {available} available
                        </span>
                        <span className="text-xs text-stone-400">{item.out} out · {item.total_quantity} total</span>
                      </div>
                    </div>
                    <button
                      onClick={() => { setIssueItem(item); setIssueQty(1); }}
                      disabled={available === 0}
                      className="flex items-center gap-1.5 text-xs font-semibold bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      Issue
                    </button>
                  </div>
                );
              })}
            </div>
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

      {/* Issue modal */}
      {issueItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !issuing && setIssueItem(null)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-stone-900">Issue {issueItem.name}</h2>
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
                    <button onClick={() => { setSelectedMember(null); setMemberSearch(''); }} className="text-stone-400 hover:text-stone-600">
                      <X className="w-4 h-4" />
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
                  </div>
                )}
              </div>

              {/* Quantity */}
              {maxIssue > 1 && (
                <div>
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide block mb-1.5">Quantity</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIssueQty(q => Math.max(1, q - 1))}
                      className="w-9 h-9 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-100 font-bold text-lg flex items-center justify-center"
                    >−</button>
                    <span className="text-lg font-bold text-stone-900 w-6 text-center">{issueQty}</span>
                    <button
                      onClick={() => setIssueQty(q => Math.min(maxIssue, q + 1))}
                      className="w-9 h-9 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-100 font-bold text-lg flex items-center justify-center"
                    >+</button>
                    <span className="text-xs text-stone-400">max {maxIssue}</span>
                  </div>
                </div>
              )}

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

              <button
                onClick={issueLoan}
                disabled={!selectedMember || issuing}
                className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white font-semibold py-3 rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-40"
              >
                {issuing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowLeftRight className="w-4 h-4" />}
                {issuing ? 'Issuing…' : `Issue to ${selectedMember?.full_name ?? 'Member'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
