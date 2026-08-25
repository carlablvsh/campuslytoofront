import React, { useEffect, useState } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';

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
}

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
  type: 'class' | 'assignment' | 'exam' | 'note';
  id: string;
  title: string;
  time?: string;
  color: string;
  status?: string;
}

export const CalendarView: React.FC = () => {
  const { token } = useAuth();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [notes, setNotes] = useState<CalendarNote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Interactive States
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayNoteText, setDayNoteText] = useState<string>('');
  const [savingNote, setSavingNote] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classRes, assRes, exRes, noteRes] = await Promise.all([
        fetch(`${API_BASE_URL}/academic/classes`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/academic/assignments`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/academic/exams`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/academic/calendar-notes`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!classRes.ok || !assRes.ok || !exRes.ok || !noteRes.ok) {
        throw new Error('Failed to load academic records.');
      }

      setClasses(await classRes.json());
      setAssignments(await assRes.json());
      setExams(await exRes.json());
      setNotes(await noteRes.json());
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
  }, [token]);

  // Navigate Months
  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    const dateStr = date.toISOString().split('T')[0];
    const existingNote = notes.find(n => n.date === dateStr);
    setDayNoteText(existingNote ? existingNote.note : '');
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    const dateStr = selectedDate.toISOString().split('T')[0];
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
    const todayStr = new Date().toISOString().split('T')[0];
    for (let i = 1; i <= totalDays; i++) {
      const thisDate = new Date(year, month, i);
      const thisDateStr = thisDate.toISOString().split('T')[0];
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
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dateEvents: CalendarDayEvent[] = [];

    // Add classes occurring on this weekday (only for current month or future to avoid cluttering)
    classes.forEach(c => {
      if (c.day_of_week === dayOfWeek) {
        dateEvents.push({
          type: 'class',
          id: c.id,
          title: c.subject_code,
          time: c.start_time,
          color: c.subject_color
        });
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
          title: `⚡ ${e.title}`,
          time: e.start_time,
          color: '#8b5cf6' // Lavender accent
        });
      }
    });

    // Add custom date notes
    const dateNote = notes.find(n => n.date === dateStr);
    if (dateNote) {
      dateEvents.push({
        type: 'note',
        id: dateNote.id,
        title: dateNote.note,
        color: '#fef08a'
      });
    }

    // Sort by type and time
    return dateEvents;
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
        <div className="modal-overlay" onClick={() => setSelectedDate(null)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                Day Schedule ✦
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '0.15rem' }}>
                  {selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </h3>
              <button className="modal-close" onClick={() => setSelectedDate(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.2rem' }}>
              
              {/* Schedule list */}
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Agendas & Events</h4>
                {getEventsForDate(selectedDate).filter(evt => evt.type !== 'note').length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>
                    No lectures, assignments, or exams scheduled today.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {getEventsForDate(selectedDate)
                      .filter(evt => evt.type !== 'note')
                      .map((evt, eIdx) => (
                        <div 
                          key={eIdx}
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            padding: '0.5rem 0.75rem', 
                            background: 'var(--bg-app)', 
                            borderRadius: 'var(--radius-md)', 
                            borderLeft: `4px solid ${evt.color}`
                          }}
                        >
                          <div>
                            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, display: 'block', color: evt.color }}>
                              {evt.type}
                            </span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, textDecoration: evt.status === 'completed' ? 'line-through' : 'none' }}>
                              {evt.title}
                            </span>
                          </div>
                          {evt.time && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {evt.time}
                            </span>
                          )}
                        </div>
                      ))}
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
