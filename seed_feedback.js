const fs = require('fs');
const path = require('path');

const FEEDBACK_PATH = path.join(__dirname, 'server', 'data', 'feedback.json');

// Sample feedback data matching structure
const sampleFeedback = [
    {
        "id": "1700000000001",
        "timestamp": "2024-02-08T10:00:00.000Z",
        "studentId": "22881A6701",
        "class": "IIIyr",
        "section": "A",
        "semester": "I",
        "subject": "Automata Theory and Compiler Design",
        "faculty": "Mr N ravi shankar",
        "subjectId": "atcd1",
        "ratings": {
            "p1": "5", "p2": "4", "p3": "5", "p4": "4", "p5": "5",
            "p6": "4", "p7": "5", "p8": "4", "p9": "5", "p10": "5"
        },
        "comment": "Great teaching!"
    },
    {
        "id": "1700000000002",
        "timestamp": "2024-02-08T10:05:00.000Z",
        "studentId": "22881A6702",
        "class": "IIIyr",
        "section": "A",
        "semester": "I",
        "subject": "Algorithm Design and Analysis",
        "faculty": "Mrs K Nandhini",
        "subjectId": "ada1",
        "ratings": {
            "p1": "4", "p2": "4", "p3": "3", "p4": "4", "p5": "4",
            "p6": "4", "p7": "3", "p8": "4", "p9": "4", "p10": "4"
        },
        "comment": "Good concepts."
    },
    {
        "id": "1700000000003",
        "timestamp": "2024-02-08T10:10:00.000Z",
        "studentId": "22881A6703",
        "class": "IIIyr",
        "section": "A",
        "semester": "I",
        "subject": "Big Data Analytics",
        "faculty": "Mr P Srinivas",
        "subjectId": "bda1",
        "ratings": {
            "p1": "5", "p2": "5", "p3": "5", "p4": "5", "p5": "5",
            "p6": "5", "p7": "5", "p8": "5", "p9": "5", "p10": "5"
        },
        "comment": "Excellent!"
    },
    {
        // Lab Subject
        "id": "1700000000004",
        "timestamp": "2024-02-08T10:15:00.000Z",
        "studentId": "22881A6704",
        "class": "IIIyr",
        "section": "A",
        "semester": "I",
        "subject": "Big Data Analytics Lab",
        "faculty": "Mr P Srinivas",
        "subjectId": "bdal1",
        "ratings": {
            "p1": "5", "p2": "4", "p3": "5", "p4": "4",
            "p5": "5", "p6": "4", "p7": "5", "p8": "5"
        },
        "comment": "Good lab sessions."
    }
];

// Write to file
try {
    const existing = fs.existsSync(FEEDBACK_PATH)
        ? JSON.parse(fs.readFileSync(FEEDBACK_PATH, 'utf8'))
        : [];

    // Add only if empty (simplified for this task)
    if (existing.length === 0) {
        fs.writeFileSync(FEEDBACK_PATH, JSON.stringify(sampleFeedback, null, 4));
        console.log(`✅ Seeded ${sampleFeedback.length} feedback entries.`);
    } else {
        console.log(`ℹ️ File not empty (${existing.length} entries). Skipping seed.`);
    }
} catch (e) {
    console.error("❌ Failed to seed:", e);
}
