import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Clock, 
  ChevronRight,
  Play,
  Check,
  Compass,
  Sparkles,
  Coffee
} from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
  onSignUpClick: () => void;
  onLogoClick: () => void;
  showSidebarPreview?: boolean;
  setShowSidebarPreview?: (show: boolean) => void;
}

const PetalMarkSVG: React.FC<{ size?: number; className?: string; style?: React.CSSProperties }> = ({ size = 20, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ overflow: 'visible', ...style }}>
    <path d="M12 2C8.5 7.5 4 10.5 4 14.5C4 18.5 7.5 22 12 22C16.5 22 20 18.5 20 14.5C20 10.5 15.5 7.5 12 2Z" fill="url(#petal-grad)" />
    <path d="M12 2C10.5 8 8 13 4 14.5" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.4" />
    <defs>
      <linearGradient id="petal-grad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f472b6" />
        <stop offset="1" stopColor="#e11d48" />
      </linearGradient>
    </defs>
  </svg>
);

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onLoginClick, 
  onSignUpClick = onLoginClick, 
  onLogoClick 
}) => {
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [activeTasks, setActiveTasks] = useState<string[]>(['t1']);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const timetablePreview = [
    [
      { subject: 'Orbital Astronomy', code: 'AST-204', time: '09:00–10:30', room: 'Dome 3', instructor: 'Dr. Ito', color: '#f472b6' },
      { subject: 'Spatial Interfaces', code: 'DES-330', time: '13:00–15:00', room: 'Studio 12', instructor: 'M. Lindqvist', color: '#99f6e4' },
      { subject: 'Homotopy Theory', code: 'MTH-140', time: '16:00–17:30', room: 'Hall B', instructor: 'Prof. Al-Mansoor', color: '#e9d5ff' },
    ],
    [
      { subject: 'Cellular Cybernetics', code: 'BIO-210', time: '10:00–11:30', room: 'Lab 4', instructor: 'Dr. Chen', color: '#99f6e4' },
      { subject: 'Urban Ecology', code: 'ECO-180', time: '14:00–16:00', room: 'Atrium', instructor: 'Dr. Santos', color: '#f472b6' },
    ],
    [
      { subject: 'Quantum Materials', code: 'PHY-301', time: '09:30–11:00', room: 'Pavilion 2', instructor: 'Prof. Vance', color: '#e9d5ff' },
      { subject: 'Orbital Astronomy (Lab)', code: 'AST-204L', time: '13:00–16:00', room: 'Dome 3', instructor: 'Dr. Ito', color: '#f472b6' },
    ],
    [
      { subject: 'Spatial Interfaces', code: 'DES-330', time: '11:00–13:00', room: 'Studio 12', instructor: 'M. Lindqvist', color: '#99f6e4' },
      { subject: 'Ethics in 2095', code: 'PHI-102', time: '15:00–16:30', room: 'Hall A', instructor: 'Dr. Moreau', color: '#fce7f3' },
    ],
    [
      { subject: 'Homotopy Theory (Seminar)', code: 'MTH-140S', time: '10:00–12:00', room: 'Hall B', instructor: 'Prof. Al-Mansoor', color: '#e9d5ff' },
      { subject: 'Campus Studio Ritual', code: 'SEM-099', time: '14:30–16:00', room: 'Greenhouse', instructor: 'Guild', color: '#f472b6' },
    ],
    [
      { subject: 'Open Greenhouse Lab', code: 'LAB-OPEN', time: '10:00–13:00', room: 'Dome 1', instructor: 'Self-Study', color: '#99f6e4' },
    ],
    [
      { subject: 'Quiet Term Reflection', code: 'RITUAL', time: '16:00–18:00', room: 'Library Alcove', instructor: 'Campusly', color: '#f472b6' },
    ]
  ];

  const tasksList = [
    { id: 't1', title: 'Star-chart annotation set', subject: 'AST-204', due: 'Tomorrow · 11:59 PM', urgency: 'High' },
    { id: 't2', title: 'Wayfinding prototype v2', subject: 'DES-330', due: 'Friday · 5:00 PM', urgency: 'Medium' },
    { id: 't3', title: 'Problem set 3 — homotopy', subject: 'MTH-140', due: 'Next Tuesday', urgency: 'Normal' },
    { id: 't4', title: 'Greenhouse plant growth notes', subject: 'BIO-210', due: 'Next Thursday', urgency: 'Normal' }
  ];

  const toggleTask = (id: string) => {
    setActiveTasks(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', color: 'var(--ink)', fontFamily: 'var(--font-sans)', overflowX: 'hidden' }}>
      
      {/* 1. FLOATING LUXURY PILL NAVBAR */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'center',
        padding: '1.2rem 1.5rem',
        pointerEvents: 'none',
        transition: 'all 0.3s ease'
      }}>
        <nav style={{
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
          padding: '0.5rem 0.6rem 0.5rem 1.4rem',
          background: scrolled ? 'rgba(255, 253, 249, 0.94)' : 'rgba(255, 253, 249, 0.85)',
          border: '1px solid var(--line)',
          borderRadius: '9999px',
          boxShadow: 'var(--shadow-lift)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          transition: 'all 0.3s ease'
        }}>
          {/* Logo */}
          <div 
            onClick={onLogoClick}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer' }}
            title="Campusly 2095"
          >
            <PetalMarkSVG size={18} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em', color: 'var(--ink)' }}>
              Campusly
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--ink-faint)', letterSpacing: '0.04em', marginLeft: '0.1rem' }}>
              2095
            </span>
          </div>

          {/* Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.4rem', fontSize: '0.84rem', fontWeight: 600, color: 'var(--ink-soft)' }}>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onClick={() => scrollTo('overview')}>Overview</span>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onClick={() => scrollTo('timetable')}>Timetable</span>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onClick={() => scrollTo('study')}>Study room</span>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onClick={() => scrollTo('life')}>Campus life</span>
          </div>

          {/* Action CTA */}
          <button 
            onClick={onLoginClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'var(--plum)',
              color: 'var(--cream)',
              border: 'none',
              borderRadius: '9999px',
              padding: '0.5rem 1.15rem',
              fontSize: '0.82rem',
              fontWeight: 650,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-soft)',
              transition: 'all 0.25s ease'
            }}
          >
            <span>Enter campus</span>
            <ArrowRight size={13} style={{ color: 'var(--petal)' }} />
          </button>
        </nav>
      </header>

      {/* 2. CINEMATIC HERO SECTION */}
      <section style={{
        position: 'relative',
        minHeight: '100vh',
        background: 'var(--gradient-dawn)',
        padding: '8.5rem 2rem 5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        {/* Subtle grid background */}
        <div className="rule-grid" style={{ position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none' }} />
        
        {/* Ambient rose mist orbs */}
        <div style={{ position: 'absolute', top: '15%', right: '10%', width: '380px', height: '380px', borderRadius: '50%', background: 'rgba(244, 114, 182, 0.18)', filter: 'blur(90px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '5%', width: '420px', height: '420px', borderRadius: '50%', background: 'rgba(233, 213, 255, 0.25)', filter: 'blur(100px)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: '1240px', width: '100%', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: '3.5rem', alignItems: 'center' }}>
          
          {/* Left: Editorial Hero Content with Staggered Fade-in */}
          <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.6rem' }}>
            
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-start' }}>
              <span className="sci-fi-tag" style={{ background: 'rgba(255, 253, 249, 0.8)', padding: '0.3rem 0.75rem', borderRadius: '9999px', border: '1px solid var(--line)' }}>
                SPRING EQUINOX
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-soft)' }}>
                A quiet space for study
              </span>
            </div>

            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.5rem, 5vw, 4.2rem)',
              lineHeight: 1.06,
              fontWeight: 400,
              letterSpacing: '-0.03em',
              color: 'var(--ink)',
              margin: 0
            }}>
              Your campus, <br />
              <span style={{ fontStyle: 'italic', color: 'var(--petal)', fontWeight: 300 }}>reimagined</span> for the <br />
              softer future.
            </h1>

            <p style={{
              fontSize: '1.05rem',
              lineHeight: 1.6,
              color: 'var(--ink-soft)',
              maxWidth: '520px',
              margin: 0
            }}>
              Timetable, attendance, deadlines and study rituals, gathered into one calm room. Campusly keeps the whole academic year breathing quietly in the background — so the day in front of you feels lighter.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <button 
                onClick={onSignUpClick}
                className="interactive-pill-btn"
                style={{
                  background: 'var(--plum)',
                  color: 'var(--cream)',
                  border: 'none',
                  padding: '0.85rem 1.8rem',
                  fontSize: '0.95rem',
                  boxShadow: 'var(--shadow-lift)'
                }}
              >
                <span>Enter campus</span>
                <ArrowRight size={16} style={{ color: 'var(--petal)' }} />
              </button>

              <button 
                onClick={() => scrollTo('overview')}
                className="interactive-pill-btn"
                style={{
                  background: 'rgba(255, 253, 249, 0.7)',
                  color: 'var(--ink)',
                  border: '1px solid var(--line)',
                  padding: '0.85rem 1.5rem',
                  fontSize: '0.92rem',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <span>Take the tour</span>
                <ChevronRight size={15} style={{ color: 'var(--ink-soft)' }} />
              </button>
            </div>

            {/* Micro Live Indicators */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.8rem', paddingTop: '1.2rem', borderTop: '1px solid var(--line)', marginTop: '0.5rem' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--ink-faint)', textTransform: 'uppercase' }}>Academic Rhythm</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--ink)' }}>Spring Equinox</div>
              </div>
              <div style={{ width: '1px', height: '24px', background: 'var(--line)' }} />
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--ink-faint)', textTransform: 'uppercase' }}>Focus Protocol</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--petal)' }}>25m / 5m Breath</div>
              </div>
              <div style={{ width: '1px', height: '24px', background: 'var(--line)' }} />
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--ink-faint)', textTransform: 'uppercase' }}>Status</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--success-text)' }}>● All Systems Calm</div>
              </div>
            </div>

          </div>

          {/* Right: Dreamy Campus Imagery & Layered Glass UI Composition */}
          <div style={{ position: 'relative' }}>
            
            {/* Campus Background Image Frame */}
            <div style={{
              position: 'relative',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lift)',
              border: '1px solid var(--line)',
              aspectRatio: '4/3',
              background: '#f3ece2',
              transition: 'transform 0.4s ease'
            }} className="hover:scale-[1.01]">
              <img 
                src="/assets/hero-campus-DdC_DPYn.jpg" 
                alt="Dreamy futuristic campus dome architecture"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(250, 246, 240, 0.1) 0%, rgba(45, 21, 39, 0.3) 100%)' }} />
            </div>

            {/* Floating Glass Card 1: Upcoming Lecture */}
            <div 
              className="animate-float-slow"
              style={{
                position: 'absolute',
                top: '-18px',
                left: '-24px',
                background: 'rgba(255, 253, 249, 0.88)',
                border: '1px solid var(--line)',
                borderRadius: '18px',
                padding: '1rem 1.2rem',
                boxShadow: 'var(--shadow-lift)',
                backdropFilter: 'blur(20px)',
                width: '260px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span className="sci-fi-tag">[ NEXT SESSION ]</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--petal)', fontWeight: 700 }}>In 20 min</span>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'var(--ink)' }}>
                Orbital Astronomy
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--ink-soft)', marginTop: '0.2rem' }}>
                Dome 3 · Dr. Ito · 09:00–10:30
              </div>
            </div>

            {/* Floating Glass Card 2: Attendance Margin Gauge */}
            <div 
              className="animate-float-reverse"
              style={{
                position: 'absolute',
                bottom: '-28px',
                right: '-16px',
                background: 'rgba(255, 253, 249, 0.92)',
                border: '1px solid var(--line)',
                borderRadius: '20px',
                padding: '1.2rem 1.4rem',
                boxShadow: 'var(--shadow-lift)',
                backdropFilter: 'blur(20px)',
                width: '270px',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}
            >
              {/* Circular Gauge */}
              <div style={{ position: 'relative', width: '54px', height: '54px', flexShrink: 0 }}>
                <svg width="54" height="54" viewBox="0 0 54 54">
                  <circle cx="27" cy="27" r="22" fill="none" stroke="var(--blush)" strokeWidth="4" />
                  <circle 
                    cx="27" 
                    cy="27" 
                    r="22" 
                    fill="none" 
                    stroke="var(--petal)" 
                    strokeWidth="4" 
                    strokeDasharray="138" 
                    strokeDashoffset="11" 
                    strokeLinecap="round"
                    transform="rotate(-90 27 27)"
                  />
                </svg>
                <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: 'var(--ink)' }}>
                  92%
                </span>
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink)' }}>
                  Comfortably Above
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--success-text)', fontWeight: 600, marginTop: '0.1rem' }}>
                  Two absences to spare
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 3. PHILOSOPHY & OVERVIEW SECTION */}
      <section id="overview" style={{ position: 'relative', background: 'var(--cream)', padding: '7rem 2rem' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '0.95fr 1.05fr', gap: '4rem', alignItems: 'center' }}>
            
            {/* Left Corridor Image with Layered Student Reflection */}
            <div style={{ position: 'relative' }}>
              <div style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--line)', boxShadow: 'var(--shadow-lift)', aspectRatio: '3/4' }}>
                <img 
                  src="/assets/corridor-D_ynJ1Z-.jpg" 
                  alt="Collegiate arched hall with warm light" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* Floating Quote Card */}
              <div style={{
                position: 'absolute',
                bottom: '24px',
                left: '-20px',
                right: '20px',
                background: 'rgba(255, 253, 249, 0.94)',
                border: '1px solid var(--line)',
                borderRadius: '16px',
                padding: '1.2rem 1.4rem',
                boxShadow: 'var(--shadow-lift)',
                backdropFilter: 'blur(16px)'
              }}>
                <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '0.98rem', color: 'var(--ink)', lineHeight: 1.45, margin: 0 }}>
                  "The interface steps forward when it matters and disappears when it doesn't."
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.6rem' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--petal)' }} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 650, color: 'var(--ink-soft)' }}>
                    Campusly Design Principle 01
                  </span>
                </div>
              </div>
            </div>

            {/* Right: The 3 Core Pillars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              <span className="sci-fi-tag">[ PHILOSOPHY ]</span>

              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2rem, 3.5vw, 3rem)',
                fontWeight: 400,
                lineHeight: 1.15,
                color: 'var(--ink)',
                margin: 0
              }}>
                Student life is not a <br />
                <span style={{ fontStyle: 'italic', color: 'var(--petal)' }}>dashboard problem</span>. <br />
                It's a rhythm problem.
              </h2>

              <p style={{ fontSize: '0.98rem', lineHeight: 1.6, color: 'var(--ink-soft)', margin: 0 }}>
                Campusly is built around the way a term actually feels — long stretches of quiet, sudden dense weeks, small rituals that hold everything together.
              </p>

              {/* 3 Pillars List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem', marginTop: '0.5rem' }}>
                
                <div style={{ display: 'flex', gap: '1.2rem', padding: '1.2rem', background: 'var(--pearl)', border: '1px solid var(--line)', borderRadius: '18px', boxShadow: 'var(--shadow-soft)' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'var(--blush)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--petal)', flexShrink: 0 }}>
                    <Compass size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--ink)', margin: '0 0 0.3rem 0' }}>One Timeline</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', lineHeight: 1.5, margin: 0 }}>
                      Lectures, labs, deadlines and exams resolved into a single continuous thread instead of six competing apps.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1.2rem', padding: '1.2rem', background: 'var(--pearl)', border: '1px solid var(--line)', borderRadius: '18px', boxShadow: 'var(--shadow-soft)' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(153, 246, 228, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d9488', flexShrink: 0 }}>
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--ink)', margin: '0 0 0.3rem 0' }}>Quiet Intelligence</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', lineHeight: 1.5, margin: 0 }}>
                      Campusly notices the shape of your week and surfaces only what actually needs you today.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1.2rem', padding: '1.2rem', background: 'var(--pearl)', border: '1px solid var(--line)', borderRadius: '18px', boxShadow: 'var(--shadow-soft)' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(233, 213, 255, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', flexShrink: 0 }}>
                    <Coffee size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--ink)', margin: '0 0 0.3rem 0' }}>A Place to Return to</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', lineHeight: 1.5, margin: 0 }}>
                      Study rooms, notes and rituals that feel like a desk by a window, not a productivity console.
                    </p>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 4. TIMETABLE SHOWCASE (NOCTURNAL PLUM PALETTE) */}
      <section id="timetable" style={{
        position: 'relative',
        background: 'var(--plum)',
        color: 'var(--cream)',
        padding: '7rem 2rem',
        overflow: 'hidden'
      }}>
        {/* Deep background grid & radial sheen */}
        <div className="rule-grid" style={{ position: 'absolute', inset: 0, opacity: 0.15, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '450px', height: '450px', borderRadius: '50%', background: 'rgba(244, 114, 182, 0.14)', filter: 'blur(120px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1140px', margin: '0 auto', position: 'relative' }}>
          
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3.5rem' }}>
            <span className="sci-fi-tag" style={{ color: 'var(--petal)', background: 'rgba(244, 114, 182, 0.15)', padding: '0.3rem 0.8rem', borderRadius: '9999px' }}>
              [ TIMETABLE ]
            </span>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.2rem, 4vw, 3.2rem)',
              fontWeight: 400,
              lineHeight: 1.12,
              margin: '1rem 0 0.8rem 0'
            }}>
              Time you can see the <br />
              <span style={{ fontStyle: 'italic', color: 'var(--petal)' }}>shape</span> of.
            </h2>
            <p style={{ fontSize: '0.98rem', color: 'rgba(250, 246, 240, 0.7)', lineHeight: 1.6 }}>
              Every block carries its own light. Density, gaps and the long free afternoon become legible at a glance.
            </p>
          </div>

          {/* Interactive Day Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
            {daysOfWeek.map((day, idx) => (
              <button
                key={day}
                onClick={() => setSelectedDay(idx)}
                style={{
                  background: selectedDay === idx ? 'var(--cream)' : 'rgba(255, 255, 255, 0.07)',
                  color: selectedDay === idx ? 'var(--plum)' : 'var(--cream)',
                  border: selectedDay === idx ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '9999px',
                  padding: '0.5rem 1.4rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.25s ease'
                }}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Schedule Cards for Selected Day */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '1.4rem' }}>
            {timetablePreview[selectedDay].map((item, i) => (
              <div 
                key={i}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  padding: '1.6rem',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1.2rem',
                  transition: 'transform 0.3s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: item.color, fontWeight: 700 }}>
                      {item.code}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'rgba(250, 246, 240, 0.6)' }}>
                      {item.room}
                    </span>
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--cream)', margin: 0 }}>
                    {item.subject}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(250, 246, 240, 0.65)', marginTop: '0.3rem' }}>
                    {item.instructor}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--cream)', fontWeight: 600 }}>
                    <Clock size={14} style={{ color: item.color }} />
                    <span>{item.time}</span>
                  </div>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 5. ATTENDANCE & TASKS SHOWCASE */}
      <section style={{ position: 'relative', background: 'var(--cream-deep)', padding: '7rem 2rem' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
            
            {/* Left: Attendance Circular Gauges */}
            <div style={{ background: 'var(--pearl)', border: '1px solid var(--line)', borderRadius: '24px', padding: '2.5rem', boxShadow: 'var(--shadow-soft)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.8rem' }}>
                <div>
                  <span className="sci-fi-tag">[ ATTENDANCE ENGINE ]</span>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: 600, color: 'var(--ink)', margin: '0.4rem 0 0 0' }}>
                    Small measures, kept gently.
                  </h3>
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--petal)', fontFamily: 'var(--font-mono)' }}>
                  94.2%
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                
                {[
                  { subject: 'Orbital Astronomy', code: 'AST-204', pct: 92, safe: '+2 absences reserved' },
                  { subject: 'Spatial Interfaces', code: 'DES-330', pct: 96, safe: '+3 absences reserved' },
                  { subject: 'Homotopy Theory', code: 'MTH-140', pct: 95, safe: '+2 absences reserved' }
                ].map((s, idx) => (
                  <div key={idx} style={{ padding: '1rem 1.2rem', background: 'var(--cream)', borderRadius: '16px', border: '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <div>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--ink)' }}>{s.subject}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--ink-faint)', marginLeft: '0.5rem', fontFamily: 'var(--font-mono)' }}>{s.code}</span>
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--ink)' }}>{s.pct}%</span>
                    </div>

                    <div style={{ height: '6px', background: 'rgba(45, 21, 39, 0.08)', borderRadius: '9999px', overflow: 'hidden', margin: '0.6rem 0 0.4rem' }}>
                      <div style={{ width: s.pct + '%', height: '100%', background: 'var(--petal)', borderRadius: '9999px' }} />
                    </div>

                    <div style={{ fontSize: '0.72rem', color: 'var(--success-text)', fontWeight: 600 }}>
                      ✓ {s.safe}
                    </div>
                  </div>
                ))}

              </div>
            </div>

            {/* Right: Tasks & Deadlines Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
              
              <span className="sci-fi-tag">[ TASK TIMELINE ]</span>

              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', fontWeight: 400, color: 'var(--ink)', margin: 0, lineHeight: 1.18 }}>
                Assignments resolved into <br />
                <span style={{ fontStyle: 'italic', color: 'var(--petal)' }}>a clear, quiet thread</span>.
              </h2>

              <p style={{ fontSize: '0.95rem', color: 'var(--ink-soft)', lineHeight: 1.55, margin: 0 }}>
                No messy backlogs. Clear deadline markers with subject categorization keep your days organized and tranquil.
              </p>

              {/* Task Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {tasksList.map(task => {
                  const isChecked = activeTasks.includes(task.id);
                  return (
                    <div 
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1rem 1.2rem',
                        background: 'var(--pearl)',
                        border: '1px solid var(--line)',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-soft)',
                        transition: 'all 0.2s ease',
                        opacity: isChecked ? 0.6 : 1
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                        <div style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '6px',
                          border: isChecked ? 'none' : '1.5px solid var(--line)',
                          background: isChecked ? 'var(--petal)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          transition: 'all 0.2s ease'
                        }}>
                          {isChecked && <Check size={14} />}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 650, color: 'var(--ink)', textDecoration: isChecked ? 'line-through' : 'none' }}>
                            {task.title}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', marginTop: '0.15rem' }}>
                            {task.subject} · {task.due}
                          </div>
                        </div>
                      </div>

                      <span className="sci-fi-tag" style={{ fontSize: '0.6rem' }}>
                        {task.urgency}
                      </span>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 6. STUDY ROOM PARALLAX ALCOVE */}
      <section id="study" style={{ position: 'relative', background: 'var(--plum)', color: 'var(--cream)', minHeight: '680px', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        
        {/* Parallax Background Image */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.4 }}>
          <img 
            src="/assets/study-nook-DITl-i_n.jpg" 
            alt="Warm cozy study alcove at dusk"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(45, 21, 39, 0.95) 0%, rgba(45, 21, 39, 0.6) 50%, rgba(45, 21, 39, 0.95) 100%)' }} />

        <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '6rem 2rem', position: 'relative', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
          
          <div>
            <span className="sci-fi-tag" style={{ color: 'var(--petal)', background: 'rgba(244, 114, 182, 0.15)', padding: '0.3rem 0.8rem', borderRadius: '9999px' }}>
              [ STUDY RITUALS ]
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', fontWeight: 400, lineHeight: 1.12, margin: '1rem 0 1.2rem 0' }}>
              A room that stays warm <br />
              <span style={{ fontStyle: 'italic', color: 'var(--petal)' }}>while you work</span>.
            </h2>
            <p style={{ fontSize: '1rem', color: 'rgba(250, 246, 240, 0.8)', lineHeight: 1.65, margin: '0 0 2rem 0' }}>
              No gamified guilt meters or distracting badges. Just a desk by the window, a breathing Pomodoro timer, ambient rain and lo-fi audio to immerse yourself in deep learning.
            </p>

            <button 
              onClick={onLoginClick}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                background: 'var(--petal)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '9999px',
                padding: '0.85rem 1.8rem',
                fontSize: '0.92rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-glow)',
                transition: 'all 0.3s ease'
              }}
            >
              <Play size={15} fill="#ffffff" />
              <span>Open Study Room</span>
            </button>
          </div>

          {/* Floating Study Alcove Card */}
          <div style={{
            background: 'rgba(255, 253, 249, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '24px',
            padding: '2.2rem',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.6rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Coffee size={18} style={{ color: 'var(--petal)' }} />
                <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>Library 3rd Floor Alcove</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--mint)', fontFamily: 'var(--font-mono)' }}>● Rain Audio Active</span>
            </div>

            {/* Breathing Pomodoro Display */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 0' }}>
              <div style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                border: '3px solid rgba(244, 114, 182, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 35px rgba(244, 114, 182, 0.25)',
                background: 'rgba(45, 21, 39, 0.4)'
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2.2rem', fontWeight: 700, color: 'var(--cream)', letterSpacing: '0.04em' }}>
                  25:00
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--petal)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '0.2rem' }}>
                  Deep Focus
                </span>
              </div>
            </div>

            {/* Audio & Session Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <div style={{ padding: '0.75rem', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.75rem' }}>
                <div style={{ color: 'rgba(250, 246, 240, 0.6)' }}>Mood</div>
                <div style={{ fontWeight: 700, color: 'var(--cream)', marginTop: '0.2rem' }}>Rain on Glass 🌧️</div>
              </div>
              <div style={{ padding: '0.75rem', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.75rem' }}>
                <div style={{ color: 'rgba(250, 246, 240, 0.6)' }}>Focus Logged</div>
                <div style={{ fontWeight: 700, color: 'var(--petal)', marginTop: '0.2rem' }}>1h 48m today</div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 7. CAMPUS LIFE GALLERY */}
      <section id="life" style={{ position: 'relative', background: 'var(--cream)', padding: '7rem 2rem' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', maxWidth: '620px', margin: '0 auto 3.5rem' }}>
            <span className="sci-fi-tag">[ CAMPUS LIFE ]</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem, 4vw, 3rem)', fontWeight: 400, color: 'var(--ink)', margin: '0.8rem 0 0.8rem 0' }}>
              The year leaves <br />
              <span style={{ fontStyle: 'italic', color: 'var(--petal)' }}>traces on you</span>.
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--ink-soft)', lineHeight: 1.6 }}>
              Campusly quietly collects the texture of your term — the seminars you never missed, the quiet library mornings, the margins you filled. Not points to chase. A record to keep.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.6rem' }}>
            
            <div style={{ background: 'var(--pearl)', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--line)', boxShadow: 'var(--shadow-soft)' }}>
              <div style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
                <img src="/assets/still-stationery-D_5E6dNw.jpg" alt="Study desk stationery" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '1.4rem' }}>
                <span className="sci-fi-tag" style={{ fontSize: '0.6rem' }}>RITUAL 01</span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--ink)', margin: '0.4rem 0 0.3rem 0' }}>Desk by the Window</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', lineHeight: 1.5, margin: 0 }}>
                  A daily place where ideas settle quietly without notification clutter.
                </p>
              </div>
            </div>

            <div style={{ background: 'var(--pearl)', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--line)', boxShadow: 'var(--shadow-soft)' }}>
              <div style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
                <img src="/assets/petals-paper-CBABZWG0.jpg" alt="Petals on handmade paper" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '1.4rem' }}>
                <span className="sci-fi-tag" style={{ fontSize: '0.6rem' }}>RITUAL 02</span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--ink)', margin: '0.4rem 0 0.3rem 0' }}>Equinox Term Record</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', lineHeight: 1.5, margin: 0 }}>
                  Attendance streaks and completed course projects recorded gently.
                </p>
              </div>
            </div>

            <div style={{ background: 'var(--pearl)', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--line)', boxShadow: 'var(--shadow-soft)' }}>
              <div style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
                <img src="/assets/hero-campus-DdC_DPYn.jpg" alt="Campus architecture" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '1.4rem' }}>
                <span className="sci-fi-tag" style={{ fontSize: '0.6rem' }}>RITUAL 03</span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--ink)', margin: '0.4rem 0 0.3rem 0' }}>The Softer Campus</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', lineHeight: 1.5, margin: 0 }}>
                  2095 aesthetics designed for students who value focus, beauty and calm.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 8. BOTTOM CALL-TO-ACTION & EDITORIAL FOOTER */}
      <section style={{
        position: 'relative',
        background: 'var(--gradient-dawn)',
        padding: '8rem 2rem 6rem',
        textAlign: 'center',
        overflow: 'hidden'
      }}>
        <div className="rule-grid" style={{ position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: '640px', margin: '0 auto' }}>
          
          <PetalMarkSVG size={32} style={{ margin: '0 auto 1.2rem' }} />

          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.4rem, 4.5vw, 3.6rem)',
            fontWeight: 400,
            lineHeight: 1.1,
            color: 'var(--ink)',
            margin: '0 0 1rem 0'
          }}>
            Come and see <br />
            <span style={{ fontStyle: 'italic', color: 'var(--petal)' }}>the campus</span>.
          </h2>

          <p style={{ fontSize: '1.05rem', color: 'var(--ink-soft)', lineHeight: 1.6, margin: '0 0 2rem 0' }}>
            No setup ceremony. Open Campusly and your academic week is already waiting, arranged.
          </p>

          <button 
            onClick={onLoginClick}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              background: 'var(--plum)',
              color: 'var(--cream)',
              border: 'none',
              borderRadius: '9999px',
              padding: '0.9rem 2.2rem',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-lift)',
              transition: 'all 0.3s ease'
            }}
          >
            <span>Enter campus</span>
            <ArrowRight size={16} style={{ color: 'var(--petal)' }} />
          </button>

        </div>
      </section>

      {/* Editorial Plum Footer */}
      <footer style={{ background: 'var(--plum)', color: 'var(--cream)', padding: '4rem 2rem 2.5rem', position: 'relative' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PetalMarkSVG size={20} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700 }}>Campusly</span>
            <span style={{ fontSize: '0.7rem', color: 'rgba(250, 246, 240, 0.5)', fontFamily: 'var(--font-mono)' }}>2095 Edition</span>
          </div>

          <div style={{ display: 'flex', gap: '1.8rem', fontSize: '0.82rem', color: 'rgba(250, 246, 240, 0.7)' }}>
            <span style={{ cursor: 'pointer' }} onClick={() => scrollTo('overview')}>Overview</span>
            <span style={{ cursor: 'pointer' }} onClick={() => scrollTo('timetable')}>Timetable</span>
            <span style={{ cursor: 'pointer' }} onClick={() => scrollTo('study')}>Study room</span>
            <span style={{ cursor: 'pointer' }} onClick={() => scrollTo('life')}>Campus life</span>
          </div>
        </div>

        <div style={{ maxWidth: '1140px', margin: '1.8rem auto 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'rgba(250, 246, 240, 0.45)' }}>
          <span>© 2095 Campusly. A quieter way to be a student.</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>[ TERM 01 / EQUINOX ]</span>
        </div>
      </footer>

    </div>
  );
};
