import { useState, useEffect } from 'react';
import { MessageSquare, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

interface FeedbackItem {
  id: string;
  member_name: string;
  category: string;
  message: string;
  created_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  suggestion: '💡 Suggestion',
  bug:        '🐛 Bug',
  feature:    '✨ Feature',
  other:      '💬 Other',
};

const CATEGORY_COLORS: Record<string, string> = {
  suggestion: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
  bug:        'bg-red-500/10 text-red-300 border-red-500/20',
  feature:    'bg-amber-500/10 text-amber-300 border-amber-500/20',
  other:      'bg-zinc-800 text-zinc-400 border-zinc-700',
};

export function FeedbackPage() {
  const [items, setItems]     = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await (supabase as any)
      .from('feedback')
      .select('id, member_name, category, message, created_at')
      .order('created_at', { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  }

  async function deleteItem(id: string) {
    setDeleting(id);
    await (supabase as any).from('feedback').delete().eq('id', id);
    setItems(prev => prev.filter(i => i.id !== id));
    setDeleting(null);
  }

  const filtered = filter === 'all' ? items : items.filter(i => i.category === filter);

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
        <h1 className="text-2xl font-black text-white tracking-tight">Feedback</h1>
        <p className="text-zinc-500 text-sm mt-1">{items.length} submission{items.length !== 1 ? 's' : ''} from members.</p>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'suggestion', 'feature', 'bug', 'other'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all capitalize ${
              filter === f
                ? 'bg-violet-600 text-white'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white'
            }`}
          >
            {f === 'all' ? `All (${items.length})` : `${CATEGORY_LABELS[f]} (${items.filter(i => i.category === f).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-16 flex flex-col items-center gap-3">
          <MessageSquare className="w-8 h-8 text-zinc-700" />
          <p className="text-zinc-600 text-sm">No feedback yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0">
                    {item.member_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-sm truncate">{item.member_name}</p>
                    <p className="text-zinc-600 text-xs">{format(new Date(item.created_at), 'MMM d, yyyy · h:mm a')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border ${CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS.other}`}>
                    {CATEGORY_LABELS[item.category] ?? item.category}
                  </span>
                  <button
                    onClick={() => deleteItem(item.id)}
                    disabled={deleting === item.id}
                    className="p-1.5 rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40"
                  >
                    {deleting === item.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />
                    }
                  </button>
                </div>
              </div>
              <p className="mt-3 text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{item.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
