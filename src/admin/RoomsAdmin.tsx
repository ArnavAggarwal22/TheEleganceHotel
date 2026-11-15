import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatINR } from '@/data/hotel';
import { addDays, prettyDate, today } from '@/lib/dates';
import {
  addClosure, describeError, fetchClosures, fetchRoomTypes, removeClosure, updateRoomType,
  type Closure, type RoomTypeRow,
} from '@/lib/db';
import { gstRateFor, refreshLiveRooms } from '@/lib/useLiveRooms';
import { PageTitle, inputCls, labelCls } from './shared';

const REASONS: Record<Closure['reason'], string> = { maintenance: 'Maintenance', owner_use: 'Owner / staff use', other: 'Other' };

/** Room rates, how many rooms of each type exist, and rooms taken out of sale. */
const RoomsAdmin = () => {
  const [rooms, setRooms] = useState<RoomTypeRow[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { price: string; total_rooms: string; max_guests: string }>>({});
  const [closures, setClosures] = useState<Closure[]>([]);
  const [closure, setClosure] = useState({ room_type_id: '', starts_on: today(), ends_on: addDays(today(), 1), rooms_closed: 1, reason: 'maintenance' as Closure['reason'], note: '' });

  const load = async () => {
    try {
      const [r, c] = await Promise.all([fetchRoomTypes(), fetchClosures()]);
      setRooms(r);
      setClosures(c);
      setDrafts(Object.fromEntries(r.map((x) => [x.id, { price: String(x.price), total_rooms: String(x.total_rooms), max_guests: String(x.max_guests) }])));
      setClosure((cl) => ({ ...cl, room_type_id: cl.room_type_id || r[0]?.id || '' }));
    } catch (e) {
      toast.error(describeError(e));
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const saveRoom = async (r: RoomTypeRow) => {
    const d = drafts[r.id];
    const price = Number(d.price);
    const total = Number(d.total_rooms);
    const guests = Number(d.max_guests);
    if (!(price > 0)) return toast.error('Enter a price above ₹0.');
    if (!Number.isInteger(total) || total < 0) return toast.error('Room count must be a whole number.');
    if (!Number.isInteger(guests) || guests < 1 || guests > 12) return toast.error('Guests per room must be 1 to 12.');
    try {
      await updateRoomType(r.id, { price, total_rooms: total, max_guests: guests });
      refreshLiveRooms();
      toast.success(`${r.name} saved. The website shows the new price right away.`);
      void load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const toggleActive = async (r: RoomTypeRow) => {
    try {
      await updateRoomType(r.id, { is_active: !r.is_active });
      refreshLiveRooms();
      void load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const saveClosure = async () => {
    if (closure.ends_on <= closure.starts_on) return toast.error('The end date must be after the start date.');
    try {
      await addClosure({ ...closure, note: closure.note.trim() || null });
      toast.success('Rooms closed for those dates.');
      setClosure((c) => ({ ...c, note: '' }));
      void load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const roomName = (id: string) => rooms?.find((r) => r.id === id)?.name ?? id;

  return (
    <div className="space-y-12">
      <div>
        <PageTitle title="Rooms & prices" subtitle="Rates shown on the website, how many rooms you sell of each type, and guests per room." />
        {rooms === null ? (
          <p className="text-sm text-ink/50">Loading…</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {rooms.map((r) => {
              const d = drafts[r.id] ?? { price: '', total_rooms: '', max_guests: '' };
              const price = Number(d.price) || 0;
              return (
                <div key={r.id} className={`border bg-white p-6 ${r.is_active ? 'border-ink/10' : 'border-dashed border-ink/25 opacity-75'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-3xl">{r.name}</h2>
                    <button type="button" onClick={() => void toggleActive(r)} className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${r.is_active ? 'bg-emerald-100 text-emerald-900' : 'bg-ink/10 text-ink/60'}`}>
                      {r.is_active ? 'On sale' : 'Hidden'}
                    </button>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="col-span-3"><label className={labelCls}>Price per night (₹, before GST)</label><input type="number" min={1} className={inputCls} value={d.price} onChange={(e) => setDrafts({ ...drafts, [r.id]: { ...d, price: e.target.value } })} /></div>
                    <div className="col-span-3 text-xs text-ink/50">Guest pays {formatINR(price * (1 + gstRateFor(price)))} incl. {Math.round(gstRateFor(price) * 100)}% GST</div>
                    <div className="col-span-2"><label className={labelCls}>Rooms of this type</label><input type="number" min={0} className={inputCls} value={d.total_rooms} onChange={(e) => setDrafts({ ...drafts, [r.id]: { ...d, total_rooms: e.target.value } })} /></div>
                    <div><label className={labelCls}>Guests / room</label><input type="number" min={1} max={12} className={inputCls} value={d.max_guests} onChange={(e) => setDrafts({ ...drafts, [r.id]: { ...d, max_guests: e.target.value } })} /></div>
                  </div>
                  <button type="button" onClick={() => void saveRoom(r)} className="btn-dark mt-5 w-full !py-3">Save</button>
                </div>
              );
            })}
          </div>
        )}
        <p className="mt-4 text-xs text-ink/45">Room names, descriptions and photos are part of the website design (src/data/hotel.ts). Ask your developer to change those.</p>
      </div>

      <div>
        <PageTitle title="Closed rooms" subtitle="Take rooms out of sale for maintenance or staff use. They stop showing as available on the website." />
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <div className="space-y-4 border border-ink/10 bg-white p-6">
            <div>
              <label className={labelCls}>Room type</label>
              <select className={inputCls} value={closure.room_type_id} onChange={(e) => setClosure({ ...closure, room_type_id: e.target.value })}>
                {(rooms ?? []).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>From</label><input type="date" className={inputCls} min={today()} value={closure.starts_on} onChange={(e) => setClosure({ ...closure, starts_on: e.target.value, ends_on: closure.ends_on <= e.target.value ? addDays(e.target.value, 1) : closure.ends_on })} /></div>
              <div><label className={labelCls}>Open again on</label><input type="date" className={inputCls} min={addDays(closure.starts_on, 1)} value={closure.ends_on} onChange={(e) => setClosure({ ...closure, ends_on: e.target.value })} /></div>
              <div><label className={labelCls}>Rooms</label><input type="number" min={1} className={inputCls} value={closure.rooms_closed} onChange={(e) => setClosure({ ...closure, rooms_closed: Math.max(1, Number(e.target.value) || 1) })} /></div>
              <div>
                <label className={labelCls}>Reason</label>
                <select className={inputCls} value={closure.reason} onChange={(e) => setClosure({ ...closure, reason: e.target.value as Closure['reason'] })}>
                  {Object.entries(REASONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div><label className={labelCls}>Note</label><input className={inputCls} value={closure.note} onChange={(e) => setClosure({ ...closure, note: e.target.value })} placeholder="e.g. AC repair in 104" /></div>
            <button type="button" onClick={() => void saveClosure()} className="btn-dark w-full !py-3">Close rooms</button>
          </div>
          <div className="border border-ink/10 bg-white">
            {closures.filter((c) => c.ends_on > today()).length === 0 ? (
              <p className="p-8 text-center text-sm text-ink/50">No rooms are closed.</p>
            ) : (
              <ul className="divide-y divide-ink/5">
                {closures.filter((c) => c.ends_on > today()).map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-4 p-4 text-sm">
                    <div>
                      <p className="font-semibold">{roomName(c.room_type_id)} × {c.rooms_closed}</p>
                      <p className="text-xs text-ink/55">{prettyDate(c.starts_on)} → {prettyDate(c.ends_on)} · {REASONS[c.reason]}{c.note ? ` · ${c.note}` : ''}</p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await removeClosure(c.id);
                          void load();
                        } catch (e) {
                          toast.error((e as Error).message);
                        }
                      }}
                      className="p-2 text-ink/40 hover:bg-red-50 hover:text-red-700"
                      aria-label="Reopen these rooms"
                    >
                      <Trash2 size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomsAdmin;
