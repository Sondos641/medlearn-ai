import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './StudentLayout.css';

const paths = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  learning: <><path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Z"/><path d="M12 6v14"/></>,
  practice: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>,
  evaluation: <><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 10h6M9 14h6"/></>,
  progress: <><path d="M4 20V13M10 20V8M16 20V4M22 20H2"/></>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
  moon: <path d="M20 15.5A8 8 0 0 1 8.5 4 8 8 0 1 0 20 15.5Z"/>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></>
};
const Icon = ({ name }) => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;

export default function StudentLayout({ isDarkMode, onToggleTheme, onLogout, mobileOpen = false, onClose = () => {} }) {
  const [localOpen, setLocalOpen] = useState(false);
  const isOpen = mobileOpen || localOpen;
  const close = () => { setLocalOpen(false); onClose(); };
  const links = [ ['Dashboard','dashboard','/student/dashboard'], ['Learning','learning','/student/learning'], ['Practice','practice','/student/practice'] ];
  return <>
    <button type="button" className="student-mobile-toggle" aria-label="Open navigation" onClick={() => setLocalOpen(true)}>☰</button>
    {isOpen && <button className="student-nav-backdrop" type="button" aria-label="Close navigation" onClick={close} />}
    <aside className={`student-sidebar ${isOpen ? 'student-sidebar-open' : ''}`} aria-label="Student navigation">
      <div className="student-brand"><span className="student-brand-symbol" aria-hidden="true">✦</span><span>MedLearn <strong>AI</strong></span></div>
      <div className="student-nav-heading">WORKSPACE</div>
      <nav className="student-nav-links">
        {links.map(([label, icon, path]) => <NavLink key={path} to={path} onClick={close} className={({isActive}) => `student-nav-link ${isActive ? 'active' : ''}`}><Icon name={icon}/>{label}</NavLink>)}
      </nav>
      <div className="student-nav-heading student-coming-heading">COMING LATER</div>
      <div className="student-nav-link student-nav-unavailable"><Icon name="evaluation"/>Evaluation <small>Soon</small></div>
      <div className="student-nav-link student-nav-unavailable"><Icon name="progress"/>Progress <small>Soon</small></div>
      <div className="student-nav-bottom">
        <button type="button" className="student-nav-link" onClick={onToggleTheme}><Icon name={isDarkMode ? 'sun' : 'moon'}/>{isDarkMode ? 'Light appearance' : 'Dark appearance'}</button>
        <button type="button" className="student-nav-link student-nav-logout" onClick={onLogout}><Icon name="logout"/>Sign out</button>
      </div>
    </aside>
  </>;
}
