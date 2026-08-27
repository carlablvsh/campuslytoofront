import React, { useEffect, useState } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { MapPin, ClipboardList, Clock, Calendar, BookOpen } from 'lucide-react';
import { formatLocalDate } from '../utils/dateUtils';

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

interface AttendanceStat {
  id: string;
  name: string;
  code: string;
  color: string;
  targetAttendance: number;
  currentPercentage: number;
  status: 'safe' | 'danger';
}

interface DashboardData {
  classesToday: ClassToday[];
  upcomingAssignments: Assignment[];
  nextExam: Exam | null;
  upcomingExams?: Exam[];
  recentNotes?: {
    id: string;
    title: string;
    file_name: string;
    subject_name: string;
    subject_code: string;
    subject_color: string;
  }[];
  activeBreak: { name: string, start_date: string, end_date: string } | null;
  stats: {
    averageAttendance: number;
    totalPendingAssignments: number;
    totalSubjects: number;
    totalNotesSaved?: number;
  };
}



const CozyDeskIllustration: React.FC = () => (
  <svg viewBox="0 0 260 80" width="240" height="75" style={{ overflow: 'visible' }}>
    {/* Lamp Glow */}
    <path d="M190,45 L150,80 L230,80 Z" fill="rgba(254, 240, 138, 0.25)" filter="blur(4px)" />
    {/* Books */}
    <rect x="30" y="55" width="40" height="8" rx="2" fill="#d8b4fe" />
    <rect x="32" y="63" width="36" height="8" rx="2" fill="#fbcfe8" />
    <line x1="30" y1="59" x2="70" y2="59" stroke="#b085db" strokeWidth="1" />
    <line x1="32" y1="67" x2="68" y2="67" stroke="#e0a3c2" strokeWidth="1" />
    {/* Mug next to bear */}
    <rect x="80" y="56" width="10" height="12" rx="2" fill="#fda4af" />
    <path d="M90,59 C92,59 93,60 93,62 C93,64 92,65 90,65" stroke="#f43f5e" strokeWidth="1.2" fill="transparent" />
    <path d="M82,53 Q85,50 83,47" stroke="#fca5a5" strokeWidth="1" strokeLinecap="round" fill="transparent" opacity="0.8" />
    {/* Bear sitting */}
    <circle cx="120" cy="50" r="18" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
    <circle cx="108" cy="36" r="5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
    <circle cx="132" cy="36" r="5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
    {/* Inner ears */}
    <circle cx="108" cy="36" r="2.5" fill="#fbcfe8" />
    <circle cx="132" cy="36" r="2.5" fill="#fbcfe8" />
    {/* Eyes closed/happy */}
    <path d="M112,46 Q115,48 117,46" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" fill="transparent" />
    <path d="M123,46 Q125,48 128,46" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" fill="transparent" />
    {/* Nose / Mouth */}
    <ellipse cx="120" cy="50" rx="3" ry="2" fill="#94a3b8" />
    <path d="M120,52 Q120,54 118,54" stroke="#475569" strokeWidth="1" strokeLinecap="round" fill="transparent" />
    <path d="M120,52 Q120,54 122,54" stroke="#475569" strokeWidth="1" strokeLinecap="round" fill="transparent" />
    {/* Blush */}
    <circle cx="111" cy="50" r="2.5" fill="#fda4af" opacity="0.6" />
    <circle cx="129" cy="50" r="2.5" fill="#fda4af" opacity="0.6" />
    {/* Bear hands holding cup */}
    <circle cx="114" cy="58" r="3.5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
    <circle cx="126" cy="58" r="3.5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
    {/* Desk Lamp */}
    <rect x="180" y="70" width="20" height="4" fill="#cbd5e1" />
    <path d="M190,70 L190,40" stroke="#f472b6" strokeWidth="3" strokeLinecap="round" />
    <path d="M190,40 Q180,30 170,42" stroke="#f472b6" strokeWidth="3" strokeLinecap="round" fill="transparent" />
    <path d="M165,40 C165,34 178,34 178,40 Z" fill="#fda4af" />
    {/* Sparkles */}
    <path d="M15,20 L17,23 L20,24 L17,25 L15,28 L13,25 L10,24 L13,23 Z" fill="#fef08a" />
    <path d="M220,15 L222,18 L225,19 L222,20 L220,23 L218,20 L215,19 L218,18 Z" fill="#fbcfe8" />
    <path d="M155,10 L156.5,12 L159,12.5 L156.5,13 L155,15 L153.5,13 L151,12.5 L153.5,12 Z" fill="#c084fc" opacity="0.7" />
  </svg>
);

const CuteExamsCalendar: React.FC = () => (
  <svg viewBox="0 0 120 90" width="100" height="75" style={{ margin: '0 auto', display: 'block', overflow: 'visible' }}>
    {/* Calendar base shadow */}
    <rect x="25" y="23" width="54" height="46" rx="6" fill="#fecdd3" opacity="0.4" />
    {/* Calendar body */}
    <rect x="22" y="20" width="54" height="46" rx="6" fill="#ffffff" stroke="#fda4af" strokeWidth="1.5" />
    {/* Header pink banner */}
    <rect x="22" y="20" width="54" height="12" rx="0" fill="#fbcfe8" />
    <path d="M22,26 L76,26" stroke="#fda4af" strokeWidth="1.5" />
    {/* Binder Rings */}
    <rect x="30" y="14" width="4" height="10" rx="2" fill="#cbd5e1" />
    <rect x="47" y="14" width="4" height="10" rx="2" fill="#cbd5e1" />
    <rect x="64" y="14" width="4" height="10" rx="2" fill="#cbd5e1" />
    {/* Cute blushing calendar face */}
    <path d="M38,40 Q40,42 42,40" stroke="#ff4d6d" strokeWidth="1.5" strokeLinecap="round" fill="transparent" />
    <path d="M54,40 Q56,42 58,40" stroke="#ff4d6d" strokeWidth="1.5" strokeLinecap="round" fill="transparent" />
    <circle cx="36" cy="43" r="2.5" fill="#ffd1dc" />
    <circle cx="60" cy="43" r="2.5" fill="#ffd1dc" />
    <path d="M46,47 Q48,50 50,47" stroke="#ff4d6d" strokeWidth="1.2" strokeLinecap="round" fill="transparent" />
    {/* Small Ribbon/Heart */}
    <path d="M82,42 C82,39 79,37 77,39 C75,37 72,39 72,42 C72,46 77,49 77,49 C77,49 82,46 82,42" fill="#f472b6" />
  </svg>
);

const CuteDaisyFlower: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 16, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ overflow: 'visible', ...style }}>
    <circle cx="12" cy="7" r="4.5" fill="#ffd1dc" />
    <circle cx="7" cy="12" r="4.5" fill="#ffd1dc" />
    <circle cx="17" cy="12" r="4.5" fill="#ffd1dc" />
    <circle cx="9.5" cy="17" r="4.5" fill="#ffd1dc" />
    <circle cx="14.5" cy="17" r="4.5" fill="#ffd1dc" />
    <circle cx="12" cy="12" r="3.5" fill="#fef08a" />
  </svg>
);

const CuteMiniStar: React.FC<{ size?: number; color?: string; style?: React.CSSProperties }> = ({ size = 12, color = '#fef08a', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ overflow: 'visible', ...style }}>
    <path d="M12,0 L15,9 L24,12 L15,15 L12,24 L9,15 L0,12 L9,9 Z" fill={color} />
  </svg>
);

const PlannerBinderSpirals: React.FC = () => (
  <div style={{
    position: 'absolute',
    left: '-24px',
    top: '30px',
    bottom: '30px',
    width: '18px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 99,
    pointerEvents: 'none'
  }}>
    {Array.from({ length: 9 }).map((_, i) => (
      <svg key={i} width="20" height="10" viewBox="0 0 20 10" style={{ overflow: 'visible' }}>
        <path d="M0,5 C0,1 20,1 20,5 C20,9 0,9 0,5" fill="none" stroke="var(--primary)" strokeWidth="1.8" opacity="0.3" />
        <path d="M2,5 C2,2 18,2 18,5 C18,8 2,8 2,5" fill="none" stroke="#e2e8f0" strokeWidth="1.2" />
      </svg>
    ))}
  </div>
);


export const Dashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [greeting, setGreeting] = useState<string>('Welcome back');

  const fetchDashboardData = async () => {
    try {
      const today = new Date();
      const dayOfWeek = today.getDay(); 
      const dateStr = formatLocalDate(today);

      const [dashRes, attRes] = await Promise.all([
        fetch(`${API_BASE_URL}/dashboard?dayOfWeek=${dayOfWeek}&date=${dateStr}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch(`${API_BASE_URL}/academic/attendance/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ]);

      if (!dashRes.ok) {
        throw new Error('Failed to fetch dashboard summaries.');
      }

      const resData = await dashRes.json();
      setData(resData);

      if (attRes.ok) {
        const attData = await attRes.json();
        setAttendanceStats(attData);
      }
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
    
    // Greeting logic based on client time
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 12) {
      setGreeting('Good morning');
    } else if (hours >= 12 && hours < 17) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
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

  const isOverdue = (dateStr: string, status: string) => {
    if (status !== 'pending') return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    const due = new Date(dateStr);
    due.setHours(0,0,0,0);
    return due.getTime() < today.getTime();
  };

  const getDaysRemaining = (dateStr: string) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const target = new Date(dateStr);
    target.setHours(0,0,0,0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatDaysRemaining = (dateStr: string) => {
    const days = getDaysRemaining(dateStr);
    if (days === 0) return 'Today';
    if (days === 1) return '1d';
    if (days < 0) return 'Passed';
    return `${days}d`;
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

  // Reminders computations
  const lowAttendanceSubjects = attendanceStats.filter(s => s.currentPercentage < s.targetAttendance);
  const overdueTasks = data.upcomingAssignments.filter(item => isOverdue(item.due_date, item.status));
  const nearExams = (data.upcomingExams || []).filter(e => {
    const days = getDaysRemaining(e.date);
    return days >= 0 && days <= 5;
  });

  const remindersList: string[] = [];
  lowAttendanceSubjects.forEach(s => {
    remindersList.push(`Attendance for ${s.name} is below target`);
  });
  overdueTasks.forEach(t => {
    remindersList.push(`Lab report — ${t.title.toLowerCase()} is overdue`);
  });
  nearExams.forEach(e => {
    const days = getDaysRemaining(e.date);
    const dayStr = days === 0 ? 'today' : days === 1 ? 'in 1 day' : `in ${days} days`;
    remindersList.push(`${e.subject_name} exam ${dayStr}`);
  });

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', position: 'relative', paddingLeft: '0.6rem' }}>
      
      {/* Planner binder spiral effect down the left side */}
      <PlannerBinderSpirals />

      {/* 1. TOP HEADER WITH DECORATIVE DESK ILLUSTRATION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingBottom: '0.2rem', position: 'relative' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {greeting}, {user?.username} 🌙
            </h2>
            <CuteMiniStar size={16} style={{ animation: 'bounce 2.5s infinite', alignSelf: 'center', marginTop: '4px' }} />
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.25rem 0 0 0', fontWeight: 500 }}>
            Here's your <span style={{ color: 'var(--primary)', fontWeight: 600 }}>cozy</span> academic overview for today!
          </p>

          {/* Inspirational Daily Focus Quote */}
          <div style={{ 
            marginTop: '0.6rem', 
            fontSize: '0.74rem', 
            color: 'var(--text-secondary)', 
            fontStyle: 'italic', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.35rem',
            background: 'var(--primary-glow)',
            padding: '0.3rem 0.8rem',
            borderRadius: '15px',
            alignSelf: 'flex-start',
            border: '1px solid rgba(255, 94, 132, 0.08)'
          }}>
            <span>✨</span>
            <span style={{ fontWeight: 600 }}>Cozy reminder: "Small steady steps lead to beautiful changes. Be kind to yourself today."</span>
            <CuteDaisyFlower size={10} style={{ marginLeft: '0.2rem' }} />
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          <CozyDeskIllustration />
        </div>
      </div>

      {data.activeBreak && (
        <div style={{ 
          background: 'rgba(255, 77, 109, 0.08)',
          border: '1px dashed rgba(255, 77, 109, 0.25)',
          borderRadius: '12px',
          padding: '0.8rem 1.2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.85rem',
          color: '#ff4d6d',
          boxShadow: '0 2px 8px rgba(0,0,0,0.01)'
        }}>
          <span>🏖️</span>
          <div>
            <strong style={{ color: '#ff4d6d' }}>Vacation Break Active: {data.activeBreak.name}</strong>
            <span style={{ marginLeft: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
              ({data.activeBreak.start_date} to {data.activeBreak.end_date})
            </span>
            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Your regular weekly lectures are currently paused. Enjoy your break!
            </p>
          </div>
        </div>
      )}
 
      {/* 2. STATS OVERVIEW SINGLE ROW CARD */}
      <div 
        className="section-card" 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: 0, 
          padding: 0, 
          overflow: 'hidden',
          borderRadius: '12px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        {/* Column 1: Tasks Pending */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '1rem 1.4rem', borderRight: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '10px', background: '#fff0f2', color: '#ff5e84', flexShrink: 0 }}>
            <ClipboardList size={18} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', lineHeight: '1.1' }}>
              {data.stats.totalPendingAssignments}
            </span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
              Tasks Pending
            </span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.05rem' }}>
              Keep it up!
            </span>
          </div>
        </div>

        {/* Column 2: Attendance */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '1rem 1.4rem', borderRight: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '10px', background: '#f5effc', color: '#b6a6ca', flexShrink: 0 }}>
            <Clock size={18} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', lineHeight: '1.1' }}>
              {data.stats.averageAttendance}%
            </span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
              Avg. Attendance
            </span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.05rem' }}>
              Keep going!
            </span>
          </div>
        </div>

        {/* Column 3: Next Exam */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '1rem 1.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '10px', background: '#fff9e6', color: '#e6c15c', flexShrink: 0 }}>
            <Calendar size={18} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', lineHeight: '1.1' }}>
              {data.nextExam ? `${getDaysRemaining(data.nextExam.date)}` : '—'}
            </span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
              Days to Next Exam
            </span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '110px' }}>
              {data.nextExam ? data.nextExam.title : 'No upcoming exams'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. MAIN DASHBOARD CONTENT GRID */}
      <div className="dashboard-sections" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.2rem' }}>
        
        {/* LEFT COLUMN: HERO TIMETABLE AND CHECKLISTS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          {/* DAILY TIMETABLE SECTION CARD (Main Hero Segment) */}
          <div className="section-card" style={{ padding: '1.4rem', borderRadius: '12px', borderLeft: '5px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CuteDaisyFlower size={14} style={{ animation: 'spin 10s linear infinite' }} />
                <span>Today's Academic Flow</span>
              </h3>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('switchTab', { detail: 'timetable' }))}
                style={{ 
                  background: 'transparent',
                  border: '1.5px solid #ff7899',
                  borderRadius: '20px',
                  padding: '0.25rem 0.9rem',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: '#ff7899',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  transition: 'var(--transition)'
                }}
                className="btn-timetable-shortcut"
              >
                Open Timetable →
              </button>
            </div>

            {data.classesToday.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                <p style={{ fontWeight: 600 }}>No classes scheduled for today. Enjoy a quiet study break! 📚</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', position: 'relative', paddingLeft: '1.3rem', marginTop: '0.4rem' }}>
                {/* Timeline axis line */}
                <div style={{ 
                  position: 'absolute', 
                  left: '5px', 
                  top: '12px', 
                  bottom: '12px', 
                  width: '2px', 
                  borderLeft: '1.5px dashed var(--primary)', 
                  opacity: 0.35 
                }} />

                {data.classesToday.map((c) => {
                  const active = isClassActiveNow(c.start_time, c.end_time, c.day_of_week);
                  
                  // Pick dynamic icons
                  let classIcon = <BookOpen size={15} />;
                  let iconBg = '#ffeef1';
                  let iconColor = '#ff5e84';
                  
                  const nameLower = (c.subject_name || c.title || '').toLowerCase();
                  if (c.type === 'event') {
                    if (c.event_type === 'work') {
                      classIcon = <span style={{ fontSize: '0.85rem' }}>💼</span>;
                      iconBg = '#ffeef1';
                      iconColor = '#ff5e84';
                    } else if (c.event_type === 'study') {
                      classIcon = <span style={{ fontSize: '0.85rem' }}>📚</span>;
                      iconBg = '#eefdf8';
                      iconColor = '#3ec9a5';
                    } else if (c.event_type === 'class_extra') {
                      classIcon = <span style={{ fontSize: '0.85rem' }}>🏫</span>;
                      iconBg = '#f5effc';
                      iconColor = '#b6a6ca';
                    } else {
                      classIcon = <span style={{ fontSize: '0.85rem' }}>🌟</span>;
                      iconBg = '#fff9e6';
                      iconColor = '#e6c15c';
                    }
                  } else {
                    if (nameLower.includes('algorithm') || nameLower.includes('programming') || nameLower.includes('software')) {
                      classIcon = <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>&lt;/&gt;</span>;
                      iconBg = '#f5effc';
                      iconColor = '#b6a6ca';
                    } else if (nameLower.includes('network') || nameLower.includes('database')) {
                      classIcon = <BookOpen size={15} />;
                      iconBg = '#ffeef1';
                      iconColor = '#ff5e84';
                    } else if (nameLower.includes('vision') || nameLower.includes('image') || nameLower.includes('graphics')) {
                      classIcon = <span style={{ fontSize: '0.95rem' }}>📷</span>;
                      iconBg = '#fff9e6';
                      iconColor = '#e6c15c';
                    } else if (nameLower.includes('deep') || nameLower.includes('intelligence') || nameLower.includes('machine')) {
                      classIcon = <span style={{ fontSize: '0.95rem' }}>🧠</span>;
                      iconBg = '#eefdf8';
                      iconColor = '#3ec9a5';
                    }
                  }

                  return (
                    <div 
                      key={c.id} 
                      style={{ 
                        position: 'relative',
                        display: 'flex', 
                        alignItems: 'center',
                        transition: 'transform 0.2s ease-in-out'
                      }}
                      className="timeline-item-wrapper"
                    >
                      {/* Timeline node marker overlay */}
                      <div style={{ 
                        position: 'absolute', 
                        left: '-17px', 
                        top: '50%', 
                        transform: 'translateY(-50%)',
                        width: '10px', 
                        height: '10px', 
                        borderRadius: '50%', 
                        background: active ? 'var(--primary)' : 'var(--bg-surface)', 
                        border: `2px solid ${c.subject_color || 'var(--primary)'}`,
                        zIndex: 2,
                        boxShadow: active ? '0 0 0 3px rgba(255, 94, 132, 0.15)' : 'none'
                      }}>
                        {active && (
                          <div style={{ 
                            position: 'absolute',
                            top: '-2px',
                            left: '-2px',
                            right: '-2px',
                            bottom: '-2px',
                            borderRadius: '50%',
                            border: '1.5px solid var(--primary)',
                            animation: 'ping 1.5s infinite'
                          }} />
                        )}
                      </div>

                      {/* Class details capsule block */}
                      <div 
                        style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          flex: 1,
                          padding: '0.75rem 1.1rem',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-color)',
                          borderLeft: `4px solid ${c.subject_color || 'var(--primary)'}`,
                          borderRadius: '10px',
                          marginLeft: '0.5rem',
                          boxShadow: active ? '0 4px 12px rgba(255, 94, 132, 0.04)' : '0 2px 6px rgba(0,0,0,0.015)'
                        }}
                      >
                        {/* Time block */}
                        <div style={{ display: 'flex', flexDirection: 'column', width: '55px', flexShrink: 0 }}>
                          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#ff5e84' }}>{c.start_time}</span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)' }}>{c.end_time}</span>
                        </div>

                        {/* Dotted vertical line separator */}
                        <div style={{ borderLeft: '1.5px dotted var(--border-color)', height: '22px', margin: '0 0.85rem' }} />

                        {/* Text detail */}
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {c.subject_name || c.title}
                              {c.is_moved && <span style={{ fontSize: '0.7rem', color: '#ff5e84', fontWeight: 500, marginLeft: '0.3rem' }}>(Rescheduled)</span>}
                            </span>
                            {active && (
                              <span className="badge" style={{ background: 'var(--primary)', color: 'white', fontSize: '0.45rem', padding: '0.05rem 0.25rem' }}>ACTIVE</span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.15rem', marginTop: '0.15rem' }}>
                            <MapPin size={9} style={{ opacity: 0.7 }} />
                            {c.location || 'No Room'}
                          </span>
                        </div>

                        {/* Right End Icon Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', background: iconBg, color: iconColor, flexShrink: 0 }}>
                          {classIcon}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* UPCOMING TASKS & EXAMS SIDE BY SIDE GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '1rem' }}>
            
            {/* COLUMN 1: UPCOMING TASKS */}
            <div className="section-card" style={{ padding: '1rem', borderRadius: '12px', borderTop: '4px solid var(--purple-text)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span>☑️</span> Upcoming Tasks
                </h3>
                <span 
                  onClick={() => window.dispatchEvent(new CustomEvent('switchTab', { detail: 'tasks' }))}
                  style={{ fontSize: '0.68rem', fontWeight: 700, color: '#ff7899', cursor: 'pointer' }}
                >
                  View All
                </span>
              </div>

              <div className="deadlines-checklist" style={{ gap: '0.4rem' }}>
                {data.upcomingAssignments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    <p style={{ fontWeight: 600, margin: 0 }}>All clear! No tasks. 🌸</p>
                  </div>
                ) : (
                  data.upcomingAssignments.slice(0, 3).map(item => {
                    const overdue = isOverdue(item.due_date, item.status);
                    return (
                      <div key={item.id} className="deadline-item" style={{ position: 'relative', padding: '0.45rem 0.6rem', borderRadius: '8px' }}>
                        <div 
                          className="deadline-checkbox" 
                          onClick={() => handleToggleAssignment(item.id)}
                          style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                        />
                        <div className="deadline-info" style={{ paddingLeft: '0.15rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.subject_color || 'var(--primary)', flexShrink: 0 }} />
                            <span className="title" style={{ fontSize: '0.76rem', fontWeight: 600 }}>{item.title}</span>
                          </div>
                          <div className="deadline-meta" style={{ paddingLeft: '0.95rem', fontSize: '0.65rem', marginTop: '0.05rem', color: 'var(--text-muted)' }}>
                            {item.subject_name}
                          </div>
                        </div>

                        <span 
                          className="badge" 
                          style={{ 
                            background: overdue ? 'var(--danger-glow)' : 'var(--primary-glow)', 
                            color: overdue ? 'var(--danger)' : 'var(--primary)', 
                            border: `1px solid ${overdue ? 'var(--danger)' : 'var(--border-color)'}`, 
                            position: 'absolute', 
                            right: '8px', 
                            top: '50%', 
                            transform: 'translateY(-50%)',
                            fontSize: '0.58rem',
                            fontWeight: 700,
                            padding: '0.1rem 0.35rem',
                            borderRadius: '4px'
                          }}
                        >
                          {overdue ? 'Overdue' : formatDueDate(item.due_date)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* COLUMN 2: EXAMS AHEAD */}
            <div className="section-card" style={{ padding: '1rem', borderRadius: '12px', borderTop: '4px solid #8b5cf6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span>⭐️</span> Exams Ahead
                </h3>
                <span 
                  onClick={() => window.dispatchEvent(new CustomEvent('switchTab', { detail: 'exams' }))}
                  style={{ fontSize: '0.68rem', fontWeight: 700, color: '#ff7899', cursor: 'pointer' }}
                >
                  View All
                </span>
              </div>

              <div>
                {!data.upcomingExams || data.upcomingExams.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '0.8rem 0.5rem 0.5rem 0.5rem' }}>
                    <CuteExamsCalendar />
                    <p style={{ fontWeight: 700, fontSize: '0.75rem', margin: '0.4rem 0 0.15rem 0', color: 'var(--text-primary)' }}>No upcoming exams</p>
                    <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)', margin: 0 }}>You're all caught up! Enjoy your free time 🎀</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {data.upcomingExams.slice(0, 3).map(exam => (
                      <div 
                        key={exam.id}
                        className="deadline-item"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0.6rem', borderRadius: '8px' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: exam.subject_color || 'var(--primary)', flexShrink: 0 }} />
                          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.76rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exam.title}</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.05rem' }}>
                              {exam.date}
                            </span>
                          </div>
                        </div>
                        <span 
                          className="badge" 
                          style={{ 
                            background: 'var(--bg-app)', 
                            color: 'var(--text-primary)', 
                            border: '1px solid var(--border-color)',
                            padding: '0.1rem 0.35rem',
                            fontSize: '0.58rem',
                            fontWeight: 700
                          }}
                        >
                          {formatDaysRemaining(exam.date)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: ATTENDANCE, STICKY BUNDLE, REMINDERS PAPER */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          {/* ATTENDANCE OVERVIEW CARD */}
          <div className="section-card" style={{ padding: '1.2rem', borderRadius: '12px', position: 'relative' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)', margin: '0 0 0.4rem 0' }}>
              Attendance Overview
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginTop: '0.2rem' }}>
              {/* Pink Line Graph */}
              <div style={{ flex: 1, position: 'relative', height: '65px', display: 'flex', alignItems: 'center' }}>
                <svg viewBox="0 0 200 60" width="100%" height="60" style={{ overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="pink-wave-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff5e84" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#ff5e84" stopOpacity="0.00" />
                    </linearGradient>
                  </defs>
                  {/* Wave Path */}
                  <path 
                    d="M 0 35 C 30 15, 50 45, 80 20 C 110 5, 130 50, 160 25 C 180 15, 190 30, 200 20" 
                    fill="none" 
                    stroke="#ff5e84" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                  />
                  {/* Area Fill */}
                  <path 
                    d="M 0 35 C 30 15, 50 45, 80 20 C 110 5, 130 50, 160 25 C 180 15, 190 30, 200 20 L 200 60 L 0 60 Z" 
                    fill="url(#pink-wave-grad)" 
                  />
                  {/* Small Sparkles */}
                  <path d="M15,10 L16.5,11.5 L18,12 L16.5,12.5 L15,14 L13.5,12.5 L12,12 L13.5,11.5 Z" fill="#ff7899" opacity="0.6" />
                  <path d="M125,12 L126.5,13.5 L128,14 L126.5,14.5 L125,16 L123.5,14.5 L122,14 L123.5,13.5 Z" fill="#ff7899" opacity="0.6" />
                </svg>
              </div>

              {/* Stats Value */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', lineHeight: 1 }}>
                  {data.stats.averageAttendance}%
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.15rem', fontWeight: 700 }}>
                  Average
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.4rem' }}>
              <span 
                onClick={() => window.dispatchEvent(new CustomEvent('switchTab', { detail: 'attendance' }))}
                style={{ fontSize: '0.68rem', fontWeight: 700, color: '#ff7899', cursor: 'pointer' }}
              >
                View Details →
              </span>
            </div>
          </div>

          {/* CUTE PLAYFUL STICKER: STUDY REMINDER */}
          <div 
            className="study-reminder-card" 
            style={{ 
              transform: 'rotate(-1deg)',
              boxShadow: '3px 6px 16px rgba(182, 166, 202, 0.14)'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', maxWidth: '60%' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, fontFamily: 'var(--font-serif)', color: 'inherit' }}>
                Study Sticker ✦
              </span>
              <span style={{ fontSize: '0.74rem', color: 'inherit', opacity: 0.85, fontWeight: 500, lineHeight: 1.3 }}>
                Consistency today, success tomorrow 💖
              </span>
            </div>
            <div style={{ flexShrink: 0 }}>
              <svg viewBox="0 0 100 80" width="80" height="65" style={{ overflow: 'visible' }}>
                {/* Bunny ears */}
                <ellipse cx="65" cy="25" rx="4" ry="12" fill="#ffffff" stroke="#e9d5ff" strokeWidth="1" transform="rotate(-10 65 25)" />
                <ellipse cx="65" cy="25" rx="2" ry="8" fill="#ffd1dc" transform="rotate(-10 65 25)" />
                
                <ellipse cx="78" cy="27" rx="4" ry="12" fill="#ffffff" stroke="#e9d5ff" strokeWidth="1" transform="rotate(15 78 27)" />
                <ellipse cx="78" cy="27" rx="2" ry="8" fill="#ffd1dc" transform="rotate(15 78 27)" />

                {/* Bunny body */}
                <circle cx="70" cy="50" r="16" fill="#ffffff" stroke="#e9d5ff" strokeWidth="1" />
                
                {/* Eyes */}
                <circle cx="65" cy="48" r="1.5" fill="#4a3764" />
                <circle cx="75" cy="48" r="1.5" fill="#4a3764" />
                {/* Nose & Mouth */}
                <path d="M69,51 L71,51 M70,51 L70,52" stroke="#4a3764" strokeWidth="1" />
                
                {/* Blush */}
                <circle cx="62" cy="51" r="2" fill="#ffb3c6" opacity="0.8" />
                <circle cx="78" cy="51" r="2" fill="#ffb3c6" opacity="0.8" />

                {/* Books */}
                <rect x="15" y="55" width="30" height="6" rx="1.5" fill="#c084fc" />
                <rect x="12" y="61" width="36" height="6" rx="1.5" fill="#ffd1dc" />
                <line x1="15" y1="58" x2="45" y2="58" stroke="#a855f7" strokeWidth="0.8" />
                <line x1="12" y1="64" x2="48" y2="64" stroke="#ff8da1" strokeWidth="0.8" />
                
                {/* Small heart bubble */}
                <path d="M48,35 C48,32 45,30 43,32 C41,30 38,32 38,35 C38,39 43,42 43,42 C43,42 48,39 48,35" fill="#f43f5e" opacity="0.75" />
              </svg>
            </div>
          </div>

          {/* PINNED MEMO PAPER SHEET: REMINDERS & ALERTS */}
          <div 
            className="section-card pinned-memo-card" 
            style={{ 
              padding: '1.2rem 1.1rem 1rem 1.1rem',
              borderRadius: '2px 2px 10px 4px', 
              background: '#fffdf0', // Warm paper sheet color in light mode
              border: '1px solid #f9ebcc',
              boxShadow: '3px 4px 10px rgba(0,0,0,0.03)',
              position: 'relative',
              transform: 'rotate(0.5deg)'
            }}
          >
            {/* Cute pushpin illustration on top */}
            <span style={{ 
              position: 'absolute', 
              top: '-12px', 
              left: '50%', 
              transform: 'translateX(-50%)', 
              fontSize: '1.1rem', 
              filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.15))',
              zIndex: 10
            }}>
              📌
            </span>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px dashed rgba(230, 193, 92, 0.3)', paddingBottom: '0.35rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#7d663b', fontFamily: 'var(--font-serif)', margin: 0, letterSpacing: '0.2px' }}>
                Reminders Board
              </h3>
              <span 
                onClick={() => window.dispatchEvent(new CustomEvent('switchTab', { detail: 'attendance' }))}
                style={{ fontSize: '0.65rem', fontWeight: 700, color: '#ff7899', cursor: 'pointer' }}
              >
                View All
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {remindersList.length === 0 ? (
                <div style={{ fontSize: '0.72rem', color: '#7d663b', textAlign: 'center', fontStyle: 'italic', padding: '0.6rem 0' }}>
                  All clear! Enjoy your day 🌸
                </div>
              ) : (
                remindersList.slice(0, 3).map((rem, i) => (
                  <div 
                    key={i} 
                    className="alert-banner-item"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.45)',
                      border: '1px solid rgba(230, 193, 92, 0.18)',
                      borderLeft: '3px solid #f5b041',
                      padding: '0.4rem 0.6rem',
                      borderRadius: '6px'
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', flexShrink: 0 }}>⚠️</span>
                    <span style={{ fontSize: '0.7rem', color: '#7d663b', fontWeight: 600, lineHeight: '1.25' }}>
                      {rem}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* 4. BOTTOM RIBBON BANNER */}
      <div className="bottom-ribbon-banner" style={{ filter: 'drop-shadow(0 2px 3px rgba(255, 94, 132, 0.05))', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span style={{ fontSize: '1rem' }}>💝</span>
          <span style={{ fontSize: '0.74rem', fontStyle: 'italic', color: 'inherit', fontWeight: 600 }}>
            Small steps every day lead to big changes. ✦
          </span>
        </div>
        <span style={{ fontSize: '0.95rem' }}>💖</span>
      </div>

    </div>
  );
};
