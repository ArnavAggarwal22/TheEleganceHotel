/**
 * ───────────────────────────────────────────────────────────────────────────
 *  THE ELEGANCE HOTEL BY AMBIENCE — site content
 *  Every piece of text, price and photo on the website comes from this file.
 *
 *  NOTE: Room names, prices, sizes and the Elegance photos below are
 *  starting placeholders (stock photography). Replace them with the real
 *  property details/photos before going live. To use your own photos, drop
 *  them into src/assets/elegance/ and import them here, e.g.
 *      import lobby from '@/assets/elegance/lobby.jpg';
 * ───────────────────────────────────────────────────────────────────────────
 */
import ambienceNight from '@/assets/ambience/ambience-night.jpg';
import ambienceReception from '@/assets/ambience/reception.jpeg';
import ambienceRoom from '@/assets/ambience/super-deluxe.jpeg';
import ambienceBanquet from '@/assets/ambience/banquet.jpeg';
import sukhna from '@/assets/nearby/Sukhnalake.jpg';
import rockGarden from '@/assets/nearby/RockGarden.jpg';
import roseGarden from '@/assets/nearby/RoseGarden.jpg';
import elante from '@/assets/nearby/ElanteMall.jpg';

/** Unsplash helper – keeps photo URLs short and consistently sized. */
const u = (id: string, w = 1600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=${w}`;

export const HOTEL = {
  name: 'The Elegance Hotel',
  byline: 'by Ambience',
  fullName: 'The Elegance Hotel by Ambience',
  tagline: 'Where every stay is composed with grace',
  phoneDisplay: '+91 81468 30484',
  phoneTel: '+918146830484',
  whatsapp: '918146830484',
  addressLines: [
    'Ambala Chandigarh Highway, near PNB Bank',
    'Patiala Chowk, Zirakpur',
    'Punjab – 140603',
  ],
  addressOneLine:
    'Ambala Chandigarh Highway, near PNB Bank, Patiala Chowk, Zirakpur, Punjab – 140603',
  mapQuery: 'Patiala Chowk, Ambala Chandigarh Highway, Zirakpur, Punjab 140603',
  checkIn: '12:00 PM',
  checkOut: '11:00 AM',
  /** GST on hotel room tariff up to ₹7,500 per night. */
  gstRate: 0.05,
};

export const mapsEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(
  HOTEL.mapQuery,
)}&z=15&output=embed`;
export const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  HOTEL.mapQuery,
)}`;
export const whatsappLink = (text = `Hello ${HOTEL.fullName}, I'd like to enquire about a stay.`) =>
  `https://wa.me/${HOTEL.whatsapp}?text=${encodeURIComponent(text)}`;

/* ─────────────────────────── Imagery ─────────────────────────── */

export const IMAGES = {
  hero: [
    u('1566665797739-1674de7a421a', 2400),
    u('1590490360182-c33d57733427', 2400),
    u('1590381105924-c72589b9ef3f', 2400),
  ],
  intro: u('1560185007-cde436f6a4d0', 1400),
  introSecondary: u('1618773928121-c32242e63f39', 900),
  dining: u('1414235077428-338989a2e8c0', 1800),
  diningSecondary: u('1517248135467-4c7edcad34c4', 900),
  events: u('1519167758481-83f550bb49b3', 1800),
  pageRooms: u('1611892440504-42a792e24d32', 2400),
  pageGallery: u('1590381105924-c72589b9ef3f', 2400),
  pageBooking: u('1578683010236-d716f9a3f461', 2400),
  pageHotels: ambienceNight,
};

/* ─────────────────────────── Rooms ─────────────────────────── */

export interface Room {
  id: string;
  name: string;
  short: string;
  description: string;
  price: number;
  size: string;
  maxGuests: number;
  bed: string;
  view: string;
  image: string;
  gallery: string[];
  highlights: string[];
  amenities: string[];
}

export const ROOMS: Room[] = [
  {
    id: 'deluxe',
    name: 'Deluxe Room',
    short: 'Quiet, considered comfort for the modern traveller.',
    description:
      'Our Deluxe Room pairs soft neutral tones with warm brass accents to create a calm retreat from the highway bustle. A plush queen bed, a dedicated work corner and a refreshing rain shower make it ideal for business trips and short city breaks alike.',
    price: 2999,
    size: '180 sq ft',
    maxGuests: 2,
    bed: 'Queen Bed',
    view: 'City View',
    image: u('1618773928121-c32242e63f39', 1400),
    gallery: [
      u('1618773928121-c32242e63f39', 1800),
      u('1631049307264-da0ec9d70304', 1800),
      u('1629140727571-9b5c6f6267b4', 1800),
      u('1540518614846-7eded433c457', 1800),
    ],
    highlights: ['Queen Bed', 'Rain Shower', 'Smart TV', 'Work Desk'],
    amenities: [
      'Air Conditioning',
      'High-Speed Wi-Fi',
      '43" Smart TV',
      'Tea & Coffee Maker',
      'Work Desk',
      'In-Room Safe',
      'Premium Toiletries',
      'Daily Housekeeping',
      'In-Room Dining',
    ],
  },
  {
    id: 'premium',
    name: 'Premium Room',
    short: 'More space, a king bed and finer finishing touches.',
    description:
      'Generously proportioned and elegantly layered, the Premium Room features a king-size bed dressed in fine linen, a lounge chair for slow mornings and a marble-finish bathroom. Thoughtful lighting and blackout drapes ensure restful nights.',
    price: 3499,
    size: '220 sq ft',
    maxGuests: 3,
    bed: 'King Bed',
    view: 'Highway View',
    image: u('1590490360182-c33d57733427', 1400),
    gallery: [
      u('1590490360182-c33d57733427', 1800),
      u('1611892440504-42a792e24d32', 1800),
      u('1540518614846-7eded433c457', 1800),
      u('1629140727571-9b5c6f6267b4', 1800),
    ],
    highlights: ['King Bed', 'Lounge Chair', 'Marble Bath', 'Mini Fridge'],
    amenities: [
      'Air Conditioning',
      'High-Speed Wi-Fi',
      '50" Smart TV',
      'Mini Fridge',
      'Tea & Coffee Maker',
      'Lounge Seating',
      'In-Room Safe',
      'Bathrobes & Slippers',
      'Daily Housekeeping',
      'In-Room Dining',
    ],
  },
  {
    id: 'elegance-suite',
    name: 'Elegance Suite',
    short: 'Our signature suite — refined, spacious, unforgettable.',
    description:
      'The Elegance Suite is our most indulgent space, with a separate sitting area, a king-size bed, curated décor and premium amenities throughout. Perfect for families, celebrations and guests who simply want the very best of The Elegance.',
    price: 4499,
    size: '320 sq ft',
    maxGuests: 3,
    bed: 'King Bed',
    view: 'Panoramic View',
    image: u('1566665797739-1674de7a421a', 1400),
    gallery: [
      u('1566665797739-1674de7a421a', 1800),
      u('1560185007-cde436f6a4d0', 1800),
      u('1578683010236-d716f9a3f461', 1800),
      u('1590381105924-c72589b9ef3f', 1800),
    ],
    highlights: ['Sitting Area', 'King Bed', 'Premium Bath', 'Welcome Amenity'],
    amenities: [
      'Air Conditioning',
      'High-Speed Wi-Fi',
      '55" Smart TV',
      'Separate Sitting Area',
      'Mini Fridge',
      'Tea & Coffee Maker',
      'Bathrobes & Slippers',
      'Premium Toiletries',
      'Welcome Amenity',
      'Priority In-Room Dining',
    ],
  },
];

export const formatINR = (n: number) =>
  '₹' + Math.round(n).toLocaleString('en-IN');

/* ─────────────────────────── Amenities ─────────────────────────── */

export const AMENITIES = [
  { icon: 'Wifi', title: 'High-Speed Wi-Fi', desc: 'Complimentary, reliable internet across rooms and public spaces.' },
  { icon: 'Car', title: 'Secure Parking', desc: 'On-site parking right on the Ambala–Chandigarh Highway.' },
  { icon: 'UtensilsCrossed', title: 'In-Room Dining', desc: 'North Indian favourites and continental comforts, served to your door.' },
  { icon: 'ConciergeBell', title: '24×7 Front Desk', desc: 'A warm welcome and attentive help at any hour.' },
  { icon: 'Plane', title: 'Travel Desk', desc: 'Airport transfers, cabs and local sightseeing, arranged for you.' },
  { icon: 'Sparkles', title: 'Daily Housekeeping', desc: 'Immaculate rooms, refreshed every day with care.' },
  { icon: 'BriefcaseBusiness', title: 'Business Ready', desc: 'Work desks, fast Wi-Fi and printing support for working stays.' },
  { icon: 'ShieldCheck', title: 'Safe & Secure', desc: 'CCTV-monitored premises and electronic in-room safes.' },
] as const;

/* ─────────────────────────── The Ambience family ─────────────────────────── */

export const PARENT_BRAND = {
  name: 'The Ambience Hotels',
  short: 'Ambience',
  story:
    'The Ambience began in Zirakpur with a simple promise — genuine Punjabi warmth, spotless rooms and service that remembers your name. The Elegance Hotel is the next chapter of that promise: the same family, the same standards, reimagined with a more refined, contemporary spirit.',
};

export interface CollectionHotel {
  id: string;
  name: string;
  label: string;
  location: string;
  description: string;
  image?: string;
  highlights: string[];
  phoneDisplay?: string;
  phoneTel?: string;
  links?: { label: string; href: string }[];
  current?: boolean;
  comingSoon?: boolean;
}

export const COLLECTION: CollectionHotel[] = [
  {
    id: 'ambience',
    name: 'The Ambience Hotel',
    label: 'The Flagship',
    location: 'Near Unicity Homes, Zirakpur, Chandigarh, Punjab 140603',
    description:
      'Where it all began. Our flagship hotel offers Super Deluxe and Deluxe rooms, an in-house restaurant and a Grand Banquet Hall for weddings, parties and corporate events.',
    image: ambienceNight,
    highlights: ['Super Deluxe & Deluxe Rooms', 'Grand Banquet Hall · 100 guests', 'In-house Restaurant'],
    phoneDisplay: '+91 82880 77631',
    phoneTel: '+918288077631',
    links: [
      { label: 'Book at The Ambience', href: 'https://theambiencehotel.bookingjini.in/' },
      {
        label: 'Get Directions',
        href: 'https://www.google.com/maps/place/The+Ambience+Hotel/@30.660226,76.8162361,17z/data=!3m1!4b1!4m6!3m5!1s0x390feb0063620adf:0x34bf118209d9d1e!8m2!3d30.660226!4d76.818811',
      },
    ],
  },
  {
    id: 'elegance',
    name: 'The Elegance Hotel',
    label: 'Newest Address',
    location: 'Ambala Chandigarh Highway, Patiala Chowk, Zirakpur, Punjab 140603',
    description:
      'Our most refined property yet — elegant rooms and suites at Patiala Chowk, perfectly placed for Chandigarh, the airport and the hills.',
    image: u('1590381105924-c72589b9ef3f', 1400),
    highlights: ['Deluxe, Premium & Suite Rooms', 'Highway Location', 'Signature Ambience Service'],
    phoneDisplay: HOTEL.phoneDisplay,
    phoneTel: HOTEL.phoneTel,
    current: true,
  },
  {
    id: 'next',
    name: 'Next Destination',
    label: 'Coming Soon',
    location: 'Tricity & beyond',
    description:
      'The Ambience family is growing. New addresses are on the way — each with its own character and the same heartfelt hospitality.',
    highlights: [],
    comingSoon: true,
  },
];

export const AMBIENCE_GALLERY = [
  { src: ambienceReception, title: 'Reception' },
  { src: ambienceRoom, title: 'Super Deluxe Room' },
  { src: ambienceBanquet, title: 'Grand Banquet Hall' },
];

/* ─────────────────────────── Guest words ─────────────────────────── */
/** Reviews from guests of our flagship, The Ambience Hotel. */
export const TESTIMONIALS = [
  {
    name: 'Shreya Kapoor',
    date: 'Jan 2026',
    text: 'True to its name, the place has a beautiful ambience. The food was delicious and the stay was very comfortable. The hospitality of the staff was very impressive.',
  },
  {
    name: 'Rohit Arora',
    date: 'Dec 2025',
    text: 'The Ambience Hotel went above and beyond! Everything about our stay was flawless, from the friendly greeting at check-in to the spotless accommodation.',
  },
  {
    name: 'Dinesh Sharma',
    date: 'Oct 2025',
    text: 'The rooms are thoughtfully designed, complemented by professional hospitality and courteous staff. A lavish breakfast is served with a warm smile.',
  },
  {
    name: 'Priya Sharma',
    date: 'Dec 2025',
    text: 'Celebrated our anniversary here and it was magical. The staff arranged a beautiful surprise for us. Will definitely return!',
  },
];

/* ─────────────────────────── Location ─────────────────────────── */

export const NEARBY = [
  { name: 'Elante Mall', distance: '≈ 10 km', desc: 'Premium shopping, dining and cinema.', image: elante },
  { name: 'Rose Garden', distance: '≈ 14 km', desc: "One of Asia's largest rose gardens.", image: roseGarden },
  { name: 'Sukhna Lake', distance: '≈ 16 km', desc: 'Sunset walks and boating by the Shivaliks.', image: sukhna },
  { name: 'Rock Garden', distance: '≈ 17 km', desc: "Nek Chand's iconic sculpture garden.", image: rockGarden },
];

export const TRAVEL_TIMES = [
  { place: 'Chandigarh International Airport', time: '≈ 20 min' },
  { place: 'Chandigarh Railway Station', time: '≈ 25 min' },
  { place: 'Chandigarh City Centre', time: '≈ 25 min' },
  { place: 'Kasauli & Shimla Highway', time: 'Direct access' },
];

/* ─────────────────────────── Gallery ─────────────────────────── */

export const GALLERY = [
  { src: u('1590381105924-c72589b9ef3f', 1400), category: 'Interiors', title: 'Lobby Lounge' },
  { src: u('1590490360182-c33d57733427', 1400), category: 'Rooms', title: 'Premium Room' },
  { src: u('1414235077428-338989a2e8c0', 1400), category: 'Dining', title: 'The Dining Room' },
  { src: u('1566665797739-1674de7a421a', 1400), category: 'Rooms', title: 'Elegance Suite' },
  { src: u('1517248135467-4c7edcad34c4', 1400), category: 'Dining', title: 'All-Day Café' },
  { src: u('1618773928121-c32242e63f39', 1400), category: 'Rooms', title: 'Deluxe Room' },
  { src: u('1519167758481-83f550bb49b3', 1400), category: 'Events', title: 'Celebrations' },
  { src: u('1560185007-cde436f6a4d0', 1400), category: 'Interiors', title: 'Suite Sitting Area' },
  { src: u('1611892440504-42a792e24d32', 1400), category: 'Rooms', title: 'Warm Evenings' },
  { src: u('1595576508898-0ad5c879a061', 1400), category: 'Rooms', title: 'Twin Comfort' },
  { src: u('1631049307264-da0ec9d70304', 1400), category: 'Rooms', title: 'Bright Mornings' },
  { src: u('1629140727571-9b5c6f6267b4', 1400), category: 'Rooms', title: 'Quiet Corners' },
];
