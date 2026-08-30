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
  Music,
  SkipBack,
  SkipForward,
  Search,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { generateCodeVerifier, generateCodeChallenge } from '../utils/spotifyAuth';

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: any;
  }
}

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export interface StudyRoomProps {
  onExit?: () => void;
}

export const StudyRoom: React.FC<StudyRoomProps> = ({ onExit }) => {
  // Listen for Escape key to exit study room
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onExit) {
        onExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit]);

  // ==========================================
  // Toggle states for floating widgets
  // ==========================================
  const [showTimer, setShowTimer] = useState(true);
  const [showNotepad, setShowNotepad] = useState(false);
  const [showSounds, setShowSounds] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showSpotify, setShowSpotify] = useState(false);

  // ==========================================
  // Spotify Account Integration State
  // ==========================================
  const { token } = useAuth();
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(true); // Default to true, catches account_error if non-Premium
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  // Player State
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isPaused, setIsPaused] = useState(true);
  const [trackProgress, setTrackProgress] = useState(0);
  const [trackDuration, setTrackDuration] = useState(0);
  const [playerVolume, setPlayerVolume] = useState(50); // Default 50%
  const [playbackStatusMessage, setPlaybackStatusMessage] = useState('Initializing player...');

  // Search State
  const [spotifySearchQuery, setSpotifySearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Fetch Spotify configuration (ClientId)
  const fetchSpotifyConfig = async () => {
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE_URL}/spotify/config`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setClientId(data.clientId);
        return data.clientId;
      }
    } catch (err) {
      console.error('Failed to fetch Spotify config:', err);
    }
    return null;
  };

  // Check connection status & get active token
  const checkSpotifyConnection = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/spotify/token`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.connected && data.accessToken) {
          setSpotifyConnected(true);
          setSpotifyToken(data.accessToken);
        } else {
          setSpotifyConnected(false);
          setSpotifyToken(null);
        }
      }
    } catch (err) {
      console.error('Failed to verify Spotify connection:', err);
    }
  };

  // Perform token exchange when redirect code is present in URL
  const handleUrlCallback = async () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) return;

    // Clean query parameters from URL immediately
    window.history.replaceState({}, document.title, window.location.pathname);

    const verifier = localStorage.getItem('spotify_code_verifier');
    if (!verifier) {
      console.error('No code verifier found in local storage!');
      return;
    }

    try {
      setPlaybackStatusMessage('Connecting to Spotify...');
      const redirectUri = window.location.origin + '/';
      const res = await fetch(`${API_BASE_URL}/spotify/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code,
          code_verifier: verifier,
          redirect_uri: redirectUri
        })
      });

      if (res.ok) {
        localStorage.removeItem('spotify_code_verifier');
        await checkSpotifyConnection();
      } else {
        const errData = await res.json();
        console.error('Failed to exchange code:', errData.error);
        alert(`Spotify Connection Failed: ${errData.error}`);
      }
    } catch (err) {
      console.error('OAuth callback handling failed:', err);
    }
  };

  const handleConnectSpotify = async () => {
    let activeClientId = clientId;
    if (!activeClientId) {
      activeClientId = await fetchSpotifyConfig();
    }
    if (!activeClientId) {
      alert('Spotify integration is not fully configured on the server. Please ensure SPOTIFY_CLIENT_ID is set.');
      return;
    }

    const verifier = generateCodeVerifier();
    localStorage.setItem('spotify_code_verifier', verifier);

    const challenge = await generateCodeChallenge(verifier);
    const redirectUri = encodeURIComponent(window.location.origin + '/');
    const scopes = encodeURIComponent(
      'streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state user-read-currently-playing'
    );

    const authUrl = `https://accounts.spotify.com/authorize?client_id=${activeClientId}&response_type=code&redirect_uri=${redirectUri}&code_challenge_method=S256&code_challenge=${challenge}&scope=${scopes}`;
    window.location.href = authUrl;
  };

  const handleDisconnectSpotify = async () => {
    if (!token) return;
    if (player) {
      player.disconnect();
      setPlayer(null);
    }
    try {
      const res = await fetch(`${API_BASE_URL}/spotify/disconnect`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSpotifyConnected(false);
        setSpotifyToken(null);
        setDeviceId(null);
        setCurrentTrack(null);
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Failed to disconnect Spotify:', err);
    }
  };

  const initializeSpotifyPlayer = () => {
    if (!spotifyToken) return;

    // Prevent duplicate player initializations
    if (player) return;

    setPlaybackStatusMessage('Connecting Web Playback SDK...');
    const newPlayer = new window.Spotify.Player({
      name: 'Campusly Study Player',
      getOAuthToken: (cb: (t: string) => void) => {
        // Fetch new fresh token in case it expired
        fetch(`${API_BASE_URL}/spotify/token`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => {
            if (data.connected && data.accessToken) {
              setSpotifyToken(data.accessToken);
              cb(data.accessToken);
            } else {
              cb('');
            }
          })
          .catch(() => cb(''));
      },
      volume: playerVolume / 100
    });

    newPlayer.addListener('initialization_error', ({ message }: { message: string }) => {
      console.error('Spotify Init Error:', message);
      setPlaybackStatusMessage(`Initialization error: ${message}`);
    });

    newPlayer.addListener('authentication_error', ({ message }: { message: string }) => {
      console.error('Spotify Auth Error:', message);
      setPlaybackStatusMessage('Authentication error. Re-connecting...');
      handleDisconnectSpotify();
    });

    newPlayer.addListener('account_error', ({ message }: { message: string }) => {
      console.warn('Spotify Account Restriction:', message);
      setIsPremium(false);
      setPlaybackStatusMessage('Spotify Premium account is required for inline playback.');
    });

    newPlayer.addListener('playback_error', ({ message }: { message: string }) => {
      console.error('Spotify Playback Error:', message);
    });

    newPlayer.addListener('ready', ({ device_id }: { device_id: string }) => {
      console.log('Spotify Player is ready on device:', device_id);
      setDeviceId(device_id);
      setPlaybackStatusMessage('Ready to play music!');
    });

    newPlayer.addListener('not_ready', ({ device_id }: { device_id: string }) => {
      console.log('Device is offline:', device_id);
      setPlaybackStatusMessage('Device went offline.');
    });

    newPlayer.addListener('player_state_changed', (state: any) => {
      if (!state) {
        // Player state can be null if playback is stopped or transferred
        return;
      }
      setCurrentTrack(state.track_window.current_track);
      setIsPaused(state.paused);
      setTrackProgress(state.position);
      setTrackDuration(state.duration);
    });

    newPlayer.connect();
    setPlayer(newPlayer);
  };

  // Load Spotify configuration & check connection status on mount
  useEffect(() => {
    const init = async () => {
      await fetchSpotifyConfig();
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (code) {
        await handleUrlCallback();
      } else {
        await checkSpotifyConnection();
      }
    };
    init();
  }, [token]);

  // Load Spotify SDK when connected and token is active
  useEffect(() => {
    if (!spotifyConnected || !spotifyToken) return;

    if (window.Spotify) {
      initializeSpotifyPlayer();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      initializeSpotifyPlayer();
    };

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, [spotifyConnected, spotifyToken]);

  // Progress tracker timer loop
  useEffect(() => {
    if (isPaused || !trackDuration) return;

    const interval = setInterval(() => {
      setTrackProgress(prev => {
        if (prev + 1000 >= trackDuration) {
          clearInterval(interval);
          return trackDuration;
        }
        return prev + 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, trackDuration]);

  // Search tracks & playlists
  const handleSpotifySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spotifySearchQuery.trim() || !spotifyToken) return;

    setSearchLoading(true);
    try {
      const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(spotifySearchQuery.trim())}&type=track,playlist&limit=5`, {
        headers: {
          'Authorization': `Bearer ${spotifyToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        const tracks = data.tracks?.items || [];
        const playlists = data.playlists?.items || [];
        setSearchResults([...tracks, ...playlists]);
      } else if (res.status === 401) {
        await checkSpotifyConnection();
      }
    } catch (err) {
      console.error('Spotify search error:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handlePlaySpotifyItem = async (uri: string) => {
    if (!spotifyToken) return;

    if (!isPremium) {
      const url = uri.includes(':playlist:') 
        ? `https://open.spotify.com/playlist/${uri.split(':playlist:')[1]}`
        : `https://open.spotify.com/track/${uri.split(':track:')[1]}`;
      window.open(url, '_blank');
      return;
    }

    if (!deviceId) {
      setPlaybackStatusMessage('No playback device detected. Make sure Spotify is active.');
      return;
    }

    try {
      const body: any = {};
      if (uri.includes(':track:')) {
        body.uris = [uri];
      } else {
        body.context_uri = uri;
      }

      const res = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${spotifyToken}`
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('Play request failed:', errText);
        setPlaybackStatusMessage('Playback failed. Please select this device in your Spotify app.');
      }
    } catch (err) {
      console.error('Play request error:', err);
    }
  };

  const handleTogglePlay = async () => {
    if (!player) return;
    try {
      await player.togglePlay();
    } catch (err) {
      console.error('Toggle play error:', err);
    }
  };

  const handleNextTrack = async () => {
    if (!player) return;
    try {
      await player.nextTrack();
    } catch (err) {
      console.error('Next track error:', err);
    }
  };

  const handlePrevTrack = async () => {
    if (!player) return;
    try {
      await player.previousTrack();
    } catch (err) {
      console.error('Prev track error:', err);
    }
  };

  const handleSeek = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!player) return;
    const seekMs = parseInt(e.target.value);
    try {
      await player.seek(seekMs);
      setTrackProgress(seekMs);
    } catch (err) {
      console.error('Seek error:', err);
    }
  };

  const handleSpotifyVolumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseInt(e.target.value);
    setPlayerVolume(vol);
    if (!player) return;
    try {
      await player.setVolume(vol / 100);
    } catch (err) {
      console.error('Volume change error:', err);
    }
  };

  const formatSpotifyTime = (ms: number) => {
    if (!ms) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

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

            // Award server-controlled XP when a focus session finishes
            if (timerMode === 'focus' && durations.focus >= 10 && token) {
              fetch(`${API_BASE_URL}/gamification/study-session`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  minutes: durations.focus,
                  session_id: `study_${Date.now()}_${Math.floor(Math.random() * 1000)}`
                })
              }).catch(e => console.error('Error logging study session XP:', e));
            }

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
    <div className="studyroom-container" style={{ backgroundImage: "url('/cozy_study_bg.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
      
      {/* Top App-Level Fullscreen Navigation Bar */}
      <header className="studyroom-topbar" style={{
        position: 'absolute',
        top: '1.25rem',
        left: '1.5rem',
        right: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 50,
        pointerEvents: 'none'
      }}>
        {/* Left Sanctuary Pill */}
        <div style={{
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          background: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: '0.45rem 1rem',
          borderRadius: '9999px',
          border: '1px solid rgba(255, 255, 255, 0.7)',
          boxShadow: '0 4px 20px rgba(45, 21, 39, 0.08)'
        }}>
          <Coffee size={16} style={{ color: '#e11d48' }} />
          <span style={{ fontFamily: 'var(--font-display, serif)', fontSize: '0.88rem', fontWeight: 700, color: '#2d1527', letterSpacing: '-0.01em' }}>
            Study Room Sanctuary
          </span>
        </div>

        {/* Right Clear Exit Button */}
        {onExit && (
          <button
            type="button"
            onClick={onExit}
            className="studyroom-exit-btn"
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              background: 'rgba(255, 255, 255, 0.94)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              color: '#2d1527',
              border: '1px solid rgba(225, 29, 72, 0.3)',
              padding: '0.45rem 1.1rem',
              borderRadius: '9999px',
              fontFamily: 'var(--font-sans, sans-serif)',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(225, 29, 72, 0.12)',
              transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)'
            }}
            title="Exit Study Room (Esc)"
          >
            <ArrowLeft size={16} style={{ color: '#e11d48' }} />
            <span>Exit Study Room</span>
            <span style={{
              fontSize: '0.62rem',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 700,
              background: 'rgba(225, 29, 72, 0.08)',
              color: '#e11d48',
              padding: '0.15rem 0.45rem',
              borderRadius: '4px',
              marginLeft: '0.2rem'
            }}>
              ESC
            </span>
          </button>
        )}
      </header>

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
                Focus
              </button>
              <button 
                className={`mode-tab ${timerMode === 'short' ? 'active' : ''}`}
                onClick={() => setTimerMode('short')}
              >
                Short Break
              </button>
              <button 
                className={`mode-tab ${timerMode === 'long' ? 'active' : ''}`}
                onClick={() => setTimerMode('long')}
              >
                Long Break
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
                  {timerMode === 'focus' && 'time to block out distractions...'}
                  {timerMode === 'short' && 'stretch, drink some water!'}
                  {timerMode === 'long' && 'brew a cup of tea.'}
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
                placeholder="Type your quick study notes or scratchpad thoughts... (autosaves)"
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
            
            {!spotifyConnected ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', padding: '1rem', textAlign: 'center' }}>
                <div style={{ background: '#1db954', color: 'white', padding: '0.6rem', borderRadius: '50%' }}>
                  <Music size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 0.2rem 0' }}>Connect Spotify</h3>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>Play your music while you study.</p>
                </div>
                <button 
                  onClick={handleConnectSpotify}
                  style={{
                    background: '#1db954',
                    color: 'white',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '0.45rem 1.2rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(29, 185, 84, 0.25)',
                    transition: 'transform 0.2s'
                  }}
                >
                  Connect Account
                </button>
              </div>
            ) : (
              <div className="spotify-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {/* CURRENTLY PLAYING SECTION */}
                <div style={{ display: 'flex', gap: '0.8rem', background: 'var(--bg-input)', padding: '0.6rem', borderRadius: '10px', alignItems: 'center' }}>
                  <div style={{ width: '48px', height: '48px', background: 'var(--border-color)', borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
                    {currentTrack?.album?.images?.[0]?.url ? (
                      <img src={currentTrack.album.images[0].url} alt="Album Art" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                        <Music size={20} />
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>
                      {currentTrack?.name || 'No Track Selected'}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {currentTrack?.artists?.map((a: any) => a.name).join(', ') || 'Select a song below'}
                    </span>
                  </div>
                </div>

                {/* PROGRESS BAR */}
                {isPremium && currentTrack && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <input 
                      type="range" 
                      min={0} 
                      max={trackDuration} 
                      value={trackProgress} 
                      onChange={handleSeek} 
                      style={{ width: '100%', accentColor: '#1db954', cursor: 'pointer', height: '3px' }} 
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.58rem', color: 'var(--text-muted)' }}>
                      <span>{formatSpotifyTime(trackProgress)}</span>
                      <span>{formatSpotifyTime(trackDuration)}</span>
                    </div>
                  </div>
                )}

                {/* CONTROLS */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.2rem' }}>
                  {isPremium ? (
                    <>
                      <button onClick={handlePrevTrack} className="btn-secondary" style={{ padding: '0.35rem', minWidth: 'auto', borderRadius: '50%' }}>
                        <SkipBack size={14} />
                      </button>
                      <button onClick={handleTogglePlay} className="btn-primary" style={{ padding: '0.5rem', minWidth: 'auto', borderRadius: '50%', background: '#1db954', color: 'white', borderColor: '#1db954' }}>
                        {isPaused ? <Play size={14} fill="white" /> : <Pause size={14} fill="white" />}
                      </button>
                      <button onClick={handleNextTrack} className="btn-secondary" style={{ padding: '0.35rem', minWidth: 'auto', borderRadius: '50%' }}>
                        <SkipForward size={14} />
                      </button>
                    </>
                  ) : (
                    currentTrack && (
                      <a 
                        href={`https://open.spotify.com/track/${currentTrack.id}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn-primary"
                        style={{ fontSize: '0.72rem', padding: '0.4rem 1rem', background: '#1db954', color: 'white', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <ExternalLink size={12} /> Open in Spotify
                      </a>
                    )
                  )}
                </div>

                {/* VOLUME CONTROLLER */}
                {isPremium && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.6rem' }}>
                    <Volume2 size={12} style={{ color: 'var(--text-muted)' }} />
                    <input 
                      type="range" 
                      min={0} 
                      max={100} 
                      value={playerVolume} 
                      onChange={handleSpotifyVolumeChange} 
                      style={{ width: '80px', accentColor: '#1db954', height: '3px' }} 
                    />
                  </div>
                )}

                {/* SEARCH BOX */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <form onSubmit={handleSpotifySearch} style={{ display: 'flex', gap: '0.3rem' }}>
                    <input 
                      type="text" 
                      placeholder="Search tracks, playlists..." 
                      value={spotifySearchQuery}
                      onChange={e => setSpotifySearchQuery(e.target.value)}
                      style={{
                        flex: 1,
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '0.35rem 0.6rem',
                        fontSize: '0.72rem',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    />
                    <button type="submit" className="btn-secondary" style={{ padding: '0.35rem 0.6rem', minWidth: 'auto' }} disabled={searchLoading}>
                      <Search size={12} />
                    </button>
                  </form>

                  {searchResults.length > 0 && (
                    <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.3rem', background: 'var(--bg-app)', padding: '0.4rem', borderRadius: '8px' }}>
                      {searchResults.map((item, index) => (
                        <div 
                          key={index}
                          onClick={() => handlePlaySpotifyItem(item.uri)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem', borderRadius: '4px', cursor: 'pointer' }}
                          className="spotify-search-item"
                        >
                          <div style={{ width: '28px', height: '28px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                            <img src={item.album?.images?.[0]?.url || item.images?.[0]?.url || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
                            <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.type === 'track' ? item.artists?.map((a: any) => a.name).join(', ') : `Playlist • ${item.tracks?.total || 0} songs`}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.58rem', color: '#1db954', fontWeight: 700 }}>
                            {isPremium ? 'Play' : 'Open'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* STATUS BAR & DISCONNECT */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.6rem', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                    Status: {playbackStatusMessage}
                  </span>
                  <button 
                    onClick={handleDisconnectSpotify}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 700, padding: 0 }}
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            )}
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
