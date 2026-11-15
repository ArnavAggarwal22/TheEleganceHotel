import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PlainHero from '@/components/PlainHero';
import { HOTEL } from '@/data/hotel';

export const POLICIES_UPDATED = '15 November 2026';

const PAGES = [
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms of Stay' },
  { to: '/cancellation-policy', label: 'Cancellation & Refunds' },
];

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="space-y-3">
    <h2 className="text-3xl">{title}</h2>
    <div className="space-y-3 [&_li]:pl-1 [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">{children}</div>
  </section>
);

const Layout = ({ title, intro, children }: { title: string; intro: ReactNode; children: ReactNode }) => {
  const { pathname } = useLocation();
  return (
    <>
      <PlainHero eyebrow={`Last updated ${POLICIES_UPDATED}`} title={title} />
      <section className="py-16 md:py-20">
        <div className="container max-w-3xl">
          <nav className="mb-10 flex flex-wrap gap-2" aria-label="Policies">
            {PAGES.map((p) => (
              <Link
                key={p.to}
                to={p.to}
                className={`border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                  pathname === p.to ? 'border-ink bg-ink text-ivory' : 'border-ink/15 text-ink/60 hover:border-ink hover:text-ink'
                }`}
              >
                {p.label}
              </Link>
            ))}
          </nav>
          <div className="text-[15.5px] leading-relaxed text-ink/70">{intro}</div>
          <div className="mt-10 space-y-10 text-[15.5px] leading-relaxed text-ink/70">{children}</div>
          <div className="mt-14 bg-ivory-200 p-7 text-sm text-ink/70">
            <p className="font-semibold text-ink">{HOTEL.fullName}</p>
            <p className="mt-1">{HOTEL.addressOneLine}</p>
            <p className="mt-1">
              <a href={`tel:${HOTEL.phoneTel}`} className="link-underline">{HOTEL.phoneDisplay}</a> ·{' '}
              <a href={`mailto:${HOTEL.email}`} className="link-underline">{HOTEL.email}</a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

export const PrivacyPolicy = () => (
  <Layout
    title="Privacy Policy"
    intro={
      <p>
        This policy explains what personal data {HOTEL.fullName} collects through this website and at the hotel, why we
        collect it, who we share it with and your rights under India's Digital Personal Data Protection Act, 2023. By
        sending a booking request, creating an account or staying with us, you agree to the use of your data as set
        out here.
      </p>
    }
  >
    <Section title="1. What we collect">
      <ul>
        <li><strong>Booking details:</strong> your name, phone number, email (optional), dates, room type, number of guests, arrival time and special requests.</li>
        <li><strong>Account details:</strong> if you create an account, your name, phone, email and password (stored only in scrambled form). With "Continue with Google", Google shares your name, email and profile picture.</li>
        <li><strong>At check-in:</strong> government photo ID for every adult guest, as Indian law requires hotels to register guests (passport and visa details for foreign nationals).</li>
        <li><strong>Messages</strong> you send us by WhatsApp, phone, email or the contact form.</li>
        <li><strong>Technical data:</strong> basic request information (such as IP address and browser) recorded by our hosting providers to keep the site secure. We do not use advertising or tracking cookies, and we never take card details on this website.</li>
      </ul>
    </Section>
    <Section title="2. Why we use it">
      <ul>
        <li>To check availability, confirm and manage your reservation, and prepare for your arrival.</li>
        <li>To contact you about your booking by phone, WhatsApp or email.</li>
        <li>To meet legal duties: guest registration, tax (GST) invoices and accounting.</li>
        <li>To keep the website and our guests secure.</li>
      </ul>
      <p>We only send offers or newsletters if you separately agree to them, and you can stop them at any time.</p>
    </Section>
    <Section title="3. Who we share it with">
      <ul>
        <li><strong>Service providers</strong> who run this website for us: Supabase (database and sign-in, data stored in Mumbai, India), our website host, Google (email delivery and Google sign-in) and WhatsApp (when you message us). They may only use your data to provide their service to us.</li>
        <li><strong>Our group, The Ambience Hotels</strong>, only where needed to look after your stay (for example if we move your booking to a sister property with your agreement).</li>
        <li><strong>Authorities</strong>, where the law requires it, such as guest registration with local police for foreign nationals.</li>
      </ul>
      <p>We never sell your personal data.</p>
    </Section>
    <Section title="4. How long we keep it">
      <p>
        Booking and invoice records are kept for as long as Indian tax and accounting law requires (generally up to 8
        years). Guest registration records are kept for the period required by local regulations. Requests that never
        became a stay are deleted or anonymised within 2 years. Account details are kept while your account is open.
      </p>
    </Section>
    <Section title="5. Your rights">
      <p>You can ask us to show you the data we hold about you, correct it, delete it (except records we must keep by law), withdraw consent, or nominate someone to act for you. Email {HOTEL.email}; we reply within 30 days. If you are not satisfied, you can complain to the Data Protection Board of India.</p>
    </Section>
    <Section title="6. Security">
      <p>The website uses encrypted connections, access to guest data is limited to our reservations team, and team accounts are protected with two-step verification. If a breach ever affects your data, we will tell you and the authorities as the law requires.</p>
    </Section>
    <Section title="7. Grievance contact">
      <p>For any privacy question or complaint, contact our grievance officer at {HOTEL.email} or {HOTEL.phoneDisplay}.</p>
    </Section>
  </Layout>
);

export const TermsOfStay = () => (
  <Layout
    title="Terms of Stay"
    intro={
      <p>
        These terms apply to bookings made through this website, by phone or WhatsApp, and to your stay at{' '}
        {HOTEL.fullName}. Please read them with our{' '}
        <Link to="/cancellation-policy" className="underline">Cancellation &amp; Refund Policy</Link> and{' '}
        <Link to="/privacy" className="underline">Privacy Policy</Link>.
      </p>
    }
  >
    <Section title="1. Booking requests and confirmation">
      <ul>
        <li>A request sent through the website does not reserve a room. Our reservations team checks availability and contacts you by phone, WhatsApp or email.</li>
        <li>Your booking is confirmed only when we confirm it to you in writing and any advance payment we ask for has been received.</li>
        <li>Prices on the website are per room per night in Indian rupees. The total shown is an estimate; the final amount, including GST, is confirmed before you pay.</li>
        <li>GST on room tariff is charged as the law requires: currently 5% for tariffs up to ₹7,500 per room per night and 18% above that.</li>
      </ul>
    </Section>
    <Section title="2. Check-in and check-out">
      <ul>
        <li>Check-in from {HOTEL.checkIn}; check-out by {HOTEL.checkOut}. Early check-in and late check-out depend on availability and may be charged.</li>
        <li>Every adult guest must show valid government photo ID at check-in. Foreign nationals must show their passport and valid visa. We may refuse check-in without valid ID.</li>
        <li>The guest who made the booking should be one of the guests staying.</li>
      </ul>
    </Section>
    <Section title="3. During your stay">
      <ul>
        <li>The number of guests per room may not exceed the limit for that room type. Extra beds, where available, are charged.</li>
        <li>Visitors are welcome in public areas; please check with the front desk before inviting visitors to your room.</li>
        <li>You are responsible for damage to hotel property caused by you or your guests, beyond normal wear and tear.</li>
        <li>The hotel may end a stay without refund for illegal activity, behaviour that endangers or seriously disturbs other guests or staff, or serious breaches of these terms.</li>
        <li>Please use the in-room safe for valuables. The hotel's liability for lost items is limited as permitted by law.</li>
      </ul>
    </Section>
    <Section title="4. Our responsibility">
      <p>
        We take great care to provide the room and services you booked. If a confirmed room becomes unavailable, we will
        offer a comparable room, a stay at a sister Ambience property, or a full refund. To the extent the law allows, we
        are not liable for indirect losses or events beyond our reasonable control. Nothing in these terms limits your
        rights under the Consumer Protection Act, 2019.
      </p>
    </Section>
    <Section title="5. Website use">
      <p>Please don't misuse the website: no false bookings, no attempts to access other people's data or our systems, and no copying of our content or photos for commercial use without permission.</p>
    </Section>
    <Section title="6. Law">
      <p>These terms are governed by the laws of India. We may update them; the date above shows the latest version, and confirmed bookings keep the terms that applied when they were made.</p>
    </Section>
  </Layout>
);

export const CancellationPolicy = () => (
  <Layout
    title="Cancellation & Refunds"
    intro={<p>We know plans change. Here is how cancellations, changes and refunds work for rooms at {HOTEL.fullName}.</p>}
  >
    <Section title="1. Standard bookings">
      <ul>
        <li><strong>Cancel at least 24 hours before check-in</strong> ({HOTEL.checkIn} on your arrival date): full refund of any advance paid.</li>
        <li><strong>Cancel less than 24 hours before check-in:</strong> one night's room charge per room (with GST) is kept; the rest is refunded.</li>
        <li><strong>No-show:</strong> one night's room charge per room is kept, and the rest of the booking is released.</li>
        <li><strong>Leaving early:</strong> nights after the day you check out early may be charged at the front desk's discretion; please tell us as soon as you can.</li>
      </ul>
    </Section>
    <Section title="2. Requests not yet confirmed">
      <p>A booking request costs nothing and can be withdrawn at any time before we confirm it and you pay. Just tell us.</p>
    </Section>
    <Section title="3. Groups, events and peak dates">
      <p>
        Bookings of 5 or more rooms, event packages, and peak dates such as New Year's Eve and long weekends may have
        different deposit and cancellation terms. We always tell you these in writing before you pay.
      </p>
    </Section>
    <Section title="4. How to cancel or change">
      <p>
        Call or WhatsApp {HOTEL.phoneDisplay}, or email {HOTEL.email}, with your booking reference (for example EL-1001).
        The time we receive your message is the time of cancellation, and we confirm every cancellation in writing.
        Date changes depend on availability; if the new dates cost more, the difference is payable.
      </p>
    </Section>
    <Section title="5. Refunds">
      <ul>
        <li>We start refunds within 5 working days of confirming the cancellation, to the account or method you paid with.</li>
        <li>Your bank may take a further 5–7 working days to show the refund.</li>
        <li>If the hotel cancels a confirmed booking, you get a full refund or, if you prefer, a comparable room at a sister Ambience property.</li>
      </ul>
    </Section>
  </Layout>
);
