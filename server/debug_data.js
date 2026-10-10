require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Feedback = require('./models/Feedback');

const debug = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("--- USER STATS ---");
        const users = await User.find({ role: 'student' });
        const classStats = {};
        users.forEach(u => {
            const key = `${u.class}-${u.semester}`;
            classStats[key] = (classStats[key] || 0) + 1;
        });
        console.log("Student Counts by Class-Sem:", classStats);

        console.log("--- FEEDBACK STATS ---");
        const feedbackCount = await Feedback.countDocuments();
        console.log("Total Feedback:", feedbackCount);

        if (feedbackCount > 0) {
            const sample = await Feedback.find().limit(5);
            console.log("Sample Feedback:", JSON.stringify(sample.map(f => ({
                subject: f.subject,
                faculty: f.faculty,
                rollnumber: f.rollnumber,
                class: f.class,
                semester: f.semester
            })), null, 2));
        }

        process.exit(0);
    } catch (e) {
        console.error("DEBUG ERROR:", e);
        process.exit(1);
    }
};
debug();
