import { Link } from 'react-router-dom';
import { ArrowUpRight, Check, MapPin, Phone, Plus } from 'lucide-react';
import Img from './Img';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';
import { Crest } from './Logo';
import { COLLECTION, PARENT_BRAND } from '@/data/hotel';

/**
 * "The Ambience Collection" — presents The Ambience as the parent brand
 * and lists every hotel in the family, with The Ambience Hotel as flagship.
 */
const Collection = ({ showIntro = true }: { showIntro?: boolean }) => {
  const [flagship, ...rest] = COLLECTION;

  return (
    <section id="collection" className="relative overflow-hidden bg-ivory-200 py-24 md:py-32">
      <div className="container">
        {showIntro && (
          <div className="grid items-end gap-10 lg:grid-cols-2">
            <SectionHeading
              eyebrow="The Ambience Collection"
              title={<>One family. <em className="italic text-gold-dark">Distinct</em> addresses.</>}
            />
            <Reveal delay={0.15}>
              <p className="text-[15.5px] leading-relaxed text-ink/60 lg:max-w-lg">{PARENT_BRAND.story}</p>
            </Reveal>
          </div>
        )}

        {/* Flagship — large feature */}
        <Reveal className={`${showIntro ? 'mt-16' : ''} group relative grid overflow-hidden bg-ink text-ivory lg:grid-cols-12`}>
          <div className="relative min-h-[320px] overflow-hidden lg:col-span-7 lg:min-h-[540px]">
            <Img src={flagship.image} alt={flagship.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[2s] group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-ink/60 lg:to-ink" />
            <span className="absolute left-6 top-6 bg-gold px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-ink">
              {flagship.label}
            </span>
          </div>
          <div className="relative flex flex-col justify-center p-8 sm:p-12 lg:col-span-5">
            <Crest className="mb-6 h-12 w-12 opacity-80" />
            <p className="text-[10px] uppercase tracking-luxe text-gold">Our Parent Hotel</p>
            <h3 className="mt-3 text-4xl leading-tight sm:text-5xl">{flagship.name}</h3>
            <p className="mt-3 flex items-start gap-2 text-sm text-ivory/55">
              <MapPin size={15} className="mt-0.5 shrink-0 text-gold" /> {flagship.location}
            </p>
            <p className="mt-6 text-[15px] leading-relaxed text-ivory/70">{flagship.description}</p>
            <ul className="mt-6 space-y-2.5">
              {flagship.highlights.map((h) => (
                <li key={h} className="flex items-center gap-3 text-sm text-ivory/80">
                  <Check size={14} className="text-gold" /> {h}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              {flagship.links?.map((l, i) => (
                <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className={i === 0 ? 'btn-gold !px-5' : 'btn-ghost-light !px-5'}>
                  {l.label} <ArrowUpRight size={14} />
                </a>
              ))}
            </div>
            {flagship.phoneTel && (
              <a href={`tel:${flagship.phoneTel}`} className="mt-6 inline-flex items-center gap-2 text-sm text-ivory/60 transition hover:text-gold-light">
                <Phone size={14} /> {flagship.phoneDisplay}
              </a>
            )}
          </div>
        </Reveal>

        {/* Rest of the family */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {rest.map((h, i) =>
            h.comingSoon ? (
              <Reveal key={h.id} delay={i * 0.1} className="relative flex min-h-[360px] flex-col justify-between overflow-hidden border border-dashed border-gold/50 p-8 sm:p-10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-luxe text-gold-dark">{h.label}</span>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 text-gold-dark"><Plus size={18} /></span>
                </div>
                <div>
                  <h3 className="text-4xl text-ink">{h.name}</h3>
                  <p className="mt-2 text-sm uppercase tracking-[0.2em] text-ink/40">{h.location}</p>
                  <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink/60">{h.description}</p>
                </div>
              </Reveal>
            ) : (
              <Reveal key={h.id} delay={i * 0.1} className="group relative min-h-[360px] overflow-hidden bg-ink text-ivory">
                {h.image && <Img src={h.image} alt={h.name} className="absolute inset-0 h-full w-full object-cover opacity-70 transition-transform duration-[2s] group-hover:scale-105" />}
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/10" />
                <div className="relative flex h-full flex-col justify-between p-8 sm:p-10">
                  <div className="flex items-center justify-between">
                    <span className="bg-ivory/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-gold-light backdrop-blur">
                      {h.label}
                    </span>
                    {h.current && (
                      <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-ivory/80">
                        <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-gold" /></span>
                        You are here
                      </span>
                    )}
                  </div>
                  <div className="mt-24">
                    <h3 className="text-4xl leading-tight">
                      {h.name} <span className="block font-sans text-[11px] uppercase tracking-luxe text-gold">by Ambience</span>
                    </h3>
                    <p className="mt-3 flex items-start gap-2 text-sm text-ivory/60"><MapPin size={14} className="mt-0.5 shrink-0 text-gold" /> {h.location}</p>
                    <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ivory/70">{h.description}</p>
                    <Link to="/rooms" className="mt-6 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-light link-underline">
                      Explore Rooms <ArrowUpRight size={14} />
                    </Link>
                  </div>
                </div>
              </Reveal>
            ),
          )}
        </div>
      </div>
    </section>
  );
};

export default Collection;
