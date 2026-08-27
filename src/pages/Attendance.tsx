import React, { useEffect, useState } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { AlertTriangle, Calendar, BookOpen } from 'lucide-react';
import { formatLocalDate } from '../utils/dateUtils';

interface AttendanceStat {
  id: string;
  name: string;
  code: string;
  color: string;
  targetAttendance: number;
  presentCount: number;
  absentCount: number;
  cancelledCount: number;
  totalLogged: number;
  totalActive: number;
  currentPercentage: number;
  classesCanMiss: number;
  classesToAttend: number;
  status: 'safe' | 'danger';
}

export const Attendance: React.FC = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState<AttendanceStat[]>([]);
  const [todaySubjectIds, setTodaySubjectIds] = useState<Set<string>>(new Set());
  const [todaySubjectTimes, setTodaySubjectTimes] = useState<Record<string, { startTime: string; timeRange: string }>>({});
  const [filterMode, setFilterMode] = useState<'today' | 'all'>('today');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Past Date Logging States
  const [logPastSubjectId, setLogPastSubjectId] = useState<string>('');
  const [logPastDate, setLogPastDate] = useState<string>(formatLocalDate(new Date()));
  const [logPastStatus, setLogPastStatus] = useState<'present' | 'absent' | 'cancelled'>('present');
  const [logPastLoading, setLogPastLoading] = useState<boolean>(false);

  // Simulator states stored per subject by subject_id
  const [simulators, setSimulators] = useState<Record<string, { value: number; mode: 'miss' | 'attend' }>>({});

  // Auto-sync selected subject for past logs once stats load
  useEffect(() => {
    if (stats.length > 0 && !logPastSubjectId) {
      setLogPastSubjectId(stats[0].id);
    }
  }, [stats, logPastSubjectId]);

  const fetchStats = async () => {
    try {
      const todayStr = formatLocalDate(new Date());
      const [statsRes, occRes] = await Promise.all([
        fetch(`${API_BASE_URL}/academic/attendance/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/academic/calendar/occurrences?startDate=${todayStr}&endDate=${todayStr}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!statsRes.ok) {
        throw new Error('Failed to load attendance metrics.');
      }

      const data: AttendanceStat[] = await statsRes.json();
      setStats(data);

      if (occRes.ok) {
        const occurrences = await occRes.json();
        const subjectIds = new Set<string>();
        const timesMap: Record<string, { startTime: string; timeRange: string }> = {};

        occurrences.forEach((occ: any) => {
          if (occ.subject_id) {
            subjectIds.add(occ.subject_id);
            const st = occ.start_time || '00:00';
            const et = occ.end_time || '';
            const range = et ? `${st} - ${et}` : st;
            if (!timesMap[occ.subject_id] || st < timesMap[occ.subject_id].startTime) {
              timesMap[occ.subject_id] = { startTime: st, timeRange: range };
            }
          }
        });

        setTodaySubjectIds(subjectIds);
        setTodaySubjectTimes(timesMap);
      }
      
      // Initialize simulator defaults for subjects that don't have them yet
      setSimulators(prev => {
        const next = { ...prev };
        data.forEach(s => {
          if (!next[s.id]) {
            next[s.id] = { value: 1, mode: s.status === 'safe' ? 'miss' : 'attend' };
          }
        });
        return next;
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error fetching stats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStats();
    }
  }, [token]);

  // Log attendance record for custom date
  const handleLogPastAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logPastSubjectId || !logPastDate || !logPastStatus) {
      alert('Please fill out all fields to record past attendance.');
      return;
    }
    try {
      setLogPastLoading(true);
      const res = await fetch(`${API_BASE_URL}/academic/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject_id: logPastSubjectId,
          date: logPastDate,
          status: logPastStatus
        })
      });

      if (res.ok) {
        fetchStats();
        alert('Historical attendance log saved successfully!');
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to record attendance');
      }
    } catch (err) {
      console.error('Error logging past attendance:', err);
    } finally {
      setLogPastLoading(false);
    }
  };

  // Log attendance record today
  const handleLogAttendance = async (subjectId: string, status: 'present' | 'absent' | 'cancelled') => {
    const today = formatLocalDate(new Date());
    try {
      const res = await fetch(`${API_BASE_URL}/academic/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject_id: subjectId,
          date: today,
          status
        })
      });

      if (res.ok) {
        fetchStats();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to record attendance');
      }
    } catch (err) {
      console.error('Error logging attendance:', err);
    }
  };

  const handleSimChange = (subjectId: string, value: number) => {
    setSimulators(prev => ({
      ...prev,
      [subjectId]: { ...prev[subjectId], value }
    }));
  };

  const handleSimModeChange = (subjectId: string, mode: 'miss' | 'attend') => {
    setSimulators(prev => ({
      ...prev,
      [subjectId]: { ...prev[subjectId], mode, value: 1 }
    }));
  };

  const getSimulatedPercentage = (subject: AttendanceStat, simValue: number, simMode: 'miss' | 'attend') => {
    const p = subject.presentCount;
    const active = subject.totalActive;
    if (simMode === 'miss') {
      const newTotal = active + simValue;
      return newTotal > 0 ? parseFloat(((p / newTotal) * 100).toFixed(1)) : 100.0;
    } else {
      const newPresent = p + simValue;
      const newTotal = active + simValue;
      return newTotal > 0 ? parseFloat(((newPresent / newTotal) * 100).toFixed(1)) : 100.0;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ color: 'var(--text-secondary)' }}>Calculating attendance logs...</div>
      </div>
    );
  }

  const displayedStats = filterMode === 'today'
    ? stats
        .filter(s => todaySubjectIds.has(s.id))
        .sort((a, b) => {
          const timeA = todaySubjectTimes[a.id]?.startTime || '99:99';
          const timeB = todaySubjectTimes[b.id]?.startTime || '99:99';
          return timeA.localeCompare(timeB);
        })
    : stats;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      {error && (
        <div className="alert-banner danger">
          <span>{error}</span>
        </div>
      )}

      {/* Filter Toggle: Today's Classes vs All Subjects */}
      {stats.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg-surface)', padding: '0.3rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={() => setFilterMode('today')}
              style={{
                padding: '0.45rem 1rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                background: filterMode === 'today' ? 'var(--primary)' : 'transparent',
                color: filterMode === 'today' ? '#ffffff' : 'var(--text-secondary)',
                transition: 'var(--transition)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Calendar size={14} />
              <span>Today's Classes</span>
              <span style={{ fontSize: '0.7rem', opacity: 0.85, background: filterMode === 'today' ? 'rgba(0,0,0,0.2)' : 'var(--bg-app)', padding: '0.1rem 0.4rem', borderRadius: '10px' }}>
                {stats.filter(s => todaySubjectIds.has(s.id)).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('all')}
              style={{
                padding: '0.45rem 1rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                background: filterMode === 'all' ? 'var(--primary)' : 'transparent',
                color: filterMode === 'all' ? '#ffffff' : 'var(--text-secondary)',
                transition: 'var(--transition)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <BookOpen size={14} />
              <span>All Subjects</span>
              <span style={{ fontSize: '0.7rem', opacity: 0.85, background: filterMode === 'all' ? 'rgba(0,0,0,0.2)' : 'var(--bg-app)', padding: '0.1rem 0.4rem', borderRadius: '10px' }}>
                {stats.length}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {stats.length === 0 ? (
        <div className="section-card" style={{ textAlign: 'center', padding: '4rem 1.5rem', color: 'var(--text-secondary)' }}>
          <AlertTriangle size={48} style={{ color: 'var(--warning)', marginBottom: '1rem', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Subjects Found</h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            Before tracking attendance logs, you need to add your subjects first on the **Timetable** page.
          </p>
        </div>
      ) : filterMode === 'today' && displayedStats.length === 0 ? (
        <div className="section-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>🏖️</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>No Classes Scheduled Today</h3>
          <p style={{ fontSize: '0.85rem', marginBottom: '1.2rem', maxWidth: '420px', margin: '0 auto 1.2rem' }}>
            You have no timetable lectures scheduled for today. Enjoy your break or switch to <strong>All Subjects</strong> to manage attendance across your entire semester.
          </p>
          <button 
            type="button"
            className="btn-secondary" 
            onClick={() => setFilterMode('all')}
            style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
          >
            View All Subjects 📚
          </button>
        </div>
      ) : (
        <div className="attendance-grid">
          {displayedStats.map(subject => {
            const radius = 34;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (subject.currentPercentage / 100) * circumference;
            const isSafe = subject.currentPercentage >= subject.targetAttendance;
            
            // Get simulator inputs
            const sim = simulators[subject.id] || { value: 1, mode: 'miss' };
            const simPercentage = getSimulatedPercentage(subject, sim.value, sim.mode);
            const isSimSafe = simPercentage >= subject.targetAttendance;

            return (
              <div 
                key={subject.id} 
                className="attendance-card" 
                style={{ borderTop: `4px solid ${subject.color}` }}
              >
                
                {/* Subject Info Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span className="badge" style={{ background: subject.color, color: '#1a0b14' }}>{subject.code}</span>
                      {filterMode === 'today' && todaySubjectTimes[subject.id] && (
                        <span className="badge" style={{ background: 'var(--bg-app)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', fontSize: '0.7rem', fontWeight: 700 }}>
                          🕒 {todaySubjectTimes[subject.id].timeRange}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 750, marginTop: '0.3rem' }}>{subject.name}</h3>
                  </div>
                  
                  <span 
                    className="badge" 
                    style={{ 
                      background: isSafe ? 'var(--success-glow)' : 'var(--danger-glow)', 
                      color: isSafe ? 'var(--success)' : 'var(--danger)',
                      border: `1px solid ${isSafe ? 'var(--success)' : 'var(--danger)'}`
                    }}
                  >
                    {isSafe ? 'SAFE' : 'DANGER'}
                  </span>
                </div>

                {/* Progress Circle & Text Row */}
                <div className="attendance-card-progress">
                  <div className="progress-ring-container">
                    <svg width="80" height="80">
                      <circle
                        stroke="rgba(0,0,0,0.06)"
                        fill="transparent"
                        strokeWidth="7"
                        r={radius}
                        cx="40"
                        cy="40"
                      />
                      <circle
                        className="progress-ring-circle"
                        stroke={isSafe ? 'var(--success)' : 'var(--danger)'}
                        fill="transparent"
                        strokeWidth="7"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        r={radius}
                        cx="40"
                        cy="40"
                      />
                    </svg>
                    <div className="progress-ring-text" style={{ color: isSafe ? 'var(--success)' : 'var(--danger)' }}>
                      {subject.currentPercentage}%
                    </div>
                  </div>

                  <div style={{ flex: 1, paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Target threshold: <strong>{subject.targetAttendance}%</strong>
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {subject.totalActive === 0 ? (
                        'No lectures recorded yet'
                      ) : isSafe ? (
                        <>
                          You can miss <strong style={{ color: 'var(--success)' }}>{subject.classesCanMiss}</strong> class{subject.classesCanMiss !== 1 ? 'es' : ''} safely.
                        </>
                      ) : (
                        <>
                          Attend <strong style={{ color: 'var(--danger)' }}>{subject.classesToAttend}</strong> consecutive class{subject.classesToAttend !== 1 ? 'es' : ''} to reach target.
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Numbers Grid */}
                <div className="attendance-stat-box">
                  <div>
                    <div className="stat-num" style={{ color: 'var(--success)' }}>{subject.presentCount}</div>
                    <div className="stat-lbl">Attended</div>
                  </div>
                  <div>
                    <div className="stat-num" style={{ color: 'var(--danger)' }}>{subject.absentCount}</div>
                    <div className="stat-lbl">Missed</div>
                  </div>
                  <div>
                    <div className="stat-num" style={{ color: 'var(--warning)' }}>{subject.cancelledCount}</div>
                    <div className="stat-lbl">Cancelled</div>
                  </div>
                </div>

                {/* Quick Log Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Quick Log Today's Attendance:</span>
                  <div className="attendance-log-buttons">
                    <button className="btn-log" onClick={() => handleLogAttendance(subject.id, 'present')}>
                      Present
                    </button>
                    <button className="btn-log" onClick={() => handleLogAttendance(subject.id, 'absent')}>
                      Absent
                    </button>
                    <button className="btn-log" onClick={() => handleLogAttendance(subject.id, 'cancelled')}>
                      Cancelled
                    </button>
                  </div>
                </div>

                {/* Simulator Calculator Widget */}
                <div className="attendance-simulator">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.75rem' }}>Attendance Simulator</span>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <button 
                        className="badge" 
                        style={{ 
                          background: sim.mode === 'miss' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', 
                          border: 'none', 
                          cursor: 'pointer' 
                        }}
                        onClick={() => handleSimModeChange(subject.id, 'miss')}
                      >
                        If I Miss
                      </button>
                      <button 
                        className="badge" 
                        style={{ 
                          background: sim.mode === 'attend' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', 
                          border: 'none', 
                          cursor: 'pointer' 
                        }}
                        onClick={() => handleSimModeChange(subject.id, 'attend')}
                      >
                        If I Attend
                      </button>
                    </div>
                  </div>

                  <div className="simulator-slider-row">
                    <input 
                      type="range" 
                      min="1" 
                      max="20" 
                      value={sim.value}
                      onChange={(e) => handleSimChange(subject.id, parseInt(e.target.value, 10))}
                      className="slider-input" 
                    />
                    <span style={{ fontWeight: 700, minWidth: '24px', textAlign: 'right' }}>{sim.value}</span>
                  </div>

                  <div className={`simulator-result-box ${isSimSafe ? 'status-safe' : 'status-danger'}`}>
                    Simulated Attendance: <strong>{simPercentage}%</strong> ({isSimSafe ? 'Above Target' : 'Below Target'})
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Relocated: Log Past Attendance Card */}
      {stats.length > 0 && (
        <div className="section-card" style={{ padding: '1.2rem 1.6rem', background: 'var(--bg-surface)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.8rem', color: 'var(--text-primary)' }}>Log Past Attendance ✦</h3>
          <form onSubmit={handleLogPastAttendance} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ margin: 0, minWidth: '160px', flex: 1 }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Course / Subject</label>
              <select 
                className="form-select"
                value={logPastSubjectId}
                onChange={(e) => setLogPastSubjectId(e.target.value)}
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
              >
                {stats.map(s => (
                  <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0, minWidth: '140px', flex: 0.8 }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Select Date</label>
              <input 
                type="date"
                className="form-input"
                value={logPastDate}
                onChange={(e) => setLogPastDate(e.target.value)}
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0, minWidth: '220px', flex: 1.2 }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Attendance Status</label>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                {(['present', 'absent', 'cancelled'] as const).map(st => (
                  <button
                    key={st}
                    type="button"
                    className="badge"
                    onClick={() => setLogPastStatus(st)}
                    style={{
                      flex: 1,
                      padding: '0.5rem 0',
                      textTransform: 'capitalize',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: logPastStatus === st 
                        ? (st === 'present' ? 'var(--success)' : st === 'absent' ? 'var(--danger)' : 'var(--warning)') 
                        : 'var(--bg-app)',
                      color: logPastStatus === st ? '#ffffff' : 'var(--text-secondary)',
                      border: '1px solid var(--border-color)',
                      transition: 'var(--transition)',
                      borderRadius: 'var(--radius-md)'
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ padding: '0.55rem 1.2rem', fontSize: '0.85rem', minWidth: '110px' }}
              disabled={logPastLoading}
            >
              {logPastLoading ? 'Logging...' : 'Log Attendance'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
