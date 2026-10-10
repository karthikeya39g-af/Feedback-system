const mongoose = require('mongoose');
const Subject = require('./models/Subject');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const connectDB = require('./config/db');

const fixFacultyName = async () => {
    try {
        await connectDB();
        console.log("Connected to DB.");

        const subjectId = "atcd1";
        const newName = "Mr N Ravi Shankar";

        const subject = await Subject.findOne({ id: subjectId });
        if (!subject) {
            console.log("Subject not found!");
            return;
        }

        console.log(`Current faculty A: ${subject.faculties.get('A')}`);
        console.log(`Current faculty B: ${subject.faculties.get('B')}`);

        // Update map
        subject.faculties.set('A', newName);
        subject.faculties.set('B', newName);

        await subject.save();
        console.log("Updated faculty name to:", newName);

        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
};

fixFacultyName();
