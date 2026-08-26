import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  Plus, 
  Trash2, 
  Settings, 
  Check, 
  Coffee, 
  CloudRain, 
  Waves, 
  Flame, 
  Wind, 
  Keyboard,
  Clock,
  ListTodo,
  FileText,
  Music
} from 'lucide-react';

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export const StudyRoom: React.FC = () => {
  // ==========================================
  // Toggle states for floating widgets
  // ==========================================
  const [showTimer, setShowTimer] = useState(true);
  const [showNotepad, setShowNotepad] = useState(false);
  const [showSounds, setShowSounds] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showSpotify, setShowSpotify] = useState(false);

  // ==========================================
  // Spotify Playlist State
  // ==========================================
  const [spotifyUrlInput, setSpotifyUrlInput] = useState('');
  const [spotifyEmbedUrl, setSpotifyEmbedUrl] = useState(
    'https://open.spotify.com/embed/playlist/37i9dQZF1DWWQRwui0ExPn?utm_source=generator'
  );

  const convertToEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('/embed/')) return url;
    
    try {
      const cleaned = url.split('?')[0]; // Remove query params
      if (cleaned.includes('spotify.com/playlist/')) {
        return cleaned.replace('spotify.com/playlist/', 'spotify.com/embed/playlist/') + '?utm_source=generator';
      }
      if (cleaned.includes('spotify.com/album/')) {
        return cleaned.replace('spotify.com/album/', 'spotify.com/embed/album/') + '?utm_source=generator';
      }
      if (cleaned.includes('spotify.com/artist/')) {
        return cleaned.replace('spotify.com/artist/', 'spotify.com/embed/artist/') + '?utm_source=generator';
      }
      if (cleaned.includes('spotify.com/track/')) {
        return cleaned.replace('spotify.com/track/', 'spotify.com/embed/track/') + '?utm_source=generator';
      }
    } catch (e) {}
    return url;
  };

  const handleSpotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spotifyUrlInput.trim()) return;
    const embedUrl = convertToEmbedUrl(spotifyUrlInput.trim());
    setSpotifyEmbedUrl(embedUrl);
    localStorage.setItem('campusly_studyroom_spotify_url', embedUrl);
    setSpotifyUrlInput('');
  };

  useEffect(() => {
    const savedSpotify = localStorage.getItem('campusly_studyroom_spotify_url');
    if (savedSpotify) {
      setSpotifyEmbedUrl(savedSpotify);
    }
  }, []);

  // ==========================================
  // Timer States & Logic
  // ==========================================
  const [timerMode, setTimerMode] = useState<'focus' | 'short' | 'long'>('focus');
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [durations, setDurations] = useState({
    focus: 25,
    short: 5,
    long: 15
  });
  
  const [timeLeft, setTimeLeft] = useState(durations.focus * 60);
  const [showSettings, setShowSettings] = useState(false);
  const [customFocus, setCustomFocus] = useState(durations.focus);
  const [customShort, setCustomShort] = useState(durations.short);
  const [customLong, setCustomLong] = useState(durations.long);

  const timerRef = useRef<any>(null);

  useEffect(() => {
    const savedDurations = localStorage.getItem('campusly_pomodoro_durations');
    if (savedDurations) {
      try {
        const parsed = JSON.parse(savedDurations);
        setDurations(parsed);
        setCustomFocus(parsed.focus);
        setCustomShort(parsed.short);
        setCustomLong(parsed.long);
        
        if (timerMode === 'focus') setTimeLeft(parsed.focus * 60);
        else if (timerMode === 'short') setTimeLeft(parsed.short * 60);
        else if (timerMode === 'long') setTimeLeft(parsed.long * 60);
      } catch (e) {
        console.error('Failed to parse pomodoro durations', e);
      }
    }
  }, []);

  useEffect(() => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (timerMode === 'focus') setTimeLeft(durations.focus * 60);
    else if (timerMode === 'short') setTimeLeft(durations.short * 60);
    else if (timerMode === 'long') setTimeLeft(durations.long * 60);
  }, [timerMode, durations]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsPlaying(false);
            clearInterval(timerRef.current);
            playChimeSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  const toggleTimer = () => {
    setIsPlaying(!isPlaying);
  };

  const resetTimer = () => {
    setIsPlaying(false);
    if (timerMode === 'focus') setTimeLeft(durations.focus * 60);
    else if (timerMode === 'short') setTimeLeft(durations.short * 60);
    else if (timerMode === 'long') setTimeLeft(durations.long * 60);
  };

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const newDurations = {
      focus: Number(customFocus),
      short: Number(customShort),
      long: Number(customLong)
    };
    setDurations(newDurations);
    localStorage.setItem('campusly_pomodoro_durations', JSON.stringify(newDurations));
    setShowSettings(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ==========================================
  // Checklist State & Logic
  // ==========================================
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');

  useEffect(() => {
    const savedTasks = localStorage.getItem('campusly_studyroom_tasks');
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (e) {
        console.error('Failed to parse study tasks', e);
      }
    }
  }, []);

  const saveTasks = (updatedTasks: Task[]) => {
    setTasks(updatedTasks);
    localStorage.setItem('campusly_studyroom_tasks', JSON.stringify(updatedTasks));
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false
    };

    saveTasks([...tasks, newTask]);
    setNewTaskText('');
  };

  const toggleTask = (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveTasks(updated);
  };

  const deleteTask = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    saveTasks(updated);
  };

  const clearCompleted = () => {
    const updated = tasks.filter(t => !t.completed);
    saveTasks(updated);
  };

  // ==========================================
  // Notepad State & Logic
  // ==========================================
  const [noteContent, setNoteContent] = useState('');
  const [keySoundsEnabled, setKeySoundsEnabled] = useState(false);

  useEffect(() => {
    const savedNotes = localStorage.getItem('campusly_studyroom_notes');
    if (savedNotes) {
      setNoteContent(savedNotes);
    }
  }, []);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNoteContent(text);
    localStorage.setItem('campusly_studyroom_notes', text);
    
    if (keySoundsEnabled) {
      playKeyboardClick();
    }
  };

  // ==========================================
  // Web Audio Synth Sounds State & Logic
  // ==========================================
  const [activeSounds, setActiveSounds] = useState<{ [key: string]: boolean }>({
    rain: false,
    waves: false,
    fireplace: false,
    wind: false,
    cafe: false
  });

  const [volumes, setVolumes] = useState<{ [key: string]: number }>({
    rain: 0.5,
    waves: 0.5,
    fireplace: 0.5,
    wind: 0.5,
    cafe: 0.5
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  
  const activeNodesRef = useRef<{
    [key: string]: {
      source: AudioBufferSourceNode | null;
      rumbleSource?: AudioBufferSourceNode | null;
      gainNode: GainNode | null;
      lfo?: OscillatorNode | null;
      crackleTimeout?: any;
      clinkTimeout?: any;
    };
  }>({});

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const createWhiteNoiseBuffer = (ctx: AudioContext) => {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  };

  const createPinkNoiseBuffer = (ctx: AudioContext) => {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  };

  const playKeyboardClick = () => {
    const ctx = initAudio();
    if (!ctx) return;
    
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 100 + Math.random() * 60;
    
    const noise = ctx.createBufferSource();
    noise.buffer = createWhiteNoiseBuffer(ctx);
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 900 + Math.random() * 300;
    filter.Q.value = 6;
    
    const gainNode = ctx.createGain();
    const duration = 0.01 + Math.random() * 0.01;
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.012, ctx.currentTime + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    
    osc.connect(gainNode);
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + duration);
  };

  const playChimeSound = () => {
    const ctx = initAudio();
    if (!ctx) return;
    
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15);
    osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.3);
    
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.2);
  };

  const startSound = (type: string) => {
    const ctx = initAudio();
    if (!ctx) return;

    stopSound(type);

    const mainGain = ctx.createGain();
    mainGain.gain.setValueAtTime(volumes[type], ctx.currentTime);
    mainGain.connect(ctx.destination);

    const activeNode: any = {
      source: null,
      gainNode: mainGain
    };

    if (type === 'rain') {
      const source = ctx.createBufferSource();
      source.buffer = createPinkNoiseBuffer(ctx);
      source.loop = true;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 1000;

      source.connect(lowpass);
      lowpass.connect(mainGain);
      source.start(0);

      activeNode.source = source;
    } 
    else if (type === 'waves') {
      const source = ctx.createBufferSource();
      source.buffer = createPinkNoiseBuffer(ctx);
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;

      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.12;

      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 250;

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start(0);

      source.connect(filter);
      filter.connect(mainGain);
      source.start(0);

      activeNode.source = source;
      activeNode.lfo = lfo;
    } 
    else if (type === 'fireplace') {
      const rumble = ctx.createBufferSource();
      rumble.buffer = createPinkNoiseBuffer(ctx);
      rumble.loop = true;

      const rumbleFilter = ctx.createBiquadFilter();
      rumbleFilter.type = 'lowpass';
      rumbleFilter.frequency.value = 150;

      const rumbleGain = ctx.createGain();
      rumbleGain.gain.value = 0.6;

      rumble.connect(rumbleFilter);
      rumbleFilter.connect(rumbleGain);
      rumbleGain.connect(mainGain);
      rumble.start(0);

      activeNode.rumbleSource = rumble;

      const triggerCrackle = () => {
        if (!activeNodesRef.current[type]) return;

        const crackleSource = ctx.createBufferSource();
        crackleSource.buffer = createWhiteNoiseBuffer(ctx);

        const crackleFilter = ctx.createBiquadFilter();
        crackleFilter.type = 'highpass';
        crackleFilter.frequency.value = 3000 + Math.random() * 2000;

        const crackleGain = ctx.createGain();
        const duration = 0.003 + Math.random() * 0.012;

        crackleGain.gain.setValueAtTime(0, ctx.currentTime);
        crackleGain.gain.linearRampToValueAtTime(0.04 + Math.random() * 0.08, ctx.currentTime + 0.001);
        crackleGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

        crackleSource.connect(crackleFilter);
        crackleFilter.connect(crackleGain);
        crackleGain.connect(mainGain);

        crackleSource.start(0);
        crackleSource.stop(ctx.currentTime + duration);

        const delay = 60 + Math.random() * 550;
        activeNode.crackleTimeout = setTimeout(triggerCrackle, delay);
      };

      triggerCrackle();
    } 
    else if (type === 'wind') {
      const source = ctx.createBufferSource();
      source.buffer = createWhiteNoiseBuffer(ctx);
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 600;
      filter.Q.value = 4.0;

      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.08;

      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 300;

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start(0);

      source.connect(filter);
      filter.connect(mainGain);
      source.start(0);

      activeNode.source = source;
      activeNode.lfo = lfo;
    } 
    else if (type === 'cafe') {
      const chatter = ctx.createBufferSource();
      chatter.buffer = createPinkNoiseBuffer(ctx);
      chatter.loop = true;

      const chatterFilter = ctx.createBiquadFilter();
      chatterFilter.type = 'lowpass';
      chatterFilter.frequency.value = 250;

      chatter.connect(chatterFilter);
      chatterFilter.connect(mainGain);
      chatter.start(0);

      activeNode.source = chatter;

      const triggerClink = () => {
        if (!activeNodesRef.current[type]) return;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1600 + Math.random() * 1800, ctx.currentTime);

        const clinkGain = ctx.createGain();
        const duration = 0.08 + Math.random() * 0.15;

        clinkGain.gain.setValueAtTime(0, ctx.currentTime);
        clinkGain.gain.linearRampToValueAtTime(0.003 + Math.random() * 0.007, ctx.currentTime + 0.004);
        clinkGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

        osc.connect(clinkGain);
        clinkGain.connect(mainGain);

        osc.start(0);
        osc.stop(ctx.currentTime + duration);

        const delay = 3000 + Math.random() * 7000;
        activeNode.clinkTimeout = setTimeout(triggerClink, delay);
      };

      triggerClink();
    }

    activeNodesRef.current[type] = activeNode;
  };

  const stopSound = (type: string) => {
    const node = activeNodesRef.current[type];
    if (node) {
      if (node.source) {
        try { node.source.stop(); } catch (e) {}
      }
      if (node.rumbleSource) {
        try { node.rumbleSource.stop(); } catch (e) {}
      }
      if (node.lfo) {
        try { node.lfo.stop(); } catch (e) {}
      }
      if (node.crackleTimeout) clearTimeout(node.crackleTimeout);
      if (node.clinkTimeout) clearTimeout(node.clinkTimeout);
      delete activeNodesRef.current[type];
    }
  };

  const toggleSound = (type: string) => {
    const isPlayingSound = !activeSounds[type];
    setActiveSounds(prev => ({ ...prev, [type]: isPlayingSound }));

    if (isPlayingSound) {
      startSound(type);
    } else {
      stopSound(type);
    }
  };

  const handleVolumeChange = (type: string, val: number) => {
    setVolumes(prev => ({ ...prev, [type]: val }));
    const node = activeNodesRef.current[type];
    if (node && node.gainNode) {
      node.gainNode.gain.setValueAtTime(val, audioCtxRef.current?.currentTime || 0);
    }
  };

  useEffect(() => {
    return () => {
      Object.keys(activeNodesRef.current).forEach(type => {
        stopSound(type);
      });
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <div className="studyroom-container" style={{ backgroundImage: "url('/cozy_study_bg.jpg')" }}>
      
      {/* Dynamic workspace wrapper where cards reflow symmetrically */}
      <div className="studyroom-workspace">
        
        {/* 1. POMODORO TIMER PANEL */}
        {showTimer && (
          <div className="study-panel pomodoro-panel fade-in">
            <div className="panel-header">
              <Clock size={15} className="panel-icon pink-icon" />
              <h2>Cozy Timer</h2>
              <button 
                className={`btn-icon-setting ${showSettings ? 'active' : ''}`}
                onClick={() => setShowSettings(!showSettings)}
                title="Timer Settings"
              >
                <Settings size={13} />
              </button>
            </div>

            <div className="pomodoro-modes">
              <button 
                className={`mode-tab ${timerMode === 'focus' ? 'active' : ''}`}
                onClick={() => setTimerMode('focus')}
              >
                🌸 Focus
              </button>
              <button 
                className={`mode-tab ${timerMode === 'short' ? 'active' : ''}`}
                onClick={() => setTimerMode('short')}
              >
                ✨ Short Break
              </button>
              <button 
                className={`mode-tab ${timerMode === 'long' ? 'active' : ''}`}
                onClick={() => setTimerMode('long')}
              >
                🍵 Long Break
              </button>
            </div>

            {showSettings ? (
              <form onSubmit={saveSettings} className="settings-form fade-in">
                <h3>Custom Durations (mins)</h3>
                <div className="settings-grid">
                  <label>
                    <span>Focus</span>
                    <input 
                      type="number" 
                      min="1" 
                      max="120"
                      value={customFocus} 
                      onChange={e => setCustomFocus(Number(e.target.value))} 
                    />
                  </label>
                  <label>
                    <span>Short</span>
                    <input 
                      type="number" 
                      min="1" 
                      max="60"
                      value={customShort} 
                      onChange={e => setCustomShort(Number(e.target.value))} 
                    />
                  </label>
                  <label>
                    <span>Long</span>
                    <input 
                      type="number" 
                      min="1" 
                      max="60"
                      value={customLong} 
                      onChange={e => setCustomLong(Number(e.target.value))} 
                    />
                  </label>
                </div>
                <div className="settings-actions">
                  <button type="submit" className="btn-save">Apply</button>
                  <button 
                    type="button" 
                    className="btn-cancel" 
                    onClick={() => {
                      setCustomFocus(durations.focus);
                      setCustomShort(durations.short);
                      setCustomLong(durations.long);
                      setShowSettings(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="timer-display-container">
                <div className="time-numbers">
                  {formatTime(timeLeft)}
                </div>
                <p className="timer-status">
                  {timerMode === 'focus' && 'time to block out distractions... ✦'}
                  {timerMode === 'short' && 'stretch, drink some water! 🌸'}
                  {timerMode === 'long' && 'brew a cup of tea. 🍵'}
                </p>

                <div className="timer-controls">
                  <button className="btn-timer-primary" onClick={toggleTimer}>
                    {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                    <span>{isPlaying ? 'Pause' : 'Start'}</span>
                  </button>
                  
                  <button className="btn-timer-reset" onClick={resetTimer} title="Reset Timer">
                    <RotateCcw size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. AUTOSAVING NOTEPAD */}
        {showNotepad && (
          <div className="study-panel notepad-panel fade-in">
            <div className="panel-header">
              <FileText size={15} className="panel-icon cream-icon" />
              <h2>Sanctuary Notepad</h2>
              
              <div className="clicker-toggle">
                <button 
                  className={`btn-clicker ${keySoundsEnabled ? 'active' : ''}`}
                  onClick={() => {
                    initAudio();
                    setKeySoundsEnabled(!keySoundsEnabled);
                  }}
                  title="Toggle Cozy Keyboard Click Feedback"
                >
                  <Keyboard size={12} />
                  <span>Clicks {keySoundsEnabled ? 'On' : 'Off'}</span>
                </button>
              </div>
            </div>

            <div className="notepad-container">
              <textarea
                className="paper-textarea"
                placeholder="Type your quick study notes or scratchpad thoughts... (autosaves) ✍️"
                value={noteContent}
                onChange={handleNoteChange}
              />
            </div>
          </div>
        )}

        {/* 3. AMBIENT SOUNDS CONSOLE */}
        {showSounds && (
          <div className="study-panel sounds-panel fade-in">
            <div className="panel-header">
              <Volume2 size={15} className="panel-icon lavender-icon" />
              <h2>Focus Soundscapes</h2>
            </div>

            <div className="soundscape-list">
              {/* Rain */}
              <div className={`soundscape-item ${activeSounds.rain ? 'playing' : ''}`}>
                <button className="sound-toggle" onClick={() => toggleSound('rain')}>
                  <CloudRain size={14} />
                  <span>Autumn Rain</span>
                </button>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05"
                  value={volumes.rain}
                  disabled={!activeSounds.rain}
                  onChange={e => handleVolumeChange('rain', Number(e.target.value))}
                  className="sound-volume-slider"
                />
              </div>

              {/* Ocean */}
              <div className={`soundscape-item ${activeSounds.waves ? 'playing' : ''}`}>
                <button className="sound-toggle" onClick={() => toggleSound('waves')}>
                  <Waves size={14} />
                  <span>Ocean Tides</span>
                </button>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05"
                  value={volumes.waves}
                  disabled={!activeSounds.waves}
                  onChange={e => handleVolumeChange('waves', Number(e.target.value))}
                  className="sound-volume-slider"
                />
              </div>

              {/* Fireplace */}
              <div className={`soundscape-item ${activeSounds.fireplace ? 'playing' : ''}`}>
                <button className="sound-toggle" onClick={() => toggleSound('fireplace')}>
                  <Flame size={14} />
                  <span>Campfire Crackles</span>
                </button>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05"
                  value={volumes.fireplace}
                  disabled={!activeSounds.fireplace}
                  onChange={e => handleVolumeChange('fireplace', Number(e.target.value))}
                  className="sound-volume-slider"
                />
              </div>

              {/* Wind */}
              <div className={`soundscape-item ${activeSounds.wind ? 'playing' : ''}`}>
                <button className="sound-toggle" onClick={() => toggleSound('wind')}>
                  <Wind size={14} />
                  <span>Rustling Wind</span>
                </button>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05"
                  value={volumes.wind}
                  disabled={!activeSounds.wind}
                  onChange={e => handleVolumeChange('wind', Number(e.target.value))}
                  className="sound-volume-slider"
                />
              </div>

              {/* Cafe */}
              <div className={`soundscape-item ${activeSounds.cafe ? 'playing' : ''}`}>
                <button className="sound-toggle" onClick={() => toggleSound('cafe')}>
                  <Coffee size={14} />
                  <span>Cozy Cafe Chat</span>
                </button>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05"
                  value={volumes.cafe}
                  disabled={!activeSounds.cafe}
                  onChange={e => handleVolumeChange('cafe', Number(e.target.value))}
                  className="sound-volume-slider"
                />
              </div>
            </div>
          </div>
        )}

        {/* 4. SESSION TO-DO LIST */}
        {showChecklist && (
          <div className="study-panel checklist-panel fade-in">
            <div className="panel-header">
              <ListTodo size={15} className="panel-icon mint-icon" />
              <h2>Session Tasks</h2>
              {tasks.filter(t => t.completed).length > 0 && (
                <button className="btn-clear-completed" onClick={clearCompleted}>
                  Clear done
                </button>
              )}
            </div>

            <form onSubmit={addTask} className="checklist-add-form">
              <input 
                type="text" 
                placeholder="Add a task..." 
                value={newTaskText}
                onChange={e => setNewTaskText(e.target.value)}
                className="checklist-input"
              />
              <button type="submit" className="btn-checklist-add">
                <Plus size={14} />
              </button>
            </form>

            <div className="checklist-items">
              {tasks.length === 0 ? (
                <div className="checklist-empty">
                  <span>✨</span>
                  <p>Checklist is empty.</p>
                </div>
              ) : (
                <ul className="checklist-ul">
                  {tasks.map(task => (
                    <li key={task.id} className={`checklist-li ${task.completed ? 'completed' : ''}`}>
                      <button 
                        type="button" 
                        className="btn-checkbox" 
                        onClick={() => toggleTask(task.id)}
                      >
                        {task.completed ? (
                          <span className="checkbox-checked"><Check size={8} strokeWidth={3} /></span>
                        ) : (
                          <span className="checkbox-empty" />
                        )}
                      </button>
                      <span className="checklist-text">{task.text}</span>
                      <button 
                        type="button" 
                        className="btn-checklist-delete"
                        onClick={() => deleteTask(task.id)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* 5. SPOTIFY WIDGET PLAYLIST CARD */}
        {showSpotify && (
          <div className="study-panel spotify-panel fade-in">
            <div className="panel-header">
              <Music size={15} className="panel-icon pink-icon" style={{ color: '#1db954' }} />
              <h2 style={{ fontFamily: 'var(--font-serif)' }}>Spotify Player</h2>
            </div>
            
            <div className="spotify-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <iframe 
                src={spotifyEmbedUrl} 
                width="100%" 
                height="152" 
                frameBorder="0" 
                allowFullScreen={false} 
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                loading="lazy"
                style={{ borderRadius: '12px', border: 'none' }}
              />

              <form onSubmit={handleSpotifySubmit} className="spotify-url-form" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Load Custom Playlist/Album Link:
                </span>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input 
                    type="text" 
                    placeholder="Paste Spotify Link..." 
                    value={spotifyUrlInput}
                    onChange={e => setSpotifyUrlInput(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '0.4rem 0.6rem',
                      fontSize: '0.72rem',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  />
                  <button 
                    type="submit" 
                    style={{
                      background: '#1db954',
                      color: 'white',
                      border: 'none',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '8px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}
                  >
                    Load
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>

      {/* Floating Bottom Controller Dock */}
      <div className="studyroom-bottom-dock">
        <button 
          className={`dock-btn ${showTimer ? 'active' : ''}`}
          onClick={() => setShowTimer(!showTimer)}
          title="Toggle Timer Panel"
        >
          <Clock size={16} />
        </button>
        <button 
          className={`dock-btn ${showNotepad ? 'active' : ''}`}
          onClick={() => setShowNotepad(!showNotepad)}
          title="Toggle Notepad Panel"
        >
          <FileText size={16} />
        </button>
        <button 
          className={`dock-btn ${showSounds ? 'active' : ''}`}
          onClick={() => setShowSounds(!showSounds)}
          title="Toggle Soundscapes Panel"
        >
          <Volume2 size={16} />
        </button>
        <button 
          className={`dock-btn ${showChecklist ? 'active' : ''}`}
          onClick={() => setShowChecklist(!showChecklist)}
          title="Toggle Session Checklist Panel"
        >
          <ListTodo size={16} />
        </button>
        <button 
          className={`dock-btn ${showSpotify ? 'active' : ''}`}
          onClick={() => setShowSpotify(!showSpotify)}
          title="Toggle Spotify Music Panel"
          style={{ color: showSpotify ? '#1db954' : 'inherit' }}
        >
          <Music size={16} />
        </button>
      </div>

    </div>
  );
};
