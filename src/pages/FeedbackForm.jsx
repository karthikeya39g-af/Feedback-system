import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Star,
    Send,
    CheckCircle2,
    ChevronRight,
    ArrowLeft,
    BookOpen,
    FlaskConical,
    User,
    ClipboardList
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './FeedbackForm.css';

const theoryParameters = [
    { id: 'P1', label: 'Presents material in an understandable way' },
    { id: 'P2', label: 'Class Room Teaching is Friendly' },
    { id: 'P3', label: 'Punctuality and Regularity to the Classes' },
    { id: 'P4', label: 'Communication Skills, Explanation ability and Clarity of Teaching' },
    { id: 'P5', label: 'Enthusiasm to Teach, Inspiring students to Learn and Think' },
    { id: 'P6', label: 'Controls the Class properly' },
    { id: 'P7', label: 'Evaluation in Examinations' },
    { id: 'P8', label: 'Problem Solving' },
    { id: 'P9', label: 'Welcomes Questions from Students' },
    { id: 'P10', label: 'Uniform Coverage of the Syllabus' }
];

const labParameters = [
    { id: 'L1', label: 'Are the experiments of the Lab conducted as per schedule?' },
    { id: 'L2', label: 'Are the Machines and Tools provided sufficient?' },
    { id: 'L3', label: 'Are the Machines provided in working condition?' },
    { id: 'L4', label: 'Experiments were conducted as per University Syllabus?' },
    { id: 'L5', label: 'Whether experiments of beyond curriculum were conducted?' },
    { id: 'L6', label: 'Whether the Lab Manual provided is informative?' },
    { id: 'L7', label: 'Whether the Lab Technicians are assisting you?' },
    { id: 'L8', label: 'Whether the Lab Faculty is helpful in the Lab?' }
];

const FeedbackForm = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [ratings, setRatings] = useState({});
    const [comment, setComment] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [step, setStep] = useState(1);

    const [completedSubjectIds, setCompletedSubjectIds] = useState([]);
    const [allCompleted, setAllCompleted] = useState(false);

    // Fetch subjects AND progress
    useEffect(() => {
        if (user?.section && user?.class) {
            // 1. Fetch Subjects
            fetch(`/api/subjects?section=${user.section}&class=${user.class}`)
                .then(res => res.json())
                .then(subjectData => {
                    setSubjects(subjectData);
                    // 2. Fetch Progress
                    if (user.rollnumber) {
                        return fetch(`/api/feedback/progress?rollnumber=${user.rollnumber}`)
                            .then(res => res.json())
                            .then(progressData => {
                                setCompletedSubjectIds(progressData.completedSubjectIds || []);
                            });
                    }
                })
                .catch(err => console.error(err));
        }
    }, [user]);

    // Check if all done whenever subjects or completed list changes
    useEffect(() => {
        if (subjects.length > 0 && completedSubjectIds.length > 0) {
            if (subjects.every(s => completedSubjectIds.includes(s.id))) {
                setAllCompleted(true);
            }
        }
    }, [subjects, completedSubjectIds]);

    const handleRatingChange = (id, value) => {
        setRatings(prev => ({ ...prev, [id]: value }));
    };

    const getNextSubject = () => {
        return subjects.find(s => !completedSubjectIds.includes(s.id));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Ensure all parameters for the selected category are rated
        const currentParams = selectedSubject.type === 'theory' ? theoryParameters : labParameters;
        const missing = currentParams.filter(p => !ratings[p.id]);

        if (missing.length > 0) {
            alert('Please provide ratings for all parameters.');
            return;
        }

        const feedbackData = {
            rollnumber: user?.rollnumber,
            name: user?.name,
            subject: selectedSubject.name,
            subjectId: selectedSubject.id, // Critical for tracking
            faculty: selectedSubject.faculty,
            type: selectedSubject.type,
            class: user?.class,
            section: user?.section,
            semester: user?.semester,
            ratings,
            comment
        };

        try {
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(feedbackData)
            });

            if (response.ok) {
                // Update local progress
                const newCompleted = [...completedSubjectIds, selectedSubject.id];
                setCompletedSubjectIds(newCompleted);

                // Check if more remaining
                const remaining = subjects.filter(s => !newCompleted.includes(s.id));

                if (remaining.length === 0) {
                    setSubmitted(true); // All done!
                } else {
                    // Move to next
                    alert(`Feedback submitted for ${selectedSubject.name}. Moving to next subject: ${remaining[0].name}`);
                    setSelectedSubject(remaining[0]);
                    setRatings({});
                    setComment('');
                    setStep(2); // Stay on feedback form for next subject
                    // Alternatively: setStep(1) to go back to grid with new highlights
                }
            } else if (response.status === 400) {
                const data = await response.json();
                alert(data.message || 'Feedback already submitted for this subject.');
                // Refresh progress just in case
                if (user.rollnumber) {
                    fetch(`/api/feedback/progress?rollnumber=${user.rollnumber}`)
                        .then(res => res.json())
                        .then(progressData => {
                            setCompletedSubjectIds(progressData.completedSubjectIds || []);
                        });
                }
                setSelectedSubject(null); // Deselect
                setStep(1); // Go back to subject selection
            } else {
                alert('Failed to submit feedback. Please try again.');
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            alert('Network error. Please check your connection.');
        }
    };

    if (submitted) {
        return (
            <div className="feedback-container">
                <div className="feedback-mesh-bg"></div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="success-card glass-panel"
                >
                    <div className="success-icon">
                        <CheckCircle2 size={64} color="#10b981" />
                    </div>
                    <h2>All Feedback Completed!</h2>
                    <p className="text-muted">You have successfully submitted feedback for all subjects.</p>
                    <button
                        className="back-btn premium-gradient"
                        onClick={() => navigate('/login')}
                    >
                        Back to Portal
                    </button>
                </motion.div>
            </div>
        );
    }

    // Determine the "Next" subject to highlight
    const nextSubject = getNextSubject();

    if (user?.feedbackRestricted) {
        return (
            <div className="feedback-container">
                <div className="feedback-mesh-bg"></div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="success-card glass-panel"
                >
                    <div className="success-icon">
                        <Clock size={64} color="#f59e0b" />
                    </div>
                    <h2>Feedback Cooldown Active</h2>
                    <p className="text-muted">
                        You have already submitted feedback recently.
                        <br />
                        Please wait <strong>{user.daysRemaining} days</strong> before submitting again.
                    </p>
                    <button
                        className="back-btn premium-gradient"
                        onClick={() => navigate('/login')}
                    >
                        Back to Portal
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="feedback-container">
            <div className="feedback-mesh-bg"></div>

            <header className="feedback-header-revamped">
                <div className="student-info-bar">
                    <div className="info-group">
                        <div className="info-item">
                            <User size={18} className="text-primary" />
                            <strong>{user?.name}</strong>
                        </div>
                        <div className="divider"></div>
                        <div className="info-item">
                            <span>Class:</span>
                            <strong>{user?.class} - {user?.section}</strong>
                        </div>
                        <div className="divider"></div>
                        <div className="info-item">
                            <span>Semester:</span>
                            <strong>{user?.semester}</strong>
                        </div>
                    </div>

                    <button className="logout-mini-btn" onClick={() => navigate('/login')}>
                        <ArrowLeft size={16} /> Exit
                    </button>
                </div>

                <div className="progress-bar-container">
                    {step === 1 ? (
                        <>
                            <div className="progress-text">
                                <span>Overall Progress</span>
                                <span>{completedSubjectIds.length} / {subjects.length} Subjects</span>
                            </div>
                            <div className="progress-track">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${(completedSubjectIds.length / Math.max(subjects.length, 1)) * 100}%` }}
                                ></div>
                            </div>
                        </>
                    ) : (
                        (() => {
                            const currentParams = selectedSubject?.type === 'theory' ? theoryParameters : labParameters;
                            const totalQuestions = currentParams.length;
                            const answeredCount = Object.keys(ratings).length;
                            const progress = (answeredCount / totalQuestions) * 100;

                            return (
                                <>
                                    <div className="progress-text">
                                        <span>Subject {completedSubjectIds.length + 1} of {subjects.length}</span>
                                        <span>{answeredCount} / {totalQuestions} Questions</span>
                                    </div>
                                    <div className="progress-track">
                                        <div
                                            className="progress-fill"
                                            style={{
                                                width: `${progress}%`,
                                                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' // Distinct color for questions
                                            }}
                                        ></div>
                                    </div>
                                </>
                            );
                        })()
                    )}
                </div>
            </header>

            <main className="feedback-main">
                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.section
                            key="step1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="subject-selection"
                        >
                            <div className="section-intro">
                                <h2>Select Subject</h2>
                                <p className="text-muted">
                                    {nextSubject
                                        ? `Please provide feedback for: ${nextSubject.name}`
                                        : "All subjects completed!"}
                                </p>
                            </div>

                            <div className="subject-grid">
                                {subjects.map(subject => {
                                    const isCompleted = completedSubjectIds.includes(subject.id);
                                    const isNext = !isCompleted && nextSubject?.id === subject.id;

                                    return (
                                        <motion.button
                                            key={subject.id}
                                            disabled={isCompleted}
                                            whileHover={!isCompleted ? { y: -5 } : {}}
                                            whileTap={!isCompleted ? { scale: 0.98 } : {}}
                                            className={`subject-card glass-panel 
                                                ${selectedSubject?.id === subject.id ? 'selected' : ''} 
                                                ${isCompleted ? 'completed' : ''}
                                                ${isNext ? 'highlight-next' : ''}
                                            `}
                                            onClick={() => !isCompleted && setSelectedSubject(subject)}
                                        >
                                            <div className="subject-icon">
                                                {isCompleted ? <CheckCircle2 size={24} /> : (
                                                    subject.type === 'theory' ? <BookOpen size={24} /> : <FlaskConical size={24} />
                                                )}
                                            </div>
                                            <div className="subject-info">
                                                <h3>{subject.name}</h3>
                                                <p>{subject.faculty}</p>
                                                {isCompleted && <span className="status-badge success">Completed</span>}
                                                {isNext && <span className="status-badge pending">Next Pending</span>}
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>

                            <button
                                className={`next-btn premium-gradient ${!selectedSubject ? 'disabled' : ''}`}
                                disabled={!selectedSubject}
                                onClick={() => setStep(2)}
                            >
                                <span>Continue to Feedback</span>
                                <ChevronRight size={20} />
                            </button>
                        </motion.section>
                    ) : (
                        <motion.section
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="feedback-parameters"
                        >
                            <div className="subject-summary glass-panel">
                                <div className="summary-info">
                                    <span className="type-badge">{selectedSubject.type.toUpperCase()}</span>
                                    <h2>{selectedSubject.name}</h2>
                                    <p><User size={14} /> {selectedSubject.faculty}</p>
                                </div>
                                <button className="change-btn" onClick={() => { setStep(1); setRatings({}); }}>Back to List</button>
                            </div>

                            <form onSubmit={handleSubmit} className="parameters-form">
                                <div className="parameters-list">
                                    {(selectedSubject.type === 'theory' ? theoryParameters : labParameters).map((param, index) => (
                                        <motion.div
                                            key={param.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="parameter-item glass-panel"
                                        >
                                            <div className="param-label">
                                                <span className="param-no">{selectedSubject.type === 'theory' ? `P${index + 1}` : index + 1}</span>
                                                <p>{param.label}</p>
                                            </div>
                                            <div className="rating-scale">
                                                {[1, 2, 3, 4, 5].map((score) => (
                                                    <button
                                                        key={score}
                                                        type="button"
                                                        className={`rating-number rank-${score} ${ratings[param.id] === score ? 'active' : ''}`}
                                                        onClick={() => handleRatingChange(param.id, score)}
                                                    >
                                                        {score}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                <div className="comment-section glass-panel">
                                    <label>Any additional comments? (Optional)</label>
                                    <textarea
                                        placeholder="Write your thoughts here..."
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                    />
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    className="submit-button premium-gradient"
                                >
                                    <span>
                                        {(subjects.length - completedSubjectIds.length) === 1 ? 'Submit Feedback' : 'Next Subject'}
                                    </span>
                                    {(subjects.length - completedSubjectIds.length) === 1 ? <CheckCircle2 size={18} /> : <ChevronRight size={18} />}
                                </motion.button>
                            </form>
                        </motion.section>
                    )}
                </AnimatePresence>
                <div className="feedback-footer" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '0.8rem' }}>
                    <p>Developed and Maintained By Department of Data Science @2026</p>
                </div>
            </main>
        </div>
    );
};

export default FeedbackForm;
