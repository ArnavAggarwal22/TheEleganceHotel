import { Link, NavLink, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { BedDouble, CalendarRange, ClipboardList, ExternalLink, Inbox, LogOut, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Crest } from '@/components/Logo';
import AdminLogin from './AdminLogin';
import Bookings from './Bookings';
import Availability from './Availability';
import RoomsAdmin from './RoomsAdmin';
import Messages from './Messages';
import Guests from './Guests';

const NAV = [
  { to: '/admin', label: 'Bookings', icon: ClipboardList, end: true },
  { to: '/admin/availability', label: 'Availability', icon: CalendarRange },
  { to: '/admin/rooms', label: 'Rooms & prices', icon: BedDouble },
  { to: '/admin/messages', label: 'Messages', icon: Inbox },
  { to: '/admin/guests', label: 'Guests', icon: Users },
];

/** Signed-in, two-step-verified team members only. */
const Layout = () => {
  const { user, isAdmin, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-ivory text-sm text-ink/50">Checking your session…</div>;
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace state={{ from: location }} />;

  return (
    <div className="flex min-h-screen flex-col bg-ivory-100 lg:flex-row">
      <aside className="shrink-0 bg-ink text-ivory lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:flex-col">
        <div className="flex items-center gap-3 px-5 py-5">
          <Crest className="h-10 w-10" />
          <div className="leading-tight">
            <p className="font-display text-lg">The Elegance Hotel</p>
            <p className="text-[10px] uppercase tracking-[0.25em] text-gold">Reservations</p>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-visible">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-3 px-4 py-3 text-sm transition ${
                  isActive ? 'bg-gold text-ink font-semibold' : 'text-ivory/70 hover:bg-ivory/5 hover:text-ivory'
                }`
              }
            >
              <Icon size={16} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden space-y-1 border-t border-ivory/10 p-3 text-sm lg:block">
          <p className="truncate px-4 py-2 text-xs text-ivory/40">{user.email}</p>
          <Link to="/" className="flex items-center gap-3 px-4 py-2.5 text-ivory/70 hover:text-ivory">
            <ExternalLink size={15} /> View website
          </Link>
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate('/admin/login', { replace: true });
            }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-red-300 hover:text-red-200"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-5 sm:p-8 lg:p-10">
        <Outlet />
      </main>
    </div>
  );
};

const AdminApp = () => (
  <Routes>
    <Route path="/admin/login" element={<AdminLogin />} />
    <Route path="/admin" element={<Layout />}>
      <Route index element={<Bookings />} />
      <Route path="availability" element={<Availability />} />
      <Route path="rooms" element={<RoomsAdmin />} />
      <Route path="messages" element={<Messages />} />
      <Route path="guests" element={<Guests />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Route>
  </Routes>
);

export default AdminApp;
