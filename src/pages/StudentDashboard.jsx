import StudentLayout from './StudentLayout';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const API = 'http://127.0.0.1:5000';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === null ? window.matchMedia('(prefers-color-scheme: dark)').matches : saved === 'true';
  });
  const [activities, setActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState('');
  const [stats, setStats] = useState({
    learning_sessions: { total: 0, this_week: 0 },
    practice_completed: { total: 0, this_week: 0 },
    evaluations: { total: 0, average_score: 0 },
  });
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    if (!user?.id) {
      setActivityLoading(false);
      return;
    }
    const controller = new AbortController();
    const load = async () => {
      setActivityLoading(true);
      setActivityError('');
      try {
        const response = await fetch(`${API}/student/${user.id}/activity`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load activities');
        setActivities(Array.isArray(data.activities) ? data.activities : []);
      } catch (err) {
        if (err.name !== 'AbortError') setActivityError(err.message || 'Could not load recent activity');
      } finally {
        if (!controller.signal.aborted) setActivityLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch(`${API}/student/${user.id}/stats`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load statistics');
        setStats({
          learning_sessions: data.learning_sessions ?? { total: 0, this_week: 0 },
          practice_completed: data.practice_completed ?? { total: 0, this_week: 0 },
          evaluations: data.evaluations ?? { total: 0, average_score: 0 },
        });
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Stats fetch error:', err);
      }
    };
    load();
    return () => controller.abort();
  }, [user?.id]);

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem('darkMode', String(next));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const resume = (sessionId) => navigate('/student/practice', { state: { resumeSessionId: sessionId } });
  const inProgress = activities.find((a) => !a.completed);
  const firstName = (user?.name || 'Student').trim().split(/\s+/)[0];

  const formatDate = (value) => {
    if (!value) return 'Date unavailable';
    const normalized = value.includes('T') ? value : value.replace(' ', 'T') + 'Z';
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const Icon = ({ name, size = 20 }) => {
    const paths = {
      dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
      learning: <><path d="M12 7v14M3 18V5a2 2 0 0 1 2-2h3a4 4 0 0 1 4 4 4 4 0 0 1 4-4h3a2 2 0 0 1 2 2v13h-5a4 4 0 0 0-4 3 4 4 0 0 0-4-3H3Z"/></>,
      practice: <><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></>,
      evaluation: <><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M9 11h6M9 15h6"/></>,
      progress: <><path d="M4 20V12M10 20V8M16 20V4M22 20H2"/></>,
      moon: <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>,
      sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
      logout: <><path d="M10 17l5-5-5-5m5 5H3"/><path d="M12 3h6a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-6"/></>,
      clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
      check: <path d="m4 12 5 5L20 6"/>,
    };
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
  };
  const nav = [
    { label: 'Dashboard', icon: 'dashboard', path: '/student/dashboard' },
    { label: 'Learning', icon: 'learning', path: '/student/learning' },
    { label: 'Practice', icon: 'practice', path: '/student/practice' },
  ];

  return (
    <div className="ml-dashboard">
      <button className="ml-mobile-menu" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation" aria-expanded={menuOpen}>☰ Menu</button>
      {menuOpen && <button className="ml-menu-backdrop" type="button" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <StudentLayout isDarkMode={isDarkMode} onToggleTheme={toggleDarkMode} onLogout={handleLogout} mobileOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="ml-main">
        <div className="ml-content">
          <header className="ml-page-header">
            <div><p className="ml-eyebrow">YOUR LEARNING SPACE</p><h1>Welcome back, {firstName} <span aria-hidden="true">✦</span></h1><p>Ready to build your clinical confidence today?</p></div>
            <div className="ml-profile" title={user?.name || 'Student'}><span>{(firstName[0] || 'S').toUpperCase()}</span><div><strong>{user?.name || 'Student'}</strong><small>Nursing student</small></div></div>
          </header>

          <section className="ml-stats" aria-label="Your learning statistics">
            <article className="ml-stat"><span className="ml-stat-icon"><Icon name="learning" size={22}/></span><div><strong>{stats.learning_sessions?.total ?? 0}</strong><span>Learning sessions</span><small>+{stats.learning_sessions?.this_week ?? 0} this week</small></div></article>
            <article className="ml-stat"><span className="ml-stat-icon"><Icon name="practice" size={22}/></span><div><strong>{stats.practice_completed?.total ?? 0}</strong><span>Practice completed</span><small>+{stats.practice_completed?.this_week ?? 0} this week</small></div></article>
            <article className="ml-stat"><span className="ml-stat-icon"><Icon name="evaluation" size={22}/></span><div><strong>{stats.evaluations?.total ?? 0}</strong><span>Evaluations</span><small>{stats.evaluations?.total ? `${stats.evaluations?.average_score ?? 0}% average score` : 'No scores yet'}</small></div></article>
          </section>

          <section className="ml-progress-panel" aria-labelledby="ml-progress-title">
            <div className="ml-progress-heading"><div><p className="ml-eyebrow">YOUR JOURNEY</p><h2 id="ml-progress-title">Learning progress</h2><p>Your activity at a glance — based on actual sessions.</p></div><span className="ml-progress-note">Live activity summary</span></div>
            <div className="ml-progress-grid">
              <div className="ml-progress-metric"><span>Learning sessions</span><strong>{stats.learning_sessions?.total ?? 0}</strong><small>{stats.learning_sessions?.this_week ?? 0} this week</small></div>
              <div className="ml-progress-metric"><span>Completed patient practices</span><strong>{stats.practice_completed?.total ?? 0}</strong><small>{stats.practice_completed?.this_week ?? 0} this week</small></div>
              <div className="ml-progress-metric"><span>Evaluation performance</span><strong>{(stats.evaluations?.total ?? 0) > 0 ? `${stats.evaluations?.average_score ?? 0}%` : '—'}</strong><small>{(stats.evaluations?.total ?? 0) > 0 ? 'Average evaluation score' : 'Available after evaluations'}</small></div>
            </div>
          </section>

          <section className="ml-section" aria-labelledby="ml-modules-title"><div className="ml-section-heading"><div><h2 id="ml-modules-title">Learning modules</h2><p>Choose your next step</p></div></div>
            <div className="ml-modules">
              <button type="button" className="ml-module" onClick={() => navigate('/student/learning')}><span className="ml-module-icon"><Icon name="learning" size={22}/></span><span className="ml-module-text"><strong>Learning</strong><span>Ask questions and study with your AI assistant.</span><em>Open learning →</em></span></button>
              <button type="button" className="ml-module" onClick={() => inProgress ? resume(inProgress.session_id) : navigate('/student/practice')}><span className="ml-module-icon ml-teal"><Icon name="practice" size={22}/></span><span className="ml-module-text"><strong>Virtual patient practice</strong><span>Interview patients and assess clinical findings.</span><em>{inProgress ? 'Resume practice →' : 'Start practicing →'}</em></span></button>
              <div className="ml-module ml-module-upcoming"><span className="ml-module-icon"><Icon name="evaluation" size={22}/></span><span className="ml-module-text"><strong>Evaluation <small className="ml-soon">Coming soon</small></strong><span>Structured assessments and performance feedback.</span><em>Not yet available</em></span></div>
            </div>
          </section>

          <section className="ml-section ml-activity-section" aria-labelledby="ml-activity-title"><div className="ml-section-heading"><div><h2 id="ml-activity-title">Recent activity</h2><p>Pick up where you left off</p></div></div>
            <div className="ml-activity-list">
              {activityLoading ? <p className="ml-empty">Loading your recent activity…</p> : activityError ? <p className="ml-empty ml-error" role="alert">{activityError}</p> : activities.length === 0 ? <div className="ml-empty"><strong>Your journey starts here</strong><p>No practice sessions yet. Try your first virtual patient assessment.</p><button type="button" className="ml-text-button" onClick={() => navigate('/student/practice')}>Start practice →</button></div> : activities.slice(0, 5).map((activity, index) => (
                <div className="ml-activity" key={activity.session_id ?? index}><span className="ml-activity-icon"><Icon name={activity.completed ? 'check' : 'clock'} size={18}/></span><div className="ml-activity-details"><strong>{activity.title || 'Practice session'}</strong><small>{formatDate(activity.created_at)}{activity.completed && activity.score != null ? ` · Score: ${activity.score}%` : ''}</small></div><span className={`ml-status ${activity.completed ? 'ml-complete' : 'ml-in-progress'}`}>{activity.completed ? 'Completed' : 'In progress'}</span>{!activity.completed && <button type="button" className="ml-resume" onClick={() => resume(activity.session_id)}>Resume →</button>}</div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
