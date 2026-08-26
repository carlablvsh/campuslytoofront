import React, { useEffect, useState } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { MapPin, Plus, X, Clock, Edit2, Trash2, Check } from 'lucide-react';

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
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' }
];

const PRESETS_COLORS = [
  '#ffd1dc', // Blush Pink
  '#cce4f6', // Powder Blue
  '#e5dbfb', // Lavender
  '#c7ebd7', // Mint
  '#ffecb3', // Butter Yellow
  '#ffe2cb', // Soft Peach
];

export const Timetable: React.FC = () => {
  const { token } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal control states
  const [showClassModal, setShowClassModal] = useState<boolean>(false);
  const [showSubjectModal, setShowSubjectModal] = useState<boolean>(false);

  // Add Class Form State
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [classDay, setClassDay] = useState<number>(1);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [location, setLocation] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Add Subject Form State
  const [subjectName, setSubjectName] = useState<string>('');
  const [subjectCode, setSubjectCode] = useState<string>('');
  const [targetAttendance, setTargetAttendance] = useState<number>(75);
  const [selectedColor, setSelectedColor] = useState<string>(PRESETS_COLORS[0]);

  // Subject Edit State
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editCode, setEditCode] = useState<string>('');
  const [editTargetAttendance, setEditTargetAttendance] = useState<number>(75);
  const [editColor, setEditColor] = useState<string>(PRESETS_COLORS[0]);

  const startEditSubject = (subject: Subject) => {
    setEditingSubjectId(subject.id);
    setEditName(subject.name);
    setEditCode(subject.code);
    setEditTargetAttendance(subject.target_attendance);
    setEditColor(subject.color);
  };

  const cancelEditSubject = () => {
    setEditingSubjectId(null);
    setFormError(null);
  };

  // Submit update subject
  const handleUpdateSubject = async (e: React.FormEvent, subjectId: string) => {
    e.preventDefault();
    setFormError(null);

    if (!editName || !editCode) {
      setFormError('Course Name and Code are required.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/academic/subjects/${subjectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName,
          code: editCode,
          target_attendance: editTargetAttendance,
          color: editColor
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update subject.');
      }

      setSubjects(prev => prev.map(s => s.id === subjectId ? data : s));
      setClasses(prev => prev.map(c => c.subject_id === subjectId ? {
        ...c,
        subject_name: data.name,
        subject_code: data.code,
        subject_color: data.color
      } : c));

      setEditingSubjectId(null);
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  // Delete subject handler
  const handleDeleteSubject = async (subjectId: string) => {
    if (!window.confirm('Delete subject and all associated classes/records?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/academic/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete subject.');
      }

      setSubjects(prev => prev.filter(s => s.id !== subjectId));
      setClasses(prev => prev.filter(c => c.subject_id !== subjectId));

      if (selectedSubjectId === subjectId) {
        setSelectedSubjectId('');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting subject.');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subRes, classRes] = await Promise.all([
        fetch(`${API_BASE_URL}/academic/subjects`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/academic/classes`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!subRes.ok || !classRes.ok) {
        throw new Error('Error loading schedule resources.');
      }

      const subData = await subRes.json();
      const classData = await classRes.json();
      
      setSubjects(subData);
      setClasses(classData);
      
      if (subData.length > 0) {
        setSelectedSubjectId(subData[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error communicating with server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  // Handle class deletion
  const handleDeleteClass = async (classId: string) => {
    if (!window.confirm('Are you sure you want to delete this class from your schedule?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/academic/classes/${classId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setClasses(prev => prev.filter(c => c.id !== classId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit new subject
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!subjectName || !subjectCode) {
      setFormError('Course Name and Code are required.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/academic/subjects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: subjectName,
          code: subjectCode,
          target_attendance: targetAttendance,
          color: selectedColor
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create subject.');
      }

      setSubjects(prev => [...prev, data]);
      setSelectedSubjectId(data.id);
      
      // Reset form & close modal
      setSubjectName('');
      setSubjectCode('');
      setTargetAttendance(75);
      setSelectedColor(PRESETS_COLORS[0]);
      setShowSubjectModal(false);
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  // Submit new class
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedSubjectId) {
      setFormError('Please select or create a subject first.');
      return;
    }

    if (!startTime || !endTime) {
      setFormError('Start and end times are required.');
      return;
    }

    // Time logic check
    if (startTime >= endTime) {
      setFormError('Class start time must be before end time.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/academic/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject_id: selectedSubjectId,
          day_of_week: classDay,
          start_time: startTime,
          end_time: endTime,
          location
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add class.');
      }

      setClasses(prev => [...prev, data]);
      
      // Clear forms
      setLocation('');
      setShowClassModal(false);
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ color: 'var(--text-secondary)' }}>Loading schedule board...</div>
      </div>
    );
  }

  // Group classes by day for displaying
  const getClassesForDay = (dayVal: number) => {
    return classes.filter(c => c.day_of_week === dayVal);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      
      {/* Header section with buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.8rem' }}>
        <button 
          className="btn-secondary" 
          onClick={() => setShowSubjectModal(true)}
          style={{ borderColor: '#e67e22', color: '#e67e22', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Edit2 size={14} />
          Manage subjects
        </button>
        <button className="btn-primary" onClick={() => setShowClassModal(true)}>
          <Plus size={16} />
          Add class
        </button>
      </div>

      {error && (
        <div className="alert-banner danger">
          <span>{error}</span>
        </div>
      )}

      {/* Timetable schedule grid */}
      <div className="timetable-grid-container">
        <div className="timetable-week-columns">
          {DAYS_OF_WEEK.map(day => {
            const dayClasses = getClassesForDay(day.value);
            return (
              <div key={day.value} style={{ display: 'contents' }}>
                <div className="day-column-header" style={{ fontFamily: 'var(--font-serif)', fontSize: '0.9rem' }}>
                  {day.label.slice(0, 3)}
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '0.1rem' }}>
                    {dayClasses.length} {dayClasses.length === 1 ? 'class' : 'classes'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="timetable-week-columns">
          {DAYS_OF_WEEK.map(day => {
            const dayClasses = getClassesForDay(day.value);
            return (
              <div key={day.value} className="day-column-body">
                {dayClasses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 0.2rem', color: 'var(--text-muted)', fontSize: '0.75rem', border: '1px dashed rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                    No classes
                  </div>
                ) : (
                  dayClasses.map(c => (
                    <div 
                      key={c.id} 
                      className="timetable-card"
                      style={{ 
                        '--item-color': c.subject_color,
                        '--item-color-glow': c.subject_color + '18'
                      } as React.CSSProperties}
                    >
                      <button className="delete-btn" title="Delete class" onClick={() => handleDeleteClass(c.id)}>
                        <X size={10} />
                      </button>
                      <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{c.subject_code}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.subject_name}</span>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--text-secondary)', fontSize: '0.7rem', marginTop: '0.2rem' }}>
                        <Clock size={10} />
                        <span>{c.start_time} - {c.end_time}</span>
                      </div>
                      
                      {c.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                          <MapPin size={10} />
                          <span>{c.location}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL 1: ADD CLASS FORM */}
      {showClassModal && (
        <div className="modal-overlay" onClick={() => setShowClassModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Schedule New Class</h3>
              <button className="modal-close" onClick={() => setShowClassModal(false)}>
                <X size={20} />
              </button>
            </div>

            {formError && <div className="alert-banner danger">{formError}</div>}

            <form onSubmit={handleCreateClass} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div className="form-group">
                <label>Select Subject</label>
                {subjects.length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--warning)', marginTop: '0.2rem' }}>
                    No subjects configured yet. Please{' '}
                    <span 
                      style={{ textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => {
                        setShowClassModal(false);
                        setShowSubjectModal(true);
                      }}
                    >
                      create a subject
                    </span>{' '}
                    first.
                  </div>
                ) : (
                  <select 
                    className="form-select"
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="form-group">
                <label>Day of Week</label>
                <select 
                  className="form-select"
                  value={classDay}
                  onChange={(e) => setClassDay(parseInt(e.target.value, 10))}
                >
                  {DAYS_OF_WEEK.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Start Time</label>
                  <input 
                    type="time" 
                    className="form-input" 
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input 
                    type="time" 
                    className="form-input" 
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Room / Location (Optional)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Lecture Hall B, Zoom Link"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
                Add Class
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MANAGE SUBJECTS FORM */}
      {showSubjectModal && (
        <div className="modal-overlay" onClick={() => { setShowSubjectModal(false); cancelEditSubject(); }}>
          <div className="modal-content" style={{ maxWidth: '480px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Manage Subjects</h3>
              <button className="modal-close" onClick={() => { setShowSubjectModal(false); cancelEditSubject(); }}>
                <X size={20} />
              </button>
            </div>

            {formError && <div className="alert-banner danger" style={{ marginBottom: '0.8rem' }}>{formError}</div>}

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.2rem', paddingRight: '0.2rem' }}>
              
              {/* Existing Subjects Section */}
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Existing Courses</h4>
                {subjects.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.4rem', fontStyle: 'italic' }}>
                    No subjects registered yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {subjects.map(s => {
                      const isEditing = editingSubjectId === s.id;
                      if (isEditing) {
                        return (
                          <form key={s.id} onSubmit={(e) => handleUpdateSubject(e, s.id)} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', background: 'var(--bg-app)', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--primary-glow)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.4rem' }}>
                              <div className="form-group" style={{ margin: 0 }}>
                                <input 
                                  type="text" 
                                  className="form-input" 
                                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }} 
                                  placeholder="MATH301"
                                  value={editCode}
                                  onChange={(e) => setEditCode(e.target.value)}
                                  required
                                />
                              </div>
                              <div className="form-group" style={{ margin: 0 }}>
                                <input 
                                  type="text" 
                                  className="form-input" 
                                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }} 
                                  placeholder="Calculus"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  required
                                />
                              </div>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', flexWrap: 'wrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}>
                                <span>Target:</span>
                                <input 
                                  type="number" 
                                  min="0"
                                  max="100"
                                  className="form-input" 
                                  style={{ width: '48px', padding: '0.2rem 0.4rem', fontSize: '0.75rem', textAlign: 'center' }} 
                                  value={editTargetAttendance}
                                  onChange={(e) => setEditTargetAttendance(parseInt(e.target.value, 10))}
                                  required
                                />
                                <span>%</span>
                              </div>

                              <div className="color-picker-grid" style={{ gridTemplateColumns: 'repeat(6, 16px)', gap: '0.2rem' }}>
                                {PRESETS_COLORS.map(c => (
                                  <div 
                                    key={c} 
                                    className={`color-option ${editColor === c ? 'selected' : ''}`}
                                    style={{ background: c, height: '14px', width: '14px' }}
                                    onClick={() => setEditColor(c)}
                                  />
                                ))}
                              </div>

                              <div style={{ display: 'flex', gap: '0.3rem' }}>
                                <button type="submit" className="btn-primary" style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', minWidth: 'auto', borderRadius: 'var(--radius-sm) !important' }} title="Save Changes">
                                  <Check size={12} />
                                </button>
                                <button type="button" className="btn-secondary" style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', minWidth: 'auto', borderRadius: 'var(--radius-sm) !important' }} onClick={cancelEditSubject} title="Cancel">
                                  <X size={12} />
                                </button>
                              </div>
                            </div>
                          </form>
                        );
                      }

                      return (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50% !important', background: s.color, flexShrink: 0 }} />
                            <span style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-primary)' }}>[{s.code}]</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>{s.name}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>({s.target_attendance}%)</span>
                          </div>

                          <div style={{ display: 'flex', gap: '0.3rem' }}>
                            <button type="button" className="btn-secondary" style={{ padding: '0.25rem 0.4rem', borderRadius: 'var(--radius-sm) !important', minWidth: 'auto' }} onClick={() => startEditSubject(s)} title="Edit Subject">
                              <Edit2 size={12} style={{ color: 'var(--text-secondary)' }} />
                            </button>
                            <button type="button" className="btn-secondary" style={{ padding: '0.25rem 0.4rem', borderRadius: 'var(--radius-sm) !important', minWidth: 'auto' }} onClick={() => handleDeleteSubject(s.id)} title="Delete Subject">
                              <Trash2 size={12} style={{ color: 'var(--primary)' }} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Create Subject Section */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.2rem', marginTop: '0.4rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.8rem' }}>Add New Subject</h4>
                
                <form onSubmit={handleCreateSubject} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.6rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.75rem' }}>Course Code</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. MATH301"
                        value={subjectCode}
                        onChange={(e) => setSubjectCode(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.75rem' }}>Course Name</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. Calculus"
                        value={subjectName}
                        onChange={(e) => setSubjectName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>Target Attendance (%)</label>
                    <input 
                      type="number" 
                      min="0" 
                      max="100" 
                      className="form-input" 
                      value={targetAttendance}
                      onChange={(e) => setTargetAttendance(parseInt(e.target.value, 10))}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>Card Color Highlight</label>
                    <div className="color-picker-grid" style={{ marginTop: '0.2rem' }}>
                      {PRESETS_COLORS.map(color => (
                        <div 
                          key={color} 
                          className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                          style={{ background: color }}
                          onClick={() => setSelectedColor(color)}
                        />
                      ))}
                    </div>
                  </div>

                  <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.4rem', padding: '0.5rem' }}>
                    Create Subject
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
