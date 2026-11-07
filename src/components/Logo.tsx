import { Link } from 'react-router-dom';
import monogram from '@/assets/brand/elegance-monogram.png';
import lockup from '@/assets/brand/elegance-lockup.png';

/**
 * Brand marks, cut from "The Elegance Hotel Gold Crest.png":
 *  - Crest  → the "E" medallion (for small spaces: navbar, icons)
 *  - Lockup → the full crest with "THE ELEGANCE HOTEL" wordmark
 */
export const Crest = ({ className = 'h-11 w-11' }: { className?: string }) => (
  <img src={monogram} alt="" aria-hidden="true" draggable={false} className={`object-contain ${className}`} />
);

export const Lockup = ({ className = 'w-64' }: { className?: string }) => (
  <img src={lockup} alt="The Elegance Hotel" draggable={false} className={`h-auto object-contain ${className}`} />
);

const Logo = ({ tone = 'light', className = '' }: { tone?: 'light' | 'dark'; className?: string }) => (
  <Link to="/" className={`group flex items-center gap-3 ${className}`} aria-label="The Elegance Hotel by Ambience — home">
    <Crest className="h-11 w-11 shrink-0 transition-transform duration-700 group-hover:scale-110 sm:h-12 sm:w-12" />
    <span className="flex flex-col leading-none">
      <span className={`whitespace-nowrap font-display text-[15px] font-medium uppercase tracking-[0.14em] sm:text-[18px] sm:tracking-[0.16em] ${tone === 'light' ? 'text-ivory' : 'text-ink'}`}>
        The Elegance Hotel
      </span>
      <span className="mt-1.5 font-display text-[13px] italic tracking-[0.06em] text-gold-light sm:text-[14px]">
        by Ambience
      </span>
    </span>
  </Link>
);

export default Logo;
