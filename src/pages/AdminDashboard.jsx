import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    BarChart3,
    Settings,
    LogOut,
    Plus,
    Building2,
    ChevronRight,
    TrendingUp,
    MessageSquare,
    Clock,
    BookOpen,
    ClipboardList
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';
import './FeedbackTable.css';
import { generatePDF, generateExcel, generateWord } from '../utils/reportGenerator';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, user } = useAuth();
    const [file, setFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [subjectsData, setSubjectsData] = useState([]);
    const [jsonError, setJsonError] = useState('');
    const [activeSection, setActiveSection] = useState('overview'); // overview, students, curriculum, settings, class_analysis
    const [viewMode, setViewMode] = useState('subject'); // 'subject' or 'faculty'

    // Admin Analysis State
    const [selection, setSelection] = useState({
        class: 'IIIyr',
        section: 'A',
        semester: 'II'
    });
    const [analytics, setAnalytics] = useState({
        totalSubmissions: 0,
        coursePerformance: [],
        facultyPerformance: []
    });

    // Fetch subjects on load
    React.useEffect(() => {
        fetchSubjects();
    }, []);

    // Fetch analytics when section is class_analysis
    React.useEffect(() => {
        if (activeSection === 'class_analysis') {
            fetchAnalytics();
        }
    }, [activeSection, selection]);

    const fetchSubjects = async () => {
        try {
            const res = await fetch('/api/admin/subjects');
            if (res.ok) {
                const data = await res.json();
                setSubjectsData(data);
            }
        } catch (err) {
            console.error("Failed to load subjects", err);
        }
    };

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            let queryParams = new URLSearchParams();
            queryParams.append('semester', selection.semester);
            queryParams.append('class', selection.class);
            queryParams.append('section', selection.section);

            const res = await fetch(`/api/analytics?${queryParams.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setAnalytics(data);
        } catch (error) {
            console.error("Failed to fetch analytics", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setUploadStatus('');
    };

    const handleUpload = async () => {
        if (!file) {
            setUploadStatus('Please select a file first.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setLoading(true);
        try {
            const res = await fetch('/api/admin/upload-students', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (res.ok) {
                setUploadStatus(`Success: ${data.message}`);
                setFile(null);
            } else {
                setUploadStatus(`Error: ${data.message}`);
            }
        } catch (err) {
            setUploadStatus(`Upload failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteStudents = async () => {
        if (!window.confirm("Are you sure? This will delete ALL student data!")) return;
        setLoading(true);
        try {
            const res = await fetch('/api/admin/students', { method: 'DELETE' });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || res.statusText);
            }
            const data = await res.json();
            alert(data.message);
        } catch (err) {
            console.error("Delete failed:", err);
            alert("Action failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteFeedback = async () => {
        if (!window.confirm("Are you sure? This will delete ALL feedback data!")) return;
        setLoading(true);
        try {
            const res = await fetch('/api/admin/feedback', { method: 'DELETE' });
            if (!res.ok) {
                const text = await res.text();
                // Try to parse JSON error if possible
                try {
                    const json = JSON.parse(text);
                    throw new Error(json.message || "Server Error");
                } catch (e) {
                    throw new Error(`Server Error (${res.status}): ${text.substring(0, 100)}...`);
                }
            }
            const data = await res.json();
            alert(data.message);
        } catch (err) {
            console.error("Delete failed:", err);
            alert("Action failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSubjects = async () => {
        try {
            // Validate JSON
            // subjectsData is already an object if input handled correctly,
            // but if we use a textarea we might need to parse.
            // For this simpler version, let's assume we edit it as text.

            const res = await fetch('/api/admin/subjects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subjectsData)
            });

            if (!res.ok) {
                const text = await res.text();
                // Try format error
                try {
                    const json = JSON.parse(text);
                    throw new Error(json.message || res.statusText);
                } catch (e) {
                    throw new Error(`Server Error (${res.status}): ${text.substring(0, 100)}`);
                }
            }

            const data = await res.json();
            alert("Curriculum updated successfully!");
            fetchSubjects();
        } catch (err) {
            console.error("Save failed:", err);
            alert("Failed to save: " + err.message);
        }
    };


    const getFacultyWiseData = () => {
        const facultyMap = {};

        const processStats = (stats) => {
            if (!stats) return;
            stats.forEach(item => {
                const key = item.faculty;
                if (!facultyMap[key]) {
                    facultyMap[key] = {
                        faculty: item.faculty,
                        totalFeedback: 0,
                        subjectCount: 0,
                        subjects: [],
                        comments: []
                    };
                }
                const entry = facultyMap[key];
                const val = parseFloat(item.feedback);
                if (!isNaN(val)) {
                    entry.totalFeedback += val;
                    entry.subjectCount += 1;
                    entry.subjects.push(`${item.subject} (${val}%)`);
                    if (item.comments) entry.comments.push(...item.comments);
                }
            });
        };

        processStats(analytics.theoryStats);
        processStats(analytics.labStats);

        return Object.values(facultyMap).map(f => ({
            faculty: f.faculty,
            subjects: f.subjects.join(', '),
            feedback: f.subjectCount > 0 ? (f.totalFeedback / f.subjectCount).toFixed(1) : '0',
            comments: f.comments
        }));
    };

    const handleDownload = (format) => {
        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `Feedback_Report_${selection.class}_${selection.section}_${viewMode}_${timestamp}`;

        if (viewMode === 'subject') {
            const data = [];
            const excelData = [];

            const processSection = (stats, type) => {
                if (!stats) return;
                stats.forEach((row, i) => {
                    // Ensure comments string
                    const commentsStr = (row.comments && row.comments.length > 0) ? row.comments.join('; ') : 'No Comments';

                    const sno = type === 'Theory' ? i + 1 : (analytics.theoryStats?.length || 0) + i + 1;
                    data.push([sno, row.faculty, row.subject, type, row.feedback + '%', commentsStr]);

                    // Excel Row
                    excelData.push({
                        'S.No': sno,
                        'Faculty': row.faculty,
                        'Subject': row.subject,
                        'Type': type,
                        'Feedback (%)': row.feedback,
                        'Comments': commentsStr
                    });
                });
            };

            processSection(analytics.theoryStats, 'Theory');
            processSection(analytics.labStats, 'Lab');

            const columns = ['S.No', 'Faculty', 'Subject', 'Type', 'Feedback', 'Comments'];

            if (format === 'pdf') generatePDF(columns, data, `Subject Wise Feedback - ${selection.class} ${selection.section}`, filename);
            if (format === 'excel') generateExcel(excelData, filename);
            if (format === 'word') generateWord(columns, data, `Subject Wise Feedback - ${selection.class} ${selection.section}`, filename);
        } else {
            const facultyData = getFacultyWiseData();

            const data = facultyData.map((row, i) => {
                const commentsStr = (row.comments && row.comments.length > 0) ? row.comments.join('; ') : 'No Comments';
                return [i + 1, row.faculty, row.subjects, row.feedback + '%', commentsStr];
            });

            const columns = ['S.No', 'Faculty', 'Subjects', 'Avg Feedback', 'Comments'];

            const excelData = facultyData.map((row, i) => ({
                'S.No': i + 1,
                'Faculty': row.faculty,
                'Subjects': row.subjects,
                'Avg Feedback (%)': row.feedback,
                'Comments': (row.comments && row.comments.length > 0) ? row.comments.join('; ') : 'No Comments'
            }));

            if (format === 'pdf') generatePDF(columns, data, `Faculty Wise Feedback - ${selection.class} ${selection.section}`, filename);
            if (format === 'excel') generateExcel(excelData, filename);
            if (format === 'word') generateWord(columns, data, `Faculty Wise Feedback - ${selection.class} ${selection.section}`, filename);
        }
    };

    const calculateOverallPerformance = () => {
        let total = 0;
        let count = 0;
        if (analytics.theoryStats) {
            analytics.theoryStats.forEach(s => {
                const val = parseFloat(s.feedback);
                if (!isNaN(val)) { total += val; count++; }
            });
        }
        if (analytics.labStats) {
            analytics.labStats.forEach(s => {
                const val = parseFloat(s.feedback);
                if (!isNaN(val)) { total += val; count++; }
            });
        }
        return count > 0 ? (total / count).toFixed(1) : '0';
    };

    return (
        <div className="dashboard-container">
            <aside className="sidebar glass-panel">
                <div className="sidebar-header">
                    <div className="logo-small premium-gradient">
                        <BarChart3 size={20} color="white" />
                    </div>
                    <h3>Admin Panel</h3>
                </div>

                <nav className="sidebar-nav">
                    <button onClick={() => setActiveSection('overview')} className={`nav-item ${activeSection === 'overview' ? 'active' : ''}`}>
                        <TrendingUp size={18} />
                        <span>Overview</span>
                    </button>
                    <button onClick={() => setActiveSection('class_analysis')} className={`nav-item ${activeSection === 'class_analysis' ? 'active' : ''}`}>
                        <BookOpen size={18} />
                        <span>Class Analysis</span>
                    </button>
                    <button onClick={() => setActiveSection('students')} className={`nav-item ${activeSection === 'students' ? 'active' : ''}`}>
                        <Users size={18} />
                        <span>Student Data</span>
                    </button>
                    <button onClick={() => setActiveSection('curriculum')} className={`nav-item ${activeSection === 'curriculum' ? 'active' : ''}`}>
                        <Building2 size={18} />
                        <span>Curriculum</span>
                    </button>
                    <button onClick={() => setActiveSection('settings')} className={`nav-item ${activeSection === 'settings' ? 'active' : ''}`}>
                        <Settings size={18} />
                        <span>Settings</span>
                    </button>
                </nav>

                <button className="logout-btn" onClick={logout}>
                    <LogOut size={18} />
                    <span>Sign Out</span>
                </button>
            </aside>

            <main className="main-content">
                <header className="content-header">
                    <div className="welcome">
                        <h1>Admin Dashboard</h1>
                        <p className="text-muted">Manage System Data and Configurations</p>
                    </div>
                </header>

                {activeSection === 'overview' && (
                    <section className="stats-grid">
                        <div className="stat-card glass-panel">
                            <h3>Quick Actions</h3>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button className="login-button premium-gradient" style={{ padding: '10px' }} onClick={() => setActiveSection('class_analysis')}>View Feedback</button>
                                <button className="login-button premium-gradient" style={{ padding: '10px' }} onClick={() => setActiveSection('students')}>Upload Students</button>
                                <button className="login-button premium-gradient" style={{ padding: '10px' }} onClick={() => setActiveSection('curriculum')}>Manage Subjects</button>
                            </div>
                        </div>
                    </section>
                )}

                {activeSection === 'class_analysis' && (
                    <section className="dashboard-grid-full">
                        <div className="grid-full glass-panel">
                            <div className="section-title">
                                <h2>Class Feedback Analysis</h2>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <select value={selection.class} onChange={(e) => setSelection({ ...selection, class: e.target.value })} className="glass-select">
                                        <option value="IIyr">II Year</option>
                                        <option value="IIIyr">III Year</option>
                                        <option value="IVyr">IV Year</option>
                                    </select>
                                    <select value={selection.section} onChange={(e) => setSelection({ ...selection, section: e.target.value })} className="glass-select">
                                        <option value="A">Section A</option>
                                        <option value="B">Section B</option>
                                    </select>
                                    <select value={selection.semester} onChange={(e) => setSelection({ ...selection, semester: e.target.value })} className="glass-select">
                                        <option value="I">Sem I</option>
                                        <option value="II">Sem II</option>
                                    </select>
                                    <div className="view-toggle" style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '2px' }}>
                                        <button
                                            onClick={() => setViewMode('subject')}
                                            style={{
                                                padding: '5px 10px',
                                                background: viewMode === 'subject' ? 'rgba(255,255,255,0.2)' : 'transparent',
                                                color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'
                                            }}
                                        >
                                            Subject Wise
                                        </button>
                                        <button
                                            onClick={() => setViewMode('faculty')}
                                            style={{
                                                padding: '5px 10px',
                                                background: viewMode === 'faculty' ? 'rgba(255,255,255,0.2)' : 'transparent',
                                                color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'
                                            }}
                                        >
                                            Faculty Wise
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <button className="download-btn premium-gradient" onClick={() => handleDownload('excel')} style={{ padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', color: 'white' }}>Excel</button>
                                        <button className="download-btn premium-gradient" onClick={() => handleDownload('pdf')} style={{ padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', color: 'white' }}>PDF</button>
                                        <button className="download-btn premium-gradient" onClick={() => handleDownload('word')} style={{ padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', color: 'white' }}>Word</button>
                                    </div>
                                </div>
                            </div>

                            <div className="overall-score" style={{ padding: '20px', textAlign: 'center', marginBottom: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                                <h3>Overall Class Performance: <span style={{ color: '#4ade80', fontSize: '1.5em' }}>{calculateOverallPerformance()}%</span></h3>
                            </div>

                            {viewMode === 'subject' ? (
                                <>
                                    <h3 style={{ marginTop: '20px' }}>Theory Subjects</h3>
                                    <div className="table-container">
                                        <table className="feedback-table" style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid #334155' }}>
                                                    <th style={{ padding: '10px' }}>Faculty</th>
                                                    <th style={{ padding: '10px' }}>Subject</th>
                                                    <th style={{ padding: '10px' }}>P1</th>
                                                    <th style={{ padding: '10px' }}>P2</th>
                                                    <th style={{ padding: '10px' }}>P3</th>
                                                    <th style={{ padding: '10px' }}>P4</th>
                                                    <th style={{ padding: '10px' }}>P5</th>
                                                    <th style={{ padding: '10px' }}>P6</th>
                                                    <th style={{ padding: '10px' }}>P7</th>
                                                    <th style={{ padding: '10px' }}>P8</th>
                                                    <th style={{ padding: '10px' }}>P9</th>
                                                    <th style={{ padding: '10px' }}>P10</th>
                                                    <th style={{ padding: '10px' }}>%</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {analytics.theoryStats?.map((row, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                                                        <td style={{ padding: '10px' }}>{row.faculty}</td>
                                                        <td style={{ padding: '10px' }}>{row.subject}</td>
                                                        <td>{row.P1 || row.p1 || '-'}</td>
                                                        <td>{row.P2 || row.p2 || '-'}</td>
                                                        <td>{row.P3 || row.p3 || '-'}</td>
                                                        <td>{row.P4 || row.p4 || '-'}</td>
                                                        <td>{row.P5 || row.p5 || '-'}</td>
                                                        <td>{row.P6 || row.p6 || '-'}</td>
                                                        <td>{row.P7 || row.p7 || '-'}</td>
                                                        <td>{row.P8 || row.p8 || '-'}</td>
                                                        <td>{row.P9 || row.p9 || '-'}</td>
                                                        <td>{row.P10 || row.p10 || '-'}</td>
                                                        <td style={{ fontWeight: 'bold', color: '#4ade80' }}>{row.feedback}%</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <h3 style={{ marginTop: '30px' }}>Laboratory Subjects</h3>
                                    <div className="table-container">
                                        <table className="feedback-table" style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid #334155' }}>
                                                    <th style={{ padding: '10px' }}>Faculty</th>
                                                    <th style={{ padding: '10px' }}>Subject</th>
                                                    <th style={{ padding: '10px' }}>L1</th>
                                                    <th style={{ padding: '10px' }}>L2</th>
                                                    <th style={{ padding: '10px' }}>L3</th>
                                                    <th style={{ padding: '10px' }}>L4</th>
                                                    <th style={{ padding: '10px' }}>L5</th>
                                                    <th style={{ padding: '10px' }}>L6</th>
                                                    <th style={{ padding: '10px' }}>L7</th>
                                                    <th style={{ padding: '10px' }}>L8</th>
                                                    <th style={{ padding: '10px' }}>%</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {analytics.labStats?.map((row, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                                                        <td style={{ padding: '10px' }}>{row.faculty}</td>
                                                        <td style={{ padding: '10px' }}>{row.subject}</td>
                                                        <td>{row.L1 || row.l1 || row.P1 || row.p1 || '-'}</td>
                                                        <td>{row.L2 || row.l2 || row.P2 || row.p2 || '-'}</td>
                                                        <td>{row.L3 || row.l3 || row.P3 || row.p3 || '-'}</td>
                                                        <td>{row.L4 || row.l4 || row.P4 || row.p4 || '-'}</td>
                                                        <td>{row.L5 || row.l5 || row.P5 || row.p5 || '-'}</td>
                                                        <td>{row.L6 || row.l6 || row.P6 || row.p6 || '-'}</td>
                                                        <td>{row.L7 || row.l7 || row.P7 || row.p7 || '-'}</td>
                                                        <td>{row.L8 || row.l8 || row.P8 || row.p8 || '-'}</td>
                                                        <td style={{ fontWeight: 'bold', color: '#4ade80' }}>{row.feedback}%</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            ) : (
                                <div className="table-container" style={{ marginTop: '20px' }}>
                                    <h3 style={{ marginBottom: '15px' }}>Faculty Performance Analysis</h3>
                                    <table className="feedback-table" style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #334155' }}>
                                                <th style={{ padding: '10px' }}>S.No</th>
                                                <th style={{ padding: '10px' }}>Faculty Name</th>
                                                <th style={{ padding: '10px' }}>Subjects Taught</th>
                                                <th style={{ padding: '10px' }}>Average Feedback</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {getFacultyWiseData().map((row, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                                                    <td style={{ padding: '10px' }}>{i + 1}</td>
                                                    <td style={{ padding: '10px' }}>{row.faculty}</td>
                                                    <td style={{ padding: '10px' }}>{row.subjects}</td>
                                                    <td style={{ fontWeight: 'bold', color: '#4ade80' }}>{row.feedback}%</td>
                                                </tr>
                                            ))}
                                            {getFacultyWiseData().length === 0 && (
                                                <tr>
                                                    <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No data available for this selection.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                        </div>
                    </section>
                )}

                {activeSection === 'students' && (
                    <section className="dashboard-grid-full">
                        <div className="grid-full glass-panel">
                            <div className="section-title"><h2>Manage Student Data</h2></div>

                            <div className="upload-section" style={{ padding: '20px', border: '1px dashed #ffffff30', borderRadius: '10px', marginBottom: '20px' }}>
                                <h3>1. Upload Student Roll List (Excel)</h3>
                                <p className="text-muted">Upload an Excel file (.xlsx) with columns: <code>Roll Number, Name, Class, Section, Semester</code></p>
                                <br />
                                <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="glass-select" style={{ width: '100%' }} />
                                <br /><br />
                                <button onClick={handleUpload} disabled={loading || !file} className="login-button premium-gradient">
                                    {loading ? 'Uploading...' : 'Upload & Update Students'}
                                </button>
                                {uploadStatus && <p style={{ marginTop: '10px', color: uploadStatus.startsWith('Success') ? '#4ade80' : '#f87171' }}>{uploadStatus}</p>}
                            </div>

                            <div className="danger-zone" style={{ padding: '20px', backgroundColor: '#ef444420', borderRadius: '10px' }}>
                                <h3 style={{ color: '#f87171' }}>Danger Zone</h3>
                                <div style={{ display: 'flex', gap: '20px', marginTop: '15px' }}>
                                    <button onClick={handleDeleteStudents} disabled={loading} className="logout-btn" style={{ width: 'auto', backgroundColor: '#ef4444', color: 'white' }}>
                                        Delete ALL Students
                                    </button>
                                    <button onClick={handleDeleteFeedback} disabled={loading} className="logout-btn" style={{ width: 'auto', backgroundColor: '#ef4444', color: 'white' }}>
                                        Delete ALL Feedback
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {activeSection === 'curriculum' && (
                    <section className="dashboard-grid-full">
                        <div className="grid-full glass-panel">
                            <div className="section-title"><h2>Manage Curriculum (Faculty & Subjects)</h2></div>
                            <p className="text-muted">Edit the JSON configuration below to update subjects and faculty allocations.</p>
                            <br />
                            <textarea
                                value={JSON.stringify(subjectsData, null, 4)}
                                onChange={(e) => {
                                    try {
                                        const parsed = JSON.parse(e.target.value);
                                        setSubjectsData(parsed);
                                        setJsonError('');
                                    } catch (err) {
                                        setSubjectsData(e.target.value); // Keep typing
                                        setJsonError(err.message);
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    height: '500px',
                                    backgroundColor: '#0f172a',
                                    color: '#e2e8f0',
                                    fontFamily: 'monospace',
                                    padding: '15px',
                                    borderRadius: '8px',
                                    border: '1px solid #334155'
                                }}
                            />
                            {jsonError && <p style={{ color: '#f87171', marginTop: '5px' }}>Invalid JSON: {jsonError}</p>}
                            <br />
                            <button onClick={handleSaveSubjects} className="login-button premium-gradient" style={{ marginTop: '15px', width: '200px' }}>
                                Save Changes
                            </button>
                        </div>
                    </section>
                )}

                <div className="dashboard-footer" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '0.875rem' }}>
                    <p>Developed and Maintained By Department of Data Science @2026</p>
                </div>
            </main>
        </div >
    );
};

export default AdminDashboard;
