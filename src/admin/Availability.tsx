import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { addDays, today } from '@/lib/dates';
import { describeError, fetchOccupancy, fetchRoomTypes, type OccupancyCell, type RoomTypeRow } from '@/lib/db';
import { PageTitle } from './shared';

const DAYS = 21;

const dayLabel = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return {
    weekday: date.toLocaleDateString('en-IN', { weekday: 'short' }),
    day: d,
    month: date.toLocaleDateString('en-IN', { month: 'short' }),
    weekend: date.getDay() === 5 || date.getDay() === 6,
  };
};

/** Free rooms per room type per night, from held bookings and closures. */
const Availability = () => {
  const [from, setFrom] = useState(today());
  const [cells, setCells] = useState<OccupancyCell[] | null>(null);
  const [rooms, setRooms] = useState<RoomTypeRow[]>([]);

  useEffect(() => {
    let active = true;
    setCells(null);
    Promise.all([fetchOccupancy(from, addDays(from, DAYS)), fetchRoomTypes()])
      .then(([c, r]) => {
        if (!active) return;
        setCells(c);
        setRooms(r);
      })
      .catch((e) => toast.error(describeError(e)));
    return () => {
      active = false;
    };
  }, [from]);

  const nights = useMemo(() => Array.from({ length: DAYS }, (_, i) => addDays(from, i)), [from]);
  const cell = (roomId: string, night: string) => cells?.find((c) => c.room_type_id === roomId && c.night === night);

  const totals = nights.map((n) => {
    const row = (cells ?? []).filter((c) => c.night === n);
    const total = row.reduce((s, c) => s + c.total_rooms, 0);
    const used = row.reduce((s, c) => s + c.booked + c.closed, 0);
    return { total, used, pct: total ? Math.round((used / total) * 100) : 0 };
  });

  return (
    <div>
      <PageTitle
        title="Availability"
        subtitle="Free rooms each night. Held, confirmed and checked-in bookings and closed rooms are counted; requests are not."
        action={
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setFrom(addDays(from, -7))} disabled={from <= today()} className="border border-ink/15 bg-white p-2.5 hover:border-ink disabled:opacity-30" aria-label="Previous week"><ChevronLeft size={16} /></button>
            <button type="button" onClick={() => setFrom(today())} className="border border-ink/15 bg-white px-4 py-2.5 text-sm hover:border-ink">Today</button>
            <button type="button" onClick={() => setFrom(addDays(from, 7))} className="border border-ink/15 bg-white p-2.5 hover:border-ink" aria-label="Next week"><ChevronRight size={16} /></button>
          </div>
        }
      />

      {cells === null ? (
        <p className="text-sm text-ink/50">Loading…</p>
      ) : (
        <div className="overflow-x-auto border border-ink/10 bg-white">
          <table className="w-full min-w-[1100px] border-collapse text-center text-xs">
            <thead>
              <tr className="border-b border-ink/10">
                <th className="sticky left-0 bg-white p-3 text-left text-[10px] uppercase tracking-[0.18em] text-ink/45">Room type</th>
                {nights.map((n) => {
                  const d = dayLabel(n);
                  return (
                    <th key={n} className={`p-2 font-normal ${d.weekend ? 'bg-ivory-200' : ''}`}>
                      <span className="block text-[10px] uppercase text-ink/45">{d.weekday}</span>
                      <span className="block text-base font-semibold text-ink">{d.day}</span>
                      <span className="block text-[10px] text-ink/40">{d.month}</span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rooms.map((r) => (
                <tr key={r.id} className="border-b border-ink/5">
                  <td className="sticky left-0 bg-white p-3 text-left">
                    <p className="font-semibold text-ink">{r.name}</p>
                    <p className="text-[11px] text-ink/45">{r.total_rooms} room{r.total_rooms === 1 ? '' : 's'}{r.is_active ? '' : ' · hidden'}</p>
                  </td>
                  {nights.map((n) => {
                    const c = cell(r.id, n);
                    const free = c ? c.total_rooms - c.booked - c.closed : 0;
                    const tone = !c || c.total_rooms === 0 ? 'bg-ink/5 text-ink/30' : free <= 0 ? 'bg-red-100 text-red-800' : free === 1 ? 'bg-amber-100 text-amber-900' : 'bg-emerald-50 text-emerald-900';
                    return (
                      <td key={n} className="p-1">
                        <div className={`px-1 py-2 ${tone}`} title={c ? `${c.booked} booked, ${c.closed} closed, ${free} free` : ''}>
                          <span className="block text-sm font-semibold">{Math.max(free, 0)}</span>
                          <span className="block text-[10px] opacity-70">free</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr>
                <td className="sticky left-0 bg-white p-3 text-left text-[10px] uppercase tracking-[0.18em] text-ink/45">Occupancy</td>
                {totals.map((t, i) => (
                  <td key={nights[i]} className="p-2 text-[11px] font-semibold text-ink/60">{t.pct}%</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-4 flex flex-wrap gap-4 text-xs text-ink/50">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 bg-emerald-50 ring-1 ring-emerald-200" /> 2 or more free</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 bg-amber-100" /> 1 free</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 bg-red-100" /> Full</span>
      </p>
    </div>
  );
};

export default Availability;
