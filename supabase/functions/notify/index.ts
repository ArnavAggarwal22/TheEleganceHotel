// Email alerts for The Elegance Hotel website.
//
//  * Booking request ({ reference }): email to the reservations team with one-tap WhatsApp / call /
//    email buttons, and a "we've received your request" email to the guest when they gave an email.
//  * Contact message ({ enquiry_id }): email to the team.
//
// The website calls this right after saving the request. Each one is sent once: the function claims
// it by setting notified_at, and only items from the last hour can be claimed, so repeated calls or
// guessed references do nothing.
//
// Secrets (set with scripts/setup-hotel.ps1): GMAIL_USER, GMAIL_APP_PASSWORD, TEAM_EMAIL, SITE_URL.
// Supabase provides SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from 'npm:@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer@6.9.16';

const HOTEL = 'The Elegance Hotel by Ambience';
const HOTEL_PHONE = '+91 81468 30484';
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://www.theelegancehotel.com';
const GMAIL_USER = Deno.env.get('GMAIL_USER') ?? '';
const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD') ?? '';
const TEAM_EMAIL = Deno.env.get('TEAM_EMAIL') || GMAIL_USER;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const esc = (value: unknown) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const inr = (paise: number) => '₹' + Math.round(paise / 100).toLocaleString('en-IN');
const day = (iso: string) =>
  new Date(iso + 'T00:00:00Z').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

const button = (href: string, label: string, color: string) =>
  `<a href="${esc(href)}" style="display:inline-block;margin:4px 6px 4px 0;padding:11px 18px;background:${color};color:#fff;text-decoration:none;font-weight:600;font-size:13px;letter-spacing:.06em;text-transform:uppercase">${esc(label)}</a>`;

const layout = (title: string, body: string) => `<!doctype html><html><body style="margin:0;background:#F3EDE1;font-family:Arial,Helvetica,sans-serif;color:#0F0E0C">
<div style="max-width:580px;margin:0 auto;padding:28px 20px">
<div style="text-align:center;margin-bottom:18px">
  <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;color:#0F0E0C">The Elegance Hotel</div>
  <div style="font-size:10px;letter-spacing:.32em;text-transform:uppercase;color:#8C6D3B;margin-top:4px">by Ambience</div>
</div>
<div style="background:#FBF9F4;border:1px solid #E9E0CE;padding:28px">
<h1 style="font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:24px;margin:0 0 18px">${esc(title)}</h1>${body}</div>
<p style="font-size:12px;color:#8A8273;margin-top:16px;text-align:center">${HOTEL} · Patiala Chowk, Zirakpur · ${HOTEL_PHONE}</p>
</div></body></html>`;

const row = (label: string, value: string) =>
  `<tr><td style="padding:7px 14px 7px 0;color:#8A8273;font-size:12px;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;vertical-align:top">${esc(label)}</td><td style="padding:7px 0;font-size:15px">${value}</td></tr>`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Use POST' }, 405);

  let body: { reference?: unknown; enquiry_id?: unknown } = {};
  try {
    body = (await req.json()) ?? {};
  } catch {
    /* handled below */
  }
  const reference = String(body.reference ?? '').trim();
  const enquiryId = String(body.enquiry_id ?? '').trim();
  const isEnquiry = /^[0-9a-f-]{36}$/i.test(enquiryId);
  if (!isEnquiry && !/^EL-\d{1,9}$/.test(reference)) return json({ error: 'A booking reference or message id is required' }, 400);
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) return json({ error: 'Email sending is not set up yet' }, 503);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });
  const mailer = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465, // Edge Functions can't use port 587; Gmail's SSL port works
    secure: true,
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  // ---- Contact form messages -------------------------------------------------
  if (isEnquiry) {
    const { data: e, error } = await admin
      .from('enquiries')
      .update({ notified_at: new Date().toISOString() })
      .eq('id', enquiryId)
      .is('notified_at', null)
      .gt('created_at', oneHourAgo)
      .select('id, kind, name, phone, email, message')
      .maybeSingle();
    if (error) return json({ error: error.message }, 500);
    if (!e) return json({ sent: false, reason: 'Already alerted, too old or not found' });

    const kind = e.kind === 'event' ? 'Event / banquet enquiry' : e.kind === 'corporate' ? 'Corporate enquiry' : 'Website message';
    const digits = (e.phone ?? '').replace(/\D/g, '');
    const reply = encodeURIComponent(`Hello ${e.name.split(/\s+/)[0]}, this is ${HOTEL} replying to your message. `);
    try {
      await mailer.sendMail({
        from: `"${HOTEL} website" <${GMAIL_USER}>`,
        to: TEAM_EMAIL,
        replyTo: e.email || undefined,
        subject: `${kind}: ${e.name} (${e.phone})`,
        html: layout(
          kind,
          `<table style="border-collapse:collapse;margin-bottom:18px">` +
            row('Name', esc(e.name)) +
            row('Phone', esc(e.phone)) +
            row('Email', e.email ? esc(e.email) : '—') +
            row('Message', e.message ? esc(e.message).replace(/\n/g, '<br>') : '—') +
            `</table>` +
            (digits ? button(`https://wa.me/${digits}?text=${reply}`, 'WhatsApp', '#1f7a4d') : '') +
            button(`tel:${e.phone}`, 'Call', '#0F0E0C') +
            (e.email ? button(`mailto:${e.email}`, 'Email', '#8C6D3B') : '') +
            `<p style="font-size:13px;margin-top:18px"><a href="${esc(SITE_URL)}/admin/messages" style="color:#8C6D3B">Open messages in the dashboard</a></p>`
        ),
      });
    } catch (sendError) {
      await admin.from('enquiries').update({ notified_at: null }).eq('id', e.id);
      return json({ error: `Email failed: ${(sendError as Error).message}` }, 502);
    }
    return json({ sent: true });
  }

  // ---- Booking requests -------------------------------------------------------
  const { data: b, error } = await admin
    .from('bookings')
    .update({ notified_at: new Date().toISOString() })
    .eq('reference', reference)
    .eq('source', 'website')
    .is('notified_at', null)
    .gt('created_at', oneHourAgo)
    .select(
      'id, reference, guest_name, guest_phone, guest_email, guest_id, check_in, check_out, nights, adults, children, rooms_count, arrival_time, special_requests, room_total_paise, gst_paise, total_paise, room_types(name)'
    )
    .maybeSingle();
  if (error) return json({ error: error.message }, 500);
  if (!b) return json({ sent: false, reason: 'Already alerted, too old or not found' });

  const booking = b as typeof b & { room_types: { name: string } | null };
  const roomName = booking.room_types?.name ?? 'Room';
  const firstName = booking.guest_name.split(/\s+/)[0];
  const guests = `${booking.adults} adult${booking.adults === 1 ? '' : 's'}${booking.children ? `, ${booking.children} child${booking.children === 1 ? '' : 'ren'}` : ''}`;
  const digits = (booking.guest_phone ?? '').replace(/\D/g, '');
  const followUp = encodeURIComponent(
    `Hello ${firstName}, this is ${HOTEL} about your booking request ${booking.reference} ` +
      `(${roomName}, ${day(booking.check_in)} to ${day(booking.check_out)}). `
  );

  const stay =
    `<table style="border-collapse:collapse;margin-bottom:18px">` +
    row('Reference', `<b>${esc(booking.reference)}</b>`) +
    row('Room', `${esc(roomName)} × ${booking.rooms_count}`) +
    row('Dates', `${esc(day(booking.check_in))} → ${esc(day(booking.check_out))} (${booking.nights} night${booking.nights === 1 ? '' : 's'})`) +
    row('Guests', esc(guests)) +
    row('Room charges', esc(inr(booking.room_total_paise))) +
    row('GST', esc(inr(booking.gst_paise))) +
    row('Estimated total', `<b>${esc(inr(booking.total_paise))}</b>`) +
    `</table>`;

  const teamHtml = layout(
    'New booking request',
    stay +
      `<table style="border-collapse:collapse;margin-bottom:18px">` +
      row('Name', esc(booking.guest_name)) +
      row('Phone', booking.guest_phone ? esc(booking.guest_phone) : '—') +
      row('Email', booking.guest_email ? esc(booking.guest_email) : '—') +
      row('Arrival', booking.arrival_time ? esc(booking.arrival_time) : '—') +
      row('Account', booking.guest_id ? 'Signed-in guest' : 'Not signed in') +
      (booking.special_requests ? row('Requests', esc(booking.special_requests).replace(/\n/g, '<br>')) : '') +
      `</table>` +
      (digits ? button(`https://wa.me/${digits}?text=${followUp}`, 'WhatsApp guest', '#1f7a4d') : '') +
      (booking.guest_phone ? button(`tel:${booking.guest_phone}`, 'Call guest', '#0F0E0C') : '') +
      (booking.guest_email ? button(`mailto:${booking.guest_email}?subject=${encodeURIComponent(`Your booking request ${booking.reference}`)}`, 'Email guest', '#8C6D3B') : '') +
      `<p style="font-size:13px;margin-top:18px"><a href="${esc(SITE_URL)}/admin" style="color:#8C6D3B">Open the bookings dashboard</a></p>`
  );

  const guestHtml = layout(
    `Thank you, ${firstName}`,
    `<p style="font-size:15px;line-height:1.7;margin:0 0 18px">We've received your booking request. Our reservations team will confirm availability and your final rate shortly by phone or WhatsApp${booking.guest_phone ? ` (${esc(booking.guest_phone)})` : ''}. No payment has been taken.</p>` +
      stay +
      `<p style="font-size:14px;line-height:1.7">Check-in from 12:00 PM, check-out by 11:00 AM. Please carry a valid government photo ID for every adult guest.</p>` +
      `<p style="font-size:14px;line-height:1.7">Questions? Reply to this email or call ${HOTEL_PHONE}, quoting <b>${esc(booking.reference)}</b>.</p>`
  );

  try {
    await mailer.sendMail({
      from: `"${HOTEL} reservations" <${GMAIL_USER}>`,
      to: TEAM_EMAIL,
      replyTo: booking.guest_email || undefined,
      subject: `New booking request ${booking.reference}: ${booking.guest_name}, ${roomName}, ${day(booking.check_in)}`,
      html: teamHtml,
    });
    if (booking.guest_email) {
      await mailer.sendMail({
        from: `"${HOTEL}" <${GMAIL_USER}>`,
        to: booking.guest_email,
        replyTo: TEAM_EMAIL,
        subject: `We've received your booking request ${booking.reference}`,
        html: guestHtml,
      });
    }
  } catch (sendError) {
    await admin.from('bookings').update({ notified_at: null }).eq('id', booking.id);
    return json({ error: `Email failed: ${(sendError as Error).message}` }, 502);
  }
  return json({ sent: true, guestEmailed: !!booking.guest_email });
});
