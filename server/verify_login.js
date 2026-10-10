
const rollnumber = '227Z1A6701';
const password = 'password123';
const role = 'student';

const login = async () => {
    try {
        console.log("Attempting login for", rollnumber);
        const response = await fetch('http://localhost:5002/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rollnumber, password, role })
        });

        const data = await response.json();

        if (response.ok) {
            console.log("Login Successful!");
            console.log("Token:", data.token ? "Received" : "Missing");
            console.log("User:", data.user ? data.user.name : "Missing");
        } else {
            console.error("Login Failed:", response.status, data.message);
            process.exit(1);
        }
    } catch (error) {
        console.error("Error during login request:", error.message);
        process.exit(1);
    }
};

login();
