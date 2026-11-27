import StudentLayout from './StudentLayout';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, NavLink } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './StudentLearning.css';


const StudentLearning = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [translatingMessageId, setTranslatingMessageId] = useState(null);
  

  const [suggestedQuestions] = useState([
    'What is the purpose of a health history interview?',
    'Explain the difference between subjective and objective data',
    'How do I assess the respiratory system?',
    'What are normal vital signs for an adult?',
    'Explain the Glasgow Coma Scale',
  ]);

  const messagesEndRef = useRef(null);
  const messageScrollRef = useRef(null);

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';

    setIsDarkMode(isDark);

    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!user?.id) return;
  
      try {
        const response = await fetch(
          `http://127.0.0.1:5000/learning/sessions?user_id=${user.id}`
        );
  
        if (!response.ok) {
          throw new Error('Failed to load chat history');
        }
  
        const data = await response.json();
        setChatHistory(data.sessions || []);
  
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };
  
    fetchChatHistory();
  }, [user?.id]);


  const handleOpenChat = async (id) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/learning/sessions/${id}/messages?user_id=${user.id}`
      );
  
      if (!response.ok) {
        throw new Error('Failed to load conversation');
      }
  
      const data = await response.json();
  
      const loadedMessages = (data.messages || []).map((msg) => ({
        id: msg.id,
        type: msg.role === 'user' ? 'user' : 'ai',
        content: msg.content,
        timestamp: msg.created_at,
      }));
  
      setMessages(loadedMessages);
      setSessionId(id);
  
    } catch (error) {
      console.error('Error opening conversation:', error);
    }
  };


  const handleNewChat = () => {
    setMessages([]);
    setSessionId(null);
    setInputMessage('');
  };



  useEffect(() => {
    const pane = messageScrollRef.current;
    if (pane) pane.scrollTo({ top: pane.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;

    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ============================================================
  // REAL RAG API CONNECTION
  // ============================================================
  const handleSendMessage = async (message) => {
    if (!message.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:5000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          user_id: user?.id,
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      if (data.session_id) {
        setSessionId(data.session_id);
      
        setChatHistory((prev) => {
          const existing = prev.find(
            (chat) => chat.session_id === data.session_id
          );
      
          if (existing) {
            return prev.map((chat) =>
              chat.session_id === data.session_id
                ? { ...chat, updated_at: new Date().toISOString() }
                : chat
            );
          }
      
          return [
            {
              session_id: data.session_id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              message_count: 1,
              title: data.title || 'New Conversation',
            },
            ...prev,
          ];
        });
      }

      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content:
          data.reply ||
          "I couldn't find an answer.",
        sources: data.sources || [],
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error connecting to MedLearn AI backend:', error);

      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content:
          'Sorry, I could not connect to the MedLearn AI backend. Please make sure the backend server is running.',
        sources: [],
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslateMessage = async (messageId) => {
    const message = messages.find((item) => item.id === messageId);

    if (!message || message.type !== 'ai') return;

    if (message.arabicContent) {
      setMessages((prev) =>
        prev.map((item) =>
          item.id === messageId
            ? { ...item, showArabic: !item.showArabic }
            : item
        )
      );
      return;
    }

    setTranslatingMessageId(messageId);

    try {
      const response = await fetch('http://127.0.0.1:5000/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: message.content,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

console.log('TRANSLATE RESPONSE:', data);

if (!data.translation) {
  throw new Error('No translation returned');
}

      setMessages((prev) =>
        prev.map((item) =>
          item.id === messageId
            ? {
                ...item,
                arabicContent: data.translation,
                showArabic: true,
              }
            : item
        )
      );
    } catch (error) {
      console.error('Error translating response:', error);
      alert(
        'Sorry, the Arabic translation could not be loaded. Please try again.'
      );
    } finally {
      setTranslatingMessageId(null);
    }
  };

  const handleSuggestedQuestion = (question) => {
    handleSendMessage(question);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputMessage);
    }
  };

  const Icon = ({ name, size = 20 }) => {
    const paths = {
      dashboard: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
      book: <><path d="M12 7v14M3 18V5a2 2 0 0 1 2-2h4a3 3 0 0 1 3 3 3 3 0 0 1 3-3h4a2 2 0 0 1 2 2v13h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3H3Z"/></>,
      heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>,
      clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
      plus: <path d="M12 5v14M5 12h14"/>,
      panel: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/></>,
      send: <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
      moon: <path d="M20.5 15.5A9 9 0 0 1 8.5 3.5a9 9 0 1 0 12 12Z"/>,
      sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></>,
      logout: <><path d="M10 17l5-5-5-5m5 5H3"/><path d="M12 3h6a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-6"/></>,
      check: <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="m8 12 3 3 5-6"/></>,
    };
    return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
  };

  const markdownComponents = {
    table: ({ children }) => <div className="learning-table-wrap"><table>{children}</table></div>,
  };

  return (
    <div className="learning-shell">
      <StudentLayout isDarkMode={isDarkMode} onToggleTheme={toggleDarkMode} onLogout={handleLogout} />

      <aside className={`learning-history ${isChatSidebarOpen ? '' : 'learning-history-closed'}`} aria-label="Conversation history">
        <div className="learning-history-head">
          <div className="learning-history-title">Your conversations</div>
          <button type="button" className="learning-new-chat" onClick={handleNewChat}><Icon name="plus" size={18}/> New chat</button>
        </div>
        <div className="learning-history-list">
          {chatHistory.length === 0 && <div className="learning-history-empty">Your previous study conversations will appear here.</div>}
          {chatHistory.map(chat => (
            <button type="button" key={chat.session_id} className={`learning-history-entry ${sessionId === chat.session_id ? 'selected' : ''}`} onClick={() => handleOpenChat(chat.session_id)}>
              <span className="learning-history-entry-title">{chat.title || 'New conversation'}</span>
              <span className="learning-history-entry-date">{chat.created_at ? new Date(chat.created_at).toLocaleDateString() : ''}</span>
            </button>
          ))}
        </div>
      </aside>

      <main className="learning-main">
        <header className="learning-topbar">
          <div className="learning-topbar-left">
            <button type="button" className="learning-icon-button" onClick={() => setIsChatSidebarOpen(open => !open)} aria-label={isChatSidebarOpen ? 'Hide conversations' : 'Show conversations'} title="Toggle conversation history"><Icon name="panel"/></button>
            <div><h1>Learning assistant</h1><p>Explore clinical concepts at your own pace</p></div>
          </div>
          <div className="learning-user"><span className="learning-user-avatar">{user?.name?.charAt(0) || 'S'}</span><span className="learning-user-name">{user?.name || 'Student'}</span></div>
        </header>

        <section className="learning-messages" ref={messageScrollRef} aria-label="Chat messages">
          {messages.length === 0 ? (
            <div className="learning-welcome">
              <div className="learning-welcome-mark">✦</div>
              <div className="learning-eyebrow">YOUR PERSONAL STUDY SPACE</div>
              <h2>What would you like to learn today?</h2>
              <p>Ask about health assessment, clinical reasoning, or patient care. Start with a question below or write your own.</p>
              <div className="learning-suggestions">
                {suggestedQuestions.map(question => <button type="button" key={question} onClick={() => handleSuggestedQuestion(question)} disabled={isLoading}>{question}<span aria-hidden="true">↗</span></button>)}
              </div>
            </div>
          ) : (
            <div className="learning-conversation">
              {messages.map(message => (
                <article key={message.id} className={`learning-message learning-message-${message.type}`}>
                  {message.type === 'ai' && <div className="learning-ai-avatar">✦</div>}
                  <div className="learning-message-body">
                    <div className="learning-bubble" dir={message.type === 'ai' && message.showArabic ? 'rtl' : 'auto'}>
                      <div className="learning-markdown"><ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{message.type === 'ai' && message.showArabic && message.arabicContent ? message.arabicContent : message.content}</ReactMarkdown></div>
                    </div>
                    {message.type === 'ai' && <>
                      <div className="learning-message-actions">
                        <button type="button" onClick={() => handleTranslateMessage(message.id)} disabled={translatingMessageId === message.id}>{translatingMessageId === message.id ? 'Translating…' : message.showArabic ? 'Show original (English)' : 'Translate to Arabic'}</button>
                        {message.timestamp && <span>{message.timestamp}</span>}
                      </div>
                      {message.sources?.length > 0 && <div className="learning-sources"><strong>Textbook sources</strong><div>{[...new Map(message.sources.map(source => [source.page, source])).values()].map((source, index) => <span key={`${source.page}-${index}`}>Page {source.page}</span>)}</div></div>}
                    </>}
                    {message.type === 'user' && message.timestamp && <div className="learning-user-time">{message.timestamp}</div>}
                  </div>
                </article>
              ))}
              {isLoading && <div className="learning-message learning-message-ai"><div className="learning-ai-avatar">✦</div><div className="learning-typing" aria-label="Assistant is responding"><span/><span/><span/></div></div>}
              <div ref={messagesEndRef}/>
            </div>
          )}
        </section>

        <footer className="learning-composer-wrap">
          <form className="learning-composer" onSubmit={e => { e.preventDefault(); handleSendMessage(inputMessage); }}>
            <label htmlFor="learning-question" className="learning-sr-only">Ask a health assessment question</label>
            <input id="learning-question" type="text" value={inputMessage} onChange={e => setInputMessage(e.target.value)} placeholder="Ask anything about health assessment…" disabled={isLoading}/>
            <button type="submit" disabled={isLoading || !inputMessage.trim()} aria-label="Send message"><Icon name="send" size={19}/><span>Send</span></button>
          </form>
          <p>Answers are based on the approved health assessment textbook. Verify important clinical information.</p>
        </footer>
      </main>
    </div>
  );
};

export default StudentLearning;
