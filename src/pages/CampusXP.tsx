import React, { useEffect, useState } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { Sparkles, Trophy, Info, X } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  badgeIcon: string;
  xpReward: number;
  target: number;
  progress: number;
  isUnlocked: boolean;
  unlockedAt: string | null;
}

interface ActivityItem {
  id: string;
  action: string;
  xpAmount: number;
  source: string;
  displayTitle: string;
  icon: string;
  createdAt: string;
}

interface XPSourceItem {
  action: string;
  xp: string;
  icon: string;
  desc: string;
}

interface FutureReward {
  id: string;
  title: string;
  type: string;
  reqLevel: number;
  icon: string;
  isUnlocked: boolean;
}

interface GamificationSummary {
  totalXP: number;
  level: number;
  levelTitle: string;
  currentLevelBaseXP: number;
  nextLevelTargetXP: number;
  xpIntoLevel: number;
  xpRemaining: number;
  progressPercent: number;
  currentStreak: number;
  longestStreak: number;
  activeDaysThisWeek: { dayName: string; date: string; isActive: boolean; isToday: boolean }[];
  achievements: Achievement[];
  recentActivity: ActivityItem[];
  futureRewards: FutureReward[];
  xpSources: XPSourceItem[];
}

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_step', title: 'First Step', description: 'Complete your first assignment or task in Campusly.', category: 'Productivity', badgeIcon: '🎯', xpReward: 50, target: 1, progress: 0, isUnlocked: false, unlockedAt: null },
  { id: 'task_master', title: 'Task Master', description: 'Complete 5 assignments or project deliverables.', category: 'Productivity', badgeIcon: '📝', xpReward: 75, target: 5, progress: 0, isUnlocked: false, unlockedAt: null },
  { id: 'academic_weapon', title: 'Academic Weapon', description: 'Complete 15 assignments across your enrolled subjects.', category: 'Productivity', badgeIcon: '⚔️', xpReward: 150, target: 15, progress: 0, isUnlocked: false, unlockedAt: null },
  { id: 'study_starter', title: 'Study Starter', description: 'Complete your first focus session in the Study Room.', category: 'Focus', badgeIcon: '☕', xpReward: 50, target: 1, progress: 0, isUnlocked: false, unlockedAt: null },
  { id: 'deep_worker', title: 'Deep Worker', description: 'Complete 5 focused Pomodoro sessions in the Study Room.', category: 'Focus', badgeIcon: '🧘', xpReward: 80, target: 5, progress: 0, isUnlocked: false, unlockedAt: null },
  { id: 'zen_master', title: 'Zen Master', description: 'Complete 15 focus sessions in the Study Room.', category: 'Focus', badgeIcon: '🌌', xpReward: 150, target: 15, progress: 0, isUnlocked: false, unlockedAt: null },
  { id: 'first_lecture', title: 'First Lecture', description: 'Log your first attended class on the Calendar or Attendance.', category: 'Academic', badgeIcon: '🎒', xpReward: 50, target: 1, progress: 0, isUnlocked: false, unlockedAt: null },
  { id: 'class_regular', title: 'Class Regular', description: 'Attend 10 scheduled timetable lectures.', category: 'Academic', badgeIcon: '🎓', xpReward: 100, target: 10, progress: 0, isUnlocked: false, unlockedAt: null },
  { id: 'attendance_ace', title: 'Attendance Ace', description: 'Attend 25 scheduled timetable lectures.', category: 'Academic', badgeIcon: '🌟', xpReward: 150, target: 25, progress: 0, isUnlocked: false, unlockedAt: null },
  { id: 'consistent_scholar', title: 'Consistent Scholar', description: 'Maintain a 3-day daily study & attendance streak.', category: 'Consistency', badgeIcon: '⚡', xpReward: 60, target: 3, progress: 0, isUnlocked: false, unlockedAt: null },
  { id: 'on_fire', title: 'On Fire', description: 'Maintain a 7-day daily study & attendance streak.', category: 'Consistency', badgeIcon: '🔥', xpReward: 120, target: 7, progress: 0, isUnlocked: false, unlockedAt: null },
  { id: 'century_club', title: 'Century Club', description: 'Accumulate 100 hours of focused study logged.', category: 'Milestone', badgeIcon: '🏛️', xpReward: 200, target: 100, progress: 0, isUnlocked: false, unlockedAt: null },
  { id: 'grand_scholar', title: 'Grand Scholar', description: 'Reach Level 10 in Campusly.', category: 'Milestone', badgeIcon: '👑', xpReward: 250, target: 10, progress: 0, isUnlocked: false, unlockedAt: null }
];

const DEFAULT_SOURCES: XPSourceItem[] = [
  { action: 'Log Class Attendance', xp: '+20 XP', icon: '🎒', desc: 'Mark scheduled classes as present.' },
  { action: 'Complete Deliverable', xp: '+15 XP', icon: '📝', desc: 'Finish assignments and study tasks.' },
  { action: 'Focused Study Block', xp: '+30 XP', icon: '☕', desc: 'Complete 25m Pomodoro cycles in Study Room.' },
  { action: 'Daily Activity Streak', xp: '+10 XP', icon: '🔥', desc: 'Log in and attend classes on consecutive days.' },
  { action: 'Daily Check-In', xp: '+15 XP', icon: '✨', desc: 'Claim your daily scholar check-in bonus.' },
  { action: 'Unlock Milestone Badge', xp: '+50–250 XP', icon: '👑', desc: 'Reach academic and study milestones.' }
];

export const CampusXP: React.FC = () => {
  const { token } = useAuth();
  const [data, setData] = useState<GamificationSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Daily Check-In State
  const [checkingIn, setCheckingIn] = useState<boolean>(false);
  const [checkInMessage, setCheckInMessage] = useState<string | null>(null);
  const [showRewardsModal, setShowRewardsModal] = useState<boolean>(false);

  const fetchGamificationData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/gamification/summary`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error('Failed to load gamification summary');
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error fetching XP summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchGamificationData();
    }
  }, [token]);

  const handleDailyCheckIn = async () => {
    if (checkingIn) return;
    setCheckingIn(true);
    setCheckInMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/gamification/check-in`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const resData = await res.json();
      if (res.ok) {
        setCheckInMessage(resData.message || 'Daily check-in successful! +15 XP added.');
        fetchGamificationData();
      } else {
        setCheckInMessage(resData.error || 'Already checked in today.');
      }
    } catch (err: any) {
      setCheckInMessage('Cannot connect to server for check-in.');
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--ink-soft)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.15rem' }}>
          Consulting academic standing... ✧
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '3.5rem 0', textAlign: 'center', color: 'var(--ink-soft)' }}>
        <p style={{ color: 'var(--danger)' }}>{error || 'Unable to load progression.'}</p>
        <button 
          type="button" 
          onClick={fetchGamificationData}
          style={{ marginTop: '1rem', padding: '0.45rem 1rem', background: '#2d1527', color: '#faf6f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Retry
        </button>
      </div>
    );
  }

  const categories = ['All', 'Productivity', 'Academic', 'Focus', 'Consistency', 'Milestone'];
  const allAchievements = (data.achievements && data.achievements.length > 0) 
    ? data.achievements 
    : DEFAULT_ACHIEVEMENTS;

  const filteredAchievements = activeCategory === 'All' 
    ? allAchievements 
    : allAchievements.filter(a => a.category.toLowerCase() === activeCategory.toLowerCase());

  const unlockedCount = allAchievements.filter(a => a.isUnlocked).length;
  const sources = (data.xpSources && data.xpSources.length > 0) ? data.xpSources : DEFAULT_SOURCES;

  return (
    <div className="animate-page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', maxWidth: '1240px', margin: '0 auto', paddingBottom: '3.5rem' }}>
      
      {/* 1. OPEN CANVAS EDITORIAL HEADER */}
      <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '2rem' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.8rem' }}>
          <span className="sci-fi-tag">PRESTIGE & REWARDS</span>
          
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setShowRewardsModal(true)}
              style={{
                padding: '0.35rem 0.85rem',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 650,
                background: 'rgba(255, 255, 255, 0.85)',
                border: '1px solid var(--line)',
                borderRadius: '9999px',
                color: 'var(--ink-soft)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Info size={12} style={{ color: '#e11d48' }} />
              <span>How to Earn Rewards</span>
            </button>

            <button
              type="button"
              onClick={handleDailyCheckIn}
              disabled={checkingIn}
              style={{
                padding: '0.35rem 0.95rem',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                background: '#2d1527',
                border: 'none',
                borderRadius: '9999px',
                color: '#faf6f0',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Sparkles size={12} style={{ color: '#f472b6' }} />
              <span>{checkingIn ? 'Claiming...' : 'Claim Daily Check-In (+15 XP)'}</span>
            </button>
          </div>
        </div>

        {checkInMessage && (
          <div style={{ padding: '0.6rem 1rem', background: 'rgba(244, 114, 182, 0.12)', border: '1px solid var(--petal)', borderRadius: '4px', fontSize: '0.82rem', color: '#2d1527', marginBottom: '1.2rem' }}>
            {checkInMessage}
          </div>
        )}

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.1rem, 3.8vw, 3rem)',
          fontWeight: 400,
          lineHeight: 1.08,
          letterSpacing: '-0.03em',
          color: 'var(--ink)',
          margin: 0
        }}>
          Prestige & Standing, <br />
          <span style={{ fontStyle: 'italic', color: '#e11d48', fontWeight: 300 }}>earned quietly</span>.
        </h1>

        <p style={{
          fontSize: '0.98rem',
          lineHeight: 1.55,
          color: 'var(--ink-soft)',
          marginTop: '0.8rem',
          maxWidth: '640px',
          margin: '0.8rem 0 0 0'
        }}>
          Academic experience is awarded automatically as you plan, attend scheduled lectures, complete deliverables, and focus in the Study Room.
        </p>

        {/* Big Open Stat Display */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '3rem', marginTop: '2rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Current Rank
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginTop: '0.2rem' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 400, lineHeight: 1, color: 'var(--ink)' }}>
                Level {data.level}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#e11d48', fontWeight: 650 }}>
                {data.levelTitle}
              </span>
            </div>
          </div>

          <div style={{ width: '1px', height: '40px', background: 'var(--line)' }} />

          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Total Experience
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.4rem', fontWeight: 700, color: 'var(--ink)', marginTop: '0.2rem' }}>
              {data.totalXP.toLocaleString()} <span style={{ fontSize: '0.9rem', color: 'var(--ink-faint)' }}>XP</span>
            </div>
          </div>

          <div style={{ width: '1px', height: '40px', background: 'var(--line)' }} />

          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Daily Streak
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 400, color: 'var(--ink)', marginTop: '0.2rem' }}>
              {data.currentStreak} <span style={{ fontSize: '0.9rem', color: 'var(--ink-faint)' }}>days active</span>
            </div>
          </div>
        </div>

        {/* Level Progress Bar */}
        <div style={{ marginTop: '1.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-faint)', marginBottom: '0.35rem' }}>
            <span>LEVEL {data.level} ({data.currentLevelBaseXP} XP)</span>
            <span style={{ color: '#e11d48', fontWeight: 700 }}>{data.xpRemaining > 0 ? `${data.xpRemaining} XP TO LEVEL ${data.level + 1}` : 'MAX RANK'}</span>
            <span>LEVEL {data.level + 1} ({data.nextLevelTargetXP} XP)</span>
          </div>
          <div style={{ height: '3px', background: 'var(--line)', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{ width: `${data.progressPercent}%`, height: '100%', background: '#f472b6', borderRadius: '9999px', transition: 'width 0.5s ease' }} />
          </div>
        </div>

      </div>

      {/* 2. DAILY STREAK & HOW TO EARN REWARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '3.5rem', borderBottom: '1px solid var(--line)', paddingBottom: '2.5rem' }}>
        
        {/* Daily Streak & Weekly Activity Check-in */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--line)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Daily Activity & Streak Tracker
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-soft)' }}>
              Best: {data.longestStreak} Days
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', margin: '1rem 0' }}>
            <div style={{ fontSize: '2.4rem', lineHeight: 1 }}>🔥</div>
            <div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
                {data.currentStreak} {data.currentStreak === 1 ? 'Day Active Streak' : 'Days Active Streak'}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', margin: '0.15rem 0 0 0' }}>
                {data.currentStreak > 0 
                  ? 'Attendance logged, check-in claimed, or study session completed today.'
                  : 'Claim daily check-in, attend a class, or complete a task today to start your streak.'}
              </p>
            </div>
          </div>

          {/* Weekly Activity Tracker */}
          <div style={{ marginTop: '1.4rem' }}>
            <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-faint)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              7-Day Academic Rhythm
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.4rem', textAlign: 'center' }}>
              {data.activeDaysThisWeek.map((day, idx) => (
                <div 
                  key={idx}
                  style={{
                    padding: '0.6rem 0.2rem',
                    border: day.isToday ? '1.5px solid #2d1527' : '1px solid var(--line)',
                    borderRadius: '4px',
                    background: day.isActive ? 'rgba(244, 114, 182, 0.12)' : 'transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.2rem'
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 700, color: day.isToday ? '#2d1527' : 'var(--ink-faint)' }}>
                    {day.dayName}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: day.isActive ? '#e11d48' : 'var(--ink-faint)', fontWeight: 700 }}>
                    {day.isActive ? '✓' : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* How to Earn XP / Rewards Guide */}
        <div style={{ borderLeft: '1px solid var(--line)', paddingLeft: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--line)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              How to Earn Experience & Standing
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: '#e11d48', fontWeight: 700 }}>
              XP PROTOCOL
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {sources.map((item, sIdx) => (
              <div 
                key={sIdx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.65rem 0',
                  borderBottom: sIdx < sources.length - 1 ? '1px dashed var(--line)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 650, color: 'var(--ink)' }}>
                      {item.action}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)' }}>
                      {item.desc}
                    </div>
                  </div>
                </div>

                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700, color: '#e11d48' }}>
                  {item.xp}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 3. ACHIEVEMENTS MATRIX */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--line)', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--ink-faint)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Badges & Achievements
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginLeft: '1rem' }}>
              Unlocked {unlockedCount} of {data.achievements.length} badges
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '0.35rem 0.8rem',
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: activeCategory === cat ? 700 : 500,
                  border: '1px solid var(--line)',
                  borderRadius: '3px',
                  background: activeCategory === cat ? '#2d1527' : 'transparent',
                  color: activeCategory === cat ? '#faf6f0' : 'var(--ink-soft)',
                  cursor: 'pointer'
                }}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* 2-Row Grid for Badges with Hairline Grid */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '1.2rem',
            maxHeight: '440px',
            overflowY: 'auto',
            paddingTop: '1.2rem',
            paddingRight: '0.5rem'
          }}
        >
          {filteredAchievements.map(ach => (
            <div 
              key={ach.id}
              style={{
                border: '1px solid var(--line)',
                padding: '1.1rem',
                borderRadius: '4px',
                background: ach.isUnlocked ? 'rgba(255, 253, 249, 0.8)' : 'rgba(250, 246, 240, 0.4)',
                opacity: ach.isUnlocked ? 1 : 0.6,
                display: 'flex',
                gap: '0.9rem',
                alignItems: 'flex-start'
              }}
            >
              <div style={{ fontSize: '1.8rem', lineHeight: 1, filter: ach.isUnlocked ? 'none' : 'grayscale(100%)' }}>
                {ach.badgeIcon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.02rem', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                    {ach.title}
                  </h4>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 700, color: '#e11d48' }}>
                    +{ach.xpReward} XP
                  </span>
                </div>
                <p style={{ fontSize: '0.76rem', color: 'var(--ink-soft)', margin: '0.25rem 0 0.5rem 0', lineHeight: 1.45 }}>
                  {ach.description}
                </p>
                
                <div style={{ height: '3px', background: 'var(--line)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, Math.round((ach.progress / ach.target) * 100))}%`, height: '100%', background: '#f472b6', borderRadius: '9999px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-faint)', marginTop: '0.25rem' }}>
                  <span>{ach.isUnlocked ? '✓ UNLOCKED' : 'LOCKED'}</span>
                  <span>{ach.progress} / {ach.target}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* REWARDS & UNLOCKS MODAL */}
      {showRewardsModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(45, 21, 39, 0.45)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--line)',
            borderRadius: '6px',
            maxWidth: '520px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 12px 36px rgba(45, 21, 39, 0.15)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Trophy size={18} style={{ color: '#e11d48' }} />
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 500, margin: 0 }}>How to Earn Rewards</h3>
              </div>
              <button onClick={() => setShowRewardsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', margin: '0 0 1.2rem 0', lineHeight: 1.5 }}>
              Level up your student standing by logging classes, finishing deliverables, completing Pomodoro blocks, and maintaining daily streaks. Unlocking higher levels grants access to exclusive themes and profile frames.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {data.futureRewards?.map(rew => (
                <div 
                  key={rew.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: '4px',
                    border: '1px solid var(--line)',
                    background: rew.isUnlocked ? 'rgba(244, 114, 182, 0.08)' : 'rgba(250, 246, 240, 0.5)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <span style={{ fontSize: '1.3rem' }}>{rew.icon}</span>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--ink)' }}>{rew.title}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--ink-faint)' }}>{rew.type}</div>
                    </div>
                  </div>

                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '9999px',
                    background: rew.isUnlocked ? '#10b981' : 'rgba(45, 21, 39, 0.08)',
                    color: rew.isUnlocked ? '#ffffff' : 'var(--ink-soft)'
                  }}>
                    {rew.isUnlocked ? 'UNLOCKED' : `LVL ${rew.reqLevel}`}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setShowRewardsModal(false)}
                style={{
                  padding: '0.5rem 1.2rem',
                  background: '#2d1527',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
