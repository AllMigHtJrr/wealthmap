const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'wealthmap-secret',
  resave: false,
  saveUninitialized: true,
}));

// Prevent caching to ensure logout-like behavior on refresh
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// Load users
let users = {};
if (fs.existsSync('users.json')) {
  users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
}

// Login route
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (users[email] && users[email].password === password) {
    req.session.user = { email, name: users[email].name };
    res.redirect('/');
  } else {
    res.redirect('/login.html?error=1');
  }
});

// Register route
app.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  users[email] = { name, email, password };
  fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
  res.redirect('/login.html');
});

app.post('/auto-logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.sendStatus(500);
    res.clearCookie('connect.sid');
    res.sendStatus(200);
  });
});


// Session route
app.get('/user', (req, res) => {
  if (req.session.user) {
    res.json({ name: req.session.user.name });
  } else {
    res.json({ name: null });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
