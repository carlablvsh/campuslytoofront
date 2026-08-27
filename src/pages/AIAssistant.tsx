import React, { useEffect, useState, useRef } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { Bot, User, Send } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  code: string;
  color: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  sources?: Array<{
    id: string;
    title: string;
    subjectName: string;
    color: string;
  }>;
}

export const AIAssistant: React.FC = () => {
  const { token, user } = useAuth();
  
  // Data States
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Chat States
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [aiQuestion, setAiQuestion] = useState<string>('');
  const [aiSubjectId, setAiSubjectId] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/academic/subjects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const subData = await res.json();
        setSubjects(subData);
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSubjects();
      
      // Initialize Welcome Chat History
      setChatHistory([
        {
          id: 'welcome',
          sender: 'assistant',
          text: `Hi! I'm Campusly, your AI study buddy and friend! 🌸✨\n\nI'm here to help you study, explain difficult topics, keep you motivated, or just chat about student life! 📚💖\n\nIf you want to review your notes, just ask me about them—otherwise, feel free to say hello and chat about anything!`
        }
      ]);
    }
  }, [token]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, aiLoading]);

  // Submit AI Question
  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;

    const userQuestion = aiQuestion.trim();
    setAiQuestion('');

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userQuestion
    };
    setChatHistory(prev => [...prev, userMsg]);
    setAiLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/ai/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question: userQuestion,
          subject_id: aiSubjectId || undefined,
          history: chatHistory.map(h => ({ sender: h.sender, text: h.text }))
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get answer.');
      }

      const assistantMsg: ChatMessage = {
        id: Date.now().toString() + '-ai',
        sender: 'assistant',
        text: data.answer,
        sources: data.sources
      };
      setChatHistory(prev => [...prev, assistantMsg]);

    } catch (err: any) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: Date.now().toString() + '-err',
        sender: 'assistant',
        text: `Error: ${err.message || 'I had trouble analyzing your notes. Please make sure the Express server is online.'}`
      };
      setChatHistory(prev => [...prev, errMsg]);
    } finally {
      setAiLoading(false);
    }
  };

  // Rendering Helper: Parse markdown (bold, headers, blockquotes)
  const formatMessageText = (text: string) => {
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('> ')) {
        const cleanLine = line.replace(/^>\s*/, '');
        return <blockquote key={idx}>{parseBoldText(cleanLine)}</blockquote>;
      }
      if (line.startsWith('### ')) {
        return <h4 key={idx} style={{ marginTop: '0.8rem', marginBottom: '0.4rem', fontWeight: 800, color: 'var(--primary)' }}>{line.replace(/^###\s*/, '')}</h4>;
      }
      return <p key={idx} style={{ marginBottom: '0.35rem' }}>{parseBoldText(line)}</p>;
    });
  };

  const parseBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div style={{ color: 'var(--text-muted)' }}>Synching AI workspace...</div>
      </div>
    );
  }

  if (!user?.hasGeminiKey) {
    return (
      <div className="fade-in ai-workspace-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="landing-hover-card" style={{ maxWidth: '480px', padding: '2.5rem 2rem', textAlign: 'center', background: '#ffffff', border: '1.5px solid #ff7899', borderRadius: '24px', boxShadow: '0 8px 24px rgba(255, 94, 132, 0.05)' }}>
          <Bot size={44} style={{ color: '#ff7899', marginBottom: '1rem', marginLeft: 'auto', marginRight: 'auto' }} />
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#2e1622', marginBottom: '0.8rem' }}>Connect Your Gemini Key ✦</h3>
          <p style={{ fontSize: '0.82rem', color: '#8c707a', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            Campusly's AI Study Companion requires your own Gemini API key to run. This keeps Campusly mostly free and avoids usage limits!
          </p>
          <p style={{ fontSize: '0.73rem', color: '#ff7899', marginBottom: '1.8rem', fontWeight: 650 }}>
            *Note: You are responsible for your own Gemini usage and API quota limits. Getting a key is quick and free.
          </p>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-profile-settings'))}
            className="btn-primary"
            style={{ padding: '0.65rem 1.4rem', borderRadius: '20px', display: 'inline-flex', alignSelf: 'center' }}
          >
            Setup Gemini API Key 🎀
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in ai-workspace-container">
      
      <div className="ai-assistant-panel">
        
        {/* Chat Title bar */}
        <div className="ai-header">
          <Bot size={18} style={{ color: 'var(--primary)' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>AI Study Companion</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <span className="ai-header-status" /> Active (Study Buddy online)
            </span>
          </div>
        </div>

        {/* Messaging window */}
        <div className="ai-messages-window">
          {chatHistory.map(msg => (
            <div key={msg.id} className={`ai-message ${msg.sender}`}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.25rem', 
                fontWeight: 700, 
                marginBottom: '0.25rem', 
                fontSize: '0.7rem', 
                color: msg.sender === 'user' ? 'rgba(255,255,255,0.85)' : 'var(--primary)' 
              }}>
                {msg.sender === 'user' ? <User size={11} /> : <Bot size={11} />}
                <span>{msg.sender === 'user' ? 'You' : 'Campusly AI'}</span>
              </div>

              <div style={{ wordBreak: 'break-word' }}>
                {formatMessageText(msg.text)}
              </div>

              {/* Citations references */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="ai-sources-row">
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', width: '100%', marginBottom: '0.1rem' }}>Sources:</span>
                  {msg.sources.map(src => (
                    <div key={src.id} className="ai-source-pill">
                      <span style={{ width: '5px', height: '5px', borderRadius: '50% !important', background: src.color }} />
                      <span style={{ maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={src.title}>{src.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {aiLoading && (
            <div className="ai-message assistant">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                <Bot size={13} className="pulse" />
                <span>Scanning files and compiling answer...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Typing Input footer bar */}
        <form onSubmit={handleAskAI} className="ai-input-bar">
          <select 
            className="form-select"
            style={{ padding: '0.3rem', fontSize: '0.75rem', width: '100px', borderRadius: 'var(--radius-md)' }}
            value={aiSubjectId}
            onChange={(e) => setAiSubjectId(e.target.value)}
          >
            <option value="">All Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.code}</option>
            ))}
          </select>

          <input 
            type="text" 
            className="ai-input" 
            placeholder="Type your question..."
            value={aiQuestion}
            onChange={(e) => setAiQuestion(e.target.value)}
            disabled={aiLoading}
          />

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ padding: '0.5rem 0.9rem', minWidth: 'auto', borderRadius: 'var(--radius-md) !important', boxShadow: 'none' }}
            disabled={aiLoading}
          >
            <Send size={13} />
          </button>
        </form>

      </div>

    </div>
  );
};
