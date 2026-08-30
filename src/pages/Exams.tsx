import React, { useEffect, useState } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { Plus, X, Check } from 'lucide-react';

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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [studiedTopics, setStudiedTopics] = useState<Record<string, string[]>>({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const [exRes, subRes] = await Promise.all([
        fetch(`${API_BASE_URL}/academic/exams`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/academic/subjects`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!exRes.ok || !subRes.ok) {
        throw new Error('Failed to load exams and courses.');
      }

      const exData = await exRes.json();
      const subData = await subRes.json();

      setExams(exData);
      setSubjects(subData);
      if (subData.length > 0) {
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
      const savedTopics = localStorage.getItem('campusly_studied_topics');
      if (savedTopics) {
        try {
          setStudiedTopics(JSON.parse(savedTopics));
        } catch (e) {}
      }
    }
  }, [token]);

  const handleDeleteExam = async (id: string) => {
    if (!window.confirm('Delete this scheduled exam permanently?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/academic/exams/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setExams(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedSubjectId || !examDate) {
      setFormError('Please enter a title, select a subject, and specify an exam date.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/academic/exams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          subject_id: selectedSubjectId,
          date: examDate,
          start_time: startTime,
          location: location.trim(),
          syllabus: syllabus.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create exam.');
      }

      setExams(prev => {
        if (prev.some(item => item.id === data.id)) return prev;
        return [...prev, data];
      });
      
      setTitle('');
      setExamDate('');
      setLocation('');
      setSyllabus('');
      setShowModal(false);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const parseSyllabus = (syllabusText: string): string[] => {
    if (!syllabusText.trim()) return [];
    return syllabusText
      .split(/,|\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  };

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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--ink-soft)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.25rem' }}>
          Loading evaluation schedule... ✧
        </div>
      </div>
    );
  }

  return (
    <div className="animate-page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem', maxWidth: '1240px', margin: '0 auto', paddingBottom: '4rem' }}>
      
      {/* 1. OPEN CANVAS EDITORIAL HEADER */}
      <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '2.5rem' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <span className="sci-fi-tag">EVALUATION PROTOCOLS</span>
          
          <button 
            type="button"
            onClick={() => setShowModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 1.3rem',
              borderRadius: '9999px',
              border: 'none',
              background: 'var(--plum)',
              color: 'var(--cream)',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Plus size={14} style={{ color: 'var(--petal)' }} />
            <span>Schedule Exam</span>
          </button>
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
          Exams & Evaluations, <br />
          <span style={{ fontStyle: 'italic', color: 'var(--petal)', fontWeight: 300 }}>arranged ahead</span>.
        </h1>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '2.5rem', marginTop: '2rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Scheduled Exams
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 400, color: 'var(--ink)', marginTop: '0.2rem' }}>
              {exams.length} <span style={{ fontSize: '1rem', color: 'var(--ink-faint)' }}>this term</span>
            </div>
          </div>
        </div>

      </div>

      {error && (
        <div style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* 2. OPEN EXAMS LEDGER */}
      {exams.length === 0 ? (
        <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--ink-faint)', fontStyle: 'italic', fontSize: '1rem' }}>
          No exams scheduled for this term yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {exams.map(exam => {
            const syllabusItems = parseSyllabus(exam.syllabus);
            const completed = studiedTopics[exam.id] || [];
            const activeCompleted = completed.filter(t => syllabusItems.includes(t));
            const progressPct = syllabusItems.length > 0 ? Math.round((activeCompleted.length / syllabusItems.length) * 100) : 0;
            const daysLeftText = getDaysLeft(exam.date);

            return (
              <div 
                key={exam.id}
                style={{
                  borderBottom: '1px solid var(--line)',
                  padding: '2rem 0',
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 0.8fr',
                  gap: '3rem',
                  alignItems: 'flex-start'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700, color: exam.subject_color || 'var(--petal)' }}>
                      {exam.subject_code}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--petal)', fontWeight: 700 }}>
                      {daysLeftText}
                    </span>
                  </div>

                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 500, color: 'var(--ink)', margin: '0.4rem 0 0.8rem 0' }}>
                    {exam.title}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.84rem', color: 'var(--ink-soft)' }}>
                    <span>{new Date(exam.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                    {exam.start_time && <span>· {exam.start_time}</span>}
                    {exam.location && <span>· {exam.location}</span>}
                  </div>
                </div>

                {/* Syllabus Topic Checkpoints */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--ink-faint)', textTransform: 'uppercase' }}>
                      Syllabus Readiness
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink)' }}>
                      {progressPct}% ({activeCompleted.length}/{syllabusItems.length})
                    </span>
                  </div>

                  {syllabusItems.length === 0 ? (
                    <span style={{ fontSize: '0.8rem', color: 'var(--ink-faint)', fontStyle: 'italic' }}>No syllabus topics provided</span>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {syllabusItems.map((topic, tIdx) => {
                        const isDone = activeCompleted.includes(topic);
                        return (
                          <div 
                            key={tIdx}
                            onClick={() => handleToggleTopic(exam.id, topic)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.6rem',
                              fontSize: '0.82rem',
                              color: isDone ? 'var(--ink-faint)' : 'var(--ink)',
                              textDecoration: isDone ? 'line-through' : 'none',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ width: '14px', height: '14px', borderRadius: '3px', border: '1px solid var(--line)', background: isDone ? 'var(--petal)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', flexShrink: 0 }}>
                              {isDone && <Check size={10} />}
                            </div>
                            <span>{topic}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button
                      type="button"
                      onClick={() => handleDeleteExam(exam.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--ink-faint)', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                      Delete Evaluation
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE EXAM MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(45, 21, 39, 0.4)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowModal(false)}>
          <div style={{ background: 'var(--pearl)', border: '1px solid var(--line)', borderRadius: '12px', padding: '2.5rem', width: '100%', maxWidth: '480px', boxShadow: 'var(--shadow-lift)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 500, margin: 0 }}>Schedule Examination</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)' }}><X size={18} /></button>
            </div>

            {formError && <div style={{ padding: '0.6rem', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '1rem' }}>{formError}</div>}

            <form onSubmit={handleCreateExam} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.3rem' }}>COURSE SUBJECT</label>
                <select value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)} style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--line)', borderRadius: '6px', background: '#ffffff', outline: 'none' }} required>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.3rem' }}>TITLE / DESCRIPTION</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Midterm Examination" style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--line)', borderRadius: '6px', background: '#ffffff', outline: 'none' }} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.3rem' }}>DATE</label>
                  <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--line)', borderRadius: '6px', background: '#ffffff', outline: 'none' }} required />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.3rem' }}>START TIME</label>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--line)', borderRadius: '6px', background: '#ffffff', outline: 'none' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.3rem' }}>LOCATION / VENUE</label>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Main Auditorium, Dome 1" style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--line)', borderRadius: '6px', background: '#ffffff', outline: 'none' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.3rem' }}>SYLLABUS TOPICS (Separated by comma or newline)</label>
                <textarea value={syllabus} onChange={e => setSyllabus(e.target.value)} rows={3} placeholder="Topic 1, Topic 2, Topic 3" style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--line)', borderRadius: '6px', background: '#ffffff', outline: 'none', resize: 'vertical' }} />
              </div>

              <button type="submit" disabled={isSubmitting} style={{ padding: '0.8rem', background: 'var(--plum)', color: 'var(--cream)', border: 'none', borderRadius: '9999px', fontWeight: 700, cursor: 'pointer', marginTop: '0.5rem' }}>
                {isSubmitting ? 'Saving...' : 'Save Examination'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
