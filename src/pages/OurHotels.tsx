import { ArrowUpRight, Gem, HandHeart, Heart, MapPin, Sparkles } from 'lucide-react';
import Collection from '@/components/Collection';
import Img from '@/components/Img';
import PageHero from '@/components/PageHero';
import Reveal from '@/components/Reveal';
import SectionHeading from '@/components/SectionHeading';
import { AMBIENCE, AMBIENCE_GALLERY, IMAGES, PARENT_BRAND } from '@/data/hotel';
import ambienceLogo from '@/assets/ambience/ambience-logo.png';

const VALUES = [
  { icon: HandHeart, title: 'Heartfelt Hospitality', desc: 'Genuine Punjabi warmth from a team that treats every guest like family.' },
  { icon: Sparkles, title: 'Spotless Standards', desc: 'Immaculate rooms and consistent quality across every Ambience address.' },
  { icon: Gem, title: 'Honest Value', desc: 'Premium comfort at fair, transparent prices — always best when booked direct.' },
  { icon: Heart, title: 'Remembered Details', desc: 'Your preferences, celebrations and requests — noted and quietly taken care of.' },
];

const OurHotels = () => (
  <>
    <PageHero
      image={IMAGES.pageHotels}
      crumb="Our Hotels"
      eyebrow={PARENT_BRAND.name}
      title={<>The Ambience <em className="italic text-gold-light">family</em></>}
      intro="The Elegance Hotel is proudly part of The Ambience Hotels — one family, one promise of warm, refined hospitality across every address."
    />

    {/* Brand story */}
    <section className="py-24 md:py-32">
      <div className="container grid items-center gap-16 lg:grid-cols-2">
        <Reveal className="relative mx-auto w-full max-w-md">
          <a href={AMBIENCE.website} target="_blank" rel="noopener noreferrer" className="block aspect-square overflow-hidden bg-ink shadow-2xl" aria-label="Visit The Ambience Hotel website">
            <img src={ambienceLogo} alt="The Ambience Hotel crest" className="h-full w-full object-cover transition-transform duration-[1.5s] hover:scale-105" />
          </a>
          <div className="absolute -bottom-6 -right-6 hidden bg-gold px-6 py-5 text-ink sm:block">
            <p className="text-[10px] font-semibold uppercase tracking-luxe">Parent Brand</p>
            <p className="font-display text-2xl">The Ambience Hotels</p>
          </div>
        </Reveal>
        <div>
          <SectionHeading eyebrow="Our Story" title={<>From one hotel to a <em className="italic text-gold-dark">family</em> of addresses</>} />
          <Reveal delay={0.15}>
            <p className="mt-8 text-[15.5px] leading-relaxed text-ink/65">{PARENT_BRAND.story}</p>
            <p className="mt-5 text-[15.5px] leading-relaxed text-ink/65">
              Whether you stay with us at{' '}
              <a href={AMBIENCE.website} target="_blank" rel="noopener noreferrer" className="text-gold-dark link-underline">The Ambience Hotel</a>{' '}
              near Unicity Homes or at The Elegance Hotel on the
              Ambala–Chandigarh Highway, you'll find the same care in every detail — and the same team ready to
              help with anything you need.
            </p>
          </Reveal>
          <Reveal delay={0.2} className="mt-8 flex flex-wrap gap-3">
            <a href={AMBIENCE.website} target="_blank" rel="noopener noreferrer" className="btn-dark">
              {AMBIENCE.websiteLabel} <ArrowUpRight size={14} />
            </a>
            <a href={AMBIENCE.map} target="_blank" rel="noopener noreferrer" className="btn-ghost-dark">
              <MapPin size={14} /> Find The Ambience
            </a>
          </Reveal>
          <Reveal delay={0.25} className="mt-10 grid grid-cols-3 gap-3">
            {AMBIENCE_GALLERY.map((g) => (
              <figure key={g.title} className="group overflow-hidden">
                <div className="aspect-square overflow-hidden">
                  <Img src={g.src} alt={g.title} className="h-full w-full object-cover transition-transform duration-[1.5s] group-hover:scale-110" />
                </div>
                <figcaption className="mt-2 text-[10px] uppercase tracking-[0.18em] text-ink/50">{g.title}</figcaption>
              </figure>
            ))}
          </Reveal>
        </div>
      </div>
    </section>

    <Collection showIntro={false} />

    {/* Promise */}
    <section className="grain relative overflow-hidden bg-ink py-24 text-ivory md:py-32">
      <div className="container relative z-[2]">
        <SectionHeading tone="light" align="center" eyebrow="The Ambience Promise" title={<>What every stay <em className="italic text-gold-light">stands for</em></>} />
        <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v, i) => (
            <Reveal key={v.title} delay={i * 0.1} className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold/40 text-gold">
                <v.icon size={24} strokeWidth={1.4} />
              </div>
              <h3 className="mt-6 text-2xl">{v.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ivory/55">{v.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  </>
);

export default OurHotels;
