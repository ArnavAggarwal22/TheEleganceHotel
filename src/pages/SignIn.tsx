import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Mail } from 'lucide-react';
import PlainHero from '@/components/PlainHero';
import PhoneInput from '@/components/PhoneInput';
import { useAuth, MIN_PASSWORD_LENGTH, type CustomerResult } from '@/context/AuthContext';
import { isValidPhone, PHONE_ERROR, PHONE_REQUIRED } from '@/lib/phone';
import { hasBackend } from '@/lib/supabase';

type Mode = 'signin' | 'signup' | 'confirm' | 'forgot' | 'reset';

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

/** Only same-site paths are allowed as the place to return to after signing in. */
const safeNext = (value: string | null) => (value && value.startsWith('/') && !value.startsWith('//') ? value : '/account');

const TITLES: Record<Mode, [string, string]> = {
  signin: ['Welcome back', 'Sign in to see your reservations and book faster.'],
  signup: ['Create your account', 'Save your details once and follow every booking request in one place.'],
  confirm: ['Check your email', 'Enter the 6-digit code we emailed you to confirm your account.'],
  forgot: ['Reset your password', "Enter your account's email and we'll send you a code."],
  reset: ['Choose a new password', 'Enter the code from the email and your new password.'],
};

const SignIn = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));

  const [mode, setMode] = useState<Mode>(params.get('mode') === 'signup' ? 'signup' : 'signin');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!auth.loading && auth.user && mode !== 'reset') return <Navigate to={next} replace />;

  const go = (to: Mode) => {
    setMode(to);
    setError(null);
    setNotice(null);
    setCode('');
  };

  const run = async (action: () => Promise<CustomerResult>, onOk: (r: CustomerResult & { ok: true }) => void) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    const result = await action();
    setBusy(false);
    if (result.ok) onOk(result);
    else setError(result.message);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signin') {
      void run(() => auth.signInCustomer(email, password), () => navigate(next, { replace: true }));
    } else if (mode === 'signup') {
      if (fullName.trim().length < 2) return setError('Please enter your full name.');
      if (!phone) return setError(PHONE_REQUIRED);
      if (!isValidPhone(phone)) return setError(PHONE_ERROR);
      if (password.length < MIN_PASSWORD_LENGTH) return setError(`Your password needs at least ${MIN_PASSWORD_LENGTH} characters.`);
      void run(
        () => auth.signUpCustomer({ fullName, phone, email, password }),
        (r) => {
          if (r.next === 'confirm-email') {
            setMode('confirm');
            setNotice(`We sent a 6-digit code to ${email.trim()}. Enter it below to finish.`);
          } else navigate(next, { replace: true });
        }
      );
    } else if (mode === 'confirm') {
      void run(() => auth.confirmEmail(email, code), () => navigate(next, { replace: true }));
    } else if (mode === 'forgot') {
      void run(
        () => auth.sendPasswordReset(email),
        () => {
          setMode('reset');
          setNotice(`If ${email.trim()} has an account, a 6-digit code is on its way.`);
        }
      );
    } else {
      if (password.length < MIN_PASSWORD_LENGTH) return setError(`Your new password needs at least ${MIN_PASSWORD_LENGTH} characters.`);
      void run(() => auth.resetPassword(email, code, password), () => navigate(next, { replace: true }));
    }
  };

  const [title, subtitle] = TITLES[mode];

  return (
    <>
      <PlainHero eyebrow="Guest account" title={title} intro={subtitle} />
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="mx-auto max-w-lg border border-ink/10 bg-white p-7 sm:p-10">
            {!hasBackend && (
              <p className="mb-6 bg-ivory-200 p-4 text-sm text-ink/60">Guest accounts are not switched on yet. You can still book as a guest.</p>
            )}
            {(mode === 'confirm' || mode === 'forgot' || mode === 'reset') && (
              <button type="button" onClick={() => go(mode === 'confirm' ? 'signup' : 'signin')} className="mb-6 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/50 hover:text-ink">
                <ArrowLeft size={13} /> Back
              </button>
            )}

            {(mode === 'signin' || mode === 'signup') && (
              <>
                <div className="grid grid-cols-2 border border-ink/10 text-[11px] font-semibold uppercase tracking-[0.2em]" role="tablist">
                  {(['signin', 'signup'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      role="tab"
                      aria-selected={mode === tab}
                      onClick={() => go(tab)}
                      className={`py-3.5 transition ${mode === tab ? 'bg-ink text-ivory' : 'text-ink/50 hover:text-ink'}`}
                    >
                      {tab === 'signin' ? 'Sign in' : 'Create account'}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void run(() => auth.signInWithGoogle(next), () => undefined)}
                  className="mt-6 flex w-full items-center justify-center gap-3 border border-ink/15 bg-white py-3.5 text-sm font-semibold transition hover:border-ink disabled:opacity-50"
                >
                  <GoogleLogo /> Continue with Google
                </button>
                <p className="my-6 flex items-center gap-4 text-[10px] uppercase tracking-[0.25em] text-ink/35">
                  <span className="h-px flex-1 bg-ink/10" /> or with email <span className="h-px flex-1 bg-ink/10" />
                </p>
              </>
            )}

            {notice && (
              <p className="mb-6 flex gap-2 border border-gold/30 bg-ivory-100 p-4 text-sm text-ink/70">
                <Mail size={16} className="mt-0.5 shrink-0 text-gold-dark" /> {notice}
              </p>
            )}

            <form onSubmit={submit} noValidate className="space-y-5">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="field-label" htmlFor="s-name">Full name</label>
                    <input id="s-name" className="field" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="s-phone">Phone number</label>
                    <PhoneInput id="s-phone" value={phone} onChange={setPhone} required />
                  </div>
                </>
              )}
              <div>
                <label className="field-label" htmlFor="s-email">Email</label>
                <input
                  id="s-email"
                  type="email"
                  className="field read-only:bg-ivory-100 read-only:text-ink/50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  readOnly={mode === 'confirm' || mode === 'reset'}
                />
              </div>
              {(mode === 'confirm' || mode === 'reset') && (
                <div>
                  <label className="field-label" htmlFor="s-code">6-digit code</label>
                  <input
                    id="s-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className="field text-center font-semibold tracking-[0.5em]"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  />
                </div>
              )}
              {(mode === 'signin' || mode === 'signup' || mode === 'reset') && (
                <div>
                  <label className="field-label" htmlFor="s-pass">{mode === 'reset' ? 'New password' : 'Password'}</label>
                  <div className="relative">
                    <input
                      id="s-pass"
                      type={showPassword ? 'text' : 'password'}
                      className="field pr-12"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {mode !== 'signin' && <p className="mt-2 text-xs text-ink/40">At least {MIN_PASSWORD_LENGTH} characters.</p>}
                </div>
              )}

              {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}

              <button type="submit" disabled={busy} className="btn-dark w-full disabled:opacity-60">
                {busy ? 'Please wait…' : { signin: 'Sign in', signup: 'Create account', confirm: 'Confirm email', forgot: 'Send code', reset: 'Save new password' }[mode]}
              </button>
            </form>

            <div className="mt-6 space-y-3 text-center text-sm text-ink/50">
              {mode === 'signin' && (
                <button type="button" onClick={() => go('forgot')} className="link-underline">Forgot your password?</button>
              )}
              {mode === 'confirm' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void run(() => auth.resendConfirmation(email), () => setNotice(`A new code is on its way to ${email.trim()}.`))}
                  className="link-underline"
                >
                  Didn't get it? Send a new code
                </button>
              )}
              {mode === 'signup' && (
                <p className="text-xs leading-relaxed">
                  By creating an account you agree to our <Link to="/terms" className="underline">Terms</Link> and{' '}
                  <Link to="/privacy" className="underline">Privacy Policy</Link>, and to the hotel contacting you about your
                  bookings by phone, WhatsApp and email.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default SignIn;
