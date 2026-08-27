import React, { useEffect, useState } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { 
  Trophy, 
  Flame, 
  Lock, 
  Zap, 
  TrendingUp,
  Gift
} from 'lucide-react';

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
  { id: 'century_club', title: 'Century Club', description: 'Accumulate 500 total XP across all academic activities.', category: 'Milestone', badgeIcon: '🏆', xpReward: 100, target: 500, progress: 0, isUnlocked: false, unlockedAt: null },
  { id: 'grand_scholar', title: 'Grand Scholar', description: 'Accumulate 1,500 total XP and master your semester.', category: 'Milestone', badgeIcon: '👑', xpReward: 200, target: 1500, progress: 0, isUnlocked: false, unlockedAt: null }
];

export const CampusXP: React.FC = () => {
  const { token } = useAuth();
  const [data, setData] = useState<GamificationSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const fetchGamificationData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/gamification/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Failed to load gamification metrics.');
      }

      const summaryData = await res.json();
      setData(summaryData);
    } catch (err: any) {
      console.error('Gamification fetch error:', err);
      setError(err.message || 'Error fetching progression data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchGamificationData();
    }
  }, [token]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ color: 'var(--text-secondary)' }}>Loading Campus XP progression...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="section-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--danger)' }}>{error || 'Unable to load progression.'}</p>
        <button 
          type="button" 
          className="btn-primary" 
          onClick={fetchGamificationData}
          style={{ marginTop: '1rem', padding: '0.4rem 1rem' }}
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

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
      
      {/* 1. HERO PROGRESSION & LEVEL CARD */}
      <div 
        className="section-card" 
        style={{ 
          background: 'linear-gradient(135deg, rgba(255, 120, 153, 0.08) 0%, rgba(204, 228, 246, 0.12) 100%)',
          border: '1px solid var(--border-color)',
          padding: '1.8rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge" style={{ background: 'var(--primary)', color: '#ffffff', fontWeight: 800, padding: '0.25rem 0.7rem' }}>
                LEVEL {data.level}
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {data.levelTitle}
              </span>
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.4rem', fontFamily: 'var(--font-serif)' }}>
              Campus XP Progression
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem', maxWidth: '520px' }}>
              Earn XP organically as you plan, attend scheduled lectures, complete assignments, and focus in the Study Room.
            </p>
          </div>

          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '2rem', fontWeight: 850, color: 'var(--primary)', lineHeight: 1.1 }}>
              {data.totalXP.toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 700 }}>XP</span>
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Experience Earned</span>
          </div>
        </div>

        {/* Level Progress Bar */}
        <div style={{ marginTop: '1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            <span>Level {data.level} ({data.currentLevelBaseXP} XP)</span>
            <span>{data.xpRemaining > 0 ? `${data.xpRemaining} XP needed for Level ${data.level + 1}` : 'Max Level Reached'}</span>
            <span>Level {data.level + 1} ({data.nextLevelTargetXP} XP)</span>
          </div>
          
          <div style={{ height: '12px', background: 'var(--bg-app)', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative' }}>
            <div 
              style={{ 
                height: '100%', 
                width: `${data.progressPercent}%`, 
                background: 'linear-gradient(90deg, var(--primary) 0%, #ff9ebb 100%)',
                borderRadius: '10px',
                transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
              }} 
            />
          </div>
        </div>
      </div>

      {/* 2. STATS ROW: STREAKS & XP SOURCES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.2rem' }}>
        
        {/* Streak & Consistency Card */}
        <div className="section-card" style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Flame size={18} style={{ color: '#ff6b6b' }} /> Daily Activity Streak
              </h3>
              <span className="badge" style={{ background: data.currentStreak > 0 ? 'rgba(255, 107, 107, 0.15)' : 'var(--bg-app)', color: data.currentStreak > 0 ? '#ff6b6b' : 'var(--text-muted)' }}>
                Best: {data.longestStreak} Days
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.8rem 0' }}>
              <div style={{ fontSize: '2.5rem', lineHeight: 1 }}>🔥</div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 850, color: 'var(--text-primary)' }}>
                  {data.currentStreak} {data.currentStreak === 1 ? 'Day' : 'Days'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {data.currentStreak > 0 
                    ? 'Keep attending classes and studying to maintain your streak!' 
                    : 'Log an attendance or study session today to start your streak!'}
                </div>
              </div>
            </div>

            {/* Weekly Activity Dots */}
            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>THIS WEEK'S ACTIVITY</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.3rem', textAlign: 'center' }}>
                {data.activeDaysThisWeek.map((day, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      background: day.isActive ? 'var(--primary)' : 'var(--bg-app)',
                      color: day.isActive ? '#ffffff' : 'var(--text-muted)',
                      border: day.isToday ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                      padding: '0.4rem 0.2rem',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}
                  >
                    <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>{day.dayName}</span>
                    <span style={{ fontSize: '0.8rem' }}>{day.isActive ? '✓' : '•'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* XP Sources Guide Card */}
        <div className="section-card" style={{ padding: '1.4rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.8rem' }}>
            <Zap size={18} style={{ color: 'var(--primary)' }} /> How to Earn XP
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.8rem' }}>
            XP is granted automatically by the server when you complete genuine academic tasks:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {data.xpSources.map((source, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  background: 'var(--bg-app)', 
                  padding: '0.5rem 0.8rem', 
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem' }}>{source.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>{source.action}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{source.desc}</div>
                  </div>
                </div>
                <span className="badge" style={{ background: 'rgba(255, 120, 153, 0.15)', color: 'var(--primary)', fontWeight: 800 }}>
                  {source.xp}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 3. ACHIEVEMENTS & BADGES SECTION */}
      <div className="section-card" style={{ padding: '1.6rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '1.2rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
              <Trophy size={20} style={{ color: '#f59e0b' }} /> Badges & Achievements
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Unlocked {unlockedCount} of {data.achievements.length} badges
            </span>
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                className="badge"
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '0.35rem 0.7rem',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeCategory === cat ? 'var(--primary)' : 'var(--bg-app)',
                  color: activeCategory === cat ? '#ffffff' : 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  transition: 'var(--transition)'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Achievements Matrix (2 rows visible, rest scrollable) */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '1rem',
            maxHeight: '450px',
            overflowY: 'auto',
            paddingRight: '0.4rem'
          }}
        >
          {filteredAchievements.map(ach => {
            const isCompleted = ach.isUnlocked;
            const pct = Math.round((ach.progress / ach.target) * 100);

            return (
              <div 
                key={ach.id} 
                style={{ 
                  background: isCompleted ? 'linear-gradient(145deg, var(--bg-surface) 0%, rgba(255, 120, 153, 0.05) 100%)' : 'var(--bg-app)',
                  border: isCompleted ? '1.5px solid rgba(255, 120, 153, 0.35)' : '1px dashed var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.8rem',
                  opacity: isCompleted ? 1 : 0.85,
                  transition: 'var(--transition)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div 
                        style={{ 
                          fontSize: '1.6rem', 
                          background: isCompleted ? 'rgba(255, 120, 153, 0.15)' : 'rgba(0,0,0,0.05)', 
                          width: '42px', 
                          height: '42px', 
                          borderRadius: 'var(--radius-md)',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          filter: isCompleted ? 'none' : 'grayscale(100%)'
                        }}
                      >
                        {ach.badgeIcon}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>{ach.title}</h4>
                        <span className="badge" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', background: 'var(--bg-surface)' }}>{ach.category}</span>
                      </div>
                    </div>

                    {isCompleted ? (
                      <span className="badge badge-safe" style={{ fontSize: '0.68rem', fontWeight: 800 }}>UNLOCKED</span>
                    ) : (
                      <Lock size={14} style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }} />
                    )}
                  </div>

                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.6rem', lineHeight: 1.4 }}>
                    {ach.description}
                  </p>

                  {!isCompleted && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem', fontStyle: 'italic' }}>
                      Requirement: {ach.target - ach.progress} more needed
                    </div>
                  )}

                  {isCompleted && ach.unlockedAt && (
                    <div style={{ fontSize: '0.68rem', color: 'var(--success)', marginTop: '0.4rem', fontWeight: 700 }}>
                      Unlocked {new Date(ach.unlockedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    <span>Progress</span>
                    <span>{ach.progress} / {ach.target} ({Math.min(100, pct)}%)</span>
                  </div>

                  <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${Math.min(100, pct)}%`, 
                        background: isCompleted ? 'var(--success)' : 'var(--primary)',
                        borderRadius: '6px'
                      }} 
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.7rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Reward</span>
                    <span style={{ fontWeight: 800, color: 'var(--primary)' }}>+{ach.xpReward} XP</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. RECENT XP ACTIVITY & FUTURE REWARDS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.2rem' }}>
        
        {/* Recent XP Activity Stream */}
        <div className="section-card" style={{ padding: '1.4rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.8rem' }}>
            <TrendingUp size={18} style={{ color: 'var(--primary)' }} /> Recent XP Activity
          </h3>

          {data.recentActivity.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              No XP activity recorded yet. Start by attending a class or completing a study session!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '380px', overflowY: 'auto' }}>
              {data.recentActivity.map((act) => (
                <div 
                  key={act.id}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    background: 'var(--bg-app)', 
                    padding: '0.55rem 0.8rem', 
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '0.9rem' }}>{act.icon}</span>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{act.displayTitle}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {new Date(act.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--success)' }}>
                    +{act.xpAmount} XP
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Future Rewards & Unlockables Showcase */}
        <div className="section-card" style={{ padding: '1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Gift size={18} style={{ color: 'var(--primary)' }} /> Upcoming Rewards
            </h3>
            <span className="badge" style={{ background: 'var(--bg-app)', color: 'var(--text-muted)', fontSize: '0.65rem' }}>
              ROADMAP
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.8rem' }}>
            Future milestones and unlockable cosmetics earned through academic consistency:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {data.futureRewards.map((reward) => (
              <div 
                key={reward.id}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  background: reward.isUnlocked ? 'var(--bg-surface)' : 'var(--bg-app)', 
                  padding: '0.6rem 0.8rem', 
                  borderRadius: 'var(--radius-sm)',
                  border: reward.isUnlocked ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  opacity: reward.isUnlocked ? 1 : 0.75
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>{reward.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{reward.title}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{reward.type}</div>
                  </div>
                </div>
                
                {reward.isUnlocked ? (
                  <span className="badge badge-safe" style={{ fontSize: '0.65rem', fontWeight: 800 }}>UNLOCKED</span>
                ) : (
                  <span className="badge" style={{ fontSize: '0.68rem', background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
                    Level {reward.reqLevel}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
