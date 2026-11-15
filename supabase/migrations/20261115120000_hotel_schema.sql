-- The Elegance Hotel by Ambience: database schema
--
-- Conventions (same as IvStay)
--   * Money is stored as whole paise (Rs 1 = 100 paise) in bigint columns ending in _paise.
--   * Every table has row level security. Admin access needs role = 'admin' in public.profiles AND a
--     two-step-verified session (aal2). The browser only ever holds the publishable key.
--   * Rooms are sold by type: each room type has a number of physical rooms (total_rooms). A booking
--     takes rooms_count rooms of one type for a date range. Bookings that hold rooms
--     ('awaiting_payment', 'confirmed') and room closures can never add up to more rooms than exist
--     on any night.

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Indian mobiles: 10 digits starting 6-9 (stored as +91XXXXXXXXXX). Others: + and country code.
create or replace function public.normalize_phone(p_phone text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when d is null then null
    when d ~ '^[6-9][0-9]{9}$' then '+91' || d
    when d ~ '^0[6-9][0-9]{9}$' then '+91' || substr(d, 2)
    when d ~ '^91[6-9][0-9]{9}$' then '+' || d
    else d
  end
  from (select nullif(regexp_replace(trim(coalesce(p_phone, '')), '[\s().-]', '', 'g'), '') as d) x;
$$;

create or replace function public.is_valid_phone(p_phone text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_phone is not null and (
    p_phone ~ '^\+91[6-9][0-9]{9}$'
    or (p_phone !~ '^\+91' and p_phone ~ '^\+[1-9][0-9]{7,14}$')
  );
$$;

-- ---------------------------------------------------------------------------
-- Profiles (one per sign-in account: guests and the hotel team)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' check (length(full_name) <= 120),
  phone text check (phone is null or public.is_valid_phone(phone)),
  email text,
  role text not null default 'guest' check (role in ('guest', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.profiles.role is
  'Never set from user input. Promote an admin with scripts/create-admin.mjs or SQL.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.profiles_normalize()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Spaces, dashes, dots and brackets are tidied away; letters are left for the check to reject
  if coalesce(new.phone, '') ~ '^[0-9+ ().-]*$' then
    new.phone := public.normalize_phone(new.phone);
  end if;
  new.full_name := trim(new.full_name);
  return new;
end;
$$;

create trigger profiles_normalize
  before insert or update of phone, full_name on public.profiles
  for each row execute function public.profiles_normalize();

-- New accounts get a guest profile with the name and phone from sign-up (Google gives the name).
-- The role always starts as guest: sign-up data is user-controlled and never trusted for access.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text := public.normalize_phone(new.raw_user_meta_data ->> 'phone');
begin
  insert into public.profiles (id, full_name, phone, email)
  values (
    new.id,
    left(trim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')), 120),
    case when public.is_valid_phone(v_phone) then v_phone end,
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.sync_profile_email();

-- True only for an admin whose session has passed two-step verification.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin')
    and coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2';
$$;

-- ---------------------------------------------------------------------------
-- Room types (prices and how many rooms of each kind the hotel has)
-- ---------------------------------------------------------------------------

create table public.room_types (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(name) between 2 and 80),
  price_per_night_paise bigint not null check (price_per_night_paise > 0),
  max_guests integer not null check (max_guests between 1 and 12),
  total_rooms integer not null check (total_rooms between 0 and 500),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.room_types is
  'Bookable room categories. Descriptions and photos live in the website code (src/data/hotel.ts), matched by id.';
comment on column public.room_types.total_rooms is 'Number of physical rooms of this type that can be sold each night.';

create trigger room_types_set_updated_at
  before update on public.room_types
  for each row execute function public.set_updated_at();

-- Rooms taken out of sale (maintenance, owner use, renovation) for a date range.
create table public.room_closures (
  id uuid primary key default gen_random_uuid(),
  room_type_id text not null references public.room_types (id) on delete cascade,
  starts_on date not null,
  ends_on date not null,
  rooms_closed integer not null default 1 check (rooms_closed >= 1),
  reason text not null default 'maintenance' check (reason in ('maintenance', 'owner_use', 'other')),
  note text check (length(note) <= 500),
  created_at timestamptz not null default now(),
  check (ends_on > starts_on)
);

comment on column public.room_closures.ends_on is 'Exclusive: the first night that is open again.';

create index room_closures_type_idx on public.room_closures (room_type_id, starts_on);

-- ---------------------------------------------------------------------------
-- Bookings (website requests, phone/walk-in bookings, and the payment ledger)
-- ---------------------------------------------------------------------------

create sequence public.booking_reference_seq start with 1001;

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('EL-' || nextval('public.booking_reference_seq')),
  room_type_id text not null references public.room_types (id) on delete restrict,
  rooms_count integer not null default 1 check (rooms_count between 1 and 20),
  guest_id uuid references auth.users (id) on delete set null,
  guest_name text not null check (length(guest_name) between 1 and 120),
  guest_phone text,
  guest_email text,
  check_in date not null,
  check_out date not null,
  nights integer generated always as (check_out - check_in) stored,
  adults integer not null default 1 check (adults >= 1),
  children integer not null default 0 check (children >= 0),
  arrival_time text check (length(arrival_time) <= 20),
  special_requests text check (length(special_requests) <= 2000),
  room_total_paise bigint not null default 0 check (room_total_paise >= 0),
  gst_paise bigint not null default 0 check (gst_paise >= 0),
  total_paise bigint not null default 0 check (total_paise >= 0),
  status text not null default 'enquiry'
    check (status in ('enquiry', 'awaiting_payment', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show')),
  source text not null default 'website'
    check (source in ('website', 'whatsapp', 'phone', 'walk_in', 'ota', 'other')),
  amount_paid_paise bigint not null default 0 check (amount_paid_paise >= 0),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'partially_paid', 'paid', 'refunded')),
  payment_method text check (payment_method in ('cash', 'upi', 'card', 'bank_transfer', 'ota', 'other')),
  admin_notes text check (length(admin_notes) <= 4000),
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (check_out > check_in),
  check (guest_email is not null or guest_phone is not null)
);

comment on column public.bookings.status is
  'enquiry: request only, holds no rooms. awaiting_payment / confirmed / checked_in: rooms are held.';

create index bookings_type_dates_idx on public.bookings (room_type_id, check_in, check_out);
create index bookings_status_idx on public.bookings (status);
create index bookings_guest_idx on public.bookings (guest_id);
create index bookings_guest_email_idx on public.bookings (lower(guest_email));

create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

-- Statuses that hold rooms
create or replace function public.holds_rooms(p_status text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_status in ('awaiting_payment', 'confirmed', 'checked_in');
$$;

-- Rooms of a type already taken on each night of a range (by bookings that hold rooms and by
-- closures), optionally ignoring one booking or closure (the one being edited).
create or replace function public.rooms_taken_by_night(
  p_room_type_id text,
  p_from date,
  p_to date,
  p_ignore_booking uuid default null,
  p_ignore_closure uuid default null
)
returns table (night date, taken integer)
language sql
stable
security definer
set search_path = ''
as $$
  select d::date as night,
    (
      coalesce((
        select sum(b.rooms_count) from public.bookings b
        where b.room_type_id = p_room_type_id
          and public.holds_rooms(b.status)
          and b.check_in <= d::date and b.check_out > d::date
          and (p_ignore_booking is null or b.id <> p_ignore_booking)
      ), 0)
      + coalesce((
        select sum(c.rooms_closed) from public.room_closures c
        where c.room_type_id = p_room_type_id
          and c.starts_on <= d::date and c.ends_on > d::date
          and (p_ignore_closure is null or c.id <> p_ignore_closure)
      ), 0)
    )::integer as taken
  from generate_series(p_from::timestamp, (p_to - 1)::timestamp, interval '1 day') d;
$$;

-- Fewest rooms of a type still free on any night of the range.
create or replace function public.rooms_left(
  p_room_type_id text,
  p_check_in date,
  p_check_out date,
  p_ignore_booking uuid default null
)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select greatest(
    0,
    (select rt.total_rooms from public.room_types rt where rt.id = p_room_type_id)
      - coalesce((select max(t.taken) from public.rooms_taken_by_night(p_room_type_id, p_check_in, p_check_out, p_ignore_booking) t), 0)
  )::integer;
$$;

-- A booking that holds rooms may not oversell its room type on any night.
create or replace function public.bookings_check_inventory()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.holds_rooms(new.status)
     and new.rooms_count > public.rooms_left(new.room_type_id, new.check_in, new.check_out, new.id) then
    raise exception 'Not enough % rooms free for those dates', new.room_type_id
      using errcode = '23P01';
  end if;
  return new;
end;
$$;

create trigger bookings_check_inventory
  before insert or update of status, room_type_id, rooms_count, check_in, check_out on public.bookings
  for each row execute function public.bookings_check_inventory();

-- A closure may not take rooms that held bookings already use.
create or replace function public.room_closures_check_inventory()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_total integer;
  v_worst integer;
begin
  select total_rooms into v_total from public.room_types where id = new.room_type_id;
  select max(t.taken) into v_worst
  from public.rooms_taken_by_night(new.room_type_id, new.starts_on, new.ends_on, null, new.id) t;
  if coalesce(v_worst, 0) + new.rooms_closed > v_total then
    raise exception 'Booked guests already use some of those rooms on those dates' using errcode = '23P01';
  end if;
  return new;
end;
$$;

create trigger room_closures_check_inventory
  before insert or update on public.room_closures
  for each row execute function public.room_closures_check_inventory();

-- Lowering a room type's room count may not leave held bookings without rooms.
create or replace function public.room_types_check_inventory()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.total_rooms < old.total_rooms and exists (
    select 1 from public.rooms_taken_by_night(new.id, current_date, current_date + 400) t
    where t.taken > new.total_rooms
  ) then
    raise exception 'Some future nights already have more rooms booked than that' using errcode = '23P01';
  end if;
  return new;
end;
$$;

create trigger room_types_check_inventory
  before update of total_rooms on public.room_types
  for each row execute function public.room_types_check_inventory();

-- ---------------------------------------------------------------------------
-- Prices and availability for the website (safe to call from the browser)
-- ---------------------------------------------------------------------------

-- Room tariff GST in India: 5% when the tariff is up to Rs 7,500 per room per night, 18% above.
create or replace function public.gst_rate_for_tariff(p_tariff_paise bigint)
returns numeric
language sql
immutable
set search_path = ''
as $$
  select case when p_tariff_paise <= 750000 then 0.05 else 0.18 end;
$$;

-- Price and availability for a stay. Never trusts prices from the browser.
create or replace function public.quote_stay(
  p_room_type_id text,
  p_check_in date,
  p_check_out date,
  p_rooms integer default 1,
  p_adults integer default 2,
  p_children integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  rt public.room_types%rowtype;
  v_nights integer;
  v_rooms integer := greatest(coalesce(p_rooms, 1), 1);
  v_guests integer := greatest(coalesce(p_adults, 0), 0) + greatest(coalesce(p_children, 0), 0);
  v_room_total bigint;
  v_gst_rate numeric;
  v_gst bigint;
  v_left integer;
  v_problems text[] := '{}';
begin
  select * into rt from public.room_types where id = p_room_type_id and (is_active or public.is_admin());
  if not found then
    return jsonb_build_object('ok', false, 'problems', jsonb_build_array('This room type was not found'));
  end if;
  if p_check_in is null or p_check_out is null or p_check_out <= p_check_in then
    return jsonb_build_object('ok', false, 'problems', jsonb_build_array('Check-out must be after check-in'));
  end if;
  v_nights := p_check_out - p_check_in;
  if v_nights > 60 then
    return jsonb_build_object('ok', false, 'problems', jsonb_build_array('Stays longer than 60 nights need a custom quote'));
  end if;

  if p_check_in < current_date then
    v_problems := v_problems || 'Check-in is in the past'::text;
  end if;
  if coalesce(p_adults, 0) < 1 then
    v_problems := v_problems || 'At least one adult is required'::text;
  end if;
  if v_guests > rt.max_guests * v_rooms then
    v_problems := v_problems || format('%s %s room(s) sleep up to %s guests', v_rooms, rt.name, rt.max_guests * v_rooms);
  end if;
  v_left := public.rooms_left(rt.id, p_check_in, p_check_out);
  if v_left < v_rooms then
    v_problems := v_problems || case when v_left = 0
      then format('%s is sold out for those dates', rt.name)
      else format('Only %s %s room(s) left for those dates', v_left, rt.name) end;
  end if;

  v_room_total := rt.price_per_night_paise * v_nights * v_rooms;
  v_gst_rate := public.gst_rate_for_tariff(rt.price_per_night_paise);
  v_gst := round(v_room_total * v_gst_rate);

  return jsonb_build_object(
    'ok', cardinality(v_problems) = 0,
    'problems', to_jsonb(v_problems),
    'room_type_id', rt.id,
    'nights', v_nights,
    'rooms', v_rooms,
    'rooms_left', v_left,
    'price_per_night_paise', rt.price_per_night_paise,
    'room_total_paise', v_room_total,
    'gst_rate', v_gst_rate,
    'gst_paise', v_gst,
    'total_paise', v_room_total + v_gst
  );
end;
$$;

-- Rooms left per room type for a date range (for the booking page). No guest details.
create or replace function public.room_availability(p_check_in date, p_check_out date)
returns table (room_type_id text, rooms_left integer, price_per_night_paise bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select rt.id,
    case when p_check_out > p_check_in then public.rooms_left(rt.id, p_check_in, p_check_out) else 0 end,
    rt.price_per_night_paise
  from public.room_types rt
  where rt.is_active
  order by rt.sort_order, rt.name;
$$;

-- ---------------------------------------------------------------------------
-- Website booking requests
-- ---------------------------------------------------------------------------

create or replace function public.request_booking(
  p_room_type_id text,
  p_check_in date,
  p_check_out date,
  p_rooms integer,
  p_adults integer,
  p_children integer,
  p_guest_name text,
  p_guest_phone text,
  p_guest_email text default null,
  p_arrival_time text default null,
  p_special_requests text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_name text := trim(coalesce(p_guest_name, ''));
  v_phone text := public.normalize_phone(p_guest_phone);
  v_email text := nullif(lower(trim(coalesce(p_guest_email, ''))), '');
  v_notes text := nullif(trim(coalesce(p_special_requests, '')), '');
  v_arrival text := nullif(trim(coalesce(p_arrival_time, '')), '');
  v_quote jsonb;
  v_recent integer;
  v_reference text;
begin
  if v_email is null and v_user is not null then
    v_email := nullif(lower(coalesce(auth.jwt() ->> 'email', '')), '');
  end if;

  if length(v_name) < 2 or length(v_name) > 120 then
    raise exception 'Please enter your name.' using errcode = '22023';
  end if;
  if v_phone is null then
    raise exception 'Please add your phone number.' using errcode = '22023';
  end if;
  if not public.is_valid_phone(v_phone) then
    raise exception 'Enter a valid phone number: 10 digits for India, starting with 6, 7, 8 or 9.' using errcode = '22023';
  end if;
  if v_email is not null and v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Please enter a valid email address.' using errcode = '22023';
  end if;
  if length(coalesce(v_notes, '')) > 2000 then
    raise exception 'Special requests must be shorter than 2,000 characters.' using errcode = '22023';
  end if;
  if length(coalesce(v_arrival, '')) > 20 then
    raise exception 'Please enter an arrival time like 14:30.' using errcode = '22023';
  end if;
  if p_check_in is null or p_check_in < current_date then
    raise exception 'Please choose a check-in date from today onwards.' using errcode = '22023';
  end if;

  -- Flood protection: the same phone, email or account can send 5 requests an hour.
  select count(*) into v_recent
  from public.bookings b
  where b.source = 'website'
    and b.created_at > now() - interval '1 hour'
    and (b.guest_phone = v_phone
      or (v_email is not null and b.guest_email = v_email)
      or (v_user is not null and b.guest_id = v_user));
  if v_recent >= 5 then
    raise exception 'You have already sent several requests. Please call or WhatsApp us instead.'
      using errcode = 'P0001';
  end if;

  -- Priced on the server. Sold-out dates don't stop a request (it holds no rooms, and the team
  -- can offer another room type), but impossible ones do.
  v_quote := public.quote_stay(p_room_type_id, p_check_in, p_check_out, p_rooms, p_adults, p_children);
  if not (v_quote ? 'total_paise') then
    raise exception '%', coalesce(v_quote -> 'problems' ->> 0, 'This stay cannot be requested.') using errcode = '22023';
  end if;
  if greatest(coalesce(p_adults, 1), 1) + greatest(coalesce(p_children, 0), 0)
     > (select max_guests from public.room_types where id = p_room_type_id) * greatest(coalesce(p_rooms, 1), 1) then
    raise exception 'Too many guests for that many rooms. Add a room or choose a larger room type.' using errcode = '22023';
  end if;

  insert into public.bookings (
    room_type_id, rooms_count, guest_id, guest_name, guest_phone, guest_email, check_in, check_out,
    adults, children, arrival_time, special_requests, room_total_paise, gst_paise, total_paise,
    status, source
  ) values (
    p_room_type_id, greatest(coalesce(p_rooms, 1), 1), v_user, v_name, v_phone, v_email, p_check_in, p_check_out,
    greatest(coalesce(p_adults, 1), 1), greatest(coalesce(p_children, 0), 0), v_arrival, v_notes,
    (v_quote ->> 'room_total_paise')::bigint, (v_quote ->> 'gst_paise')::bigint, (v_quote ->> 'total_paise')::bigint,
    'enquiry', 'website'
  )
  returning reference into v_reference;

  if v_user is not null then
    update public.profiles set phone = v_phone where id = v_user and phone is null;
  end if;

  return jsonb_build_object('reference', v_reference, 'quote', v_quote);
end;
$$;

-- "My bookings" for signed-in guests (no ledger details)
create or replace function public.my_bookings()
returns table (
  reference text,
  room_type_id text,
  room_name text,
  rooms_count integer,
  check_in date,
  check_out date,
  nights integer,
  adults integer,
  children integer,
  total_paise bigint,
  status text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select b.reference, b.room_type_id, rt.name, b.rooms_count, b.check_in, b.check_out, b.nights,
         b.adults, b.children, b.total_paise, b.status, b.created_at
  from public.bookings b
  join public.room_types rt on rt.id = b.room_type_id
  where (select auth.uid()) is not null
    and (
      b.guest_id = (select auth.uid())
      or (b.guest_email is not null and lower(b.guest_email) = lower(coalesce((select auth.jwt()) ->> 'email', '')))
    )
  order by b.check_in desc;
$$;

-- ---------------------------------------------------------------------------
-- Contact form messages
-- ---------------------------------------------------------------------------

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'contact' check (kind in ('contact', 'event', 'corporate')),
  name text not null check (length(name) between 1 and 120),
  phone text not null,
  email text check (length(email) <= 254),
  message text check (length(message) <= 4000),
  status text not null default 'new' check (status in ('new', 'in_progress', 'closed')),
  admin_notes text check (length(admin_notes) <= 4000),
  user_id uuid references auth.users (id) on delete set null,
  notified_at timestamptz,
  created_at timestamptz not null default now()
);

create index enquiries_status_idx on public.enquiries (status, created_at desc);

create or replace function public.submit_enquiry(
  p_kind text,
  p_name text,
  p_phone text,
  p_email text default null,
  p_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := trim(coalesce(p_name, ''));
  v_phone text := public.normalize_phone(p_phone);
  v_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
  v_message text := nullif(trim(coalesce(p_message, '')), '');
  v_recent integer;
  v_id uuid;
begin
  if coalesce(p_kind, '') not in ('contact', 'event', 'corporate') then
    raise exception 'Unknown message type.' using errcode = '22023';
  end if;
  if length(v_name) < 2 or length(v_name) > 120 then
    raise exception 'Please enter your name.' using errcode = '22023';
  end if;
  if v_phone is null then
    raise exception 'Please add your phone number.' using errcode = '22023';
  end if;
  if not public.is_valid_phone(v_phone) then
    raise exception 'Enter a valid phone number: 10 digits for India, starting with 6, 7, 8 or 9.' using errcode = '22023';
  end if;
  if v_email is not null and (length(v_email) > 254 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$') then
    raise exception 'Please enter a valid email address.' using errcode = '22023';
  end if;
  if length(coalesce(v_message, '')) > 4000 then
    raise exception 'Please keep your message under 4,000 characters.' using errcode = '22023';
  end if;

  select count(*) into v_recent
  from public.enquiries e
  where e.created_at > now() - interval '1 hour'
    and (e.phone = v_phone or (v_email is not null and e.email = v_email));
  if v_recent >= 5 then
    raise exception 'You have already sent several messages. Please call or WhatsApp us instead.' using errcode = 'P0001';
  end if;

  insert into public.enquiries (kind, name, phone, email, message, user_id)
  values (p_kind, v_name, v_phone, v_email, v_message, auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin helpers
-- ---------------------------------------------------------------------------

create or replace function public.admin_list_customers()
returns table (
  id uuid,
  full_name text,
  email text,
  phone text,
  provider text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  booking_count bigint,
  last_request_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  return query
  select pr.id, pr.full_name, pr.email, pr.phone,
         coalesce(u.raw_app_meta_data ->> 'provider', 'email'),
         pr.created_at, u.last_sign_in_at,
         count(b.id), max(b.created_at)
  from public.profiles pr
  join auth.users u on u.id = pr.id
  left join public.bookings b
    on b.guest_id = pr.id or (b.guest_email is not null and lower(b.guest_email) = lower(pr.email))
  where pr.role = 'guest'
  group by pr.id, u.id
  order by pr.created_at desc;
end;
$$;

-- Rooms taken per night per type, for the admin availability calendar.
create or replace function public.admin_occupancy(p_from date, p_to date)
returns table (room_type_id text, night date, booked integer, closed integer, total_rooms integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  if p_to <= p_from or p_to - p_from > 120 then
    raise exception 'Choose a range of up to 120 days' using errcode = '22023';
  end if;
  return query
  select rt.id, d::date,
    coalesce((select sum(b.rooms_count) from public.bookings b
              where b.room_type_id = rt.id and public.holds_rooms(b.status)
                and b.check_in <= d::date and b.check_out > d::date), 0)::integer,
    coalesce((select sum(c.rooms_closed) from public.room_closures c
              where c.room_type_id = rt.id and c.starts_on <= d::date and c.ends_on > d::date), 0)::integer,
    rt.total_rooms
  from public.room_types rt
  cross join generate_series(p_from::timestamp, (p_to - 1)::timestamp, interval '1 day') d
  order by rt.sort_order, rt.id, d;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.room_types enable row level security;
alter table public.room_closures enable row level security;
alter table public.bookings enable row level security;
alter table public.enquiries enable row level security;

create policy "Read own profile or any as admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "Update own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Anyone reads active room types" on public.room_types
  for select to anon, authenticated
  using (is_active or (select public.is_admin()));

create policy "Admins manage room types" on public.room_types
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins manage room closures" on public.room_closures
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins manage bookings" on public.bookings
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins manage enquiries" on public.enquiries
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Permissions (new Supabase projects don't open tables to the API roles automatically)
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated, service_role;

grant select on public.room_types to anon;
grant select, insert, update, delete on public.room_types, public.room_closures, public.bookings, public.enquiries
  to authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
grant usage, select on sequence public.booking_reference_seq to authenticated;

revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function
  public.is_admin(),
  public.normalize_phone(text),
  public.is_valid_phone(text),
  public.holds_rooms(text),
  public.gst_rate_for_tariff(bigint),
  public.quote_stay(text, date, date, integer, integer, integer),
  public.room_availability(date, date),
  public.request_booking(text, date, date, integer, integer, integer, text, text, text, text, text),
  public.submit_enquiry(text, text, text, text, text)
to anon, authenticated;
grant execute on function
  public.my_bookings(),
  public.admin_list_customers(),
  public.admin_occupancy(date, date),
  public.rooms_left(text, date, date, uuid),
  public.rooms_taken_by_night(text, date, date, uuid, uuid)
to authenticated;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
