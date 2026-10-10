import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, ShieldCheck, Lock, ArrowRight, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
    const [role, setRole] = useState('student'); // 'student', 'admin' or 'hod'
    const [email, setEmail] = useState('');
    const [rollnumber, setRollNumber] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const user = await login(email, password, role, rollnumber);

            if (user.feedbackRestricted) {
                setError(`You have already given feedback. Please try again in ${user.daysRemaining} days.`);
            } else if (user.role === 'admin') {
                navigate('/admin'); // Direct to Admin Dashboard
            } else if (user.role === 'hod') {
                navigate('/hod'); // Direct to HOD Dashboard
            } else {
                navigate('/feedback');
            }
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        }
    };

    return (
        <div className="login-container">
            <div className="login-mesh-bg"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="login-card glass-panel"
            >
                <div className="login-header">
                    <div className="logo-icon premium-gradient">
                        <ClipboardCheck size={32} color="white" />
                    </div>
                    <h1>Feedback System</h1>
                    <p className="text-muted">Sign in to manage academic excellence</p>
                </div>

                <div className="role-selector">
                    <button
                        className={`role-tab ${role === 'student' ? 'active' : ''}`}
                        onClick={() => setRole('student')}
                    >
                        <User size={18} />
                        <span>Student</span>
                    </button>
                    <button
                        className={`role-tab ${role === 'hod' ? 'active' : ''}`}
                        onClick={() => setRole('hod')}
                    >
                        <User size={18} />
                        <span>HOD</span>
                    </button>
                    <button
                        className={`role-tab ${role === 'admin' ? 'active' : ''}`}
                        onClick={() => setRole('admin')}
                    >
                        <ShieldCheck size={18} />
                        <span>Admin</span>
                    </button>
                </div>

                {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="error-message">{error}</motion.div>}

                <form onSubmit={handleLogin} className="login-form">
                    <div className="input-group">
                        <label>{role === 'student' ? 'Roll Number' : 'Email Address'}</label>
                        <div className="input-wrapper">
                            <User size={18} className="input-icon" />
                            {role === 'student' ? (
                                <input
                                    type="text"
                                    placeholder="e.g. 22U21A0501"
                                    value={rollnumber}
                                    onChange={(e) => setRollNumber(e.target.value)}
                                    required
                                />
                            ) : (
                                <input
                                    type="email"
                                    placeholder="hod.ds@college.edu"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            )}
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="login-button premium-gradient"
                    >
                        <span>Continue</span>
                        <ArrowRight size={18} />
                    </motion.button>
                </form>

                <div className="login-footer">
                    <p>Are you a student? <a href="/feedback">Submit Feedback</a></p>
                    <p className="footer-credits">Developed and Maintained By Department of Data Science @2026</p>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
