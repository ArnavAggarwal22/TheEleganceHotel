import { Link } from 'react-router-dom';
import { ArrowRight, BedDouble, Check, Eye, Maximize2, Users } from 'lucide-react';
import Img from '@/components/Img';
import PageHero from '@/components/PageHero';
import Reveal from '@/components/Reveal';
import { HOTEL, IMAGES, ROOMS, formatINR } from '@/data/hotel';

const Rooms = () => (
  <>
    <PageHero
      image={IMAGES.pageRooms}
      crumb="Rooms & Suites"
      eyebrow="Stay at The Elegance Hotel"
      title={<>Rooms &amp; <em className="italic text-gold-light">Suites</em></>}
      intro="Three categories of calm, carefully finished rooms — each designed for deep sleep, easy work and unhurried mornings."
    />

    <section className="py-24 md:py-32">
      <div className="container space-y-24 md:space-y-36">
        {ROOMS.map((room, i) => (
          <article key={room.id} className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
            <Reveal x={i % 2 ? 40 : -40} y={0} className={`group relative lg:col-span-7 ${i % 2 ? 'lg:order-2' : ''}`}>
              <Link to={`/rooms/${room.id}`} className="block aspect-[16/11] overflow-hidden bg-ink-700">
                <Img src={room.image} alt={room.name} className="h-full w-full object-cover transition-transform duration-[2s] group-hover:scale-105" />
              </Link>
              <span className={`pointer-events-none absolute -top-10 font-display text-[7rem] leading-none text-gold/25 sm:-top-14 sm:text-[9rem] ${i % 2 ? 'right-4' : 'left-4'}`}>0{i + 1}</span>
            </Reveal>

            <div className="lg:col-span-5">
              <Reveal><span className="eyebrow">From {formatINR(room.price)} / night</span></Reveal>
              <Reveal delay={0.08}><h2 className="mt-5 text-5xl leading-none sm:text-6xl">{room.name}</h2></Reveal>
              <Reveal delay={0.14}><p className="mt-6 text-[15.5px] leading-relaxed text-ink/60">{room.description}</p></Reveal>
              <Reveal delay={0.2} className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-ink/10 py-6 text-sm text-ink/70">
                <span className="flex items-center gap-3"><Maximize2 size={16} className="text-gold-dark" /> {room.size}</span>
                <span className="flex items-center gap-3"><BedDouble size={16} className="text-gold-dark" /> {room.bed}</span>
                <span className="flex items-center gap-3"><Users size={16} className="text-gold-dark" /> Up to {room.maxGuests} guests</span>
                <span className="flex items-center gap-3"><Eye size={16} className="text-gold-dark" /> {room.view}</span>
              </Reveal>
              <Reveal delay={0.26} className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
                {room.highlights.map((h) => (
                  <span key={h} className="flex items-center gap-2 text-sm text-ink/60"><Check size={14} className="text-gold" /> {h}</span>
                ))}
              </Reveal>
              <Reveal delay={0.32} className="mt-10 flex flex-wrap gap-4">
                <Link to={`/book?room=${room.id}`} className="btn-gold">Book This Room <ArrowRight size={15} /></Link>
                <Link to={`/rooms/${room.id}`} className="btn-ghost-dark">View Details</Link>
              </Reveal>
            </div>
          </article>
        ))}
      </div>
    </section>

    <section className="bg-ivory-200 py-16">
      <div className="container flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
        <p className="font-display text-3xl">Need help choosing? Our team is happy to advise.</p>
        <a href={`tel:${HOTEL.phoneTel}`} className="btn-dark shrink-0">Call {HOTEL.phoneDisplay}</a>
      </div>
    </section>
  </>
);

export default Rooms;
