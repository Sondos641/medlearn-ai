import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

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

  const statsCards = [
    { title: 'Learning Sessions', value: '12', change: '+3 this week', icon: '📚' },
    { title: 'Practice Completed', value: '8', change: '+2 this week', icon: '🎯' },
    { title: 'Evaluations', value: '2', change: '85% avg score', icon: '⭐' },
    { title: 'Overall Progress', value: '74%', change: '+12% from last month', icon: '📈' }
  ];

  const modules = [
    { id: 'learning', name: 'Learning Module', description: 'AI-guided conceptual learning using controlled content', icon: '🧠', status: 'available' },
    { id: 'practice', name: 'Practice Module', description: 'Interactive virtual patient interviews with feedback', icon: '💬', status: 'available' },
    { id: 'evaluation', name: 'Evaluation Module', description: 'Exam-like assessment sessions with performance reports', icon: '📝', status: 'locked' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <div className="sidebar">
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 'bold' }}>AI</span>
            </div>
            <span style={{ fontWeight: 600 }}>MedLearn AI</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className="sidebar-item active">Dashboard</button>
          <button className="sidebar-item">Learning</button>
          <button className="sidebar-item">Practice</button>
          <button className="sidebar-item">Evaluation</button>
          <button className="sidebar-item">Progress</button>
        </nav>

        <div style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px' }}>
          <div className="flex-between" style={{ marginBottom: '16px' }}>
            <span className="text-body">Dark Mode</span>
            <button onClick={toggleDarkMode} style={{ padding: '8px', borderRadius: '8px', background: 'var(--background)', border: 'none', cursor: 'pointer' }}>
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
          <button onClick={handleLogout} className="sidebar-item" style={{ color: 'var(--error)' }}>Logout</button>
        </div>
      </div>

      <div className="main-content">
        <div style={{ marginBottom: '32px' }}>
          <h1 className="h1">Welcome back, {user?.name || 'Student'}! 👋</h1>
          <p className="text-large" style={{ marginTop: '4px' }}>Continue your learning journey in Physical Assessment & Health History</p>
        </div>

        <div className="grid-4" style={{ marginBottom: '32px' }}>
          {statsCards.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="flex-between">
                <span style={{ fontSize: '32px' }}>{stat.icon}</span>
                <span style={{ fontWeight: 'bold', fontSize: '24px', color: 'var(--primary)' }}>{stat.value}</span>
              </div>
              <h3 className="h2" style={{ marginTop: '12px', marginBottom: '4px' }}>{stat.title}</h3>
              <p className="text-body">{stat.change}</p>
            </div>
          ))}
        </div>

        <div>
          <h2 className="h2" style={{ marginBottom: '16px' }}>Available Modules</h2>
          <div className="grid-3">
            {modules.map((module) => (
              <div key={module.id} className="module-card" style={{ opacity: module.status === 'locked' ? 0.7 : 1 }}>
                <div className="module-icon">{module.icon}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 className="module-title">{module.name}</h3>
                  <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '12px', background: module.status === 'available' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: module.status === 'available' ? 'var(--success)' : 'var(--warning)' }}>
                    {module.status === 'available' ? 'Available' : 'Locked'}
                  </span>
                </div>
                <p className="module-description">{module.description}</p>
                {module.status === 'locked' && (
                  <p className="text-body" style={{ marginTop: '12px', color: 'var(--warning)' }}>🔒 Complete practice sessions first</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '32px' }}>
          <h2 className="h2" style={{ marginBottom: '16px' }}>Recent Activity</h2>
          <div className="card">
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }} className="flex-between">
              <div>
                <p style={{ fontWeight: 500, marginBottom: '4px' }}>Completed Practice Session - Respiratory Assessment</p>
                <p className="text-body" style={{ fontSize: '12px' }}>2 hours ago • Score: 85%</p>
              </div>
              <span style={{ color: 'var(--success)' }}>✓ Completed</span>
            </div>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }} className="flex-between">
              <div>
                <p style={{ fontWeight: 500, marginBottom: '4px' }}>Learning Module - Cardiac System</p>
                <p className="text-body" style={{ fontSize: '12px' }}>Yesterday • Progress: 100%</p>
              </div>
              <span style={{ color: 'var(--success)' }}>✓ Completed</span>
            </div>
            <div style={{ padding: '16px' }} className="flex-between">
              <div>
                <p style={{ fontWeight: 500, marginBottom: '4px' }}>Practice Session - Neurological Assessment</p>
                <p className="text-body" style={{ fontSize: '12px' }}>2 days ago • Score: 78%</p>
              </div>
              <span style={{ color: 'var(--success)' }}>✓ Completed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;