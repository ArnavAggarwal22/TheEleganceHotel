import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'sonner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Loader from '@/components/Loader';
import FloatingContact from '@/components/FloatingContact';
import { EASE } from '@/components/Reveal';
import { markIntroDone } from '@/lib/intro';
import Home from '@/pages/Home';
import Rooms from '@/pages/Rooms';
import RoomDetail from '@/pages/RoomDetail';
import Booking from '@/pages/Booking';
import Gallery from '@/pages/Gallery';
import OurHotels from '@/pages/OurHotels';
import NotFound from '@/pages/NotFound';
import SignIn from '@/pages/SignIn';
import Account from '@/pages/Account';
import { CancellationPolicy, PrivacyPolicy, TermsOfStay } from '@/pages/Policies';
import AdminApp from '@/admin/AdminApp';

/** Scrolls to #hash targets (e.g. /#dining) once they exist on the page. */
const HashScroller = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    let tries = 0;
    const id = setInterval(() => {
      const el = document.querySelector(hash);
      if (el || ++tries > 25) {
        clearInterval(id);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
    return () => clearInterval(id);
  }, [pathname, hash]);
  return null;
};

const TITLES: Record<string, string> = {
  '/': 'The Elegance Hotel by Ambience | Luxury Stay in Zirakpur',
  '/rooms': 'Rooms | The Elegance Hotel by Ambience',
  '/book': 'Book Your Stay | The Elegance Hotel by Ambience',
  '/gallery': 'Gallery | The Elegance Hotel by Ambience',
  '/our-hotels': 'Our Hotels | The Ambience Hotels',
  '/signin': 'Sign in | The Elegance Hotel by Ambience',
  '/account': 'My Account | The Elegance Hotel by Ambience',
  '/privacy': 'Privacy Policy | The Elegance Hotel by Ambience',
  '/terms': 'Terms of Stay | The Elegance Hotel by Ambience',
  '/cancellation-policy': 'Cancellation & Refunds | The Elegance Hotel by Ambience',
};

const PUBLIC_PAGES = ['/', '/rooms', '/book', '/gallery', '/our-hotels', '/signin', '/account', '/privacy', '/terms', '/cancellation-policy'];

const Page = ({ children }: { children: React.ReactNode }) => (
  <motion.main
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.45, ease: EASE }}
  >
    {children}
  </motion.main>
);

export default function App() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => { setLoading(false); markIntroDone(); }, 1700);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    document.title = TITLES[location.pathname] ?? (location.pathname.startsWith('/rooms/') ? 'Room Details | The Elegance Hotel by Ambience' : TITLES['/']);
  }, [location.pathname]);

  const isAdmin = location.pathname === '/admin' || location.pathname.startsWith('/admin/');
  const bare = isAdmin || (!PUBLIC_PAGES.includes(location.pathname) && !location.pathname.startsWith('/rooms/'));

  // The admin dashboard is a separate screen with its own layout (reach it by typing /admin)
  if (isAdmin) {
    return (
      <>
        <AdminApp />
        <Toaster position="top-center" />
      </>
    );
  }

  return (
    <>
      <AnimatePresence>{loading && <Loader key="loader" />}</AnimatePresence>
      <HashScroller />
      {!bare && <Navbar />}
      <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Page><Home /></Page>} />
          <Route path="/rooms" element={<Page><Rooms /></Page>} />
          <Route path="/rooms/:id" element={<Page><RoomDetail /></Page>} />
          <Route path="/book" element={<Page><Booking /></Page>} />
          <Route path="/gallery" element={<Page><Gallery /></Page>} />
          <Route path="/our-hotels" element={<Page><OurHotels /></Page>} />
          <Route path="/signin" element={<Page><SignIn /></Page>} />
          <Route path="/account" element={<Page><Account /></Page>} />
          <Route path="/privacy" element={<Page><PrivacyPolicy /></Page>} />
          <Route path="/terms" element={<Page><TermsOfStay /></Page>} />
          <Route path="/cancellation-policy" element={<Page><CancellationPolicy /></Page>} />
          <Route path="*" element={<Page><NotFound /></Page>} />
        </Routes>
      </AnimatePresence>
      {!bare && <Footer />}
      {!bare && <FloatingContact />}
      <Toaster position="top-center" toastOptions={{ style: { borderRadius: 0, fontFamily: 'Manrope, sans-serif' } }} />
    </>
  );
}
