import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, BedDouble, Check, ChevronLeft, ChevronRight, Clock, Eye, Maximize2, Phone, Users,
  type LucideIcon,
} from 'lucide-react';
import Reveal, { EASE } from '@/components/Reveal';
import RoomCard from '@/components/RoomCard';
import { HOTEL, ROOMS, formatINR } from '@/data/hotel';

const RoomDetail = () => {
  const { id } = useParams();
  const room = ROOMS.find((r) => r.id === id);
  const [active, setActive] = useState(0);

  if (!room) return <Navigate to="/rooms" replace />;
  const go = (d: number) => setActive((a) => (a + d + room.gallery.length) % room.gallery.length);

  const facts: [LucideIcon, string, string][] = [
    [Maximize2, 'Size', room.size],
    [BedDouble, 'Bed', room.bed],
    [Users, 'Occupancy', `Up to ${room.maxGuests}`],
    [Eye, 'View', room.view],
  ];

  return (
    <>
      {/* Gallery hero */}
      <section className="relative h-[80svh] min-h-[560px] overflow-hidden bg-ink">
        <AnimatePresence initial={false}>
          <motion.div
            key={active}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: EASE }}
            className="absolute inset-0"
          >
            <img src={room.gallery[active]} alt={`${room.name} — photo ${active + 1}`} className="h-full w-full object-cover" />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-ink/60" />
        <div className="container relative z-[2] flex h-full flex-col justify-end pb-12 text-ivory">
          <Link to="/rooms" className="mb-6 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-ivory/70 transition hover:text-gold-light">
            <ArrowLeft size={14} /> All Rooms
          </Link>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: EASE, delay: 0.2 }}
            className="text-[3.2rem] leading-none sm:text-7xl lg:text-8xl"
          >
            {room.name}
          </motion.h1>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-6">
            <div className="flex gap-2">
              {room.gallery.map((src, i) => (
                <button
                  key={src}
                  onClick={() => setActive(i)}
                  aria-label={`Photo ${i + 1}`}
                  className={`h-12 w-16 overflow-hidden border-2 transition sm:h-16 sm:w-24 ${i === active ? 'border-gold' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={src.replace('w=1800', 'w=300')} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => go(-1)} aria-label="Previous photo" className="flex h-12 w-12 items-center justify-center rounded-full border border-ivory/30 transition hover:border-gold hover:bg-gold hover:text-ink"><ChevronLeft size={18} /></button>
              <button onClick={() => go(1)} aria-label="Next photo" className="flex h-12 w-12 items-center justify-center rounded-full border border-ivory/30 transition hover:border-gold hover:bg-gold hover:text-ink"><ChevronRight size={18} /></button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="container grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal><span className="eyebrow">The Room</span></Reveal>
            <Reveal delay={0.1}><p className="mt-6 font-display text-3xl leading-snug text-ink sm:text-4xl">{room.short}</p></Reveal>
            <Reveal delay={0.15}><p className="mt-6 text-[15.5px] leading-relaxed text-ink/60">{room.description}</p></Reveal>

            <Reveal delay={0.2} className="mt-12 grid grid-cols-2 gap-px bg-ink/10 sm:grid-cols-4">
              {facts.map(([Icon, k, v]) => (
                <div key={k} className="bg-ivory p-5">
                  <Icon size={18} className="text-gold-dark" />
                  <p className="mt-4 text-[10px] uppercase tracking-[0.22em] text-ink/40">{k}</p>
                  <p className="mt-1 font-display text-xl">{v}</p>
                </div>
              ))}
            </Reveal>

            <Reveal delay={0.1} className="mt-14">
              <h2 className="text-4xl">In-room amenities</h2>
              <ul className="mt-8 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {room.amenities.map((a) => (
                  <li key={a} className="flex items-center gap-3 border-b border-ink/10 pb-4 text-[15px] text-ink/70">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/15 text-gold-dark"><Check size={13} /></span>
                    {a}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          {/* Sticky reserve card */}
          <aside className="lg:col-span-5">
            <div className="sticky top-28 bg-ink p-8 text-ivory sm:p-10">
              <p className="text-[10px] uppercase tracking-luxe text-gold">Best rate, booked direct</p>
              <p className="mt-4 font-display text-5xl">
                {formatINR(room.price)}<span className="font-sans text-sm text-ivory/50"> / night</span>
              </p>
              <p className="mt-1 text-xs text-ivory/40">+ {Math.round(HOTEL.gstRate * 100)}% GST · Room only</p>
              <div className="mt-8 space-y-3 border-y border-ivory/10 py-6 text-sm text-ivory/70">
                <p className="flex items-center gap-3"><Clock size={15} className="shrink-0 text-gold" /> Check-in {HOTEL.checkIn} · Check-out {HOTEL.checkOut}</p>
                <p className="flex items-center gap-3"><Check size={15} className="shrink-0 text-gold" /> Quick confirmation on WhatsApp</p>
                <p className="flex items-center gap-3"><Check size={15} className="shrink-0 text-gold" /> No booking fees when you book direct</p>
              </div>
              <Link to={`/book?room=${room.id}`} className="btn-gold mt-8 w-full">Reserve This Room <ArrowRight size={15} /></Link>
              <a href={`tel:${HOTEL.phoneTel}`} className="btn-ghost-light mt-3 w-full"><Phone size={14} /> {HOTEL.phoneDisplay}</a>
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-ivory-200 py-20 md:py-28">
        <div className="container">
          <Reveal><span className="eyebrow">You may also like</span></Reveal>
          <div className="mt-10 grid gap-10 md:grid-cols-2 md:gap-8">
            {ROOMS.filter((r) => r.id !== room.id).map((r) => (
              <RoomCard key={r.id} room={r} index={ROOMS.indexOf(r)} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default RoomDetail;
