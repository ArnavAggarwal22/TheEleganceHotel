-- Starting room types (prices match src/data/hotel.ts). Change prices and room counts later in the
-- admin dashboard under "Rooms & prices".
insert into public.room_types (id, name, price_per_night_paise, max_guests, total_rooms, sort_order) values
  ('deluxe', 'Deluxe Room', 299900, 2, 13, 1),
  ('super-deluxe', 'Super Deluxe Room', 349900, 3, 3, 2)
on conflict (id) do nothing;
