import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Lock, Mail, User, ArrowRight } from 'lucide-react';

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
  const { login, register, error, clearError } = useAuth();
  const [isLogin, setIsLogin] = useState<boolean>(initialIsLogin);
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleToggle = (loginState: boolean) => {
    setIsLogin(loginState);
    clearError();
    setUsername('');
    setEmail('');
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !username)) return;

    setLoading(true);
    
    if (isLogin) {
      await login(email, password);
    } else {
      await register(username, email, password);
    }
    
    setLoading(false);
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

          {error && (
            <div className="alert-banner danger">
              <span>{error}</span>
            </div>
          )}

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

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '0.9rem' }}
              disabled={loading}
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Get Started'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
