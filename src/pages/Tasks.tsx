import React, { useEffect, useState } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { Plus, Trash2, Check, X } from 'lucide-react';

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
  status: string;
  subject_name: string;
  subject_code: string;
  subject_color: string;
}

export const Tasks: React.FC = () => {
  const { token } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form & modal state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assRes, subRes] = await Promise.all([
        fetch(`${API_BASE_URL}/academic/assignments`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/academic/subjects`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!assRes.ok || !subRes.ok) {
        throw new Error('Failed to load assignments.');
      }

      const assData = await assRes.json();
      const subData = await subRes.json();

      setAssignments(assData);
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

  const handleDeleteAssignment = async (id: string) => {
    if (!window.confirm('Delete this deliverable permanently?')) return;
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

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedSubjectId) {
      setFormError('Please provide a title and select a subject.');
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
          title: title.trim(),
          description: description.trim(),
          subject_id: selectedSubjectId,
          due_date: dueDate
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create task.');
      }

      setAssignments(prev => {
        if (prev.some(item => item.id === data.id)) return prev;
        return [...prev, data];
      });
      
      setTitle('');
      setDescription('');
      setDueDate('');
      setShowModal(false);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOverdue = (dateStr: string, status: string) => {
    if (status !== 'pending') return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    const due = new Date(dateStr);
    due.setHours(0,0,0,0);
    return due.getTime() < today.getTime();
  };

  const pendingTasks = assignments.filter(a => a.status === 'pending');
  const completedTasks = assignments.filter(a => a.status === 'completed');

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--ink-soft)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.25rem' }}>
          Opening deliverables thread... ✧
        </div>
      </div>
    );
  }

  return (
    <div className="animate-page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem', maxWidth: '1240px', margin: '0 auto', paddingBottom: '4rem' }}>
      
      {/* 1. OPEN CANVAS EDITORIAL HEADER */}
      <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '2.5rem' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <span className="sci-fi-tag">TASK TIMELINE</span>
          
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
            <span>New Deliverable</span>
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
          Assignments resolved into <br />
          <span style={{ fontStyle: 'italic', color: 'var(--petal)', fontWeight: 300 }}>a clear, quiet thread</span>.
        </h1>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '2.5rem', marginTop: '2rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Pending Tasks
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 400, color: 'var(--ink)', marginTop: '0.2rem' }}>
              {pendingTasks.length} <span style={{ fontSize: '1rem', color: 'var(--ink-faint)' }}>active</span>
            </div>
          </div>
          <div style={{ width: '1px', height: '40px', background: 'var(--line)' }} />
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Resolved
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 400, color: 'var(--success-text)', marginTop: '0.2rem' }}>
              {completedTasks.length} <span style={{ fontSize: '1rem', color: 'var(--ink-faint)' }}>completed</span>
            </div>
          </div>
        </div>

      </div>

      {error && (
        <div style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* 2. OPEN THREAD OF DELIVERABLES */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '4rem' }}>
        
        {/* Pending Deliverables Stream */}
        <div>
          <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--line)', marginBottom: '0.5rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-faint)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Pending Action ({pendingTasks.length})
            </span>
          </div>

          {pendingTasks.length === 0 ? (
            <div style={{ padding: '3.5rem 0', color: 'var(--ink-faint)', fontStyle: 'italic', fontSize: '0.95rem' }}>
              All deliverables resolved! The thread is clear.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {pendingTasks.map(item => {
                const overdue = isOverdue(item.due_date, item.status);
                return (
                  <div 
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      padding: '1.4rem 0',
                      borderBottom: '1px solid var(--line)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.2rem' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item.id, item.status)}
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          border: '1.5px solid var(--line)',
                          background: 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          marginTop: '3px',
                          flexShrink: 0
                        }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: item.subject_color || 'var(--petal)' }}>
                            {item.subject_code}
                          </span>
                          <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--ink)' }}>
                            {item.title}
                          </span>
                        </div>
                        {item.description && (
                          <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', margin: '0.3rem 0 0 0', lineHeight: 1.5 }}>
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: overdue ? 'var(--danger)' : 'var(--ink-soft)', fontWeight: overdue ? 700 : 500 }}>
                        {item.due_date ? new Date(item.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No due date'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteAssignment(item.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--ink-faint)', cursor: 'pointer' }}
                        title="Delete task"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Resolved Archive Stream */}
        <div style={{ borderLeft: '1px solid var(--line)', paddingLeft: '3rem' }}>
          <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--line)', marginBottom: '0.5rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-faint)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Resolved Archive ({completedTasks.length})
            </span>
          </div>

          {completedTasks.length === 0 ? (
            <div style={{ padding: '3.5rem 0', color: 'var(--ink-faint)', fontStyle: 'italic', fontSize: '0.88rem' }}>
              No completed items yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {completedTasks.map(item => (
                <div 
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 0',
                    borderBottom: '1px solid var(--line)',
                    opacity: 0.5
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '4px',
                      background: 'var(--petal)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Check size={12} />
                    </div>
                    <span style={{ fontSize: '0.92rem', color: 'var(--ink)', textDecoration: 'line-through' }}>
                      {item.title}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteAssignment(item.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--ink-faint)', cursor: 'pointer' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(45, 21, 39, 0.4)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowModal(false)}>
          <div style={{ background: 'var(--pearl)', border: '1px solid var(--line)', borderRadius: '12px', padding: '2.5rem', width: '100%', maxWidth: '480px', boxShadow: 'var(--shadow-lift)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 500, margin: 0 }}>New Deliverable</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)' }}><X size={18} /></button>
            </div>

            {formError && <div style={{ padding: '0.6rem', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '1rem' }}>{formError}</div>}

            <form onSubmit={handleCreateAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.3rem' }}>COURSE SUBJECT</label>
                <select value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)} style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--line)', borderRadius: '6px', background: '#ffffff', outline: 'none' }} required>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.3rem' }}>TITLE</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Problem Set 3" style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--line)', borderRadius: '6px', background: '#ffffff', outline: 'none' }} required />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.3rem' }}>DUE DATE</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--line)', borderRadius: '6px', background: '#ffffff', outline: 'none' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.3rem' }}>NOTES / DESCRIPTION</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Add any details..." style={{ width: '100%', padding: '0.65rem', border: '1px solid var(--line)', borderRadius: '6px', background: '#ffffff', outline: 'none', resize: 'vertical' }} />
              </div>

              <button type="submit" disabled={isSubmitting} style={{ padding: '0.8rem', background: 'var(--plum)', color: 'var(--cream)', border: 'none', borderRadius: '9999px', fontWeight: 700, cursor: 'pointer', marginTop: '0.5rem' }}>
                {isSubmitting ? 'Creating...' : 'Create Deliverable'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
