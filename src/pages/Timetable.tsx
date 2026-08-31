import React, { useEffect, useState } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { Plus, Trash2, X, Clock } from 'lucide-react';
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

const PRESET_PASTELS = [
  '#e9d5ff', // soft lavender
  '#ccfbf1', // soft mint
  '#fce7f3', // soft rose
  '#fed7aa', // soft peach
  '#fef08a', // soft lemon
  '#e0e7ff', // soft periwinkle
];

const DISPLAY_DAYS = [
  { value: 1, label: 'MON', full: 'Monday' },
  { value: 2, label: 'TUE', full: 'Tuesday' },
  { value: 3, label: 'WED', full: 'Wednesday' },
  { value: 4, label: 'THU', full: 'Thursday' },
  { value: 5, label: 'FRI', full: 'Friday' },
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

  // Modals
  const [showClassModal, setShowClassModal] = useState<boolean>(false);
  const [showSubjectModal, setShowSubjectModal] = useState<boolean>(false);

  // Class Form
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [classDay, setClassDay] = useState<number>(1);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('10:30');
  const [location, setLocation] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmittingClass, setIsSubmittingClass] = useState<boolean>(false);

  // Subject Form
  const [subjectName, setSubjectName] = useState<string>('');
  const [subjectCode, setSubjectCode] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>(PRESET_PASTELS[0]);

  // Include Weekend Toggle if needed
  const hasWeekendClasses = classes.some(c => c.day_of_week === 0 || c.day_of_week === 6);

  const activeDays = hasWeekendClasses ? [
    { value: 1, label: 'MON', full: 'Monday' },
    { value: 2, label: 'TUE', full: 'Tuesday' },
    { value: 3, label: 'WED', full: 'Wednesday' },
    { value: 4, label: 'THU', full: 'Thursday' },
    { value: 5, label: 'FRI', full: 'Friday' },
    { value: 6, label: 'SAT', full: 'Saturday' },
    { value: 0, label: 'SUN', full: 'Sunday' }
  ] : DISPLAY_DAYS;

  const fetchData = async () => {
    try {
      const [subRes, classRes] = await Promise.all([
        fetch(`${API_BASE_URL}/academic/subjects`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/academic/classes`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!subRes.ok || !classRes.ok) {
        throw new Error('Failed to load timetable data.');
      }

      const subData = await subRes.json();
      const classData = await classRes.json();

      setSubjects(subData);
      setClasses(classData);

      if (subData.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(subData[0].id);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

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
      start_date: formatLocalDate(new Date()),
      end_date: formatLocalDate(addDays(new Date(), 180)),
      recurrence_type: 'weekly',
      recurrence_days: JSON.stringify([classDay])
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
          target_attendance: 75,
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

  // Helper: parse "HH:MM" to float hours
  const parseTimeToFloat = (timeStr: string) => {
    if (!timeStr) return 8;
    const parts = timeStr.split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1] || '0', 10);
    return h + m / 60;
  };

  // Compute total weekly stats
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

  // Default sample subjects/classes if fresh account
  const displaySubjects = subjects.length > 0 ? subjects : [
    { id: 's1', name: 'Orbital Astronomy', code: 'AST-204', target_attendance: 75, color: '#e9d5ff', instructor: 'Dr. Ito' },
    { id: 's2', name: 'Spatial Interfaces', code: 'DES-330', target_attendance: 75, color: '#fce7f3', instructor: 'M. Lindqvist' },
    { id: 's3', name: 'Botanical Systems', code: 'BIO-118', target_attendance: 75, color: '#ccfbf1', instructor: 'Prof. Aluko' },
    { id: 's4', name: 'Applied Topology', code: 'MTH-140', target_attendance: 75, color: '#fed7aa', instructor: 'Dr. Okafor' },
    { id: 's5', name: 'Future Poetics', code: 'LIT-210', target_attendance: 75, color: '#ffe4e6', instructor: 'Dr. Vance' }
  ];

  const displayClasses = classes.length > 0 ? classes : [
    { id: 'c1', subject_id: 's1', day_of_week: 1, start_time: '09:00', end_time: '10:30', location: 'Dome 3', subject_name: 'Orbital Astronomy', subject_code: 'AST-204', subject_color: '#e9d5ff' },
    { id: 'c2', subject_id: 's2', day_of_week: 1, start_time: '13:30', end_time: '15:00', location: 'Studio 12', subject_name: 'Spatial Interfaces', subject_code: 'DES-330', subject_color: '#fce7f3' },
    { id: 'c3', subject_id: 's3', day_of_week: 2, start_time: '10:00', end_time: '11:30', location: 'Greenhouse W', subject_name: 'Botanical Systems', subject_code: 'BIO-118', subject_color: '#ccfbf1' },
    { id: 'c4', subject_id: 's4', day_of_week: 2, start_time: '15:00', end_time: '16:30', location: 'Annex 2', subject_name: 'Applied Topology', subject_code: 'MTH-140', subject_color: '#fed7aa' },
    { id: 'c5', subject_id: 's5', day_of_week: 3, start_time: '09:30', end_time: '11:00', location: 'Reading Hall', subject_name: 'Future Poetics', subject_code: 'LIT-210', subject_color: '#ffe4e6' },
    { id: 'c6', subject_id: 's2', day_of_week: 3, start_time: '14:30', end_time: '16:00', location: 'Studio 12', subject_name: 'Spatial Interfaces', subject_code: 'DES-330', subject_color: '#fce7f3' },
    { id: 'c7', subject_id: 's1', day_of_week: 4, start_time: '11:00', end_time: '12:30', location: 'Dome 3', subject_name: 'Orbital Astronomy', subject_code: 'AST-204', subject_color: '#e9d5ff' },
    { id: 'c8', subject_id: 's4', day_of_week: 4, start_time: '14:30', end_time: '16:00', location: 'Annex 2', subject_name: 'Applied Topology', subject_code: 'MTH-140', subject_color: '#fed7aa' },
    { id: 'c9', subject_id: 's3', day_of_week: 5, start_time: '09:30', end_time: '11:00', location: 'Greenhouse W', subject_name: 'Botanical Systems', subject_code: 'BIO-118', subject_color: '#ccfbf1' },
    { id: 'c10', subject_id: 's5', day_of_week: 5, start_time: '12:30', end_time: '14:00', location: 'Reading Hall', subject_name: 'Future Poetics', subject_code: 'LIT-210', subject_color: '#ffe4e6' },
  ];

  return (
    <div className="animate-page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1220px', margin: '0 auto', paddingBottom: '3.5rem' }}>
      
      {/* 1. HEADER (MATCHING IMAGE 2 REFERENCE) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', paddingTop: '0.5rem' }}>
        <div>
          {/* Eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
            <span style={{ width: '16px', height: '1px', background: 'var(--ink-faint)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 650, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
              WEEK 6 · AUTUMN TERM
            </span>
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
            Nine hours a day, laid on a single measured grid. Hover a block to lift it out of the paper.
          </p>
        </div>

        {/* Right Stats & Action Buttons */}
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
            <span>{totalSessions || 10} SESSIONS · {hoursFormatted || '14H 30M'}</span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => {
                setEditingClassId(null);
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
                padding: '0.45rem 0.9rem',
                fontSize: '0.78rem',
                fontWeight: 650,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Plus size={13} />
              <span>Add Class</span>
            </button>

            <button
              onClick={() => setShowSubjectModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'rgba(255, 255, 255, 0.9)',
                color: 'var(--ink)',
                border: '1px solid var(--line)',
                borderRadius: '4px',
                padding: '0.45rem 0.9rem',
                fontSize: '0.78rem',
                fontWeight: 650,
                cursor: 'pointer'
              }}
            >
              <span>+ Subject</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. THE WEEKLY MEASURED RIBBON CALENDAR GRID */}
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

          {/* Render Scheduled Class Blocks on Grid */}
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
              const dayClasses = displayClasses.filter(c => c.day_of_week === day.value);
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
                          <div style={{ fontSize: '0.68rem', color: 'var(--ink-soft)', marginTop: '0.2rem' }}>
                            {c.location}
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

      {/* 3. ENROLLED SUBJECT SUMMARY STRIP BELOW GRID */}
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.8rem' }}>
          ENROLLED MODULES
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          {displaySubjects.map(s => (
            <div 
              key={s.id}
              className="hover-lift-card"
              style={{
                background: '#ffffff',
                border: '1px solid var(--line)',
                borderRadius: '4px',
                padding: '1rem 1.1rem',
                boxShadow: '0 1px 3px rgba(45, 21, 39, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem'
              }}
            >
              <div style={{ width: '24px', height: '3px', borderRadius: '2px', background: s.color || '#e9d5ff' }} />
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 700, color: 'var(--ink-faint)', marginTop: '0.1rem' }}>
                {s.code}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.98rem', fontWeight: 600, color: 'var(--ink)' }}>
                {s.name}
              </div>
              {s.instructor && (
                <div style={{ fontSize: '0.72rem', color: 'var(--ink-soft)' }}>
                  {s.instructor}
                </div>
              )}
            </div>
          ))}
        </div>
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
            maxWidth: '460px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 12px 36px rgba(45, 21, 39, 0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.4rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 500, margin: 0 }}>
                {editingClassId ? 'Edit Scheduled Slot' : 'Add Class to Timetable'}
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
                  {displaySubjects.map(s => (
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
                    {activeDays.map(d => (
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
                    placeholder="e.g. Dome 3"
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
                    {isSubmittingClass ? 'Saving...' : 'Save Slot'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SUBJECT */}
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
            maxWidth: '420px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 12px 36px rgba(45, 21, 39, 0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.4rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 500, margin: 0 }}>
                Add New Module
              </h2>
              <button 
                onClick={() => setShowSubjectModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubject} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                  COURSE NAME
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
                  onClick={() => setShowSubjectModal(false)}
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
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
