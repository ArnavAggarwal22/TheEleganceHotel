import { motion, type HTMLMotionProps } from 'framer-motion';

export const EASE = [0.22, 1, 0.36, 1] as const;

type Props = HTMLMotionProps<'div'> & { delay?: number; y?: number; x?: number };

/** Fades + slides content in once it scrolls into view. */
const Reveal = ({ delay = 0, y = 36, x = 0, children, ...rest }: Props) => (
  <motion.div
    initial={{ opacity: 0, y, x }}
    whileInView={{ opacity: 1, y: 0, x: 0 }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 1, ease: EASE, delay }}
    {...rest}
  >
    {children}
  </motion.div>
);

export default Reveal;
