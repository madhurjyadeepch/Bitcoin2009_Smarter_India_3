import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './SignIn.css';

const SignIn = ({ setIsSignedIn }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSignIn = async (e) => {
        e.preventDefault();
        if (!email || !password) { setError('All fields are required.'); return; }
        setLoading(true); setError('');
        try {
            const res = await axios.post('http://127.0.0.1:3000/api/v1/users/login', { email, password });
            localStorage.setItem('jwt', res.data.token);
            setIsSignedIn(true);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally { setLoading(false); }
    };

    return (
        <div className="signin-page">
            <div className="signin-left">
                <div className="signin-brand">
                    <div className="signin-logo-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 12 15 16 10"/></svg>
                    </div>
                    <h1>Lok Samadhan</h1>
                    <p className="signin-brand-subtitle">Authority Management Portal</p>
                </div>
                <div className="signin-features">
                    <div className="signin-feature">
                        <div className="feature-icon feature-icon-1">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        </div>
                        <div>
                            <h3>Real-time Tracking</h3>
                            <p>Monitor all civic issues as they are reported by citizens</p>
                        </div>
                    </div>
                    <div className="signin-feature">
                        <div className="feature-icon feature-icon-2">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        </div>
                        <div>
                            <h3>AI-Powered Analysis</h3>
                            <p>Automatic urgency detection and smart department routing</p>
                        </div>
                    </div>
                    <div className="signin-feature">
                        <div className="feature-icon feature-icon-3">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        </div>
                        <div>
                            <h3>Worker Management</h3>
                            <p>Assign tasks and communicate via Telegram & WhatsApp</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="signin-right">
                <form className="signin-form" onSubmit={handleSignIn}>
                    <h2>Welcome Back</h2>
                    <p className="signin-form-subtitle">Sign in to your authority dashboard</p>

                    {error && <div className="signin-error">{error}</div>}

                    <label>Email</label>
                    <input type="email" placeholder="admin@department.gov.in" value={email} onChange={e => setEmail(e.target.value)} required />

                    <label>Password</label>
                    <input type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required />

                    <button type="submit" disabled={loading}>
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>

                    <p className="signin-switch-link">
                        Don't have an account? <Link to="/signup">Create Account</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default SignIn;