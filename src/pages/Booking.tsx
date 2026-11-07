import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, BedDouble, CalendarDays, Check, CheckCircle2, MessageCircle, Minus, Phone, Plus,
  ShieldCheck, Users,
} from 'lucide-react';
import { toast } from 'sonner';
import Img from '@/components/Img';
import PageHero from '@/components/PageHero';
import { EASE } from '@/components/Reveal';
import { HOTEL, IMAGES, ROOMS, formatINR, whatsappLink } from '@/data/hotel';
import { addDays, nightsBetween, prettyDate, today } from '@/lib/dates';

const STEPS = ['Your Stay', 'Choose Room', 'Guest Details', 'Confirm'];

const Counter = ({ value, onChange, min, max, label }: { value: number; onChange: (n: number) => void; min: number; max: number; label: string }) => (
  <div className="flex items-center justify-between border border-ink/10 bg-white px-4 py-2.5">
    <span className="text-[15px]">{value} {label}{value === 1 ? '' : 's'}</span>
    <div className="flex gap-2">
      <button type="button" aria-label={`Fewer ${label}s`} disabled={value <= min} onClick={() => onChange(value - 1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 transition hover:border-gold disabled:opacity-30"><Minus size={14} /></button>
      <button type="button" aria-label={`More ${label}s`} disabled={value >= max} onClick={() => onChange(value + 1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 transition hover:border-gold disabled:opacity-30"><Plus size={14} /></button>
    </div>
  </div>
);

const Booking = () => {
  const [params] = useSearchParams();
  const initialIn = params.get('in') && params.get('in')! >= today() ? params.get('in')! : today();
  const initialOut = params.get('out') && params.get('out')! > initialIn ? params.get('out')! : addDays(initialIn, 1);

  const [step, setStep] = useState(0);
  const [checkIn, setCheckIn] = useState(initialIn);
  const [checkOut, setCheckOut] = useState(initialOut);
  const [guests, setGuests] = useState(Math.min(12, Math.max(1, Number(params.get('guests')) || 2)));
  const [rooms, setRooms] = useState(1);
  const [roomId, setRoomId] = useState<string | null>(ROOMS.some((r) => r.id === params.get('room')) ? params.get('room') : null);
  const [guest, setGuest] = useState({ name: '', phone: '', email: '', arrival: '', requests: '' });
  const [done, setDone] = useState<string | null>(null);

  const room = ROOMS.find((r) => r.id === roomId) ?? null;
  const nights = nightsBetween(checkIn, checkOut);
  const subtotal = room ? room.price * nights * rooms : 0;
  const gst = Math.round(subtotal * HOTEL.gstRate);
  const total = subtotal + gst;
  const roomsNeeded = (r: (typeof ROOMS)[number]) => Math.ceil(guests / r.maxGuests);

  const canNext = useMemo(() => {
    if (step === 0) return nights > 0;
    if (step === 1) return !!room && roomsNeeded(room) <= rooms;
    if (step === 2) return guest.name.trim().length > 1 && /^[0-9+\s-]{10,15}$/.test(guest.phone.trim());
    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, nights, room, rooms, guests, guest]);

  const next = () => {
    if (!canNext) {
      toast.error(
        step === 0 ? 'Please choose valid check-in and check-out dates.'
          : step === 1 ? (room ? `This room needs ${roomsNeeded(room)} rooms for ${guests} guests — increase rooms or pick another.` : 'Please select a room.')
          : 'Please enter your name and a valid phone number.',
      );
      return;
    }
    setStep((s) => Math.min(3, s + 1));
    window.scrollTo({ top: document.getElementById('booking-flow')!.offsetTop - 100, behavior: 'smooth' });
  };

  const onCheckIn = (v: string) => {
    setCheckIn(v);
    if (checkOut <= v) setCheckOut(addDays(v, 1));
  };

  const confirm = () => {
    if (!room) return;
    const ref = 'EL' + Date.now().toString(36).toUpperCase().slice(-6);
    const msg = [
      `*New Booking Request — ${HOTEL.fullName}*`,
      `Ref: ${ref}`,
      '',
      `Room: ${room.name} × ${rooms}`,
      `Check-in: ${prettyDate(checkIn)}`,
      `Check-out: ${prettyDate(checkOut)}`,
      `Nights: ${nights} · Guests: ${guests}`,
      '',
      `Room charges: ${formatINR(subtotal)}`,
      `GST (${Math.round(HOTEL.gstRate * 100)}%): ${formatINR(gst)}`,
      `*Estimated total: ${formatINR(total)}*`,
      '',
      `Name: ${guest.name}`,
      `Phone: ${guest.phone}`,
      guest.email && `Email: ${guest.email}`,
      guest.arrival && `Expected arrival: ${guest.arrival}`,
      guest.requests && `Requests: ${guest.requests}`,
    ].filter(Boolean).join('\n');
    window.open(whatsappLink(msg), '_blank', 'noopener');
    setDone(ref);
  };

  const summary = (
    <div className="bg-ink text-ivory">
      {room ? (
        <div className="relative h-44 overflow-hidden">
          <Img src={room.image} alt={room.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink to-transparent" />
          <p className="absolute bottom-4 left-6 font-display text-3xl">{room.name}</p>
        </div>
      ) : (
        <div className="flex h-24 items-end px-6 pb-2"><p className="font-display text-3xl">Your Reservation</p></div>
      )}
      <div className="space-y-4 p-6 text-sm">
        <div className="grid grid-cols-2 gap-4 border-b border-ivory/10 pb-4">
          <div><p className="text-[10px] uppercase tracking-[0.22em] text-gold">Check-in</p><p className="mt-1 text-ivory/80">{prettyDate(checkIn)}</p></div>
          <div><p className="text-[10px] uppercase tracking-[0.22em] text-gold">Check-out</p><p className="mt-1 text-ivory/80">{prettyDate(checkOut)}</p></div>
        </div>
        <div className="flex justify-between text-ivory/70"><span>Guests · Rooms</span><span>{guests} · {rooms}</span></div>
        <div className="flex justify-between text-ivory/70"><span>Nights</span><span>{nights}</span></div>
        {room && (
          <>
            <div className="flex justify-between text-ivory/70"><span>{formatINR(room.price)} × {nights} night{nights === 1 ? '' : 's'} × {rooms}</span><span>{formatINR(subtotal)}</span></div>
            <div className="flex justify-between text-ivory/70"><span>GST ({Math.round(HOTEL.gstRate * 100)}%)</span><span>{formatINR(gst)}</span></div>
            <div className="flex items-end justify-between border-t border-ivory/10 pt-4">
              <span className="text-[10px] uppercase tracking-[0.22em] text-gold">Estimated total</span>
              <span className="font-display text-4xl">{formatINR(total)}</span>
            </div>
          </>
        )}
        <p className="flex items-start gap-2 pt-2 text-xs text-ivory/40"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-gold" /> No payment taken online. Our team confirms availability and the final rate with you directly.</p>
      </div>
    </div>
  );

  return (
    <>
      <PageHero
        image={IMAGES.pageBooking}
        crumb="Book Your Stay"
        eyebrow="Reservations"
        title={<>Reserve your <em className="italic text-gold-light">stay</em></>}
        intro="Book direct with The Elegance Hotel for our best available rate and a personal confirmation from our team."
      />

      <section id="booking-flow" className="py-16 md:py-24">
        <div className="container">
          {done ? (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE }} className="mx-auto max-w-2xl text-center">
              <CheckCircle2 size={56} strokeWidth={1.2} className="mx-auto text-gold" />
              <p className="mt-6 eyebrow center">Request ref · {done}</p>
              <h2 className="mt-5 text-5xl sm:text-6xl">Thank you, {guest.name.split(' ')[0]}.</h2>
              <p className="mx-auto mt-6 max-w-lg text-[15.5px] leading-relaxed text-ink/60">
                Your booking request has been prepared in WhatsApp — just press send. Our reservations team will confirm
                availability and your final rate shortly. If WhatsApp didn't open, call us directly.
              </p>
              <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
                <button onClick={confirm} className="btn-dark"><MessageCircle size={15} /> Open WhatsApp Again</button>
                <a href={`tel:${HOTEL.phoneTel}`} className="btn-ghost-dark"><Phone size={14} /> {HOTEL.phoneDisplay}</a>
              </div>
              <Link to="/" className="mt-10 inline-block text-[11px] uppercase tracking-[0.22em] text-ink/50 link-underline">Back to home</Link>
            </motion.div>
          ) : (
            <>
              {/* Stepper */}
              <ol className="mx-auto mb-14 flex max-w-3xl items-center">
                {STEPS.map((s, i) => (
                  <li key={s} className={`flex items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
                    <button
                      type="button"
                      onClick={() => i < step && setStep(i)}
                      className={`flex flex-col items-center gap-2 ${i < step ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      <span className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm transition-all duration-500 ${i < step ? 'border-gold bg-gold text-ink' : i === step ? 'border-ink bg-ink text-ivory' : 'border-ink/15 text-ink/40'}`}>
                        {i < step ? <Check size={16} /> : i + 1}
                      </span>
                      <span className={`hidden text-[10px] uppercase tracking-[0.2em] sm:block ${i <= step ? 'text-ink' : 'text-ink/40'}`}>{s}</span>
                    </button>
                    {i < STEPS.length - 1 && (
                      <span className="relative mx-2 h-px flex-1 bg-ink/10 sm:mx-4 sm:-mt-6">
                        <span className="absolute inset-0 origin-left bg-gold transition-transform duration-700" style={{ transform: `scaleX(${i < step ? 1 : 0})` }} />
                      </span>
                    )}
                  </li>
                ))}
              </ol>

              <div className="grid gap-10 lg:grid-cols-12">
                <div className="lg:col-span-8">
                  <AnimatePresence mode="wait">
                    <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.5, ease: EASE }}>
                      {step === 0 && (
                        <div>
                          <h2 className="text-4xl sm:text-5xl">When are you visiting?</h2>
                          <div className="mt-10 grid gap-6 sm:grid-cols-2">
                            <div>
                              <label className="field-label" htmlFor="b-in"><CalendarDays size={12} className="mr-1 inline" /> Check-in</label>
                              <input id="b-in" type="date" className="field" min={today()} value={checkIn} onChange={(e) => onCheckIn(e.target.value)} />
                            </div>
                            <div>
                              <label className="field-label" htmlFor="b-out"><CalendarDays size={12} className="mr-1 inline" /> Check-out</label>
                              <input id="b-out" type="date" className="field" min={addDays(checkIn, 1)} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
                            </div>
                            <div>
                              <span className="field-label"><Users size={12} className="mr-1 inline" /> Guests</span>
                              <Counter value={guests} onChange={setGuests} min={1} max={12} label="Guest" />
                            </div>
                            <div>
                              <span className="field-label"><BedDouble size={12} className="mr-1 inline" /> Rooms</span>
                              <Counter value={rooms} onChange={setRooms} min={1} max={6} label="Room" />
                            </div>
                          </div>
                          <p className="mt-6 text-sm text-ink/50">
                            {nights > 0 ? `${nights} night${nights === 1 ? '' : 's'} · ` : ''}Check-in from {HOTEL.checkIn}, check-out by {HOTEL.checkOut}.
                          </p>
                        </div>
                      )}

                      {step === 1 && (
                        <div>
                          <h2 className="text-4xl sm:text-5xl">Choose your room</h2>
                          <div className="mt-10 space-y-4">
                            {ROOMS.map((r) => {
                              const need = roomsNeeded(r);
                              const selected = roomId === r.id;
                              return (
                                <button
                                  type="button"
                                  key={r.id}
                                  onClick={() => { setRoomId(r.id); if (need > rooms) setRooms(need); }}
                                  className={`group grid w-full gap-0 overflow-hidden border text-left transition-all duration-500 sm:grid-cols-[220px_1fr] ${selected ? 'border-gold bg-white shadow-[0_20px_50px_-25px_rgba(140,109,59,.6)]' : 'border-ink/10 bg-white/60 hover:border-ink/30'}`}
                                >
                                  <div className="relative h-44 overflow-hidden sm:h-full">
                                    <Img src={r.image} alt={r.name} className="h-full w-full object-cover transition-transform duration-[1.5s] group-hover:scale-105" />
                                  </div>
                                  <div className="flex flex-col justify-between gap-4 p-6">
                                    <div className="flex items-start justify-between gap-4">
                                      <div>
                                        <h3 className="text-3xl">{r.name}</h3>
                                        <p className="mt-1 text-sm text-ink/50">{r.size} · {r.bed} · Up to {r.maxGuests} guests</p>
                                      </div>
                                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition ${selected ? 'border-gold bg-gold text-ink' : 'border-ink/20'}`}>
                                        {selected && <Check size={14} />}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap items-end justify-between gap-3">
                                      <div className="flex flex-wrap gap-2">
                                        {r.highlights.slice(0, 3).map((h) => <span key={h} className="bg-ivory-200 px-2.5 py-1 text-[11px] text-ink/60">{h}</span>)}
                                      </div>
                                      <p className="font-display text-3xl">{formatINR(r.price)}<span className="font-sans text-xs text-ink/40"> / night</span></p>
                                    </div>
                                    {need > 1 && <p className="text-xs text-gold-dark">{need} rooms needed for {guests} guests</p>}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {step === 2 && (
                        <div>
                          <h2 className="text-4xl sm:text-5xl">Who's checking in?</h2>
                          <div className="mt-10 grid gap-6 sm:grid-cols-2">
                            <div>
                              <label className="field-label" htmlFor="g-name">Full name *</label>
                              <input id="g-name" className="field" value={guest.name} onChange={(e) => setGuest({ ...guest, name: e.target.value })} placeholder="As on your ID" autoComplete="name" />
                            </div>
                            <div>
                              <label className="field-label" htmlFor="g-phone">Mobile number *</label>
                              <input id="g-phone" type="tel" className="field" value={guest.phone} onChange={(e) => setGuest({ ...guest, phone: e.target.value })} placeholder="10-digit mobile" autoComplete="tel" />
                            </div>
                            <div>
                              <label className="field-label" htmlFor="g-email">Email (optional)</label>
                              <input id="g-email" type="email" className="field" value={guest.email} onChange={(e) => setGuest({ ...guest, email: e.target.value })} placeholder="you@example.com" autoComplete="email" />
                            </div>
                            <div>
                              <label className="field-label" htmlFor="g-arrival">Expected arrival (optional)</label>
                              <input id="g-arrival" type="time" className="field" value={guest.arrival} onChange={(e) => setGuest({ ...guest, arrival: e.target.value })} />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="field-label" htmlFor="g-req">Special requests (optional)</label>
                              <textarea id="g-req" rows={4} className="field resize-none" value={guest.requests} onChange={(e) => setGuest({ ...guest, requests: e.target.value })} placeholder="Early check-in, extra bed, airport pickup, celebration set-up…" />
                            </div>
                          </div>
                          <p className="mt-6 text-xs text-ink/45">A valid government photo ID is required for every adult guest at check-in.</p>
                        </div>
                      )}

                      {step === 3 && room && (
                        <div>
                          <h2 className="text-4xl sm:text-5xl">Review &amp; confirm</h2>
                          <div className="mt-10 divide-y divide-ink/10 border-y border-ink/10">
                            {[
                              ['Room', `${room.name} × ${rooms}`],
                              ['Dates', `${prettyDate(checkIn)} → ${prettyDate(checkOut)}`],
                              ['Stay', `${nights} night${nights === 1 ? '' : 's'} · ${guests} guest${guests === 1 ? '' : 's'}`],
                              ['Guest', `${guest.name} · ${guest.phone}`],
                              ...(guest.requests ? [['Requests', guest.requests]] : []),
                            ].map(([k, v]) => (
                              <div key={k} className="grid gap-1 py-4 sm:grid-cols-[140px_1fr]">
                                <span className="text-[10px] uppercase tracking-[0.22em] text-ink/40">{k}</span>
                                <span className="text-[15px]">{v}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-8 flex items-start gap-4 bg-ivory-200 p-6 text-sm text-ink/60">
                            <MessageCircle size={20} className="mt-0.5 shrink-0 text-gold-dark" />
                            <p>When you confirm, WhatsApp opens with your booking details ready to send to our reservations desk ({HOTEL.phoneDisplay}). We'll confirm availability and your final rate — no payment is taken online.</p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Nav buttons */}
                  <div className="mt-12 flex items-center justify-between gap-4 border-t border-ink/10 pt-8">
                    {step > 0 ? (
                      <button type="button" onClick={() => setStep((s) => s - 1)} className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/60 transition hover:text-ink">
                        <ArrowLeft size={14} /> Back
                      </button>
                    ) : <span />}
                    {step < 3 ? (
                      <button type="button" onClick={next} className={`btn-dark ${canNext ? '' : 'opacity-60'}`}>Continue <ArrowRight size={15} /></button>
                    ) : (
                      <button type="button" onClick={confirm} className="btn-gold"><MessageCircle size={15} /> Confirm via WhatsApp</button>
                    )}
                  </div>
                </div>

                <aside className="lg:col-span-4">
                  <div className="sticky top-28 space-y-4">
                    {summary}
                    <a href={`tel:${HOTEL.phoneTel}`} className="flex items-center justify-between border border-ink/10 bg-white p-5 transition hover:border-gold">
                      <span>
                        <span className="block text-[10px] uppercase tracking-[0.22em] text-ink/40">Prefer to call?</span>
                        <span className="mt-1 block font-display text-2xl">{HOTEL.phoneDisplay}</span>
                      </span>
                      <Phone size={18} className="text-gold-dark" />
                    </a>
                  </div>
                </aside>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
};

export default Booking;
