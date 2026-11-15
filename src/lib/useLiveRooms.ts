import { useEffect, useMemo, useState } from 'react';
import { ROOMS, formatINR, type Room } from '@/data/hotel';
import { fetchRoomTypes, type RoomTypeRow } from './db';
import { supabase } from './supabase';

// Room descriptions and photos come from src/data/hotel.ts. Prices, guest limits and whether a room
// type is on sale come ONLY from the database (set in /admin → Rooms & prices), matched by id.
// The numbers in hotel.ts are used only when the site has no database connection at all.
//
// So a guest never sees an outdated price:
//  * until the live prices arrive, prices show as "…" (never the old defaults);
//  * the last live prices are remembered in the browser, so repeat visits show them instantly
//    and are then refreshed;
//  * prices are fetched again when the tab regains focus and after one minute, and an admin's
//    change is pushed to the visitor's other open tabs.

const STORE_KEY = 'elegance_live_rooms_v1';
const MAX_AGE_MS = 60_000;

let cache: { at: number; rows: RoomTypeRow[] } | null = null;
let inflight: Promise<RoomTypeRow[] | null> | null = null;
const listeners = new Set<(rows: RoomTypeRow[]) => void>();

const readStored = (): RoomTypeRow[] | null => {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const parsed = raw ? (JSON.parse(raw) as { rows?: RoomTypeRow[] }) : null;
    return Array.isArray(parsed?.rows) ? parsed!.rows : null;
  } catch {
    return null;
  }
};

const publish = (rows: RoomTypeRow[]) => {
  cache = { at: Date.now(), rows };
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ at: cache.at, rows }));
  } catch {
    /* storage unavailable: fine, prices still load from the database */
  }
  listeners.forEach((fn) => fn(rows));
};

/** Fetches live prices (shared by every component; at most one request at a time). */
const load = (force = false): Promise<RoomTypeRow[] | null> => {
  if (!supabase) return Promise.resolve(null);
  if (!force && cache && Date.now() - cache.at < MAX_AGE_MS) return Promise.resolve(cache.rows);
  inflight ??= fetchRoomTypes()
    .then((rows) => {
      publish(rows);
      return rows;
    })
    .catch((e) => {
      console.warn('Could not load live room prices.', e);
      return cache?.rows ?? null;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
};

/** Reload prices now (after an admin saves new prices); open tabs update too. */
export const refreshLiveRooms = () => load(true);

const merge = (rows: RoomTypeRow[] | null): Room[] => {
  if (!supabase) return ROOMS; // no database: show the defaults from hotel.ts
  if (!rows) return ROOMS.map((r) => ({ ...r, priceKnown: false }));
  return ROOMS.filter((r) => rows.find((row) => row.id === r.id)?.is_active ?? false).map((r) => {
    const row = rows.find((x) => x.id === r.id)!;
    return { ...r, price: row.price, maxGuests: row.max_guests, priceKnown: true };
  });
};

/** The rooms to show and sell, with their live prices. */
export function useLiveRooms(): Room[] {
  const [rows, setRows] = useState<RoomTypeRow[] | null>(() => cache?.rows ?? readStored());

  useEffect(() => {
    let active = true;
    const update = (next: RoomTypeRow[] | null) => active && next && setRows(next);
    listeners.add(update);
    void load().then(update);

    const onFocus = () => {
      if (document.visibilityState === 'visible') void load().then(update);
    };
    // Another tab (e.g. the admin dashboard) saved new prices
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORE_KEY) void load(true).then(update);
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('storage', onStorage);
    return () => {
      active = false;
      listeners.delete(update);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return useMemo(() => merge(rows), [rows]);
}

/** "₹1,199", or "…" while the live price is still loading. */
export const priceText = (room: Room) => (room.priceKnown === false ? '₹ …' : formatINR(room.price));

/** GST on room tariff in India: 5% up to Rs 7,500 per room per night, 18% above. */
export const gstRateFor = (pricePerNight: number) => (pricePerNight <= 7500 ? 0.05 : 0.18);
