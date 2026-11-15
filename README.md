# The Elegance Hotel by Ambience — Website

Premium website for **The Elegance Hotel by Ambience**, Ambala Chandigarh Highway, near PNB Bank,
Patiala Chowk, Zirakpur, Punjab – 140603 · **+91 81468 30484**.
A member of **The Ambience Hotels** (parent brand / flagship: The Ambience Hotel, Zirakpur).

Built with Vite, React 19, TypeScript, Tailwind CSS 3 and Framer Motion, with a Supabase backend
(database, sign-in, email alerts).

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build in dist/
npm run test:db   # database tests in an in-memory Postgres (no Docker needed)
```

Without `.env.local` the site still works: booking requests and the contact form go to WhatsApp
only, and guest accounts and the admin dashboard are off.

Deploys to Vercel as-is (`vercel.json` rewrites all routes to `index.html`).

## Pages

| Route | What it is |
| --- | --- |
| `/` | Home — hero + availability search, about, rooms, amenities, dining, **The Ambience Collection**, gallery, guest reviews, map & contact |
| `/rooms`, `/rooms/:id` | Deluxe (13) and Super Deluxe (3) rooms, room detail with photo gallery |
| `/book` | 4-step booking flow (dates → room → guest → review) with GST; sends the request to the hotel's WhatsApp |
| `/gallery` | Filterable gallery with lightbox |
| `/our-hotels` | The Ambience Hotels family — brand story, flagship + all properties |
| `/signin`, `/account` | Guest sign-in (email + password with a 6-digit code, or Google) and My bookings |
| `/privacy`, `/terms`, `/cancellation-policy` | Policies (linked in the footer and the booking flow) |
| `/admin` | Team dashboard (not linked anywhere; type the address): bookings ledger, availability, rooms & prices, messages, guests |

## How bookings work

1. The guest picks dates, room type and number of rooms on `/book`. Rooms left for those dates come
   from the database; prices come from **Rooms & prices** in the dashboard.
2. **Confirm booking request** saves it with a reference (`EL-1001`…), priced on the server with GST
   (5% up to ₹7,500 per room per night, 18% above), then emails the hotel
   (theelegancehotelchd@gmail.com, with one-tap WhatsApp / call buttons) and the guest, and opens
   WhatsApp to +91 81468 30484 with the details.
3. In **/admin → Bookings** the team follows up, then sets the booking to *Held*, *Confirmed*,
   *Checked in*… and records payments. Held, confirmed and checked-in bookings take rooms; the
   database refuses anything that would overbook a room type on any night.
4. Phone and walk-in bookings are added in the same ledger (**New booking**).

## Backend setup (once)

1. Create a Supabase project (region **South Asia (Mumbai)**) and fill `.env.local` from
   `.env.example` (Project Settings → API Keys). Only `VITE_` values go to Vercel.
2. `npx supabase login`, then run
   `powershell -ExecutionPolicy Bypass -File scripts\setup-hotel.ps1`. It applies the database,
   deploys the email function and asks for the hotel Gmail **app password**
   (myaccount.google.com/apppasswords) and, optionally, Google sign-in keys.
3. Create the first team account:
   `node --env-file=.env.local scripts/create-admin.mjs theelegancehotelchd@gmail.com "Front Desk"`,
   then sign in at `/admin` and scan the QR code with an authenticator app.
4. In Vercel, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` and redeploy.

## Editing content

**Everything** (phone, address, rooms, prices, amenities, sister hotels, reviews, photos) lives in
[`src/data/hotel.ts`](src/data/hotel.ts).

- **Before going live:** the Elegance room names/prices/sizes and Elegance photos are placeholders
  (Unsplash stock). Put real photos in `src/assets/elegance/` and import them in `hotel.ts`.
- Add another Ambience property by adding an entry to `COLLECTION` (remove the "Coming Soon" card
  when you no longer need it).
- Prices, room counts and which room types are on sale are edited in `/admin → Rooms & prices`
  (the numbers in `hotel.ts` are only used until the database is connected).
