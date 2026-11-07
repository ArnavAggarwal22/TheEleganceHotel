import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, Phone } from 'lucide-react';
import { HOTEL, whatsappLink } from '@/data/hotel';

const FloatingContact = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
  <>
    {/* Desktop: floating WhatsApp (appears once past the hero) */}
    <AnimatePresence>
    {show && (
    <motion.a
      href={whatsappLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      className="group fixed bottom-8 right-8 z-40 hidden items-center gap-3 rounded-full bg-[#1f7a4d] py-3.5 pl-4 pr-5 text-white shadow-[0_20px_40px_-12px_rgba(0,0,0,.45)] transition hover:bg-[#1a6942] lg:flex"
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-[#1f7a4d] opacity-20" />
      <MessageCircle size={20} className="relative" />
      <span className="relative text-[11px] font-semibold uppercase tracking-[0.18em]">Chat with us</span>
    </motion.a>
    )}
    </AnimatePresence>

    {/* Mobile: sticky action bar */}
    <div
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-gold/20 bg-ink/95 text-ivory backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <a href={`tel:${HOTEL.phoneTel}`} className="flex flex-col items-center justify-center gap-1 py-3 text-[10px] uppercase tracking-[0.18em]">
        <Phone size={17} className="text-gold" /> Call
      </a>
      <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-1 border-x border-ivory/10 py-3 text-[10px] uppercase tracking-[0.18em]">
        <MessageCircle size={17} className="text-gold" /> WhatsApp
      </a>
      <Link to="/book" className="flex items-center justify-center bg-gold text-[11px] font-semibold uppercase tracking-[0.18em] text-ink">
        Book Now
      </Link>
    </div>
  </>
  );
};

export default FloatingContact;
