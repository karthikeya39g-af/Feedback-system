const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    id: { type: String, unique: true }, // Keeping for backward compatibility or unique logic
    email: { type: String, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['student', 'faculty', 'hod', 'admin'] },
    name: { type: String, required: true },

    // Student specifics
    rollnumber: { type: String, uppercase: true },
    class: { type: String }, // e.g., 'IIyr'
    section: { type: String }, // e.g., 'A'
    semester: { type: String }, // e.g., 'II'
}, { timestamps: true });

// Compound index for students to ensure unique roll in a class/section if needed, 
// but rollnumber should be globally unique usually.
userSchema.index({ rollnumber: 1 }, { unique: true, partialFilterExpression: { role: 'student' } });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
