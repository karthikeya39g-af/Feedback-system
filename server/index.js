const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
// Trigger restart - Multer Fix
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
// const fs = require('fs');


const app = express();
const PORT = process.env.PORT || 5002;
const SECRET_KEY = process.env.JWT_SECRET || 'your_super_secret_key_123';

// Database Config
const connectDB = require('./config/db');
const User = require('./models/User');
const Subject = require('./models/Subject');
const Feedback = require('./models/Feedback');

app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// --- DB CONNECTION & SEEDING ---
const seedDatabase = async () => {
    try {
        await connectDB();

        // 1. Seed Users
        // 1. Sync Users (Always run to reflect JSON changes)
        console.log("Syncing Users from JSON...");
        try {
            const users = require('./data/users.json');
            if (users && users.length > 0) {
                const ops = users.map(user => {
                    let filter = {};
                    if (user.role === 'student' && user.rollnumber) {
                        filter = { rollnumber: user.rollnumber };
                    } else if (user.email) {
                        filter = { email: user.email };
                    } else if (user.id) {
                        filter = { id: user.id };
                    } else {
                        return null;
                    }
                    return {
                        updateOne: {
                            filter: filter,
                            update: { $set: user },
                            upsert: true
                        }
                    };
                }).filter(op => op !== null);

                if (ops.length > 0) {
                    await User.bulkWrite(ops);
                    console.log(`Synced ${ops.length} users.`);
                }
            }
        } catch (e) { console.error("Error syncing users:", e); }

        // 2. Seed Subjects
        const subjectCount = await Subject.countDocuments();
        if (subjectCount === 0) {
            console.log("Seeding Subjects...");
            try {
                const subjects = require('./data/subjects.json');
                if (subjects && subjects.length > 0) {
                    await Subject.insertMany(subjects);
                    console.log(`Seeded ${subjects.length} subjects.`);
                }
            } catch (e) { console.error("Error seeding subjects:", e); }
        }

        // 3. Seed Feedback
        const feedbackCount = await Feedback.countDocuments();
        if (feedbackCount === 0) {
            console.log("Seeding Initial Feedback...");
            try {
                const rawFeedback = require('./data/initial_feedback.json');
                const subjectsList = require('./data/subjects.json');
                // Fetch existing students to map to
                const existingStudents = await User.find({ role: 'student' });

                if (rawFeedback && rawFeedback.length > 0) {
                    await Feedback.insertMany(rawFeedback);
                    console.log(`Seeded ${rawFeedback.length} feedback entries.`);
                }
            } catch (e) { console.error("Error seeding feedback:", e); }
        }

    } catch (err) {
        console.error("Database seeding failed:", err);
    }
};

// Initialize DB connection immediately
connectDB().then(() => {
    seedDatabase();
});


// --- ADMIN API ENDPOINTS ---
const multer = require('multer');
const xlsx = require('xlsx');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 1. Upload Student Data (Excel)
app.post('/api/admin/upload-students', upload.single('file'), async (req, res) => {
    try {
        await connectDB();
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const newStudents = rawData.map(row => ({
            id: String(row['Roll Number'] || row['RollNumber'] || Date.now() + Math.random()),
            name: row['Name'],
            rollnumber: String(row['Roll Number'] || row['RollNumber']),
            role: 'student',
            class: row['Class'],
            section: row['Section'],
            semester: row['Semester'],
            password: 'password123'
        })).filter(s => s.rollnumber && s.class);

        if (newStudents.length === 0) return res.status(400).json({ message: 'No valid data found.' });

        // Upsert students (update if exists, insert if new) based on rollnumber
        // Ideally we use bulkWrite for performance
        const ops = newStudents.map(student => ({
            updateOne: {
                filter: { rollnumber: student.rollnumber },
                update: { $set: student },
                upsert: true
            }
        }));

        if (ops.length > 0) {
            await User.bulkWrite(ops);
        }

        res.json({ message: `Processed ${newStudents.length} students.`, count: newStudents.length });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: 'Error processing file: ' + error.message });
    }
});

// 2. Delete All Students
app.delete('/api/admin/students', async (req, res) => {
    try {
        await connectDB();
        await User.deleteMany({ role: 'student' });
        res.json({ message: 'All student data deleted successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete data.' });
    }
});

// 3. Delete All Feedback
app.delete('/api/admin/feedback', async (req, res) => {
    try {
        await connectDB();
        await Feedback.deleteMany({});
        res.json({ message: 'All feedback data deleted successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete feedback.' });
    }
});

// 4. Get Subjects
app.get('/api/admin/subjects', async (req, res) => {
    try {
        await connectDB();
        const subjects = await Subject.find({});
        res.json(subjects);
    } catch (err) { res.status(500).json({ message: 'Error fetching subjects' }); }
});

// 5. Update Subjects
app.post('/api/admin/subjects', async (req, res) => {
    try {
        await connectDB();
        const newSubjects = req.body;
        if (!Array.isArray(newSubjects)) return res.status(400).json({ message: 'Expected array' });

        // Replace all subjects? Or Update? 
        // For simplicity reusing the "save all" logic:
        // Validation: Ensure everything has an ID

        // Strategy: Delete all and re-insert is risky but Matches previous file behavior "Overwrite".
        // Better: Upsert. 
        // Let's stick to "Sync" strategy: Delete all and insert new.
        await Subject.deleteMany({});
        await Subject.insertMany(newSubjects);

        res.json({ message: 'Subjects updated successfully.', count: newSubjects.length });
    } catch (err) {
        res.status(500).json({ message: 'Failed to save subjects: ' + err.message });
    }
});


// --- ROUTES ---

app.get('/', (req, res) => {
    res.json({ status: 'API is running (MongoDB)', endpoints: ['/api/login', '/api/me', '/api/feedback', '/api/analytics'] });
});

app.get('/api/health', async (req, res) => {
    try {
        await connectDB();
        const userCount = await User.countDocuments();
        res.json({ status: 'ok', db: 'connected', userCount });
    } catch (e) {
        res.status(500).json({ status: 'error', db: 'disconnected', error: e.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        await connectDB();
        const { email, password, role, rollnumber } = req.body;

        let user;
        if (role === 'student') {
            user = await User.findOne({ rollnumber, role: 'student' });
        } else {
            user = await User.findOne({ email, role });
        }

        if (!user) return res.status(401).json({ message: 'Invalid credentials or role' });

        // Password Check (Simple)
        const isMatch = (password === 'admin123' && user.role === 'admin') ||
            (password === 'hod123' && user.role === 'hod') ||
            (password === 'password123' && user.role === 'student'); // Demo passwords

        if (!isMatch && user.password !== password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id || user._id, email: user.email, role: user.role, name: user.name, class: user.class, section: user.section, semester: user.semester },
            SECRET_KEY,
            { expiresIn: '1h' }
        );

        const userData = {
            id: user.id || user._id,
            email: user.email,
            role: user.role,
            rollnumber: user.rollnumber,
            name: user.name,
            class: user.class,
            section: user.section,
            semester: user.semester,
            feedbackRestricted: false,
            daysRemaining: 0
        };


        // Feedback Restriction Logic
        try {
            if (user.role === 'student') {
                const studentFeedback = await Feedback.find({ rollnumber: user.rollnumber });
                const classSubjects = await Subject.find({ class: user.class }); // Assuming strict class match

                // Verify if subject logic needs semester too
                // Usually subjects are filtered by class + semester in UI, but here check ALL subjects for class?
                // Original logic was "subjects.filter(s => s.class === user.class)"

                const totalSubjects = classSubjects.length;
                const completedCount = studentFeedback.length; // Approximate check

                if (totalSubjects > 0 && completedCount >= totalSubjects) {
                    // Check timestamp of last one
                    // Sort descending
                    studentFeedback.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                    const lastSubmission = studentFeedback[0];

                    if (lastSubmission && lastSubmission.timestamp) {
                        const lastDate = new Date(lastSubmission.timestamp);
                        if (!isNaN(lastDate.getTime())) {
                            const diffDays = Math.ceil(Math.abs(new Date() - lastDate) / (1000 * 60 * 60 * 24));
                            if (diffDays <= 15) {
                                userData.feedbackRestricted = true;
                                userData.daysRemaining = 15 - diffDays + 1;
                            }
                        } else {
                            console.warn(`Invalid timestamp for feedback ${lastSubmission._id}: ${lastSubmission.timestamp}`);
                        }
                    }
                }
            }
        } catch (restrictionError) {
            console.error("Error in feedback restriction logic:", restrictionError);
            // Non-critical, so we don't fail login, just log it.
            // userData.feedbackRestricted remains false (default)
        }


        res.json({ token, user: userData });
    } catch (error) {
        console.error("Login Error:", error);
        // fs.appendFileSync('server_debug.log', ...); // REMOVED for Vercel compatibility (Read-only FS)
        res.status(500).json({ message: 'Server error during login' });
    }
});

app.get('/api/subjects', async (req, res) => {
    try {
        await connectDB();
        const { section, class: studentClass, semester } = req.query;
        if (!section || !studentClass) return res.status(400).json({ message: 'Section and Class required' });

        let query = { class: studentClass };
        if (semester) query.semester = semester;

        const subjects = await Subject.find(query);

        const response = subjects.map(s => ({
            id: s.id,
            name: s.name,
            type: s.type,
            faculty: (s.faculties && s.faculties.get(section)) || (s.faculties && s.faculties.get('A')) || 'N/A'
        }));
        res.json(response);
    } catch (e) {
        res.status(500).json({ message: 'Error fetching subjects' });
    }
});

app.post('/api/feedback', async (req, res) => {
    try {
        await connectDB();

        // Duplicate Check
        const exists = await Feedback.findOne({
            rollnumber: req.body.rollnumber,
            subjectId: req.body.subjectId
        });

        if (exists) return res.status(400).json({ message: 'Feedback already submitted for this subject.' });

        const newFeedback = new Feedback({
            ...req.body,
            id: Date.now().toString(), // optional
            timestamp: new Date()
        });

        await newFeedback.save();
        res.status(201).json({ message: 'Feedback submitted' });
    } catch (error) {
        console.error("Feedback Error:", error);
        res.status(500).json({ message: 'Failed to process feedback' });
    }
});

app.get('/api/feedback/progress', async (req, res) => {
    try {
        await connectDB();
        const { rollnumber } = req.query;
        if (!rollnumber) return res.status(400).json({ message: 'Roll number required' });

        const feedbacks = await Feedback.find({ rollnumber }).select('subjectId');
        res.json({ completedSubjectIds: feedbacks.map(f => f.subjectId) });
    } catch (e) {
        res.status(500).json({ message: 'Error fetching progress' });
    }
});

app.get('/api/analytics', async (req, res) => {
    try {
        await connectDB();
        const { class: year, section, semester } = req.query;

        // 1. Total Students
        const studentCount = await User.countDocuments({ role: 'student', class: year, section, semester });

        // 2. Feedback
        const feedbackList = await Feedback.find({ class: year, section, semester });

        // Calculate Stats (Reusing logic)
        const statsMap = {};

        // We need Subject info to know 'type' reliably if not in feedback (though we put it in feedback schema)
        // Optimization: Feedback schema has 'type', usage that.

        feedbackList.forEach(f => {
            if (!f.ratings) return;
            const key = `${f.subject}-${f.faculty}`;
            if (!statsMap[key]) {
                statsMap[key] = {
                    faculty: f.faculty,
                    subject: f.subject,
                    type: f.type || 'theory',
                    count: 0,
                    params: {}
                };
            }
            const entry = statsMap[key];
            entry.count += 1;

            // f.ratings is a Map in Mongoose, need to be careful how we iterate
            // If it comes as POJO from JSON, explicit, but from Mongoose it's a Map
            const ratingsObj = f.ratings instanceof Map ? Object.fromEntries(f.ratings) : f.ratings;

            Object.entries(ratingsObj).forEach(([param, value]) => {
                entry.params[param] = (entry.params[param] || 0) + Number(value);
            });

            // Collect Comments
            if (f.comment && f.comment.trim() !== "") {
                if (!entry.comments) entry.comments = [];
                entry.comments.push(f.comment);
            }
        });

        const processStats = (entry) => {
            const paramPercents = {};
            let totalPercentSum = 0;
            let paramCount = 0;
            const denominatorBlock = entry.count;

            Object.keys(entry.params).sort().forEach(param => {
                const sumRating = entry.params[param];
                const maxPossible = denominatorBlock * 5;
                const percent = (sumRating / maxPossible) * 100;
                paramPercents[param] = Math.round(percent);
                totalPercentSum += percent;
                paramCount++;
            });

            return {
                faculty: entry.faculty,
                subject: entry.subject,
                ...paramPercents,
                feedback: paramCount > 0 ? Math.round(totalPercentSum / paramCount) : 0,
                comments: entry.comments || []
            };
        };

        const theoryStats = [];
        const labStats = [];
        Object.values(statsMap).forEach(entry => {
            const processed = processStats(entry);
            if (entry.type === 'theory') theoryStats.push(processed);
            else labStats.push(processed);
        });

        res.json({
            totalSubmissions: feedbackList.length,
            totalStudents: studentCount,
            theoryStats,
            labStats,
            coursePerformance: [],
            facultyPerformance: []
        });

    } catch (e) {
        console.error("Analytics Error:", e);
        res.status(500).json({ message: 'Error generating analytics' });
    }
});

// Analytics: Submissions Status
app.get('/api/analytics/submissions', async (req, res) => {
    try {
        await connectDB();
        const { class: year, section, semester } = req.query;
        if (!year || !section || !semester) return res.status(400).json({ message: "Missing params" });

        const students = await User.find({ role: 'student', class: year, section, semester });
        const classSubjects = await Subject.find({ class: year, semester }); // Now filters by semester
        const totalSubjects = classSubjects.length;

        const feedbackList = await Feedback.find({ class: year, section, semester });

        const studentStatusList = students.map(student => {
            const studentFeedback = feedbackList.filter(f => f.rollnumber === student.rollnumber);
            const uniqueSubjects = new Set(studentFeedback.map(f => f.subjectId));
            const completedCount = uniqueSubjects.size;

            let status = 'Pending';
            if (totalSubjects > 0 && completedCount >= totalSubjects) status = 'Completed';
            else if (completedCount > 0) status = 'In Progress';

            // DEBUG LOGGING
            if (completedCount > 0) {
                console.log(`Debug: Student ${student.rollnumber} - Completed: ${completedCount}/${totalSubjects} - Status: ${status}`);
            }

            return {
                rollnumber: student.rollnumber,
                name: student.name,
                completedCount,
                totalSubjects,
                status
            };
        });

        // Sort: Pending -> In Progress -> Completed
        studentStatusList.sort((a, b) => {
            const map = { 'Pending': 1, 'In Progress': 2, 'Completed': 3 };
            return map[a.status] - map[b.status];
        });

        const completedStudents = studentStatusList.filter(s => s.status === 'Completed').length;

        res.json({
            totalSubmissions: feedbackList.length,
            totalStudents: students.length,
            completedCount: completedStudents,
            stats: studentStatusList
        });

    } catch (e) {
        res.status(500).json({ message: 'Error fetching submission stats' });
    }
});
// Alias for Vercel routing issues
app.get('/api/submissions', async (req, res) => {
    // Reuse logic from above by internal redirect or copy-paste
    // Copy-paste for safety
    try {
        await connectDB();
        const { class: year, section, semester } = req.query;
        if (!year || !section || !semester) return res.status(400).json({ message: "Missing params" });

        const students = await User.find({ role: 'student', class: year, section, semester });
        const classSubjects = await Subject.find({ class: year, semester });
        const totalSubjects = classSubjects.length;
        const feedbackList = await Feedback.find({ class: year, section, semester });

        const studentStatusList = students.map(student => {
            const studentFeedback = feedbackList.filter(f => f.rollnumber === student.rollnumber);
            const uniqueSubjects = new Set(studentFeedback.map(f => f.subjectId));
            const completedCount = uniqueSubjects.size;

            let status = 'Pending';
            if (totalSubjects > 0 && completedCount >= totalSubjects) status = 'Completed';
            else if (completedCount > 0) status = 'In Progress';

            return {
                rollnumber: student.rollnumber,
                name: student.name,
                completedCount,
                totalSubjects,
                status
            };
        });

        studentStatusList.sort((a, b) => {
            const map = { 'Pending': 1, 'In Progress': 2, 'Completed': 3 };
            return map[a.status] - map[b.status];
        });

        const completedStudents = studentStatusList.filter(s => s.status === 'Completed').length;



        res.json({
            totalSubmissions: feedbackList.length,
            totalStudents: students.length,
            completedCount: completedStudents,
            stats: studentStatusList
        });

    } catch (e) {
        res.status(500).json({ message: 'Error fetching submission stats' });
    }
});


// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Critical Server Error:", err);
    res.status(500).json({ message: 'Internal Server Error' });
});

// Start Server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        // Attempt connection locally for feedback
        connectDB();
    });
}
module.exports = app;
