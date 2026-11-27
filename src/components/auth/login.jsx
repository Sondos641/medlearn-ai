import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [showDemo, setShowDemo] = useState(false);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const result = await login(email, password, role);
      if (result.success) {
        navigate(role === 'faculty' ? '/faculty/dashboard' : '/student/dashboard');
      } else {
        setError(result.error || 'Unable to log in. Please try again.');
      }
    } catch (err) {
      setError('Unable to log in. Please try again.');
    }
  };

  return (
    <main className="ml-login">
      <section className="ml-login-intro" aria-label="About MedLearn AI">
        <div className="ml-login-brand">
          <span className="ml-login-brand-icon" aria-hidden="true">✦</span>
          <span>MedLearn <strong>AI</strong></span>
        </div>
        <div className="ml-login-intro-content">
          <span className="ml-login-eyebrow">YOUR CLINICAL LEARNING COMPANION</span>
          <h1>Learn with confidence.<br /><span>Practice with purpose.</span></h1>
          <p>Build clinical reasoning skills through guided learning and interactive virtual patient simulations.</p>
          <div className="ml-login-highlights" aria-label="Platform features">
            <span>✦ AI-guided learning</span>
            <span>✦ Virtual patient practice</span>
            <span>✦ Personalized feedback</span>
          </div>
        </div>
        <p className="ml-login-intro-footer">Designed for nursing education</p>
      </section>

      <section className="ml-login-form-side" aria-label="Sign in">
        <div className="ml-login-panel">
          <div className="ml-login-mobile-brand">✦ MedLearn AI</div>
          <span className="ml-login-kicker">WELCOME BACK</span>
          <h2>Sign in to continue</h2>
          <p className="ml-login-subtitle">Use your university email to access your learning workspace.</p>

          <div className="ml-login-role-group" role="group" aria-label="Account type">
            <button type="button" className={`ml-login-role ${role === 'student' ? 'is-active' : ''}`} onClick={() => { setRole('student'); setError(''); }} aria-pressed={role === 'student'}>Student</button>
            <button type="button" className={`ml-login-role ${role === 'faculty' ? 'is-active' : ''}`} onClick={() => { setRole('faculty'); setError(''); }} aria-pressed={role === 'faculty'}>Faculty</button>
          </div>

          <form onSubmit={handleSubmit} className="ml-login-form">
            <label htmlFor="ml-login-email">University email</label>
            <input id="ml-login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={role === 'student' ? 'student@stu.uob.edu.bh' : 'faculty@uob.edu.bh'} autoComplete="username" required />

            <label htmlFor="ml-login-password">Password</label>
            <div className="ml-login-password-wrap">
              <input id="ml-login-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" required />
              <button type="button" className="ml-login-show-password" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            {error && <div className="ml-login-error" role="alert">{error}</div>}
            <button type="submit" className="ml-login-submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
          </form>

          <div className="ml-login-demo">
            <button type="button" className="ml-login-demo-toggle" aria-expanded={showDemo} onClick={() => setShowDemo((value) => !value)}>
              <span>Prototype demo access</span><span aria-hidden="true">{showDemo ? '−' : '+'}</span>
            </button>
            {showDemo && <div className="ml-login-demo-content">
              <p>For development and testing only. Use your team's configured demo password.</p>
              <p><strong>Student:</strong> student@stu.uob.edu.bh</p>
              <p><strong>Faculty:</strong> faculty@uob.edu.bh</p>
            </div>}
          </div>
          <p className="ml-login-bottom-note">MedLearn AI · University nursing education prototype</p>
        </div>
      </section>
    </main>
  );
};

export default Login;
