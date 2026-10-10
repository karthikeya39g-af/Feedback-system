const fs = require('fs');
const path = require('path');

const USERS_PATH = path.join(__dirname, 'server', 'data', 'users.json');

try {
    let users = JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));
    console.log(`Original User Count: ${users.length}`);

    // Check existing IIIyr A students
    const existingCount = users.filter(u => u.class === 'IIIyr' && u.section === 'A' && u.role === 'student').length;
    console.log(`Existing IIIyr-A Students: ${existingCount}`);

    if (existingCount < 10) {
        console.log("Seeding dummy students for IIIyr-A...");
        const newStudents = [];
        for (let i = 1; i <= 60; i++) {
            // Check if already exists
            const roll = `22881A67${i.toString().padStart(2, '0')}`;
            if (!users.find(u => u.rollnumber === roll)) {
                newStudents.push({
                    "id": `dummy_${Date.now()}_${i}`,
                    "rollnumber": roll,
                    "name": `Student ${i}`,
                    "role": "student",
                    "password": "password123",
                    "class": "IIIyr",
                    "section": "A",
                    "semester": "I"
                });
            }
        }
        users = [...users, ...newStudents];
        fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 4));
        console.log(`Added ${newStudents.length} dummy students. New Total: ${users.length}`);
    } else {
        console.log("Sufficient students exist. Skipping seed.");
    }

} catch (e) {
    console.error("Failed:", e);
}
