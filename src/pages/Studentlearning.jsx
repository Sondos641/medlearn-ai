import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, NavLink } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import logo from '../assets/Logo 2 without background.png';


const StudentLearning = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [translatingMessageId, setTranslatingMessageId] = useState(null);

  const [suggestedQuestions, setSuggestedQuestions] = useState([
    'What is the purpose of a health history interview?',
    'Explain the difference between subjective and objective data',
    'How do I assess the respiratory system?',
    'What are normal vital signs for an adult?',
    'Explain the Glasgow Coma Scale',
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';

    setIsDarkMode(isDark);

    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
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
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message.content }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      if (!data.translation) throw new Error('No translation returned');

      setMessages((prev) =>
        prev.map((item) =>
          item.id === messageId
            ? { ...item, arabicContent: data.translation, showArabic: true }
            : item
        )
      );
    } catch (error) {
      console.error('Error translating response:', error);
      alert('Sorry, the Arabic translation could not be loaded. Please try again.');
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

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <div style={{ marginBottom: '32px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={logo}
                alt="MedLearn AI Logo"
                style={{
                  width: '80px',
                  height: '80px',
                  objectFit: 'contain',
                }}
              />
            </div>

            <span
              style={{
                fontWeight: 600,
                fontSize: '18px',
                color: 'var(--text)',
              }}
            >
              MedLearn AI
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
  <NavLink
    to="/student/dashboard"
    className={({ isActive }) =>
      `sidebar-item ${isActive ? 'active' : ''}`
    }
  >
    Dashboard
  </NavLink>

  <NavLink
    to="/student/learning"
    className={({ isActive }) =>
      `sidebar-item ${isActive ? 'active' : ''}`
    }
  >
    Learning
  </NavLink>

  <button className="sidebar-item">Practice</button>
  <button className="sidebar-item">Evaluation</button>
  <button className="sidebar-item">Progress</button>
</nav>

        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '24px',
            right: '24px',
          }}
        >
          <div
            className="flex-between"
            style={{ marginBottom: '16px' }}
          >
            <span className="text-body">
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </span>

            <button
              onClick={toggleDarkMode}
              style={{
                padding: '8px',
                borderRadius: '8px',
                background: 'var(--background)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>

          <div className="flex-between">
            <span
              className="text-body"
              style={{ color: 'var(--error)' }}
            >
              Logout
            </span>

            <button
              onClick={handleLogout}
              style={{
                padding: '8px',
                borderRadius: '8px',
                background: 'var(--error)',
                border: 'none',
                cursor: 'pointer',
                color: 'white',
              }}
            >
              🚪
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className="main-content"
        style={{
          padding: '0',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 32px',
            borderBottom: '1px solid var(--border)',
            backgroundColor: 'var(--cards)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <div>
            <h1
              className="h1"
              style={{ fontSize: '24px' }}
            >
              Model Learning
            </h1>

            <p className="text-body">
              Ask questions and explore health assessment concepts freely
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
              }}
            >
              {user?.name || 'Student'}
            </span>

            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
              }}
            >
              {user?.name?.charAt(0) || 'S'}
            </div>
          </div>
        </div>

        {/* Chat Messages Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 32px',
            backgroundColor: 'var(--background)',
          }}
        >
          {messages.length === 0 ? (
            // Welcome Screen
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                maxWidth: '800px',
                margin: '0 auto',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '48px',
                  marginBottom: '24px',
                }}
              >
                🧠
              </div>

              <h2
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: 'var(--text)',
                  marginBottom: '12px',
                }}
              >
                Model Learning
              </h2>

              <p
                style={{
                  fontSize: '16px',
                  color: 'var(--text-secondary)',
                  maxWidth: '500px',
                  marginBottom: '32px',
                }}
              >
                Ask me anything about health assessment techniques,
                normal and abnormal findings, anatomy, physiology, or
                clinical reasoning. I'm here to explain and guide your
                learning.
              </p>

              {/* Suggested Questions */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '12px',
                  width: '100%',
                  maxWidth: '700px',
                }}
              >
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      handleSuggestedQuestion(question)
                    }
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--cards)',
                      color: 'var(--text)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor =
                        'var(--primary)';
                      e.currentTarget.style.backgroundColor =
                        'var(--background)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor =
                        'var(--border)';
                      e.currentTarget.style.backgroundColor =
                        'var(--cards)';
                    }}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Messages
            <div
              style={{
                maxWidth: '800px',
                margin: '0 auto',
              }}
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    display: 'flex',
                    justifyContent:
                      message.type === 'user'
                        ? 'flex-end'
                        : 'flex-start',
                    marginBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      maxWidth:
                        message.type === 'ai'
                          ? '90%'
                          : '70%',
                      padding: '12px 16px',
                      borderRadius:
                        message.type === 'user'
                          ? '12px 12px 4px 12px'
                          : '12px 12px 12px 4px',
                      backgroundColor:
                        message.type === 'user'
                          ? 'var(--primary)'
                          : 'var(--cards)',
                      color:
                        message.type === 'user'
                          ? 'white'
                          : 'var(--text)',
                      border:
                        message.type === 'ai'
                          ? '1px solid var(--border)'
                          : 'none',
                      wordWrap: 'break-word',
                      overflowX: 'auto',
                    }}
                  >
                    {message.type === 'user' ? (
                      <div 
  className="markdown-content"
  style={{ 
    fontSize: '14px', 
    lineHeight: '1.6'
  }}
>
  <ReactMarkdown remarkPlugins={[remarkGfm]}>
    {message.content}
  </ReactMarkdown>
</div>
                    ) : (
                      <div
                        dir={message.showArabic ? 'rtl' : 'ltr'}
                        style={{
                          fontSize: '14px',
                          lineHeight: '1.6',
                          textAlign: message.showArabic ? 'right' : 'left',
                        }}
                      >
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => (
                              <p
                                style={{
                                  marginTop: '0',
                                  marginBottom: '12px',
                                }}
                              >
                                {children}
                              </p>
                            ),

                            h1: ({ children }) => (
                              <h1
                                style={{
                                  fontSize: '20px',
                                  marginTop: '16px',
                                  marginBottom: '10px',
                                }}
                              >
                                {children}
                              </h1>
                            ),

                            h2: ({ children }) => (
                              <h2
                                style={{
                                  fontSize: '18px',
                                  marginTop: '16px',
                                  marginBottom: '10px',
                                }}
                              >
                                {children}
                              </h2>
                            ),

                            h3: ({ children }) => (
                              <h3
                                style={{
                                  fontSize: '16px',
                                  marginTop: '14px',
                                  marginBottom: '8px',
                                }}
                              >
                                {children}
                              </h3>
                            ),

                            ul: ({ children }) => (
                              <ul
                                style={{
                                  marginTop: '6px',
                                  marginBottom: '12px',
                                  paddingLeft: '22px',
                                }}
                              >
                                {children}
                              </ul>
                            ),

                            ol: ({ children }) => (
                              <ol
                                style={{
                                  marginTop: '6px',
                                  marginBottom: '12px',
                                  paddingLeft: '22px',
                                }}
                              >
                                {children}
                              </ol>
                            ),

                            li: ({ children }) => (
                              <li
                                style={{
                                  marginBottom: '5px',
                                }}
                              >
                                {children}
                              </li>
                            ),

                            table: ({ children }) => (
                              <div
                                style={{
                                  overflowX: 'auto',
                                  marginTop: '12px',
                                  marginBottom: '12px',
                                  width: '100%',
                                }}
                              >
                                <table
                                  style={{
                                    borderCollapse: 'collapse',
                                    width: '100%',
                                    minWidth: '500px',
                                    fontSize: '13px',
                                  }}
                                >
                                  {children}
                                </table>
                              </div>
                            ),

                            th: ({ children }) => (
                              <th
                                style={{
                                  border:
                                    '1px solid var(--border)',
                                  padding: '8px 10px',
                                  backgroundColor:
                                    'var(--background)',
                                  fontWeight: 600,
                                  textAlign: 'left',
                                }}
                              >
                                {children}
                              </th>
                            ),

                            td: ({ children }) => (
                              <td
                                style={{
                                  border:
                                    '1px solid var(--border)',
                                  padding: '8px 10px',
                                  verticalAlign: 'top',
                                }}
                              >
                                {children}
                              </td>
                            ),

                            blockquote: ({ children }) => (
                              <blockquote
                                style={{
                                  borderLeft:
                                    '3px solid var(--primary)',
                                  margin:
                                    '12px 0',
                                  paddingLeft:
                                    '12px',
                                  color:
                                    'var(--text-secondary)',
                                }}
                              >
                                {children}
                              </blockquote>
                            ),

                            code: ({ children }) => (
                              <code
                                style={{
                                  backgroundColor:
                                    'var(--background)',
                                  padding: '2px 5px',
                                  borderRadius: '4px',
                                  fontSize: '13px',
                                }}
                              >
                                {children}
                              </code>
                            ),

                            strong: ({ children }) => (
                              <strong
                                style={{
                                  fontWeight: 700,
                                }}
                              >
                                {children}
                              </strong>
                            ),
                          }}
                        >
                          {message.showArabic && message.arabicContent
                            ? message.arabicContent
                            : message.content}
                        </ReactMarkdown>

                        <button
                          onClick={() => handleTranslateMessage(message.id)}
                          disabled={translatingMessageId === message.id}
                          style={{
                            marginTop: '8px',
                            padding: '7px 10px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--background)',
                            color: 'var(--text)',
                            cursor: translatingMessageId === message.id ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                            opacity: translatingMessageId === message.id ? 0.6 : 1,
                          }}
                        >
                          {translatingMessageId === message.id
                            ? 'Translating...'
                            : message.showArabic
                            ? '🌐 Show Original (English)'
                            : '🌐 Translate to Arabic'}
                        </button>

                        {/* Sources */}
                        {message.sources &&
                          message.sources.length > 0 && (
                            <div
                              style={{
                                marginTop: '14px',
                                paddingTop: '10px',
                                borderTop:
                                  '1px solid var(--border)',
                                fontSize: '11px',
                                color:
                                  'var(--text-secondary)',
                              }}
                            >
                              <div
                                style={{
                                  fontWeight: 600,
                                  marginBottom: '5px',
                                }}
                              >
                                Textbook sources
                              </div>

                              <div
                                style={{
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  gap: '6px',
                                }}
                              >
                                {[
                                  ...new Map(
                                    message.sources.map(
                                      (source) => [
                                        source.page,
                                        source,
                                      ]
                                    )
                                  ).values(),
                                ].map((source, index) => (
                                  <span
                                    key={index}
                                    style={{
                                      padding:
                                        '3px 7px',
                                      borderRadius:
                                        '6px',
                                      backgroundColor:
                                        'var(--background)',
                                      border:
                                        '1px solid var(--border)',
                                    }}
                                  >
                                    Page {source.page}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    )}

                    <div
                      style={{
                        fontSize: '10px',
                        marginTop: '6px',
                        opacity: 0.6,
                        color:
                          message.type === 'user'
                            ? 'rgba(255,255,255,0.7)'
                            : 'var(--text-secondary)',
                        textAlign: 'right',
                      }}
                    >
                      {message.timestamp}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    marginBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius:
                        '12px 12px 12px 4px',
                      backgroundColor: 'var(--cards)',
                      border:
                        '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor:
                          'var(--primary)',
                        animation:
                          'bounce 1.4s infinite ease-in-out both',
                      }}
                    />

                    <span
                      style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor:
                          'var(--primary)',
                        animation:
                          'bounce 1.4s infinite ease-in-out both',
                        animationDelay: '0.16s',
                      }}
                    />

                    <span
                      style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor:
                          'var(--primary)',
                        animation:
                          'bounce 1.4s infinite ease-in-out both',
                        animationDelay: '0.32s',
                      }}
                    />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div
          style={{
            padding: '16px 32px',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--cards)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '12px',
              maxWidth: '800px',
              margin: '0 auto',
            }}
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) =>
                setInputMessage(e.target.value)
              }
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about health assessment..."
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--background)',
                color: 'var(--text)',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
                fontFamily: 'Inter, sans-serif',
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor =
                  'var(--primary)')
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor =
                  'var(--border)')
              }
            />

            <button
              onClick={() =>
                handleSendMessage(inputMessage)
              }
              disabled={
                isLoading || !inputMessage.trim()
              }
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: 'var(--primary)',
                color: 'white',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                opacity:
                  isLoading || !inputMessage.trim()
                    ? 0.5
                    : 1,
                fontSize: '14px',
                whiteSpace: 'nowrap',
              }}
            >
              Send
            </button>
          </div>

          <div
            style={{
              maxWidth: '800px',
              margin: '8px auto 0',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              textAlign: 'center',
            }}
          >
            All responses are grounded in the approved health
            assessment textbook
          </div>
        </div>
      </div>

      {/* Animation styles */}
      <style>{`
  .markdown-content {
    color: var(--text);
  }

  .markdown-content p {
    margin: 0 0 12px 0;
  }

  .markdown-content p:last-child {
    margin-bottom: 0;
  }

  .markdown-content strong {
    font-weight: 700;
  }

  .markdown-content ul,
  .markdown-content ol {
    margin: 8px 0 12px 20px;
    padding-left: 20px;
  }

  .markdown-content li {
    margin-bottom: 6px;
  }

  .markdown-content table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 13px;
    background: var(--cards);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
  }

  .markdown-content th {
    text-align: left;
    font-weight: 600;
    padding: 12px;
    background: var(--background);
    border: 1px solid var(--border);
  }

  .markdown-content td {
    padding: 12px;
    vertical-align: top;
    border: 1px solid var(--border);
  }

  .markdown-content tr:hover {
    background: var(--background);
  }

  .markdown-content code {
    padding: 2px 5px;
    border-radius: 4px;
    background: var(--background);
    font-size: 13px;
  }

  @keyframes bounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
  }
`}</style>
    </div>
  );
};

export default StudentLearning;