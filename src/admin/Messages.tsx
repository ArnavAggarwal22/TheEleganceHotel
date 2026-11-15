import { useEffect, useMemo, useState } from 'react';
import { Mail, MessageCircle, Phone, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { describeError, fetchEnquiries, updateEnquiry, type Enquiry, type EnquiryStatus } from '@/lib/db';
import { PageTitle, guestWhatsapp } from './shared';

const KIND: Record<Enquiry['kind'], string> = { contact: 'Question', event: 'Event / banquet', corporate: 'Corporate' };
const STATUS: Record<EnquiryStatus, string> = { new: 'New', in_progress: 'Following up', closed: 'Done' };
const STATUS_STYLE: Record<EnquiryStatus, string> = {
  new: 'bg-gold-pale text-ink',
  in_progress: 'bg-sky-100 text-sky-900',
  closed: 'bg-ink/10 text-ink/60',
};

/** Contact-form messages from the website. */
const Messages = () => {
  const [items, setItems] = useState<Enquiry[] | null>(null);
  const [filter, setFilter] = useState<'open' | 'all'>('open');

  const load = async () => {
    try {
      setItems(await fetchEnquiries());
    } catch (e) {
      toast.error(describeError(e));
      setItems([]);
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const change = async (id: string, patch: { status?: EnquiryStatus; admin_notes?: string | null }) => {
    setItems((list) => list?.map((e) => (e.id === id ? { ...e, ...patch } : e)) ?? null);
    try {
      await updateEnquiry(id, patch);
    } catch (e) {
      toast.error((e as Error).message);
      void load();
    }
  };

  const shown = useMemo(() => (items ?? []).filter((e) => filter === 'all' || e.status !== 'closed'), [items, filter]);

  return (
    <div>
      <PageTitle
        title="Messages"
        subtitle={`From the website's contact form. ${(items ?? []).filter((e) => e.status !== 'closed').length} open.`}
        action={
          <div className="flex gap-2">
            {(['open', 'all'] as const).map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)} className={`border px-3.5 py-2 text-xs font-semibold ${filter === f ? 'border-ink bg-ink text-ivory' : 'border-ink/15 bg-white text-ink/60'}`}>
                {f === 'open' ? 'Open' : 'All'}
              </button>
            ))}
            <button type="button" onClick={() => void load()} className="flex items-center gap-2 border border-ink/15 bg-white px-3.5 py-2 text-xs hover:border-ink"><RefreshCw size={13} /> Refresh</button>
          </div>
        }
      />
      {items === null ? (
        <p className="text-sm text-ink/50">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="border border-dashed border-ink/20 bg-white p-10 text-center text-sm text-ink/50">No messages here.</p>
      ) : (
        <ul className="space-y-4">
          {shown.map((e) => {
            const wa = guestWhatsapp(e.phone, `Hello ${e.name.split(' ')[0]}, this is The Elegance Hotel replying to your message. `);
            return (
              <li key={e.id} className="space-y-3 border border-ink/10 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{e.name} <span className="ml-2 bg-ivory-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-ink/60">{KIND[e.kind]}</span></p>
                    <p className="text-xs text-ink/45">{new Date(e.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  </div>
                  <select value={e.status} onChange={(ev) => void change(e.id, { status: ev.target.value as EnquiryStatus })} className={`border-0 px-2.5 py-1.5 text-xs font-semibold ${STATUS_STYLE[e.status]}`} aria-label="Status">
                    {(Object.keys(STATUS) as EnquiryStatus[]).map((s) => <option key={s} value={s}>{STATUS[s]}</option>)}
                  </select>
                </div>
                {e.message && <p className="whitespace-pre-wrap text-sm text-ink/75">{e.message}</p>}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <a href={`tel:${e.phone}`} className="flex items-center gap-1 text-ink/60 hover:text-ink"><Phone size={12} /> {e.phone}</a>
                  {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800 hover:bg-emerald-100"><MessageCircle size={12} /> WhatsApp</a>}
                  {e.email && <a href={`mailto:${e.email}`} className="flex items-center gap-1 text-ink/60 hover:text-ink"><Mail size={12} /> {e.email}</a>}
                </div>
                <textarea
                  defaultValue={e.admin_notes ?? ''}
                  onBlur={(ev) => {
                    const v = ev.target.value.trim() || null;
                    if (v !== (e.admin_notes ?? null)) void change(e.id, { admin_notes: v });
                  }}
                  rows={2}
                  placeholder="Team notes (saved when you click away)"
                  className="w-full border border-ink/10 bg-ivory-100 px-3 py-2 text-sm outline-none focus:border-gold"
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Messages;
