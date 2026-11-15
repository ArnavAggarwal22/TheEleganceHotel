// Every database call the website makes. Money comes back from the database in paise and is
// converted to rupees here.
import { supabase } from './supabase';

const db = () => {
  if (!supabase) throw new Error('The booking system is not connected yet.');
  return supabase;
};

export const toRupees = (paise: number | null | undefined) => Math.round(Number(paise ?? 0)) / 100;
export const toPaise = (rupees: number) => Math.round(rupees * 100);

/** Turns database errors into sentences a guest or the team can act on. */
export function describeError(error: unknown): string {
  const e = error as { code?: string; message?: string } | null;
  const message = e?.message ?? String(error);
  switch (e?.code) {
    case '23P01':
      return message.includes('Booked guests') || message.includes('more rooms booked')
        ? message
        : 'Not enough rooms of that type are free on those dates.';
    case '23503':
      return 'This item is still used by bookings, so it cannot be removed.';
    case '42501':
      return 'You do not have permission to do that. Sign in again as an admin.';
    case '23514':
      return 'Some details are not valid. Please check them and try again.';
    default:
      if (/failed to fetch|network/i.test(message)) return "Can't reach the booking system. Check your internet connection.";
      return message;
  }
}

export function friendlyError(error: unknown): Error & { code?: string } {
  return Object.assign(new Error(describeError(error)), { code: (error as { code?: string } | null)?.code });
}

// ---------------------------------------------------------------------------
// Rooms, prices and availability
// ---------------------------------------------------------------------------

export interface RoomTypeRow {
  id: string;
  name: string;
  price: number;
  max_guests: number;
  total_rooms: number;
  is_active: boolean;
  sort_order: number;
}

const toRoomType = (r: Record<string, unknown>): RoomTypeRow => ({
  id: String(r.id),
  name: String(r.name),
  price: toRupees(r.price_per_night_paise as number),
  max_guests: Number(r.max_guests),
  total_rooms: Number(r.total_rooms),
  is_active: Boolean(r.is_active),
  sort_order: Number(r.sort_order),
});

/** Live prices and room counts (admins also see hidden room types). */
export async function fetchRoomTypes(): Promise<RoomTypeRow[]> {
  const { data, error } = await db().from('room_types').select('*').order('sort_order');
  if (error) throw error;
  return (data ?? []).map(toRoomType);
}

export interface Availability {
  room_type_id: string;
  rooms_left: number;
  price: number;
}

export async function fetchAvailability(checkIn: string, checkOut: string): Promise<Availability[]> {
  const { data, error } = await db().rpc('room_availability', { p_check_in: checkIn, p_check_out: checkOut });
  if (error) throw error;
  return (data ?? []).map((r: Record<string, unknown>) => ({
    room_type_id: String(r.room_type_id),
    rooms_left: Number(r.rooms_left),
    price: toRupees(r.price_per_night_paise as number),
  }));
}

export interface Quote {
  ok: boolean;
  problems: string[];
  nights: number;
  rooms: number;
  rooms_left: number;
  room_total: number;
  gst_rate: number;
  gst: number;
  total: number;
}

const toQuote = (q: Record<string, unknown>): Quote => ({
  ok: q.ok === true,
  problems: Array.isArray(q.problems) ? (q.problems as string[]) : [],
  nights: Number(q.nights ?? 0),
  rooms: Number(q.rooms ?? 1),
  rooms_left: Number(q.rooms_left ?? 0),
  room_total: toRupees(q.room_total_paise as number),
  gst_rate: Number(q.gst_rate ?? 0.05),
  gst: toRupees(q.gst_paise as number),
  total: toRupees(q.total_paise as number),
});

export async function quoteStay(args: {
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  adults: number;
  children: number;
}): Promise<Quote> {
  const { data, error } = await db().rpc('quote_stay', {
    p_room_type_id: args.roomTypeId,
    p_check_in: args.checkIn,
    p_check_out: args.checkOut,
    p_rooms: args.rooms,
    p_adults: args.adults,
    p_children: args.children,
  });
  if (error) throw error;
  return toQuote((data ?? {}) as Record<string, unknown>);
}

// ---------------------------------------------------------------------------
// Website booking requests and contact messages
// ---------------------------------------------------------------------------

/** Asks the notify Edge Function to send the emails. Never throws: the request is already saved. */
function notify(body: Record<string, string>) {
  void db()
    .functions.invoke('notify', { body })
    .then(({ error }) => error && console.warn('Alert email was not sent:', error.message))
    .catch((e: unknown) => console.warn('Alert email was not sent:', e));
}

export interface BookingRequest {
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  adults: number;
  children: number;
  name: string;
  phone: string;
  email?: string;
  arrival?: string;
  requests?: string;
}

export async function requestBooking(r: BookingRequest): Promise<{ reference: string; quote: Quote }> {
  const { data, error } = await db().rpc('request_booking', {
    p_room_type_id: r.roomTypeId,
    p_check_in: r.checkIn,
    p_check_out: r.checkOut,
    p_rooms: r.rooms,
    p_adults: r.adults,
    p_children: r.children,
    p_guest_name: r.name,
    p_guest_phone: r.phone,
    p_guest_email: r.email || null,
    p_arrival_time: r.arrival || null,
    p_special_requests: r.requests || null,
  });
  if (error) throw friendlyError(error);
  const result = (data ?? {}) as { reference?: string; quote?: Record<string, unknown> };
  if (result.reference) notify({ reference: result.reference });
  return { reference: result.reference ?? '', quote: toQuote(result.quote ?? {}) };
}

export type EnquiryKind = 'contact' | 'event' | 'corporate';

export async function submitEnquiry(input: { kind: EnquiryKind; name: string; phone: string; email?: string; message?: string }) {
  const { data, error } = await db().rpc('submit_enquiry', {
    p_kind: input.kind,
    p_name: input.name,
    p_phone: input.phone,
    p_email: input.email || null,
    p_message: input.message || null,
  });
  if (error) throw friendlyError(error);
  if (data) notify({ enquiry_id: String(data) });
}

// ---------------------------------------------------------------------------
// Guests
// ---------------------------------------------------------------------------

export interface MyBooking {
  reference: string;
  room_type_id: string;
  room_name: string;
  rooms_count: number;
  check_in: string;
  check_out: string;
  nights: number;
  adults: number;
  children: number;
  total: number;
  status: string;
  created_at: string;
}

export async function fetchMyBookings(): Promise<MyBooking[]> {
  const { data, error } = await db().rpc('my_bookings');
  if (error) throw error;
  return (data ?? []).map((r: Record<string, unknown>) => ({ ...(r as unknown as MyBooking), total: toRupees(r.total_paise as number) }));
}

// ---------------------------------------------------------------------------
// Admin: bookings ledger
// ---------------------------------------------------------------------------

export const BOOKING_STATUSES = ['enquiry', 'awaiting_payment', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show'] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export const PAYMENT_STATUSES = ['unpaid', 'partially_paid', 'paid', 'refunded'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export const SOURCES = ['website', 'whatsapp', 'phone', 'walk_in', 'ota', 'other'] as const;
export type BookingSource = (typeof SOURCES)[number];
export const PAYMENT_METHODS = ['cash', 'upi', 'card', 'bank_transfer', 'ota', 'other'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface Booking {
  id: string;
  reference: string;
  room_type_id: string;
  rooms_count: number;
  guest_name: string;
  guest_phone: string | null;
  guest_email: string | null;
  check_in: string;
  check_out: string;
  nights: number;
  adults: number;
  children: number;
  arrival_time: string | null;
  special_requests: string | null;
  room_total: number;
  gst: number;
  total: number;
  status: BookingStatus;
  source: BookingSource;
  amount_paid: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  admin_notes: string | null;
  created_at: string;
}

const toBooking = (r: Record<string, unknown>): Booking => ({
  ...(r as unknown as Booking),
  room_total: toRupees(r.room_total_paise as number),
  gst: toRupees(r.gst_paise as number),
  total: toRupees(r.total_paise as number),
  amount_paid: toRupees(r.amount_paid_paise as number),
});

export async function fetchBookings(): Promise<Booking[]> {
  const { data, error } = await db().from('bookings').select('*').order('check_in', { ascending: false }).limit(1000);
  if (error) throw error;
  return (data ?? []).map(toBooking);
}

export interface BookingInput {
  room_type_id: string;
  rooms_count: number;
  guest_name: string;
  guest_phone: string | null;
  guest_email: string | null;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  arrival_time: string | null;
  special_requests: string | null;
  total: number;
  status: BookingStatus;
  source: BookingSource;
  amount_paid: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  admin_notes: string | null;
}

/** Ledger entries: the total is what the guest pays (inclusive of GST), as agreed with them. */
const toRow = (b: Partial<BookingInput>) => {
  const { total, amount_paid, ...rest } = b;
  const row: Record<string, unknown> = { ...rest };
  if (total !== undefined) row.total_paise = toPaise(total);
  if (amount_paid !== undefined) row.amount_paid_paise = toPaise(amount_paid);
  return row;
};

export async function createBooking(input: BookingInput): Promise<Booking> {
  const { data, error } = await db().from('bookings').insert(toRow(input)).select('*').single();
  if (error) throw friendlyError(error);
  return toBooking(data);
}

export async function updateBooking(id: string, patch: Partial<BookingInput>): Promise<Booking> {
  const { data, error } = await db().from('bookings').update(toRow(patch)).eq('id', id).select('*').single();
  if (error) throw friendlyError(error);
  return toBooking(data);
}

export async function deleteBooking(id: string) {
  const { error } = await db().from('bookings').delete().eq('id', id);
  if (error) throw friendlyError(error);
}

// ---------------------------------------------------------------------------
// Admin: rooms, closures and occupancy
// ---------------------------------------------------------------------------

export async function updateRoomType(id: string, patch: { price?: number; total_rooms?: number; max_guests?: number; is_active?: boolean }) {
  const row: Record<string, unknown> = {};
  if (patch.price !== undefined) row.price_per_night_paise = toPaise(patch.price);
  if (patch.total_rooms !== undefined) row.total_rooms = patch.total_rooms;
  if (patch.max_guests !== undefined) row.max_guests = patch.max_guests;
  if (patch.is_active !== undefined) row.is_active = patch.is_active;
  const { error } = await db().from('room_types').update(row).eq('id', id);
  if (error) throw friendlyError(error);
}

export interface Closure {
  id: string;
  room_type_id: string;
  starts_on: string;
  ends_on: string;
  rooms_closed: number;
  reason: 'maintenance' | 'owner_use' | 'other';
  note: string | null;
}

export async function fetchClosures(): Promise<Closure[]> {
  const { data, error } = await db().from('room_closures').select('*').order('starts_on');
  if (error) throw error;
  return (data ?? []) as Closure[];
}

export async function addClosure(c: Omit<Closure, 'id'>) {
  const { error } = await db().from('room_closures').insert(c);
  if (error) throw friendlyError(error);
}

export async function removeClosure(id: string) {
  const { error } = await db().from('room_closures').delete().eq('id', id);
  if (error) throw friendlyError(error);
}

export interface OccupancyCell {
  room_type_id: string;
  night: string;
  booked: number;
  closed: number;
  total_rooms: number;
}

export async function fetchOccupancy(from: string, to: string): Promise<OccupancyCell[]> {
  const { data, error } = await db().rpc('admin_occupancy', { p_from: from, p_to: to });
  if (error) throw friendlyError(error);
  return (data ?? []) as OccupancyCell[];
}

// ---------------------------------------------------------------------------
// Admin: guests and messages
// ---------------------------------------------------------------------------

export interface Customer {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  provider: string;
  created_at: string;
  last_sign_in_at: string | null;
  booking_count: number;
  last_request_at: string | null;
}

export async function fetchCustomers(): Promise<Customer[]> {
  const { data, error } = await db().rpc('admin_list_customers');
  if (error) throw friendlyError(error);
  return (data ?? []).map((r: Record<string, unknown>) => ({ ...(r as unknown as Customer), booking_count: Number(r.booking_count) }));
}

export type EnquiryStatus = 'new' | 'in_progress' | 'closed';

export interface Enquiry {
  id: string;
  kind: EnquiryKind;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  status: EnquiryStatus;
  admin_notes: string | null;
  created_at: string;
}

export async function fetchEnquiries(): Promise<Enquiry[]> {
  const { data, error } = await db()
    .from('enquiries')
    .select('id, kind, name, phone, email, message, status, admin_notes, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Enquiry[];
}

export async function updateEnquiry(id: string, patch: { status?: EnquiryStatus; admin_notes?: string | null }) {
  const { error } = await db().from('enquiries').update(patch).eq('id', id);
  if (error) throw friendlyError(error);
}
