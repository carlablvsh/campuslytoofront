import React, { useEffect, useState } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { Calendar, Clock, MapPin, Heart, GraduationCap, ClipboardList } from 'lucide-react';

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
  stats: {
    averageAttendance: number;
    totalPendingAssignments: number;
    totalSubjects: number;
  };
}

// Custom Cute SVGs for cutesy pinterest design
const WelcomeCloud: React.FC = () => (
  <svg viewBox="0 0 120 100" width="110" height="90" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.05))' }}>
    {/* Cloud Body */}
    <path 
      d="M25,65 C18,65 12,59 12,52 C12,46 17,40 23,39 C24,24 37,12 52,12 C64,12 74,19 78,30 C80,26 84,24 88,24 C96,24 102,30 102,38 C102,40 101,42 100,43 C105,46 108,51 108,57 C108,63 103,68 97,68 L25,68 Z" 
      fill="#dbeafe" 
    />
    <path 
      d="M25,60 C20,60 16,56 16,51 C16,46 20,41 25,40 C27,27 38,16 52,16 C63,16 72,23 75,33 C78,30 82,28 86,28 C93,28 98,33 98,40 C98,41 97,43 96,44 C100,47 103,52 103,57 C103,62 98,66 93,66 L25,66 Z" 
      fill="#e0e7ff" 
    />
    <path 
      d="M28,62 C24,62 21,59 21,55 C21,51 24,47 28,47 C29,35 39,25 52,25 C62,25 70,32 73,41 C75,38 78,36 82,36 C88,36 93,41 93,47 C93,48 92,49 92,50 C96,52 98,56 98,60 C98,64 94,67 89,67 L28,67 Z" 
      fill="#eef2ff" 
    />
    {/* Bow 🎀 */}
    <path d="M78,28 C76,26 73,26 73,28 C73,30 75,32 78,30" fill="#f472b6" />
    <path d="M83,28 C85,26 88,26 88,28 C88,30 86,32 83,30" fill="#f472b6" />
    <circle cx="80.5" cy="29" r="2.5" fill="#db2777" />
    {/* Eyes */}
    <circle cx="43" cy="45" r="2" fill="#312e81" />
    <circle cx="61" cy="45" r="2" fill="#312e81" />
    {/* Rosy Cheeks */}
    <circle cx="39" cy="48" r="3.5" fill="#fca5a5" opacity="0.6" />
    <circle cx="65" cy="48" r="3.5" fill="#fca5a5" opacity="0.6" />
    {/* Smile */}
    <path d="M50,47 Q52,49 54,47" stroke="#312e81" strokeWidth="1.5" strokeLinecap="round" fill="transparent" />
    {/* Cup in hands */}
    <rect x="47" y="52" width="10" height="9" rx="2" fill="#fbcfe8" />
    <path d="M57,54 C59,54 60,55 60,56 C60,57 59,58 57,58" stroke="#db2777" strokeWidth="1" fill="transparent" />
  </svg>
);

const SleepingCloud: React.FC = () => (
  <svg viewBox="0 0 120 90" width="100" height="75" style={{ margin: '0 auto', display: 'block' }}>
    <path 
      d="M25,60 C18,60 12,54 12,47 C12,41 17,35 23,34 C24,19 37,7 52,7 C64,7 74,14 78,25 C80,21 84,19 88,19 C96,19 102,25 102,33 C102,35 101,37 100,38 C105,41 108,46 108,52 C108,58 103,63 97,63 L25,63 Z" 
      fill="#eff6ff" 
    />
    <path 
      d="M28,58 C24,58 21,55 21,51 C21,47 24,43 28,43 C29,31 39,21 52,21 C62,21 70,28 73,37 C75,34 78,32 82,32 C88,32 93,37 93,43 C93,44 92,45 92,46 C96,48 98,52 98,56 C98,60 94,63 89,63 L28,63 Z" 
      fill="#f8fafc" 
    />
    {/* Eyes closed (Zzz sleeping) */}
    <path d="M42,43 Q45,46 48,43" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" fill="transparent" />
    <path d="M58,43 Q61,46 64,43" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" fill="transparent" />
    <circle cx="39" cy="46" r="2.5" fill="#fecdd3" opacity="0.6" />
    <circle cx="67" cy="46" r="2.5" fill="#fecdd3" opacity="0.6" />
    {/* Zzz text bubbles */}
    <text x="80" y="24" fill="#a78bfa" fontSize="10" fontWeight="bold">Z</text>
    <text x="88" y="16" fill="#c084fc" fontSize="12" fontWeight="bold">z</text>
    <text x="96" y="8" fill="#e9d5ff" fontSize="14" fontWeight="bold">z</text>
  </svg>
);

const CuteClipboard: React.FC = () => (
  <svg viewBox="0 0 100 100" width="80" height="80" style={{ margin: '0 auto', display: 'block' }}>
    {/* Board */}
    <rect x="25" y="22" width="50" height="64" rx="6" fill="#e0e7ff" stroke="#a5b4fc" strokeWidth="1.5" />
    <rect x="29" y="26" width="42" height="56" rx="4" fill="#ffffff" />
    {/* Header Clip */}
    <rect x="40" y="14" width="20" height="10" rx="3" fill="#cbd5e1" />
    <circle cx="50" cy="19" r="2" fill="#94a3b8" />
    {/* Checklist lines */}
    <line x1="36" y1="38" x2="64" y2="38" stroke="#f1f5f9" strokeWidth="3" strokeLinecap="round" />
    <line x1="36" y1="48" x2="64" y2="48" stroke="#f1f5f9" strokeWidth="3" strokeLinecap="round" />
    <line x1="36" y1="58" x2="64" y2="58" stroke="#f1f5f9" strokeWidth="3" strokeLinecap="round" />
    {/* Big Pink Checkmark */}
    <path d="M42,54 L48,60 L62,44" stroke="#ff5e84" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
    {/* Sparkles ✦ */}
    <path d="M22,30 L24,34 L28,35 L24,36 L22,40 L20,36 L16,35 L20,34 Z" fill="#fef08a" />
    <path d="M78,60 L80,63 L83,64 L80,65 L78,68 L76,65 L73,64 L76,63 Z" fill="#fbcfe8" />
  </svg>
);

export const Dashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const today = new Date();
      const dayOfWeek = today.getDay(); 
      const dateStr = today.toISOString().split('T')[0];

      const res = await fetch(`${API_BASE_URL}/dashboard?dayOfWeek=${dayOfWeek}&date=${dateStr}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('Failed to fetch dashboard summaries.');
      }

      const resData = await res.json();
      setData(resData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error loading dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const handleToggleAssignment = async (id: string) => {
    if (!data) return;
    try {
      const res = await fetch(`${API_BASE_URL}/academic/assignments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'completed' })
      });

      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error completing task:', err);
    }
  };



  // Helper: check if class is happening now
  const isClassActiveNow = (startTime: string, endTime: string, dayOfWeek: number) => {
    const now = new Date();
    if (now.getDay() !== dayOfWeek) return false;

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  };

  const formatDueDate = (dateStr: string) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const target = new Date(dateStr);
    target.setHours(0,0,0,0);

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 1 && diffDays < 7) {
      return target.toLocaleDateString(undefined, { weekday: 'long' });
    }
    return target.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Assembling your workspace...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="alert-banner danger">
        <span>{error || 'Could not load data.'}</span>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
      
      {/* 1. WELCOME HERO BANNER */}
      <div 
        className="section-card" 
        style={{ 
          background: 'linear-gradient(135deg, #fff0f3 0%, #fffbfd 100%)', 
          border: '1px solid rgba(255, 94, 132, 0.08)',
          boxShadow: 'var(--card-shadow)',
          padding: '1.4rem 2rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
            <div style={{ background: '#ffd5de', color: '#ff4b72', padding: '0.8rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={22} fill="#ff4b72" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>Welcome back, {user?.username}! 💖</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem', fontWeight: 500 }}>
                Your average attendance is at <strong style={{ color: 'var(--success-text)' }}>{data.stats.averageAttendance}%</strong>. 
                {data.stats.totalPendingAssignments > 0 
                  ? ` You have ${data.stats.totalPendingAssignments} pending assignments due.` 
                  : ' You are fully caught up with your assignments!'}
              </p>
            </div>
          </div>
          {/* Cloud Illustration Right aligned */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <WelcomeCloud />
          </div>
        </div>
      </div>

      {/* 2. STATISTIC SUMMARY CARDS */}
      <div className="dashboard-grid">
        {/* Attendance Stat */}
        <div className="metric-card">
          <div className="metric-left-block">
            <div className="metric-icon" style={{ background: 'var(--success-glow)', color: 'var(--success-text)', border: '1px solid rgba(62, 201, 165, 0.2)' }}>
              <GraduationCap size={20} />
            </div>
            <div className="metric-details">
              <span className="metric-value" style={{ color: 'var(--success-text)' }}>{data.stats.averageAttendance}%</span>
              <span className="metric-label">Avg Attendance</span>
            </div>
          </div>
          {/* Green Sparkline Vector */}
          <svg className="metric-sparkline" viewBox="0 0 100 30">
            <path d="M0,25 Q15,20 30,22 T60,10 T90,5 T100,12" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Pending Tasks Stat */}
        <div className="metric-card">
          <div className="metric-left-block">
            <div className="metric-icon" style={{ background: 'var(--warning-glow)', color: 'var(--warning-text)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <ClipboardList size={20} />
            </div>
            <div className="metric-details">
              <span className="metric-value" style={{ color: 'var(--warning-text)' }}>{data.stats.totalPendingAssignments}</span>
              <span className="metric-label">Pending Tasks</span>
            </div>
          </div>
          {/* Yellow Sparkline Vector */}
          <svg className="metric-sparkline" viewBox="0 0 100 30">
            <path d="M0,10 Q15,25 30,15 T60,25 T90,12 T100,8" fill="none" stroke="var(--warning)" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Next Exam Stat */}
        <div className="metric-card">
          <div className="metric-left-block">
            <div className="metric-icon" style={{ background: 'var(--purple-glow)', color: 'var(--purple-text)', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
              <Calendar size={20} />
            </div>
            <div className="metric-details">
              <span className="metric-value" style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--purple-text)' }}>
                {data.nextExam ? data.nextExam.title : 'No Exams'}
              </span>
              <span className="metric-label">Upcoming Exams</span>
            </div>
          </div>
          {/* Purple Sparkline Vector */}
          <svg className="metric-sparkline" viewBox="0 0 100 30">
            <path d="M0,25 Q15,15 30,20 T60,5 T90,18 T100,5" fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* 3. SCHEDULES GRID */}
      <div className="dashboard-sections">
        {/* Today's Timetable */}
        <div className="section-card">
          <div className="section-card-header">
            <h2>Today's Timetable</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
              <Clock size={13} />
              <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>

          <div className="classes-list">
            {data.classesToday.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.8rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <SleepingCloud />
                <p style={{ marginTop: '0.6rem', fontWeight: 600 }}>No classes scheduled for today.</p>
                <p style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.15rem' }}>Enjoy your day off or catch up on reading! 📚</p>
              </div>
            ) : (
              data.classesToday.map(c => {
                const active = isClassActiveNow(c.start_time, c.end_time, c.day_of_week);
                return (
                  <div 
                    key={c.id} 
                    className={`class-card-item ${active ? 'active-now' : ''}`}
                  >
                    <div className="class-time">
                      <span>{c.start_time}</span>
                      <span className="duration">to {c.end_time}</span>
                    </div>
                    <div className="class-details-block" style={{ borderLeftColor: c.subject_color }}>
                      <span className="badge" style={{ background: c.subject_color + '20', color: c.subject_color, border: 'none', marginBottom: '0.2rem', display: 'inline-block' }}>
                        {c.subject_code}
                      </span>
                      <div className="class-subject-title" style={{ color: 'var(--text-primary)' }}>{c.subject_name}</div>
                      {c.location && (
                        <div className="class-room">
                          <MapPin size={11} style={{ color: 'var(--text-muted)' }} />
                          <span>{c.location}</span>
                        </div>
                      )}
                    </div>
                    {active && (
                      <span className="badge" style={{ background: 'var(--primary)', color: 'white', fontSize: '0.6rem', padding: '0.15rem 0.4rem', animation: 'pulse 1.5s infinite' }}>ACTIVE</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="section-card">
          <div className="section-card-header">
            <h2>Upcoming Deadlines</h2>
            <span className="tasks-counter">{data.upcomingAssignments.length}</span>
          </div>

          <div className="deadlines-checklist">
            {data.upcomingAssignments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <CuteClipboard />
                <p style={{ marginTop: '0.6rem', fontWeight: 600 }}>All clear! No upcoming tasks.</p>
                <p style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.15rem' }}>You're doing amazing! 🌸</p>
              </div>
            ) : (
              data.upcomingAssignments.map(item => (
                <div key={item.id} className="deadline-item">
                  <div 
                    className="deadline-checkbox" 
                    onClick={() => handleToggleAssignment(item.id)}
                  />
                  <div className="deadline-info">
                    <span className="title">{item.title}</span>
                    <div className="deadline-meta">
                      <span style={{ color: item.subject_color, fontWeight: 700 }}>{item.subject_name}</span>
                      <span>•</span>
                      <span>Due {formatDueDate(item.due_date)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
