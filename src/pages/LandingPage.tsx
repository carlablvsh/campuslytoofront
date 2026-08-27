import React from 'react';
import { 
  Calendar, 
  GraduationCap, 
  CheckSquare, 
  // FileText,
  Clock, 
  // Bot,
  ArrowRight,
  Sparkles,
  X,
  Coffee
} from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
  onSignUpClick: () => void;
  onLogoClick: () => void;
  showSidebarPreview: boolean;
  setShowSidebarPreview: (show: boolean) => void;
}

const CuteBowSVG: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 28, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ overflow: 'visible', ...style }}>
    <path d="M12 12 C8 6, 3 8, 5 12 C7 16, 11 13, 12 12 Z" fill="#ffd1dc" stroke="#ff7899" strokeWidth="1.5" />
    <path d="M12 12 C16 6, 21 8, 19 12 C17 16, 13 13, 12 12 Z" fill="#ffd1dc" stroke="#ff7899" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="2.5" fill="#ff7899" stroke="#ff5e84" strokeWidth="1" />
    <path d="M11 13 C9 17, 6 20, 4 21" stroke="#ff7899" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M13 13 C15 17, 18 20, 20 21" stroke="#ff7899" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const CuteFlowerSVG: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 18, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ overflow: 'visible', ...style }}>
    <circle cx="12" cy="6" r="4" fill="#ffd1dc" />
    <circle cx="6" cy="12" r="4" fill="#ffd1dc" />
    <circle cx="18" cy="12" r="4" fill="#ffd1dc" />
    <circle cx="9" cy="17" r="4" fill="#ffd1dc" />
    <circle cx="15" cy="17" r="4" fill="#ffd1dc" />
    <circle cx="12" cy="12" r="3" fill="#fef08a" />
  </svg>
);

const CozyStarSVG: React.FC<{ size?: number; color?: string; style?: React.CSSProperties }> = ({ size = 14, color = '#fef08a', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ overflow: 'visible', ...style }}>
    <path d="M12 2 L15 9 L22 12 L15 15 L12 22 L9 15 L2 12 L9 9 Z" fill={color} />
  </svg>
);

// Cute AI Robot
// const CuteRobotSVG: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 120, style }) => (
//   <svg width={size} height={size + 20} viewBox="0 0 120 140" style={{ overflow: 'visible', ...style }}>
//     <rect x="25" y="45" width="70" height="60" rx="18" fill="#ffffff" stroke="#ff7899" strokeWidth="2.5" />
//     <rect x="33" y="53" width="54" height="44" rx="12" fill="#fff0f3" />
//     <line x1="60" y1="45" x2="60" y2="30" stroke="#ff7899" strokeWidth="3" strokeLinecap="round" />
//     <circle cx="60" cy="27" r="4" fill="#ff5e84" />
//     <path d="M54 38 C51 34, 48 35, 50 38 C52 41, 54 39, 54 38 Z" fill="#ffd1dc" stroke="#ff7899" strokeWidth="1" />
//     <path d="M66 38 C69 34, 72 35, 70 38 C68 41, 66 39, 66 38 Z" fill="#ffd1dc" stroke="#ff7899" strokeWidth="1" />
//     <circle cx="60" cy="38" r="1.5" fill="#ff7899" />
//     <circle cx="48" cy="72" r="5" fill="#2e1622" />
//     <circle cx="46" cy="70" r="1.5" fill="#ffffff" />
//     <circle cx="72" cy="72" r="5" fill="#2e1622" />
//     <circle cx="70" cy="70" r="1.5" fill="#ffffff" />
//     <circle cx="40" cy="80" r="3" fill="#ffd1dc" />
//     <circle cx="80" cy="80" r="3" fill="#ffd1dc" />
//     <path d="M57 80 Q60 82 63 80" stroke="#2e1622" strokeWidth="1.5" strokeLinecap="round" fill="transparent" />
//     <rect x="15" y="60" width="8" height="22" rx="4" fill="#ffffff" stroke="#ff7899" strokeWidth="2" />
//     <rect x="97" y="60" width="8" height="22" rx="4" fill="#ffffff" stroke="#ff7899" strokeWidth="2" />
//     <rect x="42" y="105" width="12" height="15" rx="5" fill="#ffffff" stroke="#ff7899" strokeWidth="2" />
//     <rect x="66" y="105" width="12" height="15" rx="5" fill="#ffffff" stroke="#ff7899" strokeWidth="2" />
//   </svg>
// );

// Cute Student Girl Studying
const CuteStudentGirlSVG: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 130, style }) => (
  <svg width={size} height={size} viewBox="0 0 150 150" style={{ overflow: 'visible', ...style }}>
    <path d="M48 50 C48 20, 102 20, 102 50 C102 80, 48 80, 48 50 Z" fill="#4a3728" />
    <circle cx="75" cy="55" r="18" fill="#ffd8c8" />
    <path d="M55 45 C65 35, 85 35, 95 45 C95 45, 90 55, 75 50 C60 55, 55 45, 55 45 Z" fill="#4a3728" />
    <path d="M52 50 C42 60, 40 80, 45 90 C45 90, 52 75, 54 60 Z" fill="#4a3728" />
    <path d="M98 50 C108 60, 110 80, 105 90 C105 90, 98 75, 96 60 Z" fill="#4a3728" />
    <circle cx="68" cy="54" r="1.5" fill="#4a3728" />
    <circle cx="82" cy="54" r="1.5" fill="#4a3728" />
    <circle cx="64" cy="58" r="2" fill="#ffb3c6" />
    <circle cx="86" cy="58" r="2" fill="#ffb3c6" />
    <path d="M73 60 Q75 62 77 60" stroke="#4a3728" strokeWidth="1" strokeLinecap="round" fill="transparent" />
    <circle cx="92" cy="40" r="3" fill="#ff8da1" />
    <circle cx="88" cy="43" r="3" fill="#ff8da1" />
    <circle cx="96" cy="43" r="3" fill="#ff8da1" />
    <circle cx="92" cy="46" r="3" fill="#ff8da1" />
    <circle cx="92" cy="43" r="2" fill="#fef08a" />
    <path d="M50 95 C50 80, 100 80, 100 95 L105 130 L45 130 Z" fill="#ff7899" />
    <rect x="70" y="110" width="16" height="16" rx="2" fill="#ffffff" stroke="#ff7899" strokeWidth="1.5" />
    <path d="M86 114 C89 114, 91 116, 91 118 C91 120, 89 122, 86 122" fill="none" stroke="#ff7899" strokeWidth="1.5" />
    <rect x="95" y="105" width="40" height="25" rx="3" fill="#ffd1dc" stroke="#ff7899" strokeWidth="1.5" transform="skewX(-10)" />
    <rect x="90" y="128" width="48" height="4" rx="2" fill="#cbd5e1" />
    <circle cx="115" cy="117" r="2.5" fill="#ffffff" />
    <circle cx="115" cy="117" r="1" fill="#fef08a" />
  </svg>
);

// Cute Books & Flower Pot
const CuteBooksAndFlowerSVG: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 120, style }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" style={{ overflow: 'visible', ...style }}>
    <rect x="15" y="85" width="55" height="12" rx="2" fill="#ff9eb5" stroke="#ff5e84" strokeWidth="1.5" />
    <path d="M15 97 L70 97" stroke="#ffffff" strokeWidth="2" />
    <rect x="18" y="73" width="50" height="12" rx="2" fill="#c084fc" stroke="#8b5cf6" strokeWidth="1.5" />
    <path d="M18 85 L68 85" stroke="#ffffff" strokeWidth="2" />
    <rect x="22" y="61" width="42" height="12" rx="2" fill="#93c5fd" stroke="#3b82f6" strokeWidth="1.5" />
    <path d="M22 73 L64 73" stroke="#ffffff" strokeWidth="2" />
    <rect x="80" y="75" width="22" height="22" rx="3" fill="#ffeedd" stroke="#e6c15c" strokeWidth="1.5" />
    <line x1="80" y1="78" x2="102" y2="78" stroke="#e6c15c" strokeWidth="1.5" />
    <path d="M91 75 L91 50" fill="none" stroke="#10b981" strokeWidth="2" />
    <path d="M91 65 Q85 62, 87 58 Q91 62, 91 65" fill="#10b981" />
    <path d="M91 60 Q97 57, 95 53 Q91 57, 91 60" fill="#10b981" />
    <circle cx="91" cy="46" r="4.5" fill="#fef08a" />
    <circle cx="85" cy="43" r="3.5" fill="#fbcfe8" />
    <circle cx="97" cy="43" r="3.5" fill="#fbcfe8" />
    <circle cx="88" cy="49" r="3.5" fill="#fbcfe8" />
    <circle cx="94" cy="49" r="3.5" fill="#fbcfe8" />
  </svg>
);

// Dashboard App Mockup in Hero Right Panel
const DashboardAppMockup: React.FC = () => (
  <div style={{
    width: '100%',
    maxWidth: '560px',
    background: '#ffffff',
    border: '1.5px solid #ffd1dc',
    borderRadius: '16px',
    boxShadow: '0 15px 40px rgba(255, 94, 132, 0.08)',
    display: 'flex',
    overflow: 'hidden',
    textAlign: 'left',
    fontFamily: 'var(--font-sans)',
    height: '350px'
  }}>
    {/* Mockup Sidebar */}
    <div style={{
      width: '130px',
      background: '#fffbfb',
      borderRight: '1px solid #ffd1dc',
      padding: '0.8rem 0.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.4rem',
      flexShrink: 0
    }}>
      {/* Brand logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#ff7899', fontWeight: 800, fontSize: '0.74rem', marginBottom: '0.4rem', paddingLeft: '0.3rem' }}>
        <GraduationCap size={10} />
        <span>Campusly</span>
      </div>
      {/* Nav items */}
      {[
        { label: 'Dashboard', icon: Sparkles, active: true },
        { label: 'Timetable', icon: Clock },
        { label: 'Attendance', icon: GraduationCap },
        { label: 'Tasks', icon: CheckSquare },
        { label: 'Exams', icon: Calendar },
        { label: 'Calendar', icon: Calendar },
        { label: 'Study Room', icon: Coffee }
      ].map((item, i) => {
        const Icon = item.icon;
        return (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.3rem 0.45rem',
            borderRadius: '6px',
            background: item.active ? 'var(--primary-glow)' : 'transparent',
            color: item.active ? 'var(--primary)' : '#8c707a',
            fontSize: '0.62rem',
            fontWeight: 700
          }}>
            <Icon size={9} />
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>

    {/* Mockup Main Viewport */}
    <div style={{
      flex: 1,
      background: '#fffdfd',
      padding: '0.8rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.6rem',
      overflowY: 'auto'
    }}>
      {/* Greeting */}
      <div>
        <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#2e1622', margin: 0 }}>Good evening, Aanya 🌙</h4>
        <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>You have 3 classes today. Let's make it a productive one!</span>
      </div>

      {/* Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '0.3rem'
      }}>
        {[
          { label: 'Classes Today', val: '4', bg: '#fff0f2', color: '#ff5e84' },
          { label: 'Avg. Attendance', val: '78%', bg: '#f5effc', color: '#b6a6ca' },
          { label: 'Tasks Due', val: '2', bg: '#fff9e6', color: '#e6c15c' },
          { label: 'Notes Saved', val: '5', bg: '#eefdf8', color: '#3ec9a5' }
        ].map((stat, i) => (
          <div key={i} style={{
            background: '#ffffff',
            border: '1px solid #ffd1dc',
            borderRadius: '8px',
            padding: '0.4rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: stat.color }}>{stat.val}</span>
            <span style={{ fontSize: '0.46rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.1rem', lineHeight: 1.1 }}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Classes & Calendar cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.5rem' }}>
        
        {/* Classes Card */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #ffd1dc',
          borderRadius: '10px',
          padding: '0.5rem'
        }}>
          <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#ff5e84', display: 'block', marginBottom: '0.3rem' }}>Today's Classes</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {[
              { subject: 'Organic Chemistry', time: '09:00 - 10:00', room: 'Lab 2', border: '#ff5e84' },
              { subject: 'Linear Algebra', time: '10:15 - 11:15', room: 'Room 214', border: '#b6a6ca' },
              { subject: 'Microeconomics', time: '13:00 - 14:00', room: 'Room 108', border: '#3ec9a5' }
            ].map((cl, idx) => (
              <div key={idx} style={{
                borderLeft: `2.5px solid ${cl.border}`,
                paddingLeft: '0.3rem',
                display: 'flex',
                flexDirection: 'column',
                lineHeight: '1.1'
              }}>
                <span style={{ fontSize: '0.62rem', fontWeight: 700 }}>{cl.subject}</span>
                <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>{cl.time} • {cl.room}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Card */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #ffd1dc',
          borderRadius: '10px',
          padding: '0.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative'
        }}>
          <span style={{ fontSize: '0.55rem', fontWeight: 800, display: 'block', marginBottom: '0.2rem' }}>August 2026</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.1rem', fontSize: '0.45rem', textAlign: 'center' }}>
            {['S','M','T','W','T','F','S'].map((d, i) => <span key={i} style={{ color: 'var(--text-muted)', fontWeight: 800 }}>{d}</span>)}
            {Array.from({ length: 14 }).map((_, i) => (
              <span key={i} style={{ color: i === 6 ? '#ff5e84' : 'inherit', fontWeight: i === 6 ? 'bold' : 'normal' }}>{i + 1}</span>
            ))}
          </div>
          
          <div style={{ position: 'absolute', bottom: '-4px', right: '-12px', zIndex: 5, pointerEvents: 'none' }}>
            <svg width="45" height="35" viewBox="0 0 60 50" style={{ overflow: 'visible' }}>
              <ellipse cx="25" cy="20" rx="3.5" ry="9" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" transform="rotate(-10 25 20)" />
              <ellipse cx="25" cy="20" rx="1.8" ry="6" fill="#ffd1dc" transform="rotate(-10 25 20)" />
              <ellipse cx="35" cy="20" rx="3.5" ry="9" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" transform="rotate(10 35 20)" />
              <ellipse cx="35" cy="20" rx="1.8" ry="6" fill="#ffd1dc" transform="rotate(10 35 20)" />
              <circle cx="30" cy="38" r="12" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
              <circle cx="26" cy="36" r="1" fill="#4a3764" />
              <circle cx="34" cy="36" r="1" fill="#4a3764" />
              <circle cx="24" cy="38" r="1.5" fill="#ffd1dc" />
              <circle cx="36" cy="38" r="1.5" fill="#ffd1dc" />
            </svg>
          </div>
        </div>

      </div>

    </div>
  </div>
);

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onLoginClick, 
  onSignUpClick, 
  onLogoClick,
  showSidebarPreview,
  setShowSidebarPreview
}) => {
  const [currentView, setCurrentView] = React.useState<'home' | 'pricing' | 'support'>('home');
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [subject, setSubject] = React.useState('General Enquiry');
  const [message, setMessage] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmitSupport = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const scrollToSection = (id: string) => {
    setCurrentView('home');
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  const features = [
    { id: 'timetable', label: 'Timetable', icon: Clock, desc: 'Manage your class schedule easily' },
    { id: 'attendance', label: 'Attendance', icon: GraduationCap, desc: 'Track attendance and stay consistent' },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, desc: 'Organize tasks and never miss a deadline' },
    { id: 'exams', label: 'Exams', icon: Sparkles, desc: 'Prepare better with smart exam tracking' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, desc: 'Plan your days and achieve more' },
    { id: 'studyroom', label: 'Study Room', icon: Coffee, desc: 'Listen to lo-fi ambient audio and study peacefully' }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#fffdf9', 
      color: '#3c2429', 
      fontFamily: 'var(--font-sans)', 
      overflowX: 'hidden',
      position: 'relative'
    }} className="landing-page-container">
      
      {/* Decorative stars and bows */}
      <CozyStarSVG size={18} style={{ position: 'absolute', top: '12%', left: '8%', opacity: 0.45, animation: 'pulse 3s infinite' }} />
      <CuteFlowerSVG size={22} style={{ position: 'absolute', top: '25%', right: '5%', opacity: 0.35 }} />
      <CozyStarSVG size={14} style={{ position: 'absolute', top: '65%', left: '4%', opacity: 0.35 }} />
      <CuteBowSVG size={28} style={{ position: 'absolute', top: '80%', right: '8%', opacity: 0.3 }} />

      {/* TOP HEADER / NAVBAR */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '1.2rem 2.5rem',
        background: 'rgba(255, 253, 249, 0.85)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid rgba(255, 120, 153, 0.08)'
      }}>
        {/* Clickable Logo */}
        <div 
          onClick={() => { setCurrentView('home'); onLogoClick(); }} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            cursor: 'pointer',
            fontWeight: 800,
            fontSize: '1.35rem',
            color: '#ff7899',
            fontFamily: 'var(--font-serif)'
          }}
          title="Click to reveal Sidebar preview 🎀"
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--primary-glow)',
            width: '32px',
            height: '32px',
            borderRadius: '8px'
          }}>
            <GraduationCap size={16} />
          </div>
          <span>Campusly</span>
          <CuteBowSVG size={16} style={{ alignSelf: 'flex-start', marginTop: '-3px' }} />
        </div>

        {/* Center menu links */}
        <div className="landing-menu-links" style={{ display: 'flex', gap: '1.8rem', fontSize: '0.85rem', fontWeight: 700, color: '#6a521a' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => scrollToSection('features-section')}>Features</span>
          <span style={{ cursor: 'pointer' }} onClick={() => scrollToSection('students-section')}>Reviews</span>
          <span style={{ cursor: 'pointer' }} onClick={() => setCurrentView('pricing')}>Pricing</span>
          <span style={{ cursor: 'pointer' }} onClick={() => setCurrentView('support')}>Support</span>
          <span style={{ cursor: 'pointer' }} onClick={() => scrollToSection('about-section')}>About</span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <button 
            onClick={onLoginClick}
            style={{ 
              background: 'transparent', 
              border: '1.5px solid #ff7899', 
              color: '#ff7899', 
              padding: '0.45rem 1.1rem',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'var(--transition)'
            }}
            className="btn-login-outline"
          >
            Log In
          </button>
          <button 
            onClick={onSignUpClick}
            style={{ 
              background: 'linear-gradient(135deg, #ff7899, #ff5e84)', 
              border: 'none', 
              color: '#ffffff', 
              padding: '0.5rem 1.3rem',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(255, 94, 132, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            Sign Up
          </button>
        </div>
      </header>

      {/* SIDEBAR PREVIEW OVERLAY / DRAWER */}
      {showSidebarPreview && (
        <div 
          onClick={() => setShowSidebarPreview(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(46, 22, 34, 0.2)',
            backdropFilter: 'blur(3px)',
            zIndex: 1000,
            display: 'flex'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '240px',
              background: 'var(--bg-surface)',
              borderRight: '1px solid var(--border-color)',
              height: '100%',
              padding: '1.8rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              boxShadow: '10px 0 30px rgba(0,0,0,0.05)',
              animation: 'slide-right 0.28s ease-out'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-serif)' }}>
                <span>Campusly Menu</span>
              </div>
              <button 
                onClick={() => setShowSidebarPreview(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'var(--primary-glow)', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
              ✦ Interactive preview of the student application sidebar! Click below to enter the registration portal.
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {features.map((item, i) => {
                const Icon = item.icon;
                return (
                  <li key={i}>
                    <button 
                      onClick={onSignUpClick}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.55rem 0.8rem',
                        border: 'none',
                        background: 'transparent',
                        borderRadius: '8px',
                        color: 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                      className="nav-preview-item"
                    >
                      <Icon size={15} style={{ color: 'var(--primary)' }} />
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button 
                onClick={onSignUpClick}
                style={{
                  width: '100%',
                  padding: '0.55rem',
                  fontSize: '0.8rem',
                  borderRadius: '20px',
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}

      {currentView === 'pricing' ? (
        <div style={{ padding: '4.5rem 2rem', maxWidth: '1000px', margin: '0 auto', textAlign: 'center', animation: 'fade-in 0.3s ease-out' }}>
          
          {/* Header */}
          <div style={{ marginBottom: '3.5rem', position: 'relative' }}>
            <span style={{ fontSize: '0.8rem', color: '#ff7899', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', marginBottom: '0.5rem' }}>
              <Sparkles size={14} /> Pricing Plans
            </span>
            <h1 style={{ fontSize: '3rem', fontWeight: 900, fontFamily: 'var(--font-serif)', color: '#2e1622', margin: '0 0 1rem 0' }}>
              Cozy plans for bright minds 🌸
            </h1>
            <p style={{ color: '#8c707a', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
              Whether you want a simple tracker or advanced planning tools, we have a plan crafted for your success.
            </p>
          </div>

          {/* Pricing Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', maxWidth: '800px', margin: '0 auto 4rem auto' }} className="responsive-grid">
            
            {/* Plan 1: Free */}
            <div className="landing-hover-card" style={{
              background: '#ffffff',
              border: '1.5px solid #ffd1dc',
              borderRadius: '24px',
              padding: '2.5rem 2rem',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 8px 24px rgba(255, 94, 132, 0.02)',
              position: 'relative'
            }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2e1622', margin: '0 0 0.5rem 0' }}>Free</h3>
                <p style={{ fontSize: '0.82rem', color: '#8c707a', margin: '0 0 1.5rem 0' }}>everything you need to organize college life.</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.1rem', marginBottom: '2rem' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#2e1622' }}>₹0</span>
                  <span style={{ fontSize: '0.85rem', color: '#8c707a', fontWeight: 600 }}>/ month</span>
                </div>

                <hr style={{ border: 0, borderTop: '1px solid rgba(255, 120, 153, 0.12)', marginBottom: '1.8rem' }} />

                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.85rem', color: '#5a424a' }}>
                  <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ color: '#ff7899', fontWeight: 'bold' }}>✓</span> timetable & attendance
                  </li>
                  <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ color: '#ff7899', fontWeight: 'bold' }}>✓</span> tasks and exams
                  </li>
                  <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ color: '#ff7899', fontWeight: 'bold' }}>✓</span> study room
                  </li>
                  <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ color: '#ff7899', fontWeight: 'bold' }}>✓</span> unified academic calendar
                  </li>
                </ul>
              </div>

              <div style={{ marginTop: '2.5rem' }}>
                <button 
                  onClick={onSignUpClick}
                  style={{
                    width: '100%',
                    background: '#ffffff',
                    border: '1.5px solid #ff7899',
                    color: '#ff7899',
                    borderRadius: '25px',
                    padding: '0.75rem',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'var(--transition)'
                  }}
                  className="btn-login-outline"
                >
                  Start Learning Free
                </button>
              </div>
            </div>

            {/* Plan 2: Pro */}
            <div className="landing-hover-card" style={{
              background: '#ffffff',
              border: '2.5px solid #ff7899',
              borderRadius: '24px',
              padding: '2.5rem 2rem',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 12px 30px rgba(255, 94, 132, 0.08)',
              position: 'relative',
              transform: 'scale(1.02)'
            }}>
              <div style={{
                position: 'absolute',
                top: '-15px',
                right: '25px',
                background: '#ff7899',
                color: '#ffffff',
                fontSize: '0.68rem',
                fontWeight: 900,
                padding: '0.3rem 0.8rem',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                boxShadow: '0 4px 10px rgba(255, 94, 132, 0.2)'
              }}>
                <CuteBowSVG size={12} style={{ filter: 'brightness(0) invert(1)' }} />
                <span>COMING SOON</span>
              </div>

              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2e1622', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  Scholar Pro <Sparkles size={16} style={{ color: '#ff7899' }} />
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#8c707a', margin: '0 0 1.5rem 0' }}>more scheduler customizability and advanced planning.</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.1rem', marginBottom: '2rem' }}>
                  <span style={{ fontSize: '2.2rem', fontWeight: 900, color: '#2e1622' }}>coming soon</span>
                </div>

                <hr style={{ border: 0, borderTop: '1px solid rgba(255, 120, 153, 0.12)', marginBottom: '1.8rem' }} />

                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.85rem', color: '#5a424a' }}>
                  <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ color: '#ff7899', fontWeight: 'bold' }}>-</span> custom holiday break periods
                  </li>
                  <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ color: '#ff7899', fontWeight: 'bold' }}>-</span> custom recurring schedules
                  </li>
                  <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ color: '#ff7899', fontWeight: 'bold' }}>-</span> expanded document/file features
                  </li>
                  <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ color: '#ff7899', fontWeight: 'bold' }}>-</span> smart class exception tracking
                  </li>
                  <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ color: '#ff7899', fontWeight: 'bold' }}>-</span> smart notifications
                  </li>
                  <li style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ color: '#ff7899', fontWeight: 'bold' }}>-</span> priority features
                  </li>
                </ul>
              </div>

              <div style={{ marginTop: '2.5rem' }}>
                <button 
                  disabled
                  style={{
                    width: '100%',
                    background: '#e5e5e5',
                    color: '#7a7a7a',
                    border: 'none',
                    borderRadius: '25px',
                    padding: '0.8rem',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    cursor: 'not-allowed',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.3rem'
                  }}
                >
                  Coming Soon
                </button>
              </div>
            </div>

          </div>

          <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'left', borderTop: '1px solid rgba(255, 120, 153, 0.12)', paddingTop: '3rem' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-serif)', color: '#2e1622', marginBottom: '1.5rem', textAlign: 'center' }}>
              Frequently Asked Questions
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {[
                { q: "Can I cancel my premium subscription at any time?", a: "Yes, you can cancel your subscription inside your settings pane anytime. Your premium access will continue to stay active until the end of the current billing cycle." },
                { q: "How does the integrated calendar schedule work?", a: "Campusly automatically generates your weekly class schedule, skips them during your vacation breaks, and overlays your tasks, exams, and extracurricular events in one place." },
                { q: "Can I customize recurring schedules?", a: "Yes, you can schedule classes that occur weekly, bi-weekly, or on custom selected days of the week, with optional start and end dates." }
              ].map((faq, idx) => (
                <div key={idx} style={{ background: 'var(--bg-app)', padding: '1rem 1.2rem', borderRadius: '12px', border: '1px solid rgba(255, 120, 153, 0.05)' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#2e1622', display: 'block', marginBottom: '0.3rem' }}>{faq.q}</span>
                  <span style={{ fontSize: '0.76rem', color: '#8c707a', lineHeight: 1.4, display: 'block' }}>{faq.a}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      ) : currentView === 'support' ? (
        <div style={{ padding: '4.5rem 2rem', maxWidth: '900px', margin: '0 auto', textAlign: 'center', animation: 'fade-in 0.3s ease-out' }}>
          {/* Header */}
          <div style={{ marginBottom: '3rem', position: 'relative' }}>
            <span style={{ fontSize: '0.8rem', color: '#ff7899', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', marginBottom: '0.5rem' }}>
              <CuteBowSVG size={14} /> Help & Support
            </span>
            <h1 style={{ fontSize: '3rem', fontWeight: 900, fontFamily: 'var(--font-serif)', color: '#2e1622', margin: '0 0 1rem 0' }}>
              We're here to help! 🌸
            </h1>
            <p style={{ color: '#8c707a', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
              Have questions, feedback, or need premium billing support? Drop us a message and our cozy support team will get back to you shortly!
            </p>
          </div>

          {/* Form & Info layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2.5rem', textAlign: 'left' }} className="responsive-grid">
            
            {/* Form Card */}
            <div style={{
              background: '#ffffff',
              border: '1.5px solid #ffd1dc',
              borderRadius: '24px',
              padding: '2.5rem',
              boxShadow: '0 8px 24px rgba(255, 94, 132, 0.02)'
            }} className="landing-hover-card">
              {submitted ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#eefdf8',
                    color: '#3ec9a5',
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    marginBottom: '1.5rem'
                  }}>
                    <span style={{ fontSize: '1.8rem' }}>🌸</span>
                  </div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-serif)', color: '#2e1622', marginBottom: '0.5rem' }}>Message Sent!</h3>
                  <p style={{ color: '#8c707a', fontSize: '0.88rem', lineHeight: 1.5, margin: 0 }}>
                    Thank you for reaching out! We have received your query and our cozy support team will get back to you within 24 hours.
                  </p>
                  <button 
                    onClick={() => {
                      setSubmitted(false);
                      setName('');
                      setEmail('');
                      setSubject('General Enquiry');
                      setMessage('');
                    }}
                    style={{
                      background: 'transparent',
                      border: '1.5px solid #ff7899',
                      color: '#ff7899',
                      borderRadius: '20px',
                      padding: '0.45rem 1.4rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      marginTop: '1.5rem'
                    }}
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitSupport} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2e1622' }}>Your Name</label>
                    <input 
                      type="text" 
                      required 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Carla"
                      style={{
                        padding: '0.65rem 0.9rem',
                        border: '1.5px solid #ffd1dc',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        outline: 'none',
                        background: '#fffdfd'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2e1622' }}>Email Address</label>
                    <input 
                      type="email" 
                      required 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="e.g. carla@example.com"
                      style={{
                        padding: '0.65rem 0.9rem',
                        border: '1.5px solid #ffd1dc',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        outline: 'none',
                        background: '#fffdfd'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2e1622' }}>Subject Topic</label>
                    <select 
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      style={{
                        padding: '0.65rem 0.9rem',
                        border: '1.5px solid #ffd1dc',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        outline: 'none',
                        background: '#fffdfd',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="General Enquiry">General Enquiry 🌸</option>
                      <option value="Feature Feedback">Feature Feedback 💡</option>
                      <option value="Bug Report">Report a Bug 🐞</option>
                      <option value="Billing / Pro Account">Billing & Scholar Pro Help 💎</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2e1622' }}>Your Message</label>
                    <textarea 
                      required 
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder="How can we help you today?"
                      style={{
                        padding: '0.75rem 0.9rem',
                        border: '1.5px solid #ffd1dc',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        outline: 'none',
                        background: '#fffdfd',
                        minHeight: '120px',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <button 
                    type="submit"
                    style={{
                      background: 'linear-gradient(135deg, #ff7899, #ff5e84)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '25px',
                      padding: '0.75rem',
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(255, 94, 132, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      marginTop: '0.5rem'
                    }}
                  >
                    Send Message <ArrowRight size={14} />
                  </button>
                </form>
              )}
            </div>

            {/* Quick Support info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Cozy help sticker */}
              <div style={{
                background: 'linear-gradient(135deg, #fffbeb, #fff8f2)',
                border: '1.5px solid rgba(230, 193, 92, 0.2)',
                borderRadius: '24px',
                padding: '2rem',
                textAlign: 'left',
                position: 'relative'
              }} className="landing-hover-card">
                <span style={{ fontSize: '1.5rem', position: 'absolute', top: '15px', right: '15px' }}>🌸</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-serif)', color: '#2e1622', marginBottom: '0.75rem' }}>Cozy Study Tips</h3>
                <p style={{ fontSize: '0.82rem', color: '#6e5261', lineHeight: 1.5, margin: 0 }}>
                  Did you know? Setting up overlapping timetable classes triggers conflicts detection automatically. Make sure to double check your schedule on the Timetable pane before logging attendance!
                </p>
              </div>

              {/* FAQ card summary */}
              <div style={{
                background: '#ffffff',
                border: '1.5px solid #ffd1dc',
                borderRadius: '24px',
                padding: '2rem'
              }} className="landing-hover-card">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2e1622', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  Quick FAQ Info
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.76rem', color: '#8c707a' }}>
                  <div>
                    <strong style={{ color: '#2e1622', display: 'block', marginBottom: '0.15rem' }}>Where is my password reset email?</strong>
                    <span>Emails are sent securely via SMTP routing transporter. Check your spam box if it doesn't arrive within 5 minutes.</span>
                  </div>
                  <div>
                    <strong style={{ color: '#2e1622', display: 'block', marginBottom: '0.15rem' }}>Can I permanently delete my data?</strong>
                    <span>Yes! Navigate to the Settings modal Danger Zone inside your Campusly dashboard. Account unlinking cascade deletes all course history permanently.</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      ) : (
        <>
          {/* 1. HERO SECTION (LEFT / RIGHT COMPOSITION) */}
          <section style={{ 
        padding: '5rem 2rem 4rem 2rem', 
        maxWidth: '1100px', 
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '3rem',
        alignItems: 'center'
      }} className="responsive-grid">
        
        {/* Left Content */}
        <div style={{ textAlign: 'left' }}>
          <h1 style={{ 
            fontSize: '3.6rem', 
            fontWeight: 900, 
            fontFamily: 'var(--font-serif)', 
            color: '#2e1622',
            lineHeight: '1.15',
            margin: '0 0 1.2rem 0'
          }}>
            Your all-in-one<br />
            <span style={{ color: '#ff7899' }}>academic</span><br />
            companion <span style={{ color: '#ff7899' }}>✨</span>
          </h1>

          <p style={{ 
            color: '#8c707a', 
            fontSize: '1.1rem', 
            lineHeight: '1.6', 
            margin: '0 0 2rem 0',
            fontWeight: 500
          }}>
            Campusly helps you stay organized, track your progress, and achieve your academic goals with less stress and more focus.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <button 
              onClick={onSignUpClick}
              style={{ 
                background: 'linear-gradient(135deg, #ff7899, #ff5e84)', 
                color: '#ffffff',
                padding: '0.8rem 2rem',
                borderRadius: '30px',
                fontSize: '0.92rem',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(255, 94, 132, 0.18)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
              className="btn-hero-primary"
            >
              Get Started for Free
              <ArrowRight size={15} />
            </button>
            <button 
              onClick={onLoginClick}
              style={{ 
                background: '#ffffff', 
                color: '#3c2429',
                padding: '0.8rem 2rem',
                borderRadius: '30px',
                fontSize: '0.92rem',
                fontWeight: 750,
                border: '1.5px solid rgba(255, 120, 153, 0.15)',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.015)'
              }}
            >
              Log In
            </button>
          </div>

          {/* Social Proof Avatars */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ display: 'flex', marginLeft: '0.2rem' }}>
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&q=80" alt="Student" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #ffffff', objectFit: 'cover' }} />
              <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=64&q=80" alt="Student" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #ffffff', marginLeft: '-8px', objectFit: 'cover' }} />
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&q=80" alt="Student" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #ffffff', marginLeft: '-8px', objectFit: 'cover' }} />
            </div>
            <span style={{ fontSize: '0.78rem', color: '#8c707a', fontWeight: 600 }}>
              Join 10,000+ students already using Campusly 💖
            </span>
          </div>
        </div>

        {/* Right Dashboard Mockup Illustration */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <DashboardAppMockup />
        </div>

      </section>

      {/* 2. FEATURES OVERVIEW STRIP ("Everything you need, in one beautiful place") */}
      <section id="features-section" style={{ 
        padding: '4rem 2rem', 
        background: 'rgba(255, 120, 153, 0.02)',
        borderTop: '1px solid rgba(255,120,153,0.05)',
        borderBottom: '1px solid rgba(255,120,153,0.05)'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <h3 style={{ 
            fontSize: '1.6rem', 
            fontWeight: 800, 
            fontFamily: 'var(--font-serif)', 
            color: '#2e1622', 
            marginBottom: '3rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem'
          }}>
            <CozyStarSVG size={14} color="var(--primary)" />
            <span>Everything you need, in one beautiful place</span>
            <CozyStarSVG size={14} color="var(--primary)" />
          </h3>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            gap: '1rem' 
          }} className="responsive-grid">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div key={i} className="landing-hover-card" style={{ 
                  background: '#ffffff', 
                  border: '1.5px solid #ffd1dc', 
                  borderRadius: '16px', 
                  padding: '1.5rem 0.8rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  boxShadow: '0 4px 12px rgba(46, 22, 34, 0.015)'
                }}>
                  <div style={{ 
                    width: '38px', 
                    height: '38px', 
                    borderRadius: '50%', 
                    background: i % 2 === 0 ? 'var(--primary-glow)' : '#f5effc', 
                    color: i % 2 === 0 ? 'var(--primary)' : '#b6a6ca', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginBottom: '0.8rem'
                  }}>
                    <Icon size={18} />
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2e1622', marginBottom: '0.3rem' }}>{feat.label}</span>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.3 }}>{feat.desc}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. DOUBLE SPOTLIGHT DETAIL SECTIONS */}
      <section style={{ 
        padding: '5rem 2rem', 
        maxWidth: '1100px', 
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr 1.1fr',
        gap: '4rem'
      }} className="responsive-grid">
        
        {/* Left Column: Smart Integrated Calendar */}
        <div id="calendar-section" style={{
          background: 'linear-gradient(135deg, #fffafc, #fffdfd)',
          border: '1.5px solid #ffd1dc',
          borderRadius: '24px',
          padding: '2.5rem',
          textAlign: 'left',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '0.74rem', color: '#ff5e84', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem', marginBottom: '0.6rem' }}>
              <Calendar size={11} /> Smart Integrated Calendar
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-serif)', color: '#2e1622', margin: '0 0 0.8rem 0' }}>
              One unified schedule
            </h2>
            <p style={{ color: '#8c707a', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              Keep track of classes, tasks, assignments, exams, and personal events in one cohesive dashboard. Classes are automatically paused during your custom vacation breaks.
            </p>
            <button 
              onClick={onSignUpClick}
              style={{
                background: '#ff7899',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                padding: '0.55rem 1.4rem',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: '0 4px 12px rgba(255, 120, 153, 0.15)'
              }}
            >
              Explore Smart Calendar <ArrowRight size={13} />
            </button>
          </div>

          {/* Graphic with bubbles & preview */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-end', 
            marginTop: '2.5rem', 
            position: 'relative' 
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingBottom: '0.8rem', width: '100%' }}>
              <span style={{ fontSize: '0.62rem', background: '#fff', border: '1px solid #ffd1dc', padding: '0.35rem 0.65rem', borderRadius: '15px 15px 15px 0', fontWeight: 700, color: 'var(--primary)' }}>📅 Mon: Math Class (paused for break)</span>
              <span style={{ fontSize: '0.62rem', background: '#fff', border: '1px solid #ffd1dc', padding: '0.35rem 0.65rem', borderRadius: '15px 15px 15px 0', fontWeight: 700, color: 'var(--primary)', marginLeft: '1.2rem' }}>📝 Wed: Physics Lab Assignment due</span>
              <span style={{ fontSize: '0.62rem', background: '#fff', border: '1px solid #ffd1dc', padding: '0.35rem 0.65rem', borderRadius: '15px 15px 15px 0', fontWeight: 700, color: 'var(--primary)' }}>💼 Fri: Part-time job shift (14:00 - 18:00)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Plan. Track. Achieve. Repeat. */}
        <div style={{
          background: 'linear-gradient(135deg, #fffdf9, #fffcfb)',
          border: '1.5px solid rgba(230, 193, 92, 0.2)',
          borderRadius: '24px',
          padding: '2.5rem',
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-serif)', color: '#2e1622', margin: '0 0 1.5rem 0' }}>
              Plan. Track. Achieve. Repeat.
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {[
                { title: 'Plan your week', desc: 'Organize classes, tasks and goals', icon: Calendar, color: '#ff7899' },
                { title: 'Stay on track', desc: 'Track progress and build consistency', icon: CheckSquare, color: '#c084fc' },
                { title: 'Achieve your goals', desc: 'Small steps every day lead to big results', icon: Sparkles, color: '#e6c15c' }
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.9rem', alignItems: 'flex-start' }}>
                  <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '8px', 
                    background: '#ffffff', 
                    border: '1.5px solid var(--border-color)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <step.icon size={15} style={{ color: step.color }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#2e1622' }}>{step.title}</span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{step.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Student Girl Study Graphic */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <CuteStudentGirlSVG size={120} />
          </div>
        </div>

      </section>

      {/* 4. TESTIMONIAL SLIDER */}
      <section id="students-section" style={{ 
        padding: '3rem 2rem 5rem 2rem', 
        maxWidth: '1100px', 
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '2.1rem', fontWeight: 800, fontFamily: 'var(--font-serif)', color: '#2e1622', margin: 0 }}>
            Loved by students like you 💖
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }} className="responsive-grid">
          {[
            {
              text: "Campusly has seriously changed the way I manage my academics. Everything is so organized and cute! I love it! 💝",
              name: "Diya K.",
              sub: "2nd Year, B.Tech",
              img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&q=80"
            },
            {
              text: "The Study Room with the Pomodoro timer and Spotify integration keeps me totally locked in during exam prep! ☕",
              name: "Arjun M.",
              sub: "3rd Year, B.Sc",
              img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&q=80"
            },
            {
              text: "I never miss a deadline anymore. The reminders and task tracking are absolute lifesavers.",
              name: "Meera S.",
              sub: "1st Year, B.Com",
              img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=64&q=80"
            }
          ].map((item, i) => (
            <div key={i} className="landing-hover-card" style={{ 
              background: '#ffffff', 
              border: '1.5px solid #ffd1dc', 
              borderRadius: '20px', 
              padding: '1.8rem',
              textAlign: 'left',
              boxShadow: '0 4px 15px rgba(255, 94, 132, 0.02)',
              position: 'relative'
            }}>
              {/* Quote marks */}
              <span style={{ fontSize: '2.5rem', color: '#ffd1dc', fontFamily: 'serif', position: 'absolute', top: '10px', left: '15px', lineHeight: 1, pointerEvents: 'none' }}>“</span>
              <p style={{ color: '#5a424a', fontSize: '0.85rem', lineHeight: 1.5, position: 'relative', zIndex: 2, margin: '0 0 1.5rem 0', minHeight: '60px' }}>
                {item.text}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderTop: '1px solid rgba(255,120,153,0.08)', paddingTop: '0.8rem' }}>
                <img src={item.img} alt={item.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#2e1622' }}>— {item.name}</span>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{item.sub}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. FOOTER CALL TO ACTION */}
      <section style={{ 
        background: '#fff3f5',
        borderTop: '1.5px solid #ffd1dc',
        borderBottom: '1.5px solid #ffd1dc',
        padding: '3.5rem 2rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ 
          maxWidth: '1100px', 
          margin: '0 auto', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '2rem'
        }}>
          <div style={{ textAlign: 'left', maxWidth: '580px' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, fontFamily: 'var(--font-serif)', color: '#ff5e84', margin: '0 0 0.6rem 0' }}>
              Ready to boost your academic journey?
            </h2>
            <p style={{ color: '#8c707a', fontSize: '0.94rem', margin: 0, fontWeight: 500 }}>
              Join Campusly today and make every day productive, organized and stress-free.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <button 
              onClick={onSignUpClick}
              style={{ 
                background: '#ff7899', 
                color: '#ffffff',
                padding: '0.85rem 2.2rem',
                borderRadius: '30px',
                fontSize: '0.95rem',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 6px 16px rgba(255, 94, 132, 0.2)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              Create Your Account
              <ArrowRight size={15} />
            </button>
            
            {/* Cute stack of books illustration */}
            <CuteBooksAndFlowerSVG size={90} style={{ alignSelf: 'center' }} />
          </div>
        </div>
      </section>
      </>)}

      {/* FOOTER BAR */}
      <footer id="about-section" style={{ 
        padding: '2.2rem', 
        textAlign: 'center', 
        fontSize: '0.74rem', 
        color: '#8c707a',
        background: '#fffdf9'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span>© {new Date().getFullYear()} Campusly</span>
          <span>•</span>
          <span style={{ color: '#ff7899', fontWeight: 600 }}>Your Academic Companion</span>
        </div>
        <div>Made with 💖 for a cozy campus life experience.</div>
      </footer>

    </div>
  );
};
