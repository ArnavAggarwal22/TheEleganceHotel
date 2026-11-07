import type { ReactNode } from 'react';
import Reveal from './Reveal';

interface Props {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: 'left' | 'center';
  tone?: 'light' | 'dark';
  className?: string;
}

const SectionHeading = ({ eyebrow, title, intro, align = 'left', tone = 'dark', className = '' }: Props) => (
  <div className={`${align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-2xl'} ${className}`}>
    <Reveal>
      <span className={`eyebrow ${align === 'center' ? 'center' : ''}`}>{eyebrow}</span>
    </Reveal>
    <Reveal delay={0.08}>
      <h2 className={`mt-5 text-[2.6rem] leading-[1.05] sm:text-5xl lg:text-[3.6rem] ${tone === 'light' ? 'text-ivory' : 'text-ink'}`}>
        {title}
      </h2>
    </Reveal>
    {intro && (
      <Reveal delay={0.16}>
        <p className={`mt-6 text-[15.5px] leading-relaxed ${tone === 'light' ? 'text-ivory/65' : 'text-ink/60'}`}>{intro}</p>
      </Reveal>
    )}
  </div>
);

export default SectionHeading;
