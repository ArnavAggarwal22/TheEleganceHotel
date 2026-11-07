import { motion } from 'framer-motion';
import { Lockup } from './Logo';
import { EASE } from './Reveal';

const Loader = () => (
  <motion.div
    initial={{ opacity: 1 }}
    exit={{ opacity: 0, transition: { duration: 0.9, ease: EASE } }}
    className="fixed inset-0 z-[100] flex items-center justify-center bg-ink px-6"
  >
    <div className="flex flex-col items-center text-center">
      <h1 className="sr-only">The Elegance Hotel by Ambience</h1>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, filter: 'blur(8px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 1.2, ease: EASE }}
      >
        <Lockup className="w-[260px] sm:w-[340px]" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.8, ease: EASE }}
        className="mt-5 font-display text-xl italic tracking-[0.08em] text-gold-light sm:text-2xl"
      >
        by Ambience
      </motion.p>
    </div>
  </motion.div>
);

export default Loader;
