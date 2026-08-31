import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth, API_BASE_URL } from './context/AuthContext';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Timetable } from './pages/Timetable';
import { Attendance } from './pages/Attendance';
import { Tasks } from './pages/Tasks';
import { Exams } from './pages/Exams';
// import { Notes } from './pages/Notes';
import { CalendarView } from './pages/Calendar';
// import { AIAssistant } from './pages/AIAssistant';
import { LandingPage } from './pages/LandingPage';
import { StudyRoom } from './pages/StudyRoom';
import { CampusXP } from './pages/CampusXP';
// Campusly Client v1.0.1 - Fullscreen Study Room & Navigation Update

import { 
  Sparkles, 
  Calendar as CalendarIcon, 
  GraduationCap, 
  ClipboardList, 
  Clock, 
  LogOut, 
  Sun, 
  Moon,
  Bell,
  Search,
  X,
  Coffee,
  Trophy
} from 'lucide-react';

type ActiveTab = 'dashboard' | 'timetable' | 'attendance' | 'tasks' | 'exams' | 'notes' | 'calendar' | 'ai' | 'studyroom' | 'campus-xp';

const AppContent: React.FC = () => {
  const { user, loading, logout, token, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('theme') as 'dark' | 'light') || 'light');
  const [publicView, setPublicView] = useState<'landing' | 'login' | 'signup'>('landing');
  const [showSidebarPreview, setShowSidebarPreview] = useState<boolean>(false);

  // Gamification Quick Summary State (for persistent global pill)
  const [xpSummary, setXpSummary] = useState<{ totalXP: number; level: number; levelTitle: string; progressPercent: number } | null>(null);

  const fetchXpSummary = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/gamification/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setXpSummary({
          totalXP: data.totalXP,
          level: data.level,
          levelTitle: data.levelTitle,
          progressPercent: data.progressPercent
        });
      }
    } catch (e) {
      console.error('Error fetching global XP summary:', e);
    }
  };

  // Unlockable Customization States
  const [accentTheme, setAccentTheme] = useState<string>(() => localStorage.getItem('campusly_accent_theme') || 'sakura');
  const [avatarFrame, setAvatarFrame] = useState<string>(() => localStorage.getItem('campusly_avatar_frame') || 'none');

  const handleSelectTheme = (themeKey: string, reqLevel: number) => {
    const currentLvl = xpSummary?.level || 1;
    if (currentLvl < reqLevel) {
      alert(`✦ Unlocks at Level ${reqLevel}! Keep logging classes, assignments, and study sessions to unlock this palette.`);
      return;
    }
    setAccentTheme(themeKey);
    localStorage.setItem('campusly_accent_theme', themeKey);
  };

  const handleSelectFrame = (frameKey: string, reqLevel: number) => {
    const currentLvl = xpSummary?.level || 1;
    if (currentLvl < reqLevel) {
      alert(`✦ Unlocks at Level ${reqLevel}! Keep logging classes, assignments, and study sessions to unlock this frame.`);
      return;
    }
    setAvatarFrame(frameKey);
    localStorage.setItem('campusly_avatar_frame', frameKey);
  };

  useEffect(() => {
    if (token) {
      fetchXpSummary();
    }
  }, [token]);

  // Notifications State & Fetchers
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState<boolean>(false);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const dismissNotification = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
    } catch (err) {
      console.error('Error dismissing notification:', err);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, token]);

  useEffect(() => {
    const handleOpenProfile = () => setShowProfileModal(true);
    window.addEventListener('open-profile-settings', handleOpenProfile);
    return () => window.removeEventListener('open-profile-settings', handleOpenProfile);
  }, []);

  // Profile Settings States
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState<string>('');
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState<string>('');
  const [keyUpdateLoading, setKeyUpdateLoading] = useState<boolean>(false);

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

  const handleSaveGeminiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!geminiKeyInput.trim()) {
      setProfileError('Please enter a valid Gemini API key.');
      return;
    }

    try {
      setKeyUpdateLoading(true);
      const res = await fetch(`${API_BASE_URL}/auth/gemini-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ gemini_api_key: geminiKeyInput.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save Gemini key.');
      }

      if (user) {
        updateUser({ ...user, hasGeminiKey: data.hasGeminiKey });
      }
      setProfileSuccess('Gemini API key saved successfully! 🌸');
      setGeminiKeyInput('');
    } catch (err: any) {
      setProfileError(err.message);
    } finally {
      setKeyUpdateLoading(false);
    }
  };

  const handleRemoveGeminiKey = async () => {
    const confirmed = window.confirm('Are you sure you want to remove your custom Gemini API key? You will not be able to use AI features until you configure a key again.');
    if (!confirmed) return;

    setProfileError(null);
    setProfileSuccess(null);

    try {
      setKeyUpdateLoading(true);
      const res = await fetch(`${API_BASE_URL}/auth/gemini-key`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove Gemini key.');
      }

      if (user) {
        updateUser({ ...user, hasGeminiKey: data.hasGeminiKey });
      }
      setProfileSuccess('Gemini API key removed successfully.');
      setGeminiKeyInput('');
    } catch (err: any) {
      setProfileError(err.message);
    } finally {
      setKeyUpdateLoading(false);
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

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to permanently delete your Campusly account? This action is irreversible and will delete all your classes, notes, tasks, exams, calendar events, and profile data.'
    );
    if (!confirmed) return;

    try {
      setProfileLoading(true);
      setProfileError(null);
      const res = await fetch(`${API_BASE_URL}/auth/account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete account.');
      }

      alert('Your account has been deleted successfully. We hope to see you back soon! 🌸');
      setShowProfileModal(false);
      logout();
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
    localStorage.setItem('theme', theme);
  }, [theme]);

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
    if (publicView === 'login') {
      return <Auth onBackToLanding={() => setPublicView('landing')} initialIsLogin={true} />;
    }
    if (publicView === 'signup') {
      return <Auth onBackToLanding={() => setPublicView('landing')} initialIsLogin={false} />;
    }
    return (
      <LandingPage 
        onLoginClick={() => setPublicView('login')} 
        onSignUpClick={() => setPublicView('signup')} 
        onLogoClick={() => setShowSidebarPreview(true)}
        showSidebarPreview={showSidebarPreview}
        setShowSidebarPreview={setShowSidebarPreview}
      />
    );
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

  // Sidebar Menu Config (Dashboard, Study Room, Timetable, Calendar, Attendance, Assignments, Exams, Campus XP)
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Sparkles },
    { id: 'studyroom', label: 'Study Room', icon: Coffee },
    { id: 'timetable', label: 'Timetable', icon: Clock },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'attendance', label: 'Attendance', icon: GraduationCap },
    { id: 'tasks', label: 'Assignments', icon: ClipboardList },
    { id: 'exams', label: 'Exams', icon: CalendarIcon },
    { id: 'campus-xp', label: 'Campus XP', icon: Trophy },
  ] as const;

  // Render view
  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <div className="page-dashboard"><Dashboard onNavigate={(tab) => setActiveTab(tab as ActiveTab)} /></div>;
      case 'timetable':
        return <div className="page-timetable"><Timetable /></div>;
      case 'attendance':
        return <div className="page-attendance"><Attendance /></div>;
      case 'tasks':
        return <div className="page-tasks"><Tasks /></div>;
      case 'exams':
        return <div className="page-exams"><Exams /></div>;
      case 'calendar':
        return <div className="page-calendar"><CalendarView /></div>;
      case 'studyroom':
        return <div className="page-studyroom"><StudyRoom onExit={() => setActiveTab('dashboard')} /></div>;
      case 'campus-xp':
        return <div className="page-campusxp"><CampusXP /></div>;
      default:
        return <div className="page-dashboard"><Dashboard onNavigate={(tab) => setActiveTab(tab as ActiveTab)} /></div>;
    }
  };

  // Dedicated App-Level Fullscreen Viewport for Study Room
  if (activeTab === 'studyroom') {
    return (
      <div className="app-container studyroom-active" data-accent={accentTheme} style={{ margin: 0, padding: 0, width: '100vw', height: '100vh', overflow: 'hidden' }}>
        <StudyRoom onExit={() => setActiveTab('dashboard')} />
      </div>
    );
  }

  return (
    <div className="app-container" data-accent={accentTheme}>
      
      {/* DESKTOP 2095 EDITORIAL SIDEBAR */}
      <aside className="sidebar" style={{
        width: '15.5rem',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--line)',
        padding: '2rem 1.2rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 100,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)'
      }}>
        <div>
          {/* Brand Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '2.5rem', paddingLeft: '0.4rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.5 7.5 4 10.5 4 14.5C4 18.5 7.5 22 12 22C16.5 22 20 18.5 20 14.5C20 10.5 15.5 7.5 12 2Z" fill="url(#app-petal-grad)" />
              <defs>
                <linearGradient id="app-petal-grad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#f472b6" />
                  <stop offset="1" stopColor="#e11d48" />
                </linearGradient>
              </defs>
            </svg>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem', letterSpacing: '-0.02em', color: 'var(--ink)' }}>
              Campusly
            </span>
          </div>

          {/* Section Label */}
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--ink-faint)', letterSpacing: '0.08em', textTransform: 'uppercase', paddingLeft: '0.6rem', marginBottom: '0.6rem' }}>
            Navigation
          </div>

          {/* Navigation Links with Crisp Hairline Active State */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {menuItems.map(item => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button 
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '6px',
                    background: isActive ? 'rgba(45, 21, 39, 0.05)' : 'transparent',
                    color: isActive ? 'var(--ink)' : 'var(--ink-soft)',
                    border: 'none',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                    width: '100%'
                  }}
                >
                  <Icon 
                    size={18} 
                    strokeWidth={1.8} 
                    style={{ 
                      color: isActive ? 'var(--petal)' : 'var(--ink-soft)',
                      flexShrink: 0 
                    }} 
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Enrolled Profile Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          
          <div 
            onClick={() => setShowProfileModal(true)}
            style={{
              padding: '0.9rem',
              borderRadius: '4px',
              border: '1px solid var(--line)',
              background: 'transparent',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
            title="Profile & Customization"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--ink-faint)', textTransform: 'uppercase' }}>
                Enrolled as
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--petal)', fontWeight: 700 }}>
                LVL {xpSummary?.level || 1}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div 
                className={`user-avatar ${avatarFrame !== 'none' ? `avatar-frame-${avatarFrame}` : ''}`} 
                style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)', flexShrink: 0, border: '1px solid var(--line)' }}
              >
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  user.username.slice(0, 2).toLowerCase()
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.username}
                </p>
                <p style={{ fontSize: '0.68rem', color: 'var(--ink-faint)', margin: '0.05rem 0 0 0' }}>
                  {xpSummary?.levelTitle || 'Scholar'}
                </p>
              </div>
            </div>

            {/* XP Mini Bar */}
            <div style={{ height: '2px', background: 'var(--line)', borderRadius: '9999px', overflow: 'hidden', marginTop: '0.65rem' }}>
              <div style={{ width: `${xpSummary?.progressPercent || 0}%`, height: '100%', background: 'var(--petal)', borderRadius: '9999px', transition: 'width 0.4s ease' }} />
            </div>
          </div>

          <button 
            type="button"
            onClick={logout}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--ink-faint)',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
              padding: '0.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem'
            }}
            className="hover:text-ink"
          >
            <LogOut size={12} />
            <span>Sign out of campus</span>
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
        {/* <div 
          className={`mobile-nav-item ${activeTab === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai')}
        >
          <Bot className="mobile-nav-item-icon" />
          <span>AI</span>
        </div> */}
      </nav>

      {/* MAIN VIEWPORT */}
      <main className="main-content" onClick={() => { if (showNotificationsDropdown) setShowNotificationsDropdown(false); }}>
        
        {/* APP HEADER */}
        <header className="app-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.2rem 2rem',
          borderBottom: '1px solid var(--line)',
          background: 'rgba(250, 246, 240, 0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          position: 'sticky',
          top: 0,
          zIndex: 90
        }}>
          <div className="header-title">
            {activeTab !== 'dashboard' ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                  <span className="sci-fi-tag" style={{ fontSize: '0.62rem' }}>
                    {activeTab === 'timetable' && 'SCHEDULE ENGINE'}
                    {activeTab === 'attendance' && 'ATTENDANCE TRACKER'}
                    {activeTab === 'tasks' && 'TASK TIMELINE'}
                    {activeTab === 'exams' && 'EXAM PROTOCOLS'}
                    {activeTab === 'calendar' && 'ACADEMIC CALENDAR'}
                    {activeTab === 'campus-xp' && 'PROGRESSION & REWARDS'}
                  </span>
                </div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                  {activeTab === 'timetable' && 'Weekly Timetable'}
                  {activeTab === 'attendance' && 'Attendance & Margins'}
                  {activeTab === 'tasks' && 'Tasks & Deliverables'}
                  {activeTab === 'exams' && 'Exams & Evaluations'}
                  {activeTab === 'calendar' && 'Term Calendar'}
                  {activeTab === 'campus-xp' && 'Campus XP Progression'}
                </h1>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span className="sci-fi-tag" style={{ background: 'var(--blush)', color: 'var(--plum)' }}>
                  TERM 01 / EQUINOX
                </span>
              </div>
            )}
          </div>

          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* 2095 Search Bar */}
            <div 
              onClick={() => setShowSearch(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(255, 253, 249, 0.9)',
                border: '1px solid var(--line)',
                borderRadius: '9999px',
                padding: '0.45rem 1rem',
                boxShadow: 'var(--shadow-soft)',
                cursor: 'pointer',
                width: '220px'
              }}
            >
              <Search size={13} style={{ color: 'var(--ink-faint)' }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--ink-faint)', fontWeight: 500 }}>
                Search campus... ⌘K
              </span>
            </div>

            {/* Notification bell with count badge & dropdown panel */}
            <div style={{ position: 'relative' }}>
              <button 
                className="btn-action" 
                title="Notifications" 
                style={{ border: 'none', background: 'transparent', position: 'relative' }}
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
              >
                <Bell size={18} />
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    background: '#ff5e84',
                    color: '#ffffff',
                    fontSize: '0.6rem',
                    fontWeight: 'bold',
                    width: '15px',
                    height: '15px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1.5px solid var(--bg-surface)'
                  }}>
                    {notifications.filter(n => !n.is_read).length}
                  </span>
                )}
              </button>

              {showNotificationsDropdown && (
                <div 
                  onClick={e => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    top: '40px',
                    right: 0,
                    width: '320px',
                    background: 'var(--bg-surface)',
                    border: '1.5px solid var(--border-color)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                    zIndex: 1000,
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '380px',
                    overflowY: 'auto'
                  }} 
                  className="notifications-dropdown"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.6rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>Notifications</span>
                    {notifications.filter(n => !n.is_read).length > 0 && (
                      <button 
                        onClick={() => { markAllNotificationsAsRead(); }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>✨</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>All caught up! No recent alerts.</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          style={{ 
                            display: 'flex', 
                            gap: '0.5rem', 
                            padding: '0.5rem', 
                            borderRadius: '8px',
                            background: notif.is_read ? 'transparent' : 'rgba(255, 120, 153, 0.03)',
                            border: '1px solid transparent',
                            alignItems: 'flex-start',
                            position: 'relative'
                          }}
                        >
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 750, color: notif.is_read ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                              {notif.title}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.15rem', lineHeight: 1.3 }}>
                              {notif.message}
                            </span>
                            <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                              {new Date(notif.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: '0.2rem', alignSelf: 'center' }}>
                            {!notif.is_read && (
                              <button 
                                onClick={() => markNotificationAsRead(notif.id)}
                                style={{ background: 'transparent', border: 'none', color: '#ff7899', fontSize: '0.85rem', cursor: 'pointer', padding: '0.2rem' }}
                                title="Mark as read"
                              >
                                ✓
                              </button>
                            )}
                            <button 
                              onClick={() => dismissNotification(notif.id)}
                              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', padding: '0.2rem' }}
                              title="Dismiss"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

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
                              <span style={{ color: 'var(--primary)', fontWeight: 700 }}>[{c.subject_code}]</span>
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
                              <span style={{ color: 'var(--primary)', fontWeight: 700 }}>[{a.subject_code || 'Task'}]</span>
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
                              <span style={{ color: 'var(--primary)', fontWeight: 700 }}>[{e.subject_code || 'Exam'}]</span>
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
                              <span style={{ color: 'var(--primary)', fontWeight: 700 }}>[{n.subject_code || 'Note'}]</span>
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
          <div className="modal-content" style={{ maxWidth: '440px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Profile Settings ✦</h3>
              <button className="modal-close" onClick={() => { setShowProfileModal(false); setProfileError(null); setProfileSuccess(null); }}>
                <X size={20} />
              </button>
            </div>

            {profileError && <div className="alert-banner danger" style={{ margin: 0 }}>{profileError}</div>}
            {profileSuccess && <div className="alert-banner success" style={{ margin: 0 }}>{profileSuccess}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem', flex: 1, overflowY: 'auto', paddingRight: '0.4rem', marginTop: '0.5rem' }}>
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

              {/* Unlockable Appearance & Themes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                    🎨 Color Palette Theme
                  </h4>
                  <span className="badge" style={{ fontSize: '0.65rem' }}>Level {xpSummary?.level || 1}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                  {[
                    { key: 'sakura', name: 'Sakura Pink', color: '#ff5e84', level: 1 },
                    { key: 'matcha', name: 'Matcha Sage', color: '#10b981', level: 3 },
                    { key: 'ocean', name: 'Ocean Breeze', color: '#0284c7', level: 5 },
                    { key: 'lavender', name: 'Lavender Dream', color: '#8b5cf6', level: 7 },
                    { key: 'peach', name: 'Sunset Peach', color: '#f97316', level: 10 },
                    { key: 'cyber', name: 'Cyber Violet', color: '#6366f1', level: 12 },
                  ].map(t => {
                    const isUnlocked = (xpSummary?.level || 1) >= t.level;
                    const isSelected = accentTheme === t.key;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => handleSelectTheme(t.key, t.level)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.45rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          border: isSelected ? `2px solid ${t.color}` : '1px solid var(--border-color)',
                          background: isSelected ? 'var(--bg-surface)' : 'var(--bg-app)',
                          cursor: isUnlocked ? 'pointer' : 'not-allowed',
                          opacity: isUnlocked ? 1 : 0.5,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          transition: 'var(--transition)'
                        }}
                      >
                        <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                        {!isUnlocked && <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>L{t.level}</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Avatar Profile Frames */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                    👑 Avatar Profile Frames
                  </h4>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                  {[
                    { key: 'none', name: 'Classic', level: 1 },
                    { key: 'emerald', name: 'Emerald', color: '#10b981', level: 4 },
                    { key: 'sapphire', name: 'Sapphire', color: '#0284c7', level: 8 },
                    { key: 'gold', name: 'Gold Legend', color: '#f59e0b', level: 12 },
                    { key: 'starlight', name: 'Starlight', color: '#a855f7', level: 15 },
                  ].map(f => {
                    const isUnlocked = (xpSummary?.level || 1) >= f.level;
                    const isSelected = avatarFrame === f.key;
                    return (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => handleSelectFrame(f.key, f.level)}
                        style={{
                          padding: '0.45rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                          background: isSelected ? 'var(--bg-surface)' : 'var(--bg-app)',
                          cursor: isUnlocked ? 'pointer' : 'not-allowed',
                          opacity: isUnlocked ? 1 : 0.5,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textAlign: 'center',
                          color: f.color || 'var(--text-primary)',
                          transition: 'var(--transition)'
                        }}
                      >
                        {f.name} {!isUnlocked && `(L${f.level})`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Central Campusly AI Configuration */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.2rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  Power your Campusly AI <Sparkles size={16} style={{ color: '#ff7899' }} />
                </h4>
                <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
                  Campusly uses Gemini for its AI-powered features. You can connect your own Gemini API key and use AI features without waiting for Campusly's premium AI plan.
                </p>
                <p style={{ fontSize: '0.68rem', color: '#ff7899', margin: 0, fontWeight: 650 }}>
                  *Note: You are responsible for your own Gemini usage and API quota limits. Campusly does not charge for your Gemini API usage.
                </p>
                
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                  <a 
                    href="https://aistudio.google.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-secondary"
                    style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', minWidth: 'auto', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                  >
                    Get Gemini API Key ↗
                  </a>
                </div>

                <form onSubmit={handleSaveGeminiKey} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.2rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <input 
                      type="password" 
                      className="form-input" 
                      placeholder={user?.hasGeminiKey ? "Key is active ✦ (Enter new key to replace)" : "Enter Gemini API Key (starts with AQ... or AIza...)"}
                      value={geminiKeyInput}
                      onChange={e => setGeminiKeyInput(e.target.value)}
                      required={!user?.hasGeminiKey}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      type="submit" 
                      className="btn-primary" 
                      style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', minWidth: 'auto', boxShadow: 'none' }}
                      disabled={keyUpdateLoading}
                    >
                      {keyUpdateLoading ? 'Saving...' : user?.hasGeminiKey ? 'Update Key' : 'Save Key'}
                    </button>
                    {user?.hasGeminiKey && (
                      <button 
                        type="button" 
                        onClick={handleRemoveGeminiKey}
                        className="btn-secondary"
                        style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', minWidth: 'auto', borderColor: '#ef4444', color: '#ef4444' }}
                        disabled={keyUpdateLoading}
                      >
                        Remove Key
                      </button>
                    )}
                  </div>
                </form>
              </div>

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

              {/* Danger Zone: Delete Account */}
              <div style={{ borderTop: '1.5px dashed rgba(239, 68, 68, 0.2)', paddingTop: '1.2rem', marginTop: '0.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ef4444' }}>Danger Zone</h4>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
                  Permanently delete your Campusly account and all saved academic schedules, notes, tasks, and files.
                </p>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    alignSelf: 'flex-start',
                    boxShadow: '0 2px 6px rgba(239, 68, 68, 0.15)'
                  }}
                >
                  Delete My Account
                </button>
              </div>
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
