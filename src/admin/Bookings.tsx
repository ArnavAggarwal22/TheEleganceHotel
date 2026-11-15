import { useEffect, useMemo, useState } from 'react';
import { Mail, MessageCircle, Pencil, Phone, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatINR } from '@/data/hotel';
import { addDays, nightsBetween, prettyDate, today } from '@/lib/dates';
import {
  BOOKING_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES, SOURCES, createBooking, deleteBooking, describeError,
  fetchBookings, fetchRoomTypes, updateBooking,
  type Booking, type BookingInput, type BookingStatus, type RoomTypeRow,
} from '@/lib/db';
import { gstRateFor } from '@/lib/useLiveRooms';
import { normalizePhone } from '@/lib/phone';
import {
  METHOD_LABEL, PAYMENT_LABEL, PageTitle, SOURCE_LABEL, STATUS_LABEL, STATUS_STYLE, guestWhatsapp, inputCls, labelCls,
} from './shared';

type View = 'open' | 'requests' | 'upcoming' | 'inhouse' | 'past' | 'cancelled' | 'all';

const VIEWS: { key: View; label: string; match: (b: Booking) => boolean }[] = [
  { key: 'open', label: 'Needs action', match: (b) => b.status === 'enquiry' || b.status === 'awaiting_payment' },
  { key: 'requests', label: 'Requests', match: (b) => b.status === 'enquiry' },
  { key: 'upcoming', label: 'Upcoming', match: (b) => ['awaiting_payment', 'confirmed'].includes(b.status) && b.check_out >= today() },
  { key: 'inhouse', label: 'In house', match: (b) => b.status === 'checked_in' },
  { key: 'past', label: 'Past', match: (b) => b.status === 'completed' || (b.check_out < today() && b.status === 'confirmed') },
  { key: 'cancelled', label: 'Cancelled', match: (b) => b.status === 'cancelled' || b.status === 'no_show' },
  { key: 'all', label: 'All', match: () => true },
];

const blank = (rooms: RoomTypeRow[]): BookingInput => ({
  room_type_id: rooms[0]?.id ?? 'deluxe',
  rooms_count: 1,
  guest_name: '',
  guest_phone: '',
  guest_email: '',
  check_in: today(),
  check_out: addDays(today(), 1),
  adults: 2,
  children: 0,
  arrival_time: '',
  special_requests: '',
  total: 0,
  status: 'confirmed',
  source: 'phone',
  amount_paid: 0,
  payment_status: 'unpaid',
  payment_method: null,
  admin_notes: '',
});

const toInput = (b: Booking): BookingInput => ({
  room_type_id: b.room_type_id,
  rooms_count: b.rooms_count,
  guest_name: b.guest_name,
  guest_phone: b.guest_phone ?? '',
  guest_email: b.guest_email ?? '',
  check_in: b.check_in,
  check_out: b.check_out,
  adults: b.adults,
  children: b.children,
  arrival_time: b.arrival_time ?? '',
  special_requests: b.special_requests ?? '',
  total: b.total,
  status: b.status,
  source: b.source,
  amount_paid: b.amount_paid,
  payment_status: b.payment_status,
  payment_method: b.payment_method,
  admin_notes: b.admin_notes ?? '',
});

const Bookings = () => {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [rooms, setRooms] = useState<RoomTypeRow[]>([]);
  const [view, setView] = useState<View>('open');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<{ id: string | null; form: BookingInput } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [b, r] = await Promise.all([fetchBookings(), fetchRoomTypes()]);
      setBookings(b);
      setRooms(r);
    } catch (e) {
      toast.error(describeError(e));
      setBookings([]);
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const roomName = (id: string) => rooms.find((r) => r.id === id)?.name ?? id;
  const current = VIEWS.find((v) => v.key === view)!;
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (bookings ?? [])
      .filter(current.match)
      .filter((b) => !q || [b.reference, b.guest_name, b.guest_phone, b.guest_email].some((v) => (v ?? '').toLowerCase().includes(q)))
      .sort((a, b) => (view === 'past' || view === 'all' ? b.check_in.localeCompare(a.check_in) : a.check_in.localeCompare(b.check_in)));
  }, [bookings, current, query, view]);

  const counts = Object.fromEntries(VIEWS.map((v) => [v.key, (bookings ?? []).filter(v.match).length]));

  const quickStatus = async (b: Booking, status: BookingStatus) => {
    try {
      const saved = await updateBooking(b.id, { status });
      setBookings((list) => list?.map((x) => (x.id === b.id ? saved : x)) ?? null);
      toast.success(`${b.reference}: ${STATUS_LABEL[status]}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const remove = async (b: Booking) => {
    if (!confirm(`Delete ${b.reference} for ${b.guest_name}? This cannot be undone. (To keep a record, set it to Cancelled instead.)`)) return;
    try {
      await deleteBooking(b.id);
      setBookings((list) => list?.filter((x) => x.id !== b.id) ?? null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  // Suggested total for the form: rate × nights × rooms + GST
  const suggestTotal = (f: BookingInput) => {
    const r = rooms.find((x) => x.id === f.room_type_id);
    const nights = nightsBetween(f.check_in, f.check_out);
    if (!r || nights <= 0) return 0;
    const base = r.price * nights * f.rooms_count;
    return Math.round(base * (1 + gstRateFor(r.price)));
  };

  const save = async () => {
    if (!editing) return;
    const f = editing.form;
    if (f.guest_name.trim().length < 2) return toast.error("Add the guest's name.");
    if (!f.guest_phone?.trim() && !f.guest_email?.trim()) return toast.error('Add a phone number or email.');
    if (nightsBetween(f.check_in, f.check_out) <= 0) return toast.error('Check-out must be after check-in.');
    const payload: BookingInput = {
      ...f,
      guest_name: f.guest_name.trim(),
      guest_phone: normalizePhone(f.guest_phone ?? '') || null,
      guest_email: f.guest_email?.trim() || null,
      arrival_time: f.arrival_time?.trim() || null,
      special_requests: f.special_requests?.trim() || null,
      admin_notes: f.admin_notes?.trim() || null,
    };
    setSaving(true);
    try {
      const saved = editing.id ? await updateBooking(editing.id, payload) : await createBooking(payload);
      setBookings((list) => (editing.id ? list?.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...(list ?? [])]) ?? null);
      toast.success(`${saved.reference} saved`);
      setEditing(null);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const set = <K extends keyof BookingInput>(key: K, value: BookingInput[K]) =>
    setEditing((e) => (e ? { ...e, form: { ...e.form, [key]: value } } : e));

  return (
    <div>
      <PageTitle
        title="Bookings"
        subtitle="Website requests, phone and walk-in bookings, and payments."
        action={
          <div className="flex gap-2">
            <button type="button" onClick={() => void load()} className="flex items-center gap-2 border border-ink/15 bg-white px-4 py-2.5 text-sm hover:border-ink">
              <RefreshCw size={14} /> Refresh
            </button>
            <button type="button" onClick={() => setEditing({ id: null, form: blank(rooms) })} className="btn-dark !py-2.5 !text-[11px]">
              <Plus size={14} /> New booking
            </button>
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => setView(v.key)}
            className={`border px-3.5 py-2 text-xs font-semibold transition ${view === v.key ? 'border-ink bg-ink text-ivory' : 'border-ink/15 bg-white text-ink/60 hover:border-ink'}`}
          >
            {v.label} <span className="opacity-60">{counts[v.key] ?? 0}</span>
          </button>
        ))}
        <label className="relative ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ref, name, phone…" className={`${inputCls} w-56 pl-9`} />
        </label>
      </div>

      {bookings === null ? (
        <p className="text-sm text-ink/50">Loading bookings…</p>
      ) : shown.length === 0 ? (
        <p className="border border-dashed border-ink/20 bg-white p-10 text-center text-sm text-ink/50">Nothing here.</p>
      ) : (
        <div className="overflow-x-auto border border-ink/10 bg-white">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b border-ink/10 text-[10px] uppercase tracking-[0.18em] text-ink/45">
              <tr>
                <th className="p-4">Booking</th>
                <th className="p-4">Guest</th>
                <th className="p-4">Stay</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {shown.map((b) => {
                const wa = guestWhatsapp(b.guest_phone, `Hello ${b.guest_name.split(' ')[0]}, this is The Elegance Hotel about your booking ${b.reference} (${prettyDate(b.check_in)} to ${prettyDate(b.check_out)}). `);
                return (
                  <tr key={b.id} className="align-top hover:bg-ivory-100">
                    <td className="p-4">
                      <p className="font-semibold">{b.reference}</p>
                      <p className="text-xs text-ink/45">{SOURCE_LABEL[b.source]} · {new Date(b.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold">{b.guest_name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                        {b.guest_phone && <a href={`tel:${b.guest_phone}`} className="flex items-center gap-1 text-ink/60 hover:text-ink"><Phone size={11} /> {b.guest_phone}</a>}
                        {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800 hover:bg-emerald-100"><MessageCircle size={11} /> WhatsApp</a>}
                      </div>
                      {b.guest_email && <a href={`mailto:${b.guest_email}`} className="mt-1 flex items-center gap-1 text-xs text-ink/50 hover:text-ink"><Mail size={11} /> {b.guest_email}</a>}
                    </td>
                    <td className="p-4">
                      <p>{roomName(b.room_type_id)} × {b.rooms_count}</p>
                      <p className="text-xs text-ink/55">{prettyDate(b.check_in)} → {prettyDate(b.check_out)}</p>
                      <p className="text-xs text-ink/45">{b.nights} night{b.nights === 1 ? '' : 's'} · {b.adults + b.children} guest{b.adults + b.children === 1 ? '' : 's'}{b.arrival_time ? ` · arrives ${b.arrival_time}` : ''}</p>
                      {b.special_requests && <p className="mt-1 max-w-[260px] text-xs italic text-ink/50">“{b.special_requests}”</p>}
                    </td>
                    <td className="p-4">
                      <p className="font-semibold">{formatINR(b.total)}</p>
                      <p className="text-xs text-ink/50">{PAYMENT_LABEL[b.payment_status]}{b.amount_paid > 0 ? ` · ${formatINR(b.amount_paid)} paid` : ''}</p>
                    </td>
                    <td className="p-4">
                      <select
                        value={b.status}
                        onChange={(e) => void quickStatus(b, e.target.value as BookingStatus)}
                        className={`border-0 px-2.5 py-1.5 text-xs font-semibold ${STATUS_STYLE[b.status]}`}
                        aria-label="Status"
                      >
                        {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                      </select>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={() => setEditing({ id: b.id, form: toInput(b) })} className="p-2 text-ink/50 hover:bg-ivory-200 hover:text-ink" aria-label="Edit"><Pencil size={15} /></button>
                        <button type="button" onClick={() => void remove(b)} className="p-2 text-ink/40 hover:bg-red-50 hover:text-red-700" aria-label="Delete"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink/50" onClick={() => setEditing(null)}>
          <div className="h-full w-full max-w-xl overflow-y-auto bg-ivory p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-3xl">{editing.id ? 'Edit booking' : 'New booking'}</h2>
              <button type="button" onClick={() => setEditing(null)} aria-label="Close" className="p-2 hover:bg-ivory-200"><X size={18} /></button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className={labelCls}>Guest name</label><input className={inputCls} value={editing.form.guest_name} onChange={(e) => set('guest_name', e.target.value)} /></div>
              <div><label className={labelCls}>Phone</label><input className={inputCls} value={editing.form.guest_phone ?? ''} onChange={(e) => set('guest_phone', e.target.value)} placeholder="98765 43210" /></div>
              <div><label className={labelCls}>Email</label><input className={inputCls} value={editing.form.guest_email ?? ''} onChange={(e) => set('guest_email', e.target.value)} /></div>
              <div>
                <label className={labelCls}>Room type</label>
                <select className={inputCls} value={editing.form.room_type_id} onChange={(e) => set('room_type_id', e.target.value)}>
                  {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div><label className={labelCls}>Rooms</label><input type="number" min={1} max={20} className={inputCls} value={editing.form.rooms_count} onChange={(e) => set('rooms_count', Math.max(1, Number(e.target.value) || 1))} /></div>
              <div><label className={labelCls}>Check-in</label><input type="date" className={inputCls} value={editing.form.check_in} onChange={(e) => set('check_in', e.target.value)} /></div>
              <div><label className={labelCls}>Check-out</label><input type="date" className={inputCls} value={editing.form.check_out} min={addDays(editing.form.check_in, 1)} onChange={(e) => set('check_out', e.target.value)} /></div>
              <div><label className={labelCls}>Adults</label><input type="number" min={1} className={inputCls} value={editing.form.adults} onChange={(e) => set('adults', Math.max(1, Number(e.target.value) || 1))} /></div>
              <div><label className={labelCls}>Children</label><input type="number" min={0} className={inputCls} value={editing.form.children} onChange={(e) => set('children', Math.max(0, Number(e.target.value) || 0))} /></div>
              <div><label className={labelCls}>Arrival time</label><input className={inputCls} value={editing.form.arrival_time ?? ''} onChange={(e) => set('arrival_time', e.target.value)} placeholder="e.g. 14:00" /></div>
              <div>
                <label className={labelCls}>Source</label>
                <select className={inputCls} value={editing.form.source} onChange={(e) => set('source', e.target.value as BookingInput['source'])}>
                  {SOURCES.map((s) => <option key={s} value={s}>{SOURCE_LABEL[s]}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2"><label className={labelCls}>Special requests</label><textarea rows={2} className={inputCls} value={editing.form.special_requests ?? ''} onChange={(e) => set('special_requests', e.target.value)} /></div>

              <div>
                <label className={labelCls}>Total incl. GST (₹)</label>
                <input type="number" min={0} className={inputCls} value={editing.form.total} onChange={(e) => set('total', Math.max(0, Number(e.target.value) || 0))} />
                <button type="button" onClick={() => set('total', suggestTotal(editing.form))} className="mt-1 text-xs text-gold-dark underline">
                  Use rate card: {formatINR(suggestTotal(editing.form))}
                </button>
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select className={inputCls} value={editing.form.status} onChange={(e) => set('status', e.target.value as BookingStatus)}>
                  {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </div>
              <div><label className={labelCls}>Amount paid (₹)</label><input type="number" min={0} className={inputCls} value={editing.form.amount_paid} onChange={(e) => set('amount_paid', Math.max(0, Number(e.target.value) || 0))} /></div>
              <div>
                <label className={labelCls}>Payment</label>
                <select className={inputCls} value={editing.form.payment_status} onChange={(e) => set('payment_status', e.target.value as BookingInput['payment_status'])}>
                  {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{PAYMENT_LABEL[s]}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Paid by</label>
                <select className={inputCls} value={editing.form.payment_method ?? ''} onChange={(e) => set('payment_method', (e.target.value || null) as BookingInput['payment_method'])}>
                  <option value="">—</option>
                  {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{METHOD_LABEL[m]}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2"><label className={labelCls}>Team notes</label><textarea rows={3} className={inputCls} value={editing.form.admin_notes ?? ''} onChange={(e) => set('admin_notes', e.target.value)} /></div>
            </div>
            <p className="mt-4 text-xs text-ink/45">"Held", "Confirmed" and "Checked in" take rooms from availability. The system refuses a booking if there aren't enough rooms free.</p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => void save()} disabled={saving} className="btn-dark flex-1 disabled:opacity-60">{saving ? 'Saving…' : 'Save booking'}</button>
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost-dark">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
