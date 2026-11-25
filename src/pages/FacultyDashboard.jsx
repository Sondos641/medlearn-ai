
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/Logo 2 without background.png';

const FacultyDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(isDark);

    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Fetch real faculty and student data
  useEffect(() => {
    if (!user?.id) return;

    const fetchFacultyData = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          `http://127.0.0.1:5000/faculty/${user.id}/students`
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to load students.');
        }

        setStudents(result.students);
        setSummary(result.summary);
      } catch (err) {
        console.error('Faculty dashboard error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyData();
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

  // Calculate real dashboard statistics
  const totalSessions =
    (summary.total_practice_sessions || 0) +
    (summary.total_learning_sessions || 0);

  const totalCompleted = students.reduce(
    (total, student) => total + student.practice_completed,
    0
  );

  const completionRate =
    summary.total_practice_sessions > 0
      ? Math.round(
          (totalCompleted / summary.total_practice_sessions) * 100
        )
      : null;

  const summaryStats = [
    {
      label: 'Total Students',
      value: summary.total_students ?? students.length,
      icon: '👥',
    },
    {
      label: 'Total Sessions',
      value: totalSessions,
      icon: '📊',
    },
    {
      label: 'Avg. Practice Score',
      value:
        summary.average_score !== null &&
        summary.average_score !== undefined
          ? `${summary.average_score}%`
          : 'N/A',
      icon: '📈',
    },
    {
      label: 'Completion Rate',
      value: completionRate !== null ? `${completionRate}%` : 'N/A',
      icon: '✅',
    },
  ];

  return (
    <div className="dashboard">
      <div className="sidebar">
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                style={{ width: '80px', height: '80px', objectFit: 'contain' }}
              />
            </div>

            <span style={{ fontWeight: 600, fontSize: '18px', color: 'var(--text)' }}>
              MedLearn AI
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className="sidebar-item active">Dashboard</button>
          <button className="sidebar-item">Students</button>
          <button className="sidebar-item">Reports</button>
          <button className="sidebar-item">Analytics</button>
          <button className="sidebar-item">Settings</button>
        </nav>

        <div style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px' }}>
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
            <span className="text-body" style={{ color: 'var(--error)' }}>
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

      <div className="main-content">
        <div style={{ marginBottom: '32px' }}>
          <h1 className="h1">
            Welcome back, Professor {user?.name || 'Faculty'}! 📊
          </h1>

          <p className="text-large" style={{ marginTop: '4px' }}>
            Monitor student progress and performance across all modules
          </p>
        </div>

        {/* Summary Statistics */}
        <div className="grid-4" style={{ marginBottom: '32px' }}>
          {summaryStats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="flex-between">
                <span style={{ fontSize: '32px' }}>{stat.icon}</span>
                <span className="stat-value" style={{ fontSize: '24px' }}>
                  {loading ? '...' : stat.value}
                </span>
              </div>

              <h3 className="h2" style={{ marginTop: '12px', marginBottom: '4px' }}>
                {stat.label}
              </h3>
            </div>
          ))}
        </div>

        {/* Student Performance Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
            <h2 className="h2">Student Performance Overview</h2>

            <p className="text-body" style={{ marginTop: '4px' }}>
              View detailed reports and logs for each student
            </p>
          </div>

          {loading ? (
            <p style={{ padding: '24px', color: 'var(--text-secondary)' }}>
              Loading students...
            </p>
          ) : error ? (
            <p style={{ padding: '24px', color: 'var(--error)' }}>
              {error}
            </p>
          ) : students.length === 0 ? (
            <p style={{ padding: '24px', color: 'var(--text-secondary)' }}>
              No assigned students found.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: 'var(--background)' }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>Student</th>
                    <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>Progress</th>
                    <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>Sessions</th>
                    <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>Avg. Score</th>
                    <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>Last Active</th>
                    <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {students.map((student) => {
                    const totalStudentSessions =
                      student.practice_sessions + student.learning_sessions;

                    const progress =
                      student.practice_sessions > 0
                        ? Math.round(
                            (student.practice_completed / student.practice_sessions) * 100
                          )
                        : 0;

                    return (
                      <tr
                        key={student.id}
                        style={{ borderTop: '1px solid var(--border)' }}
                      >
                        <td style={{ padding: '16px' }}>
                          <div>
                            <p style={{ fontWeight: 500, marginBottom: '4px', color: 'var(--text)' }}>
                              {student.name}
                            </p>

                            <p className="text-body" style={{ fontSize: '12px' }}>
                              {student.email}
                            </p>
                          </div>
                        </td>

                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              style={{
                                flex: 1,
                                backgroundColor: 'var(--border)',
                                borderRadius: '999px',
                                height: '8px',
                                maxWidth: '96px',
                              }}
                            >
                              <div
                                style={{
                                  width: `${progress}%`,
                                  backgroundColor: 'var(--primary)',
                                  borderRadius: '999px',
                                  height: '8px',
                                }}
                              />
                            </div>

                            <span className="text-body">{progress}%</span>
                          </div>
                        </td>

                        <td style={{ padding: '16px', color: 'var(--text)' }}>
                          {totalStudentSessions}
                        </td>

                        <td style={{ padding: '16px' }}>
                          <span
                            style={{
                              fontWeight: 600,
                              color:
                                student.average_score === null
                                  ? 'var(--text-secondary)'
                                  : student.average_score >= 80
                                  ? 'var(--success)'
                                  : student.average_score >= 70
                                  ? 'var(--warning)'
                                  : 'var(--error)',
                            }}
                          >
                            {student.average_score !== null
                              ? `${student.average_score}%`
                              : 'N/A'}
                          </span>
                        </td>

                        <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                          {student.last_active
                            ? new Date(student.last_active.replace(' ', 'T')).toLocaleString()
                            : 'No activity'}
                        </td>

                        <td style={{ padding: '16px' }}>
                          <button
                            onClick={() => setSelectedStudent(student)}
                            style={{
                              padding: '6px 12px',
                              fontSize: '14px',
                              color: 'var(--primary)',
                              border: '1px solid var(--primary)',
                              borderRadius: '8px',
                              background: 'transparent',
                              cursor: 'pointer',
                            }}
                          >
                            View Report
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Module Activity */}
        <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div className="card">
            <h3 className="h2" style={{ marginBottom: '16px' }}>
              Module Activity
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <div className="flex-between" style={{ marginBottom: '8px' }}>
                <span className="text-body">Learning Sessions</span>
                <span className="text-body">{summary.total_learning_sessions || 0}</span>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div className="flex-between" style={{ marginBottom: '8px' }}>
                <span className="text-body">Practice Sessions</span>
                <span className="text-body">{summary.total_practice_sessions || 0}</span>
              </div>
            </div>

            <div>
              <div className="flex-between" style={{ marginBottom: '8px' }}>
                <span className="text-body">Completed Practice Sessions</span>
                <span className="text-body">{totalCompleted}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="h2" style={{ marginBottom: '16px' }}>
              Quick Actions
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                style={{
                  padding: '12px',
                  textAlign: 'left',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  background: 'transparent',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                <span style={{ fontWeight: 500, color: 'var(--text)' }}>
                  📊 Generate Class Report
                </span>

                <p className="text-body" style={{ fontSize: '12px', marginTop: '4px' }}>
                  Export performance data for all students
                </p>
              </button>

              <button
                style={{
                  padding: '12px',
                  textAlign: 'left',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  background: 'transparent',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                <span style={{ fontWeight: 500, color: 'var(--text)' }}>
                  📝 Review Evaluation Sessions
                </span>

                <p className="text-body" style={{ fontSize: '12px', marginTop: '4px' }}>
                  Check pending evaluation reports
                </p>
              </button>

              <button
                style={{
                  padding: '12px',
                  textAlign: 'left',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  background: 'transparent',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                <span style={{ fontWeight: 500, color: 'var(--text)' }}>
                  🔧 Manage Cases
                </span>

                <p className="text-body" style={{ fontSize: '12px', marginTop: '4px' }}>
                  Update patient scenarios and checklists
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Student Report Modal */}
      {selectedStudent && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setSelectedStudent(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--cards)',
              borderRadius: '16px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
              <h2 className="h2">
                {selectedStudent.name} - Performance Report
              </h2>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div style={{ padding: '16px', backgroundColor: 'var(--background)', borderRadius: '8px' }}>
                  <p className="text-body">Practice Sessions</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>
                    {selectedStudent.practice_sessions}
                  </p>
                </div>

                <div style={{ padding: '16px', backgroundColor: 'var(--background)', borderRadius: '8px' }}>
                  <p className="text-body">Average Score</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>
                    {selectedStudent.average_score !== null
                      ? `${selectedStudent.average_score}%`
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="h2" style={{ marginBottom: '12px' }}>
                  Recent Activity Log
                </h3>

                {selectedStudent.practice_work?.length > 0 ? (
                  selectedStudent.practice_work.map((work) => (
                    <div
                      key={work.session_id}
                      style={{
                        borderLeft: '2px solid var(--primary)',
                        paddingLeft: '16px',
                        marginBottom: '16px',
                      }}
                    >
                      <p className="text-body">
                        Practice: {work.title || 'Practice Session'}
                      </p>

                      <p className="text-body">
                        System: {work.system || 'N/A'} | Difficulty: {work.difficulty || 'N/A'}
                      </p>

                      <p className="text-body">
                        Status: {work.completed ? 'Completed' : 'In Progress'}
                      </p>

                      <p className="text-body">
                        Score: {work.score !== null ? `${work.score}%` : 'Not evaluated'}
                      </p>

                      {work.student_report && (
                        <p className="text-body" style={{ marginTop: '8px' }}>
                          Report: {work.student_report.interview_summary || 'No report available'}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-body">
                    No practice activity recorded yet.
                  </p>
                )}
              </div>
            </div>

            <div style={{ padding: '24px', borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => setSelectedStudent(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard;
