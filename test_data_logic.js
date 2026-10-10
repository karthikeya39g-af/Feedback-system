const initialSeedData = require('./server/data/initial_feedback.json');

console.log("Seed data length:", initialSeedData.length);

const testFilter = (year, section, semester) => {
    let filtered = initialSeedData;
    if (year) filtered = filtered.filter(f => f.class === year);
    if (section) filtered = filtered.filter(f => f.section === section);
    if (semester) filtered = filtered.filter(f => f.semester === semester);

    console.log(`Filter [${year}, ${section}, ${semester}] -> Count: ${filtered.length}`);
    return filtered;
};

// Test the default HOD selection
testFilter('IIIyr', 'A', 'I');
