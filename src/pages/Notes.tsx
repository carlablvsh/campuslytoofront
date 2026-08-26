import React, { useEffect, useState } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { FileText, Plus, Upload, Trash2, X } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  code: string;
  color: string;
}

interface Note {
  id: string;
  subject_id: string;
  title: string;
  file_name: string;
  created_at: string;
  subject_name: string;
  subject_code: string;
  subject_color: string;
  text_length: number;
}

export const Notes: React.FC = () => {
  const { token } = useAuth();
  
  // Data States
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Note Modal forms
  const [showTextModal, setShowTextModal] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [viewedNote, setViewedNote] = useState<any | null>(null);
  
  // Note Form Fields
  const [noteTitle, setNoteTitle] = useState<string>('');
  const [noteContent, setNoteContent] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [notesRes, subRes] = await Promise.all([
        fetch(`${API_BASE_URL}/notes`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/academic/subjects`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!notesRes.ok || !subRes.ok) {
        throw new Error('Failed to load notes library.');
      }

      const notesData = await notesRes.json();
      const subData = await subRes.json();

      setNotes(notesData);
      setSubjects(subData);

      if (subData.length > 0) {
        setSelectedSubjectId(subData[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error loading materials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  useEffect(() => {
    const handleOpenNoteEvent = (e: Event) => {
      const customEv = e as CustomEvent<string>;
      if (customEv.detail) {
        handleViewNote(customEv.detail);
      }
    };
    window.addEventListener('switchAndOpenNote', handleOpenNoteEvent);
    return () => window.removeEventListener('switchAndOpenNote', handleOpenNoteEvent);
  }, [token]);

  // Handle Note Deletion
  const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid opening the viewer
    if (!window.confirm('Delete this study material permanently?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/notes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setNotes(prev => prev.filter(n => n.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle viewing a note
  const handleViewNote = async (noteId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setViewedNote(data);
        setShowViewModal(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit manual note
  const handleCreateTextNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setActionLoading(true);

    if (!noteTitle || !noteContent || !selectedSubjectId) {
      setFormError('Title, subject, and content are required.');
      setActionLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: noteTitle,
          content: noteContent,
          subject_id: selectedSubjectId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save text note.');
      }

      setNotes(prev => [data, ...prev]);
      
      // Reset
      setNoteTitle('');
      setNoteContent('');
      setShowTextModal(false);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit file upload note
  const handleUploadFileNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setActionLoading(true);

    if (!noteTitle || !selectedSubjectId || !selectedFile) {
      setFormError('Title, subject, and file are required.');
      setActionLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', noteTitle);
      formData.append('subject_id', selectedSubjectId);
      formData.append('file', selectedFile);

      const res = await fetch(`${API_BASE_URL}/notes/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload document.');
      }

      setNotes(prev => [data, ...prev]);

      // Reset
      setNoteTitle('');
      setSelectedFile(null);
      setShowUploadModal(false);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading documents library...</div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      
      {/* Header section with buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.8rem' }}>
        <button className="btn-secondary" onClick={() => setShowTextModal(true)}>
          <Plus size={16} />
          Write Note
        </button>
        <button className="btn-primary" onClick={() => setShowUploadModal(true)}>
          <Upload size={16} />
          Upload File
        </button>
      </div>

      {error && (
        <div className="alert-banner danger">
          <span>{error}</span>
        </div>
      )}

      {/* Main vault panel */}
      <div className="notes-container">
        
        <div className="notes-list-section">
          {notes.length === 0 ? (
            <div className="section-card" style={{ textAlign: 'center', padding: '4rem 1.5rem', color: 'var(--text-secondary)' }}>
              <FileText size={48} style={{ opacity: 0.3, marginBottom: '1rem', margin: '0 auto' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Notes Found</h3>
              <p style={{ fontSize: '0.9rem', maxWidth: '380px', margin: '0 auto' }}>
                Your academic vault is empty. Upload textbooks PDFs or write study guides using the action buttons above.
              </p>
            </div>
          ) : (
            <div className="notes-grid">
              {notes.map(note => (
                <div key={note.id} className="note-item-card" onClick={() => handleViewNote(note.id)}>
                  
                  <button 
                    className="note-delete" 
                    title="Delete Note"
                    onClick={(e) => handleDeleteNote(note.id, e)}
                  >
                    <Trash2 size={14} />
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ background: 'rgba(255, 94, 132, 0.08)', color: 'var(--primary)', padding: '0.4rem', borderRadius: '8px' }}>
                      <FileText size={18} />
                    </div>
                    <span className="badge" style={{ background: note.subject_color, color: '#1a0b14' }}>{note.subject_code}</span>
                  </div>

                  <h4 className="note-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.3rem', color: 'var(--text-primary)' }}>{note.title}</h4>
                  
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                    File: {note.file_name.substring(note.file_name.indexOf('-') + 1)}
                  </span>

                  <div className="note-meta-row">
                    <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
                      View content
                    </span>
                    <span>{new Date(note.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* MODAL 1: WRITE MANUAL TEXT NOTE */}
      {showTextModal && (
        <div className="modal-overlay" onClick={() => setShowTextModal(false)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Write Study Note</h3>
              <button className="modal-close" onClick={() => setShowTextModal(false)}>
                <X size={20} />
              </button>
            </div>

            {formError && <div className="alert-banner danger">{formError}</div>}

            <form onSubmit={handleCreateTextNote} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div className="form-group">
                <label>Note Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Chapter 4 - Photosynthesis"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  required
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
                <label>Note Text / Markdown</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '180px', resize: 'vertical' }}
                  placeholder="Paste lecture logs, textbook paragraphs, summaries..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={actionLoading}>
                {actionLoading ? 'Saving note...' : 'Save Study Note'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: UPLOAD FILE ATTACHMENT */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload Study Document</h3>
              <button className="modal-close" onClick={() => setShowUploadModal(false)}>
                <X size={20} />
              </button>
            </div>

            {formError && <div className="alert-banner danger">{formError}</div>}

            <form onSubmit={handleUploadFileNote} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div className="form-group">
                <label>Document Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Physics Lab Guidelines"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  required
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
                <label>Select File (PDF, TXT, MD)</label>
                <input 
                  type="file" 
                  accept=".txt,.md,.markdown,.pdf"
                  className="form-input" 
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Maximum file size: 5MB. PDF text elements will be automatically parsed for AI queries.
                </span>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={actionLoading}>
                {actionLoading ? 'Uploading document...' : 'Upload Material'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW NOTE DETAILS */}
      {showViewModal && viewedNote && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="badge" style={{ background: viewedNote.subject_color, color: '#1a0b14', marginRight: '0.5rem' }}>{viewedNote.subject_code}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{viewedNote.subject_name}</span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.3rem' }}>{viewedNote.title}</h3>
              </div>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.2rem', fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginTop: '0.5rem', color: 'var(--text-primary)' }}>
              {viewedNote.content_extracted}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>Uploaded {new Date(viewedNote.created_at).toLocaleString()}</span>
              <button 
                className="btn-primary" 
                style={{ padding: '0.5rem 1rem' }}
                onClick={() => {
                  setShowViewModal(false);
                  window.dispatchEvent(new CustomEvent('switchTab', { detail: 'ai' }));
                }}
              >
                Ask AI About Note
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
