import React, { useEffect, useState } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { Plus, Trash2, Edit3, X, Sparkles, Clock, MapPin, Grid, List } from 'lucide-react';
import { formatLocalDate, addDays } from '../utils/dateUtils';

interface Subject {
  id: string;
  name: string;
  code: string;
  target_attendance: number;
  color: string;
  instructor?: string;
}

interface ClassItem {
  id: string;
  subject_id: string;
  day_of_week: number; // 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat, 0 = Sun
  start_time: string; // "09:00"
  end_time: string;   // "10:30"
  location: string;
  subject_name: string;
  subject_code: string;
  subject_color: string;
  instructor?: string;
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

const PRESET_PASTELS = [
  '#e9d5ff', // soft lavender
  '#ccfbf1', // soft mint
  '#fce7f3', // soft rose
  '#fed7aa', // soft peach
  '#fef08a', // soft lemon
  '#e0e7ff', // soft periwinkle
];

const DAYS_OF_WEEK = [
  { value: 1, label: 'MON', full: 'Monday' },
  { value: 2, label: 'TUE', full: 'Tuesday' },
  { value: 3, label: 'WED', full: 'Wednesday' },
  { value: 4, label: 'THU', full: 'Thursday' },
  { value: 5, label: 'FRI', full: 'Friday' },
  { value: 6, label: 'SAT', full: 'Saturday' },
  { value: 0, label: 'SUN', full: 'Sunday' }
];

const TIME_HOURS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00'
];

export const Timetable: React.FC = () => {
  const { token } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [breaks, setBreaks] = useState<AcademicBreak[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // View Mode: 'week' (Ribbon Grid) vs 'day' (Day Agenda)
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const d = new Date().getDay();
    return d === 0 ? 0 : d; // Default to today
  });

  // Modals
  const [showClassModal, setShowClassModal] = useState<boolean>(false);
  const [showSubjectModal, setShowSubjectModal] = useState<boolean>(false);
  const [showBreaksModal, setShowBreaksModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);

  // Class Form State
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [classDay, setClassDay] = useState<number>(1);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('10:30');
  const [location, setLocation] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(formatLocalDate(new Date()));
  const [endDate, setEndDate] = useState<string>(formatLocalDate(addDays(new Date(), 180)));
  const [recurrenceType, setRecurrenceType] = useState<string>('weekly');
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmittingClass, setIsSubmittingClass] = useState<boolean>(false);

  // Subject Form State (Add / Edit)
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [subjectName, setSubjectName] = useState<string>('');
  const [subjectCode, setSubjectCode] = useState<string>('');
  const [targetAttendance, setTargetAttendance] = useState<number>(75);
  const [selectedColor, setSelectedColor] = useState<string>(PRESET_PASTELS[0]);
  const [subjectFormError, setSubjectFormError] = useState<string | null>(null);

  // Break Form State
  const [breakName, setBreakName] = useState<string>('');
  const [breakStartDate, setBreakStartDate] = useState<string>('');
  const [breakEndDate, setBreakEndDate] = useState<string>('');
  const [breakSubmitting, setBreakSubmitting] = useState<boolean>(false);

  // AI Timetable Extraction Form State
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

  // Handle Class Deletion
  const handleDeleteClass = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Delete this scheduled class block?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/academic/classes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setClasses(prev => prev.filter(c => c.id !== id));
        setShowClassModal(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Start Class Edit
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

  // Save Class (Create / Update)
  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId) {
      setFormError('Please select a course subject.');
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

  // Start Subject Edit
  const startEditSubject = (s: Subject) => {
    setEditingSubjectId(s.id);
    setSubjectName(s.name);
    setSubjectCode(s.code);
    setTargetAttendance(s.target_attendance || 75);
    setSelectedColor(s.color || PRESET_PASTELS[0]);
    setSubjectFormError(null);
    setShowSubjectModal(true);
  };

  // Handle Save Subject (Create / Update)
  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim() || !subjectCode.trim()) {
      setSubjectFormError('Please enter both course code and title.');
      return;
    }

    try {
      const url = editingSubjectId 
        ? `${API_BASE_URL}/academic/subjects/${editingSubjectId}`
        : `${API_BASE_URL}/academic/subjects`;
      const method = editingSubjectId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
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
        setEditingSubjectId(null);
        setShowSubjectModal(false);
      } else {
        const d = await res.json();
        setSubjectFormError(d.error || 'Failed to save course subject.');
      }
    } catch (err: any) {
      setSubjectFormError(err.message);
    }
  };

  // Handle Delete Subject
  const handleDeleteSubject = async (id: string) => {
    if (!window.confirm('Delete this course subject and its scheduled sessions?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/academic/subjects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
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
              color: PRESET_PASTELS[Math.floor(Math.random() * PRESET_PASTELS.length)]
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

  // Helper: parse "HH:MM" to float hours
  const parseTimeToFloat = (timeStr: string) => {
    if (!timeStr) return 8;
    const parts = timeStr.split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1] || '0', 10);
    return h + m / 60;
  };

  // Compute total weekly stats from actual database classes
  const totalSessions = classes.length;
  let totalHours = 0;
  classes.forEach(c => {
    const s = parseTimeToFloat(c.start_time);
    const e = parseTimeToFloat(c.end_time);
    if (e > s) totalHours += (e - s);
  });
  const hoursFormatted = `${Math.floor(totalHours)}H ${Math.round((totalHours % 1) * 60)}M`;

  const HOUR_HEIGHT = 58; // pixels per hour row
  const START_HOUR = 8;   // 08:00
  const TOTAL_HOURS = 10; // 08:00 to 18:00

  // Active columns (Mon-Fri or Mon-Sun if weekend classes exist)
  const hasWeekendClasses = classes.some(c => c.day_of_week === 0 || c.day_of_week === 6);
  const activeDays = hasWeekendClasses ? DAYS_OF_WEEK : DAYS_OF_WEEK.slice(0, 5);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--ink-soft)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.15rem' }}>
          Opening weekly schedule atelier... ✧
        </div>
      </div>
    );
  }

  return (
    <div className="animate-page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1240px', margin: '0 auto', paddingBottom: '3.5rem' }}>
      
      {/* 1. EDITORIAL HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', paddingTop: '0.5rem' }}>
        <div>
          {/* Eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.6rem' }}>
            <span style={{ width: '16px', height: '1px', background: 'var(--ink-faint)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 650, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
              TIMETABLE SCHEDULE
            </span>

            {/* View Switcher: Week Ribbon Grid vs Day View */}
            <div style={{ display: 'flex', border: '1px solid var(--line)', borderRadius: '4px', overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => setViewMode('week')}
                style={{
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 650,
                  border: 'none',
                  background: viewMode === 'week' ? '#2d1527' : 'transparent',
                  color: viewMode === 'week' ? '#faf6f0' : 'var(--ink-soft)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <Grid size={11} />
                <span>GRID</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('day')}
                style={{
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 650,
                  border: 'none',
                  background: viewMode === 'day' ? '#2d1527' : 'transparent',
                  color: viewMode === 'day' ? '#faf6f0' : 'var(--ink-soft)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <List size={11} />
                <span>DAY</span>
              </button>
            </div>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.2rem, 4vw, 3.2rem)',
            fontWeight: 400,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            color: 'var(--ink)',
            margin: 0
          }}>
            The week, drawn as a <br />
            <span style={{ fontStyle: 'italic', color: '#e11d48', fontWeight: 300 }}>ribbon</span>.
          </h1>

          <p style={{
            fontSize: '0.92rem',
            color: 'var(--ink-soft)',
            marginTop: '0.6rem',
            maxWidth: '620px',
            margin: '0.6rem 0 0 0'
          }}>
            Nine hours a day, laid on a single measured grid. Click any block to edit or reschedule.
          </p>
        </div>

        {/* Action Toolbar & Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.8rem' }}>
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
            <span>{totalSessions} SESSIONS {totalHours > 0 ? `· ${hoursFormatted}` : ''}</span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setShowBreaksModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                background: 'rgba(255, 255, 255, 0.9)',
                color: 'var(--ink-soft)',
                border: '1px solid var(--line)',
                borderRadius: '4px',
                padding: '0.45rem 0.8rem',
                fontSize: '0.74rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 650,
                cursor: 'pointer'
              }}
            >
              <span>Term Breaks ({breaks.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingSubjectId(null);
                setSubjectName('');
                setSubjectCode('');
                setTargetAttendance(75);
                setSelectedColor(PRESET_PASTELS[0]);
                setShowSubjectModal(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                background: 'rgba(255, 255, 255, 0.9)',
                color: 'var(--ink)',
                border: '1px solid var(--line)',
                borderRadius: '4px',
                padding: '0.45rem 0.8rem',
                fontSize: '0.74rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 650,
                cursor: 'pointer'
              }}
            >
              <span>+ Subject</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setExtractedClasses([]);
                setImportError(null);
                setImportFile(null);
                setShowImportModal(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'rgba(244, 114, 182, 0.15)',
                color: '#2d1527',
                border: '1px solid var(--petal)',
                borderRadius: '4px',
                padding: '0.45rem 0.85rem',
                fontSize: '0.74rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Sparkles size={12} style={{ color: '#e11d48' }} />
              <span>Import with AI</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingClassId(null);
                setSelectedSubjectId(subjects.length > 0 ? subjects[0].id : '');
                setStartTime('09:00');
                setEndTime('10:30');
                setLocation('');
                setStartDate(formatLocalDate(new Date()));
                setEndDate(formatLocalDate(addDays(new Date(), 180)));
                setRecurrenceType('weekly');
                setRecurrenceDays([]);
                setShowClassModal(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: '#2d1527',
                color: '#faf6f0',
                border: 'none',
                borderRadius: '4px',
                padding: '0.45rem 0.95rem',
                fontSize: '0.76rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Plus size={13} />
              <span>Add Session</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Breaks Banner */}
      {breaks.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.8rem',
          padding: '0.65rem 1rem',
          border: '1px dashed var(--petal)',
          borderRadius: '4px',
          background: 'rgba(244, 114, 182, 0.06)',
          width: 'fit-content'
        }}>
          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#2d1527' }}>
            ✦ ACTIVE TERM BREAKS:
          </span>
          <span style={{ fontSize: '0.76rem', color: 'var(--ink-soft)' }}>
            {breaks.map(b => `${b.name} (${new Date(b.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${new Date(b.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})`).join(' · ')}
          </span>
        </div>
      )}

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', fontSize: '0.82rem' }}>
          {error}
        </div>
      )}

      {/* 2. SCHEDULE CANVAS (WEEK RIBBON GRID OR DAY VIEW) */}
      {viewMode === 'week' ? (
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--line)',
          borderRadius: '6px',
          boxShadow: '0 1px 4px rgba(45, 21, 39, 0.04)',
          overflow: 'hidden',
          position: 'relative'
        }}>
          
          {/* Top Days Header Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `70px repeat(${activeDays.length}, 1fr)`,
            borderBottom: '1px solid var(--line)',
            background: 'rgba(250, 246, 240, 0.4)'
          }}>
            <div style={{ padding: '0.85rem 0.5rem', textAlign: 'center', borderRight: '1px solid var(--line)' }}>
              <Clock size={14} style={{ color: 'var(--ink-faint)', margin: '0 auto' }} />
            </div>
            {activeDays.map(day => (
              <div 
                key={day.value}
                style={{
                  padding: '0.85rem 0.75rem',
                  textAlign: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--ink)',
                  letterSpacing: '0.06em',
                  borderRight: '1px solid var(--line)'
                }}
              >
                {day.label}
              </div>
            ))}
          </div>

          {/* Calendar Body Canvas */}
          <div style={{ position: 'relative', height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}>
            
            {/* Background Horizontal Hour Guidelines */}
            {TIME_HOURS.map((hour, idx) => (
              <div 
                key={hour}
                style={{
                  position: 'absolute',
                  top: `${idx * HOUR_HEIGHT}px`,
                  left: 0,
                  right: 0,
                  height: `${HOUR_HEIGHT}px`,
                  borderBottom: '1px solid rgba(45, 21, 39, 0.05)',
                  display: 'grid',
                  gridTemplateColumns: `70px repeat(${activeDays.length}, 1fr)`,
                  pointerEvents: 'none'
                }}
              >
                {/* Hour Label */}
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.68rem',
                  color: 'var(--ink-faint)',
                  padding: '0.4rem 0.6rem',
                  textAlign: 'right',
                  borderRight: '1px solid var(--line)',
                  background: 'rgba(255, 255, 255, 0.5)'
                }}>
                  {hour}
                </div>

                {/* Day column guidelines */}
                {activeDays.map(day => (
                  <div key={day.value} style={{ borderRight: '1px solid rgba(45, 21, 39, 0.05)', height: '100%' }} />
                ))}
              </div>
            ))}

            {/* Render Scheduled Class Blocks from database */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: '70px',
              right: 0,
              bottom: 0,
              display: 'grid',
              gridTemplateColumns: `repeat(${activeDays.length}, 1fr)`,
              pointerEvents: 'none'
            }}>
              {activeDays.map(day => {
                const dayClasses = classes.filter(c => c.day_of_week === day.value);
                return (
                  <div key={day.value} style={{ position: 'relative', height: '100%', pointerEvents: 'none' }}>
                    {dayClasses.map(c => {
                      const startH = parseTimeToFloat(c.start_time);
                      const endH = parseTimeToFloat(c.end_time);
                      const topPx = Math.max(0, (startH - START_HOUR) * HOUR_HEIGHT);
                      const durationH = Math.max(0.5, endH - startH);
                      const heightPx = durationH * HOUR_HEIGHT - 6;

                      const pastelBg = c.subject_color || '#e9d5ff';

                      return (
                        <div
                          key={c.id}
                          onClick={() => startEditClass(c)}
                          className="hover-lift-card"
                          style={{
                            position: 'absolute',
                            top: `${topPx + 3}px`,
                            left: '6px',
                            right: '6px',
                            height: `${heightPx}px`,
                            background: pastelBg,
                            border: '1px solid rgba(45, 21, 39, 0.08)',
                            borderRadius: '4px',
                            padding: '0.55rem 0.75rem',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            pointerEvents: 'auto',
                            boxShadow: '0 1px 3px rgba(45, 21, 39, 0.03)',
                            overflow: 'hidden'
                          }}
                          title={`Click to edit: ${c.subject_name} (${c.start_time}–${c.end_time})`}
                        >
                          <div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700, color: 'var(--ink)', opacity: 0.85, letterSpacing: '0.04em' }}>
                              {c.subject_code}
                            </div>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.92rem', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.15, marginTop: '0.15rem' }}>
                              {c.subject_name}
                            </div>
                          </div>

                          {c.location && (
                            <div style={{ fontSize: '0.68rem', color: 'var(--ink-soft)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <MapPin size={10} style={{ color: '#e11d48' }} />
                              <span>{c.location}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

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
                    border: isSelected ? '1px solid #2d1527' : '1px solid var(--line)',
                    borderRadius: '4px',
                    background: isSelected ? '#2d1527' : 'transparent',
                    color: isSelected ? '#faf6f0' : 'var(--ink-soft)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.15s'
                  }}
                >
                  <span>{d.label}</span>
                  <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>({count})</span>
                </button>
              );
            })}
          </div>

          {classes.filter(c => c.day_of_week === selectedDay).length === 0 ? (
            <div style={{ padding: '3.5rem 0', color: 'var(--ink-faint)', fontStyle: 'italic', fontSize: '0.95rem', textAlign: 'center', background: '#ffffff', border: '1px solid var(--line)', borderRadius: '4px' }}>
              No scheduled lectures on this day.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {classes
                .filter(c => c.day_of_week === selectedDay)
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                .map(c => (
                  <div
                    key={c.id}
                    onClick={() => startEditClass(c)}
                    className="hover-lift-card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1.1rem 1.4rem',
                      background: '#ffffff',
                      border: '1px solid var(--line)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(45, 21, 39, 0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                      <div style={{ width: '100px', fontFamily: 'var(--font-mono)', fontSize: '0.84rem', fontWeight: 650, color: 'var(--ink)' }}>
                        {c.start_time}–{c.end_time}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: c.subject_color || 'var(--petal)' }}>
                            {c.subject_code}
                          </span>
                          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                            {c.subject_name}
                          </h3>
                        </div>
                        {c.location && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--ink-faint)', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <MapPin size={11} style={{ color: '#e11d48' }} />
                            <span>{c.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteClass(c.id, e)}
                        style={{ background: 'none', border: 'none', color: 'var(--ink-faint)', cursor: 'pointer', padding: '0.2rem' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* 3. ENROLLED SUBJECT SUMMARY STRIP */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
            ENROLLED MODULES ({subjects.length})
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingSubjectId(null);
              setSubjectName('');
              setSubjectCode('');
              setTargetAttendance(75);
              setSelectedColor(PRESET_PASTELS[0]);
              setShowSubjectModal(true);
            }}
            style={{
              background: 'none',
              border: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              fontWeight: 700,
              color: '#e11d48',
              cursor: 'pointer'
            }}
          >
            MANAGE / EDIT SUBJECTS →
          </button>
        </div>

        {subjects.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            {subjects.map(s => (
              <div 
                key={s.id}
                onClick={() => startEditSubject(s)}
                className="hover-lift-card"
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--line)',
                  borderRadius: '4px',
                  padding: '1rem 1.1rem',
                  boxShadow: '0 1px 3px rgba(45, 21, 39, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  cursor: 'pointer'
                }}
                title="Click to edit subject details"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ width: '24px', height: '3px', borderRadius: '2px', background: s.color || '#e9d5ff' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--ink-faint)' }}>Target: {s.target_attendance}%</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 700, color: 'var(--ink-faint)', marginTop: '0.1rem' }}>
                  {s.code}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.98rem', fontWeight: 600, color: 'var(--ink)' }}>
                  {s.name}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '2rem', background: '#ffffff', border: '1px solid var(--line)', borderRadius: '4px', textAlign: 'center', color: 'var(--ink-soft)' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.05rem', margin: '0 0 0.5rem 0' }}>
              No subjects added yet.
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--ink-faint)', margin: 0 }}>
              Click "+ Subject" above or "Import with AI" to add your courses and start scheduling classes.
            </p>
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT CLASS */}
      {showClassModal && (
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
            maxWidth: '480px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 12px 36px rgba(45, 21, 39, 0.15)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.4rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 500, margin: 0 }}>
                {editingClassId ? 'Edit Scheduled Slot' : 'Schedule Session'}
              </h2>
              <button 
                onClick={() => setShowClassModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)' }}
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div style={{ color: '#ef4444', fontSize: '0.78rem', marginBottom: '1rem', padding: '0.5rem', background: '#fef2f2', borderRadius: '4px' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveClass} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', marginBottom: '0.35rem' }}>
                  SUBJECT
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={e => setSelectedSubjectId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '4px',
                    border: '1px solid var(--line)',
                    background: '#ffffff',
                    color: 'var(--ink)',
                    fontSize: '0.85rem'
                  }}
                  required
                >
                  <option value="" disabled>Select course...</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', marginBottom: '0.35rem' }}>
                    DAY
                  </label>
                  <select
                    value={classDay}
                    onChange={e => setClassDay(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '4px',
                      border: '1px solid var(--line)',
                      background: '#ffffff',
                      fontSize: '0.85rem'
                    }}
                  >
                    {DAYS_OF_WEEK.map(d => (
                      <option key={d.value} value={d.value}>{d.full}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', marginBottom: '0.35rem' }}>
                    LOCATION / ROOM
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dome 3, Hall B"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '4px',
                      border: '1px solid var(--line)',
                      background: '#ffffff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', marginBottom: '0.35rem' }}>
                    START TIME
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '4px',
                      border: '1px solid var(--line)',
                      background: '#ffffff',
                      fontSize: '0.85rem'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', marginBottom: '0.35rem' }}>
                    END TIME
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '4px',
                      border: '1px solid var(--line)',
                      background: '#ffffff',
                      fontSize: '0.85rem'
                    }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--line)' }}>
                {editingClassId ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteClass(editingClassId)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                ) : <div />}

                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowClassModal(false)}
                    style={{
                      background: 'none',
                      border: '1px solid var(--line)',
                      borderRadius: '4px',
                      padding: '0.5rem 1rem',
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingClass}
                    style={{
                      background: '#2d1527',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0.5rem 1.2rem',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {isSubmittingClass ? 'Saving...' : 'Save Session'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MANAGE & EDIT SUBJECTS */}
      {showSubjectModal && (
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
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 500, margin: 0 }}>
                {editingSubjectId ? 'Edit Course Subject' : 'Manage Course Subjects'}
              </h2>
              <button 
                onClick={() => {
                  setShowSubjectModal(false);
                  setEditingSubjectId(null);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)' }}
              >
                <X size={18} />
              </button>
            </div>

            {subjectFormError && (
              <div style={{ color: '#ef4444', fontSize: '0.78rem', marginBottom: '1rem', padding: '0.5rem', background: '#fef2f2', borderRadius: '4px' }}>
                {subjectFormError}
              </div>
            )}

            {/* List of existing subjects if managing */}
            {!editingSubjectId && subjects.length > 0 && (
              <div style={{ marginBottom: '1.4rem' }}>
                <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  EXISTING COURSES ({subjects.length})
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {subjects.map(s => (
                    <div 
                      key={s.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.6rem 0.8rem',
                        border: '1px solid var(--line)',
                        borderRadius: '4px',
                        background: 'rgba(250, 246, 240, 0.4)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: s.color || '#e9d5ff' }} />
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 650, color: 'var(--ink)' }}>{s.code} — {s.name}</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--ink-faint)' }}>Target: {s.target_attendance}%</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          type="button"
                          onClick={() => startEditSubject(s)}
                          style={{ background: 'none', border: 'none', color: 'var(--ink-soft)', cursor: 'pointer', padding: '0.2rem' }}
                          title="Edit subject"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSubject(s.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' }}
                          title="Delete subject"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subject Form */}
            <form onSubmit={handleSaveSubject} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: !editingSubjectId && subjects.length > 0 ? '1px solid var(--line)' : 'none', paddingTop: !editingSubjectId && subjects.length > 0 ? '1rem' : '0' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ink)' }}>
                {editingSubjectId ? 'Update Subject Details' : 'Add New Subject'}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', marginBottom: '0.35rem' }}>
                  COURSE CODE
                </label>
                <input
                  type="text"
                  placeholder="e.g. AST-204"
                  value={subjectCode}
                  onChange={e => setSubjectCode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '4px',
                    border: '1px solid var(--line)',
                    background: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', marginBottom: '0.35rem' }}>
                  COURSE TITLE
                </label>
                <input
                  type="text"
                  placeholder="e.g. Orbital Astronomy"
                  value={subjectName}
                  onChange={e => setSubjectName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '4px',
                    border: '1px solid var(--line)',
                    background: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', marginBottom: '0.35rem' }}>
                  TARGET ATTENDANCE (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={targetAttendance}
                  onChange={e => setTargetAttendance(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '4px',
                    border: '1px solid var(--line)',
                    background: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', marginBottom: '0.35rem' }}>
                  ACCENT PASTEL
                </label>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  {PRESET_PASTELS.map(col => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setSelectedColor(col)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '4px',
                        background: col,
                        border: selectedColor === col ? '2px solid #2d1527' : '1px solid rgba(0,0,0,0.1)',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--line)' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowSubjectModal(false);
                    setEditingSubjectId(null);
                  }}
                  style={{
                    background: 'none',
                    border: '1px solid var(--line)',
                    borderRadius: '4px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: '#2d1527',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.5rem 1.2rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {editingSubjectId ? 'Update Subject' : 'Save Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TERM BREAKS */}
      {showBreaksModal && (
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
            maxWidth: '480px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 12px 36px rgba(45, 21, 39, 0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 500, margin: 0 }}>Term Breaks & Recesses</h3>
              <button onClick={() => setShowBreaksModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)' }}><X size={18} /></button>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', margin: '0 0 1rem 0' }}>
              Add planned term holidays and recesses. Scheduled classes will be suspended during these intervals.
            </p>

            {/* List of active breaks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto', marginBottom: '1.2rem' }}>
              {breaks.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--ink-faint)', fontSize: '0.8rem', border: '1px dashed var(--line)', borderRadius: '4px' }}>
                  No term breaks logged.
                </div>
              ) : (
                breaks.map(b => (
                  <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', border: '1px solid var(--line)', borderRadius: '4px', background: '#ffffff' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 650, color: 'var(--ink)' }}>{b.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--ink-faint)' }}>{new Date(b.start_date).toLocaleDateString()} – {new Date(b.end_date).toLocaleDateString()}</div>
                    </div>
                    <button type="button" onClick={() => handleDeleteBreak(b.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddBreak} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', borderTop: '1px solid var(--line)', paddingTop: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.2rem' }}>BREAK NAME</label>
                <input type="text" value={breakName} onChange={e => setBreakName(e.target.value)} placeholder="e.g. Spring Recess" style={{ width: '100%', padding: '0.55rem', border: '1px solid var(--line)', borderRadius: '4px', background: '#ffffff' }} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.2rem' }}>START DATE</label>
                  <input type="date" value={breakStartDate} onChange={e => setBreakStartDate(e.target.value)} style={{ width: '100%', padding: '0.55rem', border: '1px solid var(--line)', borderRadius: '4px', background: '#ffffff' }} required />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.2rem' }}>END DATE</label>
                  <input type="date" value={breakEndDate} onChange={e => setBreakEndDate(e.target.value)} style={{ width: '100%', padding: '0.55rem', border: '1px solid var(--line)', borderRadius: '4px', background: '#ffffff' }} required />
                </div>
              </div>

              <button type="submit" disabled={breakSubmitting} style={{ padding: '0.7rem', background: '#2d1527', color: '#ffffff', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', marginTop: '0.3rem' }}>
                {breakSubmitting ? 'Saving...' : 'Add Term Break'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AI TIMETABLE IMPORT */}
      {showImportModal && (
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
                <Sparkles size={16} style={{ color: '#e11d48' }} />
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 500, margin: 0 }}>Import Timetable with AI</h3>
              </div>
              <button onClick={() => setShowImportModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)' }}><X size={18} /></button>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', margin: '0 0 1rem 0' }}>
              Upload your official timetable image or PDF. The Gemini AI vision model will parse days, slots, and course codes automatically.
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
                    style={{ width: '100%', padding: '0.55rem', border: '1px solid var(--line)', borderRadius: '4px', background: '#ffffff' }}
                    required 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.2rem' }}>BRANCH (OPTIONAL)</label>
                    <input type="text" value={branch} onChange={e => setBranch(e.target.value)} placeholder="e.g. CSE / Spatial" style={{ width: '100%', padding: '0.55rem', border: '1px solid var(--line)', borderRadius: '4px', background: '#ffffff' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.2rem' }}>SEMESTER (OPTIONAL)</label>
                    <input type="text" value={semester} onChange={e => setSemester(e.target.value)} placeholder="e.g. 4 / VI" style={{ width: '100%', padding: '0.55rem', border: '1px solid var(--line)', borderRadius: '4px', background: '#ffffff' }} />
                  </div>
                </div>

                <button type="submit" disabled={isExtracting} style={{ padding: '0.75rem', background: '#2d1527', color: '#ffffff', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', marginTop: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  <Sparkles size={14} style={{ color: '#f472b6' }} />
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
                    <div key={idx} style={{ padding: '0.5rem 0.7rem', border: '1px solid var(--line)', borderRadius: '4px', background: 'rgba(250, 246, 240, 0.5)', fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <strong>{item.day}</strong>: {item.subject_name || item.subject_code}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>
                        {item.start_time}–{item.end_time}
                      </div>
                    </div>
                  ))}
                </div>

                <button type="button" onClick={handleSaveImportedClasses} style={{ width: '100%', padding: '0.75rem', background: '#2d1527', color: '#ffffff', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}>
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
