import React, { useEffect, useState } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { ChevronDown, ChevronUp, Settings } from 'lucide-react';
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
  
  // DEFAULT PRIMARY VIEW IS TODAY'S CLASSES
  const [filterMode, setFilterMode] = useState<'today' | 'all'>('today');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // User-configurable Attendance Threshold (Default: 75%)
  const [globalThreshold, setGlobalThreshold] = useState<number>(() => {
    const saved = localStorage.getItem('campusly_attendance_threshold');
    return saved ? parseInt(saved, 10) : 75;
  });
  const [showThresholdSetting, setShowThresholdSetting] = useState<boolean>(false);
  const [tempThreshold, setTempThreshold] = useState<number>(globalThreshold);

  // Simulator states stored per subject by subject_id
  const [simulators, setSimulators] = useState<Record<string, { value: number; mode: 'miss' | 'attend' }>>({});
  const [expandedSimulators, setExpandedSimulators] = useState<Record<string, boolean>>({});

  const saveThreshold = (newVal: number) => {
    const val = Math.min(100, Math.max(50, newVal));
    setGlobalThreshold(val);
    localStorage.setItem('campusly_attendance_threshold', val.toString());
    setShowThresholdSetting(false);
  };

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
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStats();
    }
  }, [token]);

  const handleMarkAttendance = async (subjectId: string, status: 'present' | 'absent' | 'cancelled') => {
    try {
      const res = await fetch(`${API_BASE_URL}/academic/attendance/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject_id: subjectId,
          date: formatLocalDate(new Date()),
          status
        })
      });

      if (!res.ok) {
        throw new Error('Failed to mark attendance.');
      }
      fetchStats();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleSimExpand = (id: string) => {
    setExpandedSimulators(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const updateSimulator = (subjectId: string, value: number, mode: 'miss' | 'attend') => {
    setSimulators(prev => ({
      ...prev,
      [subjectId]: { value, mode }
    }));
  };

  const getSimulatedPercentage = (subject: AttendanceStat, count: number, mode: 'miss' | 'attend') => {
    const present = subject.presentCount || 0;
    const total = subject.totalActive || (subject.presentCount + subject.absentCount) || 0;
    
    if (mode === 'miss') {
      const newTotal = total + count;
      return newTotal > 0 ? parseFloat(((present / newTotal) * 100).toFixed(1)) : 100.0;
    } else {
      const newPresent = present + count;
      const newTotal = total + count;
      return newTotal > 0 ? parseFloat(((newPresent / newTotal) * 100).toFixed(1)) : 100.0;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--ink-soft)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.15rem' }}>
          Calculating attendance observatory... ✧
        </div>
      </div>
    );
  }

  const todayStats = stats
    .filter(s => todaySubjectIds.has(s.id))
    .sort((a, b) => {
      const timeA = todaySubjectTimes[a.id]?.startTime || '99:99';
      const timeB = todaySubjectTimes[b.id]?.startTime || '99:99';
      return timeA.localeCompare(timeB);
    });

  const displayedStats = filterMode === 'today' ? todayStats : stats;

  const totalClassesAttended = stats.reduce((acc, curr) => acc + curr.presentCount, 0);
  const totalClassesConducted = stats.reduce((acc, curr) => acc + (curr.presentCount + curr.absentCount), 0);
  const overallAvg = totalClassesConducted > 0 
    ? Math.round((totalClassesAttended / totalClassesConducted) * 100)
    : 100;

  // Dynamic status evaluation based on user-configured threshold
  const getHealthStatus = (current: number, target: number) => {
    if (current > target) {
      return { label: 'Above Threshold', color: 'var(--success-text)', indicator: '● Safe Reserve' };
    }
    if (current === target) {
      return { label: 'At Threshold', color: 'var(--success-text)', indicator: '● Safe' };
    }
    return { label: 'Below Threshold', color: 'var(--danger)', indicator: '▲ Warning' };
  };

  const aggregateHealth = getHealthStatus(overallAvg, globalThreshold);

  return (
    <div className="animate-page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', maxWidth: '1240px', margin: '0 auto', paddingBottom: '3.5rem' }}>
      
      {/* 1. OPEN CANVAS EDITORIAL HEADER */}
      <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '2rem' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span className="sci-fi-tag">ATTENDANCE ENGINE</span>
            
            {/* Configurable Threshold Setting */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => {
                  setTempThreshold(globalThreshold);
                  setShowThresholdSetting(!showThresholdSetting);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--ink-soft)',
                  background: 'transparent',
                  border: '1px solid var(--line)',
                  borderRadius: '9999px',
                  padding: '0.25rem 0.65rem',
                  cursor: 'pointer'
                }}
                title="Configure institutional attendance requirement"
              >
                <Settings size={11} style={{ color: 'var(--petal)' }} />
                <span>Req: {globalThreshold}%</span>
              </button>

              {/* Threshold Popover */}
              {showThresholdSetting && (
                <div style={{
                  position: 'absolute',
                  top: '115%',
                  left: 0,
                  zIndex: 50,
                  background: 'var(--pearl)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  padding: '1.2rem',
                  boxShadow: 'var(--shadow-lift)',
                  width: '260px'
                }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.4rem' }}>
                    Required Attendance Target
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--ink-soft)', margin: '0 0 0.8rem 0', lineHeight: 1.4 }}>
                    Set your institution or personal attendance requirement (default 75%).
                  </p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                    <input 
                      type="range"
                      min="50"
                      max="95"
                      value={tempThreshold}
                      onChange={(e) => setTempThreshold(parseInt(e.target.value, 10))}
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 800, minWidth: '35px' }}>
                      {tempThreshold}%
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowThresholdSetting(false)}
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem', background: 'transparent', border: '1px solid var(--line)', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => saveThreshold(tempThreshold)}
                      style={{ padding: '0.3rem 0.75rem', fontSize: '0.72rem', background: 'var(--plum)', color: 'var(--cream)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 700 }}
                    >
                      Save Target
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Primary View: Today's Classes, Secondary: All Subjects */}
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={() => setFilterMode('today')}
              style={{
                padding: '0.4rem 0.9rem',
                fontSize: '0.76rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                border: '1px solid var(--line)',
                borderRadius: '9999px',
                cursor: 'pointer',
                background: filterMode === 'today' ? 'var(--plum)' : 'transparent',
                color: filterMode === 'today' ? 'var(--cream)' : 'var(--ink-soft)',
                transition: 'all 0.15s'
              }}
            >
              TODAY'S CLASSES ({todayStats.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              style={{
                padding: '0.4rem 0.9rem',
                fontSize: '0.76rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                border: '1px solid var(--line)',
                borderRadius: '9999px',
                cursor: 'pointer',
                background: filterMode === 'all' ? 'var(--plum)' : 'transparent',
                color: filterMode === 'all' ? 'var(--cream)' : 'var(--ink-soft)',
                transition: 'all 0.15s'
              }}
            >
              ALL SUBJECTS ({stats.length})
            </button>
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
          Small measures, <br />
          <span style={{ fontStyle: 'italic', color: 'var(--petal)', fontWeight: 300 }}>kept gently</span>.
        </h1>

        {/* Dynamic Standing Display */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '2.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Aggregate Standing (Req: {globalThreshold}%)
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginTop: '0.2rem' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 400, lineHeight: 1, color: 'var(--ink)' }}>
                {overallAvg}%
              </span>
              <span style={{ fontSize: '0.82rem', color: aggregateHealth.color, fontWeight: 700 }}>
                {aggregateHealth.indicator}
              </span>
            </div>
          </div>

          <div style={{ width: '1px', height: '40px', background: 'var(--line)' }} />

          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Logged Attendance
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 400, color: 'var(--ink)', marginTop: '0.2rem' }}>
              {totalClassesAttended} <span style={{ fontSize: '0.9rem', color: 'var(--ink-faint)' }}>/ {totalClassesConducted} sessions</span>
            </div>
          </div>
        </div>

      </div>

      {error && (
        <div style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* 2. SUBJECT LIST: TODAY'S CLASSES BY DEFAULT */}
      {displayedStats.length === 0 ? (
        <div style={{ padding: '3.5rem 0', textAlign: 'center', color: 'var(--ink-soft)' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem' }}>
            {filterMode === 'today' ? 'No scheduled classes today.' : 'No enrolled subjects found.'}
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--ink-faint)' }}>
            {filterMode === 'today' ? 'Switch to "All Subjects" to view your full course roster or log past attendance.' : 'Add your courses in the Timetable section to begin logging attendance.'}
          </p>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.8rem', borderBottom: '1px solid var(--line)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--ink-faint)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {filterMode === 'today' ? "Today's Schedule & Attendance" : 'Enrolled Course Breakdown'}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--ink-faint)' }}>
              TARGET / CURRENT
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {displayedStats.map(subject => {
              const target = subject.targetAttendance || globalThreshold;
              const subjectHealth = getHealthStatus(subject.currentPercentage, target);
              const isSafe = subject.currentPercentage >= target;
              
              const sim = simulators[subject.id] || { value: 1, mode: 'miss' };
              const simPercentage = getSimulatedPercentage(subject, sim.value, sim.mode);
              const isExpanded = expandedSimulators[subject.id];
              const sessionTime = todaySubjectTimes[subject.id]?.timeRange;

              return (
                <div 
                  key={subject.id}
                  style={{
                    borderBottom: '1px solid var(--line)',
                    padding: '1.4rem 0',
                    transition: 'background 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.4rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, color: subject.color || 'var(--petal)', width: '70px' }}>
                        {subject.code}
                      </span>
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 500, color: 'var(--ink)', margin: 0 }}>
                          {subject.name}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.74rem', color: 'var(--ink-faint)', marginTop: '0.15rem' }}>
                          {sessionTime && <span style={{ fontWeight: 700, color: 'var(--ink)' }}>Today {sessionTime} ·</span>}
                          <span>Target {target}%</span>
                          <span>·</span>
                          <span>{subject.presentCount} attended</span>
                          <span>·</span>
                          <span>{subject.absentCount} missed</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.8rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.35rem', fontWeight: 700, color: subjectHealth.color }}>
                          {subject.currentPercentage}%
                        </div>
                        <div style={{ fontSize: '0.7rem', color: subjectHealth.color, fontWeight: 650 }}>
                          {isSafe 
                            ? `+${subject.classesCanMiss || 0} safe absences` 
                            : `Must attend next ${subject.classesToAttend || 1} sessions`}
                        </div>
                      </div>

                      {/* Quick Action Logging Pills */}
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          onClick={() => handleMarkAttendance(subject.id, 'present')}
                          style={{
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            background: 'transparent',
                            color: 'var(--success-text)',
                            border: '1px solid var(--line)',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          + PRESENT
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMarkAttendance(subject.id, 'absent')}
                          style={{
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            background: 'transparent',
                            color: 'var(--danger)',
                            border: '1px solid var(--line)',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          + ABSENT
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSimExpand(subject.id)}
                          style={{
                            padding: '0.35rem 0.55rem',
                            background: 'transparent',
                            color: 'var(--ink-faint)',
                            border: '1px solid var(--line)',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                          title="Simulate Future Classes"
                        >
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Collapsible Simulation Slider */}
                  {isExpanded && (
                    <div style={{ marginTop: '1.2rem', paddingTop: '1rem', borderTop: '1px dashed var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
                          If I {sim.mode === 'miss' ? 'miss' : 'attend'} next
                        </span>
                        <input 
                          type="range"
                          min="1"
                          max="10"
                          value={sim.value}
                          onChange={(e) => updateSimulator(subject.id, parseInt(e.target.value), sim.mode)}
                          style={{ width: '100px' }}
                        />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700 }}>
                          {sim.value} {sim.value === 1 ? 'class' : 'classes'}
                        </span>
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          <button
                            type="button"
                            onClick={() => updateSimulator(subject.id, sim.value, 'miss')}
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', border: '1px solid var(--line)', borderRadius: '3px', background: sim.mode === 'miss' ? 'var(--petal)' : 'transparent', color: sim.mode === 'miss' ? '#ffffff' : 'var(--ink-soft)' }}
                          >
                            Miss
                          </button>
                          <button
                            type="button"
                            onClick={() => updateSimulator(subject.id, sim.value, 'attend')}
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', border: '1px solid var(--line)', borderRadius: '3px', background: sim.mode === 'attend' ? 'var(--petal)' : 'transparent', color: sim.mode === 'attend' ? '#ffffff' : 'var(--ink-soft)' }}
                          >
                            Attend
                          </button>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>
                        Projected: <strong>{simPercentage}%</strong> ({simPercentage >= target ? 'Safe' : 'Below Target'})
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
