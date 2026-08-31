import React, { useEffect, useState } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { Trash2, Check, Sparkles } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  code: string;
  color: string;
}

interface Assignment {
  id: string;
  subject_id: string;
  title: string;
  description: string;
  due_date: string;
  status: string; // 'pending' or 'completed'
  subject_name: string;
  subject_code: string;
  subject_color: string;
  priority?: string;
}

export const Tasks: React.FC = () => {
  const { token } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Filter Tab: 'open' | 'done' | 'all'
  const [filterTab, setFilterTab] = useState<'open' | 'done' | 'all'>('open');

  // Inline Add Task Form State
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [assRes, subRes] = await Promise.all([
        fetch(`${API_BASE_URL}/academic/assignments`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/academic/subjects`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!assRes.ok || !subRes.ok) {
        throw new Error('Failed to load tasks data.');
      }

      const assData = await assRes.json();
      const subData = await subRes.json();

      setAssignments(assData);
      setSubjects(subData);
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

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    try {
      const res = await fetch(`${API_BASE_URL}/academic/assignments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });

      if (res.ok) {
        const updated = await res.json();
        setAssignments(prev => prev.map(item => item.id === id ? updated : item));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAssignment = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this task?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/academic/assignments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAssignments(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Please enter a task title.');
      return;
    }
    if (!selectedSubjectId) {
      setFormError('Please select a subject.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/academic/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject_id: selectedSubjectId,
          title: title.trim(),
          description: description.trim(),
          due_date: dueDate || null,
          status: 'pending'
        })
      });

      if (res.ok) {
        setTitle('');
        setDescription('');
        setDueDate('');
        fetchData();
      } else {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save task.');
      }
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openTasks = assignments.filter(t => t.status === 'pending');
  const doneTasks = assignments.filter(t => t.status === 'completed');

  const filteredTasks = filterTab === 'open' 
    ? openTasks 
    : filterTab === 'done' 
      ? doneTasks 
      : assignments;

  const openCount = openTasks.length;
  const doneCount = doneTasks.length;
  const totalCount = assignments.length;
  const clearedPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="animate-page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1200px', margin: '0 auto', paddingBottom: '3.5rem' }}>
      
      {/* 1. HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', paddingTop: '0.5rem' }}>
        <div>
          {/* Eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
            <span style={{ width: '16px', height: '1px', background: 'var(--ink-faint)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 650, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
              COURSEWORK
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
            Everything owed, on <br />
            <span style={{ fontStyle: 'italic', color: '#e11d48', fontWeight: 300 }}>soft paper</span>.
          </h1>

          <p style={{
            fontSize: '0.92rem',
            color: 'var(--ink-soft)',
            marginTop: '0.6rem',
            maxWidth: '620px',
            margin: '0.6rem 0 0 0'
          }}>
            Tick a card and it folds away. Nothing shouts here.
          </p>
        </div>

        {/* Right Status Pill */}
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
          <span>{openCount} OPEN · {doneCount} FILED</span>
        </div>
      </div>

      {/* 2. FILTER TABS */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button
          onClick={() => setFilterTab('open')}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            padding: '0.4rem 1.1rem',
            borderRadius: '9999px',
            border: 'none',
            background: filterTab === 'open' ? '#2d1527' : 'transparent',
            color: filterTab === 'open' ? '#ffffff' : 'var(--ink-soft)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          OPEN
        </button>
        <button
          onClick={() => setFilterTab('done')}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            padding: '0.4rem 1.1rem',
            borderRadius: '9999px',
            border: 'none',
            background: filterTab === 'done' ? '#2d1527' : 'transparent',
            color: filterTab === 'done' ? '#ffffff' : 'var(--ink-soft)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          DONE
        </button>
        <button
          onClick={() => setFilterTab('all')}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            padding: '0.4rem 1.1rem',
            borderRadius: '9999px',
            border: 'none',
            background: filterTab === 'all' ? '#2d1527' : 'transparent',
            color: filterTab === 'all' ? '#ffffff' : 'var(--ink-soft)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          ALL
        </button>
      </div>

      {/* 3. MAIN 2-COLUMN LAYOUT: TASK STRIP CARDS (LEFT) + ADD TASK & METRICS (RIGHT) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.45fr 0.85fr',
        gap: '2.5rem',
        alignItems: 'flex-start'
      }}>
        
        {/* Left Column: Task Strip Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filteredTasks.length === 0 ? (
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--line)',
              borderRadius: '6px',
              padding: '3rem 2rem',
              textAlign: 'center',
              color: 'var(--ink-soft)'
            }}>
              <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.15rem', margin: 0 }}>
                {filterTab === 'open' ? 'All tasks resolved and tucked away.' : 'No tasks in this view.'}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--ink-faint)', marginTop: '0.4rem' }}>
                Use the form on the right to pin a new coursework deliverable.
              </p>
            </div>
          ) : (
            filteredTasks.map((task, idx) => {
              const isChecked = task.status === 'completed';
              const dotColor = idx % 2 === 0 ? '#f472b6' : '#99f6e4';
              const isHighPriority = task.priority === 'High';

              return (
                <div
                  key={task.id}
                  onClick={() => handleToggleStatus(task.id, task.status)}
                  className="hover-lift-card"
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--line)',
                    borderRadius: '6px',
                    padding: '1.1rem 1.4rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(45, 21, 39, 0.03)',
                    opacity: isChecked ? 0.5 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                    {/* Circle checkbox */}
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: isChecked ? 'none' : '1.5px solid var(--line)',
                      background: isChecked ? '#e11d48' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      flexShrink: 0,
                      transition: 'all 0.2s ease'
                    }}>
                      {isChecked && <Check size={12} strokeWidth={3} />}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.92rem',
                        fontWeight: 600,
                        color: 'var(--ink)',
                        textDecoration: isChecked ? 'line-through' : 'none',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {task.title}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.2rem', fontSize: '0.72rem', color: 'var(--ink-faint)' }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: dotColor }} />
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{task.subject_code || task.subject_name || 'COURSE'}</span>
                        {task.due_date && (
                          <>
                            <span>·</span>
                            <span>due {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: '2-digit' })}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexShrink: 0 }}>
                    {isHighPriority && !isChecked && (
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: '#e11d48',
                        border: '1px solid rgba(225, 29, 72, 0.25)',
                        borderRadius: '9999px',
                        padding: '0.2rem 0.6rem',
                        background: 'rgba(225, 29, 72, 0.04)'
                      }}>
                        PRIORITY
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleDeleteAssignment(task.id, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--ink-faint)',
                        cursor: 'pointer',
                        padding: '0.2rem',
                        opacity: 0.6
                      }}
                      title="Delete task"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Sidebar Widgets (Add a Task & This Week) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
          
          {/* WIDGET 1: ADD A TASK */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--line)',
            borderRadius: '6px',
            padding: '1.6rem',
            boxShadow: '0 1px 3px rgba(45, 21, 39, 0.04)'
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
              ADD A TASK
            </span>

            {formError && (
              <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginTop: '1rem' }}>
              <input
                type="text"
                placeholder="Task title..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '4px',
                  border: '1px solid var(--line)',
                  background: 'rgba(250, 246, 240, 0.3)',
                  fontSize: '0.82rem',
                  color: 'var(--ink)',
                  outline: 'none'
                }}
                required
              />

              {subjects.length > 0 ? (
                <select
                  value={selectedSubjectId}
                  onChange={e => setSelectedSubjectId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '4px',
                    border: '1px solid var(--line)',
                    background: 'rgba(250, 246, 240, 0.3)',
                    fontSize: '0.82rem',
                    color: 'var(--ink)',
                    outline: 'none'
                  }}
                  required
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ fontSize: '0.74rem', color: 'var(--ink-faint)', fontStyle: 'italic' }}>
                  Please add a module in Timetable first.
                </div>
              )}

              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.8rem',
                  borderRadius: '4px',
                  border: '1px solid var(--line)',
                  background: 'rgba(250, 246, 240, 0.3)',
                  fontSize: '0.78rem',
                  color: 'var(--ink)',
                  outline: 'none'
                }}
              />

              <button
                type="submit"
                disabled={isSubmitting || subjects.length === 0}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  background: '#2d1527',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  cursor: subjects.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  marginTop: '0.3rem',
                  opacity: subjects.length === 0 ? 0.6 : 1
                }}
              >
                <Sparkles size={13} style={{ color: '#f472b6' }} />
                <span>{isSubmitting ? 'PINNING...' : 'PIN IT'}</span>
              </button>
            </form>
          </div>

          {/* WIDGET 2: THIS WEEK SUMMARY */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--line)',
            borderRadius: '6px',
            padding: '1.4rem 1.6rem',
            boxShadow: '0 1px 3px rgba(45, 21, 39, 0.04)'
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
              DELIVERABLES STATS
            </span>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '1rem',
              marginTop: '1rem',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 400, color: 'var(--ink)', lineHeight: 1 }}>
                  {openCount}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--ink-faint)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '0.25rem' }}>
                  OPEN
                </div>
              </div>

              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 400, color: '#e11d48', lineHeight: 1 }}>
                  {doneCount}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--ink-faint)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '0.25rem' }}>
                  FILED
                </div>
              </div>

              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 400, color: '#0d9488', lineHeight: 1 }}>
                  {clearedPct}%
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--ink-faint)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '0.25rem' }}>
                  CLEARED
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
