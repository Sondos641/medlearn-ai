import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const result = await login(email, password, role);
    
    if (result.success) {
      if (role === 'faculty') {
        navigate('/faculty/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            borderRadius: '16px',
            marginBottom: '16px'
          }}>
            <svg style={{ width: '32px', height: '32px', color: 'var(--primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="h1" style={{ marginBottom: '8px' }}>MedLearn AI</h1>
          <p className="text-body">AI-Powered Virtual Patient Simulation</p>
          <p className="text-body" style={{ marginTop: '4px' }}>Physical Assessment & Health History</p>
        </div>

        <div className="role-selector">
          <button
            type="button"
            onClick={() => setRole('student')}
            className={`role-btn ${role === 'student' ? 'active' : ''}`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => setRole('faculty')}
            className={`role-btn ${role === 'faculty' ? 'active' : ''}`}
          >
            Faculty
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label className="label">University Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="student@stu.uob.edu.bh"
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label className="label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="error-message" style={{ marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%' }}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
          <p className="text-body" style={{ textAlign: 'center', fontSize: '12px' }}>
            Demo Mode: Use your university email
          </p>
          <p className="text-body" style={{ textAlign: 'center', fontSize: '12px', marginTop: '4px' }}>
            Student: student@stu.uob.edu.bh | Faculty: faculty@uob.edu.bh
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;