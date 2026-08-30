import React, { useEffect, useState } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { MapPin, Clock, Check } from 'lucide-react';

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
  type?: string;
  event_type?: string;
  title?: string;
  is_moved?: boolean;
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

export const Dashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  // Configurable Attendance Threshold (Default 75%)
  const [threshold] = useState<number>(() => {
    const saved = localStorage.getItem('campusly_attendance_threshold');
    return saved ? parseInt(saved, 10) : 75;
  });

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

  const nextClass = data.classesToday && data.classesToday.length > 0 ? data.classesToday[0] : null;
  const attendancePct = data.stats?.averageAttendance || 92;

  // Dynamic status evaluation
  const isAbove = attendancePct > threshold;
  const isAt = attendancePct === threshold;
  const statusLabel = isAbove ? '● Above Threshold' : isAt ? '● At Threshold' : '▲ Below Threshold';
  const statusColor = (isAbove || isAt) ? 'var(--success-text)' : 'var(--danger)';

  return (
    <div className="animate-page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', maxWidth: '1240px', margin: '0 auto', paddingBottom: '3.5rem' }}>
      
      {/* 1. EDITORIAL HEADLINE DIRECTLY ON CANVAS */}
      <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '2rem' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span className="sci-fi-tag">TODAY'S RHYTHM</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>
            <span>Spring Term · Week 4</span>
            <span style={{ color: 'var(--petal)' }}>●</span>
          </div>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.1rem, 3.8vw, 3rem)',
          fontWeight: 400,
          lineHeight: 1.08,
          letterSpacing: '-0.03em',
          color: 'var(--ink)',
          margin: 0
        }}>
          {getGreeting()}, <span style={{ fontStyle: 'italic', color: 'var(--petal)', fontWeight: 300 }}>{user?.username}</span>. <br />
          The day is arranged.
        </h1>

        <p style={{
          fontSize: '0.98rem',
          lineHeight: 1.55,
          color: 'var(--ink-soft)',
          marginTop: '0.8rem',
          maxWidth: '640px',
          margin: '0.8rem 0 0 0'
        }}>
          {data.classesToday.length > 0 
            ? `You have ${data.classesToday.length} ${data.classesToday.length === 1 ? 'class session' : 'class sessions'} scheduled across the day. Attendance is holding comfortably.`
            : 'No scheduled lectures on your timetable today. The day is open for deep work, library reading, or quiet reflection.'}
        </p>

      </div>

      {/* 2. OPEN-CANVAS ASYMMETRIC SECTION: NEXT CLASS SPOTLIGHT + OPEN STAT METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: '3rem', alignItems: 'flex-start' }}>
        
        {/* Left: Next Class Architectural Feature */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem', borderBottom: '1px solid var(--line)', paddingBottom: '0.4rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.08em', color: 'var(--ink-faint)', textTransform: 'uppercase' }}>
              Next Scheduled Session
            </span>
            {nextClass && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--petal)', fontWeight: 700 }}>
                {nextClass.start_time}–{nextClass.end_time}
              </span>
            )}
          </div>

          {nextClass ? (
            <div style={{ padding: '0.6rem 0' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700, color: nextClass.subject_color || 'var(--petal)' }}>
                {nextClass.subject_code}
              </span>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.7rem, 2.8vw, 2.3rem)',
                fontWeight: 500,
                lineHeight: 1.15,
                color: 'var(--ink)',
                margin: '0.3rem 0 0.8rem 0'
              }}>
                {nextClass.subject_name}
              </h2>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.8rem', fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
                {nextClass.location && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MapPin size={14} style={{ color: 'var(--petal)' }} />
                    {nextClass.location}
                  </span>
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={14} style={{ color: 'var(--ink-faint)' }} />
                  In preparation
                </span>
              </div>
            </div>
          ) : (
            <div style={{ padding: '1.5rem 0' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.25rem', color: 'var(--ink)', margin: 0 }}>
                "The quiet term leaves space to think."
              </p>
              <p style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', marginTop: '0.4rem' }}>
                All scheduled classes concluded for today.
              </p>
            </div>
          )}
        </div>

        {/* Right: Open Canvas Stat Callouts with Fine Rules */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.6rem', borderLeft: '1px solid var(--line)', paddingLeft: '2rem' }}>
          
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Attendance Standing (Req: {threshold}%)
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', margin: '0.2rem 0' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem', fontWeight: 400, lineHeight: 1, color: 'var(--ink)' }}>
                {attendancePct}%
              </span>
              <span style={{ fontSize: '0.78rem', color: statusColor, fontWeight: 700 }}>
                {statusLabel}
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', lineHeight: 1.45, margin: 0 }}>
              Evaluated against your {threshold}% configured requirement across {data.stats?.totalSubjects || 5} courses.
            </p>
          </div>

          <div style={{ borderTop: '1px solid var(--line)', paddingTop: '1.2rem' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Focus Protocol
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 500, color: 'var(--ink)', margin: '0.2rem 0' }}>
              25m / 5m Breath
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', lineHeight: 1.45, margin: 0 }}>
              Rain audio ready in Study Room.
            </p>
          </div>

        </div>

      </div>

      {/* 3. SCHEDULE LEDGER & DELIVERABLES */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '3.5rem', borderTop: '1px solid var(--line)', paddingTop: '2.5rem' }}>
        
        {/* Today's Schedule Ledger */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, color: 'var(--ink)', margin: 0 }}>
              Today's Lectures
            </h3>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--ink-faint)' }}>
              {data.classesToday.length} {data.classesToday.length === 1 ? 'BLOCK' : 'BLOCKS'}
            </span>
          </div>

          {data.classesToday.length === 0 ? (
            <div style={{ padding: '2.5rem 0', color: 'var(--ink-faint)', fontSize: '0.88rem', fontStyle: 'italic' }}>
              No lectures scheduled for today.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {data.classesToday.map((c, i) => (
                <div 
                  key={c.id || i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 0',
                    borderBottom: '1px solid var(--line)',
                    transition: 'background 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: c.subject_color || 'var(--petal)', fontWeight: 700, width: '65px' }}>
                      {c.subject_code}
                    </span>
                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--ink)' }}>{c.subject_name}</div>
                      {c.location && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', marginTop: '0.1rem' }}>
                          {c.location}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--ink)', fontWeight: 600 }}>
                    {c.start_time}–{c.end_time}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Priority Deliverables Thread */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, color: 'var(--ink)', margin: 0 }}>
              Tasks & Deliverables
            </h3>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--ink-faint)' }}>
              {data.upcomingAssignments?.length || 0} PENDING
            </span>
          </div>

          {!data.upcomingAssignments || data.upcomingAssignments.length === 0 ? (
            <div style={{ padding: '2.5rem 0', color: 'var(--ink-faint)', fontSize: '0.88rem', fontStyle: 'italic' }}>
              All current tasks resolved.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {data.upcomingAssignments.slice(0, 5).map(task => {
                const isChecked = completedTasks.includes(task.id);
                return (
                  <div 
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.95rem 0',
                      borderBottom: '1px solid var(--line)',
                      cursor: 'pointer',
                      opacity: isChecked ? 0.45 : 1,
                      transition: 'opacity 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '3px',
                        border: isChecked ? 'none' : '1.5px solid var(--line)',
                        background: isChecked ? 'var(--petal)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        flexShrink: 0
                      }}>
                        {isChecked && <Check size={11} />}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--ink)', textDecoration: isChecked ? 'line-through' : 'none' }}>
                          {task.title}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--ink-faint)', marginTop: '0.1rem' }}>
                          {task.subject_name || task.subject_code}
                        </div>
                      </div>
                    </div>

                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-soft)' }}>
                      {task.due_date ? new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Soon'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
