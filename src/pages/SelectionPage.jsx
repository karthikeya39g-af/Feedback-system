import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Filter,
    ArrowRight,
    GraduationCap,
    Layers,
    Calendar,
    ChevronRight,
    LayoutDashboard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './SelectionPage.css';

const SelectionPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [selection, setSelection] = useState({
        class: 'IIIyr',
        section: 'A',
        semester: 'I'
    });

    const options = {
        classes: ['IIyr', 'IIIyr', 'IVyr'],
        sections: ['A', 'B'],
        semesters: ['I', 'II']
    };

    const handleContinue = () => {
        const queryParams = new URLSearchParams(selection).toString();
        const dashboardPath = user.role === 'admin' ? '/admin' : '/hod';
        navigate(`${dashboardPath}?${queryParams}`);
    };

    return (
        <div className="selection-container">
            <div className="selection-mesh-bg"></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="selection-card glass-panel"
            >
                <div className="selection-header">
                    <div className="selection-icon premium-gradient">
                        <Filter size={28} color="white" />
                    </div>
                    <h1>Academic Selection</h1>
                    <p className="text-muted">Select the parameters to view relevant dashboard data</p>
                </div>

                <div className="selection-grid">
                    <div className="select-group">
                        <label>
                            <GraduationCap size={16} />
                            <span>Academic Year</span>
                        </label>
                        <div className="custom-select-wrapper">
                            <select
                                value={selection.class}
                                onChange={(e) => setSelection({ ...selection, class: e.target.value })}
                            >
                                {options.classes.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="select-group">
                        <label>
                            <Layers size={16} />
                            <span>Section</span>
                        </label>
                        <div className="custom-select-wrapper">
                            <select
                                value={selection.section}
                                onChange={(e) => setSelection({ ...selection, section: e.target.value })}
                            >
                                {options.sections.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="select-group">
                        <label>
                            <Calendar size={16} />
                            <span>Semester</span>
                        </label>
                        <div className="custom-select-wrapper">
                            <select
                                value={selection.semester}
                                onChange={(e) => setSelection({ ...selection, semester: e.target.value })}
                            >
                                {options.semesters.map(sem => <option key={sem} value={sem}>{sem}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="selection-info">
                    <LayoutDashboard size={16} />
                    <span>Accessing {user?.role?.toUpperCase()} Dashboard for <strong>{selection.class} - {selection.section} (Sem {selection.semester})</strong></span>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="continue-btn premium-gradient"
                    onClick={handleContinue}
                >
                    <span>Visualize Data</span>
                    <ArrowRight size={20} />
                </motion.button>

                <button className="back-link" onClick={() => navigate('/login')}>
                    Sign out and return
                </button>
                <div className="selection-footer" style={{ textAlign: 'center', marginTop: '20px', color: '#94a3b8', fontSize: '0.8rem' }}>
                    <p>Developed and Maintained By Department of Data Science @2026</p>
                </div>
            </motion.div>
        </div>
    );
};

export default SelectionPage;
