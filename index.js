const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// In-memory user database
const users = {};

// Helper function to validate user input
const validateUser = (username, email, password) => {
    if (!username || !email || !password) {
        return 'Username, email, and password are required.';
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
        return 'Invalid email format.';
    }
    if (password.length < 6) {
        return 'Password must be at least 6 characters long.';
    }
    if (username.length < 3) {
        return 'Username must be at least 3 characters long.';
    }
    return null;
};

// Register endpoint
app.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    const validationError = validateUser(username, email, password);

    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

    if (users[email]) {
        return res.status(400).json({ error: 'Email is already registered.' });
    }

    // Check for duplicate username
    const usernameExists = Object.values(users).some(user => user.username === username);
    if (usernameExists) {
        return res.status(400).json({ error: 'Username is already taken.' });
    }

    users[email] = { username, email, password };
    res.status(201).json({ message: 'User registered successfully.' });
});

// Login endpoint
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!users[email] || users[email].password !== password) {
        return res.status(401).json({ error: 'Invalid email or password.' });
    }

    res.json({ message: 'Login successful.' });
});

// Find user by username
app.get('/user/username/:username', (req, res) => {
    const { username } = req.params;

    const user = Object.values(users).find(user => user.username === username);
    if (!user) {
        return res.status(404).json({ error: 'User not found.' });
    }
    
    res.json(user);
});

// Find user by email
app.get('/user/email/:email', (req, res) => {
    const { email } = req.params;

    const user = Object.values(users).find(user => user.email === email);
    if (!users[email]) {
        return res.status(404).json({ error: 'User not found.' });
    }

    res.json(user);
});


// Find all users
app.get('/users', (req, res) => {
    const allUsers = Object.values(users).map(({ password, ...user }) => user); // Exclude passwords
    res.json(allUsers);
});


// Update user's info
app.put('/user/:username', (req, res) => {
    const { username } = req.params;
    const { newUsername, newEmail, newPassword } = req.body;

    const currentEmail = Object.keys(users).find(email => users[email].username === username);

    const validationError = validateUser(newUsername, newEmail, newPassword);
    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

    // Update email if provided and not already taken
    if (newEmail && newEmail !== currentEmail) {
        if (users[newEmail]) {
            return res.status(400).json({ error: 'Email is already registered.' });
        }

        // Move user to the new email key
        users[newEmail] = { ...users[currentEmail], email: newEmail };
        delete users[currentEmail];
    }

    // Update username if provided and not already taken
    if (newUsername) {
        const usernameExists = Object.values(users).some(
            user => user.username === newUsername && user.email !== newEmail
        );
        if (usernameExists) {
            return res.status(400).json({ error: 'Username is already taken.' });
        }

        users[newEmail || currentEmail].username = newUsername;
    }

    // Update password if provided
    if (newPassword) {
        users[newEmail || currentEmail].password = newPassword;
    }

    res.json({ message: 'User details updated successfully.' });
});

// Delete user by username
app.delete('/user/:username', (req, res) => {
    const { username } = req.params;

    const emailToDelete = Object.keys(users).find(email => users[email].username === username);
    if (!emailToDelete) {
        return res.status(404).json({ error: 'User not found.' });
    }

    delete users[emailToDelete];
    res.json({ message: `Oh no, you've deleted '${username}'!` });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});