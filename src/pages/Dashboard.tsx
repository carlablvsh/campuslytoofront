import React, { useEffect, useState } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { Check, ArrowRight } from 'lucide-react';

interface ClassToday {
  id: string;
  subject_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  location: string;
  subject_name: string;
  subject_code: string;
  subject_color: string;
  instructor?: string;
  type?: string;
}

interface Assignment {
  id: string;
  subject_id: string;
  title: string;
  description: string;
  due_date: string;
  status: string;
  subject_name: string;
  subject_code: string;
  subject_color: string;
}

interface Exam {
  id: string;
  subject_id: string;
  title: string;
  date: string;
  start_time: string;
  location: string;
  syllabus: string;
  subject_name: string;
  subject_code: string;
  subject_color: string;
}

interface DashboardData {
  classesToday: ClassToday[];
  upcomingAssignments: Assignment[];
  nextExam: Exam | null;
  upcomingExams?: Exam[];
  activeBreak: { name: string, start_date: string, end_date: string } | null;
  stats: {
    averageAttendance: number;
    totalPendingAssignments: number;
    totalSubjects: number;
  };
}

interface DashboardProps {
  onNavigate?: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, token } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error('Failed to fetch today overview.');
        const result = await res.json();
        setData(result);
      } catch (err: any) {
        setError(err.message || 'Error loading dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchDashboard();
    }
  }, [token]);

  const toggleTask = (id: string) => {
    setCompletedTasks(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getTodayFormatted = () => {
    return new Date().toLocaleDateString(undefined, { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    }).toUpperCase();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--ink-soft)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.15rem' }}>
          Opening today's campus rhythm... ✧
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '3rem 2rem', textAlign: 'center', border: '1px solid var(--line)', margin: '2rem 0', borderRadius: '4px' }}>
        <p style={{ color: 'var(--danger)', fontSize: '0.92rem' }}>{error || 'Could not load today view.'}</p>
      </div>
    );
  }

  const classesCount = data.classesToday?.length || 0;
  const classesWord = classesCount === 0 
    ? 'No classes' 
    : classesCount === 1 
      ? 'One class' 
      : classesCount === 2 
        ? 'Two classes' 
        : `${classesCount} classes`;

  const nextClass = data.classesToday && data.classesToday.length > 0 ? data.classesToday[0] : null;
  const attendancePct = Math.round(data.stats?.averageAttendance || 0);
  const nextExam = data.nextExam || (data.upcomingExams && data.upcomingExams.length > 0 ? data.upcomingExams[0] : null);

  // SVG Gauge calculations
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (attendancePct / 100) * circumference;

  const upcomingAssignments = data.upcomingAssignments || [];

  return (
    <div className="animate-page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1180px', margin: '0 auto', paddingBottom: '3.5rem' }}>
      
      {/* 1. HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', paddingTop: '0.5rem' }}>
        <div>
          {/* Eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
            <span style={{ width: '16px', height: '1px', background: 'var(--ink-faint)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 650, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
              {getTodayFormatted()}
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.1rem, 4vw, 3.2rem)',
            fontWeight: 400,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            color: 'var(--ink)',
            margin: 0
          }}>
            {getGreeting()}, {user?.username || 'Student'}. <br />
            <span style={{ fontStyle: 'italic', color: '#e11d48', fontWeight: 300 }}>{classesWord}</span> and a soft afternoon.
          </h1>
        </div>

        {/* Right Status Tag */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.35rem 0.85rem',
          borderRadius: '9999px',
          background: 'rgba(255, 255, 255, 0.8)',
          border: '1px solid var(--line)',
          fontSize: '0.68rem',
          fontFamily: 'var(--font-mono)',
          fontWeight: 650,
          color: 'var(--ink-soft)',
          boxShadow: '0 1px 3px rgba(45, 21, 39, 0.03)'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
          <span>CAMPUS CALM</span>
        </div>
      </div>

      {/* 2. THE 4 SYMMETRICAL CARDS GRID (2x2) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
        gap: '1.4rem',
        marginTop: '0.5rem'
      }}>
        
        {/* CARD 1: NEXT UP CLASS SESSION */}
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--line)',
          borderRadius: '6px',
          padding: '1.6rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '230px',
          boxShadow: '0 1px 3px rgba(45, 21, 39, 0.04)'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
                NEXT UP
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--ink-faint)' }}>
                {nextClass ? `${nextClass.start_time}–${nextClass.end_time}` : 'Completed'}
              </span>
            </div>

            {nextClass ? (
              <>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: nextClass.subject_color || '#0d9488', fontWeight: 700, marginBottom: '0.2rem' }}>
                  {nextClass.subject_code}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h2 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.75rem',
                    fontWeight: 400,
                    lineHeight: 1.15,
                    color: 'var(--ink)',
                    margin: '0 0 0.4rem 0'
                  }}>
                    {nextClass.subject_name}
                  </h2>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.75 }}>
                    <path d="M12 2C8.5 7.5 4 10.5 4 14.5C4 18.5 7.5 22 12 22C16.5 22 20 18.5 20 14.5C20 10.5 15.5 7.5 12 2Z" fill="#f472b6" />
                  </svg>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', marginTop: '0.2rem' }}>
                  {nextClass.start_time}–{nextClass.end_time} {nextClass.location ? `· ${nextClass.location}` : ''} {nextClass.instructor ? `· ${nextClass.instructor}` : ''}
                </div>
              </>
            ) : (
              <div style={{ padding: '1rem 0' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.15rem', color: 'var(--ink)', margin: 0 }}>
                  "No lectures scheduled for today."
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--ink-faint)', marginTop: '0.3rem' }}>
                  Enjoy your study sessions or open work time.
                </p>
              </div>
            )}
          </div>

          {/* Schedule pills below */}
          {data.classesToday.length > 0 ? (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '1.2rem', borderTop: '1px solid var(--line)', marginTop: '1rem' }}>
              {data.classesToday.map((c, i) => (
                <span 
                  key={c.id || i}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    fontWeight: 650,
                    padding: '0.25rem 0.6rem',
                    borderRadius: '4px',
                    background: i === 0 ? 'rgba(153, 246, 228, 0.25)' : 'rgba(45, 21, 39, 0.04)',
                    color: i === 0 ? '#0f766e' : 'var(--ink-soft)',
                    border: '1px solid rgba(45, 21, 39, 0.06)'
                  }}
                >
                  {c.start_time} · {c.subject_code}
                </span>
              ))}
            </div>
          ) : (
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: '0.9rem', marginTop: '1rem' }}>
              <button 
                onClick={() => onNavigate && onNavigate('timetable')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: '#e11d48',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <span>VIEW TIMETABLE</span>
                <ArrowRight size={12} />
              </button>
            </div>
          )}
        </div>

        {/* CARD 2: ATTENDANCE */}
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--line)',
          borderRadius: '6px',
          padding: '1.6rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '230px',
          boxShadow: '0 1px 3px rgba(45, 21, 39, 0.04)'
        }}>
          <div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
              ATTENDANCE
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.8rem', marginTop: '1rem' }}>
              {/* Circular Gauge */}
              <div style={{ position: 'relative', width: '68px', height: '68px', flexShrink: 0 }}>
                <svg width="68" height="68" viewBox="0 0 68 68">
                  <circle cx="34" cy="34" r={radius} fill="none" stroke="rgba(244, 114, 182, 0.18)" strokeWidth="5" />
                  <circle 
                    cx="34" 
                    cy="34" 
                    r={radius} 
                    fill="none" 
                    stroke="#f472b6" 
                    strokeWidth="5" 
                    strokeDasharray={circumference} 
                    strokeDashoffset={strokeDashoffset} 
                    strokeLinecap="round"
                    transform="rotate(-90 34 34)"
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                </svg>
                <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: 800, color: 'var(--ink)' }}>
                  {attendancePct}%
                </span>
              </div>

              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, color: 'var(--ink)', lineHeight: 1 }}>
                  {data.stats?.totalSubjects || 0}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.06em', color: 'var(--ink-faint)', textTransform: 'uppercase', marginTop: '0.2rem' }}>
                  MODULES TRACKED
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: attendancePct >= 75 ? '#0d9488' : '#ef4444', marginTop: '0.35rem' }}>
                  {attendancePct >= 75 ? '● Above Target' : '▲ Below Target'}
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--line)', paddingTop: '0.9rem', marginTop: '1rem' }}>
            <button 
              onClick={() => onNavigate && onNavigate('attendance')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                fontWeight: 700,
                color: '#e11d48',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <span>OPEN REGISTER</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {/* CARD 3: DUE SOON TASKS */}
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--line)',
          borderRadius: '6px',
          padding: '1.6rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '230px',
          boxShadow: '0 1px 3px rgba(45, 21, 39, 0.04)'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
                DUE SOON
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--ink-faint)' }}>
                {upcomingAssignments.length} open
              </span>
            </div>

            {/* Checklist items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.5rem' }}>
              {upcomingAssignments.length > 0 ? (
                upcomingAssignments.slice(0, 4).map((task, idx) => {
                  const isChecked = completedTasks.includes(task.id);
                  const dotColor = idx % 2 === 0 ? '#f472b6' : '#99f6e4';
                  return (
                    <div 
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        opacity: isChecked ? 0.45 : 1,
                        transition: 'opacity 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          border: isChecked ? 'none' : '1.5px solid var(--line)',
                          background: isChecked ? '#e11d48' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          flexShrink: 0
                        }}>
                          {isChecked && <Check size={10} />}
                        </div>
                        <span style={{ color: 'var(--ink)', fontWeight: 500, textDecoration: isChecked ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {task.title}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--ink-faint)', textTransform: 'uppercase', flexShrink: 0 }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: dotColor }} />
                        <span>{task.due_date ? new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: '2-digit' }) : 'Pending'}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '1rem 0', color: 'var(--ink-faint)', fontSize: '0.82rem', fontStyle: 'italic' }}>
                  No pending deliverables due.
                </div>
              )}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--line)', paddingTop: '0.9rem', marginTop: '1rem' }}>
            <button 
              onClick={() => onNavigate && onNavigate('tasks')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                fontWeight: 700,
                color: '#e11d48',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <span>VIEW ALL DELIVERABLES</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {/* CARD 4: NEXT ASSESSMENT (NOCTURNAL PLUM REFERENCE CARD) */}
        <div style={{
          background: 'linear-gradient(135deg, #2d1527 0%, #1f0e1b 100%)',
          color: '#ffffff',
          borderRadius: '6px',
          padding: '1.6rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '230px',
          boxShadow: '0 1px 3px rgba(45, 21, 39, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(250, 246, 240, 0.6)' }}>
              NEXT ASSESSMENT
            </span>

            {nextExam ? (
              <>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.7rem',
                  fontWeight: 400,
                  color: '#fffdf9',
                  lineHeight: 1.15,
                  margin: '0.8rem 0 0.2rem 0'
                }}>
                  {nextExam.title}
                </h2>
                <div style={{ fontSize: '0.78rem', color: 'rgba(250, 246, 240, 0.65)' }}>
                  {nextExam.subject_name ? `${nextExam.subject_name}` : ''} {nextExam.location ? `· ${nextExam.location}` : ''}
                </div>

                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2.4rem',
                  fontWeight: 300,
                  color: '#f472b6',
                  marginTop: '0.8rem',
                  lineHeight: 1
                }}>
                  {nextExam.date ? new Date(nextExam.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Upcoming'}
                </div>
              </>
            ) : (
              <div style={{ padding: '1rem 0' }}>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.4rem',
                  fontWeight: 400,
                  color: '#fffdf9',
                  lineHeight: 1.2,
                  margin: '0.8rem 0 0.4rem 0'
                }}>
                  No upcoming assessments
                </h2>
                <p style={{ fontSize: '0.78rem', color: 'rgba(250, 246, 240, 0.6)', margin: 0 }}>
                  All clear for the current cycle.
                </p>
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '0.9rem', marginTop: '1rem' }}>
            <button 
              onClick={() => onNavigate && onNavigate('exams')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                fontWeight: 700,
                color: '#f472b6',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <span>ALL ASSESSMENTS</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
