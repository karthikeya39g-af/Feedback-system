const fs = require('fs');
const path = require('path');

const FEEDBACK_PATH = path.join(__dirname, 'server', 'data', 'feedback.json');

// From server/index.js
const subjects = [
    // II Year Subjects
    { id: 'dm1', name: 'Discrete Mathematics', type: 'theory', class: 'IIyr', faculties: { A: 'Mrs Lakshmi', B: 'Mrs Lakshmi' } },
    { id: 'bef1', name: 'Business Economics & Financial', type: 'theory', class: 'IIyr', faculties: { A: 'Mr K Venkat raju', B: 'Mr K Venkat raju' } },
    { id: 'os1', name: 'Operating Systems', type: 'theory', class: 'IIyr', faculties: { A: 'Mrs.B Rajani', B: 'Mrs.B Rajani' } },
    { id: 'dbms1', name: 'Database Management Systems', type: 'theory', class: 'IIyr', faculties: { A: 'Mrs T Spoorthi reddy', B: 'Mrs Priyanka Pandarinath' } },
    { id: 'se1', name: 'Software Engineering', type: 'theory', class: 'IIyr', faculties: { A: 'Mrs M Pooja', B: 'Mrs M Pooja' } },
    { id: 'osl1', name: 'Operating Systems Lab', type: 'lab', class: 'IIyr', faculties: { A: 'Mrs.B Rajani', B: 'Mrs.B Rajani' } },
    { id: 'dbmsl1', name: 'Database Management Systems Lab', type: 'lab', class: 'IIyr', faculties: { A: 'Mrs T Spoorthi reddy', B: 'Mrs Priyanka Pandarinath' } },
    { id: 'rtrp1', name: 'Real-time Research Project', type: 'theory', class: 'IIyr', faculties: { A: 'Mr D Kishore kumar', B: 'Mr D Kishore kumar' } },
    { id: 'coi1', name: 'Constitution of India', type: 'theory', class: 'IIyr', faculties: { A: 'Mrs Lakshmi', B: 'Mrs Lakshmi' } },
    { id: 'sdc1', name: 'Skill Development Course -Node JS', type: 'theory', class: 'IIyr', faculties: { A: 'Mr D Kishore kumar', B: 'Mr D Kishore kumar' } }
];

const student = {
    rollnumber: "247Z1A6701",
    class: "IIyr",
    section: "A",
    semester: "I",
    name: "ABBULA VENKATESH"
};

const feedbacks = subjects.map(sub => ({
    id: Date.now().toString() + Math.random(),
    timestamp: new Date().toISOString(), // NOW
    rollnumber: student.rollnumber,
    name: student.name,
    subject: sub.name,
    subjectId: sub.id,
    faculty: sub.faculties[student.section],
    type: sub.type,
    class: student.class,
    section: student.section,
    semester: student.semester,
    ratings: { p1: 5 },
    comment: "Test feedback"
}));

fs.writeFileSync(FEEDBACK_PATH, JSON.stringify(feedbacks, null, 4));
console.log("Seeded feedback for testing restriction.");
