import React, { useEffect, useState } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import { formatLocalDate } from '../utils/dateUtils';

interface Assignment {
  id: string;
  subject_id: string;
  title: string;
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
  subject_name: string;
  subject_code: string;
  subject_color: string;
}

interface CalendarNote {
  id: string;
  date: string;
  note: string;
}

interface CalendarDayEvent {
  type: 'class' | 'assignment' | 'exam' | 'note' | 'event' | 'break';
  id: string;
  class_id?: string;
  subject_id?: string;
  title: string;
  time?: string;
  color: string;
  status?: string;
  is_moved?: boolean;
}

export const CalendarView: React.FC = () => {
  const { token } = useAuth();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  const [occurrences, setOccurrences] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [notes, setNotes] = useState<CalendarNote[]>([]);
  const [breaks, setBreaks] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Interactive States
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayNoteText, setDayNoteText] = useState<string>('');
  const [savingNote, setSavingNote] = useState<boolean>(false);

  // Custom Event Creation Form State (inside Day Modal)
  const [showEventForm, setShowEventForm] = useState<boolean>(false);
  const [eventTitle, setEventTitle] = useState<string>('');
  const [eventType, setEventType] = useState<string>('study');
  const [eventSubjectId, setEventSubjectId] = useState<string>('');
  const [eventStartTime, setEventStartTime] = useState<string>('09:00');
  const [eventEndTime, setEventEndTime] = useState<string>('10:00');
  const [eventLocation, setEventLocation] = useState<string>('');
  const [eventSaving, setEventSaving] = useState<boolean>(false);

  // Exception Moving State
  const [movingClassId, setMovingClassId] = useState<string | null>(null);
  const [moveNewDate, setMoveNewDate] = useState<string>('');
  const [moveStartTime, setMoveStartTime] = useState<string>('');
  const [moveEndTime, setMoveEndTime] = useState<string>('');
  const [moveLocation, setMoveLocation] = useState<string>('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const grid = generateMonthDays();
      const startDateStr = formatLocalDate(grid[0].date);
      const endDateStr = formatLocalDate(grid[41].date);

      const [occRes, assRes, exRes, noteRes, breakRes, subRes, attRes] = await Promise.all([
        fetch(`${API_BASE_URL}/academic/calendar/occurrences?startDate=${startDateStr}&endDate=${endDateStr}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/academic/assignments`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/academic/exams`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/academic/calendar-notes`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/academic/breaks`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/academic/subjects`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/academic/attendance`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!occRes.ok || !assRes.ok || !exRes.ok || !noteRes.ok || !breakRes.ok || !subRes.ok) {
        throw new Error('Failed to load academic records.');
      }

      setOccurrences(await occRes.json());
      setAssignments(await assRes.json());
      setExams(await exRes.json());
      setNotes(await noteRes.json());
      setBreaks(await breakRes.json());
      setSubjects(await subRes.json());
      if (attRes.ok) {
        setAttendanceLogs(await attRes.json());
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error loading calendar records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, currentDate]);

  // Navigate Months
  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    const dateStr = formatLocalDate(date);
    const existingNote = notes.find(n => n.date === dateStr);
    setDayNoteText(existingNote ? existingNote.note : '');
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    const dateStr = formatLocalDate(selectedDate);
    try {
      setSavingNote(true);
      const res = await fetch(`${API_BASE_URL}/academic/calendar-notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: dateStr,
          note: dayNoteText
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save note.');
      }

      if (data.action === 'deleted') {
        setNotes(prev => prev.filter(n => n.date !== dateStr));
      } else if (data.action === 'updated') {
        setNotes(prev => prev.map(n => n.date === dateStr ? data.note : n));
      } else if (data.action === 'created') {
        setNotes(prev => [...prev, data.note]);
      }

      alert('Calendar note updated successfully! ✧');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error updating calendar note.');
    } finally {
      setSavingNote(false);
    }
  };

  // Record or toggle attendance directly from calendar date modal
  const handleToggleAttendance = async (subjectId: string, status: 'present' | 'absent') => {
    if (!selectedDate) return;
    const dateStr = formatLocalDate(selectedDate);

    const existingLog = attendanceLogs.find(l => l.subject_id === subjectId && l.date === dateStr);
    if (existingLog && existingLog.status === status) {
      return;
    }

    // Optimistic local update
    setAttendanceLogs(prev => {
      const filtered = prev.filter(l => !(l.subject_id === subjectId && l.date === dateStr));
      return [...filtered, { id: 'temp_' + Date.now(), subject_id: subjectId, date: dateStr, status }];
    });

    try {
      const res = await fetch(`${API_BASE_URL}/academic/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject_id: subjectId,
          date: dateStr,
          status
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to record attendance.');
      }
    } catch (err: any) {
      console.error('Error logging calendar attendance:', err);
      alert(err.message || 'Error updating attendance.');
      fetchData();
    }
  };

  // Generate days array for the month display grid
  const generateMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Day of the week of first day (0 = Sunday, 1 = Monday... 6 = Saturday)
    // Adjust so grid starts on Monday (1)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6; // Sunday becomes 6
    
    // Total days in current month
    const totalDays = new Date(year, month + 1, 0).getDate();
    // Total days in previous month
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    
    const daysGrid: { date: Date; isCurrentMonth: boolean; isToday: boolean }[] = [];
    
    // 1. Fill previous month's overflow days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthTotalDays - i;
      daysGrid.push({
        date: new Date(year, month - 1, d),
        isCurrentMonth: false,
        isToday: false
      });
    }

    // 2. Fill current month's days
    const todayStr = formatLocalDate(new Date());
    for (let i = 1; i <= totalDays; i++) {
      const thisDate = new Date(year, month, i);
      const thisDateStr = formatLocalDate(thisDate);
      daysGrid.push({
        date: thisDate,
        isCurrentMonth: true,
        isToday: thisDateStr === todayStr
      });
    }

    // 3. Fill next month's overflow days to round up to a 6-week grid (42 cells)
    const remainingCells = 42 - daysGrid.length;
    for (let i = 1; i <= remainingCells; i++) {
      daysGrid.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        isToday: false
      });
    }

    return daysGrid;
  };

  // Gather all events matching a specific date
  const getEventsForDate = (date: Date): CalendarDayEvent[] => {
    const dateStr = formatLocalDate(date);
    const dateEvents: CalendarDayEvent[] = [];

    // Add breaks today
    breaks.forEach(b => {
      if (dateStr >= b.start_date && dateStr <= b.end_date) {
        dateEvents.push({
          type: 'break',
          id: b.id,
          title: `🏖️ Break: ${b.name}`,
          color: '#ff4d6d'
        });
      }
    });

    // Add scheduler occurrences
    occurrences.forEach(occ => {
      if (occ.date === dateStr) {
        if (occ.type === 'class_occurrence') {
          dateEvents.push({
            type: 'class',
            id: occ.id,
            class_id: occ.class_id,
            subject_id: occ.subject_id,
            title: occ.subject_code + (occ.is_moved ? ' (Moved)' : ''),
            time: occ.start_time,
            color: occ.subject_color || 'var(--primary)',
            is_moved: occ.is_moved
          });
        } else if (occ.type === 'event') {
          const eventIcon = occ.event_type === 'work' ? '💼' : occ.event_type === 'study' ? '📚' : occ.event_type === 'extracurricular' ? '🎨' : occ.event_type === 'class_extra' ? '🏫' : '🌟';
          dateEvents.push({
            type: 'event',
            id: occ.id,
            title: `${eventIcon} ${occ.title}`,
            time: occ.start_time,
            color: occ.subject_color || '#a8a29e'
          });
        }
      }
    });

    // Add assignments due today
    assignments.forEach(a => {
      if (a.due_date === dateStr) {
        dateEvents.push({
          type: 'assignment',
          id: a.id,
          title: `📝 ${a.title}`,
          color: a.subject_color || 'var(--primary)',
          status: a.status
        });
      }
    });

    // Add exams scheduled today
    exams.forEach(e => {
      if (e.date === dateStr) {
        dateEvents.push({
          type: 'exam',
          id: e.id,
          title: `🎯 ${e.title}`,
          time: e.start_time,
          color: e.subject_color || 'var(--warning)'
        });
      }
    });

    // Add calendar notes today
    notes.forEach(n => {
      if (n.date === dateStr) {
        dateEvents.push({
          type: 'note',
          id: n.id,
          title: n.note,
          color: '#f1c40f'
        });
      }
    });

    return dateEvents;
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !eventTitle) {
      alert('Event title is required.');
      return;
    }

    const dateStr = selectedDate.toISOString().split('T')[0];
    try {
      setEventSaving(true);
      const res = await fetch(`${API_BASE_URL}/academic/calendar-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: eventTitle.trim(),
          type: eventType,
          subject_id: eventSubjectId || null,
          date: dateStr,
          start_time: eventStartTime,
          end_time: eventEndTime,
          location: eventLocation
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save event.');
      }

      setOccurrences(prev => [...prev, {
        type: 'event',
        id: data.id,
        title: data.title,
        event_type: data.type,
        subject_id: data.subject_id,
        subject_name: data.subject_name,
        subject_code: data.subject_code,
        subject_color: data.subject_color,
        date: data.date,
        start_time: data.start_time,
        end_time: data.end_time,
        location: data.location
      }]);

      setEventTitle('');
      setEventLocation('');
      setShowEventForm(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error saving event.');
    } finally {
      setEventSaving(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/academic/calendar-events/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete event.');
      }
      setOccurrences(prev => prev.filter(occ => occ.id !== id));
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error deleting event.');
    }
  };

  const handleCreateException = async (classId: string, type: 'skip' | 'move', moveParams?: { new_date: string, new_start_time: string, new_end_time: string, new_location: string }) => {
    if (!selectedDate) return;
    const dateStr = selectedDate.toISOString().split('T')[0];

    try {
      const res = await fetch(`${API_BASE_URL}/academic/class-exceptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          class_id: classId,
          original_date: dateStr,
          exception_type: type,
          new_date: moveParams?.new_date || null,
          new_start_time: moveParams?.new_start_time || null,
          new_end_time: moveParams?.new_end_time || null,
          new_location: moveParams?.new_location || null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to apply exception.');
      }

      // Re-fetch occurrences
      fetchData();
      setMovingClassId(null);
      alert(type === 'skip' ? 'Class occurrence skipped! ❌' : 'Class occurrence rescheduled! ➡️');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error applying exception.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div style={{ color: 'var(--text-muted)' }}>Assembling monthly view...</div>
      </div>
    );
  }

  const daysGrid = generateMonthDays();
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const monthName = currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Month Navigator Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <CalendarIcon size={20} style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{monthName}</h2>
        </div>
        
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem' }} onClick={handlePrevMonth}>
            <ChevronLeft size={16} />
          </button>
          <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem' }} onClick={handleNextMonth}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {error && <div className="alert-banner danger">{error}</div>}

      {/* Calendar Grid */}
      <div className="calendar-month-grid">
        {/* Days Header Row */}
        {weekDays.map(d => (
          <div key={d} className="calendar-day-header">
            {d}
          </div>
        ))}

        {/* Days Grid Cells */}
        {daysGrid.map((cell, idx) => {
          const events = getEventsForDate(cell.date);
          return (
            <div 
              key={idx} 
              className={`calendar-cell ${!cell.isCurrentMonth ? 'other-month' : ''} ${cell.isToday ? 'is-today' : ''}`}
              onClick={() => handleDayClick(cell.date)}
            >
              <span className="calendar-day-number">{cell.date.getDate()}</span>
              
              <div className="calendar-event-pills">
                {events.map((evt, eIdx) => (
                  <div 
                    key={eIdx} 
                    className={`calendar-pill ${evt.type === 'note' ? 'note-pill' : ''}`}
                    style={{ 
                      background: evt.type === 'class' 
                        ? `${evt.color}bb` 
                        : evt.type === 'note' 
                          ? undefined // uses css note-pill colors
                          : evt.color,
                      textDecoration: evt.status === 'completed' ? 'line-through' : 'none',
                      opacity: evt.status === 'completed' ? 0.6 : 1
                    }}
                    title={`${evt.type === 'note' ? `Note: ${evt.title}` : evt.title} ${evt.time ? `(${evt.time})` : ''}`}
                  >
                    {evt.type === 'note' ? '📌 ' : ''}{evt.time && `${evt.time} `}{evt.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* DATE DETAIL MODAL */}
      {selectedDate && (
        <div className="modal-overlay" onClick={() => { setSelectedDate(null); setShowEventForm(false); setMovingClassId(null); }}>
          <div className="modal-content" style={{ maxWidth: '480px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                Day Schedule ✦
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '0.15rem' }}>
                  {selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </h3>
              <button className="modal-close" onClick={() => { setSelectedDate(null); setShowEventForm(false); setMovingClassId(null); }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.2rem', paddingRight: '0.2rem' }}>
              
              {/* Schedule list */}
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Agendas & Events</span>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', minWidth: 'auto' }}
                    onClick={() => {
                      setShowEventForm(!showEventForm);
                      setEventTitle('');
                      setEventLocation('');
                    }}
                  >
                    {showEventForm ? 'Cancel Event' : 'Add Event +'}
                  </button>
                </h4>

                {showEventForm && (
                  <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--bg-app)', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '0.8rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.75rem' }}>Event Title</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Work Shift, Physics Study Session" 
                        className="form-input" 
                        value={eventTitle} 
                        onChange={(e) => setEventTitle(e.target.value)} 
                        required 
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.75rem' }}>Type</label>
                        <select 
                          className="form-select" 
                          value={eventType} 
                          onChange={(e) => setEventType(e.target.value)}
                        >
                          <option value="study">📚 Study Session</option>
                          <option value="work">💼 Work / Job</option>
                          <option value="extracurricular">🎨 Extracurricular / Club</option>
                          <option value="class_extra">🏫 Extra Class</option>
                          <option value="personal">🌟 Personal Event</option>
                          <option value="other">☕ Other</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.75rem' }}>Related Course</label>
                        <select 
                          className="form-select" 
                          value={eventSubjectId} 
                          onChange={(e) => setEventSubjectId(e.target.value)}
                        >
                          <option value="">None / General</option>
                          {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.75rem' }}>Start Time</label>
                        <input type="time" className="form-input" value={eventStartTime} onChange={(e) => setEventStartTime(e.target.value)} required />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.75rem' }}>End Time</label>
                        <input type="time" className="form-input" value={eventEndTime} onChange={(e) => setEventEndTime(e.target.value)} required />
                      </div>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.75rem' }}>Location / Room</label>
                      <input 
                        type="text" 
                        placeholder="Optional" 
                        className="form-input" 
                        value={eventLocation} 
                        onChange={(e) => setEventLocation(e.target.value)} 
                      />
                    </div>

                    <button type="submit" className="btn-primary" style={{ padding: '0.4rem', justifyContent: 'center' }} disabled={eventSaving}>
                      {eventSaving ? 'Saving...' : 'Save Event'}
                    </button>
                  </form>
                )}

                {getEventsForDate(selectedDate).filter(evt => evt.type !== 'note' && evt.type !== 'break').length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>
                    No lectures, assignments, or exams scheduled today.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {getEventsForDate(selectedDate)
                      .filter(evt => evt.type !== 'note' && evt.type !== 'break')
                      .map((evt, eIdx) => {
                        const isMoving = movingClassId === evt.id;
                        return (
                          <div key={eIdx} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', background: 'var(--bg-app)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md)', borderLeft: `4px solid ${evt.color}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div>
                                <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', fontWeight: 800, display: 'block', color: evt.color }}>
                                  {evt.type === 'class' ? 'Class Lecture' : evt.type}
                                </span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, textDecoration: evt.status === 'completed' ? 'line-through' : 'none' }}>
                                  {evt.title}
                                </span>
                                {evt.time && (
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                                    ({evt.time})
                                  </span>
                                )}
                              </div>

                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                {evt.type === 'event' && (
                                  <button 
                                    type="button" 
                                    className="btn-secondary" 
                                    style={{ padding: '0.15rem 0.3rem', borderColor: 'transparent', minWidth: 'auto' }} 
                                    onClick={() => handleDeleteEvent(evt.id)}
                                    title="Delete custom event"
                                  >
                                    🗑️
                                  </button>
                                )}

                                {evt.type === 'class' && (() => {
                                  const dateStr = selectedDate ? formatLocalDate(selectedDate) : '';
                                  const currentLog = attendanceLogs.find(l => l.subject_id === evt.subject_id && l.date === dateStr);
                                  const isAttended = currentLog?.status === 'present';
                                  const isMissed = currentLog?.status === 'absent';

                                  return (
                                    <>
                                      <button 
                                        type="button" 
                                        className="badge" 
                                        style={{ 
                                          padding: '0.2rem 0.5rem', 
                                          borderColor: isAttended ? 'var(--success)' : 'var(--border-color)', 
                                          minWidth: 'auto', 
                                          fontSize: '0.72rem', 
                                          fontWeight: 800,
                                          background: isAttended ? 'var(--success)' : 'var(--bg-surface)', 
                                          color: isAttended ? '#ffffff' : 'var(--text-secondary)',
                                          cursor: 'pointer',
                                          borderRadius: 'var(--radius-sm)',
                                          transition: 'all 0.15s ease',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.2rem'
                                        }} 
                                        onClick={() => evt.subject_id && handleToggleAttendance(evt.subject_id, 'present')}
                                        title="Mark as Attended (+1)"
                                      >
                                        ✓
                                      </button>
                                      <button 
                                        type="button" 
                                        className="badge" 
                                        style={{ 
                                          padding: '0.2rem 0.5rem', 
                                          borderColor: isMissed ? '#e74c3c' : 'var(--border-color)', 
                                          minWidth: 'auto', 
                                          fontSize: '0.72rem', 
                                          fontWeight: 800,
                                          background: isMissed ? '#e74c3c' : 'var(--bg-surface)', 
                                          color: isMissed ? '#ffffff' : 'var(--text-secondary)',
                                          cursor: 'pointer',
                                          borderRadius: 'var(--radius-sm)',
                                          transition: 'all 0.15s ease',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.2rem'
                                        }} 
                                        onClick={() => evt.subject_id && handleToggleAttendance(evt.subject_id, 'absent')}
                                        title="Mark as Missed (-1)"
                                      >
                                        ✕
                                      </button>
                                      <button 
                                        type="button" 
                                        className="btn-secondary" 
                                        style={{ padding: '0.15rem 0.35rem', borderColor: 'rgba(52, 152, 219, 0.3)', minWidth: 'auto', fontSize: '0.7rem', color: '#3498db' }} 
                                        onClick={() => {
                                          setMovingClassId(isMoving ? null : evt.id);
                                          setMoveNewDate(selectedDate ? formatLocalDate(selectedDate) : '');
                                          setMoveStartTime(evt.time || '09:00');
                                          setMoveEndTime('10:00');
                                          setMoveLocation('');
                                        }}
                                        title="Reschedule class occurrence"
                                      >
                                        Move ➡️
                                      </button>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>

                            {isMoving && (
                              <form 
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  handleCreateException(evt.id.split('_')[0], 'move', {
                                    new_date: moveNewDate,
                                    new_start_time: moveStartTime,
                                    new_end_time: moveEndTime,
                                    new_location: moveLocation
                                  });
                                }}
                                style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(52, 152, 219, 0.05)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px dashed rgba(52, 152, 219, 0.3)', marginTop: '0.4rem' }}
                              >
                                <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Reschedule Occurrence:</span>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.4rem' }}>
                                  <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ fontSize: '0.65rem' }}>New Date</label>
                                    <input type="date" className="form-input" style={{ padding: '0.2rem', fontSize: '0.75rem' }} value={moveNewDate} onChange={(e) => setMoveNewDate(e.target.value)} required />
                                  </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                                  <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ fontSize: '0.65rem' }}>Start Time</label>
                                    <input type="time" className="form-input" style={{ padding: '0.2rem', fontSize: '0.75rem' }} value={moveStartTime} onChange={(e) => setMoveStartTime(e.target.value)} required />
                                  </div>
                                  <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ fontSize: '0.65rem' }}>End Time</label>
                                    <input type="time" className="form-input" style={{ padding: '0.2rem', fontSize: '0.75rem' }} value={moveEndTime} onChange={(e) => setMoveEndTime(e.target.value)} required />
                                  </div>
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                  <label style={{ fontSize: '0.65rem' }}>New Location</label>
                                  <input type="text" className="form-input" style={{ padding: '0.2rem', fontSize: '0.75rem' }} placeholder="Optional" value={moveLocation} onChange={(e) => setMoveLocation(e.target.value)} />
                                </div>
                                <button type="submit" className="btn-primary" style={{ padding: '0.3rem', fontSize: '0.75rem', justifyContent: 'center' }}>
                                  Reschedule Slot
                                </button>
                              </form>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Notes list */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.2rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Custom Date Note</h4>
                
                <form onSubmit={handleSaveNote} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <textarea
                      className="form-textarea"
                      style={{ minHeight: '80px', fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                      placeholder="Type a custom reminder or note for this date..."
                      value={dayNoteText}
                      onChange={e => setDayNoteText(e.target.value)}
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    style={{ alignSelf: 'flex-start', padding: '0.45rem 1rem', fontSize: '0.8rem', minWidth: 'auto', boxShadow: 'none' }}
                    disabled={savingNote}
                  >
                    {savingNote ? 'Saving...' : 'Save Note'}
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
