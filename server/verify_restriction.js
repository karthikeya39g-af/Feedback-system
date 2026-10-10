const http = require('http');

// require index will start the server on 5002
const app = require('./index');

const postData = JSON.stringify({
    email: "", // Not used for student login in code logic for lookup, but let's check
    // Logic: if role student, find by rollnumber
    rollnumber: "247Z1A6701",
    password: "password123",
    role: "student"
});

const options = {
    hostname: 'localhost',
    port: 5002,
    path: '/api/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

console.log("Waiting for server to start...");
setTimeout(() => {
    console.log("Sending login request...");
    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        res.on('end', () => {
            console.log('Response Status:', res.statusCode);
            const body = JSON.parse(data);
            console.log('User Data:', JSON.stringify(body.user, null, 2));

            if (body.user && body.user.feedbackRestricted === true) {
                console.log("SUCCESS: Feedback is restricted.");
                console.log("Days Remaining:", body.user.daysRemaining);
            } else {
                console.log("FAILURE: Feedback is NOT restricted.");
            }
            process.exit(0);
        });
    });

    req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
        process.exit(1);
    });

    req.write(postData);
    req.end();
}, 2000); // Wait 2s for server to start
