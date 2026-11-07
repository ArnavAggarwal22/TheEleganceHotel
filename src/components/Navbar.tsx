import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Phone, X, MapPin } from 'lucide-react';
import Logo from './Logo';
import { EASE } from './Reveal';
import { HOTEL } from '@/data/hotel';

export const NAV_LINKS = [
  { label: 'Stay', to: '/rooms' },
  { label: 'Dining', to: '/#dining' },
  { label: 'Experiences', to: '/#experiences' },
  { label: 'Our Hotels', to: '/our-hotels' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Contact', to: '/#contact' },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname, hash]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const isActive = (to: string) =>
    to.startsWith('/#') ? pathname === '/' && hash === to.slice(1) : pathname.startsWith(to);

  return (
    <>
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: EASE, delay: 0.2 }}
        className="fixed inset-x-0 top-0 z-50"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        {/* Utility bar */}
        <div
          className={`hidden overflow-hidden border-b border-ivory/10 text-ivory/70 transition-all duration-500 lg:block ${
            scrolled ? 'max-h-0 opacity-0' : 'max-h-12 opacity-100'
          }`}
        >
          <div className="container flex items-center justify-between py-2.5 text-[11px] tracking-[0.18em]">
            <span className="uppercase">
              A member of <span className="text-gold-light">The Ambience Hotels</span>
            </span>
            <div className="flex items-center gap-8">
              <a href={`tel:${HOTEL.phoneTel}`} className="flex items-center gap-2 transition hover:text-gold-light">
                <Phone size={12} /> {HOTEL.phoneDisplay}
              </a>
              <span className="flex items-center gap-2">
                <MapPin size={12} /> Patiala Chowk, Zirakpur
              </span>
            </div>
          </div>
        </div>

        {/* Main bar */}
        <div
          className={`transition-all duration-500 ${
            scrolled ? 'border-b border-gold/15 bg-ink/85 py-3 shadow-[0_10px_40px_-20px_rgba(0,0,0,.6)] backdrop-blur-xl' : 'py-5'
          }`}
        >
          <nav className="container flex items-center justify-between gap-6">
            <Logo />

            <ul className="hidden items-center gap-9 xl:flex">
              {NAV_LINKS.map((l) => (
                <li key={l.label}>
                  <NavLink
                    to={l.to}
                    className={`link-underline text-[11.5px] font-medium uppercase tracking-[0.22em] transition-colors ${
                      isActive(l.to) ? 'text-gold-light' : 'text-ivory/80 hover:text-ivory'
                    }`}
                  >
                    {l.label}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-3">
              <a
                href={`tel:${HOTEL.phoneTel}`}
                aria-label="Call the hotel"
                className="hidden h-11 w-11 items-center justify-center rounded-full border border-ivory/25 text-ivory transition hover:border-gold hover:text-gold-light sm:flex xl:hidden"
              >
                <Phone size={16} />
              </a>
              <Link to="/book" className="btn-gold hidden !px-6 !py-3 sm:inline-flex">
                Book Your Stay
              </Link>
              <button
                onClick={() => setOpen(true)}
                aria-label="Open menu"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-ivory/25 text-ivory transition hover:border-gold xl:hidden"
              >
                <Menu size={18} />
              </button>
            </div>
          </nav>
        </div>
      </motion.header>

      {/* Mobile / tablet overlay menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ clipPath: 'circle(0% at 100% 0%)' }}
            animate={{ clipPath: 'circle(150% at 100% 0%)' }}
            exit={{ clipPath: 'circle(0% at 100% 0%)' }}
            transition={{ duration: 0.8, ease: EASE }}
            className="grain fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-ink text-ivory"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="container flex items-center justify-between py-5">
              <Logo />
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-ivory/25 transition hover:border-gold"
              >
                <X size={18} />
              </button>
            </div>

            <div className="container relative z-[2] flex flex-1 flex-col justify-center py-10">
              <ul className="space-y-2">
                {[{ label: 'Home', to: '/' }, ...NAV_LINKS].map((l, i) => (
                  <motion.li
                    key={l.label}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + i * 0.06, duration: 0.7, ease: EASE }}
                  >
                    <Link
                      to={l.to}
                      onClick={() => setOpen(false)}
                      className="group flex items-baseline gap-5 py-1 font-display text-[2.6rem] leading-tight text-ivory/90 transition hover:text-gold-light sm:text-6xl"
                    >
                      <span className="font-sans text-xs tracking-[0.2em] text-gold">0{i + 1}</span>
                      <span className="transition-transform duration-500 group-hover:translate-x-2">{l.label}</span>
                    </Link>
                  </motion.li>
                ))}
              </ul>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-12 flex flex-col gap-6 border-t border-ivory/10 pt-8 text-sm text-ivory/60 sm:flex-row sm:items-end sm:justify-between"
              >
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-luxe text-gold">Reservations</p>
                  <a href={`tel:${HOTEL.phoneTel}`} className="font-display text-3xl text-ivory">{HOTEL.phoneDisplay}</a>
                  <p>{HOTEL.addressOneLine}</p>
                </div>
                <Link to="/book" onClick={() => setOpen(false)} className="btn-gold self-start">
                  Book Your Stay
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
