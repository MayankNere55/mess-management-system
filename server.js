const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware to parse incoming requests and allow cross-origin
app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

// Serve static frontend files (HTML, CSS, JS, images) natively
app.use(express.static(path.join(__dirname)));

// File paths to store data locally
const studentsFile = path.join(__dirname, 'students.json');
const feedbackFile = path.join(__dirname, 'feedback.json');

// Initialize empty JSON files if they don't exist yet
if (!fs.existsSync(studentsFile)) fs.writeFileSync(studentsFile, JSON.stringify([]));
if (!fs.existsSync(feedbackFile)) fs.writeFileSync(feedbackFile, JSON.stringify([]));

/**
 * 🏠 GET / - Serves the main Mess Portal page natively
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
// 📊 GET all students
app.get('/students', (req, res) => {
    const data = fs.readFileSync(studentsFile, 'utf8');
    const students = JSON.parse(data || "[]");
    res.json(students);
});
/**
 * 📝 POST /register - Handles new student registrations
 */
app.post('/register', (req, res) => {
    const newStudent = req.body;
    
    // Read the current list of students
    const data = fs.readFileSync(studentsFile, 'utf8');
    const students = JSON.parse(data || "[]");
    
    // Assign a unique auto-generated ID to the new student
    newStudent.id = "STU-" + Date.now();
    const firstName = newStudent.name ? newStudent.name.split(' ')[0] : 'Student';
    newStudent.loginId = firstName;
    newStudent.password = firstName + "@1234";
    newStudent.registrationDate = new Date().toLocaleString();
    
    // Add them to the array
    students.push(newStudent);
    
    // Save the updated array back to students.json
    fs.writeFileSync(studentsFile, JSON.stringify(students, null, 2));
    
    console.log("🎉 New student registered:", newStudent.name);
    res.status(201).json({ 
        message: 'Registration successful!', 
        student: newStudent,
        loginId: newStudent.loginId,
        password: newStudent.password
    });
});

/**
 * 🔐 POST /login - Handles student login
 */
app.post('/login', (req, res) => {
    const { loginId, password } = req.body;
    
    const data = fs.readFileSync(studentsFile, 'utf8');
    const students = JSON.parse(data || "[]");
    
    // Check for management login
    if (loginId === 'RAM' && password === 'Mess@1234') {
        return res.status(200).json({ message: 'Admin login successful', role: 'admin', students });
    }

    const student = students.find(s => s.loginId === loginId && s.password === password);
    
    if (student) {
        res.status(200).json({ message: 'Login successful', role: 'student', student });
    } else {
        res.status(401).json({ message: 'Invalid Login ID or Password' });
    }
});

/**
 * ✏️ POST /update-student - Admin updates student info
 */
app.post('/update-student', (req, res) => {
    const updatedStudent = req.body;
    
    const data = fs.readFileSync(studentsFile, 'utf8');
    let students = JSON.parse(data || "[]");
    
    const index = students.findIndex(s => s.id === updatedStudent.id);
    if (index !== -1) {
        // Overwrite updated values
        students[index] = { ...students[index], ...updatedStudent };
        fs.writeFileSync(studentsFile, JSON.stringify(students, null, 2));
        
        // Return full list to refresh frontend admin dashboard
        res.status(200).json({ message: 'Student successfully updated!', students });
    } else {
        res.status(404).json({ message: 'Student not found.' });
    }
});

/**
 * 💬 POST /feedback - Handles submitted student feedback
 */
app.post('/feedback', (req, res) => {
    const newFeedback = req.body;
    
    // Read current feedback
    const data = fs.readFileSync(feedbackFile, 'utf8');
    const feedbacks = JSON.parse(data || "[]");
    
    // Tag with a date
    newFeedback.date = new Date().toLocaleString();
    feedbacks.push(newFeedback);
    
    // Save the updated array back to feedback.json
    fs.writeFileSync(feedbackFile, JSON.stringify(feedbacks, null, 2));
    
    console.log("📨 New feedback received from:", newFeedback.fname || "Anonymous");
    res.status(201).json({ message: 'Feedback submitted successfully!' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`\n===========================================`);
    console.log(`🚀 Backend Server is ALIVE!`);
    console.log(`📡 Listening on http://localhost:${PORT}`);
    console.log(`📁 Saving data directly to 'students.json' and 'feedback.json'`);
    console.log(`===========================================\n`);
});
