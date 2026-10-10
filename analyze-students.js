const fs = require('fs');
const path = require('path');

const usersPath = path.join(__dirname, 'server', 'data', 'users.json');
const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

const students = users.filter(u => u.role === 'student');

// Group by class and section
const grouped = {};
students.forEach(s => {
    const key = `${s.class}-${s.section}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(s);
});

console.log('Student Distribution:\n');
Object.keys(grouped).sort().forEach(key => {
    console.log(`${key}: ${grouped[key].length} students`);
    // Show first 3 students
    grouped[key].slice(0, 3).forEach(s => {
        console.log(`  - ${s.rollnumber} - ${s.name}`);
    });
    console.log('');
});

console.log('\nTotal students:', students.length);
