import { Link } from 'react-router-dom';

export const Crest = ({ className = 'h-11 w-11' }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="crestGold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#8C6D3B" />
        <stop offset=".5" stopColor="#E9D4A7" />
        <stop offset="1" stopColor="#8C6D3B" />
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="none" stroke="url(#crestGold)" strokeWidth="1" />
    <circle cx="32" cy="32" r="26.5" fill="none" stroke="url(#crestGold)" strokeWidth=".6" opacity=".7" />
    <path d="M14 40c4 6 10 9 18 9s14-3 18-9" fill="none" stroke="url(#crestGold)" strokeWidth=".8" />
    <path d="M19 44.5l-2.5 1.2M45 44.5l2.5 1.2M24 47.6l-1.6 2M40 47.6l1.6 2" stroke="url(#crestGold)" strokeWidth=".8" />
    <path d="M32 9.5l1.6 2.6-1.6 2.6-1.6-2.6z" fill="url(#crestGold)" />
    <text x="32" y="41" textAnchor="middle" fontFamily="'Cormorant Garamond', Georgia, serif" fontSize="27" fontWeight="500" fill="url(#crestGold)">E</text>
  </svg>
);

const Logo = ({ tone = 'light', className = '' }: { tone?: 'light' | 'dark'; className?: string }) => (
  <Link to="/" className={`group flex items-center gap-3 ${className}`} aria-label="The Elegance Hotel by Ambience — home">
    <Crest className="h-11 w-11 shrink-0 transition-transform duration-700 group-hover:rotate-[360deg]" />
    <span className="flex flex-col leading-none">
      <span className={`font-display text-[21px] font-medium uppercase tracking-[0.2em] ${tone === 'light' ? 'text-ivory' : 'text-ink'}`}>
        The Elegance
      </span>
      <span className="mt-1.5 text-[8.5px] font-semibold uppercase tracking-[0.42em] text-gold">
        Hotel <span className="opacity-60">·</span> by Ambience
      </span>
    </span>
  </Link>
);

export default Logo;
