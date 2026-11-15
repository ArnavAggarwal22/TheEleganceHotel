-- Starting room types (prices match src/data/hotel.ts). Change prices and room counts later in the
-- admin dashboard under "Rooms & prices".
insert into public.room_types (id, name, price_per_night_paise, max_guests, total_rooms, sort_order) values
  ('deluxe', 'Deluxe Room', 299900, 2, 6, 1),
  ('premium', 'Premium Room', 349900, 3, 4, 2),
  ('elegance-suite', 'Elegance Suite', 449900, 3, 2, 3)
on conflict (id) do nothing;
