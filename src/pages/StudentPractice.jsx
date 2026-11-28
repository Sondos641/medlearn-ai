import StudentLayout from './StudentLayout';
import LoadingOverlay from '../components/LoadingOverlay';
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import Patient3DViewer from '../components/Patient3DViewer';
import './StudentPractice.css';
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
  const [selectedBodyRegion, setSelectedBodyRegion] = useState('heart');
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

  // Keep existing action IDs: the Flask assessment endpoint depends on them.
  const bodyRegions = [
    { id: 'neck', label: 'Neck & carotids', actions: ['7', '8'] },
    { id: 'heart', label: 'Heart / apex', actions: ['2', '3', '4', '5', '6'] },
    { id: 'chest', label: 'Chest / precordium', actions: ['1'] },
    { id: 'upper', label: 'Upper extremities', actions: ['9', '10'] },
    { id: 'hands', label: 'Hands / capillary refill', actions: ['14'] },
    { id: 'lower', label: 'Lower extremities', actions: ['11', '12', '13'] },
    { id: 'feet', label: 'Feet / capillary refill', actions: ['15'] },
  ];
  const selectedBodyRegionInfo = bodyRegions.find((region) => region.id === selectedBodyRegion) || bodyRegions[1];
  const visiblePhysicalActions = physicalActions.filter((action) => selectedBodyRegionInfo.actions.includes(action.id));

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
    <div className="practice-shell">
      <LoadingOverlay
        active={isGenerating || isSubmitting}
        title={isSubmitting ? 'Evaluating your performance...' : 'Preparing your patient...'}
        description={isSubmitting ? 'Reviewing your assessment and nursing report. This may take a moment.' : 'Generating or restoring your clinical simulation. This may take a moment.'}
      />
      <StudentLayout isDarkMode={isDarkMode} onToggleTheme={toggleDarkMode} onLogout={handleLogout} />

      <main className="practice-main">
        <header className="practice-topbar">
          <div><div className="practice-eyebrow">CLINICAL TRAINING / CARDIOVASCULAR</div><h1>Practice Simulation</h1></div>
          <div className="practice-user"><span className="practice-user-name">{user?.name || 'Student'}</span><span className="practice-avatar">{user?.name?.charAt(0) || 'S'}</span></div>
        </header>

        {!sessionStarted ? (
          <section className="practice-start-screen">
            <div className="practice-start-intro"><div className="practice-start-mark">✚</div><div className="practice-eyebrow">VIRTUAL PATIENT SIMULATION</div><h2>Ready for your next clinical case?</h2><p>Choose a difficulty to begin a cardiovascular patient assessment. You'll interview your patient, examine them, and receive feedback.</p></div>
            <div className="practice-difficulties">
              {[
                {id:'easy',icon:'01',title:'Easy',description:'Clear symptoms and straightforward findings.'},
                {id:'medium',icon:'02',title:'Medium',description:'A detailed case that tests clinical reasoning.'},
                {id:'hard',icon:'03',title:'Hard',description:'Subtle symptoms and more complex findings.'}
              ].map(level => <button key={level.id} type="button" className={`practice-difficulty ${selectedDifficulty === level.id ? 'selected' : ''}`} onClick={() => setSelectedDifficulty(level.id)} aria-pressed={selectedDifficulty === level.id}><span className="practice-level-number">{level.icon}</span><strong>{level.title}</strong><span>{level.description}</span><span className="practice-choice-indicator">{selectedDifficulty === level.id ? '✓ Selected' : 'Select difficulty'}</span></button>)}
            </div>
            <button type="button" className="practice-primary practice-generate" onClick={handleStartPractice} disabled={!selectedDifficulty || isGenerating}>{isGenerating ? 'Generating patient…' : 'Generate patient case →'}</button>
            {practiceError && <p role="alert" className="practice-error">{practiceError}</p>}
          </section>
        ) : (
          <section className="practice-session">
            <div className="practice-patient-strip">
              <div className="practice-patient-identity"><span className="practice-patient-avatar">✚</span><div><div className="practice-eyebrow">CURRENT PATIENT · {selectedDifficulty?.toUpperCase()} CASE</div><h2>{patient?.name}</h2><p>{patient?.age} years · {patient?.sex} · {patient?.occupation} · {patient?.setting}</p></div></div>
              <div className="practice-complaint"><span>CHIEF COMPLAINT</span><strong>{patient?.chiefComplaint}</strong></div>
              <button type="button" className="practice-end-button" onClick={handleEndSession}>End session →</button>
            </div>
            <div className="practice-workspace">
              <div className="practice-tabs" role="tablist" aria-label="Practice activities">
                <button role="tab" aria-selected={activeTab === 'conversation'} className={activeTab === 'conversation' ? 'active' : ''} onClick={() => setActiveTab('conversation')}>◉ <span>Patient conversation</span></button>
                <button role="tab" aria-selected={activeTab === 'physical'} className={activeTab === 'physical' ? 'active' : ''} onClick={() => setActiveTab('physical')}>✚ <span>Physical examination</span>{assessmentHistory.length > 0 && <small>{assessmentHistory.length}</small>}</button>
              </div>
              {activeTab === 'conversation' ? (
                <div className="practice-chat-layout" role="tabpanel">
                  <div className="practice-chat-messages" aria-live="polite">
                    {messages.length === 0 && <div className="practice-chat-empty"><span className="practice-empty-symbol">✦</span><h3>Start with the patient history</h3><p>Introduce yourself, then ask about the patient's symptoms and medical history.</p></div>}
                    {messages.map(message => <div key={message.id} className={`practice-message-row ${message.type === 'student' ? 'student' : 'patient'}`}><div className="practice-message"><span className="practice-message-label">{message.type === 'student' ? 'YOU' : 'PATIENT'}</span><p>{message.content}</p>{message.type === 'patient' && !message.id.startsWith('error-') && <button type="button" className="practice-listen" onClick={() => speakPatient(message.content)}>◖)) Listen</button>}</div></div>)}
                    {isSending && <div className="practice-typing">Patient is responding…</div>}
                  </div>
                  <div className="practice-chat-footer">
                    <div className="practice-voice-options"><label><input type="checkbox" checked={autoSpeak} onChange={e => {autoSpeakRef.current = e.target.checked;setAutoSpeak(e.target.checked);if(!e.target.checked)stopSpeaking();}}/> Auto-speak patient replies</label><button type="button" disabled={!isSpeaking} onClick={stopSpeaking}>Stop audio</button>{isListening && <span>● Listening…</span>}{voiceError && <span role="alert" className="practice-error">{voiceError}</span>}</div>
                    <div className="practice-chat-composer"><button type="button" className={`practice-mic ${isListening ? 'listening' : ''}`} onClick={toggleListening} disabled={isSending} aria-label={isListening ? 'Stop microphone' : 'Start microphone'}>{isListening ? '■' : '🎙'}</button><input type="text" aria-label="Question for patient" value={inputMessage} onChange={e => setInputMessage(e.target.value)} onKeyDown={handleKeyPress} placeholder="Ask the patient a question…" disabled={isSending}/><button type="button" className="practice-primary" onClick={handleSendMessage} disabled={!inputMessage.trim() || isSending}>{isSending ? 'Sending…' : 'Send →'}</button></div>
                  </div>
                </div>
              ) : (
                <div className="practice-exam-layout" role="tabpanel">
                  <div className="practice-model-panel"><div className="practice-panel-heading"><div><h3>Interactive patient</h3><p>Click a body region or choose one below.</p></div><span className="practice-panel-pill">3D EXAM</span></div><div className="practice-model-stage"><Patient3DViewer sex={patient?.sex} selectedRegion={selectedBodyRegion} onSelectRegion={setSelectedBodyRegion}/></div><div className="practice-region-choices">{bodyRegions.map(region => <button key={region.id} type="button" aria-pressed={selectedBodyRegion === region.id} className={selectedBodyRegion === region.id ? 'selected' : ''} onClick={() => setSelectedBodyRegion(region.id)}>{region.label}</button>)}</div></div>
                  <div className="practice-exam-right"><div className="practice-actions-panel"><div className="practice-panel-heading"><div><h3>{selectedBodyRegionInfo.label}</h3><p>Select an assessment to perform.</p></div></div><div className="practice-action-list">{visiblePhysicalActions.map(action => <button type="button" key={action.id} onClick={() => handlePhysicalAssessment(action)} disabled={Boolean(activeAssessment)}><span>{action.icon}</span><span>{activeAssessment === action.id ? 'Assessing…' : action.label}</span><span className="practice-action-arrow">→</span></button>)}</div>{assessmentError && <p role="alert" className="practice-error">{assessmentError}</p>}</div><div className="practice-findings-panel"><div className="practice-panel-heading"><div><h3>Examination findings</h3><p>Only performed assessments are revealed.</p></div><span className="practice-panel-pill">{assessmentHistory.length} PERFORMED</span></div><div className="practice-findings-list">{assessmentHistory.length === 0 ? <p className="practice-findings-empty">Your examination findings will appear here.</p> : assessmentHistory.map((result,index) => <article key={result.id || index} className="practice-finding"><strong>{result.label}</strong><small>{result.technique}{result.tool ? ` · ${result.tool}` : ''}</small><p>{result.finding}</p></article>)}</div></div></div>
                </div>
              )}
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
                    maxWidth: sessionStage === 'result' ? '1060px' : '900px',
                    maxHeight: 'min(92vh, 960px)',
                    overflowY: 'auto',
                    scrollbarWidth: 'thin',
                    background: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '18px',
                    padding: 'clamp(16px, 2vw, 28px)',
                    boxShadow: '0 24px 70px rgba(0,0,0,0.28)',
                  }}
                >
                  {sessionStage === 'report' ? (
                    <>
                      <div className="practice-report-heading" style={{ marginBottom: '20px' }}>
                        <h2 style={{ margin: '0 0 6px', color: 'var(--text)' }}>Final Nursing Report</h2>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
                          Complete the report from your interview and physical examination evidence.
                        </p>
                      </div>

                      <div className="practice-report-grid">{[
                        ['interview_summary', 'Interview Summary', 'Summarize the relevant history you collected.'],
                        ['physical_findings', 'Physical Assessment Findings', 'Document the examination findings you identified.'],
                        ['identified_problems', 'Identified Problems', 'List and prioritize the patient problems.'],
                        ['supporting_evidence', 'Supporting Evidence', 'Explain the evidence supporting your identified problems.'],
                        ['referral_decision', 'Referral / Management Decision', 'State referral destination, urgency, immediate actions, and justification.'],
                      ].map(([field, label, placeholder]) => (
                        <div key={field} className="practice-report-field">
                          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: 'var(--text)', fontSize: '13px' }}>
                            {label}
                          </label>
                          <textarea
                            value={report[field]}
                            onChange={(e) => handleReportChange(field, e.target.value)}
                            placeholder={placeholder}
                            rows={3}
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

                      </div>
                      {submitError && (
                        <div style={{ padding: '11px 13px', borderRadius: '10px', border: '1px solid var(--error)', color: 'var(--error)', marginBottom: '14px', fontSize: '13px' }}>
                          {submitError}
                        </div>
                      )}

                      <div className="practice-report-footer" style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
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
                      <div className="practice-results-details" style={{ background: 'var(--cards)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                        <h3 style={{ color: 'var(--text)', margin: '0 0 10px', fontSize: '15px' }}>Assessment details</h3>
                        <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', marginBottom: '12px' }}>
                          {[
                            ['missed', 'Missed', feedback.missed],
                            ['partial', 'Partially completed', feedback.partially_completed],
                            ['achieved', 'What you did well', feedback.did_well],
                            ['focus', 'Topics to focus on', feedback.focus_topics],
                            ['na', 'Not Applicable', feedback.not_applicable],
                          ].map(([id, label, items]) => (
                            <button key={id} type="button" onClick={() => setResultTab(id)}
                              style={{ padding: '9px 12px', borderRadius: '9px', border: resultTab === id ? '1px solid var(--primary)' : '1px solid var(--border)', background: resultTab === id ? 'var(--primary)' : 'var(--background)', color: resultTab === id ? '#fff' : 'var(--text)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                              {label} ({Array.isArray(items) ? items.length : 0})
                            </button>
                          ))}
                        </div>
                        {(() => {
                          const groups = {
                            missed: feedback.missed,
                            partial: feedback.partially_completed,
                            achieved: feedback.did_well,
                            focus: feedback.focus_topics,
                            na: feedback.not_applicable,
                          };
                          const items = groups[resultTab];
                          return Array.isArray(items) && items.length ? (
                            <>
                              <ol className="practice-rubric-list">
                                {items.map((item,index)=><li key={index}>{String(item)}</li>)}
                              </ol>
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

          </section>
        )}
      </main>
    </div>
  );
};
export default StudentPractice;
