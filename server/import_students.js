const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, 'data', 'users.json');

const rawData = `
227Z1A6701	AILURI TEJASWINI
227Z1A6702	ALAGONI SATHWIK GOUD
227Z1A6703	ALOOR HEMALATHA
227Z1A6704	AMRABAD VINYASRI
227Z1A6705	AMUDALA JAYA SREE
227Z1A6706	AVULURI SRI CHANDANA
227Z1A6707	BAGGANI VISHWA TEJA
227Z1A6708	BASUDE CHANDANA
227Z1A6710	BUSHIGAMPA SUJITH GOUD
227Z1A6711	C VARUNI
227Z1A6713	CHENNABOINA SHIVA KUMAR
227Z1A6714	CHINDAM SAI RUKVITH
227Z1A6715	CHINNAM BHARGAVI
227Z1A6716	CHIRIVELLA SANDEEP
227Z1A6717	DUDDELA DINESH
227Z1A6718	ENAGANDULA RAVALI
227Z1A6719	GAJULA NAVASRI
227Z1A6720	GARJE SOWMYA
227Z1A6721	GOFU RUSHMITHA REDDY
227Z1A6722	GUDA VARSHITHA
227Z1A6723	GUNREDDY SPANDANA
227Z1A6724	INDUPURU SAI SIVA KUMAR REDDY
227Z1A6725	JAGATHKARI UDAY KUMAR
227Z1A6726	JOGU YAKESH
227Z1A6727	JORRIGALA SHIVA NANDINI
227Z1A6728	KALEPAKA SHALINI
227Z1A6729	KATHI MANOHAR
227Z1A6730	KORE PRANATHI
227Z1A6731	KOTA VIVEK REDDY
227Z1A6732	KUNCHALA POOJITHA
227Z1A6733	LAGGA ROSHAN KUMAR
227Z1A6734	MANE SIDDHANTH
227Z1A6735	MARUPALLI PRIYADHARSHINI
227Z1A6736	MELAGIRI HARSHITHA
227Z1A6737	MIRYALA VAISHNAVI
227Z1A6739	MOTE VAISHNAVI
227Z1A6740	MUDAVATH DEVENDRA NAIK
227Z1A6741	NAGISETTY KISHORE
227Z1A6742	NALLA VAMSHIDHAR REDDY
227Z1A6743	NAMPELLI ROHITH
227Z1A6745	PARIPALLI CHANDU
227Z1A6746	PASTULA VENKAT NIKEETH
227Z1A6747	PATI SLOKA REDDY
227Z1A6748	PENDYALA HARINI
227Z1A6749	PULIMI RAMA SATWIK REDDY
227Z1A6750	RAMAVATH SAI KUMAR
227Z1A6751	RATHOD SHASHIVARDHAN
227Z1A6752	SATTU YASHWANTH
227Z1A6753	SRIMANTHULA SANDHYA RANI
227Z1A6754	SINEVAR LAVANYA
227Z1A6755	SUNKI RAHUL ASTHWIK
227Z1A6757	THULA VIHARI
227Z1A6758	TUDUGANI SHREYA
227Z1A6759	VANAJA SATHISH
227Z1A6761	VEERAGONI HARSHITHA
227Z1A6762	VILLIVARTHI GIREESH
227Z1A6763	YAMANKI ROHITH
237Z5A6701	AALETI DILEEP
237Z5A6702	AILA JAYA CHANDRA CHARY
237Z5A6704	GURRAM HANISH
237Z5A6705	KOTHA ROHITH
237Z5A6706	NAAROJU SAI KUMAR
`;

const lines = rawData.trim().split('\n');
const newUsers = lines.map(line => {
    const [rollnumber, ...nameParts] = line.trim().split(/\s+/);
    const name = nameParts.join(' ');

    // Determine class
    // IV Year: Starts with 22 OR (Starts with 23 AND is Lateral Entry '5')
    // Lateral entry logic: 3rd character '7', 4th character 'Z', 5th character '5' ? 
    // Usually lateral entry has a '5' in the 5th position (index 4) if format is YYCC5.... 
    // Let's check: 23 7Z 5 A ... -> 5 is at index 4.

    let studentClass = 'IVyr'; // Default for this list as per user request

    return {
        id: rollnumber, // Use rollnumber as ID for simplicity or generate one
        rollnumber,
        name,
        role: 'student',
        password: 'password123',
        class: studentClass,
        section: 'A', // Defaulting to A
        semester: 'I'
    };
});

// Read existing users
let users = [];
try {
    const data = fs.readFileSync(DATA_PATH, 'utf8');
    users = JSON.parse(data);
} catch (err) {
    console.error("Error reading users.json", err);
}

// Merge/Update
let count = 0;
newUsers.forEach(newUser => {
    const existingIndex = users.findIndex(u => u.rollnumber === newUser.rollnumber);
    if (existingIndex !== -1) {
        // Update existing
        users[existingIndex] = { ...users[existingIndex], ...newUser, id: users[existingIndex].id }; // Keep original ID
    } else {
        // Add new
        users.push({ ...newUser, id: (users.length + 1000).toString() });
    }
    count++;
});

fs.writeFileSync(DATA_PATH, JSON.stringify(users, null, 4));

console.log(`Successfully imported/updated ${count} students.`);
