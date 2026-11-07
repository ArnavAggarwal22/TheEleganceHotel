import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { EASE } from './Reveal';

interface Props {
  image: string;
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  crumb: string;
}

const PageHero = ({ image, eyebrow, title, intro, crumb }: Props) => (
  <section className="grain relative flex min-h-[68vh] items-end overflow-hidden bg-ink pb-16 pt-40 text-ivory md:min-h-[72vh] md:pb-24">
    <motion.img
      src={image}
      alt=""
      initial={{ scale: 1.15, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 2, ease: EASE }}
      className="absolute inset-0 h-full w-full object-cover"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/40" />
    <div className="container relative z-[2]">
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        aria-label="Breadcrumb"
        className="mb-8 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-ivory/60"
      >
        <Link to="/" className="transition hover:text-gold-light">Home</Link>
        <ChevronRight size={12} />
        <span className="text-gold-light">{crumb}</span>
      </motion.nav>
      <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.3 }} className="eyebrow">
        {eyebrow}
      </motion.span>
      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, ease: EASE, delay: 0.4 }}
        className="mt-5 max-w-4xl text-[3rem] leading-[0.98] sm:text-7xl lg:text-[5.6rem]"
      >
        {title}
      </motion.h1>
      {intro && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE, delay: 0.6 }}
          className="mt-6 max-w-xl text-[15.5px] leading-relaxed text-ivory/70"
        >
          {intro}
        </motion.p>
      )}
    </div>
  </section>
);

export default PageHero;
