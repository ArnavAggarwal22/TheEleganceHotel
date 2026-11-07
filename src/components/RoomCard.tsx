import { Link } from 'react-router-dom';
import { ArrowUpRight, BedDouble, Maximize2, Users } from 'lucide-react';
import Img from './Img';
import Reveal from './Reveal';
import { formatINR, type Room } from '@/data/hotel';

const RoomCard = ({ room, index }: { room: Room; index: number }) => (
  <Reveal delay={index * 0.12} className="group">
    <Link to={`/rooms/${room.id}`} className="block">
      <div className="relative aspect-[4/5] overflow-hidden bg-ink-700">
        <Img src={room.image} alt={room.name} className="h-full w-full object-cover transition-transform duration-[1.6s] ease-out group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
        <span className="absolute left-5 top-5 font-display text-5xl text-ivory/25">0{index + 1}</span>
        <div className="absolute right-5 top-5 flex h-12 w-12 items-center justify-center rounded-full border border-ivory/30 text-ivory opacity-0 backdrop-blur transition duration-500 group-hover:rotate-45 group-hover:opacity-100">
          <ArrowUpRight size={18} />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-6 text-ivory">
          <p className="text-[10px] uppercase tracking-luxe text-gold-light">From {formatINR(room.price)} / night</p>
          <h3 className="mt-2 text-[2rem] leading-none">{room.name}</h3>
          <div className="mt-4 grid grid-cols-3 gap-2 overflow-hidden text-[11px] text-ivory/75 transition-all duration-700 lg:max-h-0 lg:opacity-0 lg:group-hover:max-h-20 lg:group-hover:opacity-100">
            <span className="flex items-center gap-1.5"><Maximize2 size={12} /> {room.size}</span>
            <span className="flex items-center gap-1.5"><BedDouble size={12} /> {room.bed}</span>
            <span className="flex items-center gap-1.5"><Users size={12} /> Up to {room.maxGuests}</span>
          </div>
        </div>
      </div>
    </Link>
    <p className="mt-5 text-sm leading-relaxed text-ink/60">{room.short}</p>
  </Reveal>
);

export default RoomCard;
