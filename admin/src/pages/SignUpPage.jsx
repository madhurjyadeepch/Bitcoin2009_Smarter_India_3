import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../components/SignIn.css';

const DEPARTMENTS = [
    "Road & Infrastructure",
    "Sanitation & Waste Management",
    "Electricity & Lighting",
    "Water & Drainage",
    "Law Enforcement & Security",
    "General Municipal Services",
    "Public Works Department (PWD)",
    "Urban Development & Housing",
    "Fire & Emergency Services",
    "Health & Family Welfare",
    "Environment & Forest",
    "Transport & Traffic",
    "Revenue & Land Records",
    "Education & Literacy",
    "Social Welfare & Women Development",
    "Panchayati Raj & Rural Development",
    "Disaster Management Authority",
    "Food & Civil Supplies",
    "Telecommunications & IT",
    "Municipal Corporation Administration",
];

export default function SignUpPage({ setIsSignedIn }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [department, setDepartment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSignUp = async (e) => {
        e.preventDefault();
        if (!name || !email || !password || !passwordConfirm || !department) {
            setError('All fields are required.'); return;
        }
        if (password !== passwordConfirm) {
            setError('Passwords do not match.'); return;
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters.'); return;
        }
        setLoading(true); setError('');
        try {
            const res = await axios.post('http://127.0.0.1:3000/api/v1/users/signup', {
                name: `${name} (${department})`,
                email,
                password,
                passwordConfirm,
                role: 'admin',
            });
            localStorage.setItem('jwt', res.data.token);
            setIsSignedIn(true);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        </div>
                        <div>
                            <h3>Multi-Department Support</h3>
                            <p>Register under any government department across India</p>
                        </div>
                    </div>
                    <div className="signin-feature">
                        <div className="feature-icon feature-icon-2">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        </div>
                        <div>
                            <h3>Manage Reports</h3>
                            <p>View, prioritize, and resolve citizen-reported issues</p>
                        </div>
                    </div>
                    <div className="signin-feature">
                        <div className="feature-icon feature-icon-3">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        </div>
                        <div>
                            <h3>Instant Notifications</h3>
                            <p>Notify workers instantly via Telegram and WhatsApp</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="signin-right">
                <form className="signin-form signup-form" onSubmit={handleSignUp}>
                    <h2>Create Account</h2>
                    <p className="signin-form-subtitle">Register as a government authority</p>

                    {error && <div className="signin-error">{error}</div>}

                    <label>Full Name</label>
                    <input type="text" placeholder="Enter your full name" value={name} onChange={e => setName(e.target.value)} required />

                    <label>Official Email</label>
                    <input type="email" placeholder="admin@department.gov.in" value={email} onChange={e => setEmail(e.target.value)} required />

                    <label>Department</label>
                    <select value={department} onChange={e => setDepartment(e.target.value)} required>
                        <option value="" disabled>Select your department</option>
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>

                    <div className="password-row">
                        <div className="password-field">
                            <label>Password</label>
                            <input type="password" placeholder="Min 8 characters" value={password} onChange={e => setPassword(e.target.value)} required />
                        </div>
                        <div className="password-field">
                            <label>Confirm Password</label>
                            <input type="password" placeholder="Re-enter password" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} required />
                        </div>
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>

                    <p className="signin-switch-link">
                        Already have an account? <Link to="/signin">Sign In</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
