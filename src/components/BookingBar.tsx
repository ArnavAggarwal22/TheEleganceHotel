import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Users, ArrowRight } from 'lucide-react';
import { addDays, today } from '@/lib/dates';

/** Compact availability search that hands its values to the booking page. */
const BookingBar = ({ className = '' }: { className?: string }) => {
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState(today());
  const [checkOut, setCheckOut] = useState(addDays(today(), 1));
  const [guests, setGuests] = useState(2);

  const onCheckIn = (v: string) => {
    setCheckIn(v);
    if (!checkOut || checkOut <= v) setCheckOut(addDays(v, 1));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/book?in=${checkIn}&out=${checkOut}&guests=${guests}`);
  };

  return (
    <form
      onSubmit={submit}
      className={`grid grid-cols-1 border border-gold/25 bg-ink/70 text-ivory shadow-[0_30px_80px_-30px_rgba(0,0,0,.8)] backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.8fr_auto] ${className}`}
    >
      <label className="flex flex-col gap-1.5 border-b border-ivory/10 px-6 py-4 sm:border-r lg:border-b-0">
        <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-gold"><CalendarDays size={13} /> Check In</span>
        <input type="date" value={checkIn} min={today()} onChange={(e) => onCheckIn(e.target.value)} required
          className="bg-transparent text-[15px] text-ivory outline-none [color-scheme:dark]" />
      </label>
      <label className="flex flex-col gap-1.5 border-b border-ivory/10 px-6 py-4 lg:border-b-0 lg:border-r">
        <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-gold"><CalendarDays size={13} /> Check Out</span>
        <input type="date" value={checkOut} min={addDays(checkIn || today(), 1)} onChange={(e) => setCheckOut(e.target.value)} required
          className="bg-transparent text-[15px] text-ivory outline-none [color-scheme:dark]" />
      </label>
      <label className="flex flex-col gap-1.5 border-b border-ivory/10 px-6 py-4 sm:border-b-0 sm:border-r">
        <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-gold"><Users size={13} /> Guests</span>
        <select value={guests} onChange={(e) => setGuests(Number(e.target.value))}
          className="bg-transparent text-[15px] text-ivory outline-none [color-scheme:dark]">
          {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n} className="bg-ink">{n} {n === 1 ? 'Guest' : 'Guests'}</option>)}
        </select>
      </label>
      <button type="submit" className="btn-gold !py-5 lg:!px-10">
        Check Availability <ArrowRight size={15} />
      </button>
    </form>
  );
};

export default BookingBar;
