import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/Logo 2 without background.png';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activities, setActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState('');
  const [stats, setStats] = useState({
    learning_sessions: { total: 0, this_week: 0 },
    practice_completed: { total: 0, this_week: 0 },
    evaluations: { total: 0, average_score: 0 },
  });


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
          console.error('Activity fetch error:', error);
          setActivityError(error.message);
        } finally {
          setActivityLoading(false);
        }
      };
  
      fetchActivities();
    }, [user?.id]);
    // Fetch dashboard statistics
useEffect(() => {
  if (!user?.id) return;

  const fetchStats = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/student/${user.id}/stats`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load statistics');
      }

      setStats({
  learning_sessions: data.learning_sessions || { total: 0, this_week: 0 },
  practice_completed: data.practice_completed || { total: 0, this_week: 0 },
  evaluations: data.evaluations || { total: 0, average_score: 0 },
});

    } catch (error) {
      console.error('Stats fetch error:', error);
    }
  };

  fetchStats();
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

  const statsCards = [
    {
      title: 'Learning Sessions',
      value: stats.learning_sessions.total,
     change: `+${stats.learning_sessions.this_week} this week`,
      icon: '📚',
    },
    {
      title: 'Practice Completed',
      value: stats.practice_completed.total,
      change: `+${stats.practice_completed.this_week} this week`,
      icon: '🎯',
    },
    {
      title: 'Evaluations',
      value: stats.evaluations.total,
      change: `${stats.evaluations.average_score}% avg score`,
      icon: '⭐',
    },
    {
      title: 'Overall Progress',
      value: '74%',
      change: '+12% from last month',
      icon: '📈',
    },
  ];

  const modules = [
    {
      id: 'learning',
      name: 'Learning Module',
      description:
        'AI-guided conceptual learning using controlled content',
      icon: '🧠',
      status: 'available',
      path: '/student/learning',
    },
    {
      id: 'practice',
      name: 'Practice Module',
      description:
        'Interactive virtual patient interviews with feedback',
      icon: '💬',
      status: 'available',
      path: '/student/practice',
    },
    {
      id: 'evaluation',
      name: 'Evaluation Module',
      description:
        'Exam-like assessment sessions with performance reports',
      icon: '📝',
      status: 'locked',
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleModuleClick = (module) => {
    if (module.status === 'locked') {
      alert('Complete practice sessions first');
      return;
    }

    if (module.path) {
      navigate(module.path);
    }
  };

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

        {/* ================= NAVIGATION ================= */}

        <nav className="sidebar-nav">
          <button className="sidebar-item active">
            Dashboard
          </button>

          <button
            className="sidebar-item"
            onClick={() => navigate('/student/learning')}
          >
            Learning
          </button>

          <button
            className="sidebar-item"
            onClick={() => navigate('/student/practice')}
          >
            Practice
          </button>

          <button className="sidebar-item">
            Evaluation
          </button>

          <button className="sidebar-item">
            Progress
          </button>
        </nav>

        {/* ================= SIDEBAR BOTTOM ================= */}

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

      {/* ================= MAIN CONTENT ================= */}

      <div className="main-content">
        {/* ================= WELCOME ================= */}

        <div style={{ marginBottom: '32px' }}>
          <h1 className="h1">
            Welcome back, {user?.name || 'Student'}! 👋
          </h1>

          <p
            className="text-large"
            style={{ marginTop: '4px' }}
          >
            Continue your learning journey in Physical Assessment &
            Health History
          </p>
        </div>

        {/* ================= STATS ================= */}

        <div
          className="grid-4"
          style={{ marginBottom: '32px' }}
        >
          {statsCards.map((stat, index) => (
            <div
              key={index}
              className="stat-card"
            >
              <div className="flex-between">
                <span style={{ fontSize: '32px' }}>
                  {stat.icon}
                </span>

                <span
                  style={{
                    fontWeight: 'bold',
                    fontSize: '24px',
                    color: 'var(--primary)',
                  }}
                >
                  {stat.value}
                </span>
              </div>

              <h3
                className="h2"
                style={{
                  marginTop: '12px',
                  marginBottom: '4px',
                }}
              >
                {stat.title}
              </h3>

              <p className="text-body">
                {stat.change}
              </p>
            </div>
          ))}
        </div>

        {/* ================= AVAILABLE MODULES ================= */}

        <div>
          <h2
            className="h2"
            style={{ marginBottom: '16px' }}
          >
            Available Modules
          </h2>

          <div className="grid-3">
            {modules.map((module) => (
              <div
                key={module.id}
                className="module-card"
                style={{
                  opacity:
                    module.status === 'locked' ? 0.7 : 1,
                  cursor:
                    module.status === 'locked'
                      ? 'not-allowed'
                      : 'pointer',
                }}
                onClick={() => handleModuleClick(module)}
              >
                <div className="module-icon">
                  {module.icon}
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <h3 className="module-title">
                    {module.name}
                  </h3>

                  <span
                    style={{
                      fontSize: '12px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background:
                        module.status === 'available'
                          ? 'rgba(34, 197, 94, 0.1)'
                          : 'rgba(245, 158, 11, 0.1)',
                      color:
                        module.status === 'available'
                          ? 'var(--success)'
                          : 'var(--warning)',
                    }}
                  >
                    {module.status === 'available'
                      ? 'Available'
                      : 'Locked'}
                  </span>
                </div>

                <p className="module-description">
                  {module.description}
                </p>

                {module.status === 'locked' && (
                  <p
                    className="text-body"
                    style={{
                      marginTop: '12px',
                      color: 'var(--warning)',
                    }}
                  >
                    🔒 Complete practice sessions first
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        
        {/* ================= RECENT ACTIVITY ================= */}

        <div style={{ marginTop: '32px' }}>
          <h2
            className="h2"
            style={{ marginBottom: '16px' }}
          >
            Recent Activity
          </h2>

          <div className="card">
            {activityLoading ? (
              <p style={{ padding: '16px' }}>
                Loading recent activities...
              </p>
            ) : activityError ? (
              <p style={{ padding: '16px', color: 'var(--error)' }}>
                {activityError}
              </p>
            ) : activities.length === 0 ? (
              <p style={{ padding: '16px' }}>
                No practice activities yet. Start your first practice session!
              </p>
            ) : (
              activities.map((activity, index) => (
                <div
                  key={activity.session_id}
                  style={{
                    padding: '16px',
                    borderBottom:
                      index !== activities.length - 1
                        ? '1px solid var(--border)'
                        : 'none',
                  }}
                  className="flex-between"
                >
                  <div>
                    <p
                      style={{
                        fontWeight: 500,
                        marginBottom: '4px',
                      }}
                    >
                      {activity.completed
                        ? `Completed Practice Session - ${activity.title}`
                        : `Practice Session - ${activity.title}`}
                    </p>

                    <p
                      className="text-body"
                      style={{ fontSize: '12px' }}
                    >
                      {new Date(
                        activity.created_at.replace(' ', 'T') + 'Z'
                      ).toLocaleString()} 
                      {' • '}
                      {activity.completed
                        ? `Score: ${activity.score}%`
                        : 'Not completed yet'}
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
                        color: activity.completed
                          ? 'var(--success)'
                          : 'var(--warning)',
                      }}
                    >
                      {activity.completed
                        ? '✓ Completed'
                        : 'In Progress'}
                    </span>

                    {!activity.completed && (
                      <button
                      onClick={() =>
                        navigate('/student/practice', {
                          state: {
                            resumeSessionId: activity.session_id,
                          },
                        })
                      }
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '7px',
                        padding: '8px 16px',
                        background: 'var(--primary)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <span>↻</span>
                      Resume
                    </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>


      </div>
    </div>
  );
};

export default StudentDashboard;