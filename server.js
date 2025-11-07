const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MySQL Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "vijanTR@777",   // <--- put your MySQL password here if any
  database: "edubridge"
});

db.connect((err) => {
  if (err) console.log("❌ DB Error:", err);
  else console.log("✅ Connected to MySQL");
});

// Signup API
app.post("/signup", (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role)
    return res.status(400).json({ message: "All fields required" });

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (result.length > 0)
      return res.status(400).json({ message: "User already exists" });

    db.query("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, password, role],
      (err2) => {
        if (err2) return res.status(500).json({ message: "Signup failed" });
        res.json({ message: "Signup successful!" });
      });
  });
});

// Login API
app.post("/login", (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role)
    return res.status(400).json({ message: "All fields required" });

  db.query("SELECT * FROM users WHERE email = ? AND password = ? AND role = ?", 
    [email, password, role],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (result.length === 0)
        return res.status(401).json({ message: "Invalid credentials" });
      res.json({ message: "Login successful", user: result[0] });
  });
});

app.listen(3000, () => console.log("🚀 Server running on http://localhost:3000"));
