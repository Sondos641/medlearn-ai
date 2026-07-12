import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/Logo 2 without background.png';

const StudentLearning = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: generateAIResponse(message),
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000 + Math.random() * 1000);
  };

  // Temporary mock response generator (replace with actual API)
  const generateAIResponse = (question) => {
    const responses = {
      'health history': 'A health history interview is a systematic collection of subjective data about a patient\'s current health status, past medical history, family history, and lifestyle factors. It serves as the foundation for the nursing assessment and helps identify actual and potential health problems.\n\nThe interview typically includes:\n- Biographical data\n- Chief complaint\n- History of present illness\n- Past medical history\n- Family history\n- Social history\n- Review of systems',
      
      'subjective': 'Subjective data are information provided by the patient about their symptoms, feelings, and experiences. This includes what the patient tells you about their pain, fatigue, anxiety, or any other symptoms.\n\nObjective data, on the other hand, are measurable findings you obtain through physical examination, such as:\n- Vital signs\n- Laboratory results\n- Physical observations\n- Diagnostic test results\n\nBoth subjective and objective data are essential for a complete health assessment.',
      
      'respiratory': 'Respiratory assessment involves four main techniques:\n\n1. Inspection: Observe breathing pattern, rate, depth, effort, and use of accessory muscles\n2. Palpation: Feel for tactile fremitus, masses, or tenderness\n3. Percussion: Tap to assess underlying structures and identify areas of dullness or hyperresonance\n4. Auscultation: Listen to breath sounds:\n   - Vesicular: Soft, low-pitched, heard over most lung fields\n   - Bronchial: Loud, high-pitched, heard over trachea\n   - Bronchovesicular: Medium pitch, heard over major bronchi\n\nAdventitious sounds include crackles, wheezes, rhonchi, and pleural friction rubs.',
      
      'vital signs': 'Normal adult vital signs:\n\n• Temperature: 36.5-37.2°C (97.7-99.0°F)\n• Pulse: 60-100 beats per minute\n• Respirations: 12-20 breaths per minute\n• Blood Pressure: 90/60 - 120/80 mmHg\n• SpO2: 95-100%\n\nVital signs provide baseline data and help identify changes in the patient\'s condition. Always assess vital signs in a systematic manner and document any abnormalities.',
      
      'glasgow': 'The Glasgow Coma Scale (GCS) is a neurological scale used to assess level of consciousness.\n\nComponents:\n1. Eye Opening (E):\n   - 4 = Spontaneous\n   - 3 = To speech\n   - 2 = To pain\n   - 1 = None\n\n2. Verbal Response (V):\n   - 5 = Oriented\n   - 4 = Confused\n   - 3 = Inappropriate words\n   - 2 = Incomprehensible sounds\n   - 1 = None\n\n3. Motor Response (M):\n   - 6 = Obeys commands\n   - 5 = Localizes pain\n   - 4 = Withdraws from pain\n   - 3 = Flexion (decorticate)\n   - 2 = Extension (decerebrate)\n   - 1 = None\n\nTotal score: 3 (deep coma) to 15 (fully conscious). Score ≤ 8 indicates severe head injury.'
    };

    const lowerQuestion = question.toLowerCase();
    for (const [key, response] of Object.entries(responses)) {
      if (lowerQuestion.includes(key)) {
        return response;
      }
    }
    return `I understand you're asking about "${question}". Based on the health assessment textbook, I can explain this topic in detail.\n\nCould you please be more specific about what aspect you'd like to learn about? I can provide information about:\n• Assessment techniques\n• Normal and abnormal findings\n• Anatomy and physiology\n• Clinical reasoning\n• Patient communication\n\nWhat would you like to focus on?`;
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <img 
                src={logo} 
                alt="MedLearn AI Logo" 
                style={{ width: '80px', height: '80px', objectFit: 'contain' }}
              />
            </div>
            <span style={{ fontWeight: 600, fontSize: '18px', color: 'var(--text)' }}>MedLearn AI</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className="sidebar-item" 
            onClick={() => navigate('/student/dashboard')}
          >
            Dashboard
          </button>
          <button className="sidebar-item active">Learning</button>
          <button className="sidebar-item">Practice</button>
          <button className="sidebar-item">Evaluation</button>
          <button className="sidebar-item">Progress</button>
        </nav>

        <div style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px' }}>
          <div className="flex-between" style={{ marginBottom: '16px' }}>
            <span className="text-body">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            <button onClick={toggleDarkMode} style={{ padding: '8px', borderRadius: '8px', background: 'var(--background)', border: 'none', cursor: 'pointer' }}>
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
          <div className="flex-between">
            <span className="text-body" style={{ color: 'var(--error)' }}>Logout</span>
            <button onClick={handleLogout} style={{ padding: '8px', borderRadius: '8px', background: 'var(--error)', border: 'none', cursor: 'pointer', color: 'white' }}>
              🚪
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - ChatGPT Style */}
      <div className="main-content" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* Header */}
        <div style={{ 
          padding: '20px 32px', 
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--cards)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div>
            <h1 className="h1" style={{ fontSize: '24px' }}>Model Learning</h1>
            <p className="text-body">Ask questions and explore health assessment concepts freely</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              {user?.name || 'Student'}
            </span>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold'
            }}>
              {user?.name?.charAt(0) || 'S'}
            </div>
          </div>
        </div>

        {/* Chat Messages Area */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '24px 32px',
          backgroundColor: 'var(--background)'
        }}>
          {messages.length === 0 ? (
            // Welcome Screen
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              maxWidth: '800px',
              margin: '0 auto',
              textAlign: 'center'
            }}>
              <div style={{ 
                fontSize: '48px', 
                marginBottom: '24px'
              }}>
                🧠
              </div>
              <h2 style={{ 
                fontSize: '28px', 
                fontWeight: 700, 
                color: 'var(--text)',
                marginBottom: '12px'
              }}>
                Model Learning
              </h2>
              <p style={{ 
                fontSize: '16px', 
                color: 'var(--text-secondary)',
                maxWidth: '500px',
                marginBottom: '32px'
              }}>
                Ask me anything about health assessment techniques, normal and abnormal findings, anatomy, physiology, or clinical reasoning. I'm here to explain and guide your learning.
              </p>
              
              {/* Suggested Questions */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '12px',
                width: '100%',
                maxWidth: '700px'
              }}>
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(question)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--cards)',
                      color: 'var(--text)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      textAlign: 'left',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary)';
                      e.currentTarget.style.backgroundColor = 'var(--background)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.backgroundColor = 'var(--cards)';
                    }}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Messages
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    display: 'flex',
                    justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                    marginBottom: '16px'
                  }}
                >
                  <div
                    style={{
                      maxWidth: '70%',
                      padding: '12px 16px',
                      borderRadius: message.type === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                      backgroundColor: message.type === 'user' ? 'var(--primary)' : 'var(--cards)',
                      color: message.type === 'user' ? 'white' : 'var(--text)',
                      border: message.type === 'ai' ? '1px solid var(--border)' : 'none',
                      wordWrap: 'break-word'
                    }}
                  >
                    <div style={{ 
                      fontSize: '14px', 
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {message.content}
                    </div>
                    <div style={{
                      fontSize: '10px',
                      marginTop: '6px',
                      opacity: 0.6,
                      color: message.type === 'user' ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)',
                      textAlign: 'right'
                    }}>
                      {message.timestamp}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Loading Indicator */}
              {isLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px 12px 12px 4px',
                      backgroundColor: 'var(--cards)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span style={{ 
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary)',
                      animation: 'bounce 1.4s infinite ease-in-out both'
                    }} />
                    <span style={{ 
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary)',
                      animation: 'bounce 1.4s infinite ease-in-out both',
                      animationDelay: '0.16s'
                    }} />
                    <span style={{ 
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary)',
                      animation: 'bounce 1.4s infinite ease-in-out both',
                      animationDelay: '0.32s'
                    }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div style={{ 
          padding: '16px 32px', 
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--cards)',
          flexShrink: 0
        }}>
          <div style={{ 
            display: 'flex', 
            gap: '12px',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
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
                fontFamily: 'Inter, sans-serif'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            />
            <button
              onClick={() => handleSendMessage(inputMessage)}
              disabled={isLoading || !inputMessage.trim()}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: 'var(--primary)',
                color: 'white',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                opacity: isLoading || !inputMessage.trim() ? 0.5 : 1,
                fontSize: '14px',
                whiteSpace: 'nowrap'
              }}
            >
              Send
            </button>
          </div>
          <div style={{ 
            maxWidth: '800px',
            margin: '8px auto 0',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            textAlign: 'center'
          }}>
            All responses are grounded in the approved health assessment textbook
          </div>
        </div>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default StudentLearning;