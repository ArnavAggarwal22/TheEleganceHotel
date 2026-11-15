import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { BedDouble, CalendarDays, LogOut, MessageCircle, Users } from 'lucide-react';
import { toast } from 'sonner';
import PlainHero from '@/components/PlainHero';
import PhoneInput from '@/components/PhoneInput';
import { useAuth } from '@/context/AuthContext';
import { HOTEL, formatINR, whatsappLink } from '@/data/hotel';
import { fetchMyBookings, type MyBooking } from '@/lib/db';
import { prettyDate, today } from '@/lib/dates';
import { isValidPhone, PHONE_ERROR, PHONE_REQUIRED } from '@/lib/phone';

const STATUS: Record<string, { label: string; note: string; tone: string }> = {
  enquiry: { label: 'Requested', note: "We're checking availability and will call or WhatsApp you shortly.", tone: 'bg-ivory-300 text-ink' },
  awaiting_payment: { label: 'Rooms held', note: 'Your rooms are held. Complete the payment we shared to confirm.', tone: 'bg-gold-pale text-ink' },
  confirmed: { label: 'Confirmed', note: 'Confirmed. We look forward to welcoming you.', tone: 'bg-[#1f7a4d] text-white' },
  checked_in: { label: 'Checked in', note: 'Enjoy your stay.', tone: 'bg-[#1f7a4d] text-white' },
  completed: { label: 'Stayed', note: 'Thank you for staying with us.', tone: 'bg-ink/10 text-ink/70' },
  cancelled: { label: 'Cancelled', note: '', tone: 'bg-ink/10 text-ink/50' },
  no_show: { label: 'No-show', note: '', tone: 'bg-ink/10 text-ink/50' },
};

const Account = () => {
  const { user, loading, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<MyBooking[] | null>(null);

  useEffect(() => {
    if (!user) return;
    setFullName(user.full_name);
    setPhone(user.phone ?? '');
    let active = true;
    fetchMyBookings()
      .then((rows) => active && setBookings(rows))
      .catch(() => active && setBookings([]));
    return () => {
      active = false;
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <PlainHero eyebrow="Guest account" title="Loading…" />;
  if (!user) return <Navigate to="/signin?next=/account" replace />;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (fullName.trim().length < 2) return setError('Please enter your full name.');
    if (!phone) return setError(PHONE_REQUIRED);
    if (!isValidPhone(phone)) return setError(PHONE_ERROR);
    setSaving(true);
    const result = await updateProfile({ fullName, phone });
    setSaving(false);
    if (result.ok) toast.success('Your details are saved.');
    else setError(result.message);
  };

  const upcoming = (bookings ?? []).filter((b) => b.check_out >= today() && !['cancelled', 'no_show'].includes(b.status));
  const past = (bookings ?? []).filter((b) => !upcoming.includes(b));

  const card = (b: MyBooking) => {
    const s = STATUS[b.status] ?? STATUS.enquiry;
    return (
      <li key={b.reference} className="border border-ink/10 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-ink/40">Ref · {b.reference}</p>
            <h3 className="mt-1 text-3xl">{b.room_name}</h3>
          </div>
          <span className={`px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${s.tone}`}>{s.label}</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink/60">
          <span className="flex items-center gap-2"><CalendarDays size={14} className="text-gold-dark" /> {prettyDate(b.check_in)} → {prettyDate(b.check_out)}</span>
          <span className="flex items-center gap-2"><BedDouble size={14} className="text-gold-dark" /> {b.rooms_count} room{b.rooms_count === 1 ? '' : 's'} · {b.nights} night{b.nights === 1 ? '' : 's'}</span>
          <span className="flex items-center gap-2"><Users size={14} className="text-gold-dark" /> {b.adults + b.children} guest{b.adults + b.children === 1 ? '' : 's'}</span>
          {b.total > 0 && <span className="font-semibold text-ink">{formatINR(b.total)}</span>}
        </div>
        {s.note && b.check_out >= today() && <p className="mt-3 text-sm text-ink/55">{s.note}</p>}
        <a
          href={whatsappLink(`Hello ${HOTEL.fullName}, about my booking ${b.reference}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1f7a4d] link-underline"
        >
          <MessageCircle size={14} /> Message the hotel
        </a>
      </li>
    );
  };

  return (
    <>
      <PlainHero eyebrow="Guest account" title={<>Hello{user.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}</>} intro="Your booking requests and stays at The Elegance Hotel." />
      <section className="py-16 md:py-20">
        <div className="container grid items-start gap-10 lg:grid-cols-12">
          <div className="space-y-10 lg:col-span-8">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-4xl">My bookings</h2>
              <Link to="/book" className="btn-gold !px-5 !py-3">Book a stay</Link>
            </div>
            {bookings === null && <p className="text-sm text-ink/50">Loading…</p>}
            {bookings?.length === 0 && (
              <p className="border border-dashed border-ink/20 p-10 text-center text-ink/55">No bookings yet. Your requests will appear here.</p>
            )}
            {upcoming.length > 0 && (
              <div>
                <p className="eyebrow">Upcoming &amp; requested</p>
                <ul className="mt-5 space-y-4">{upcoming.map(card)}</ul>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <p className="eyebrow">Past &amp; cancelled</p>
                <ul className="mt-5 space-y-4 opacity-80">{past.map(card)}</ul>
              </div>
            )}
          </div>

          <aside className="space-y-4 lg:col-span-4">
            <form onSubmit={save} noValidate className="space-y-5 border border-ink/10 bg-white p-7">
              <h2 className="text-3xl">My details</h2>
              {!user.phone && (
                <p className="bg-gold-pale/60 p-3 text-sm text-ink/70">Please add your phone number. We need it to confirm your bookings.</p>
              )}
              <div>
                <label className="field-label" htmlFor="a-name">Full name</label>
                <input id="a-name" className="field" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
              </div>
              <div>
                <label className="field-label" htmlFor="a-phone">Phone number *</label>
                <PhoneInput id="a-phone" value={phone} onChange={setPhone} required invalid={!user.phone && !phone} />
              </div>
              <div>
                <label className="field-label" htmlFor="a-email">Email</label>
                <input id="a-email" className="field bg-ivory-100 text-ink/50" value={user.email} readOnly />
              </div>
              {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
              <button type="submit" disabled={saving} className="btn-dark w-full disabled:opacity-60">{saving ? 'Saving…' : 'Save details'}</button>
            </form>
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate('/');
              }}
              className="flex w-full items-center justify-center gap-2 border border-ink/15 py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/60 transition hover:border-ink hover:text-ink"
            >
              <LogOut size={14} /> Sign out
            </button>
          </aside>
        </div>
      </section>
    </>
  );
};

export default Account;
