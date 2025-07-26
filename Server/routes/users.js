const express = require('express');
const router = express.Router();
const { db } = require('../firebase/firebaseAdmin');

// Simple GET /users route for testing
router.get('/', (req, res) => {
  console.log('GET /users called');
  res.json({ message: 'Users route works!' });
});

// POST /users/register with unique email and username check
router.post('/register', async (req, res) => {
  console.log('POST /users/register called');
  const { email, fullname, password, username } = req.body;
  console.log('Received data:', req.body);

  if (!email || !fullname || !password || !username) {
    console.log('Missing required fields');
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const userRef = db.collection('users');

    // Check for existing email
    const emailSnapshot = await userRef.where('email', '==', email).get();
    if (!emailSnapshot.empty) {
      console.log('User already exists with email:', email);
      return res.status(400).json({ message: 'User already exists with this email. Try registering with a different one.' });
    }

    // Check for existing username
    const usernameSnapshot = await userRef.where('username', '==', username).get();
    if (!usernameSnapshot.empty) {
      console.log('User already exists with username:', username);
      return res.status(400).json({ message: 'Username already taken. Try registering with a different one.' });
    }

    await userRef.add({
      email,
      fullname,
      password, // consider hashing in production!
      username
    });

    console.log('User registered:', email);
    return res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Error registering user:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Login attempt:', req.body);

  if (!username || !password) {
    return res.status(400).json({ message: 'Missing username or password' });
  }

  try {
    const userRef = db.collection('users');
    const snapshot = await userRef.where('username', '==', username).get();

    if (snapshot.empty) {
      console.log('User not found:', username);
      return res.status(400).json({ message: 'User not found' });
    }

    const user = snapshot.docs[0].data();
    console.log('Stored password:', user.password);
    console.log('Entered password:', password);

    if (user.password !== password) {
      console.log('Incorrect password for:', username);
      return res.status(400).json({ message: 'Incorrect password' });
    }

    console.log('User logged in:', username);
    return res.json({
      message: 'Login successful',
      username: user.username,
      fullname: user.fullname,
      email: user.email
    });
  } catch (err) {
    console.error('Error logging in:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;