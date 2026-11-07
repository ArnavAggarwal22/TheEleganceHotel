import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin, Phone, MessageCircle } from 'lucide-react';
import Logo from './Logo';
import Reveal from './Reveal';
import Img from './Img';
import { COLLECTION, HOTEL, IMAGES, ROOMS, mapsLink, whatsappLink } from '@/data/hotel';

const Footer = () => (
  <footer className="relative bg-ink text-ivory/60">
    {/* CTA band */}
    <section className="relative overflow-hidden">
      <Img src={IMAGES.hero[1]} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/70 to-ink" />
      <div className="container relative z-[2] py-24 text-center md:py-32">
        <Reveal>
          <span className="eyebrow center">Reservations</span>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="mx-auto mt-6 max-w-3xl text-[2.7rem] leading-[1.05] text-ivory sm:text-6xl lg:text-7xl">
            Your elegant escape <em className="gold-text font-display italic">awaits</em>
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-ivory/60">
            Book directly with us for the best available rate, flexible requests and a personal welcome from our team.
          </p>
        </Reveal>
        <Reveal delay={0.3} className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link to="/book" className="btn-gold">Book Your Stay</Link>
          <a href={`tel:${HOTEL.phoneTel}`} className="btn-ghost-light">
            <Phone size={14} /> {HOTEL.phoneDisplay}
          </a>
        </Reveal>
      </div>
    </section>

    <div className="container border-t border-ivory/10 pb-28 pt-16 lg:pb-12">
      <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Logo />
          <p className="mt-6 max-w-sm text-sm leading-relaxed">
            {HOTEL.fullName} — a refined stay on the Ambala–Chandigarh Highway, crafted by the family behind The Ambience Hotel.
          </p>
          <div className="mt-6 flex gap-3">
            <a href={`tel:${HOTEL.phoneTel}`} aria-label="Call" className="flex h-10 w-10 items-center justify-center rounded-full border border-ivory/15 transition hover:border-gold hover:text-gold-light"><Phone size={15} /></a>
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="flex h-10 w-10 items-center justify-center rounded-full border border-ivory/15 transition hover:border-gold hover:text-gold-light"><MessageCircle size={15} /></a>
            <a href={mapsLink} target="_blank" rel="noopener noreferrer" aria-label="Directions" className="flex h-10 w-10 items-center justify-center rounded-full border border-ivory/15 transition hover:border-gold hover:text-gold-light"><MapPin size={15} /></a>
          </div>
        </div>

        <div className="lg:col-span-2">
          <h4 className="mb-5 font-sans text-[10px] font-semibold uppercase tracking-luxe text-gold">Explore</h4>
          <ul className="space-y-3 text-sm">
            {[['Home', '/'], ['Rooms & Suites', '/rooms'], ['Dining', '/#dining'], ['Gallery', '/gallery'], ['Book a Stay', '/book']].map(([l, to]) => (
              <li key={l}><Link to={to} className="link-underline transition hover:text-ivory">{l}</Link></li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2">
          <h4 className="mb-5 font-sans text-[10px] font-semibold uppercase tracking-luxe text-gold">Stay</h4>
          <ul className="space-y-3 text-sm">
            {ROOMS.map((r) => (
              <li key={r.id}><Link to={`/rooms/${r.id}`} className="link-underline transition hover:text-ivory">{r.name}</Link></li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-4">
          <h4 className="mb-5 font-sans text-[10px] font-semibold uppercase tracking-luxe text-gold">Contact</h4>
          <ul className="space-y-4 text-sm">
            <li className="flex gap-3">
              <MapPin size={16} className="mt-0.5 shrink-0 text-gold" />
              <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="transition hover:text-ivory">
                {HOTEL.addressLines.map((l) => <span key={l} className="block">{l}</span>)}
              </a>
            </li>
            <li className="flex gap-3">
              <Phone size={16} className="mt-0.5 shrink-0 text-gold" />
              <a href={`tel:${HOTEL.phoneTel}`} className="transition hover:text-ivory">{HOTEL.phoneDisplay}</a>
            </li>
          </ul>
          <div className="mt-8 border-t border-ivory/10 pt-6">
            <h4 className="mb-4 font-sans text-[10px] font-semibold uppercase tracking-luxe text-gold">The Ambience Hotels</h4>
            <ul className="space-y-2 text-sm">
              {COLLECTION.filter((h) => !h.comingSoon).map((h) => (
                <li key={h.id}>
                  <Link to="/our-hotels" className="group inline-flex items-center gap-2 transition hover:text-ivory">
                    {h.name}{h.current && <span className="text-[10px] uppercase tracking-[0.2em] text-gold">· You are here</span>}
                    <ArrowUpRight size={13} className="opacity-0 transition group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-16 flex flex-col gap-3 border-t border-ivory/10 pt-8 text-xs tracking-wide md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} {HOTEL.fullName}. All rights reserved.</p>
        <p className="uppercase tracking-[0.2em]">A member of <span className="text-gold-light">The Ambience Hotels</span></p>
      </div>
    </div>
  </footer>
);

export default Footer;
