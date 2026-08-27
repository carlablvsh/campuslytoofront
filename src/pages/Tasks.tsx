import React, { useEffect, useState } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { Plus, Trash2, CheckSquare, Calendar, X } from 'lucide-react';

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

  // Update status (pending/completed)
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

  // Delete assignment
  const handleDeleteAssignment = async (id: string) => {
    if (!window.confirm('Delete this assignment permanently?')) return;
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

  // Submit form
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim() || !selectedSubjectId || !dueDate) {
      setFormError('Title, subject, and due date are required.');
      return;
    }

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
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
      
      // Clear inputs
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

  // Helper: check if a date is in the past
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ color: 'var(--text-secondary)' }}>Loading assignments...</div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Create Task
        </button>
      </div>

      {error && (
        <div className="alert-banner danger">
          <span>{error}</span>
        </div>
      )}

      {/* Kanban Board columns */}
      <div className="tasks-grid">
        
        {/* Pending Column */}
        <div className="tasks-column">
          <div className="tasks-column-header">
            <span style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Pending Action
            </span>
            <span className="tasks-counter">{pendingTasks.length}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {pendingTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                All clear! No pending tasks.
              </div>
            ) : (
              pendingTasks.map(item => {
                const overdue = isOverdue(item.due_date, item.status);
                return (
                  <div 
                    key={item.id} 
                    className="deadline-item"
                    style={{ 
                      borderColor: overdue ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-color)',
                      background: overdue ? 'rgba(239, 68, 68, 0.02)' : 'rgba(255, 255, 255, 0.01)'
                    }}
                  >
                    <div 
                      className="deadline-checkbox" 
                      onClick={() => handleToggleStatus(item.id, item.status)}
                    />
                    
                    <div className="deadline-info">
                      <span className="title" style={{ color: overdue ? '#fca5a5' : 'inherit' }}>{item.title}</span>
                      {item.description && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem', lineHeight: 1.4 }}>
                          {item.description}
                        </p>
                      )}
                      <div className="deadline-meta">
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.subject_color, display: 'inline-block' }} />{item.subject_name}</span>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: overdue ? 'var(--danger)' : 'var(--text-muted)' }}>
                          <Calendar size={12} />
                          {item.due_date} {overdue && '(Overdue)'}
                        </span>
                      </div>
                    </div>

                    <button 
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
                      onClick={() => handleDeleteAssignment(item.id)}
                      title="Delete assignment"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Completed Column */}
        <div className="tasks-column" style={{ background: 'rgba(255, 94, 132, 0.015)' }}>
          <div className="tasks-column-header">
            <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Completed
            </span>
            <span className="tasks-counter">{completedTasks.length}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {completedTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Complete a task to move it here.
              </div>
            ) : (
              completedTasks.map(item => (
                <div key={item.id} className="deadline-item">
                  <div 
                    className="deadline-checkbox checked" 
                    onClick={() => handleToggleStatus(item.id, item.status)}
                  >
                    <CheckSquare size={14} style={{ color: 'white' }} />
                  </div>
                  
                  <div className="deadline-info checked">
                    <span className="title">{item.title}</span>
                    <div className="deadline-meta">
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.subject_color, display: 'inline-block' }} />{item.subject_name}</span>
                      <span>•</span>
                      <span>Completed</span>
                    </div>
                  </div>

                  <button 
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
                    onClick={() => handleDeleteAssignment(item.id)}
                    title="Delete assignment"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* CREATE TASK MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Academic Task</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            {formError && <div className="alert-banner danger">{formError}</div>}

            <form onSubmit={handleCreateAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div className="form-group">
                <label>Task Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Lab Report 3"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  placeholder="e.g. Work on sections 2 and 4, attach charts."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Subject Course</label>
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

              <div className="form-group">
                <label>Due Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                disabled={isSubmitting}
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', opacity: isSubmitting ? 0.7 : 1 }}
              >
                {isSubmitting ? 'Saving Assignment...' : 'Create Assignment'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
