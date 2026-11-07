import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Expand } from 'lucide-react';
import Img from '@/components/Img';
import PageHero from '@/components/PageHero';
import { EASE } from '@/components/Reveal';
import { GALLERY, IMAGES } from '@/data/hotel';

const CATEGORIES = ['All', ...Array.from(new Set(GALLERY.map((g) => g.category)))];

const Gallery = () => {
  const [filter, setFilter] = useState('All');
  const [open, setOpen] = useState<number | null>(null);
  const items = filter === 'All' ? GALLERY : GALLERY.filter((g) => g.category === filter);

  const step = useCallback(
    (d: number) => setOpen((o) => (o === null ? o : (o + d + items.length) % items.length)),
    [items.length],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, step]);

  return (
    <>
      <PageHero
        image={IMAGES.pageGallery}
        crumb="Gallery"
        eyebrow="Moments at The Elegance Hotel"
        title={<>The <em className="italic text-gold-light">Gallery</em></>}
        intro="Step inside — rooms, spaces and the small details that make a stay feel special."
      />

      <section className="py-16 md:py-24">
        <div className="container">
          <div className="no-scrollbar -mx-5 mb-12 flex gap-2 overflow-x-auto px-5 md:mx-0 md:justify-center md:px-0">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`relative shrink-0 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${filter === c ? 'text-ivory' : 'text-ink/60 hover:text-ink'}`}
              >
                {filter === c && <motion.span layoutId="gal-pill" className="absolute inset-0 bg-ink" transition={{ duration: 0.5, ease: EASE }} />}
                <span className="relative">{c}</span>
              </button>
            ))}
          </div>

          <motion.div layout className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            <AnimatePresence mode="popLayout">
              {items.map((g, i) => (
                <motion.button
                  layout
                  key={g.src + g.title}
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={{ duration: 0.6, ease: EASE }}
                  onClick={() => setOpen(i)}
                  className="group relative mb-4 block w-full break-inside-avoid overflow-hidden bg-ink-700"
                >
                  <Img src={g.src} alt={g.title} className={`w-full object-cover transition-transform duration-[1.6s] group-hover:scale-110 ${i % 3 === 0 ? 'aspect-[3/4]' : i % 3 === 1 ? 'aspect-[4/3]' : 'aspect-square'}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
                  <div className="absolute inset-x-5 bottom-5 flex translate-y-3 items-end justify-between text-left text-ivory opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                    <span>
                      <span className="block text-[10px] uppercase tracking-luxe text-gold-light">{g.category}</span>
                      <span className="font-display text-2xl">{g.title}</span>
                    </span>
                    <Expand size={18} />
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      <AnimatePresence>
        {open !== null && items[open] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/95 p-4 backdrop-blur-md"
            onClick={() => setOpen(null)}
            role="dialog"
            aria-modal="true"
          >
            <button aria-label="Close" className="absolute right-5 top-5 flex h-12 w-12 items-center justify-center rounded-full border border-ivory/20 text-ivory transition hover:border-gold" onClick={() => setOpen(null)}><X size={18} /></button>
            <button aria-label="Previous" className="absolute left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-ivory/20 text-ivory transition hover:border-gold sm:left-6" onClick={(e) => { e.stopPropagation(); step(-1); }}><ChevronLeft size={20} /></button>
            <button aria-label="Next" className="absolute right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-ivory/20 text-ivory transition hover:border-gold sm:right-6" onClick={(e) => { e.stopPropagation(); step(1); }}><ChevronRight size={20} /></button>
            <motion.figure key={open} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: EASE }} className="max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
              <img src={items[open].src.replace('w=1400', 'w=2200')} alt={items[open].title} className="max-h-[80vh] w-auto object-contain" />
              <figcaption className="mt-4 flex justify-between text-ivory/70">
                <span className="font-display text-2xl text-ivory">{items[open].title}</span>
                <span className="text-xs uppercase tracking-[0.2em]">{open + 1} / {items.length}</span>
              </figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Gallery;
