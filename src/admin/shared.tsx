import type { ReactNode } from 'react';
import type { BookingSource, BookingStatus, PaymentMethod, PaymentStatus } from '@/lib/db';

export const STATUS_LABEL: Record<BookingStatus, string> = {
  enquiry: 'Request',
  awaiting_payment: 'Held · awaiting payment',
  confirmed: 'Confirmed',
  checked_in: 'Checked in',
  completed: 'Checked out',
  cancelled: 'Cancelled',
  no_show: 'No-show',
};

export const STATUS_STYLE: Record<BookingStatus, string> = {
  enquiry: 'bg-gold-pale text-ink',
  awaiting_payment: 'bg-amber-100 text-amber-900',
  confirmed: 'bg-emerald-100 text-emerald-900',
  checked_in: 'bg-sky-100 text-sky-900',
  completed: 'bg-ink/10 text-ink/70',
  cancelled: 'bg-red-50 text-red-700',
  no_show: 'bg-red-50 text-red-700',
};

export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  unpaid: 'Unpaid',
  partially_paid: 'Part paid',
  paid: 'Paid',
  refunded: 'Refunded',
};

export const SOURCE_LABEL: Record<BookingSource, string> = {
  website: 'Website',
  whatsapp: 'WhatsApp',
  phone: 'Phone',
  walk_in: 'Walk-in',
  ota: 'OTA',
  other: 'Other',
};

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: 'Cash',
  upi: 'UPI',
  card: 'Card',
  bank_transfer: 'Bank transfer',
  ota: 'Paid via OTA',
  other: 'Other',
};

export const PageTitle = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) => (
  <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 className="text-4xl sm:text-5xl">{title}</h1>
      {subtitle && <p className="mt-2 text-sm text-ink/50">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const inputCls =
  'w-full border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-gold focus:ring-2 focus:ring-gold/20';
export const labelCls = 'mb-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/45';

/** wa.me link for a guest's number (adds +91 to bare 10-digit Indian numbers). */
export const guestWhatsapp = (phone: string | null | undefined, text = '') => {
  let digits = (phone ?? '').replace(/\D/g, '');
  if (digits.length === 10) digits = `91${digits}`;
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
};
