# The Elegance Hotel by Ambience — Website

Premium website for **The Elegance Hotel by Ambience**, Ambala Chandigarh Highway, near PNB Bank,
Patiala Chowk, Zirakpur, Punjab – 140603 · **+91 81468 30484**.
A member of **The Ambience Hotels** (parent brand / flagship: The Ambience Hotel, Zirakpur).

Built with Vite, React 19, TypeScript, Tailwind CSS 3 and Framer Motion.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build in dist/
```

Deploys to Vercel as-is (`vercel.json` rewrites all routes to `index.html`).

## Pages

| Route | What it is |
| --- | --- |
| `/` | Home — hero + availability search, about, rooms, amenities, dining, **The Ambience Collection**, gallery, guest reviews, map & contact |
| `/rooms`, `/rooms/:id` | Rooms & suites, room detail with photo gallery |
| `/book` | 4-step booking flow (dates → room → guest → review) with GST; sends the request to the hotel's WhatsApp |
| `/gallery` | Filterable gallery with lightbox |
| `/our-hotels` | The Ambience Hotels family — brand story, flagship + all properties |

## Editing content

**Everything** (phone, address, rooms, prices, amenities, sister hotels, reviews, photos) lives in
[`src/data/hotel.ts`](src/data/hotel.ts).

- **Before going live:** the Elegance room names/prices/sizes and Elegance photos are placeholders
  (Unsplash stock). Put real photos in `src/assets/elegance/` and import them in `hotel.ts`.
- Add another Ambience property by adding an entry to `COLLECTION` (remove the "Coming Soon" card
  when you no longer need it).
- GST rate is `HOTEL.gstRate` (5% for tariffs up to ₹7,500/night).
