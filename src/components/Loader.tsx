import { motion } from 'framer-motion';
import { Crest } from './Logo';
import { EASE } from './Reveal';

const Loader = () => (
  <motion.div
    initial={{ opacity: 1 }}
    exit={{ opacity: 0, transition: { duration: 0.9, ease: EASE } }}
    className="fixed inset-0 z-[100] flex items-center justify-center bg-ink"
  >
    <div className="flex flex-col items-center text-center">
      <motion.div initial={{ opacity: 0, scale: 0.7, rotate: -90 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 1.1, ease: EASE }}>
        <Crest className="h-20 w-20" />
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, letterSpacing: '0.6em' }}
        animate={{ opacity: 1, letterSpacing: '0.24em' }}
        transition={{ duration: 1.3, ease: EASE, delay: 0.2 }}
        className="mt-7 px-4 font-display text-[1.7rem] uppercase text-ivory sm:text-4xl"
      >
        The Elegance Hotel
      </motion.h1>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.2, ease: EASE, delay: 0.4 }}
        className="mt-4 h-px w-40 origin-center bg-gradient-to-r from-transparent via-gold to-transparent"
      />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="mt-4 font-display text-xl italic tracking-[0.08em] text-gold-light"
      >
        by Ambience
      </motion.p>
    </div>
  </motion.div>
);

export default Loader;
