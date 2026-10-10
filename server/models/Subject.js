const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    code: { type: String },
    type: { type: String, enum: ['theory', 'lab'], required: true },
    class: { type: String, required: true },
    semester: { type: String, required: true },

    // Map of Section -> Faculty Name 
    // e.g. { "A": "Dr. Smith", "B": "Prof. Jones" }
    faculties: { type: Map, of: String }
}, { timestamps: true });

module.exports = mongoose.models.Subject || mongoose.model('Subject', subjectSchema);
