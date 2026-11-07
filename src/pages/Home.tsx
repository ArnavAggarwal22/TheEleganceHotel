import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight, ArrowUpRight, BriefcaseBusiness, Car, ConciergeBell, MapPin, MessageCircle, Navigation,
  Phone, Plane, Quote, ShieldCheck, Sparkles, UtensilsCrossed, Wifi, type LucideIcon,
} from 'lucide-react';
import BookingBar from '@/components/BookingBar';
import Collection from '@/components/Collection';
import Img from '@/components/Img';
import Reveal, { EASE } from '@/components/Reveal';
import { introDelay } from '@/lib/intro';
import RoomCard from '@/components/RoomCard';
import SectionHeading from '@/components/SectionHeading';
import {
  AMENITIES, COLLECTION, GALLERY, HOTEL, IMAGES, NEARBY, ROOMS, TESTIMONIALS, TRAVEL_TIMES,
  mapsEmbedUrl, mapsLink, whatsappLink,
} from '@/data/hotel';

const ICONS: Record<string, LucideIcon> = {
  Wifi, Car, UtensilsCrossed, ConciergeBell, Plane, Sparkles, BriefcaseBusiness, ShieldCheck,
};

/* ───────────────────────────── Hero ───────────────────────────── */

const SLIDE_MS = 6500;

const Hero = () => {
  const [slide, setSlide] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const yText = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    const t = setTimeout(() => setSlide((s) => (s + 1) % IMAGES.hero.length), SLIDE_MS);
    return () => clearTimeout(t);
  }, [slide]);

  const words = ['The', 'Elegance'];
  const [D] = useState(introDelay);

  return (
    <section ref={ref} className="grain relative flex min-h-[100svh] flex-col overflow-hidden bg-ink text-ivory">
      <AnimatePresence initial={false}>
        <motion.div
          key={slide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.8, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <img src={IMAGES.hero[slide]} alt="" className="h-full w-full animate-kenburns object-cover" />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-b from-ink/75 via-ink/35 to-ink" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(15,14,12,.55)_100%)]" />

      <motion.div style={{ y: yText, opacity: fade }} className="container relative z-[2] flex flex-1 flex-col items-center justify-center pb-16 pt-36 text-center md:pt-44">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE, delay: D }}
          className="eyebrow center"
        >
          Welcome to Zirakpur's newest address
        </motion.span>

        <h1 className="mt-8 font-display text-[3.6rem] font-medium uppercase leading-[0.9] tracking-[0.04em] sm:text-[6rem] lg:text-[8.5rem]">
          {words.map((w, i) => (
            <span key={w} className="inline-block overflow-hidden px-[0.12em] align-bottom">
              <motion.span
                className="inline-block"
                initial={{ y: '110%' }}
                animate={{ y: 0 }}
                transition={{ duration: 1.3, ease: EASE, delay: D + 0.1 + i * 0.12 }}
              >
                {w}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: D + 0.6 }}
          className="mt-4 flex items-center gap-4 sm:mt-6"
        >
          <span className="h-px w-10 bg-gold sm:w-20" />
          <span className="font-display text-xl italic text-gold-light sm:text-3xl">Hotel by Ambience</span>
          <span className="h-px w-10 bg-gold sm:w-20" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE, delay: D + 0.8 }}
          className="mt-8 max-w-xl text-[15.5px] leading-relaxed text-ivory/75 sm:text-base"
        >
          Refined rooms, quiet luxury and the heartfelt hospitality of The Ambience family — right on the
          Ambala–Chandigarh Highway at Patiala Chowk.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE, delay: D + 0.95 }}
          className="mt-10 flex flex-col gap-4 sm:flex-row"
        >
          <Link to="/book" className="btn-gold">Reserve Your Stay <ArrowRight size={15} /></Link>
          <Link to="/rooms" className="btn-ghost-light">Explore Rooms</Link>
        </motion.div>
      </motion.div>

      {/* Bottom rail: booking bar + slide controls */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, ease: EASE, delay: D + 1.1 }}
        className="container relative z-[3] pb-10"
      >
        <div className="mb-6 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            {IMAGES.hero.map((_, i) => (
              <button
                key={i}
                aria-label={`Show slide ${i + 1}`}
                onClick={() => setSlide(i)}
                className="relative h-[2px] w-10 overflow-hidden bg-ivory/25 sm:w-16"
              >
                {i === slide && (
                  <motion.span
                    key={slide}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: SLIDE_MS / 1000, ease: 'linear' }}
                    className="absolute inset-0 origin-left bg-gold"
                  />
                )}
              </button>
            ))}
            <span className="ml-2 font-display text-lg text-ivory/60">0{slide + 1} <span className="text-ivory/30">/ 0{IMAGES.hero.length}</span></span>
          </div>
          <div className="hidden items-center gap-3 text-[10px] uppercase tracking-luxe text-ivory/50 md:flex">
            Scroll
            <span className="relative block h-10 w-px overflow-hidden bg-ivory/20">
              <span className="absolute inset-x-0 top-0 h-1/2 animate-scrollcue bg-gold" />
            </span>
          </div>
        </div>
        <BookingBar />
      </motion.div>
    </section>
  );
};

/* ───────────────────────────── Intro ───────────────────────────── */

const Intro = () => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const yBig = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const ySmall = useTransform(scrollYProgress, [0, 1], [140, -120]);

  const stats = [
    { value: '3', label: 'Room categories' },
    { value: '24×7', label: 'Front desk & care' },
    { value: '≈20', label: 'Minutes to the airport' },
  ];

  return (
    <section id="about" ref={ref} className="relative overflow-hidden py-24 md:py-36">
      <div className="container grid items-center gap-16 lg:grid-cols-12 lg:gap-10">
        <div className="relative lg:col-span-6">
          <motion.div style={{ y: yBig }} className="relative aspect-[4/5] w-[82%] overflow-hidden">
            <Img src={IMAGES.intro} alt="The Elegance lobby lounge" className="h-full w-full object-cover" />
          </motion.div>
          <motion.div style={{ y: ySmall }} className="absolute -bottom-6 right-0 aspect-square w-[46%] overflow-hidden border-[10px] border-ivory shadow-2xl">
            <Img src={IMAGES.introSecondary} alt="Morning coffee in bed" className="h-full w-full object-cover" />
          </motion.div>
          <div className="absolute -left-4 top-10 hidden -rotate-90 origin-left text-[10px] uppercase tracking-[0.5em] text-gold-dark md:block">
            Est. by The Ambience
          </div>
        </div>

        <div className="lg:col-span-6 lg:pl-8">
          <SectionHeading
            eyebrow="The Elegance Hotel by Ambience"
            title={<>A new chapter of <em className="italic text-gold-dark">Ambience</em> hospitality</>}
          />
          <Reveal delay={0.2}>
            <p className="mt-8 text-[15.5px] leading-relaxed text-ink/65">
              Born from the family behind The Ambience Hotel, The Elegance is our most refined address yet. Every
              room is composed with soft textures, warm light and quiet details — a calm, polished retreat for
              business travellers, families and weekend explorers.
            </p>
            <p className="mt-5 text-[15.5px] leading-relaxed text-ink/65">
              Set right on the Ambala–Chandigarh Highway at Patiala Chowk, you're minutes from the Tricity,
              the airport and the road to the hills — yet a world away the moment you step inside.
            </p>
          </Reveal>

          <Reveal delay={0.3} className="mt-12 grid grid-cols-3 border-y border-ink/10">
            {stats.map((s, i) => (
              <div key={s.label} className={`py-7 ${i ? 'border-l border-ink/10 pl-5 sm:pl-8' : ''}`}>
                <p className="font-display text-4xl text-gold-dark sm:text-5xl">{s.value}</p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-ink/50">{s.label}</p>
              </div>
            ))}
          </Reveal>

          <Reveal delay={0.4} className="mt-10 flex flex-wrap items-center gap-8">
            <Link to="/rooms" className="btn-dark">Discover Rooms <ArrowRight size={15} /></Link>
            <Link to="/our-hotels" className="link-underline text-[11px] font-semibold uppercase tracking-[0.22em] text-ink">
              Meet The Ambience Family
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

/* ───────────────────────────── Marquee ───────────────────────────── */

const Marquee = () => {
  const items = ['Refined Rooms', 'Heartfelt Service', 'Highway Convenience', 'The Ambience Family', 'Minutes from Chandigarh'];
  const row = [...items, ...items];
  return (
    <div className="overflow-hidden border-y border-gold/20 bg-ink py-6 text-ivory">
      <motion.div
        className="flex w-max gap-12 whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 38, ease: 'linear', repeat: Infinity }}
      >
        {[...row, ...row].map((t, i) => (
          <span key={i} className="flex items-center gap-12 font-display text-3xl italic text-ivory/80 sm:text-4xl">
            {t} <span className="text-base not-italic text-gold">✦</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
};

/* ───────────────────────────── Rooms ───────────────────────────── */

const Rooms = () => (
  <section id="rooms" className="py-24 md:py-32">
    <div className="container">
      <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
        <SectionHeading
          eyebrow="Rooms & Suites"
          title={<>Spaces made for <em className="italic text-gold-dark">slow</em> mornings</>}
          intro="Three thoughtfully designed categories — each with plush bedding, fast Wi-Fi, rain showers and the quiet comfort The Ambience is known for."
        />
        <Reveal delay={0.2}>
          <Link to="/rooms" className="btn-ghost-dark shrink-0">View All Rooms <ArrowRight size={15} /></Link>
        </Reveal>
      </div>
      <div className="mt-16 grid gap-10 md:grid-cols-3 md:gap-6 lg:gap-8">
        {ROOMS.map((r, i) => <RoomCard key={r.id} room={r} index={i} />)}
      </div>
    </div>
  </section>
);

/* ───────────────────────────── Experiences ───────────────────────────── */

const Experiences = () => (
  <section id="experiences" className="grain relative overflow-hidden bg-ink py-24 text-ivory md:py-32">
    <div className="pointer-events-none absolute -right-40 top-0 h-[520px] w-[520px] rounded-full bg-gold/10 blur-[120px]" />
    <div className="container relative z-[2]">
      <SectionHeading
        tone="light"
        align="center"
        eyebrow="Thoughtful Comforts"
        title={<>Every detail, <em className="italic text-gold-light">considered</em></>}
        intro="From the moment you arrive to the moment you leave, our team takes care of the little things — so you can simply enjoy your stay."
      />
      <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden border border-ivory/10 bg-ivory/10 sm:grid-cols-2 lg:grid-cols-4">
        {AMENITIES.map((a, i) => {
          const Icon = ICONS[a.icon];
          return (
            <Reveal key={a.title} delay={(i % 4) * 0.08} className="group relative bg-ink p-8 transition-colors duration-500 hover:bg-ink-700 sm:p-10">
              <span className="absolute right-6 top-6 font-display text-sm text-ivory/20">0{i + 1}</span>
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 text-gold transition-all duration-500 group-hover:scale-110 group-hover:border-gold group-hover:bg-gold group-hover:text-ink">
                <Icon size={22} strokeWidth={1.5} />
              </div>
              <h3 className="mt-8 text-2xl">{a.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ivory/55">{a.desc}</p>
            </Reveal>
          );
        })}
      </div>
    </div>
  </section>
);

/* ───────────────────────────── Dining & Events ───────────────────────────── */

const Dining = () => {
  const ambience = COLLECTION[0];
  return (
    <section id="dining" className="py-24 md:py-32">
      <div className="container grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <Reveal x={-40} y={0} className="relative">
          <div className="aspect-[5/6] overflow-hidden">
            <Img src={IMAGES.dining} alt="Dining at The Elegance" className="h-full w-full object-cover transition-transform duration-[2s] hover:scale-105" />
          </div>
          <div className="absolute -bottom-8 -right-4 hidden w-56 bg-ivory p-6 shadow-2xl sm:block lg:-right-10">
            <p className="text-[10px] uppercase tracking-luxe text-gold-dark">Served all day</p>
            <p className="mt-2 font-display text-2xl leading-tight">Breakfast to late-night cravings</p>
          </div>
        </Reveal>

        <div>
          <SectionHeading
            eyebrow="Dining"
            title={<>Flavours of Punjab, <em className="italic text-gold-dark">served</em> with grace</>}
            intro="Wake up to a freshly prepared breakfast, unwind with comforting North Indian classics and continental favourites, or have our kitchen bring dinner straight to your room. Every plate is cooked fresh, the Ambience way."
          />
          <Reveal delay={0.2} className="mt-10 grid gap-4 sm:grid-cols-2">
            {[
              ['Breakfast', 'Fresh, hearty and made to order'],
              ['In-Room Dining', 'Comfort food delivered to your door'],
            ].map(([t, d]) => (
              <div key={t} className="border-l-2 border-gold pl-5">
                <p className="font-display text-2xl">{t}</p>
                <p className="mt-1 text-sm text-ink/55">{d}</p>
              </div>
            ))}
          </Reveal>

          {/* Events → flagship banquet */}
          <Reveal delay={0.3} className="group mt-12 flex flex-col gap-5 overflow-hidden bg-ink p-6 text-ivory sm:flex-row sm:items-center sm:p-7">
            <div className="h-28 w-full shrink-0 overflow-hidden sm:w-36">
              <Img src={IMAGES.events} alt="Celebrations" className="h-full w-full object-cover transition-transform duration-[1.5s] group-hover:scale-110" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-luxe text-gold">Weddings & Celebrations</p>
              <p className="mt-2 font-display text-2xl leading-snug">Planning a big event? Host it at our flagship's Grand Banquet Hall.</p>
              <a href={`tel:${ambience.phoneTel}`} className="mt-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-light link-underline">
                Enquire at The Ambience <ArrowUpRight size={13} />
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

/* ───────────────────────────── Gallery preview ───────────────────────────── */

const GalleryPreview = () => {
  const imgs = GALLERY.slice(0, 5);
  const spans = ['md:col-span-2 md:row-span-2', '', '', 'md:col-span-2', ''];
  return (
    <section className="bg-ink py-24 text-ivory md:py-32">
      <div className="container">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <SectionHeading tone="light" eyebrow="Gallery" title={<>A glimpse of <em className="italic text-gold-light">The Elegance</em></>} />
          <Reveal delay={0.2}><Link to="/gallery" className="btn-ghost-light">View Full Gallery <ArrowRight size={15} /></Link></Reveal>
        </div>
        <div className="mt-14 grid auto-rows-[200px] grid-cols-2 gap-3 md:auto-rows-[260px] md:grid-cols-4 md:gap-4">
          {imgs.map((g, i) => (
            <Reveal key={g.src} delay={i * 0.08} className={`group relative overflow-hidden ${spans[i]} ${i === 4 ? 'col-span-2 md:col-span-1' : ''}`}>
              <Link to="/gallery" className="block h-full">
                <Img src={g.src} alt={g.title} className="h-full w-full object-cover transition-transform duration-[1.6s] group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
                <div className="absolute bottom-5 left-5 translate-y-3 opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  <p className="text-[10px] uppercase tracking-luxe text-gold-light">{g.category}</p>
                  <p className="font-display text-2xl">{g.title}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ───────────────────────────── Testimonials ───────────────────────────── */

const Testimonials = () => {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setI((n) => (n + 1) % TESTIMONIALS.length), 6000);
    return () => clearTimeout(t);
  }, [i]);
  const t = TESTIMONIALS[i];

  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <div className="container">
        <div className="mx-auto max-w-4xl text-center">
          <Reveal><span className="eyebrow center">Loved at The Ambience</span></Reveal>
          <Reveal delay={0.1}><Quote size={46} strokeWidth={1} className="mx-auto mt-10 text-gold" /></Reveal>
          <div className="relative mt-8 min-h-[260px] sm:min-h-[220px]">
            <AnimatePresence mode="wait">
              <motion.figure
                key={i}
                initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -24, filter: 'blur(6px)' }}
                transition={{ duration: 0.8, ease: EASE }}
              >
                <blockquote className="font-display text-[1.9rem] italic leading-snug text-ink sm:text-[2.5rem]">
                  “{t.text}”
                </blockquote>
                <figcaption className="mt-8 text-[11px] uppercase tracking-[0.25em] text-ink/50">
                  <span className="font-semibold text-ink">{t.name}</span> · Guest at The Ambience Hotel · {t.date}
                </figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>
          <div className="mt-10 flex justify-center gap-3">
            {TESTIMONIALS.map((_, n) => (
              <button
                key={n}
                aria-label={`Show review ${n + 1}`}
                onClick={() => setI(n)}
                className={`h-[3px] transition-all duration-500 ${n === i ? 'w-12 bg-gold' : 'w-6 bg-ink/15 hover:bg-ink/30'}`}
              />
            ))}
          </div>
          <Reveal delay={0.2}>
            <p className="mx-auto mt-10 max-w-lg text-sm text-ink/50">
              The same team and standards that earned these words now welcome you at The Elegance.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

/* ───────────────────────────── Location & contact ───────────────────────────── */

const Contact = () => {
  const [form, setForm] = useState({ name: '', phone: '', message: '' });

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `Hello ${HOTEL.fullName},\n\nName: ${form.name}\nPhone: ${form.phone}\n\n${form.message}`;
    window.open(whatsappLink(text), '_blank', 'noopener');
  };

  return (
    <section id="contact" className="bg-ivory-200 py-24 md:py-32">
      <div className="container">
        <SectionHeading
          eyebrow="Location & Contact"
          title={<>Perfectly placed at <em className="italic text-gold-dark">Patiala Chowk</em></>}
          intro="On the Ambala–Chandigarh Highway near PNB Bank — easy to reach from the airport, the Tricity and the road to Kasauli and Shimla."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-12">
          <Reveal className="relative min-h-[380px] overflow-hidden bg-ink lg:col-span-7">
            <iframe
              title="Map to The Elegance Hotel"
              src={mapsEmbedUrl}
              className="absolute inset-0 h-full w-full grayscale-[60%] sepia-[15%] contrast-[1.05]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </Reveal>

          <Reveal delay={0.1} className="flex flex-col justify-between gap-8 bg-ink p-8 text-ivory sm:p-10 lg:col-span-5">
            <div>
              <p className="text-[10px] uppercase tracking-luxe text-gold">Address</p>
              <p className="mt-3 font-display text-2xl leading-snug">
                {HOTEL.addressLines.map((l) => <span key={l} className="block">{l}</span>)}
              </p>
              <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-light link-underline">
                <Navigation size={13} /> Get Directions
              </a>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-luxe text-gold">Reservations</p>
              <a href={`tel:${HOTEL.phoneTel}`} className="mt-3 block font-display text-4xl transition hover:text-gold-light">{HOTEL.phoneDisplay}</a>
              <p className="mt-2 text-sm text-ivory/50">Check-in {HOTEL.checkIn} · Check-out {HOTEL.checkOut}</p>
            </div>
            <ul className="space-y-3 border-t border-ivory/10 pt-6">
              {TRAVEL_TIMES.map((t) => (
                <li key={t.place} className="flex items-center justify-between gap-4 text-sm">
                  <span className="flex items-center gap-2 text-ivory/70"><MapPin size={13} className="text-gold" /> {t.place}</span>
                  <span className="shrink-0 text-ivory/45">{t.time}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* Nearby */}
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
          {NEARBY.map((n, i) => (
            <Reveal key={n.name} delay={i * 0.08} className="group relative aspect-[4/5] overflow-hidden bg-ink sm:aspect-[3/4]">
              <Img src={n.image} alt={n.name} className="h-full w-full object-cover opacity-80 transition-transform duration-[1.6s] group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-ivory sm:p-6">
                <p className="text-[10px] uppercase tracking-[0.25em] text-gold-light">{n.distance}</p>
                <p className="mt-1 font-display text-xl sm:text-2xl">{n.name}</p>
                <p className="mt-1 hidden text-xs text-ivory/60 sm:block">{n.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Enquiry */}
        <Reveal className="mt-6 grid gap-10 bg-ivory p-8 sm:p-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="eyebrow">Write to us</p>
            <h3 className="mt-4 text-4xl leading-tight">Have a question or special request?</h3>
            <p className="mt-4 text-sm leading-relaxed text-ink/55">
              Send us a note and our reservations team will reply on WhatsApp — usually within minutes.
            </p>
          </div>
          <form onSubmit={send} className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
            <div>
              <label className="field-label" htmlFor="c-name">Your name</label>
              <input id="c-name" className="field" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
            </div>
            <div>
              <label className="field-label" htmlFor="c-phone">Phone</label>
              <input id="c-phone" className="field" required type="tel" pattern="[0-9+\s-]{10,15}" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="10-digit mobile" />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label" htmlFor="c-msg">Message</label>
              <textarea id="c-msg" className="field resize-none" rows={4} required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Dates, number of guests, any special requests…" />
            </div>
            <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
              <a href={`tel:${HOTEL.phoneTel}`} className="inline-flex items-center gap-2 text-sm text-ink/60 transition hover:text-gold-dark">
                <Phone size={14} /> Prefer to talk? Call {HOTEL.phoneDisplay}
              </a>
              <button type="submit" className="btn-dark"><MessageCircle size={15} /> Send via WhatsApp</button>
            </div>
          </form>
        </Reveal>
      </div>
    </section>
  );
};

/* ───────────────────────────── Page ───────────────────────────── */

const Home = () => (
  <>
    <Hero />
    <Intro />
    <Marquee />
    <Rooms />
    <Experiences />
    <Dining />
    <Collection />
    <GalleryPreview />
    <Testimonials />
    <Contact />
  </>
);

export default Home;
