import React, { useEffect, useState } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { MapPin, X, Sparkles, Trash2, Grid, List } from 'lucide-react';
import { formatLocalDate, addDays } from '../utils/dateUtils';

interface Subject {
  id: string;
  name: string;
  code: string;
  target_attendance: number;
  color: string;
}

interface ClassItem {
  id: string;
  subject_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  location: string;
  subject_name: string;
  subject_code: string;
  subject_color: string;
  start_date?: string;
  end_date?: string;
  recurrence_type?: string;
  recurrence_days?: string | null;
}

interface AcademicBreak {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
  { value: 0, label: 'Sunday', short: 'Sun' }
];

const PRESETS_COLORS = [
  '#f472b6',
  '#99f6e4',
  '#e9d5ff',
  '#fce7f3',
  '#fef08a',
  '#fed7aa',
];

export const Timetable: React.FC = () => {
  const { token } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [breaks, setBreaks] = useState<AcademicBreak[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // View Mode: 'week' (Default) vs 'day'
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [selectedDay, setSelectedDay] = useState<number>(1); // Default to Monday

  // Modal control states
  const [showClassModal, setShowClassModal] = useState<boolean>(false);
  const [showSubjectModal, setShowSubjectModal] = useState<boolean>(false);
  const [showBreaksModal, setShowBreaksModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);

  // Add Class Form State
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [classDay, setClassDay] = useState<number>(1);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [location, setLocation] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Scheduler inputs
  const [startDate, setStartDate] = useState<string>(formatLocalDate(new Date()));
  const [endDate, setEndDate] = useState<string>(formatLocalDate(addDays(new Date(), 180)));
  const [recurrenceType, setRecurrenceType] = useState<string>('weekly');
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [isSubmittingClass, setIsSubmittingClass] = useState<boolean>(false);

  // Add Subject Form State
  const [subjectName, setSubjectName] = useState<string>('');
  const [subjectCode, setSubjectCode] = useState<string>('');
  const [targetAttendance, setTargetAttendance] = useState<number>(75);
  const [selectedColor, setSelectedColor] = useState<string>(PRESETS_COLORS[0]);

  // Break Form State
  const [breakName, setBreakName] = useState<string>('');
  const [breakStartDate, setBreakStartDate] = useState<string>('');
  const [breakEndDate, setBreakEndDate] = useState<string>('');
  const [breakSubmitting, setBreakSubmitting] = useState<boolean>(false);

  // AI Import Form State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [branch, setBranch] = useState<string>('');
  const [semester, setSemester] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractedClasses, setExtractedClasses] = useState<any[]>([]);
  const [importError, setImportError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subRes, classRes, breaksRes] = await Promise.all([
        fetch(`${API_BASE_URL}/academic/subjects`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/academic/classes`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/academic/breaks`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!subRes.ok || !classRes.ok) {
        throw new Error('Failed to load timetable data.');
      }

      const subData = await subRes.json();
      const classData = await classRes.json();
      const breaksData = breaksRes.ok ? await breaksRes.json() : [];

      setSubjects(subData);
      setClasses(classData);
      setBreaks(breaksData);

      if (subData.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(subData[0].id);
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
      fetchData();
    }
  }, [token]);

  const handleDeleteClass = async (id: string) => {
    if (!window.confirm('Delete this scheduled class?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/academic/classes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setClasses(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startEditClass = (c: ClassItem) => {
    setEditingClassId(c.id);
    setSelectedSubjectId(c.subject_id);
    setClassDay(c.day_of_week);
    setStartTime(c.start_time);
    setEndTime(c.end_time);
    setLocation(c.location || '');
    setStartDate(c.start_date ? formatLocalDate(new Date(c.start_date)) : formatLocalDate(new Date()));
    setEndDate(c.end_date ? formatLocalDate(new Date(c.end_date)) : formatLocalDate(addDays(new Date(), 180)));
    setRecurrenceType(c.recurrence_type || 'weekly');
    if (c.recurrence_days) {
      try {
        setRecurrenceDays(JSON.parse(c.recurrence_days));
      } catch (e) {
        setRecurrenceDays([c.day_of_week]);
      }
    } else {
      setRecurrenceDays([c.day_of_week]);
    }
    setShowClassModal(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId) {
      setFormError('Please select a subject.');
      return;
    }

    setIsSubmittingClass(true);
    setFormError(null);

    const payload = {
      subject_id: selectedSubjectId,
      day_of_week: classDay,
      start_time: startTime,
      end_time: endTime,
      location: location.trim(),
      start_date: startDate,
      end_date: endDate,
      recurrence_type: recurrenceType,
      recurrence_days: JSON.stringify(recurrenceType === 'weekly' ? [classDay] : recurrenceDays)
    };

    try {
      const url = editingClassId 
        ? `${API_BASE_URL}/academic/classes/${editingClassId}` 
        : `${API_BASE_URL}/academic/classes`;
      const method = editingClassId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save class slot.');
      }

      fetchData();
      setShowClassModal(false);
      setEditingClassId(null);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmittingClass(false);
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim() || !subjectCode.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/academic/subjects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: subjectName.trim(),
          code: subjectCode.trim(),
          target_attendance: targetAttendance,
          color: selectedColor
        })
      });

      if (res.ok) {
        fetchData();
        setSubjectName('');
        setSubjectCode('');
        setShowSubjectModal(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Term Breaks Handlers
  const handleAddBreak = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!breakName.trim() || !breakStartDate || !breakEndDate) return;
    setBreakSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/academic/breaks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: breakName.trim(),
          start_date: breakStartDate,
          end_date: breakEndDate
        })
      });
      if (res.ok) {
        setBreakName('');
        setBreakStartDate('');
        setBreakEndDate('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBreakSubmitting(false);
    }
  };

  const handleDeleteBreak = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/academic/breaks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setBreaks(prev => prev.filter(b => b.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // AI Timetable Extraction Handler
  const handleExtractTimetable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      setImportError('Please select a timetable image or PDF.');
      return;
    }

    setIsExtracting(true);
    setImportError(null);

    const formData = new FormData();
    formData.append('file', importFile);
    if (branch) formData.append('branch', branch);
    if (semester) formData.append('semester', semester);

    try {
      const res = await fetch(`${API_BASE_URL}/ai/extract-timetable`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze timetable document.');
      }

      setExtractedClasses(Array.isArray(data) ? data : data.classes || []);
    } catch (err: any) {
      setImportError(err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveImportedClasses = async () => {
    try {
      for (const item of extractedClasses) {
        const dayMap: Record<string, number> = {
          'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6, 'sunday': 0
        };
        const dayNum = dayMap[item.day?.toLowerCase()] ?? 1;

        let sub = subjects.find(s => s.code.toLowerCase() === (item.subject_code || '').toLowerCase());
        let subId = sub?.id;

        if (!subId && item.subject_name) {
          const createSubRes = await fetch(`${API_BASE_URL}/academic/subjects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              name: item.subject_name,
              code: item.subject_code || item.subject_name.slice(0, 6).toUpperCase(),
              target_attendance: 75,
              color: PRESETS_COLORS[Math.floor(Math.random() * PRESETS_COLORS.length)]
            })
          });
          if (createSubRes.ok) {
            const newSub = await createSubRes.json();
            subId = newSub.id;
          }
        }

        if (subId) {
          await fetch(`${API_BASE_URL}/academic/classes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              subject_id: subId,
              day_of_week: dayNum,
              start_time: item.start_time || '09:00',
              end_time: item.end_time || '10:00',
              location: item.room || item.location || ''
            })
          });
        }
      }

      fetchData();
      setShowImportModal(false);
      setExtractedClasses([]);
      setImportFile(null);
      alert('Imported schedule sessions saved successfully!');
    } catch (err: any) {
      alert('Error saving imported schedule: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--ink-soft)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.15rem' }}>
          Opening weekly schedule atelier... ✧
        </div>
      </div>
    );
  }

  // Weekday columns for the Weekly Timetable Grid
  const weekDaysToRender = DAYS_OF_WEEK.slice(0, 5); // Monday - Friday by default
  const hasWeekendClasses = classes.some(c => c.day_of_week === 6 || c.day_of_week === 0);
  const activeColumns = hasWeekendClasses ? DAYS_OF_WEEK : weekDaysToRender;

  return (
    <div className="animate-page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', maxWidth: '1240px', margin: '0 auto', paddingBottom: '3.5rem' }}>
      
      {/* 1. OPEN CANVAS EDITORIAL HEADER */}
      <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '2rem' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span className="sci-fi-tag">WEEKLY TIMETABLE</span>
            
            {/* View Switch: Weekly Grid vs Day Agenda */}
            <div style={{ display: 'flex', border: '1px solid var(--line)', borderRadius: '4px', overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => setViewMode('week')}
                style={{
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 650,
                  border: 'none',
                  background: viewMode === 'week' ? 'var(--plum)' : 'transparent',
                  color: viewMode === 'week' ? 'var(--cream)' : 'var(--ink-soft)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <Grid size={11} />
                <span>WEEK GRID</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('day')}
                style={{
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 650,
                  border: 'none',
                  background: viewMode === 'day' ? 'var(--plum)' : 'transparent',
                  color: viewMode === 'day' ? 'var(--cream)' : 'var(--ink-soft)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <List size={11} />
                <span>DAY VIEW</span>
              </button>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button 
              type="button"
              onClick={() => setShowBreaksModal(true)}
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.74rem', fontFamily: 'var(--font-mono)', fontWeight: 600, background: 'transparent', border: '1px solid var(--line)', borderRadius: '9999px', cursor: 'pointer', color: 'var(--ink-soft)' }}
            >
              TERM BREAKS ({breaks.length})
            </button>
            <button 
              type="button"
              onClick={() => setShowSubjectModal(true)}
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.74rem', fontFamily: 'var(--font-mono)', fontWeight: 600, background: 'transparent', border: '1px solid var(--line)', borderRadius: '9999px', cursor: 'pointer', color: 'var(--ink-soft)' }}
            >
              MANAGE SUBJECTS
            </button>
            <button 
              type="button"
              onClick={() => {
                setExtractedClasses([]);
                setImportError(null);
                setShowImportModal(true);
              }}
              style={{ padding: '0.4rem 0.95rem', fontSize: '0.74rem', fontFamily: 'var(--font-mono)', fontWeight: 700, background: 'rgba(244, 114, 182, 0.15)', border: '1px solid var(--petal)', borderRadius: '9999px', cursor: 'pointer', color: 'var(--plum)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Sparkles size={12} style={{ color: 'var(--petal)' }} />
              <span>IMPORT WITH AI</span>
            </button>
            <button 
              type="button"
              onClick={() => {
                setEditingClassId(null);
                setSelectedSubjectId(subjects.length > 0 ? subjects[0].id : '');
                setStartTime('09:00');
                setEndTime('10:00');
                setLocation('');
                setStartDate(formatLocalDate(new Date()));
                setEndDate(formatLocalDate(addDays(new Date(), 180)));
                setRecurrenceType('weekly');
                setRecurrenceDays([]);
                setShowClassModal(true);
              }}
              style={{ padding: '0.4rem 1.1rem', fontSize: '0.76rem', fontFamily: 'var(--font-mono)', fontWeight: 700, background: 'var(--plum)', border: 'none', borderRadius: '9999px', cursor: 'pointer', color: 'var(--cream)' }}
            >
              + ADD SESSION
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
          Time you can see the <br />
          <span style={{ fontStyle: 'italic', color: 'var(--petal)', fontWeight: 300 }}>shape of</span>.
        </h1>

        {/* Active Breaks Strip */}
        {breaks.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '1.2rem', padding: '0.6rem 0.9rem', border: '1px dashed var(--petal)', borderRadius: '4px', background: 'rgba(244, 114, 182, 0.06)', width: 'fit-content' }}>
            <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--plum)' }}>
              ✦ ACTIVE TERM BREAKS:
            </span>
            <span style={{ fontSize: '0.76rem', color: 'var(--ink-soft)' }}>
              {breaks.map(b => `${b.name} (${new Date(b.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${new Date(b.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})`).join(' · ')}
            </span>
          </div>
        )}

      </div>

      {error && (
        <div style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* 2. REAL WEEKLY TIMETABLE GRID MATRIX */}
      {viewMode === 'week' ? (
        <div style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${activeColumns.length}, minmax(210px, 1fr))`,
            gap: '1px',
            background: 'var(--line)',
            border: '1px solid var(--line)',
            borderRadius: '4px'
          }}>
            {activeColumns.map(day => {
              const dayClasses = classes
                .filter(c => c.day_of_week === day.value)
                .sort((a, b) => a.start_time.localeCompare(b.start_time));

              return (
                <div 
                  key={day.value}
                  style={{
                    background: 'var(--cream)',
                    minHeight: '440px',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Day Column Header - Uniform Neutral Styling for all Days */}
                  <div style={{
                    padding: '0.9rem 1rem',
                    borderBottom: '1px solid var(--line)',
                    background: 'transparent',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--ink)' }}>
                        {day.label.toUpperCase()}
                      </span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--ink-faint)' }}>
                      {dayClasses.length} {dayClasses.length === 1 ? 'CLASS' : 'CLASSES'}
                    </span>
                  </div>

                  {/* Day Schedule Lanes */}
                  <div style={{ padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                    {dayClasses.length === 0 ? (
                      <div style={{ padding: '2rem 0.5rem', textAlign: 'center', color: 'var(--ink-faint)', fontStyle: 'italic', fontSize: '0.78rem' }}>
                        — Free Day —
                      </div>
                    ) : (
                      dayClasses.map(c => (
                        <div
                          key={c.id}
                          onClick={() => startEditClass(c)}
                          style={{
                            padding: '0.85rem',
                            border: '1px solid var(--line)',
                            borderLeft: `4px solid ${c.subject_color || 'var(--petal)'}`,
                            borderRadius: '3px',
                            background: '#ffffff',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            boxShadow: '0 1px 2px rgba(45, 21, 39, 0.02)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 700, color: c.subject_color || 'var(--petal)' }}>
                              {c.subject_code}
                            </span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--ink-soft)', fontWeight: 650 }}>
                              {c.start_time}–{c.end_time}
                            </span>
                          </div>

                          <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.96rem', fontWeight: 600, color: 'var(--ink)', margin: '0.1rem 0 0.4rem 0', lineHeight: 1.25 }}>
                            {c.subject_name}
                          </h4>

                          {c.location && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--ink-faint)' }}>
                              <MapPin size={10} style={{ color: 'var(--petal)' }} />
                              <span>{c.location}</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      ) : (
        /* DAY AGENDA VIEW */
        <div>
          {/* Day Selector Tabs */}
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {DAYS_OF_WEEK.map(d => {
              const count = classes.filter(c => c.day_of_week === d.value).length;
              const isSelected = selectedDay === d.value;
              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setSelectedDay(d.value)}
                  style={{
                    padding: '0.45rem 0.95rem',
                    fontSize: '0.78rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: isSelected ? 700 : 500,
                    border: isSelected ? '1px solid var(--plum)' : '1px solid var(--line)',
                    borderRadius: '4px',
                    background: isSelected ? 'var(--plum)' : 'transparent',
                    color: isSelected ? 'var(--cream)' : 'var(--ink-soft)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.15s'
                  }}
                >
                  <span>{d.label.slice(0, 3).toUpperCase()}</span>
                  <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>({count})</span>
                </button>
              );
            })}
          </div>

          {classes.filter(c => c.day_of_week === selectedDay).length === 0 ? (
            <div style={{ padding: '3.5rem 0', color: 'var(--ink-faint)', fontStyle: 'italic', fontSize: '0.95rem' }}>
              No scheduled lectures on this day. The afternoon is open.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {classes.filter(c => c.day_of_week === selectedDay).map(c => (
                <div
                  key={c.id}
                  onClick={() => startEditClass(c)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.3rem 0',
                    borderBottom: '1px solid var(--line)',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <div style={{ width: '110px', fontFamily: 'var(--font-mono)', fontSize: '0.84rem', fontWeight: 650, color: 'var(--ink)' }}>
                      {c.start_time}–{c.end_time}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: c.subject_color || 'var(--petal)' }}>
                          {c.subject_code}
                        </span>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 500, color: 'var(--ink)', margin: 0 }}>
                          {c.subject_name}
                        </h3>
                      </div>
                      {c.location && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--ink-faint)', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <MapPin size={11} style={{ color: 'var(--petal)' }} />
                          {c.location}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDeleteClass(c.id); }}
                      style={{ background: 'none', border: 'none', color: 'var(--ink-faint)', cursor: 'pointer' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CLASS MODAL */}
      {showClassModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(45, 21, 39, 0.4)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowClassModal(false)}>
          <div style={{ background: 'var(--pearl)', border: '1px solid var(--line)', borderRadius: '12px', padding: '2.2rem', width: '100%', maxWidth: '460px', boxShadow: 'var(--shadow-lift)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 500, margin: 0 }}>{editingClassId ? 'Edit Session' : 'Schedule Session'}</h3>
              <button onClick={() => setShowClassModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)' }}><X size={18} /></button>
            </div>

            {formError && <div style={{ padding: '0.5rem', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', fontSize: '0.78rem', marginBottom: '1rem' }}>{formError}</div>}

            <form onSubmit={handleSaveClass} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.25rem' }}>SUBJECT</label>
                <select value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--line)', borderRadius: '6px', background: '#ffffff', outline: 'none' }} required>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.25rem' }}>DAY</label>
                <select value={classDay} onChange={e => setClassDay(parseInt(e.target.value))} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--line)', borderRadius: '6px', background: '#ffffff', outline: 'none' }}>
                  {DAYS_OF_WEEK.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.25rem' }}>START TIME</label>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--line)', borderRadius: '6px', background: '#ffffff', outline: 'none' }} required />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.25rem' }}>END TIME</label>
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--line)', borderRadius: '6px', background: '#ffffff', outline: 'none' }} required />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.25rem' }}>LOCATION / ROOM</label>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Dome 3, Hall B" style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--line)', borderRadius: '6px', background: '#ffffff', outline: 'none' }} />
              </div>

              <button type="submit" disabled={isSubmittingClass} style={{ padding: '0.75rem', background: 'var(--plum)', color: 'var(--cream)', border: 'none', borderRadius: '9999px', fontWeight: 700, cursor: 'pointer', marginTop: '0.3rem' }}>
                {isSubmittingClass ? 'Saving...' : 'Save Session'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUBJECT MODAL */}
      {showSubjectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(45, 21, 39, 0.4)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowSubjectModal(false)}>
          <div style={{ background: 'var(--pearl)', border: '1px solid var(--line)', borderRadius: '12px', padding: '2.2rem', width: '100%', maxWidth: '460px', boxShadow: 'var(--shadow-lift)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 500, margin: 0 }}>Add Course Subject</h3>
              <button onClick={() => setShowSubjectModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleAddSubject} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.25rem' }}>COURSE CODE</label>
                <input type="text" value={subjectCode} onChange={e => setSubjectCode(e.target.value)} placeholder="e.g. AST-204" style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--line)', borderRadius: '6px', background: '#ffffff', outline: 'none' }} required />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.25rem' }}>COURSE TITLE</label>
                <input type="text" value={subjectName} onChange={e => setSubjectName(e.target.value)} placeholder="e.g. Orbital Astronomy" style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--line)', borderRadius: '6px', background: '#ffffff', outline: 'none' }} required />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.25rem' }}>TARGET ATTENDANCE (%)</label>
                <input type="number" min="50" max="100" value={targetAttendance} onChange={e => setTargetAttendance(parseInt(e.target.value))} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--line)', borderRadius: '6px', background: '#ffffff', outline: 'none' }} required />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.25rem' }}>COLOR ACCENT</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {PRESETS_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: c,
                        border: selectedColor === c ? '2px solid var(--plum)' : '1px solid var(--line)',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </div>
              </div>

              <button type="submit" style={{ padding: '0.75rem', background: 'var(--plum)', color: 'var(--cream)', border: 'none', borderRadius: '9999px', fontWeight: 700, cursor: 'pointer', marginTop: '0.3rem' }}>
                Create Course Subject
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TERM BREAKS MODAL */}
      {showBreaksModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(45, 21, 39, 0.4)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowBreaksModal(false)}>
          <div style={{ background: 'var(--pearl)', border: '1px solid var(--line)', borderRadius: '12px', padding: '2.2rem', width: '100%', maxWidth: '480px', boxShadow: 'var(--shadow-lift)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 500, margin: 0 }}>Term Breaks & Recesses</h3>
              <button onClick={() => setShowBreaksModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)' }}><X size={18} /></button>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', margin: '0 0 1rem 0' }}>
              Add planned term holidays and recesses. Scheduled classes will be suspended during these intervals.
            </p>

            {/* List of active breaks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto', marginBottom: '1.2rem' }}>
              {breaks.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--ink-faint)', fontSize: '0.8rem', border: '1px dashed var(--line)', borderRadius: '6px' }}>
                  No term breaks logged.
                </div>
              ) : (
                breaks.map(b => (
                  <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', border: '1px solid var(--line)', borderRadius: '6px', background: '#ffffff' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 650, color: 'var(--ink)' }}>{b.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--ink-faint)' }}>{new Date(b.start_date).toLocaleDateString()} – {new Date(b.end_date).toLocaleDateString()}</div>
                    </div>
                    <button type="button" onClick={() => handleDeleteBreak(b.id)} style={{ background: 'none', border: 'none', color: 'var(--ink-faint)', cursor: 'pointer' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddBreak} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', borderTop: '1px solid var(--line)', paddingTop: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.2rem' }}>BREAK NAME</label>
                <input type="text" value={breakName} onChange={e => setBreakName(e.target.value)} placeholder="e.g. Spring Recess" style={{ width: '100%', padding: '0.55rem', border: '1px solid var(--line)', borderRadius: '6px', background: '#ffffff' }} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.2rem' }}>START DATE</label>
                  <input type="date" value={breakStartDate} onChange={e => setBreakStartDate(e.target.value)} style={{ width: '100%', padding: '0.55rem', border: '1px solid var(--line)', borderRadius: '6px', background: '#ffffff' }} required />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.2rem' }}>END DATE</label>
                  <input type="date" value={breakEndDate} onChange={e => setBreakEndDate(e.target.value)} style={{ width: '100%', padding: '0.55rem', border: '1px solid var(--line)', borderRadius: '6px', background: '#ffffff' }} required />
                </div>
              </div>

              <button type="submit" disabled={breakSubmitting} style={{ padding: '0.7rem', background: 'var(--plum)', color: 'var(--cream)', border: 'none', borderRadius: '9999px', fontWeight: 700, cursor: 'pointer', marginTop: '0.3rem' }}>
                {breakSubmitting ? 'Saving...' : 'Add Term Break'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* AI TIMETABLE IMPORT MODAL */}
      {showImportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(45, 21, 39, 0.4)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowImportModal(false)}>
          <div style={{ background: 'var(--pearl)', border: '1px solid var(--line)', borderRadius: '12px', padding: '2.2rem', width: '100%', maxWidth: '520px', boxShadow: 'var(--shadow-lift)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={16} style={{ color: 'var(--petal)' }} />
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 500, margin: 0 }}>Import Timetable with AI</h3>
              </div>
              <button onClick={() => setShowImportModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)' }}><X size={18} /></button>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', margin: '0 0 1rem 0' }}>
              Upload your official timetable image or PDF. The AI vision model will parse days, slots, and subject codes automatically.
            </p>

            {importError && (
              <div style={{ padding: '0.5rem', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', fontSize: '0.78rem', marginBottom: '1rem' }}>
                {importError}
              </div>
            )}

            {extractedClasses.length === 0 ? (
              <form onSubmit={handleExtractTimetable} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.2rem' }}>TIMETABLE FILE (IMAGE / PDF)</label>
                  <input 
                    type="file" 
                    accept="image/*,.pdf" 
                    onChange={e => setImportFile(e.target.files?.[0] || null)} 
                    style={{ width: '100%', padding: '0.55rem', border: '1px solid var(--line)', borderRadius: '6px', background: '#ffffff' }}
                    required 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.2rem' }}>BRANCH (OPTIONAL)</label>
                    <input type="text" value={branch} onChange={e => setBranch(e.target.value)} placeholder="e.g. CSE / CS" style={{ width: '100%', padding: '0.55rem', border: '1px solid var(--line)', borderRadius: '6px', background: '#ffffff' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.2rem' }}>SEMESTER (OPTIONAL)</label>
                    <input type="text" value={semester} onChange={e => setSemester(e.target.value)} placeholder="e.g. 6 / VI" style={{ width: '100%', padding: '0.55rem', border: '1px solid var(--line)', borderRadius: '6px', background: '#ffffff' }} />
                  </div>
                </div>

                <button type="submit" disabled={isExtracting} style={{ padding: '0.75rem', background: 'var(--plum)', color: 'var(--cream)', border: 'none', borderRadius: '9999px', fontWeight: 700, cursor: 'pointer', marginTop: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  <Sparkles size={14} style={{ color: 'var(--petal)' }} />
                  <span>{isExtracting ? 'Analyzing Document with AI...' : 'Scan & Extract Schedule'}</span>
                </button>
              </form>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink)' }}>
                    Extracted {extractedClasses.length} class slots:
                  </span>
                  <button type="button" onClick={() => setExtractedClasses([])} style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Scan Again
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '200px', overflowY: 'auto', marginBottom: '1.2rem' }}>
                  {extractedClasses.map((item, idx) => (
                    <div key={idx} style={{ padding: '0.5rem 0.7rem', border: '1px solid var(--line)', borderRadius: '4px', background: '#ffffff', fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <strong>{item.day}</strong>: {item.subject_name || item.subject_code}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>
                        {item.start_time}–{item.end_time}
                      </div>
                    </div>
                  ))}
                </div>

                <button type="button" onClick={handleSaveImportedClasses} style={{ width: '100%', padding: '0.75rem', background: 'var(--plum)', color: 'var(--cream)', border: 'none', borderRadius: '9999px', fontWeight: 700, cursor: 'pointer' }}>
                  Save All Extracted Classes to Timetable
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
