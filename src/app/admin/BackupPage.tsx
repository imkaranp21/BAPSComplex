import { useState, useRef } from 'react';
import { Download, FileJson, FileSpreadsheet, Loader2, CheckCircle, Upload, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';

type Status = 'idle' | 'loading' | 'done' | 'error';

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function toCSV(rows: Record<string, any>[]): string {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    const s = v == null ? '' : String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  return [
    headers.join(','),
    ...rows.map(r => headers.map(h => escape(r[h])).join(',')),
  ].join('\n');
}

export function BackupPage() {
  const [jsonStatus, setJsonStatus]         = useState<Status>('idle');
  const [membersStatus, setMembersStatus]   = useState<Status>('idle');
  const [bookingsStatus, setBookingsStatus] = useState<Status>('idle');

  // Restore state
  const fileInputRef                        = useRef<HTMLInputElement>(null);
  const [restoreFile, setRestoreFile]       = useState<string | null>(null);
  const [restoreInfo, setRestoreInfo]       = useState<{ exported_at: string; tables: Record<string, any[]> } | null>(null);
  const [restoreError, setRestoreError]     = useState('');
  const [restoreConfirm, setRestoreConfirm] = useState(false);
  const [restoreStatus, setRestoreStatus]   = useState<Status>('idle');
  const [restoreLog, setRestoreLog]         = useState<string[]>([]);

  const stamp = format(new Date(), 'yyyy-MM-dd');

  async function downloadFullBackup() {
    setJsonStatus('loading');
    try {
      const [
        profilesRes,
        bookingsRes,
        spacesRes,
        unitsRes,
        equipRes,
        loansRes,
        walkinsRes,
        announcementsRes,
        closuresRes,
      ] = await Promise.all([
        (supabase as any).from('profiles').select('*').order('created_at'),
        (supabase as any).from('bookings').select('*').order('date').order('start_time'),
        (supabase as any).from('spaces').select('*').order('sort_order'),
        (supabase as any).from('space_units').select('*'),
        (supabase as any).from('equipment').select('*'),
        (supabase as any).from('equipment_loans').select('*').order('lent_at'),
        (supabase as any).from('walk_ins').select('*').order('checked_in_at'),
        (supabase as any).from('announcements').select('*').order('created_at'),
        (supabase as any).from('space_closures').select('*').order('date'),
      ]);

      const backup = {
        exported_at: new Date().toISOString(),
        project: 'Yogi Sports Complex · Nakuru',
        version: 1,
        tables: {
          profiles:      profilesRes.data     ?? [],
          bookings:      bookingsRes.data      ?? [],
          spaces:        spacesRes.data        ?? [],
          space_units:   unitsRes.data         ?? [],
          equipment:     equipRes.data         ?? [],
          equipment_loans: loansRes.data       ?? [],
          walk_ins:      walkinsRes.data       ?? [],
          announcements: announcementsRes.data ?? [],
          space_closures: closuresRes.data     ?? [],
        },
      };

      downloadFile(
        JSON.stringify(backup, null, 2),
        `yogi-sports-backup-${stamp}.json`,
        'application/json'
      );
      setJsonStatus('done');
    } catch {
      setJsonStatus('error');
    }
    setTimeout(() => setJsonStatus('idle'), 4000);
  }

  async function downloadMembersCSV() {
    setMembersStatus('loading');
    try {
      const { data } = await (supabase as any)
        .from('profiles')
        .select('full_name, phone, membership_group, membership_tier, membership_status, created_at')
        .order('full_name');
      downloadFile(toCSV(data ?? []), `yogi-members-${stamp}.csv`, 'text/csv');
      setMembersStatus('done');
    } catch {
      setMembersStatus('error');
    }
    setTimeout(() => setMembersStatus('idle'), 4000);
  }

  async function downloadBookingsCSV() {
    setBookingsStatus('loading');
    try {
      const { data } = await (supabase as any)
        .from('bookings')
        .select('date, start_time, end_time, status, profiles(full_name), spaces(name), space_units(name)')
        .order('date', { ascending: false })
        .order('start_time');

      const flat = (data ?? []).map((b: any) => ({
        date:       b.date,
        start_time: b.start_time,
        end_time:   b.end_time,
        status:     b.status,
        member:     b.profiles?.full_name ?? '',
        space:      b.spaces?.name ?? '',
        unit:       b.space_units?.name ?? '',
      }));

      downloadFile(toCSV(flat), `yogi-bookings-${stamp}.csv`, 'text/csv');
      setBookingsStatus('done');
    } catch {
      setBookingsStatus('error');
    }
    setTimeout(() => setBookingsStatus('idle'), 4000);
  }

  function StatusIcon({ status }: { status: Status }) {
    if (status === 'loading') return <Loader2 className="w-4 h-4 animate-spin" />;
    if (status === 'done')    return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    return <Download className="w-4 h-4" />;
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setRestoreError('');
    setRestoreInfo(null);
    setRestoreConfirm(false);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!parsed.tables || !parsed.exported_at) throw new Error('Not a valid Yogi Sports backup file.');
        setRestoreInfo(parsed);
        setRestoreFile(file.name);
      } catch (err: any) {
        setRestoreError(err.message ?? 'Invalid file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  const restorableTables = [
    { key: 'announcements',   table: 'announcements' },
    { key: 'space_closures',  table: 'space_closures' },
    { key: 'equipment',       table: 'equipment' },
    { key: 'equipment_loans', table: 'equipment_loans' },
    { key: 'walk_ins',        table: 'walk_ins' },
    { key: 'bookings',        table: 'bookings' },
  ];

  async function runRestore() {
    if (!restoreInfo) return;
    setRestoreStatus('loading');
    setRestoreLog([]);
    const log: string[] = [];

    for (const { key, table } of restorableTables) {
      const rows = restoreInfo.tables[key];
      if (!rows || rows.length === 0) { log.push(`${table}: skipped (empty)`); continue; }
      const { error } = await (supabase as any).from(table).upsert(rows, { onConflict: 'id' });
      if (error) log.push(`${table}: ⚠ ${error.message}`);
      else       log.push(`${table}: ✓ ${rows.length} rows restored`);
      setRestoreLog([...log]);
    }

    setRestoreStatus('done');
    setRestoreLog(log);
  }

  const Card = ({
    icon, title, description, label, status, onClick,
  }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    label: string;
    status: Status;
    onClick: () => void;
  }) => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-start justify-between gap-6">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
          {icon}
        </div>
        <div>
          <p className="font-black text-white text-sm tracking-tight">{title}</p>
          <p className="text-zinc-500 text-xs mt-1 leading-relaxed max-w-xs">{description}</p>
        </div>
      </div>
      <button
        onClick={onClick}
        disabled={status === 'loading'}
        className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all disabled:opacity-40 ${
          status === 'done'
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            : status === 'error'
            ? 'bg-red-500/10 border border-red-500/20 text-red-400'
            : 'bg-violet-600 hover:bg-violet-500 text-white'
        }`}
      >
        <StatusIcon status={status} />
        {status === 'loading' ? 'Exporting…' : status === 'done' ? 'Downloaded' : status === 'error' ? 'Failed' : label}
      </button>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white tracking-tight">Backup</h1>
        <p className="text-zinc-500 text-sm mt-1">Download your data to keep a copy outside of Supabase.</p>
      </div>

      {/* Tip */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-8 flex gap-4 items-start">
        <span className="text-2xl leading-none mt-0.5">💡</span>
        <div>
          <p className="text-white font-black text-sm mb-1">Where to save your backup</p>
          <p className="text-zinc-500 text-xs leading-relaxed">
            Once downloaded, move the file to <span className="text-zinc-300">Google Drive</span>, <span className="text-zinc-300">WhatsApp "Saved Messages"</span>, or email it to yourself.
            Do this at least once a month — or any time you make big changes to members or data.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <Card
          icon={<FileJson className="w-5 h-5 text-violet-400" />}
          title="Full Backup (JSON)"
          description="Everything — members, bookings, equipment, walk-ins, announcements, closures. Use this to restore the entire database."
          label="Download"
          status={jsonStatus}
          onClick={downloadFullBackup}
        />
        <Card
          icon={<FileSpreadsheet className="w-5 h-5 text-emerald-400" />}
          title="Members List (CSV)"
          description="All member profiles in a spreadsheet you can open in Excel or Google Sheets."
          label="Download"
          status={membersStatus}
          onClick={downloadMembersCSV}
        />
        <Card
          icon={<FileSpreadsheet className="w-5 h-5 text-amber-400" />}
          title="Bookings History (CSV)"
          description="All booking records with member name, space, date, and time — sorted newest first."
          label="Download"
          status={bookingsStatus}
          onClick={downloadBookingsCSV}
        />
      </div>

      {/* Restore section */}
      <div className="mt-10">
        <h2 className="text-lg font-black text-white tracking-tight mb-1">Restore from Backup</h2>
        <p className="text-zinc-500 text-xs mb-5 leading-relaxed">
          Upload a <span className="text-zinc-300">.json</span> backup file to restore your data.
          Existing records with the same ID will be updated; new records will be inserted.
          Profiles and spaces are <span className="text-zinc-300">not overwritten</span> — only operational data.
        </p>

        {/* File picker */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleFileSelect}
        />
        <button
          onClick={() => { fileInputRef.current?.click(); }}
          disabled={restoreStatus === 'loading'}
          className="flex items-center gap-3 px-5 py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-300 text-sm font-bold transition-all disabled:opacity-40"
        >
          <Upload className="w-4 h-4 text-violet-400" />
          {restoreFile ? restoreFile : 'Choose backup file…'}
        </button>

        {/* Parse error */}
        {restoreError && (
          <div className="mt-3 flex items-center gap-2 text-red-400 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {restoreError}
          </div>
        )}

        {/* File preview */}
        {restoreInfo && restoreStatus !== 'loading' && restoreStatus !== 'done' && (
          <div className="mt-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-zinc-400 text-xs font-bold mb-3 tracking-widest uppercase">File contents</p>
            <p className="text-zinc-600 text-xs mb-3">
              Exported {format(new Date(restoreInfo.exported_at), 'MMMM d, yyyy · h:mm a')}
            </p>
            <div className="space-y-1">
              {restorableTables.map(({ key, table }) => {
                const count = restoreInfo.tables[key]?.length ?? 0;
                return (
                  <div key={key} className="flex justify-between text-xs">
                    <span className="text-zinc-500">{table}</span>
                    <span className={count > 0 ? 'text-white font-bold' : 'text-zinc-700'}>{count} rows</span>
                  </div>
                );
              })}
            </div>
            {!restoreConfirm ? (
              <button
                onClick={() => setRestoreConfirm(true)}
                className="mt-5 w-full bg-violet-600 hover:bg-violet-500 text-white font-black text-sm py-3 rounded-xl transition-colors tracking-wide"
              >
                Restore Data
              </button>
            ) : (
              <div className="mt-5 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <p className="text-amber-300 text-xs font-black mb-1">Are you sure?</p>
                <p className="text-amber-400/70 text-xs mb-4 leading-relaxed">
                  This will upsert all rows above into the live database. Existing records will be overwritten.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRestoreConfirm(false)}
                    className="flex-1 py-2 rounded-xl bg-zinc-800 text-zinc-400 text-xs font-bold hover:bg-zinc-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={runRestore}
                    className="flex-1 py-2 rounded-xl bg-amber-500 text-black text-xs font-black hover:bg-amber-400 transition-colors"
                  >
                    Yes, Restore
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Progress log */}
        {(restoreStatus === 'loading' || restoreStatus === 'done') && (
          <div className="mt-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              {restoreStatus === 'loading'
                ? <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                : <CheckCircle className="w-4 h-4 text-emerald-400" />}
              <p className="text-xs font-black text-white tracking-widest uppercase">
                {restoreStatus === 'loading' ? 'Restoring…' : 'Restore Complete'}
              </p>
            </div>
            <div className="space-y-1">
              {restoreLog.map((line, i) => (
                <p key={i} className={`text-xs font-mono ${line.includes('⚠') ? 'text-amber-400' : 'text-zinc-400'}`}>
                  {line}
                </p>
              ))}
            </div>
            {restoreStatus === 'done' && (
              <button
                onClick={() => {
                  setRestoreFile(null);
                  setRestoreInfo(null);
                  setRestoreConfirm(false);
                  setRestoreStatus('idle');
                  setRestoreLog([]);
                }}
                className="mt-4 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                ← Restore another file
              </button>
            )}
          </div>
        )}
      </div>

      <p className="text-zinc-700 text-xs text-center mt-8">
        Today's date: {format(new Date(), 'EEEE, MMMM d yyyy')}
      </p>
    </div>
  );
}
