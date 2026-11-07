import { Link } from 'react-router-dom';
import { Lockup } from '@/components/Logo';

const NotFound = () => (
  <section className="grain relative flex min-h-[100svh] items-center justify-center bg-ink px-5 text-center text-ivory">
    <div className="relative z-[2]">
      <Lockup className="mx-auto w-48" />
      <p className="mt-8 font-display text-[7rem] leading-none text-gold-light sm:text-[10rem]">404</p>
      <h1 className="mt-4 text-4xl">This corridor leads nowhere</h1>
      <p className="mx-auto mt-4 max-w-md text-ivory/60">The page you're looking for has checked out. Let us show you back to the lobby.</p>
      <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
        <Link to="/" className="btn-gold">Return Home</Link>
        <Link to="/book" className="btn-ghost-light">Book a Stay</Link>
      </div>
    </div>
  </section>
);

export default NotFound;
