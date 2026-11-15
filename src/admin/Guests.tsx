import { useEffect, useMemo, useState } from 'react';
import { Download, Mail, MessageCircle, Phone, Search } from 'lucide-react';
import { toast } from 'sonner';
import { describeError, fetchCustomers, type Customer } from '@/lib/db';
import { PageTitle, guestWhatsapp, inputCls } from './shared';

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const csvCell = (v: unknown) => {
  const t = String(v ?? '');
  return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

/** Everyone who created a guest account on the website. */
const Guests = () => {
  const [items, setItems] = useState<Customer[] | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchCustomers()
      .then(setItems)
      .catch((e) => {
        toast.error(describeError(e));
        setItems([]);
      });
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (items ?? []).filter((c) => !q || [c.full_name, c.email, c.phone].some((v) => (v ?? '').toLowerCase().includes(q)));
  }, [items, query]);

  const exportCsv = () => {
    const rows = [
      ['Name', 'Email', 'Phone', 'Signed up with', 'Joined', 'Last sign-in', 'Requests', 'Last request'],
      ...shown.map((c) => [c.full_name, c.email, c.phone, c.provider, c.created_at, c.last_sign_in_at ?? '', c.booking_count, c.last_request_at ?? '']),
    ];
    const url = URL.createObjectURL(new Blob([rows.map((r) => r.map(csvCell).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' }));
    Object.assign(document.createElement('a'), { href: url, download: `elegance-guests-${new Date().toISOString().slice(0, 10)}.csv` }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageTitle
        title="Guests"
        subtitle="Guest accounts created on the website, newest first."
        action={
          <div className="flex gap-2">
            <label className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, email, phone" className={`${inputCls} w-56 pl-9`} />
            </label>
            <button type="button" onClick={exportCsv} disabled={!shown.length} className="flex items-center gap-2 border border-ink/15 bg-white px-3.5 py-2 text-xs hover:border-ink disabled:opacity-40"><Download size={13} /> Export CSV</button>
          </div>
        }
      />
      {items === null ? (
        <p className="text-sm text-ink/50">Loading…</p>
      ) : (
        <div className="overflow-x-auto border border-ink/10 bg-white">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-ink/10 text-[10px] uppercase tracking-[0.18em] text-ink/45">
              <tr>
                <th className="p-4">Guest</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Joined</th>
                <th className="p-4">Last sign-in</th>
                <th className="p-4 text-right">Requests</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {shown.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-ink/50">{items.length ? 'Nobody matches that search.' : 'No guest accounts yet.'}</td></tr>
              )}
              {shown.map((c) => {
                const wa = guestWhatsapp(c.phone, `Hello ${c.full_name.split(' ')[0] || ''}, this is The Elegance Hotel. `);
                return (
                  <tr key={c.id} className="align-top">
                    <td className="p-4"><p className="font-semibold">{c.full_name || 'No name'}</p><p className="text-xs capitalize text-ink/45">via {c.provider}</p></td>
                    <td className="space-y-1 p-4 text-xs">
                      {c.phone ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-ink/70"><Phone size={11} /> {c.phone}</a>
                          {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800"><MessageCircle size={11} /> WhatsApp</a>}
                        </div>
                      ) : <p className="text-ink/35">No phone yet</p>}
                      {c.email && <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-ink/55"><Mail size={11} /> {c.email}</a>}
                    </td>
                    <td className="p-4 text-xs text-ink/55">{when(c.created_at)}</td>
                    <td className="p-4 text-xs text-ink/55">{when(c.last_sign_in_at)}</td>
                    <td className="p-4 text-right font-semibold">{c.booking_count}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Guests;
