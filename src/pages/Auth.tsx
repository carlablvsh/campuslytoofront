import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { ArrowRight } from 'lucide-react';

interface AuthProps {
  onBackToLanding?: () => void;
  initialIsLogin?: boolean;
}

const PetalMarkSVG: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2C8.5 7.5 4 10.5 4 14.5C4 18.5 7.5 22 12 22C16.5 22 20 18.5 20 14.5C20 10.5 15.5 7.5 12 2Z" fill="url(#auth-petal-grad)" />
    <defs>
      <linearGradient id="auth-petal-grad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f472b6" />
        <stop offset="1" stopColor="#e11d48" />
      </linearGradient>
    </defs>
  </svg>
);

export const Auth: React.FC<AuthProps> = ({ onBackToLanding, initialIsLogin = true }) => {
  const { login, register, verifyOTP, resendOTP, error, clearError } = useAuth();
  const [isLogin, setIsLogin] = useState<boolean>(initialIsLogin);
  const [isVerifyOtp, setIsVerifyOtp] = useState<boolean>(false);
  const [isForgotPassword, setIsForgotPassword] = useState<boolean>(false);
  const [isResetPassword, setIsResetPassword] = useState<boolean>(false);

  const [otpCode, setOtpCode] = useState<string>('');
  const [resetToken, setResetToken] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [resendLoading, setResendLoading] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Resend cooldown timer effect
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleToggle = (loginState: boolean) => {
    setIsLogin(loginState);
    setIsVerifyOtp(false);
    setIsForgotPassword(false);
    setIsResetPassword(false);
    setLocalError(null);
    setSuccessMessage(null);
    clearError();
    setUsername('');
    setEmail('');
    setPassword('');
    setOtpCode('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !username)) return;

    setLoading(true);
    setLocalError(null);
    setSuccessMessage(null);
    
    if (isLogin) {
      const res = await login(email, password);
      if (!res.success) {
        if (res.requiresVerification) {
          setIsVerifyOtp(true);
          setResendCooldown(60);
          setSuccessMessage(res.message || 'Please enter the 6-digit verification code sent to your email.');
        } else {
          setLocalError(res.message || 'Invalid login details.');
        }
      }
    } else {
      const res = await register(username, email, password);
      if (res.success) {
        if (res.requiresVerification) {
          setIsVerifyOtp(true);
          setResendCooldown(60);
          setSuccessMessage(res.message || 'Verification code sent to your email!');
        }
      } else {
        setLocalError(res.message || 'Registration failed.');
      }
    }
    
    setLoading(false);
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otpCode || otpCode.length !== 6) return;

    setLoading(true);
    setLocalError(null);
    setSuccessMessage(null);

    const res = await verifyOTP(email, otpCode);
    if (!res.success) {
      setLocalError(res.message || 'Failed to verify 6-digit code.');
    }
    setLoading(false);
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0 || !email) return;
    setResendLoading(true);
    setLocalError(null);
    const res = await resendOTP(email);
    if (res.success) {
      setResendCooldown(60);
      setSuccessMessage(res.message || 'New verification code sent to your email!');
    } else {
      setLocalError(res.message || 'Failed to resend code.');
    }
    setResendLoading(false);
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setLocalError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) {
        setLocalError(data.error || 'Failed to process request.');
      } else {
        setSuccessMessage('Password reset code sent to your email!');
        setIsForgotPassword(false);
        setIsResetPassword(true);
      }
    } catch (err) {
      setLocalError('Cannot connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !resetToken || !newPassword) return;

    setLoading(true);
    setLocalError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: resetToken, newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        setLocalError(data.error || 'Failed to reset password.');
      } else {
        setSuccessMessage('Password updated successfully! You can now log in.');
        setIsResetPassword(false);
        setIsForgotPassword(false);
        setIsLogin(true);
        setPassword('');
        setResetToken('');
        setNewPassword('');
      }
    } catch (err) {
      setLocalError('Cannot connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--cream)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Atmosphere */}
      <div className="rule-grid" style={{ position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '450px', height: '450px', borderRadius: '50%', background: 'rgba(244, 114, 182, 0.18)', filter: 'blur(100px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-100px', left: '-100px', width: '450px', height: '450px', borderRadius: '50%', background: 'rgba(233, 213, 255, 0.25)', filter: 'blur(110px)', pointerEvents: 'none' }} />

      <div style={{
        maxWidth: '1020px',
        width: '100%',
        background: 'rgba(255, 253, 249, 0.88)',
        border: '1px solid var(--line)',
        borderRadius: '28px',
        boxShadow: 'var(--shadow-lift)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        display: 'grid',
        gridTemplateColumns: '1.1fr 1fr',
        overflow: 'hidden',
        position: 'relative'
      }}>
        
        {/* Left Editorial Promo Panel */}
        <div style={{
          background: 'var(--plum)',
          color: 'var(--cream)',
          padding: '3.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }} className="hidden md:flex">
          {/* Subtle grid in promo */}
          <div className="rule-grid" style={{ position: 'absolute', inset: 0, opacity: 0.15, pointerEvents: 'none' }} />

          <div>
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2.5rem', cursor: onBackToLanding ? 'pointer' : 'default' }}
              onClick={onBackToLanding}
            >
              <PetalMarkSVG size={22} />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem', color: 'var(--cream)' }}>
                Campusly
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'rgba(250, 246, 240, 0.5)', letterSpacing: '0.05em' }}>
                2095
              </span>
            </div>

            <span className="sci-fi-tag" style={{ color: 'var(--petal)', background: 'rgba(244, 114, 182, 0.15)', padding: '0.25rem 0.65rem', borderRadius: '9999px' }}>
              [ STUDENT ACCESS ]
            </span>

            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.4rem',
              fontWeight: 400,
              lineHeight: 1.15,
              margin: '1rem 0 1.2rem 0',
              color: 'var(--cream)'
            }}>
              Your campus, <br />
              <span style={{ fontStyle: 'italic', color: 'var(--petal)' }}>arranged</span> in calm.
            </h2>

            <p style={{ fontSize: '0.92rem', color: 'rgba(250, 246, 240, 0.75)', lineHeight: 1.6, maxWidth: '380px' }}>
              Sign in to access your timetable, track attendance, organize assignments, and settle into your daily focus room.
            </p>
          </div>

          <div style={{ paddingTop: '2rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'rgba(250, 246, 240, 0.45)' }}>
            <span>Spring Term 01</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>SECURE PROTOCOL</span>
          </div>
        </div>

        {/* Right Form Panel */}
        <div style={{ padding: '3.5rem 3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          
          {onBackToLanding && (
            <button 
              onClick={onBackToLanding}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--ink-soft)',
                fontSize: '0.78rem',
                fontWeight: 650,
                cursor: 'pointer',
                marginBottom: '1.5rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: 0,
                alignSelf: 'flex-start'
              }}
            >
              ← Back to campus
            </button>
          )}

          {!isVerifyOtp && !isForgotPassword && !isResetPassword ? (
            <div style={{ display: 'flex', background: 'var(--cream)', padding: '0.3rem', borderRadius: '9999px', border: '1px solid var(--line)', marginBottom: '1.8rem' }}>
              <button 
                type="button"
                onClick={() => handleToggle(true)}
                style={{
                  flex: 1,
                  padding: '0.55rem',
                  border: 'none',
                  borderRadius: '9999px',
                  background: isLogin ? 'var(--pearl)' : 'transparent',
                  color: isLogin ? 'var(--ink)' : 'var(--ink-soft)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: isLogin ? 'var(--shadow-soft)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                Sign In
              </button>
              <button 
                type="button"
                onClick={() => handleToggle(false)}
                style={{
                  flex: 1,
                  padding: '0.55rem',
                  border: 'none',
                  borderRadius: '9999px',
                  background: !isLogin ? 'var(--pearl)' : 'transparent',
                  color: !isLogin ? 'var(--ink)' : 'var(--ink-soft)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: !isLogin ? 'var(--shadow-soft)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                Create Account
              </button>
            </div>
          ) : (
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '1.2rem', textAlign: 'center' }}>
              {isVerifyOtp ? 'Email Verification' : isForgotPassword ? 'Reset Password' : 'Set New Password'}
            </h3>
          )}

          {(error || localError) && (
            <div style={{ padding: '0.75rem 1rem', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '12px', fontSize: '0.82rem', marginBottom: '1.2rem' }}>
              {localError || error}
            </div>
          )}

          {successMessage && (
            <div style={{ padding: '0.75rem 1rem', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', borderRadius: '12px', fontSize: '0.82rem', marginBottom: '1.2rem' }}>
              {successMessage}
            </div>
          )}

          {isVerifyOtp ? (
            <form onSubmit={handleVerifyOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '0.4rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', margin: 0, lineHeight: 1.5 }}>
                  Enter the 6-digit code sent to <strong style={{ color: 'var(--ink)' }}>{email}</strong>
                </p>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    textAlign: 'center',
                    fontSize: '1.4rem',
                    letterSpacing: '0.4em',
                    fontFamily: 'var(--font-mono)',
                    border: '1.5px solid var(--line)',
                    borderRadius: '14px',
                    background: '#ffffff',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={loading || otpCode.length !== 6}
                style={{
                  padding: '0.8rem',
                  background: 'var(--plum)',
                  color: 'var(--cream)',
                  border: 'none',
                  borderRadius: '9999px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  opacity: (loading || otpCode.length !== 6) ? 0.6 : 1
                }}
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
                {resendCooldown > 0 ? (
                  <span>Resend code in {resendCooldown}s</span>
                ) : (
                  <button 
                    type="button" 
                    onClick={handleResendOTP} 
                    disabled={resendLoading}
                    style={{ background: 'none', border: 'none', color: 'var(--petal)', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Resend Code
                  </button>
                )}
              </div>
            </form>
          ) : isForgotPassword ? (
            <form onSubmit={handleForgotPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', margin: '0 0 0.5rem 0' }}>
                Enter your university email to receive a password reset code.
              </p>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 650, color: 'var(--ink-soft)', display: 'block', marginBottom: '0.4rem' }}>Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="student@university.edu"
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--line)', borderRadius: '12px', background: '#ffffff', outline: 'none', fontSize: '0.88rem' }}
                  required 
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                style={{ padding: '0.8rem', background: 'var(--plum)', color: 'var(--cream)', border: 'none', borderRadius: '9999px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', marginTop: '0.5rem' }}
              >
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
              <button 
                type="button" 
                onClick={() => setIsForgotPassword(false)}
                style={{ background: 'none', border: 'none', color: 'var(--ink-soft)', fontSize: '0.78rem', cursor: 'pointer', textAlign: 'center' }}
              >
                Back to Sign In
              </button>
            </form>
          ) : isResetPassword ? (
            <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 650, color: 'var(--ink-soft)', display: 'block', marginBottom: '0.4rem' }}>Reset Token</label>
                <input 
                  type="text" 
                  value={resetToken} 
                  onChange={(e) => setResetToken(e.target.value)} 
                  placeholder="6-digit reset code"
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--line)', borderRadius: '12px', background: '#ffffff', outline: 'none', fontSize: '0.88rem' }}
                  required 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 650, color: 'var(--ink-soft)', display: 'block', marginBottom: '0.4rem' }}>New Password</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--line)', borderRadius: '12px', background: '#ffffff', outline: 'none', fontSize: '0.88rem' }}
                  required 
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                style={{ padding: '0.8rem', background: 'var(--plum)', color: 'var(--cream)', border: 'none', borderRadius: '9999px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', marginTop: '0.5rem' }}
              >
                {loading ? 'Saving...' : 'Set Password'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {!isLogin && (
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 650, color: 'var(--ink-soft)', display: 'block', marginBottom: '0.4rem' }}>Display Name</label>
                  <input 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    placeholder="e.g. Diya K."
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--line)', borderRadius: '12px', background: '#ffffff', outline: 'none', fontSize: '0.88rem' }}
                    required 
                  />
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 650, color: 'var(--ink-soft)', display: 'block', marginBottom: '0.4rem' }}>Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="student@university.edu"
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--line)', borderRadius: '12px', background: '#ffffff', outline: 'none', fontSize: '0.88rem' }}
                  required 
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 650, color: 'var(--ink-soft)' }}>Password</label>
                  {isLogin && (
                    <span 
                      onClick={() => setIsForgotPassword(true)}
                      style={{ fontSize: '0.72rem', color: 'var(--petal)', fontWeight: 650, cursor: 'pointer' }}
                    >
                      Forgot password?
                    </span>
                  )}
                </div>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--line)', borderRadius: '12px', background: '#ffffff', outline: 'none', fontSize: '0.88rem' }}
                  required 
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem',
                  background: 'var(--plum)',
                  color: 'var(--cream)',
                  border: 'none',
                  borderRadius: '9999px',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  marginTop: '0.6rem',
                  boxShadow: 'var(--shadow-soft)',
                  transition: 'all 0.2s ease',
                  opacity: loading ? 0.7 : 1
                }}
              >
                <span>{loading ? 'Processing...' : (isLogin ? 'Sign In to Campusly' : 'Create Account')}</span>
                <ArrowRight size={15} style={{ color: 'var(--petal)' }} />
              </button>
            </form>
          )}

        </div>

      </div>

    </div>
  );
};
