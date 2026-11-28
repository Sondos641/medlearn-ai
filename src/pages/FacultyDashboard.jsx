import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './FacultyDashboard.css';
import LoadingOverlay from '../components/LoadingOverlay';

const paths = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  students: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
  reports: <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></>,
  analytics: <><path d="M4 20v-7M10 20V8M16 20V4M22 20H2"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></>,
  book: <><path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Z"/><path d="M12 6v14"/></>,
  check: <><path d="m4 12 5 5L20 6"/></>,
};
const Icon = ({ name }) => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
const safeNumber = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const dateText = (value) => { if (!value) return 'No activity'; const d = new Date(String(value).replace(' ', 'T')); return Number.isNaN(d.getTime()) ? 'No activity' : d.toLocaleString(); };

export default function FacultyDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [view, setView] = useState('dashboard');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => { document.documentElement.classList.toggle('dark', isDarkMode); localStorage.setItem('darkMode', String(isDarkMode)); }, [isDarkMode]);
  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true); setError('');
        const response = await fetch(`http://127.0.0.1:5000/faculty/${user.id}/students`, { signal: controller.signal });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'Failed to load students.');
        setStudents(Array.isArray(result.students) ? result.students : []);
        setSummary(result.summary || {});
      } catch (err) { if (err.name !== 'AbortError') { console.error('Faculty dashboard error:', err); setError(err.message); } }
      finally { if (!controller.signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  }, [user?.id]);

  const totalCompleted = students.reduce((sum, s) => sum + safeNumber(s.practice_completed), 0);
  const practiceTotal = safeNumber(summary.total_practice_sessions);
  const completionRate = practiceTotal > 0 ? `${Math.min(100, Math.round(totalCompleted / practiceTotal * 100))}%` : 'N/A';
  const stats = [
    { label: 'Total students', value: summary.total_students ?? students.length, icon: 'students', detail: 'Assigned learners' },
    { label: 'Total sessions', value: safeNumber(summary.total_learning_sessions) + practiceTotal, icon: 'book', detail: 'Learning + practice' },
    { label: 'Average practice score', value: summary.average_score == null ? 'N/A' : `${summary.average_score}%`, icon: 'analytics', detail: 'Across evaluated sessions' },
    { label: 'Practice completion', value: completionRate, icon: 'check', detail: `${totalCompleted} completed sessions` },
  ];
  const visibleStudents = useMemo(() => students.filter(s => `${s.name || ''} ${s.email || ''}`.toLowerCase().includes(query.toLowerCase())), [students, query]);
  const selectView = (next) => { setView(next); setMobileOpen(false); };
  const nav = [ ['Dashboard', 'dashboard', 'dashboard'], ['Students', 'students', 'students'], ['Reports', 'reports', 'reports'] ];
  const studentTable = (list) => <div className="faculty-table-wrap"><table className="faculty-table"><thead><tr><th>Student</th><th>Practice completion</th><th>Sessions</th><th>Avg. score</th><th>Last active</th><th>Report</th></tr></thead><tbody>{list.map(s => {
    const completed = safeNumber(s.practice_completed), practices = safeNumber(s.practice_sessions), percent = practices ? Math.min(100, Math.round(completed / practices * 100)) : 0;
    return <tr key={s.id}><td><strong>{s.name || 'Unnamed student'}</strong><small>{s.email}</small></td><td><div className="faculty-progress"><span style={{width:`${percent}%`}}/></div><small>{completed}/{practices} completed · {percent}%</small></td><td>{safeNumber(s.practice_sessions) + safeNumber(s.learning_sessions)}</td><td><strong>{s.average_score == null ? 'N/A' : `${s.average_score}%`}</strong></td><td className="faculty-muted">{dateText(s.last_active)}</td><td><button type="button" className="faculty-outline-button" onClick={() => setSelectedStudent(s)}>View report</button></td></tr>;
  })}</tbody></table>{list.length === 0 && <p className="faculty-empty">No students match your search.</p>}</div>;
  return <div className="faculty-shell">
    <LoadingOverlay active={loading} title="Loading faculty dashboard..." description="Fetching your students and class performance." />
    <button type="button" className="faculty-mobile-toggle" onClick={() => setMobileOpen(true)} aria-label="Open faculty menu">☰</button>
    {mobileOpen && <button type="button" className="faculty-backdrop" aria-label="Close menu" onClick={() => setMobileOpen(false)}/>}
    <aside className={`faculty-sidebar ${mobileOpen ? 'faculty-sidebar-open' : ''}`}>
      <div className="faculty-brand"><span className="faculty-brand-symbol">✦</span><span>MedLearn <strong>AI</strong></span></div>
      <div className="faculty-nav-heading">WORKSPACE</div>
      <nav className="faculty-nav">{nav.map(([label, icon, key]) => <button type="button" key={key} className={`faculty-nav-link ${view === key ? 'active' : ''}`} onClick={() => selectView(key)}><Icon name={icon}/>{label}</button>)}</nav>
      <div className="faculty-nav-heading faculty-coming">COMING LATER</div>
      <div className="faculty-nav-link faculty-disabled"><Icon name="analytics"/>Analytics <small>Soon</small></div>
      <div className="faculty-nav-link faculty-disabled"><Icon name="settings"/>Settings <small>Soon</small></div>
      <div className="faculty-sidebar-bottom"><button type="button" className="faculty-nav-link" onClick={() => setIsDarkMode(v => !v)}><Icon name="settings"/>{isDarkMode ? 'Light appearance' : 'Dark appearance'}</button><button type="button" className="faculty-nav-link faculty-logout" onClick={() => { logout(); navigate('/login'); }}><Icon name="logout"/>Sign out</button></div>
    </aside>
    <main className="faculty-main"><div className="faculty-content">
      <header className="faculty-page-header"><div><p className="faculty-eyebrow">FACULTY WORKSPACE</p><h1>{view === 'dashboard' ? <>Welcome back, <span>{user?.name || 'Professor'} ✦</span></> : view === 'students' ? 'Students' : 'Student reports'}</h1><p>{view === 'dashboard' ? 'Monitor student learning and clinical performance.' : view === 'students' ? 'Find students and review their progress.' : 'Explore individual practice sessions and assessment results.'}</p></div><div className="faculty-profile"><span>{(user?.name || 'F').charAt(0).toUpperCase()}</span><div><strong>{user?.name || 'Faculty'}</strong><small>Faculty member</small></div></div></header>
      {view === 'dashboard' && <><div className="faculty-stats">{stats.map(s => <article className="faculty-stat" key={s.label}><div className="faculty-stat-icon"><Icon name={s.icon}/></div><div><strong>{loading ? '…' : s.value}</strong><span>{s.label}</span><small>{s.detail}</small></div></article>)}</div><section className="faculty-panel faculty-overview"><div className="faculty-section-heading"><div><p className="faculty-eyebrow">CLASS OVERVIEW</p><h2>Module activity</h2><p>Real activity across assigned students</p></div></div><div className="faculty-module-grid"><div><span>Learning sessions</span><strong>{safeNumber(summary.total_learning_sessions)}</strong></div><div><span>Practice sessions</span><strong>{practiceTotal}</strong></div><div><span>Completed practices</span><strong>{totalCompleted}</strong></div></div></section></>}
      <section className="faculty-panel"><div className="faculty-section-heading"><div><h2>{view === 'reports' ? 'Individual student reports' : 'Student performance overview'}</h2><p>Review practice completion, scores, and recent clinical activity.</p></div><div className="faculty-table-actions"><input aria-label="Search students" placeholder="Search students…" value={query} onChange={e => setQuery(e.target.value)}/>{view === 'dashboard' && <button type="button" className="faculty-outline-button" onClick={() => selectView('students')}>View all students</button>}</div></div>{loading ? <p className="faculty-empty">Loading students…</p> : error ? <p className="faculty-empty faculty-error" role="alert">{error}</p> : students.length === 0 ? <p className="faculty-empty">No assigned students found.</p> : studentTable(visibleStudents)}</section>
    </div></main>
    {selectedStudent && <div className="faculty-modal-backdrop" onClick={() => setSelectedStudent(null)}><section className="faculty-modal" role="dialog" aria-modal="true" aria-label={`${selectedStudent.name} performance report`} onClick={e => e.stopPropagation()}><header><div><p className="faculty-eyebrow">STUDENT PERFORMANCE</p><h2>{selectedStudent.name}</h2><p>{selectedStudent.email}</p></div><button type="button" className="faculty-close" onClick={() => setSelectedStudent(null)} aria-label="Close report">×</button></header><div className="faculty-modal-body"><div className="faculty-report-stats"><div><small>Practice sessions</small><strong>{safeNumber(selectedStudent.practice_sessions)}</strong></div><div><small>Average score</small><strong>{selectedStudent.average_score == null ? 'N/A' : `${selectedStudent.average_score}%`}</strong></div><div><small>Completed</small><strong>{safeNumber(selectedStudent.practice_completed)}</strong></div></div><h3>Recent practice activity</h3>{selectedStudent.practice_work?.length ? selectedStudent.practice_work.map((work, index) => <article className="faculty-work" key={work.session_id ?? index}><div className="faculty-work-top"><strong>{work.title || 'Practice session'}</strong><span>{work.completed ? 'Completed' : 'In progress'}</span></div><p>{work.system || 'Clinical assessment'} · {work.difficulty || 'Difficulty not specified'}</p><p>Score: {work.score == null ? 'Not evaluated' : `${work.score}%`}</p>{work.student_report?.interview_summary && <div className="faculty-report-excerpt"><strong>Interview summary</strong><p>{work.student_report.interview_summary}</p></div>}</article>) : <p className="faculty-empty">No practice activity recorded yet.</p>}</div><footer><button type="button" className="faculty-primary-button" onClick={() => setSelectedStudent(null)}>Close report</button></footer></section></div>}
  </div>;
}
