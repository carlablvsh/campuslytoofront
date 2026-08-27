import React, { useEffect, useState } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { MapPin, Plus, X, Clock, Edit2, Trash2, Check, Sparkles, Upload, Bot, Calendar as CalendarIcon } from 'lucide-react';
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
  const { token, user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal control states
  const [showClassModal, setShowClassModal] = useState<boolean>(false);
  const [showSubjectModal, setShowSubjectModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showReviewScreen, setShowReviewScreen] = useState<boolean>(false);

  // AI Timetable Importer Form State
  const [importBranch, setImportBranch] = useState<string>('');
  const [importSemester, setImportSemester] = useState<string>('1');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState<boolean>(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [reviewClasses, setReviewClasses] = useState<any[]>([]);

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
  const [isSubmittingSubject, setIsSubmittingSubject] = useState<boolean>(false);
  const [isSubmittingClass, setIsSubmittingClass] = useState<boolean>(false);

  // Breaks Management States
  const [showBreaksModal, setShowBreaksModal] = useState<boolean>(false);
  const [breaks, setBreaks] = useState<any[]>([]);
  const [breakName, setBreakName] = useState<string>('');
  const [breakStart, setBreakStart] = useState<string>('');
  const [breakEnd, setBreakEnd] = useState<string>('');
  const [breaksLoading, setBreaksLoading] = useState<boolean>(false);

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
      const [subRes, classRes, breakRes] = await Promise.all([
        fetch(`${API_BASE_URL}/academic/subjects`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/academic/classes`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/academic/breaks`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!subRes.ok || !classRes.ok || !breakRes.ok) {
        throw new Error('Error loading schedule resources.');
      }

      const subData = await subRes.json();
      const classData = await classRes.json();
      const breakData = await breakRes.json();
      
      setSubjects(subData);
      setClasses(classData);
      setBreaks(breakData);
      
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

  const handleCreateBreak = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!breakName || !breakStart || !breakEnd) {
      alert('All break fields are required.');
      return;
    }
    if (breakStart > breakEnd) {
      alert('Start date must be before or equal to end date.');
      return;
    }
    try {
      setBreaksLoading(true);
      const res = await fetch(`${API_BASE_URL}/academic/breaks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: breakName.trim(),
          start_date: breakStart,
          end_date: breakEnd
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save break.');
      }

      setBreaks(prev => [...prev, data]);
      setBreakName('');
      setBreakStart('');
      setBreakEnd('');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error saving break.');
    } finally {
      setBreaksLoading(false);
    }
  };

  const handleDeleteBreak = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this break period?')) return;
    try {
      setBreaksLoading(true);
      const res = await fetch(`${API_BASE_URL}/academic/breaks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete break.');
      }
      setBreaks(prev => prev.filter(b => b.id !== id));
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error deleting break.');
    } finally {
      setBreaksLoading(false);
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

    if (!subjectName.trim() || !subjectCode.trim()) {
      setFormError('Course Name and Code are required.');
      return;
    }

    if (isSubmittingSubject) return;

    try {
      setIsSubmittingSubject(true);
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

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create subject.');
      }

      setSubjects(prev => {
        if (prev.some(s => s.id === data.id)) return prev;
        return [...prev, data];
      });
      setSelectedSubjectId(data.id);
      
      // Reset form & close modal
      setSubjectName('');
      setSubjectCode('');
      setTargetAttendance(75);
      setSelectedColor(PRESETS_COLORS[0]);
      setShowSubjectModal(false);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmittingSubject(false);
    }
  };

  const startEditClass = (c: ClassItem) => {
    setEditingClassId(c.id);
    setSelectedSubjectId(c.subject_id);
    setClassDay(c.day_of_week);
    setStartTime(c.start_time);
    setEndTime(c.end_time);
    setLocation(c.location || '');
    setStartDate(c.start_date || formatLocalDate(new Date()));
    setEndDate(c.end_date || formatLocalDate(addDays(new Date(), 180)));
    setRecurrenceType(c.recurrence_type || 'weekly');
    setRecurrenceDays(c.recurrence_days ? c.recurrence_days.split(',').map(Number) : []);
    setFormError(null);
    setShowClassModal(true);
  };

  // Submit new or updated class
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

    if (isSubmittingClass) return;

    const payload = {
      subject_id: selectedSubjectId,
      day_of_week: classDay,
      start_time: startTime,
      end_time: endTime,
      location: location.trim(),
      start_date: startDate,
      end_date: endDate,
      recurrence_type: recurrenceType,
      recurrence_days: recurrenceType === 'custom_days' ? recurrenceDays.join(',') : null
    };

    try {
      setIsSubmittingClass(true);
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

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save class.');
      }

      if (editingClassId) {
        setClasses(prev => prev.map(item => item.id === editingClassId ? data : item));
      } else {
        setClasses(prev => {
          if (prev.some(c => c.id === data.id)) return prev;
          return [...prev, data];
        });
      }
      
      // Clear forms
      setLocation('');
      setEditingClassId(null);
      setRecurrenceType('weekly');
      setRecurrenceDays([]);
      setShowClassModal(false);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmittingClass(false);
    }
  };

  // AI Timetable Importer Handlers
  const compressImage = async (file: File): Promise<Blob | File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            0.7
          );
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportFile(e.target.files[0]);
    }
  };

  const handleAnalyzeTimetable = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportError(null);
    
    if (!importFile) {
      setImportError('Please select a timetable image or PDF file.');
      return;
    }
    if (!importBranch || !importSemester) {
      setImportError('Please enter your branch and semester.');
      return;
    }

    setImportLoading(true);

    try {
      let fileToSend: Blob | File = importFile;
      if (importFile.type.startsWith('image/')) {
        fileToSend = await compressImage(importFile);
      } else if (importFile.size > 4 * 1024 * 1024) {
        throw new Error('PDF files must be under 4MB. Please compress your PDF or upload an image.');
      }

      const formData = new FormData();
      formData.append('timetable', fileToSend, importFile.name);
      formData.append('branch', importBranch);
      formData.append('semester', importSemester);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 40000); // 40 seconds timeout

      const res = await fetch(`${API_BASE_URL}/ai/import-timetable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.status === 504) {
        throw new Error('Timetable analysis timed out. The image might be too complex or large. Please try a simpler file.');
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze timetable with AI.');
      }

      setReviewClasses(data.classes || []);
      setShowReviewScreen(true);
      setShowImportModal(false);
    } catch (err: any) {
      console.error('Import error details:', err);
      if (err.name === 'AbortError') {
        setImportError('The request timed out. Please check your internet connection or try with a smaller, compressed image.');
      } else {
        setImportError(err.message || 'Error occurred while communicating with the AI service.');
      }
    } finally {
      setImportLoading(false);
    }
  };

  const handleEditReviewClass = (index: number, field: string, value: any) => {
    setReviewClasses(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  const handleDeleteReviewClass = (index: number) => {
    setReviewClasses(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddReviewClassRow = () => {
    setReviewClasses(prev => [
      ...prev,
      {
        day: 'Monday',
        start_time: '09:00',
        end_time: '10:00',
        subject_name: '',
        subject_code: '',
        class_type: 'lecture',
        room: '',
        faculty: ''
      }
    ]);
  };

  const handleConfirmImport = async () => {
    setImportError(null);
    setImportLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/academic/classes/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ classes: reviewClasses })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save timetable.');
      }

      // Re-fetch data to refresh board
      fetchData();
      
      // Close review and reset
      setShowReviewScreen(false);
      setReviewClasses([]);
      setImportFile(null);
      setImportBranch('');
      setImportSemester('1');
    } catch (err: any) {
      setImportError(err.message);
      // Keep review screen open so they can retry or fix conflicts
    } finally {
      setImportLoading(false);
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
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
        <button 
          className="btn-secondary" 
          onClick={() => setShowImportModal(true)}
          style={{ borderColor: '#ff7899', color: '#ff7899', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Sparkles size={14} />
          Import with AI
        </button>
        <button 
          className="btn-secondary" 
          onClick={() => setShowSubjectModal(true)}
          style={{ borderColor: '#ff7899', color: '#ff7899', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Edit2 size={14} />
          Manage subjects
        </button>
        <button 
          className="btn-secondary" 
          onClick={() => setShowBreaksModal(true)}
          style={{ borderColor: '#ff7899', color: '#ff7899', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <CalendarIcon size={14} />
          Manage Breaks
        </button>
        <button className="btn-primary" onClick={() => {
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
        }}>
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
                      onClick={() => startEditClass(c)}
                      style={{ 
                        '--item-color': c.subject_color,
                        '--item-color-glow': c.subject_color + '18',
                        cursor: 'pointer'
                      } as React.CSSProperties}
                    >
                      <button className="delete-btn" title="Delete class" onClick={(e) => { e.stopPropagation(); handleDeleteClass(c.id); }}>
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
          <div className="modal-content" style={{ maxWidth: '480px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ marginBottom: '0.6rem' }}>
              <h3>{editingClassId ? 'Edit Class Details' : 'Schedule New Class'}</h3>
              <button className="modal-close" onClick={() => setShowClassModal(false)}>
                <X size={20} />
              </button>
            </div>

            {formError && <div className="alert-banner danger" style={{ margin: '0 0 0.8rem 0' }}>{formError}</div>}

            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.3rem' }}>
              <form onSubmit={handleCreateClass} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Start Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Recurrence Type</label>
                <select 
                  className="form-select"
                  value={recurrenceType}
                  onChange={(e) => setRecurrenceType(e.target.value)}
                >
                  <option value="none">No Repeat</option>
                  <option value="weekly">Every Week</option>
                  <option value="biweekly">Every 2 Weeks</option>
                  <option value="custom_days">Custom Days of Week</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              {recurrenceType === 'custom_days' ? (
                <div className="form-group">
                  <label>Select Repeating Days</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '0.4rem' }}>
                    {DAYS_OF_WEEK.map(d => {
                      const isSelected = recurrenceDays.includes(d.value);
                      return (
                        <label 
                          key={d.value} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.3rem', 
                            fontSize: '0.8rem', 
                            background: isSelected ? 'var(--bg-app-hover)' : 'transparent',
                            padding: '0.3rem 0.6rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-color)',
                            cursor: 'pointer'
                          }}
                        >
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setRecurrenceDays(prev => [...prev, d.value]);
                              } else {
                                setRecurrenceDays(prev => prev.filter(dayVal => dayVal !== d.value));
                              }
                            }}
                          />
                          {d.label.slice(0, 3)}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <label>Primary Day of Week</label>
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
              )}

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

                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={isSubmittingClass}
                  style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', opacity: isSubmittingClass ? 0.7 : 1 }}
                >
                  {isSubmittingClass ? 'Saving Class...' : (editingClassId ? 'Save Changes ✦' : 'Add Class ✦')}
                </button>
              </form>
            </div>
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

                  <button 
                    type="submit" 
                    className="btn-primary" 
                    disabled={isSubmittingSubject}
                    style={{ width: '100%', justifyContent: 'center', marginTop: '0.4rem', padding: '0.5rem', opacity: isSubmittingSubject ? 0.7 : 1 }}
                  >
                    {isSubmittingSubject ? 'Saving Subject...' : 'Create Subject'}
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL 2.5: MANAGE BREAKS FORM */}
      {showBreaksModal && (
        <div className="modal-overlay" onClick={() => setShowBreaksModal(false)}>
          <div className="modal-content" style={{ maxWidth: '520px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Manage Breaks</h3>
              <button className="modal-close" onClick={() => setShowBreaksModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.2rem', paddingRight: '0.2rem' }}>
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Active Vacation periods</h4>
                {breaksLoading && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Updating vacation periods...</div>}
                
                {breaks.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.5rem', fontStyle: 'italic', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)' }}>
                    No breaks registered. Timetable will repeat normally.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {breaks.map(b => (
                      <div 
                        key={b.id} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          padding: '0.6rem 0.8rem', 
                          background: 'rgba(231, 76, 60, 0.05)', 
                          borderRadius: 'var(--radius-md)', 
                          border: '1px solid rgba(231, 76, 60, 0.2)' 
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{b.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            📅 {b.start_date} to {b.end_date}
                          </span>
                        </div>
                        <button 
                          type="button" 
                          className="btn-secondary" 
                          style={{ padding: '0.25rem 0.4rem', borderColor: 'rgba(231, 76, 60, 0.3)', minWidth: 'auto' }} 
                          onClick={() => handleDeleteBreak(b.id)} 
                          title="Delete break"
                        >
                          <Trash2 size={12} style={{ color: '#e74c3c' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.2rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.8rem' }}>Add New Break Period</h4>
                
                <form onSubmit={handleCreateBreak} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>Break Name (e.g. Winter Break)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Christmas Vacation, Semester Break"
                      value={breakName}
                      onChange={(e) => setBreakName(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.75rem' }}>Start Date</label>
                      <input 
                        type="date" 
                        className="form-input" 
                        value={breakStart}
                        onChange={(e) => setBreakStart(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.75rem' }}>End Date</label>
                      <input 
                        type="date" 
                        className="form-input" 
                        value={breakEnd}
                        onChange={(e) => setBreakEnd(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn-primary" 
                    style={{ width: '100%', justifyContent: 'center', marginTop: '0.4rem', padding: '0.5rem', background: '#ff4d6d', borderColor: '#ff4d6d' }}
                    disabled={breaksLoading}
                  >
                    Add Break Period
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* MODAL 3: AI TIMETABLE IMPORT */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => { if (!importLoading) setShowImportModal(false); }}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={18} style={{ color: 'var(--primary)' }} />
                Import Timetable with AI
              </h3>
              <button className="modal-close" onClick={() => setShowImportModal(false)} disabled={importLoading}>
                <X size={20} />
              </button>
            </div>

            {!user?.hasGeminiKey ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2rem 1rem', gap: '1.2rem' }}>
                <Bot size={40} style={{ color: '#ff7899', marginLeft: 'auto', marginRight: 'auto' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2e1622', margin: 0 }}>Connect Your Gemini Key</h4>
                <p style={{ fontSize: '0.8rem', color: '#8c707a', lineHeight: 1.5, margin: 0 }}>
                  Campusly uses Gemini for its AI-powered timetable import. Connect your own Gemini API key in settings to analyze your timetable and extract classes automatically.
                </p>
                <button 
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    window.dispatchEvent(new CustomEvent('open-profile-settings'));
                  }}
                  className="btn-primary"
                  style={{ padding: '0.55rem 1.2rem', borderRadius: '20px', display: 'inline-flex', alignSelf: 'center' }}
                >
                  Setup Gemini API Key
                </button>
              </div>
            ) : (
              <>
                {importError && <div className="alert-banner danger" style={{ marginBottom: '1rem' }}>{importError}</div>}

                {importLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', gap: '1rem' }}>
                    <div className="spinner" style={{ borderTopColor: 'var(--primary)' }}></div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Analyzing your timetable...</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Gemini is reading the days, slots, and branch-specific courses. This may take up to a minute.</p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleAnalyzeTimetable} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-app)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)', lineHeight: '1.4' }}>
                  💡 Upload an image (PNG, JPG) or PDF of your semester schedule. Describe your branch/major and semester, and the AI will extract the relevant lectures and labs!
                </div>

                <div className="form-group">
                  <label>Academic Branch / Major</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Computer Science, BDA, Mechanical"
                    value={importBranch}
                    onChange={(e) => setImportBranch(e.target.value)}
                    required
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.2rem', display: 'block' }}>
                    Helps filter out other branches' subjects from shared schedules.
                  </small>
                </div>

                <div className="form-group">
                  <label>Semester</label>
                  <select 
                    className="form-select"
                    value={importSemester}
                    onChange={(e) => setImportSemester(e.target.value)}
                    required
                  >
                    {[1,2,3,4,5,6,7,8].map(sem => (
                      <option key={sem} value={sem.toString()}>Semester {sem}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Timetable Document (Image or PDF)</label>
                  <div style={{ position: 'relative', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'border-color 0.2s', background: importFile ? 'rgba(139, 92, 246, 0.05)' : 'transparent' }}>
                    <input 
                      type="file" 
                      accept="image/*,application/pdf"
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                      onChange={handleFileChange}
                      required
                    />
                    <Upload size={24} style={{ color: importFile ? 'var(--primary)' : 'var(--text-muted)' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {importFile ? importFile.name : 'Select schedule file'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      PDF, PNG, JPG, or JPEG up to 10MB
                    </span>
                  </div>
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.4rem', padding: '0.6rem' }}>
                  Analyze Timetable ✦
                </button>
              </form>
            )}
          </>
        )}
          </div>
        </div>
      )}

      {/* MODAL 4: AI TIMETABLE REVIEW SCREEN */}
      {showReviewScreen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '850px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={18} style={{ color: 'var(--primary)' }} />
                Review Extracted Timetable
              </h3>
            </div>

            {importError && <div className="alert-banner danger" style={{ marginBottom: '1rem' }}>{importError}</div>}

            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'var(--bg-app)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', borderLeft: '3px solid var(--primary)' }}>
              🎯 **AI detected these classes.** Review the details below. You can fix misspelled subjects, adjust times, remove rows, or add missing ones before saving.
            </div>

            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.2rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-app)' }}>
              {reviewClasses.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No classes detected. Click "Add class slot" to create them manually.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                      <th style={{ padding: '0.6rem 0.8rem', width: '120px' }}>Day</th>
                      <th style={{ padding: '0.6rem 0.8rem', width: '90px' }}>Start</th>
                      <th style={{ padding: '0.6rem 0.8rem', width: '90px' }}>End</th>
                      <th style={{ padding: '0.6rem 0.8rem' }}>Subject Name</th>
                      <th style={{ padding: '0.6rem 0.8rem', width: '100px' }}>Code</th>
                      <th style={{ padding: '0.6rem 0.8rem', width: '90px' }}>Type</th>
                      <th style={{ padding: '0.6rem 0.8rem', width: '100px' }}>Room</th>
                      <th style={{ padding: '0.6rem 0.8rem', width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewClasses.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '0.4rem' }}>
                          <select 
                            className="form-select" 
                            style={{ padding: '0.2rem 0.4rem', fontSize: '0.78rem' }}
                            value={item.day}
                            onChange={(e) => handleEditReviewClass(idx, 'day', e.target.value)}
                          >
                            {DAYS_OF_WEEK.map(d => (
                              <option key={d.label} value={d.label}>{d.label}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '0.4rem' }}>
                          <input 
                            type="time" 
                            className="form-input" 
                            style={{ padding: '0.2rem 0.4rem', fontSize: '0.78rem' }}
                            value={item.start_time}
                            onChange={(e) => handleEditReviewClass(idx, 'start_time', e.target.value)}
                          />
                        </td>
                        <td style={{ padding: '0.4rem' }}>
                          <input 
                            type="time" 
                            className="form-input" 
                            style={{ padding: '0.2rem 0.4rem', fontSize: '0.78rem' }}
                            value={item.end_time}
                            onChange={(e) => handleEditReviewClass(idx, 'end_time', e.target.value)}
                          />
                        </td>
                        <td style={{ padding: '0.4rem' }}>
                          <input 
                            type="text" 
                            className="form-input" 
                            style={{ padding: '0.2rem 0.4rem', fontSize: '0.78rem' }}
                            placeholder="e.g. Mathematics II"
                            value={item.subject_name || ''}
                            onChange={(e) => handleEditReviewClass(idx, 'subject_name', e.target.value)}
                          />
                        </td>
                        <td style={{ padding: '0.4rem' }}>
                          <input 
                            type="text" 
                            className="form-input" 
                            style={{ padding: '0.2rem 0.4rem', fontSize: '0.78rem' }}
                            placeholder="e.g. MATH102"
                            value={item.subject_code || ''}
                            onChange={(e) => handleEditReviewClass(idx, 'subject_code', e.target.value)}
                          />
                        </td>
                        <td style={{ padding: '0.4rem' }}>
                          <select 
                            className="form-select" 
                            style={{ padding: '0.2rem 0.4rem', fontSize: '0.78rem' }}
                            value={item.class_type || 'lecture'}
                            onChange={(e) => handleEditReviewClass(idx, 'class_type', e.target.value)}
                          >
                            <option value="lecture">Lecture</option>
                            <option value="lab">Lab</option>
                          </select>
                        </td>
                        <td style={{ padding: '0.4rem' }}>
                          <input 
                            type="text" 
                            className="form-input" 
                            style={{ padding: '0.2rem 0.4rem', fontSize: '0.78rem' }}
                            placeholder="e.g. LH-301"
                            value={item.room || ''}
                            onChange={(e) => handleEditReviewClass(idx, 'room', e.target.value)}
                          />
                        </td>
                        <td style={{ padding: '0.4rem', textAlign: 'center' }}>
                          <button 
                            type="button" 
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}
                            onClick={() => handleDeleteReviewClass(idx)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={handleAddReviewClassRow}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              >
                <Plus size={14} />
                Add class slot
              </button>
              
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowReviewScreen(false)}
                  disabled={importLoading}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn-primary" 
                  onClick={handleConfirmImport}
                  disabled={importLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {importLoading ? 'Saving...' : 'Confirm & Save Schedule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
