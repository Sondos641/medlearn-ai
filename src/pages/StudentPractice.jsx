import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import logo from '../assets/Logo 2 without background.png';
const StudentPractice = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activities, setActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState('');
  const [activeTab, setActiveTab] = useState('conversation');
  const [inputMessage, setInputMessage] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  // Patient data returned by the Flask backend.
  const [patient, setPatient] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [practiceError, setPracticeError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef(null);
  const autoSpeakRef = useRef(false);
  const speechTokenRef = useRef(0);

  const stopSpeaking = () => {
    speechTokenRef.current += 1;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const speakPatient = (text) => {
    if (!('speechSynthesis' in window)) {
      setVoiceError('Text-to-speech is not supported in this browser.');
      return;
    }
    stopSpeaking();
    if (!text) return;
    const token = speechTokenRef.current;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    utterance.onstart = () => { if (token === speechTokenRef.current) setIsSpeaking(true); };
    utterance.onend = () => { if (token === speechTokenRef.current) setIsSpeaking(false); };
    utterance.onerror = (event) => {
      if (token === speechTokenRef.current) {
        setIsSpeaking(false);
        if (event.error !== 'canceled' && event.error !== 'interrupted') {
          setVoiceError('Patient audio could not be played.');
        }
      }
    };
    window.speechSynthesis.speak(utterance);
  };

  const stopListening = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) { stopListening(); return; }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceError('Speech recognition is unavailable. Try Chrome or Edge.');
      return;
    }
    stopSpeaking();
    setVoiceError('');
    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage((previous) => [previous.trim(), transcript.trim()].filter(Boolean).join(' '));
    };
    recognition.onerror = (event) => {
      if (event.error !== 'aborted') setVoiceError(`Microphone: ${event.error}. Check browser permissions.`);
      setIsListening(false);
    };
    recognition.onend = () => { setIsListening(false); recognitionRef.current = null; };
    try { recognition.start(); setIsListening(true); }
    catch { setVoiceError('Could not start microphone recognition.'); setIsListening(false); }
  };

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);
  useEffect(() => {
    const resumeSessionId = location.state?.resumeSessionId;
  
    if (resumeSessionId && user?.id) {
      handleResumePractice(resumeSessionId);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.resumeSessionId, user?.id]);

  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [assessmentError, setAssessmentError] = useState('');
  const [sessionStage, setSessionStage] = useState('simulation');
  const [report, setReport] = useState({
    interview_summary: '',
    physical_findings: '',
    identified_problems: '',
    supporting_evidence: '',
    referral_decision: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [resultTab, setResultTab] = useState('missed');
  // Dark Mode
  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(isDark);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Fetch student's recent practice activities
  useEffect(() => {
    if (!user?.id) return;

    const fetchActivities = async () => {
      try {
        setActivityLoading(true);
        setActivityError('');

        const response = await fetch(
          `http://127.0.0.1:5000/student/${user.id}/activity`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load activities');
        }

        setActivities(data.activities || []);
      } catch (error) {
        setActivityError(error.message);
      } finally {
        setActivityLoading(false);
      }
    };

    fetchActivities();
  }, [user?.id]);
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


const handleResumePractice = async (resumeSessionId) => {
  setIsGenerating(true);
  setPracticeError('');

  try {
    const response = await fetch(
      `http://127.0.0.1:5000/student/${user.id}/practice/${resumeSessionId}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to resume practice session');
    }

    setPatient({
      name: data.patient.name,
      age: data.patient.age,
      sex: data.patient.sex,
      occupation: data.patient.occupation,
      setting: data.patient.setting,
      chiefComplaint: data.patient.chief_complaint,
    });

    setSessionId(data.session_id);
    setSelectedDifficulty(data.difficulty);

    setMessages(
      data.conversation_history.map((message, index) => ({
        id: `resumed-${index}`,
        type: message.role === 'student' ? 'student' : 'patient',
        content: message.content,
      }))
    );

    setAssessmentHistory(data.assessment_history || []);
    setReport(data.student_report || {
      interview_summary: '',
      physical_findings: '',
      identified_problems: '',
      supporting_evidence: '',
      referral_decision: '',
    });

    setEvaluation(data.evaluation);
    setSessionStage('simulation');
    setActiveTab('conversation');
    setSessionStarted(true);

  } catch (error) {
    console.error('RESUME PRACTICE ERROR:', error);
    setPracticeError(error.message || 'Could not resume practice session.');
  } finally {
    setIsGenerating(false);
  }
};


  const handleStartPractice = async () => {
    if (!selectedDifficulty) return;
    setIsGenerating(true);
    setPracticeError('');
    try {
      const response = await fetch('http://127.0.0.1:5000/practice/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: 'cardiovascular',
          difficulty: selectedDifficulty,
          user_id: user?.id,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate patient case');
      }
      setPatient({
        name: data.patient.name,
        age: data.patient.age,
        sex: data.patient.sex,
        occupation: data.patient.occupation,
        setting: data.patient.setting,
        chiefComplaint: data.patient.chief_complaint,
      });
      setSessionId(data.session_id);
      stopListening();
      stopSpeaking();
      setVoiceError('');
      setMessages([]);
      setAssessmentHistory([]);
      setActiveAssessment(null);
      setAssessmentError('');
      setSessionStage('simulation');
      setReport({
        interview_summary: '',
        physical_findings: '',
        identified_problems: '',
        supporting_evidence: '',
        referral_decision: '',
      });
      setEvaluation(null);
      setSubmitError('');
      setActiveTab('conversation');
      setSessionStarted(true);
    } catch (error) {
      console.error('PRACTICE START ERROR:', error);
      setPracticeError(error.message || 'Could not start the practice session.');
    } finally {
      setIsGenerating(false);
    }
  };
  const handleSendMessage = async () => {
    const messageText = inputMessage.trim();
    if (!messageText || !sessionId || isSending) return;
    stopListening();
    stopSpeaking();
    setMessages((prev) => [
      ...prev,
      { id: `student-${Date.now()}`, type: 'student', content: messageText },
    ]);
    setInputMessage('');
    setIsSending(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/practice/${sessionId}/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: messageText }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get a patient response');
      }
      setMessages((prev) => [
        ...prev,
        { id: `patient-${Date.now()}`, type: 'patient', content: data.reply },
      ]);
      if (autoSpeakRef.current) speakPatient(data.reply);
    } catch (error) {
      console.error('PRACTICE CHAT ERROR:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          type: 'patient',
          content: 'Sorry, I could not respond right now. Please try again.',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isSending) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  const physicalActions = [
    { id: '1', label: 'Inspect Precordium', icon: '👁️' },
    { id: '2', label: 'Palpate Apex Beat', icon: '🖐️' },
    { id: '3', label: 'Check LV Heave', icon: '🖐️' },
    { id: '4', label: 'Check Thrills', icon: '🖐️' },
    { id: '5', label: 'Auscultate Heart with Diaphragm', icon: '🩺' },
    { id: '6', label: 'Auscultate Apex with Bell', icon: '🩺' },
    { id: '7', label: 'Assess JVP at 45°', icon: '👁️' },
    { id: '8', label: 'Auscultate Carotids', icon: '🩺' },
    { id: '9', label: 'Inspect Upper Extremities', icon: '👁️' },
    { id: '10', label: 'Palpate Upper Pulses', icon: '🖐️' },
    { id: '11', label: 'Inspect Lower Extremities', icon: '👁️' },
    { id: '12', label: 'Palpate Lower Pulses', icon: '🖐️' },
    { id: '13', label: 'Assess & Grade Edema', icon: '🦵' },
    { id: '14', label: 'Upper Capillary Refill', icon: '🖐️' },
    { id: '15', label: 'Lower Capillary Refill', icon: '🦶' },
  ];

  const handlePhysicalAssessment = async (action) => {
    if (!sessionId || activeAssessment) return;

    setActiveAssessment(action.id);
    setAssessmentError('');

    try {
      const response = await fetch(
        `http://127.0.0.1:5000/practice/${sessionId}/assessment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: action.id }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to perform assessment');
      }

      setAssessmentHistory((prev) => [
        ...prev,
        { ...data.assessment, id: `${action.id}-${Date.now()}` },
      ]);
    } catch (error) {
      console.error('PHYSICAL ASSESSMENT ERROR:', error);
      setAssessmentError(error.message || 'Could not perform this assessment.');
    } finally {
      setActiveAssessment(null);
    }
  };

  const handleEndSession = () => {
    stopListening();
    stopSpeaking();
    setSubmitError('');
    setSessionStage('report');
  };

  const handleReportChange = (field, value) => {
    setReport((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitReport = async () => {
    const allCompleted = Object.values(report).every((value) => value.trim());
    if (!allCompleted || !sessionId || isSubmitting) {
      if (!allCompleted) setSubmitError('Please complete every report field.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch(
        `http://127.0.0.1:5000/practice/${sessionId}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ report }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Evaluation failed');
      setEvaluation(data.evaluation);
      setSessionStage('result');
    } catch (error) {
      console.error('PRACTICE SUBMIT ERROR:', error);
      setSubmitError(error.message || 'Could not evaluate this session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewSession = () => {
    stopListening();
    stopSpeaking();
    setVoiceError('');
    setSessionStarted(false);
    setSessionId(null);
    setPatient(null);
    setMessages([]);
    setAssessmentHistory([]);
    setSelectedDifficulty(null);
    setSessionStage('simulation');
    setEvaluation(null);
    setSubmitError('');
    setReport({
      interview_summary: '',
      physical_findings: '',
      identified_problems: '',
      supporting_evidence: '',
      referral_decision: '',
    });
  };

  const feedback = evaluation?.feedback || {};

  return (
    <div className="dashboard">
      {/* ================= SIDEBAR ================= */}
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
          <NavLink
            to="/student/practice"
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'active' : ''}`
            }
          >
            Practice
          </NavLink>
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
          <div className="flex-between" style={{ marginBottom: '16px' }}>
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
              style={{
                color: 'var(--error)',
              }}
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
      {/* ================= MAIN CONTENT ================= */}
      <div
        className="main-content"
        style={{
          padding: '0',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* HEADER */}
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
              style={{
                fontSize: '24px',
              }}
            >
              Practice Simulation
            </h1>
            <p className="text-body">
              Cardiovascular Physical Assessment
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
        {/* PAGE CONTENT */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 32px',
            backgroundColor: 'var(--background)',
          }}
        >
          <div
            style={{
              maxWidth: '1100px',
              margin: '0 auto',
            }}
          >
            {!sessionStarted ? (
              <div
                style={{
                  minHeight: 'calc(100vh - 150px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ width: '100%', maxWidth: '900px', textAlign: 'center' }}>
                  <div style={{ fontSize: '46px', marginBottom: '16px' }}>🩺</div>
                  <h2 style={{ fontSize: '28px', color: 'var(--text)', margin: '0 0 8px' }}>
                    Start a Practice Session
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '15px', margin: '0 0 36px' }}>
                    Choose a difficulty level for your cardiovascular patient case.
                  </p>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '18px',
                      marginBottom: '32px',
                    }}
                  >
                    {[
                      {
                        id: 'easy',
                        icon: '🌱',
                        title: 'Easy',
                        description: 'Clear symptoms and straightforward assessment findings.',
                      },
                      {
                        id: 'medium',
                        icon: '🩺',
                        title: 'Medium',
                        description: 'A more detailed case requiring clinical reasoning.',
                      },
                      {
                        id: 'hard',
                        icon: '🔥',
                        title: 'Hard',
                        description: 'A challenging presentation with subtle and complex findings.',
                      },
                    ].map((level) => {
                      const selected = selectedDifficulty === level.id;
                      return (
                        <button
                          key={level.id}
                          onClick={() => setSelectedDifficulty(level.id)}
                          style={{
                            padding: '28px 20px',
                            borderRadius: '16px',
                            border: selected
                              ? '2px solid var(--primary)'
                              : '1px solid var(--border)',
                            backgroundColor: selected
                              ? 'rgba(59, 130, 246, 0.08)'
                              : 'var(--cards)',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.2s ease',
                            transform: selected ? 'translateY(-3px)' : 'none',
                            boxShadow: selected
                              ? '0 8px 24px rgba(0, 0, 0, 0.08)'
                              : 'none',
                          }}
                        >
                          <div style={{ fontSize: '38px', marginBottom: '14px' }}>
                            {level.icon}
                          </div>
                          <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: 'var(--text)' }}>
                            {level.title}
                          </h3>
                          <p
                            style={{
                              margin: 0,
                              fontSize: '13px',
                              lineHeight: '1.6',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            {level.description}
                          </p>
                          {selected && (
                            <div
                              style={{
                                marginTop: '16px',
                                color: 'var(--primary)',
                                fontSize: '13px',
                                fontWeight: 600,
                              }}
                            >
                              ✓ Selected
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={handleStartPractice}
                    disabled={!selectedDifficulty || isGenerating}
                    style={{
                      minWidth: '220px',
                      padding: '13px 28px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: 'var(--primary)',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor:
                        !selectedDifficulty || isGenerating
                          ? 'not-allowed'
                          : 'pointer',
                      opacity: !selectedDifficulty || isGenerating ? 0.5 : 1,
                    }}
                  >
                    {isGenerating
                      ? 'Generating Patient...'
                      : selectedDifficulty
                      ? `Generate ${selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)} Case`
                      : 'Choose a Difficulty'}
                  </button>
                  <p style={{ marginTop: '14px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Each session will generate a new clinical scenario.
                  </p>
                  {practiceError && (
                    <div
                      style={{
                        marginTop: '14px',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--error)',
                        color: 'var(--error)',
                        fontSize: '13px',
                      }}
                    >
                      {practiceError}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
            {/* PATIENT CARD */}
            <div
              style={{
                backgroundColor: 'var(--cards)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '20px',
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: '16px',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--background)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '28px',
                      border: '1px solid var(--border)',
                    }}
                  >
                    👤
                  </div>
                  <div>
                    <h2
                      style={{
                        color: 'var(--text)',
                        fontSize: '20px',
                        margin: '0 0 4px',
                      }}
                    >
                      {patient.name}
                    </h2>
                    <p
                      style={{
                        color: 'var(--text-secondary)',
                        margin: '0',
                        fontSize: '14px',
                      }}
                    >
                      {patient.age} years • {patient.sex} • {patient.occupation}
                    </p>
                    <p
                      style={{
                        color: 'var(--text-secondary)',
                        margin: '4px 0 0',
                        fontSize: '13px',
                      }}
                    >
                      📍 {patient.setting}
                    </p>
                  </div>
                </div>
                <div
                  style={{
                    minWidth: '280px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      marginBottom: '4px',
                      fontWeight: 600,
                    }}
                  >
                    CHIEF COMPLAINT
                  </div>
                  <div
                    style={{
                      color: 'var(--text)',
                      fontSize: '14px',
                      fontWeight: 500,
                    }}
                  >
                    {patient.chiefComplaint}
                  </div>
                </div>
              </div>
            </div>
            {/* SIMULATION CARD */}
            <div
              style={{
                backgroundColor: 'var(--cards)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                overflow: 'hidden',
              }}
            >
              {/* TABS */}
              <div
                style={{
                  display: 'flex',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <button
                  onClick={() => setActiveTab('conversation')}
                  style={{
                    flex: 1,
                    padding: '16px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                    color:
                      activeTab === 'conversation'
                        ? 'var(--primary)'
                        : 'var(--text-secondary)',
                    backgroundColor: 'var(--cards)',
                    borderBottom:
                      activeTab === 'conversation'
                        ? '3px solid var(--primary)'
                        : '3px solid transparent',
                  }}
                >
                  💬 Conversation
                </button>
                <button
                  onClick={() => setActiveTab('physical')}
                  style={{
                    flex: 1,
                    padding: '16px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                    color:
                      activeTab === 'physical'
                        ? 'var(--primary)'
                        : 'var(--text-secondary)',
                    backgroundColor: 'var(--cards)',
                    borderBottom:
                      activeTab === 'physical'
                        ? '3px solid var(--primary)'
                        : '3px solid transparent',
                  }}
                >
                  🩺 Physical Examination
                </button>
              </div>
              {/* ================= CONVERSATION ================= */}
              {activeTab === 'conversation' && (
                <div>
                  <div
                    style={{
                      minHeight: '240px',
                      maxHeight: '360px',
                      overflowY: 'auto',
                      padding: '24px',
                      backgroundColor: 'var(--background)',
                    }}
                  >
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        style={{
                          display: 'flex',
                          justifyContent:
                            message.type === 'student'
                              ? 'flex-end'
                              : 'flex-start',
                          marginBottom: '16px',
                        }}
                      >
                        <div
                          style={{
                            maxWidth: '70%',
                            padding: '12px 16px',
                            borderRadius:
                              message.type === 'student'
                                ? '12px 12px 4px 12px'
                                : '12px 12px 12px 4px',
                            backgroundColor:
                              message.type === 'student'
                                ? 'var(--primary)'
                                : 'var(--cards)',
                            color:
                              message.type === 'student'
                                ? 'white'
                                : 'var(--text)',
                            border:
                              message.type === 'patient'
                                ? '1px solid var(--border)'
                                : 'none',
                            fontSize: '14px',
                            lineHeight: '1.6',
                          }}
                        >
                          {message.type === 'patient' && (
                            <div
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: 'var(--text-secondary)',
                                marginBottom: '5px',
                              }}
                            >
                              PATIENT
                            </div>
                          )}
                          {message.content}
                          {message.type === 'patient' && !message.id.startsWith('error-') && (
                            <button type="button" onClick={() => speakPatient(message.content)}
                              title="Read patient response aloud"
                              style={{ display: 'block', marginTop: '8px', padding: '5px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)', cursor: 'pointer', fontSize: '12px' }}>
                              🔊 Listen
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '14px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={autoSpeak} onChange={(e) => { autoSpeakRef.current = e.target.checked; setAutoSpeak(e.target.checked); if (!e.target.checked) stopSpeaking(); }} />
                      🔊 Auto-speak patient replies
                    </label>
                    <button type="button" onClick={stopSpeaking} disabled={!isSpeaking}
                      style={{ padding: '5px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--cards)', color: 'var(--text)', opacity: isSpeaking ? 1 : 0.5, cursor: isSpeaking ? 'pointer' : 'not-allowed' }}>
                      Stop audio
                    </button>
                    {isListening && <span style={{ color: 'var(--error)' }}>🎤 Listening…</span>}
                    {voiceError && <span role="alert" style={{ color: 'var(--error)' }}>{voiceError}</span>}
                  </div>
                  {/* CHAT INPUT */}
                  <div
                    style={{
                      padding: '16px',
                      borderTop: '1px solid var(--border)',
                      display: 'flex',
                      gap: '12px',
                    }}
                  >
                    <button type="button" onClick={toggleListening} disabled={isSending}
                      title={isListening ? 'Stop microphone' : 'Speak your question'}
                      aria-label={isListening ? 'Stop microphone' : 'Start microphone'}
                      style={{ padding: '10px 13px', borderRadius: '12px', border: '1px solid var(--border)', background: isListening ? '#b91c1c' : 'var(--cards)', color: isListening ? 'white' : 'var(--text)', cursor: isSending ? 'not-allowed' : 'pointer', fontSize: '18px' }}>
                      {isListening ? '⏹️' : '🎤'}
                    </button>
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Ask the patient a question..."
                      disabled={isSending}
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--background)',
                        color: 'var(--text)',
                        outline: 'none',
                        fontSize: '14px',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isSending}
                      style={{
                        padding: '12px 24px',
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                        cursor: inputMessage.trim()
                          ? 'pointer'
                          : 'not-allowed',
                        opacity: inputMessage.trim() && !isSending ? 1 : 0.5,
                        fontWeight: 500,
                      }}
                    >
                      {isSending ? 'Responding...' : 'Send'}
                    </button>
                  </div>
                </div>
              )}
              {/* ================= PHYSICAL EXAM ================= */}
              {activeTab === 'physical' && (
                <div
                  style={{
                    padding: '24px',
                    backgroundColor: 'var(--background)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '16px',
                      marginBottom: '18px',
                      borderRadius: '14px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--cards)',
                    }}
                  >
                    <div
                      style={{
                        width: '64px',
                        height: '84px',
                        borderRadius: '12px',
                        border: '1px dashed var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '34px',
                        flexShrink: 0,
                      }}
                    >
                      🧍
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 4px', color: 'var(--text)' }}>
                        Physical Examination
                      </h3>
                      <p
                        style={{
                          margin: 0,
                          color: 'var(--text-secondary)',
                          fontSize: '13px',
                          lineHeight: 1.5,
                        }}
                      >
                        Select an examination action. Only the finding for the action you perform will be revealed.
                        The 3D patient can replace this placeholder later.
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                      gap: '10px',
                    }}
                  >
                    {physicalActions.map((action) => {
                      const loading = activeAssessment === action.id;
                      return (
                        <button
                          key={action.id}
                          onClick={() => handlePhysicalAssessment(action)}
                          disabled={Boolean(activeAssessment)}
                          style={{
                            padding: '13px 14px',
                            borderRadius: '12px',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--cards)',
                            color: 'var(--text)',
                            cursor: activeAssessment ? 'not-allowed' : 'pointer',
                            textAlign: 'left',
                            fontSize: '13px',
                            fontWeight: 500,
                            opacity: activeAssessment && !loading ? 0.6 : 1,
                          }}
                        >
                          {loading ? '⏳ Assessing...' : `${action.icon} ${action.label}`}
                        </button>
                      );
                    })}
                  </div>

                  {assessmentError && (
                    <div
                      style={{
                        marginTop: '16px',
                        padding: '12px 14px',
                        border: '1px solid var(--error)',
                        borderRadius: '12px',
                        color: 'var(--error)',
                        backgroundColor: 'var(--cards)',
                        fontSize: '13px',
                      }}
                    >
                      {assessmentError}
                    </div>
                  )}

                  {assessmentHistory.length > 0 && (
                    <div style={{ marginTop: '22px' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '10px',
                        }}
                      >
                        <h3 style={{ margin: 0, color: 'var(--text)', fontSize: '16px' }}>
                          Examination Findings
                        </h3>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                          {assessmentHistory.length} performed
                        </span>
                      </div>

                      <div style={{ display: 'grid', gap: '10px' }}>
                        {assessmentHistory.map((result) => (
                          <div
                            key={result.id}
                            style={{
                              padding: '14px 16px',
                              borderRadius: '12px',
                              border: '1px solid var(--border)',
                              backgroundColor: 'var(--cards)',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: '12px',
                                marginBottom: '6px',
                                flexWrap: 'wrap',
                              }}
                            >
                              <strong style={{ color: 'var(--text)', fontSize: '13px' }}>
                                🩺 {result.label}
                              </strong>
                              <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                                {result.technique}{result.tool ? ` • ${result.tool}` : ''}
                              </span>
                            </div>
                            <div
                              style={{
                                color: 'var(--text)',
                                fontSize: '14px',
                                lineHeight: 1.55,
                              }}
                            >
                              {result.finding}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* END SESSION */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '20px',
                paddingBottom: '24px',
              }}
            >
              <button
                onClick={handleEndSession}
                style={{
                  padding: '12px 22px',
                  borderRadius: '12px',
                  border: '1px solid var(--error)',
                  backgroundColor: 'transparent',
                  color: 'var(--error)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                End Session
              </button>
            </div>

            {sessionStage !== 'simulation' && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 1000,
                  background: 'rgba(15, 23, 42, 0.72)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    maxWidth: sessionStage === 'result' ? '980px' : '780px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    background: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '18px',
                    padding: '26px',
                    boxShadow: '0 24px 70px rgba(0,0,0,0.28)',
                  }}
                >
                  {sessionStage === 'report' ? (
                    <>
                      <div style={{ marginBottom: '20px' }}>
                        <h2 style={{ margin: '0 0 6px', color: 'var(--text)' }}>Final Nursing Report</h2>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
                          Complete the report from your interview and physical examination evidence.
                        </p>
                      </div>

                      {[
                        ['interview_summary', 'Interview Summary', 'Summarize the relevant history you collected.'],
                        ['physical_findings', 'Physical Assessment Findings', 'Document the examination findings you identified.'],
                        ['identified_problems', 'Identified Problems', 'List and prioritize the patient problems.'],
                        ['supporting_evidence', 'Supporting Evidence', 'Explain the evidence supporting your identified problems.'],
                        ['referral_decision', 'Referral / Management Decision', 'State referral destination, urgency, immediate actions, and justification.'],
                      ].map(([field, label, placeholder]) => (
                        <div key={field} style={{ marginBottom: '15px' }}>
                          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: 'var(--text)', fontSize: '13px' }}>
                            {label}
                          </label>
                          <textarea
                            value={report[field]}
                            onChange={(e) => handleReportChange(field, e.target.value)}
                            placeholder={placeholder}
                            rows={field === 'interview_summary' || field === 'physical_findings' ? 4 : 3}
                            style={{
                              width: '100%',
                              boxSizing: 'border-box',
                              resize: 'vertical',
                              padding: '12px 14px',
                              borderRadius: '10px',
                              border: '1px solid var(--border)',
                              background: 'var(--cards)',
                              color: 'var(--text)',
                              fontFamily: 'Inter, sans-serif',
                              lineHeight: 1.5,
                            }}
                          />
                        </div>
                      ))}

                      {submitError && (
                        <div style={{ padding: '11px 13px', borderRadius: '10px', border: '1px solid var(--error)', color: 'var(--error)', marginBottom: '14px', fontSize: '13px' }}>
                          {submitError}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                        <button
                          onClick={() => setSessionStage('simulation')}
                          disabled={isSubmitting}
                          style={{ padding: '11px 18px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--cards)', color: 'var(--text)', cursor: 'pointer' }}
                        >
                          Back to Session
                        </button>
                        <button
                          onClick={handleSubmitReport}
                          disabled={isSubmitting}
                          style={{ padding: '11px 20px', borderRadius: '10px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 600, cursor: isSubmitting ? 'wait' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}
                        >
                          {isSubmitting ? 'AI is Evaluating...' : 'Submit for Evaluation'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Results overview: compact and always visible at the top */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '18px' }}>
                        <div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '5px' }}>MEDLEARN AI · PRACTICE RESULTS</div>
                          <h2 style={{ margin: '0 0 5px', fontSize: '25px', color: 'var(--text)' }}>Your Clinical Performance</h2>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{patient?.name} · Cardiovascular assessment</div>
                        </div>
                        <div style={{ background: 'var(--cards)', border: '1px solid var(--border)', borderRadius: '16px', padding: '12px 22px', textAlign: 'center' }}>
                          <div style={{ fontSize: '35px', fontWeight: 800, color: 'var(--primary)', lineHeight: 1.1 }}>{evaluation?.score ?? 0}<span style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>/100</span></div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '5px' }}>Overall score</div>
                        </div>
                      </div>
                      <div style={{ height: '8px', background: 'var(--border)', borderRadius: '999px', overflow: 'hidden', marginBottom: '16px' }}>
                        <div style={{ width: `${Math.max(0, Math.min(100, Number(evaluation?.score) || 0))}%`, height: '100%', background: 'var(--primary)', borderRadius: '999px' }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px', marginBottom: '18px' }}>
                        {[
                          ['✓ Achieved', feedback.did_well, '#16a34a'],
                          ['◐ Partial', feedback.partially_completed, '#d97706'],
                          ['✕ Missed', feedback.missed, '#dc2626'],
                        ].map(([label, items, color]) => (
                          <div key={label} style={{ background: 'var(--cards)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                            <div style={{ color, fontSize: '25px', fontWeight: 800 }}>{Array.isArray(items) ? items.length : 0}</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{label}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ background: 'var(--cards)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                        <h3 style={{ color: 'var(--text)', margin: '0 0 7px', fontSize: '15px' }}>📝 Your feedback</h3>
                        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '13px', lineHeight: 1.65 }}>{feedback.report_feedback || 'No report feedback returned.'}</p>
                      </div>
                      <div style={{ background: 'var(--cards)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                        <h3 style={{ color: 'var(--text)', margin: '0 0 10px', fontSize: '15px' }}>Assessment details</h3>
                        <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', marginBottom: '12px' }}>
                          {[
                            ['missed', 'Missed', feedback.missed],
                            ['partial', 'Partially completed', feedback.partially_completed],
                            ['achieved', 'What you did well', feedback.did_well],
                            ['focus', 'Topics to focus on', feedback.focus_topics],
                          ].map(([id, label, items]) => (
                            <button key={id} type="button" onClick={() => setResultTab(id)}
                              style={{ padding: '9px 12px', borderRadius: '9px', border: resultTab === id ? '1px solid var(--primary)' : '1px solid var(--border)', background: resultTab === id ? 'var(--primary)' : 'var(--background)', color: resultTab === id ? '#fff' : 'var(--text)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                              {label} ({Array.isArray(items) ? items.length : 0})
                            </button>
                          ))}
                        </div>
                        {(() => {
                          const groups = { missed: feedback.missed, partial: feedback.partially_completed, achieved: feedback.did_well, focus: feedback.focus_topics };
                          const items = groups[resultTab];
                          return Array.isArray(items) && items.length ? (
                            <>
                              <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                                {items.map((item, index) => (
                                  <span key={index} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '7px 10px', background: 'var(--background)', color: 'var(--text)', fontSize: '12px', lineHeight: 1.4 }}>
                                    {String(item)}
                                  </span>
                                ))}
                              </div>
                              {items.every(item => typeof item === 'number' || /^\d+$/.test(String(item))) && (
                                <p style={{ margin: '12px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>These are rubric criterion IDs returned by the evaluator. Their descriptions must be mapped from the backend rubric; IDs alone do not explain the clinical skill.</p>
                              )}
                            </>
                          ) : <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>No items in this category.</p>;
                        })()}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={handleNewSession}
                          style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                          Start New Practice Session →
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default StudentPractice;
