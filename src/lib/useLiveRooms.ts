import { useEffect, useState } from 'react';
import { ROOMS, type Room } from '@/data/hotel';
import { fetchRoomTypes, type RoomTypeRow } from './db';
import { supabase } from './supabase';

// Room descriptions and photos come from src/data/hotel.ts; prices, guest limits and whether a room
// type is on sale come from the database (edited in the admin dashboard), matched by id.
let cache: Promise<RoomTypeRow[]> | null = null;
const load = () => {
  if (!supabase) return Promise.resolve<RoomTypeRow[]>([]);
  cache ??= fetchRoomTypes().catch((e) => {
    console.warn('Could not load live room prices; showing the defaults.', e);
    cache = null;
    return [];
  });
  return cache;
};

/** Forget the cached prices (after an admin edits them). */
export const refreshLiveRooms = () => {
  cache = null;
};

const merge = (rows: RoomTypeRow[]): Room[] => {
  if (!rows.length) return ROOMS;
  return ROOMS.filter((r) => rows.find((row) => row.id === r.id)?.is_active ?? true).map((r) => {
    const row = rows.find((x) => x.id === r.id);
    return row ? { ...r, price: row.price, maxGuests: row.max_guests } : r;
  });
};

/** The rooms to show and sell, with live prices once they have loaded. */
export function useLiveRooms(): Room[] {
  const [rooms, setRooms] = useState<Room[]>(ROOMS);
  useEffect(() => {
    let active = true;
    void load().then((rows) => active && setRooms(merge(rows)));
    return () => {
      active = false;
    };
  }, []);
  return rooms;
}

/** GST on room tariff in India: 5% up to Rs 7,500 per room per night, 18% above. */
export const gstRateFor = (pricePerNight: number) => (pricePerNight <= 7500 ? 0.05 : 0.18);
