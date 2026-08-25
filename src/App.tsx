import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth, API_BASE_URL } from './context/AuthContext';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Timetable } from './pages/Timetable';
import { Attendance } from './pages/Attendance';
import { Tasks } from './pages/Tasks';
import { Exams } from './pages/Exams';
import { Notes } from './pages/Notes';
import { CalendarView } from './pages/Calendar';
import { AIAssistant } from './pages/AIAssistant';

import { 
  Sparkles, 
  Calendar as CalendarIcon, 
  GraduationCap, 
  CheckSquare, 
  FileText, 
  Clock, 
  LogOut, 
  Sun, 
  Moon,
  Bot,
  Bell,
  Search,
  X
} from 'lucide-react';

type ActiveTab = 'dashboard' | 'timetable' | 'attendance' | 'tasks' | 'exams' | 'notes' | 'calendar' | 'ai';

const AppContent: React.FC = () => {
  const { user, loading, logout, token, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>('light'); // Light mode default
  const [greeting, setGreeting] = useState<string>('Welcome back');

  // Profile Settings States
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState<string>('');
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);

  // Sync username input with profile state
  useEffect(() => {
    if (user) {
      setNewUsername(user.username);
    }
  }, [user, showProfileModal]);

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!newUsername.trim()) {
      setProfileError('Username cannot be empty.');
      return;
    }

    try {
      setProfileLoading(true);
      const res = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username: newUsername.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update username.');
      }

      updateUser(data.user);
      setProfileSuccess('Username updated successfully! 💖');
    } catch (err: any) {
      setProfileError(err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setProfileError('All password fields are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setProfileError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setProfileError('New password must be at least 6 characters.');
      return;
    }

    try {
      setProfileLoading(true);
      const res = await fetch(`${API_BASE_URL}/auth/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to change password.');
      }

      setProfileSuccess('Password changed successfully! ✧');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setProfileError(err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProfileError(null);
    setProfileSuccess(null);

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setProfileLoading(true);
      const res = await fetch(`${API_BASE_URL}/auth/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload profile picture.');
      }

      updateUser(data.user);
      setProfileSuccess('Profile picture updated successfully! ✧');
    } catch (err: any) {
      setProfileError(err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  // Spotlight Search states
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchClasses, setSearchClasses] = useState<any[]>([]);
  const [searchAssignments, setSearchAssignments] = useState<any[]>([]);
  const [searchExams, setSearchExams] = useState<any[]>([]);
  const [searchNotes, setSearchNotes] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load search targets
  const preloadSearchData = async () => {
    if (searchClasses.length > 0) return; // already loaded
    try {
      setSearchLoading(true);
      const [classRes, assRes, exRes, noteRes] = await Promise.all([
        fetch(`${API_BASE_URL}/academic/classes`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/academic/assignments`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/academic/exams`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/notes`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (classRes.ok) setSearchClasses(await classRes.json());
      if (assRes.ok) setSearchAssignments(await assRes.json());
      if (exRes.ok) setSearchExams(await exRes.json());
      if (noteRes.ok) setSearchNotes(await noteRes.json());
    } catch (err) {
      console.error('Error preloading search index:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  // Keyboard shortcut listener: Cmd/Ctrl + K to open, Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearch(prev => !prev);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Autofocus input on open
  useEffect(() => {
    if (showSearch) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
      preloadSearchData();
    } else {
      setSearchQuery('');
    }
  }, [showSearch]);

  // Custom listener for dashboard quick action clicks
  useEffect(() => {
    const handleSwitchTab = (e: Event) => {
      const customEvent = e as CustomEvent<ActiveTab>;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
      }
    };
    window.addEventListener('switchTab', handleSwitchTab);
    return () => window.removeEventListener('switchTab', handleSwitchTab);
  }, []);

  // Sync theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Compute cute greeting based on time of day
  useEffect(() => {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 12) {
      setGreeting('Good morning');
    } else if (hours >= 12 && hours < 17) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#faf8fb',
        color: '#2e1622',
        gap: '1rem'
      }}>
        <div style={{ fontSize: '2.5rem', animation: 'pulse 1.5s infinite' }}>🎀</div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#a38d99' }}>Opening Campusly...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  // Search filter computes
  const query = searchQuery.toLowerCase().trim();
  const filteredClasses = query ? searchClasses.filter(c => 
    c.subject_name?.toLowerCase().includes(query) || 
    c.subject_code?.toLowerCase().includes(query) || 
    c.location?.toLowerCase().includes(query)
  ) : [];

  const filteredAssignments = query ? searchAssignments.filter(a => 
    a.title?.toLowerCase().includes(query) || 
    a.subject_name?.toLowerCase().includes(query)
  ) : [];

  const filteredExams = query ? searchExams.filter(e => 
    e.title?.toLowerCase().includes(query) || 
    e.subject_name?.toLowerCase().includes(query)
  ) : [];

  const filteredNotes = query ? searchNotes.filter(n => 
    n.title?.toLowerCase().includes(query) || 
    n.subject_name?.toLowerCase().includes(query)
  ) : [];

  const hasResults = query && (
    filteredClasses.length > 0 || 
    filteredAssignments.length > 0 || 
    filteredExams.length > 0 || 
    filteredNotes.length > 0
  );

  // Sidebar Menu Config (Aligned with screenshot navigation list)
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Sparkles },
    { id: 'timetable', label: 'Timetable', icon: Clock },
    { id: 'attendance', label: 'Attendance', icon: GraduationCap },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'exams', label: 'Exams', icon: CalendarIcon },
    { id: 'notes', label: 'Notes Library', icon: FileText },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'ai', label: 'AI Assistant', icon: Bot },
  ] as const;

  // Render view
  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'timetable':
        return <Timetable />;
      case 'attendance':
        return <Attendance />;
      case 'tasks':
        return <Tasks />;
      case 'exams':
        return <Exams />;
      case 'notes':
        return <Notes />;
      case 'calendar':
        return <CalendarView />;
      case 'ai':
        return <AIAssistant />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <span>Campusly</span>
        </div>

        <ul className="nav-links">
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button 
                  className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <Icon className="nav-item-icon" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* User Card Footer */}
        <div className="sidebar-footer">
          <div 
            className="user-profile" 
            onClick={() => setShowProfileModal(true)} 
            style={{ cursor: 'pointer', transition: 'background 0.2s' }}
            title="Profile Settings"
          >
            <div className="user-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user.username.slice(0, 2).toLowerCase()
              )}
            </div>
            <div className="user-info">
              <span className="username">{user.username}</span>
              <span className="email">{user.email}</span>
            </div>
          </div>
          
          <button 
            className="btn-secondary" 
            onClick={logout} 
            style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', justifyContent: 'center' }}
          >
            <LogOut size={13} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="mobile-nav">
        {menuItems.slice(0, 5).map(item => {
          const Icon = item.icon;
          return (
            <div 
              key={item.id} 
              className={`mobile-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon className="mobile-nav-item-icon" />
              <span>{item.label.split(' ')[0]}</span>
            </div>
          );
        })}
        {/* Toggle AI for remaining */}
        <div 
          className={`mobile-nav-item ${activeTab === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai')}
        >
          <Bot className="mobile-nav-item-icon" />
          <span>AI</span>
        </div>
      </nav>

      {/* MAIN VIEWPORT */}
      <main className="main-content">
        
        {/* APP HEADER */}
        <header className="app-header">
          <div className="header-title">
            <h1>
              {activeTab === 'dashboard' && `${greeting}, ${user.username}! ☀️`}
              {activeTab === 'timetable' && 'Weekly Timetable ✦'}
              {activeTab === 'attendance' && 'Attendance Margin Tracker ✦'}
              {activeTab === 'tasks' && 'Assignments & Checklist ✦'}
              {activeTab === 'exams' && 'Exams timetable ✦'}
              {activeTab === 'notes' && 'Materials Vault ✦'}
              {activeTab === 'calendar' && 'Academic Calendar ✦'}
              {activeTab === 'ai' && 'AI Study Workspace ✦'}
            </h1>
            <p>
              {activeTab === 'dashboard' && "Here's what you have going on today."}
              {activeTab === 'timetable' && 'Arrange and manage your lectures.'}
              {activeTab === 'attendance' && 'Calculate safe margins and log present markers.'}
              {activeTab === 'tasks' && 'Tackle and keep track of pending assignments.'}
              {activeTab === 'exams' && 'Log midterm schedules and syllabus topics.'}
              {activeTab === 'notes' && 'Upload textbooks PDFs and view class notes.'}
              {activeTab === 'calendar' && 'A comprehensive view of your monthly deadlines.'}
              {activeTab === 'ai' && 'Ask questions and synthesize summaries of your course materials.'}
            </p>
          </div>

          <div className="header-actions">
            {/* Pinterest style Search placeholder - Opens functional Spotlight search on click */}
            <div className="search-container" onClick={() => setShowSearch(true)}>
              <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)', cursor: 'pointer' }} />
              <input type="text" className="search-input" placeholder="Search anything... ⌘K" style={{ cursor: 'pointer' }} readOnly />
            </div>

            {/* Notification bell decorator */}
            <button className="btn-action" title="Notifications" style={{ border: 'none', background: 'transparent' }}>
              <Bell size={18} />
            </button>

            {/* Theme Toggle Button */}
            <button 
              className="theme-toggle" 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </header>

        {/* ACTIVE COMPONENT VIEW */}
        <div style={{ flex: 1 }} className="fade-in">
          {renderActiveView()}
        </div>

      </main>

      {/* SPOTLIGHT SEARCH MODAL OVERLAY */}
      {showSearch && (
        <div className="spotlight-overlay" onClick={() => setShowSearch(false)}>
          <div className="spotlight-modal" onClick={e => e.stopPropagation()}>
            
            <div className="spotlight-header">
              <Search size={18} style={{ color: 'var(--primary)' }} />
              <input 
                ref={searchInputRef}
                type="text" 
                className="spotlight-input" 
                placeholder="Search classes, assignments, exams, notes..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <span className="spotlight-shortcut-hint">ESC</span>
            </div>

            <div className="spotlight-results">
              {searchLoading && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Syncing records list...
                </div>
              )}

              {!query && !searchLoading && (
                <div style={{ padding: '2.2rem 1.2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Search across subjects, lectures, checklist deadlines, and documents... ✧
                </div>
              )}

              {query && !hasResults && !searchLoading && (
                <div style={{ padding: '2.2rem 1.2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  No matches found for "{searchQuery}"
                </div>
              )}

              {hasResults && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  
                  {/* CLASSES RESULTS */}
                  {filteredClasses.length > 0 && (
                    <div>
                      <div className="spotlight-group-title">📅 Timetable lectures</div>
                      <div className="spotlight-group-items">
                        {filteredClasses.map(c => (
                          <div 
                            key={c.id} 
                            className="spotlight-item"
                            onClick={() => {
                              setActiveTab('timetable');
                              setShowSearch(false);
                            }}
                          >
                            <div className="spotlight-item-left">
                              <span style={{ color: c.subject_color || 'var(--primary)' }}>[{c.subject_code}]</span>
                              <span className="spotlight-item-title">{c.subject_name}</span>
                            </div>
                            <span className="spotlight-item-right">{c.start_time} • {c.location || 'No Room'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ASSIGNMENTS RESULTS */}
                  {filteredAssignments.length > 0 && (
                    <div>
                      <div className="spotlight-group-title">📝 Assignments checklist</div>
                      <div className="spotlight-group-items">
                        {filteredAssignments.map(a => (
                          <div 
                            key={a.id} 
                            className="spotlight-item"
                            onClick={() => {
                              setActiveTab('tasks');
                              setShowSearch(false);
                            }}
                          >
                            <div className="spotlight-item-left">
                              <span style={{ color: a.subject_color || 'var(--primary)' }}>[{a.subject_code || 'Task'}]</span>
                              <span className="spotlight-item-title">{a.title}</span>
                            </div>
                            <span className="spotlight-item-right" style={{ textTransform: 'capitalize' }}>Status: {a.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* EXAMS RESULTS */}
                  {filteredExams.length > 0 && (
                    <div>
                      <div className="spotlight-group-title">⚡ Midterms & Exams</div>
                      <div className="spotlight-group-items">
                        {filteredExams.map(e => (
                          <div 
                            key={e.id} 
                            className="spotlight-item"
                            onClick={() => {
                              setActiveTab('exams');
                              setShowSearch(false);
                            }}
                          >
                            <div className="spotlight-item-left">
                              <span style={{ color: e.subject_color || '#8b5cf6' }}>[{e.subject_code || 'Exam'}]</span>
                              <span className="spotlight-item-title">{e.title}</span>
                            </div>
                            <span className="spotlight-item-right">{e.date}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* NOTES RESULTS */}
                  {filteredNotes.length > 0 && (
                    <div>
                      <div className="spotlight-group-title">📚 Textbook Materials & Notes</div>
                      <div className="spotlight-group-items">
                        {filteredNotes.map(n => (
                          <div 
                            key={n.id} 
                            className="spotlight-item"
                            onClick={() => {
                              setActiveTab('notes');
                              setShowSearch(false);
                              setTimeout(() => {
                                window.dispatchEvent(new CustomEvent('switchAndOpenNote', { detail: n.id }));
                              }, 120);
                            }}
                          >
                            <div className="spotlight-item-left">
                              <span style={{ color: n.subject_color || 'var(--primary)' }}>[{n.subject_code || 'Note'}]</span>
                              <span className="spotlight-item-title">{n.title}</span>
                            </div>
                            <span className="spotlight-item-right">Click to Open File</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* PROFILE SETTINGS MODAL OVERLAY */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => { setShowProfileModal(false); setProfileError(null); setProfileSuccess(null); }}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Profile Settings ✦</h3>
              <button className="modal-close" onClick={() => { setShowProfileModal(false); setProfileError(null); setProfileSuccess(null); }}>
                <X size={20} />
              </button>
            </div>

            {profileError && <div className="alert-banner danger" style={{ margin: 0 }}>{profileError}</div>}
            {profileSuccess && <div className="alert-banner success" style={{ margin: 0 }}>{profileSuccess}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
              {/* Profile Avatar Edit Section */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', paddingBottom: '1.2rem', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50% !important', border: '3px solid var(--primary-glow)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)', fontSize: '1.6rem', fontWeight: 850 }}>
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    user.username.slice(0, 2).toLowerCase()
                  )}
                </div>
                <label className="btn-secondary" style={{ cursor: 'pointer', padding: '0.45rem 1rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', margin: 0 }}>
                  Change Photo 🎀
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarChange} 
                    style={{ display: 'none' }} 
                  />
                </label>
              </div>
              {/* Form 1: Rename Username */}
              <form onSubmit={handleUpdateUsername} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)' }}>Update Display Name</h4>
                <div className="form-group" style={{ margin: 0 }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="New display name"
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ alignSelf: 'flex-start', padding: '0.45rem 1rem', fontSize: '0.8rem', minWidth: 'auto', boxShadow: 'none' }}
                  disabled={profileLoading}
                >
                  {profileLoading ? 'Saving...' : 'Save Name'}
                </button>
              </form>

              {/* Form 2: Change Password */}
              <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.2rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)' }}>Change Password</h4>
                
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Current Password</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>New Password</label>
                    <input 
                      type="password" 
                      className="form-input" 
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Confirm Password</label>
                    <input 
                      type="password" 
                      className="form-input" 
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ alignSelf: 'flex-start', padding: '0.45rem 1rem', fontSize: '0.8rem', minWidth: 'auto', boxShadow: 'none' }}
                  disabled={profileLoading}
                >
                  {profileLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
