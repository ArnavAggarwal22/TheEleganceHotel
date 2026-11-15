-- Database tests: room inventory, prices with GST, booking requests, contact form and access rules.
-- Run with: npm run test:db   (or npx supabase test db against a local Supabase stack)
begin;

create extension if not exists pgtap with schema extensions;

select plan(36);

-- ---------------------------------------------------------------------------
-- Fixtures (inserted as the database owner)
-- ---------------------------------------------------------------------------

insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'admin@elegance.test', 'authenticated', 'authenticated', '{}'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'guest@elegance.test', 'authenticated', 'authenticated',
   '{"full_name": "Meera Guest", "phone": "098765 11111", "role": "admin"}');
update public.profiles set role = 'admin' where id = 'aaaaaaaa-0000-0000-0000-000000000001';

-- A small test room type: 2 rooms, Rs 8,000 a night (above the 5% GST limit)
insert into public.room_types (id, name, price_per_night_paise, max_guests, total_rooms, sort_order)
values ('test-room', 'Test Room', 800000, 2, 2, 9),
       ('closed-type', 'Hidden Room', 100000, 2, 1, 10);
update public.room_types set is_active = false where id = 'closed-type';

-- ---------------------------------------------------------------------------
-- Structure and sign-up
-- ---------------------------------------------------------------------------

select is(
  (select count(*)::int from pg_tables where schemaname = 'public' and not rowsecurity),
  0,
  'Row level security is on for every table'
);
select results_eq(
  $$ select id, total_rooms from public.room_types where id in ('deluxe', 'super-deluxe') order by sort_order $$,
  $$ values ('deluxe', 13), ('super-deluxe', 3) $$,
  'The seed adds 13 Deluxe and 3 Super Deluxe rooms'
);
select results_eq(
  $$ select full_name, phone, role from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000002' $$,
  $$ values ('Meera Guest', '+919876511111', 'guest') $$,
  'Sign-up keeps name and a tidied phone, and the role is always guest'
);

-- ---------------------------------------------------------------------------
-- Prices and GST
-- ---------------------------------------------------------------------------

select is(
  (public.quote_stay('deluxe', current_date + 10, current_date + 12, 1, 2, 0) ->> 'total_paise')::bigint,
  629790::bigint,
  'Deluxe: Rs 2,999 x 2 nights + 5% GST = Rs 6,297.90'
);
select is(
  (public.quote_stay('test-room', current_date + 10, current_date + 11, 1, 2, 0) ->> 'gst_paise')::bigint,
  144000::bigint,
  'Tariffs above Rs 7,500 a night get 18% GST'
);
select ok(
  (public.quote_stay('deluxe', current_date + 10, current_date + 12, 1, 3, 0) ->> 'ok') = 'false',
  'Three guests do not fit in one Deluxe room'
);
select is(
  public.quote_stay('closed-type', current_date + 10, current_date + 12, 1, 1, 0) ->> 'ok',
  'false',
  'Hidden room types cannot be quoted by visitors'
);

-- ---------------------------------------------------------------------------
-- Signed-out visitor
-- ---------------------------------------------------------------------------

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select is((select count(*)::int from public.room_types where id like 'test%' or id like 'closed%'), 1,
  'Visitors see active room types only');
select throws_ok($$ select * from public.bookings $$, '42501', null, 'Visitors cannot read bookings');
select throws_ok($$ select * from public.enquiries $$, '42501', null, 'Visitors cannot read messages');
select throws_ok($$ select * from public.profiles $$, '42501', null, 'Visitors cannot read profiles');
select throws_ok($$ update public.room_types set price_per_night_paise = 100 $$, '42501', null,
  'Visitors cannot change prices');
select throws_ok($$ select * from public.admin_list_customers() $$, '42501', null, 'Visitors cannot list customers');

select matches(
  public.request_booking('test-room', current_date + 20, current_date + 22, 1, 2, 0,
    'Rahul Verma', '98765 43210', 'rahul@example.com', '14:00', 'Late check-in') ->> 'reference',
  '^EL-[0-9]+$',
  'Visitors can request a booking and get an EL- reference'
);
select throws_ok(
  $$ select public.request_booking('test-room', current_date + 20, current_date + 22, 1, 2, 0, 'No Phone', null) $$,
  '22023', null, 'A booking request needs a phone number'
);
select throws_ok(
  $$ select public.request_booking('test-room', current_date + 20, current_date + 22, 1, 2, 0, 'Fake', '12345 67890') $$,
  '22023', null, 'Impossible mobile numbers are refused'
);
select throws_ok(
  $$ select public.request_booking('test-room', current_date + 20, current_date + 22, 1, 5, 0, 'Big Group', '98765 00000') $$,
  '22023', null, 'Too many guests for the rooms requested is refused'
);
select throws_ok(
  $$ select public.request_booking('test-room', current_date - 1, current_date + 1, 1, 2, 0, 'Past', '98765 00001') $$,
  '22023', null, 'Requests for past dates are refused'
);
select lives_ok(
  $$ do $body$ begin
       perform public.request_booking('test-room', current_date + 30, current_date + 31, 1, 1, 0, 'Repeat Guest', '98765 22222')
       from generate_series(1, 5);
     end $body$ $$,
  'The same number can send five requests an hour'
);
select throws_ok(
  $$ select public.request_booking('test-room', current_date + 30, current_date + 31, 1, 1, 0, 'Repeat Guest', '+91 98765 22222') $$,
  'P0001', null, 'A sixth request within the hour is refused'
);
select ok(
  public.submit_enquiry('event', 'Anita Events', '98140 12345', null, 'Birthday dinner for 40 guests') is not null,
  'Visitors can send a contact message'
);

-- ---------------------------------------------------------------------------
-- Admin without two-step verification
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1"}', true);
select is(public.is_admin(), false, 'An admin without two-step verification is not treated as admin');
select is((select count(*)::int from public.bookings), 0, 'and cannot see bookings');

-- ---------------------------------------------------------------------------
-- Verified admin: inventory rules
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated","aal":"aal2"}', true);
select is(public.is_admin(), true, 'A verified admin is treated as admin');
select results_eq(
  $$ select status, guest_phone, total_paise, arrival_time from public.bookings where guest_name = 'Rahul Verma' $$,
  $$ values ('enquiry', '+919876543210', 1888000::bigint, '14:00') $$,
  'A website request is an enquiry, priced on the server (Rs 16,000 + 18% GST), with a tidied phone'
);
select lives_ok(
  $$ insert into public.bookings (room_type_id, rooms_count, guest_name, guest_phone, check_in, check_out, status)
     values ('test-room', 2, 'Group A', '+919800000001', current_date + 40, current_date + 43, 'confirmed') $$,
  'An admin can confirm both test rooms'
);
select throws_ok(
  $$ insert into public.bookings (room_type_id, guest_name, guest_phone, check_in, check_out, status)
     values ('test-room', 'Overbooked', '+919800000002', current_date + 42, current_date + 44, 'confirmed') $$,
  '23P01', null, 'A third room on a full night is refused (no overbooking)'
);
select lives_ok(
  $$ insert into public.bookings (room_type_id, guest_name, guest_phone, check_in, check_out, status)
     values ('test-room', 'Checkout Day', '+919800000003', current_date + 43, current_date + 45, 'confirmed') $$,
  'A room is free again on the previous guest''s check-out day'
);
select lives_ok(
  $$ insert into public.bookings (room_type_id, guest_name, guest_phone, check_in, check_out, status)
     values ('test-room', 'Just Asking', '+919800000004', current_date + 41, current_date + 42, 'enquiry') $$,
  'Enquiries do not hold rooms, so they never block'
);
select is(public.rooms_left('test-room', current_date + 43, current_date + 45), 1,
  'Rooms left counts held bookings night by night');
select throws_ok(
  $$ insert into public.room_closures (room_type_id, starts_on, ends_on, rooms_closed)
     values ('test-room', current_date + 41, current_date + 42, 1) $$,
  '23P01', null, 'Rooms that guests hold cannot be closed'
);
select lives_ok(
  $$ insert into public.room_closures (room_type_id, starts_on, ends_on, rooms_closed)
     values ('test-room', current_date + 50, current_date + 52, 2) $$,
  'An admin can close rooms on free nights'
);
select is(
  (select rooms_left from public.room_availability(current_date + 50, current_date + 51) where room_type_id = 'test-room'),
  0, 'Closed rooms show as unavailable on the booking page'
);
select throws_ok(
  $$ update public.room_types set total_rooms = 1 where id = 'test-room' $$,
  '23P01', null, 'The room count cannot drop below rooms already booked'
);

-- ---------------------------------------------------------------------------
-- Signed-in guest
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-0000-0000-000000000002","role":"authenticated","aal":"aal1","email":"guest@elegance.test"}', true);
select matches(
  public.request_booking('deluxe', current_date + 60, current_date + 61, 1, 2, 0, 'Meera Guest', '98765 11111') ->> 'reference',
  '^EL-[0-9]+$', 'A signed-in guest can request a booking'
);
select results_eq(
  $$ select room_name, status from public.my_bookings() $$,
  $$ values ('Deluxe Room', 'enquiry') $$,
  'The request appears in the guest''s bookings, and only theirs'
);

select * from finish();
rollback;
