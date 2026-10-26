import React, { useState } from 'react';
import { LogIn, UserPlus, X, KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';
import { login, register, sendResetOtp, verifyResetOtp } from './api';
import { TallyConnectLogo } from './TallyConnectLogo';
import loginBrand from './assets/login-brand.png';
import tallyWallpaper from './assets/tally-wallpaper-v2.jpg';
import './index.css';

/**
 * Login / Register screen — same fields and flow as the original login,
 * with the supplied artwork on the left and the form panel on the right.
 *
 * Talks to POST /auth/login (loginType USER|ADMIN) and POST /auth/register.
 */
export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loginType, setLoginType] = useState('USER');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [showReset, setShowReset] = useState(false);
  const [resetStep, setResetStep] = useState('email');
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [resetBusy, setResetBusy] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetNotice, setResetNotice] = useState('');

  const openReset = () => {
    setResetEmail(email || username || '');
    setResetStep('email');
    setResetOtp('');
    setResetPassword('');
    setResetConfirm('');
    setResetError('');
    setResetNotice('');
    setShowReset(true);
  };

  const closeReset = () => {
    if (resetBusy) return;
    setShowReset(false);
    setResetError('');
    setResetNotice('');
  };

  const requestOtp = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetNotice('');
    if (!resetEmail.trim()) {
      setResetError('Enter your email address.');
      return;
    }
    setResetBusy(true);
    try {
      await sendResetOtp(resetEmail.trim());
      setResetStep('otp');
      setResetNotice('A 6-digit verification code has been sent to your email.');
    } catch (err) {
      setResetError(err.message || 'Could not send the verification code.');
    } finally {
      setResetBusy(false);
    }
  };

  const resetPasswordWithOtp = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetNotice('');
    if (!/^\d{6}$/.test(resetOtp.trim())) {
      setResetError('Enter the 6-digit code from your email.');
      return;
    }
    if (resetPassword.length < 6) {
      setResetError('Password must be at least 6 characters.');
      return;
    }
    if (resetPassword !== resetConfirm) {
      setResetError('Passwords do not match.');
      return;
    }
    setResetBusy(true);
    try {
      await verifyResetOtp({
        email: resetEmail.trim(),
        otp: resetOtp.trim(),
        newPassword: resetPassword,
      });
      setNotice('Password reset successfully. Sign in with your new password.');
      setShowReset(false);
      setResetStep('email');
      setResetOtp('');
      setResetPassword('');
      setResetConfirm('');
    } catch (err) {
      setResetError(err.message || 'Could not reset your password.');
    } finally {
      setResetBusy(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    try {
      if (mode === 'login') {
        let data;
        try {
          data = await login({ username, password, loginType });
        } catch (err) {
          const isRoleMismatch = /invalid user login type/i.test(err.message) || /not an admin account/i.test(err.message);
          if (isRoleMismatch) {
            const fallbackType = loginType === 'USER' ? 'ADMIN' : 'USER';
            try {
              data = await login({ username, password, loginType: fallbackType });
              setLoginType(fallbackType);
            } catch {
              throw err;
            }
          } else {
            throw err;
          }
        }
        onLogin(data.user);
      } else {
        await register({ username, email, password, isAdmin: true });
        setNotice('Account created. You can sign in now.');
        setMode('login');
        setUsername(email);
        setPassword('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const shared = {
    spellCheck: false,
    autoCapitalize: 'off',
    autoCorrect: 'off',
  };

  return (
    <div
      className="fade-in auth-shell"
      style={{
        backgroundImage: `radial-gradient(ellipse 80% 80% at 50% 50%, rgba(4, 9, 20, 0.05) 0%, rgba(4, 9, 20, 0.25) 100%), url(${tallyWallpaper})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <main className="auth-form-panel auth-form-panel-centered">
        <div className="glass-panel login-card">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '22px' }}>
            <TallyConnectLogo height={52} />
          </div>

          <form onSubmit={submit} noValidate={false}>
            <div className="ios-form-group" style={{ marginBottom: '16px', paddingTop: '8px', paddingBottom: '8px' }}>
              {mode === 'login' ? (
                <>
                  <div className="auth-field" style={{ marginBottom: '24px' }}>
                    <label>Login as</label>
                    <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.04)', padding: '4px', borderRadius: '12px' }}>
                      <button
                        type="button"
                        onClick={() => setLoginType('USER')}
                        style={{ flex: 1, minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', borderRadius: '8px', border: 'none', background: loginType === 'USER' ? '#fff' : 'transparent', color: loginType === 'USER' ? 'var(--primary-color)' : 'rgba(0,0,0,0.6)', fontWeight: 600, fontSize: '14px', cursor: 'pointer', boxShadow: loginType === 'USER' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s', touchAction: 'manipulation' }}
                      >
                        User
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoginType('ADMIN')}
                        style={{ flex: 1, minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', borderRadius: '8px', border: 'none', background: loginType === 'ADMIN' ? '#fff' : 'transparent', color: loginType === 'ADMIN' ? 'var(--primary-color)' : 'rgba(0,0,0,0.6)', fontWeight: 600, fontSize: '14px', cursor: 'pointer', boxShadow: loginType === 'ADMIN' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s', touchAction: 'manipulation' }}
                      >
                        Admin
                      </button>
                    </div>
                  </div>
                  <div className="auth-field">
                    <label htmlFor="tc-username">Email</label>
                    <input
                      id="tc-username"
                      name="username"
                      type="text"
                      autoFocus
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="you@company.com"
                      autoComplete="username"
                      required
                      {...shared}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="auth-field">
                    <label htmlFor="tc-reg-name">Name</label>
                    <input
                      id="tc-reg-name"
                      name="name"
                      type="text"
                      autoFocus
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Your name"
                      autoComplete="name"
                      required
                      {...shared}
                    />
                  </div>
                  <div className="auth-field">
                    <label htmlFor="tc-email">Email</label>
                    <input
                      id="tc-email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      autoComplete="email"
                      required
                      {...shared}
                    />
                  </div>
                </>
              )}
              <div className="auth-field">
                <label htmlFor="tc-password">Password</label>
                <input
                  id="tc-password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  {...shared}
                />
              </div>

              {mode === 'login' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-6px', marginBottom: '14px' }}>
                  <button type="button" className="auth-link" onClick={openReset}>
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            {error && <p className="auth-error">{error}</p>}
            {notice && <p className="auth-notice">{notice}</p>}

            <button className="btn-primary" type="submit" disabled={busy} style={{ width: '100%', minHeight: '48px', fontSize: '15px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '14px', touchAction: 'manipulation' }}>
              {busy ? 'Please wait…' : mode === 'login' ? (<><LogIn size={18} /> Sign In</>) : (<><UserPlus size={18} /> Create Account</>)}
            </button>

            <p style={{ textAlign: 'center', fontSize: '14px', color: 'rgba(0,0,0,0.6)', margin: 0 }}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setNotice(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 700, fontSize: '14px', cursor: 'pointer', padding: 0 }}
              >
                {mode === 'login' ? 'Create one' : 'Sign in'}
              </button>
            </p>
          </form>
        </div>
      </main>

      {showReset && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Reset password"
          onClick={(e) => { if (e.target === e.currentTarget) closeReset(); }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '420px',
              padding: '28px',
              borderRadius: '22px',
              background: 'rgba(255, 255, 255, 0.96)',
              boxShadow: '0 30px 80px rgba(15, 23, 42, 0.28)',
              position: 'relative',
            }}
          >
            <button
              type="button"
              onClick={closeReset}
              disabled={resetBusy}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                border: 'none',
                background: 'rgba(15, 23, 42, 0.06)',
                color: '#475569',
                cursor: resetBusy ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '13px',
                  background: 'rgba(6, 99, 249, 0.1)',
                  color: '#0663f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <KeyRound size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 800, color: '#0f172a' }}>
                  {resetStep === 'email' ? 'Forgot password?' : 'Enter verification code'}
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#64748b' }}>
                  {resetStep === 'email'
                    ? 'We will email you a one-time code to reset it.'
                    : `Code sent to ${resetEmail}`}
                </p>
              </div>
            </div>

            {resetStep === 'email' ? (
              <form onSubmit={requestOtp}>
                <label htmlFor="reset-email" style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '7px' }}>
                  Email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  autoFocus
                  required
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 14px',
                    borderRadius: '11px',
                    border: '1px solid #d7e6f3',
                    outline: 'none',
                    fontSize: '14px',
                    color: '#0f172a',
                    background: '#fff',
                    marginBottom: '14px',
                  }}
                />
                {resetError && <p style={{ margin: '0 0 12px', color: '#dc2626', fontSize: '13px', fontWeight: 600 }}>{resetError}</p>}
                {resetNotice && <p style={{ margin: '0 0 12px', color: '#059669', fontSize: '13px', fontWeight: 600 }}>{resetNotice}</p>}
                <button className="btn-primary" type="submit" disabled={resetBusy} style={{ width: '100%' }}>
                  {resetBusy ? 'Sending code...' : 'Send verification code'}
                </button>
                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  <button type="button" className="auth-link" onClick={closeReset} disabled={resetBusy}>
                    Back to sign in
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={resetPasswordWithOtp}>
                <label htmlFor="reset-otp" style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '7px' }}>
                  Verification code
                </label>
                <input
                  id="reset-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit code"
                  autoComplete="one-time-code"
                  autoFocus
                  required
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 14px',
                    borderRadius: '11px',
                    border: '1px solid #d7e6f3',
                    outline: 'none',
                    fontSize: '20px',
                    fontWeight: 700,
                    letterSpacing: '6px',
                    color: '#0f172a',
                    background: '#fff',
                    marginBottom: '14px',
                  }}
                />
                <label htmlFor="reset-password" style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '7px' }}>
                  New password
                </label>
                <input
                  id="reset-password"
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  required
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 14px',
                    borderRadius: '11px',
                    border: '1px solid #d7e6f3',
                    outline: 'none',
                    fontSize: '14px',
                    color: '#0f172a',
                    background: '#fff',
                    marginBottom: '12px',
                  }}
                />
                <label htmlFor="reset-confirm" style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '7px' }}>
                  Confirm password
                </label>
                <input
                  id="reset-confirm"
                  type="password"
                  value={resetConfirm}
                  onChange={(e) => setResetConfirm(e.target.value)}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                  required
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 14px',
                    borderRadius: '11px',
                    border: '1px solid #d7e6f3',
                    outline: 'none',
                    fontSize: '14px',
                    color: '#0f172a',
                    background: '#fff',
                    marginBottom: '14px',
                  }}
                />
                {resetError && <p style={{ margin: '0 0 12px', color: '#dc2626', fontSize: '13px', fontWeight: 600 }}>{resetError}</p>}
                {resetNotice && <p style={{ margin: '0 0 12px', color: '#059669', fontSize: '13px', fontWeight: 600 }}>{resetNotice}</p>}
                <button className="btn-primary" type="submit" disabled={resetBusy} style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>
                  {resetBusy ? 'Resetting...' : (<><CheckCircle2 size={17} /> Reset password</>)}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginTop: '12px' }}>
                  <button
                    type="button"
                    className="auth-link"
                    onClick={() => { setResetStep('email'); setResetError(''); setResetNotice(''); }}
                    disabled={resetBusy}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <ArrowLeft size={13} /> Change email
                  </button>
                  <button type="button" className="auth-link" onClick={requestOtp} disabled={resetBusy}>
                    Resend code
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* Powered by Averlon in bottom-right corner */}
      <div className="auth-powered-by">
        <span>Powered by</span>
        <span className="auth-powered-by-brand">Averlon</span>
      </div>
    </div>
  );
}
