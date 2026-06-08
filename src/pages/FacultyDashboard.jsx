import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const FacultyDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

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

  const students = [
    { id: 1, name: 'Emma Wilson', email: 'emma.wilson@university.edu', progress: 78, lastActive: '2024-01-15', sessions: 12, avgScore: 82 },
    { id: 2, name: 'James Chen', email: 'james.chen@university.edu', progress: 65, lastActive: '2024-01-14', sessions: 8, avgScore: 74 },
    { id: 3, name: 'Sarah Johnson', email: 'sarah.johnson@university.edu', progress: 92, lastActive: '2024-01-15', sessions: 15, avgScore: 91 },
  ];

  const summaryStats = [
    { label: 'Total Students', value: '45', change: '+12 this semester', icon: '👥' },
    { label: 'Active Sessions', value: '128', change: '+23 this week', icon: '📊' },
    { label: 'Avg. Practice Score', value: '78%', change: '+5% vs last month', icon: '📈' },
    { label: 'Completion Rate', value: '82%', change: '+8% this month', icon: '✅' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 'bold' }}>AI</span>
            </div>
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>MedLearn AI</span>
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
            <span className="text-body">Dark Mode</span>
            <button 
              onClick={toggleDarkMode} 
              style={{ padding: '8px', borderRadius: '8px', background: 'var(--background)', border: 'none', cursor: 'pointer' }}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
          <button onClick={handleLogout} className="sidebar-item" style={{ color: 'var(--error)' }}>Logout</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Greeting */}
        <div style={{ marginBottom: '32px' }}>
          <h1 className="h1">Welcome back, Professor {user?.name || 'Faculty'}! 📊</h1>
          <p className="text-large" style={{ marginTop: '4px' }}>Monitor student progress and performance across all modules</p>
        </div>

        {/* Summary Stats */}
        <div className="grid-4" style={{ marginBottom: '32px' }}>
          {summaryStats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="flex-between">
                <span style={{ fontSize: '32px' }}>{stat.icon}</span>
                <span className="stat-value" style={{ fontSize: '24px' }}>{stat.value}</span>
              </div>
              <h3 className="h2" style={{ marginTop: '12px', marginBottom: '4px' }}>{stat.label}</h3>
              <p className="text-body">{stat.change}</p>
            </div>
          ))}
        </div>

        {/* Students Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
            <h2 className="h2">Student Performance Overview</h2>
            <p className="text-body" style={{ marginTop: '4px' }}>View detailed reports and logs for each student</p>
          </div>
          
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
                {students.map((student) => (
                  <tr key={student.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px' }}>
                      <div>
                        <p style={{ fontWeight: 500, marginBottom: '4px', color: 'var(--text)' }}>{student.name}</p>
                        <p className="text-body" style={{ fontSize: '12px' }}>{student.email}</p>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, backgroundColor: 'var(--border)', borderRadius: '999px', height: '8px', maxWidth: '96px' }}>
                          <div 
                            style={{ width: `${student.progress}%`, backgroundColor: 'var(--primary)', borderRadius: '999px', height: '8px' }}
                          />
                        </div>
                        <span className="text-body">{student.progress}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text)' }}>{student.sessions}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        fontWeight: 600, 
                        color: student.avgScore >= 80 ? 'var(--success)' : student.avgScore >= 70 ? 'var(--warning)' : 'var(--error)'
                      }}>
                        {student.avgScore}%
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{student.lastActive}</td>
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
                          cursor: 'pointer'
                        }}
                      >
                        View Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Performance Chart Section */}
        <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div className="card">
            <h3 className="h2" style={{ marginBottom: '16px' }}>Module Performance</h3>
            <div style={{ marginBottom: '16px' }}>
              <div className="flex-between" style={{ marginBottom: '8px' }}>
                <span className="text-body">Learning Module</span>
                <span className="text-body">85%</span>
              </div>
              <div style={{ backgroundColor: 'var(--border)', borderRadius: '999px', height: '8px' }}>
                <div style={{ width: '85%', backgroundColor: 'var(--primary)', borderRadius: '999px', height: '8px' }} />
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div className="flex-between" style={{ marginBottom: '8px' }}>
                <span className="text-body">Practice Module</span>
                <span className="text-body">72%</span>
              </div>
              <div style={{ backgroundColor: 'var(--border)', borderRadius: '999px', height: '8px' }}>
                <div style={{ width: '72%', backgroundColor: 'var(--accent)', borderRadius: '999px', height: '8px' }} />
              </div>
            </div>
            <div>
              <div className="flex-between" style={{ marginBottom: '8px' }}>
                <span className="text-body">Evaluation Module</span>
                <span className="text-body">68%</span>
              </div>
              <div style={{ backgroundColor: 'var(--border)', borderRadius: '999px', height: '8px' }}>
                <div style={{ width: '68%', backgroundColor: 'var(--warning)', borderRadius: '999px', height: '8px' }} />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="h2" style={{ marginBottom: '16px' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button style={{ padding: '12px', textAlign: 'left', border: '1px solid var(--border)', borderRadius: '8px', background: 'transparent', cursor: 'pointer', width: '100%' }}>
                <span style={{ fontWeight: 500, color: 'var(--text)' }}>📊 Generate Class Report</span>
                <p className="text-body" style={{ fontSize: '12px', marginTop: '4px' }}>Export performance data for all students</p>
              </button>
              <button style={{ padding: '12px', textAlign: 'left', border: '1px solid var(--border)', borderRadius: '8px', background: 'transparent', cursor: 'pointer', width: '100%' }}>
                <span style={{ fontWeight: 500, color: 'var(--text)' }}>📝 Review Evaluation Sessions</span>
                <p className="text-body" style={{ fontSize: '12px', marginTop: '4px' }}>Check pending evaluation reports</p>
              </button>
              <button style={{ padding: '12px', textAlign: 'left', border: '1px solid var(--border)', borderRadius: '8px', background: 'transparent', cursor: 'pointer', width: '100%' }}>
                <span style={{ fontWeight: 500, color: 'var(--text)' }}>🔧 Manage Cases</span>
                <p className="text-body" style={{ fontSize: '12px', marginTop: '4px' }}>Update patient scenarios and checklists</p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Student Report */}
      {selectedStudent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setSelectedStudent(null)}>
          <div style={{ backgroundColor: 'var(--cards)', borderRadius: '16px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
              <h2 className="h2">{selectedStudent.name} - Performance Report</h2>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div style={{ padding: '16px', backgroundColor: 'var(--background)', borderRadius: '8px' }}>
                  <p className="text-body">Practice Sessions</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>{selectedStudent.sessions}</p>
                </div>
                <div style={{ padding: '16px', backgroundColor: 'var(--background)', borderRadius: '8px' }}>
                  <p className="text-body">Average Score</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>{selectedStudent.avgScore}%</p>
                </div>
              </div>
              <div>
                <h3 className="h2" style={{ marginBottom: '12px' }}>Recent Activity Log</h3>
                <div style={{ borderLeft: '2px solid var(--primary)', paddingLeft: '16px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <p className="text-body">Practice: Respiratory Assessment - 85%</p>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <p className="text-body">Learning: Cardiac System - Completed</p>
                  </div>
                  <div>
                    <p className="text-body">Practice: Neurological Exam - 78%</p>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ padding: '24px', borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setSelectedStudent(null)} style={{ padding: '8px 16px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard;