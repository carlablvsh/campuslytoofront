import React, { useEffect, useState } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { Plus, Trash2, Calendar, Clock, MapPin, X, BookOpen } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  code: string;
  color: string;
}

interface Exam {
  id: string;
  subject_id: string;
  title: string;
  date: string;
  start_time: string;
  location: string;
  syllabus: string;
  subject_name: string;
  subject_code: string;
  subject_color: string;
}

export const Exams: React.FC = () => {
  const { token } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal & Form State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [examDate, setExamDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [location, setLocation] = useState<string>('');
  const [syllabus, setSyllabus] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Local study preparation checklist states
  // Format: { [examId]: string[] (completed topic names) }
  const [studiedTopics, setStudiedTopics] = useState<Record<string, string[]>>({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const [exRes, subRes] = await Promise.all([
        fetch(`${API_BASE_URL}/academic/exams`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/academic/subjects`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!exRes.ok || !subRes.ok) {
        throw new Error('Failed to fetch exam schedule.');
      }

      const exData = await exRes.json();
      const subData = await subRes.json();

      setExams(exData);
      setSubjects(subData);

      if (subData.length > 0) {
        setSelectedSubjectId(subData[0].id);
      }

      // Load studied topics from local storage
      const savedTopics = localStorage.getItem('campusly_studied_topics');
      if (savedTopics) {
        setStudiedTopics(JSON.parse(savedTopics));
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error fetching exams.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  // Handle Exam deletion
  const handleDeleteExam = async (id: string) => {
    if (!window.confirm('Remove this exam from your timetable?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/academic/exams/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setExams(prev => prev.filter(e => e.id !== id));
        
        // Clean up stored studied topics
        setStudiedTopics(prev => {
          const next = { ...prev };
          delete next[id];
          localStorage.setItem('campusly_studied_topics', JSON.stringify(next));
          return next;
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit form
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title || !selectedSubjectId || !examDate || !startTime) {
      setFormError('Title, subject, date, and time are required.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/academic/exams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          subject_id: selectedSubjectId,
          date: examDate,
          start_time: startTime,
          location,
          syllabus
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create exam.');
      }

      setExams(prev => [...prev, data]);
      
      // Clear forms
      setTitle('');
      setExamDate('');
      setLocation('');
      setSyllabus('');
      setShowModal(false);
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  // Toggle syllabus topic checkbox
  const handleToggleTopic = (examId: string, topic: string) => {
    setStudiedTopics(prev => {
      const current = prev[examId] || [];
      const updated = current.includes(topic)
        ? current.filter(t => t !== topic)
        : [...current, topic];
      
      const next = { ...prev, [examId]: updated };
      localStorage.setItem('campusly_studied_topics', JSON.stringify(next));
      return next;
    });
  };

  // Helper: parse comma or newline separated syllabus string into array
  const parseSyllabus = (syllabusText: string): string[] => {
    if (!syllabusText.trim()) return [];
    return syllabusText
      .split(/,|\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  };

  // Helper: calculate countdown days
  const getDaysLeft = (examDateStr: string) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const examDate = new Date(examDateStr);
    examDate.setHours(0,0,0,0);

    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Passed';
    if (diffDays === 0) return 'Today!';
    if (diffDays === 1) return 'Tomorrow';
    return `${diffDays} days left`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ color: 'var(--text-secondary)' }}>Loading exam timetable...</div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Add Exam
        </button>
      </div>

      {error && (
        <div className="alert-banner danger">
          <span>{error}</span>
        </div>
      )}

      {exams.length === 0 ? (
        <div className="section-card" style={{ textAlign: 'center', padding: '4rem 1.5rem', color: 'var(--text-secondary)' }}>
          <Calendar size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Exams Scheduled</h3>
          <p style={{ fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>
            Looking good! No exams have been added to your schedule yet. Click the "Add Exam" button to log one.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {exams.map(exam => {
            const syllabusItems = parseSyllabus(exam.syllabus);
            const completed = studiedTopics[exam.id] || [];
            
            // Clean up completed topics that might no longer exist if syllabus changed
            const activeCompleted = completed.filter(t => syllabusItems.includes(t));
            const progressPct = syllabusItems.length > 0 
              ? Math.round((activeCompleted.length / syllabusItems.length) * 100)
              : 0;

            const daysLeftText = getDaysLeft(exam.date);
            const isPassed = daysLeftText === 'Passed';
            const isSoon = !isPassed && (daysLeftText === 'Today!' || daysLeftText === 'Tomorrow' || parseInt(daysLeftText) <= 3);

            return (
              <div 
                key={exam.id} 
                className="section-card"
                style={{ 
                  borderLeft: `4px solid ${exam.subject_color}`,
                  background: isPassed ? 'rgba(0,0,0,0.1)' : 'var(--bg-surface)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  
                  {/* Subject and exam title */}
                  <div>
                    <span className="badge" style={{ background: exam.subject_color, color: '#1a0b14', marginRight: '0.5rem' }}>{exam.subject_code}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{exam.subject_name}</span>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.4rem', textDecoration: isPassed ? 'line-through' : 'none' }}>
                      {exam.title}
                    </h3>
                  </div>

                  {/* Countdown Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <span 
                      className="badge" 
                      style={{ 
                        padding: '0.4rem 0.8rem', 
                        fontSize: '0.85rem',
                        background: isPassed 
                          ? 'var(--text-muted)' 
                          : isSoon 
                            ? 'var(--danger-glow)' 
                            : 'var(--primary-glow)',
                        color: isPassed 
                          ? 'white' 
                          : isSoon 
                            ? 'var(--danger)' 
                            : 'var(--primary)',
                        border: `1px solid ${isPassed ? 'var(--text-muted)' : isSoon ? 'var(--danger)' : 'var(--primary)'}`
                      }}
                    >
                      {daysLeftText}
                    </span>

                    <button 
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', hover: { color: 'var(--danger)' } } as any}
                      onClick={() => handleDeleteExam(exam.id)}
                      title="Delete exam"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                </div>

                {/* Date / Time / Location metadata */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar size={14} />
                    <span>{exam.date}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Clock size={14} />
                    <span>{exam.start_time}</span>
                  </div>
                  {exam.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MapPin size={14} />
                      <span>{exam.location}</span>
                    </div>
                  )}
                </div>

                {/* Preparation Section (Syllabus checklist) */}
                {syllabusItems.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <BookOpen size={14} />
                        Syllabus Preparation Checklist:
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {activeCompleted.length} of {syllabusItems.length} topics studied (<strong>{progressPct}%</strong> Ready)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          width: `${progressPct}%`, 
                          height: '100%', 
                          background: progressPct === 100 ? 'var(--success)' : 'var(--primary)',
                          transition: 'width 0.3s ease' 
                        }} 
                      />
                    </div>

                    {/* Checkbox checklist */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.6rem', marginTop: '0.4rem' }}>
                      {syllabusItems.map((topic, i) => {
                        const checked = activeCompleted.includes(topic);
                        return (
                          <div 
                            key={i} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.5rem', 
                              fontSize: '0.8rem', 
                              color: checked ? 'var(--text-muted)' : 'var(--text-primary)',
                              cursor: 'pointer' 
                            }}
                            onClick={() => handleToggleTopic(exam.id, topic)}
                          >
                            <div 
                              style={{ 
                                width: '16px', 
                                height: '16px', 
                                border: '1px solid var(--border-color)', 
                                borderRadius: '3px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: checked ? 'var(--success)' : 'var(--bg-input)',
                                borderColor: checked ? 'var(--success)' : 'var(--border-color)'
                              }}
                            >
                              {checked && <X size={10} style={{ color: 'white', transform: 'rotate(45deg)' }} />}
                            </div>
                            <span style={{ textDecoration: checked ? 'line-through' : 'none' }}>{topic}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* CREATE EXAM MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Exam to Schedule</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            {formError && <div className="alert-banner danger">{formError}</div>}

            <form onSubmit={handleCreateExam} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div className="form-group">
                <label>Exam Title / Exam Component</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Midterm 1, Final Paper"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Subject / Course</label>
                {subjects.length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--warning)', marginTop: '0.2rem' }}>
                    No subjects found. Create a subject on the **Timetable** page first.
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
                  <label>Exam Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    required
                  />
                </div>
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
              </div>

              <div className="form-group">
                <label>Location / Room</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Science Auditorium, Hall A"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Syllabus Topics (Comma or Line Separated)</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  placeholder="e.g. Limits, Derivatives, Integration by Parts, Matrix Math"
                  value={syllabus}
                  onChange={(e) => setSyllabus(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
                Schedule Exam
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
