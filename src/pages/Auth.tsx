import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { GraduationCap, Lock, Mail, User, ArrowRight, Key, ShieldCheck, RefreshCw } from 'lucide-react';

interface AuthProps {
  onBackToLanding?: () => void;
  initialIsLogin?: boolean;
}

const CuteBowSVG: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 14, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ overflow: 'visible', ...style }}>
    <path d="M12 12 C8 6, 3 8, 5 12 C7 16, 11 13, 12 12 Z" fill="#ffd1dc" stroke="#ff7899" strokeWidth="1.5" />
    <path d="M12 12 C16 6, 21 8, 19 12 C17 16, 13 13, 12 12 Z" fill="#ffd1dc" stroke="#ff7899" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="2.5" fill="#ff7899" stroke="#ff5e84" strokeWidth="1" />
    <path d="M11 13 C9 17, 6 20, 4 21" stroke="#ff7899" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M13 13 C15 17, 18 20, 20 21" stroke="#ff7899" strokeWidth="1.8" strokeLinecap="round" />
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
    } else {
      setSuccessMessage('Email verified successfully!');
    }
    setLoading(false);
  };

  const handleResendOtpClick = async () => {
    if (resendCooldown > 0 || !email) return;

    setResendLoading(true);
    setLocalError(null);
    setSuccessMessage(null);

    const res = await resendOTP(email);
    if (res.success) {
      setSuccessMessage(res.message || 'A new verification code has been sent!');
      setResendCooldown(60);
    } else {
      setLocalError(res.error || 'Failed to resend verification code.');
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
        setLocalError(data.error || 'Failed to request password reset.');
      } else {
        setSuccessMessage(data.message);
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
    if (!resetToken || !newPassword) return;
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
        setSuccessMessage(data.message);
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
    <div className="auth-page fade-in">
      <div className="auth-sidebar">
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', paddingLeft: 0, cursor: onBackToLanding ? 'pointer' : 'default' }}
          onClick={onBackToLanding}
          title={onBackToLanding ? "Back to Homepage" : ""}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--primary-glow)',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            color: 'var(--primary)',
            flexShrink: 0
          }}>
            <GraduationCap size={16} />
          </div>
          <span style={{
            fontWeight: 800,
            fontSize: '1.35rem',
            color: 'var(--primary)',
            fontFamily: 'var(--font-serif)',
            display: 'flex',
            alignItems: 'center',
            letterSpacing: '-0.3px'
          }}>
            Campusly
            <CuteBowSVG size={14} style={{ alignSelf: 'flex-start', marginTop: '-3px', marginLeft: '0.2rem' }} />
          </span>
        </div>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem' }}>
          Your entire campus life, organized.
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', lineHeight: 1.6, maxWidth: '460px' }}>
          Manage your schedule, log attendance, calculate study goals, organize course documents, and query them using our integrated AI study assistant.
        </p>
      </div>

      <div className="auth-panel">
        <div className="auth-card">
          {onBackToLanding && (
            <button 
              onClick={onBackToLanding}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
                padding: 0
              }}
            >
              ← Back to homepage
            </button>
          )}
          {!isVerifyOtp && !isForgotPassword && !isResetPassword ? (
            <div className="auth-tabs">
              <div 
                className={`auth-tab ${isLogin ? 'active' : ''}`}
                onClick={() => handleToggle(true)}
              >
                Sign In
              </div>
              <div 
                className={`auth-tab ${!isLogin ? 'active' : ''}`}
                onClick={() => handleToggle(false)}
              >
                Create Account
              </div>
            </div>
          ) : (
            <h3 style={{ 
              fontFamily: 'var(--font-serif)', 
              fontSize: '1.25rem', 
              fontWeight: 800, 
              color: 'var(--text-primary)',
              marginBottom: '1.2rem',
              textAlign: 'center'
            }}>
              {isVerifyOtp 
                ? 'Email Verification' 
                : isForgotPassword 
                  ? 'Reset Password Request' 
                  : 'Set Your New Password'}
            </h3>
          )}

          {(error || localError) && (
            <div className="alert-banner danger" style={{ marginBottom: '1rem' }}>
              <span>{localError || error}</span>
            </div>
          )}

          {successMessage && (
            <div className="alert-banner success" style={{ marginBottom: '1rem' }}>
              <span>{successMessage}</span>
            </div>
          )}

          {isVerifyOtp ? (
            <form onSubmit={handleVerifyOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '0.2rem' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'var(--primary-glow)',
                  color: 'var(--primary)',
                  marginBottom: '0.5rem'
                }}>
                  <ShieldCheck size={24} />
                </div>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  We sent a 6-digit verification code to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="otpCode" style={{ textAlign: 'center', display: 'block' }}>6-Digit Verification Code</label>
                <input
                  id="otpCode"
                  type="text"
                  maxLength={6}
                  className="form-input"
                  placeholder="123456"
                  style={{
                    textAlign: 'center',
                    letterSpacing: '8px',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    padding: '0.8rem',
                    fontFamily: 'monospace'
                  }}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                />
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.4rem', padding: '0.9rem' }}
                disabled={loading || otpCode.length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
                {!loading && <ArrowRight size={16} />}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <button 
                  type="button"
                  onClick={handleResendOtpClick}
                  disabled={resendCooldown > 0 || resendLoading}
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--primary)', 
                    fontSize: '0.8rem', 
                    fontWeight: 700, 
                    cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <RefreshCw size={14} className={resendLoading ? 'spin' : ''} />
                  {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend Code'}
                </button>

                <button 
                  type="button"
                  onClick={() => { setIsVerifyOtp(false); setLocalError(null); setSuccessMessage(null); }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          ) : isForgotPassword ? (
            <form onSubmit={handleForgotPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="email"
                    type="email"
                    className="form-input"
                    placeholder="name@university.edu"
                    style={{ paddingLeft: '40px', width: '100%' }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <button 
                  type="button"
                  onClick={() => { setIsForgotPassword(false); setLocalError(null); }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  ← Back to login
                </button>
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.9rem' }}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Request Reset Code'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>
          ) : isResetPassword ? (
            <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div className="form-group">
                <label htmlFor="resetToken">Reset Code / Token</label>
                <div style={{ position: 'relative' }}>
                  <Key size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="resetToken"
                    type="text"
                    className="form-input"
                    placeholder="6-Digit Code or Reset Token"
                    style={{ paddingLeft: '40px', width: '100%' }}
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="newPassword"
                    type="password"
                    className="form-input"
                    placeholder="Min 6 characters"
                    style={{ paddingLeft: '40px', width: '100%' }}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <button 
                  type="button"
                  onClick={() => { setIsResetPassword(false); setIsForgotPassword(true); setLocalError(null); }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  ← Request new code
                </button>
                <button 
                  type="button"
                  onClick={() => { setIsResetPassword(false); setIsForgotPassword(false); setLocalError(null); }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.9rem' }}
                disabled={loading}
              >
                {loading ? 'Resetting...' : 'Change Password'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="username">Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="username"
                      type="text"
                      className="form-input"
                      placeholder="Enter your name"
                      style={{ paddingLeft: '40px', width: '100%' }}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="email"
                    type="email"
                    className="form-input"
                    placeholder="name@university.edu"
                    style={{ paddingLeft: '40px', width: '100%' }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="password"
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    style={{ paddingLeft: '40px', width: '100%' }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {isLogin && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(true); setLocalError(null); setSuccessMessage(null); }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <button 
                type="submit" 
                className="btn-primary" 
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.8rem', padding: '0.9rem' }}
                disabled={loading}
              >
                {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Get Started'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

