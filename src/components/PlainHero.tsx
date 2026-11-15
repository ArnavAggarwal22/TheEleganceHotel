import type { ReactNode } from 'react';

/** Short dark header for utility pages (sign in, account, policies), so the fixed navbar stays readable. */
const PlainHero = ({ eyebrow, title, intro }: { eyebrow: string; title: ReactNode; intro?: ReactNode }) => (
  <section className="grain relative overflow-hidden bg-ink pb-14 pt-40 text-ivory md:pb-16 md:pt-44">
    <div className="pointer-events-none absolute -right-40 -top-20 h-[420px] w-[420px] rounded-full bg-gold/10 blur-[120px]" />
    <div className="container relative z-[2]">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-5 text-5xl leading-[1.05] sm:text-6xl">{title}</h1>
      {intro && <p className="mt-5 max-w-2xl text-[15.5px] leading-relaxed text-ivory/60">{intro}</p>}
    </div>
  </section>
);

export default PlainHero;
