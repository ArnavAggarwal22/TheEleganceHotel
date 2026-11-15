import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, KeyRound, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth, type AdminStep, type AuthenticatorSetup } from '@/context/AuthContext';
import { Lockup } from '@/components/Logo';

type Step = 'credentials' | 'code' | 'setup';

/** Team sign-in: email + password, then a code from an authenticator app (set up on first sign-in). */
const AdminLogin = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [setup, setSetup] = useState<AuthenticatorSetup | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resumeChecked = useRef(false);
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/admin';

  const applyStep = async (result: AdminStep) => {
    if (result.status === 'signed-in') {
      toast.success('Signed in');
      navigate(from, { replace: true });
      return;
    }
    if (result.status === 'error') return setError(result.message);
    setError(null);
    setCode('');
    if (result.status === 'needs-code') return setStep('code');
    setStep('setup');
    try {
      setSetup(await auth.startAuthenticatorSetup());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start the authenticator setup.');
    }
  };

  const run = async (action: () => Promise<AdminStep>) => {
    setBusy(true);
    setError(null);
    try {
      await applyStep(await action());
    } finally {
      setBusy(false);
    }
  };

  // Pick up a sign-in that already happened (e.g. the page was reloaded during the code step)
  useEffect(() => {
    if (auth.mode !== 'supabase' || auth.loading || resumeChecked.current) return;
    resumeChecked.current = true;
    if (auth.user && !auth.isAdmin) void run(auth.resumeAdminSignIn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.mode, auth.loading]);

  if (auth.isAdmin && step === 'credentials') return <Navigate to={from} replace />;

  const switchAccount = async () => {
    await auth.logout();
    setStep('credentials');
    setSetup(null);
    setCode('');
    setPassword('');
    setError(null);
  };

  const codeField = (
    <div>
      <label className="field-label" htmlFor="ad-code">6-digit code</label>
      <input
        id="ad-code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        className="field text-center font-semibold tracking-[0.5em]"
        autoFocus
      />
    </div>
  );

  return (
    <div className="grain relative flex min-h-screen items-center justify-center overflow-hidden bg-ink p-4">
      <div className="pointer-events-none absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-gold/10 blur-[120px]" />
      <div className="relative z-[2] w-full max-w-md bg-ivory p-8 sm:p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <Lockup className="w-44" />
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-luxe text-gold-dark">Team sign-in</p>
        </div>

        {auth.mode === 'unconfigured' && (
          <p className="mb-6 flex gap-2 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle size={16} className="mt-0.5 shrink-0" /> The database isn't connected on this site yet.
          </p>
        )}

        {step === 'credentials' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(() => auth.signInAdmin(email, password));
            }}
            className="space-y-5"
          >
            <div>
              <label className="field-label" htmlFor="ad-email">Email</label>
              <input id="ad-email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
            </div>
            <div>
              <label className="field-label" htmlFor="ad-pass">Password</label>
              <input id="ad-pass" type="password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
            </div>
            {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
            <button type="submit" disabled={busy || auth.mode !== 'supabase'} className="btn-dark w-full disabled:opacity-60">
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
            {auth.mode === 'dev-local' && (
              <button type="button" onClick={auth.devSignIn} className="w-full text-xs text-ink/50 underline">
                Continue as local admin (dev only)
              </button>
            )}
          </form>
        )}

        {step === 'code' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(() => auth.verifyCode(code));
            }}
            className="space-y-5"
          >
            <p className="flex gap-3 text-sm text-ink/60">
              <KeyRound size={18} className="shrink-0 text-gold-dark" /> Open your authenticator app and enter the code for The Elegance Hotel.
            </p>
            {codeField}
            {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
            <button type="submit" disabled={busy || code.length !== 6} className="btn-dark w-full disabled:opacity-60">
              {busy ? 'Checking…' : 'Verify'}
            </button>
          </form>
        )}

        {step === 'setup' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (setup) void run(() => auth.finishAuthenticatorSetup(setup.factorId, code));
            }}
            className="space-y-5"
          >
            <p className="flex gap-3 text-sm text-ink/60">
              <Smartphone size={18} className="shrink-0 text-gold-dark" />
              First sign-in: scan this QR code with an authenticator app (Google Authenticator, Microsoft Authenticator…),
              then enter the 6-digit code it shows.
            </p>
            {setup ? (
              <div className="flex flex-col items-center gap-3 bg-white p-4">
                <img src={setup.qrCode} alt="QR code for your authenticator app" className="h-44 w-44" />
                <p className="text-center text-[11px] text-ink/50">
                  Can't scan? Enter this key: <span data-testid="totp-secret" className="break-all font-mono text-ink">{setup.secret}</span>
                </p>
              </div>
            ) : (
              <p className="text-sm text-ink/50">Preparing…</p>
            )}
            {codeField}
            {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
            <button type="submit" disabled={busy || !setup || code.length !== 6} className="btn-dark w-full disabled:opacity-60">
              {busy ? 'Checking…' : 'Finish setup'}
            </button>
          </form>
        )}

        <div className="mt-8 flex items-center justify-between text-xs text-ink/50">
          <Link to="/" className="inline-flex items-center gap-1 hover:text-ink">
            <ArrowLeft size={12} /> Back to the website
          </Link>
          {step !== 'credentials' && (
            <button type="button" onClick={() => void switchAccount()} className="underline hover:text-ink">
              Use another account
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
