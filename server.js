const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Enhanced CORS configuration - Allow all origins for development
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or file://)
    if (!origin) return callback(null, true);
    // Allow all origins for development
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Environment variables with fallbacks
const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "vijanTR@777",
  database: process.env.DB_NAME || "edubridge",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const JWT_SECRET = process.env.JWT_SECRET || 'edubridge_secret_key_2025';
const PORT = process.env.PORT || 3000;

// Create MySQL connection pool
const pool = mysql.createPool(DB_CONFIG);

// Test database connection
pool.getConnection()
  .then(connection => {
    console.log("✅ Connected to MySQL");
    connection.release();
  })
  .catch(err => {
    console.log("❌ DB Error:", err.message);
  });

// Utility Functions
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Middleware for authentication
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Access token required' 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const [users] = await pool.execute('SELECT id, name, email, role FROM users WHERE id = ?', [decoded.id]);
    
    if (users.length === 0) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      });
    }

    req.user = users[0];
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false,
      message: 'Invalid or expired token' 
    });
  }
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

// Input validation middleware
const validateSignup = (req, res, next) => {
  const { name, email, password, role } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  if (!email || !validateEmail(email)) {
    errors.push('Please provide a valid email address');
  }

  if (!password || !validatePassword(password)) {
    errors.push('Password must be at least 6 characters long');
  }

  if (!role || !['student', 'tutor'].includes(role)) {
    errors.push('Role must be either "student" or "tutor"');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password, role } = req.body;
  const errors = [];

  if (!email || !validateEmail(email)) {
    errors.push('Please provide a valid email address');
  }

  if (!password) {
    errors.push('Password is required');
  }

  if (!role || !['student', 'tutor'].includes(role)) {
    errors.push('Role must be either "student" or "tutor"');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

// ==================== API ROUTES ====================

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'EduBridge API is running',
    timestamp: new Date().toISOString()
  });
});

// Signup API - Enhanced with password hashing
app.post("/signup", validateSignup, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const [result] = await pool.execute(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name.trim(), email.toLowerCase().trim(), hashedPassword, role]
    );

    // Generate token
    const user = {
      id: result.insertId,
      name,
      email,
      role
    };
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: "Account created successfully!",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: "Signup failed. Please try again."
    });
  }
});

// Login API - Enhanced with password verification
app.post("/login", validateLogin, async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Find user
    const [users] = await pool.execute(
      "SELECT * FROM users WHERE email = ? AND role = ?",
      [email.toLowerCase().trim(), role]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const user = users[0];

    // Verify password
    // For backward compatibility, check both hashed and plain text passwords
    let passwordValid = false;
    
    if (user.password.startsWith('$2')) {
      // Password is hashed
      passwordValid = await bcrypt.compare(password, user.password);
    } else {
      // Plain text password (for existing users)
      passwordValid = user.password === password;
    }

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      success: true,
      message: "Login successful",
      name: user.name, // For backward compatibility with frontend
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: "Login failed. Please try again."
    });
  }
});

// Get user profile (protected route)
app.get("/profile", authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile"
    });
  }
});

// Search Tutors API
app.get("/search/tutors", async (req, res) => {
  try {
    const { query, subject } = req.query;
    let sql = "SELECT id, name, email, role FROM users WHERE role = 'tutor'";
    const params = [];

    if (query) {
      sql += " AND (name LIKE ? OR email LIKE ?)";
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm);
    }

    const [tutors] = await pool.execute(sql, params);

    res.json({
      success: true,
      count: tutors.length,
      tutors
    });
  } catch (error) {
    console.error('Search tutors error:', error);
    res.status(500).json({
      success: false,
      message: "Search failed"
    });
  }
});

// Search Resources API
app.get("/search/resources", async (req, res) => {
  try {
    const { query, category } = req.query;
    
    // Mock resources data - in production, this would come from a database
    const resources = [
      { id: 1, title: "Khan Academy Math", category: "math", description: "Comprehensive math courses" },
      { id: 2, title: "GeoGebra", category: "math", description: "Dynamic mathematics software" },
      { id: 3, title: "PhET Simulations", category: "science", description: "Interactive physics simulations" },
      { id: 4, title: "Duolingo", category: "languages", description: "Gamified language learning" },
      { id: 5, title: "freeCodeCamp", category: "programming", description: "Learn to code for free" }
    ];

    let filtered = resources;

    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(lowerQuery) ||
        r.description.toLowerCase().includes(lowerQuery)
      );
    }

    if (category && category !== 'all') {
      filtered = filtered.filter(r => r.category === category);
    }

    res.json({
      success: true,
      count: filtered.length,
      resources: filtered
    });
  } catch (error) {
    console.error('Search resources error:', error);
    res.status(500).json({
      success: false,
      message: "Search failed"
    });
  }
});

// Get Student Dashboard Data
app.get("/dashboard/student", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    // Mock dashboard data - in production, fetch from database
    const dashboardData = {
      upcomingSessions: [
        {
          id: 1,
          subject: "Mathematics - Calculus",
          tutor: "Dr. Sarah Johnson",
          time: "Today, 3:00 PM - 4:00 PM",
          topic: "Integration by Parts"
        }
      ],
      progress: {
        completed: 12,
        inProgress: 8,
        upcoming: 5,
        percentage: 65
      },
      achievements: [
        "First Session Complete",
        "10 Hours Studied",
        "Math Beginner",
        "Quick Learner"
      ]
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Student dashboard error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data"
    });
  }
});

// Get Tutor Dashboard Data
app.get("/dashboard/tutor", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'tutor') {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    // Mock dashboard data - in production, fetch from database
    const dashboardData = {
      todaySessions: [
        {
          id: 1,
          subject: "Mathematics - Algebra",
          student: "Alex Thompson",
          time: "10:00 AM - 11:00 AM",
          topic: "Quadratic Equations"
        }
      ],
      statistics: {
        totalStudents: 127,
        sessionsCompleted: 342,
        averageRating: 4.8,
        hoursThisWeek: 15,
        subjectsTeaching: 3,
        successRate: 98
      },
      pendingRequests: [
        {
          id: 1,
          student: "Emma Wilson",
          subject: "Calculus",
          preferredTime: "Tomorrow, 3:00 PM",
          topic: "Limits and Continuity"
        }
      ]
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Tutor dashboard error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data"
    });
  }
});

// ==================== RESOURCE SHARING ====================

// Upload/Share Resource
app.post("/resources/share", authenticateToken, async (req, res) => {
  try {
    const { title, description, category, url, type, tags } = req.body;
    const userId = req.user.id;

    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and category are required"
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO shared_resources (user_id, title, description, category, url, type, tags, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [userId, title.trim(), description.trim(), category, url || null, type || 'link', tags ? JSON.stringify(tags) : null]
    );

    res.status(201).json({
      success: true,
      message: "Resource shared successfully",
      resource: {
        id: result.insertId,
        title,
        description,
        category,
        url,
        type,
        tags
      }
    });
  } catch (error) {
    console.error('Share resource error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to share resource"
    });
  }
});

// Get Shared Resources
app.get("/resources/shared", async (req, res) => {
  try {
    const { category, search, limit = 50, offset = 0 } = req.query;
    
    let sql = `SELECT sr.*, u.name as author_name, u.role as author_role 
               FROM shared_resources sr 
               JOIN users u ON sr.user_id = u.id 
               WHERE 1=1`;
    const params = [];

    if (category && category !== 'all') {
      sql += " AND sr.category = ?";
      params.push(category);
    }

    if (search) {
      sql += " AND (sr.title LIKE ? OR sr.description LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    sql += " ORDER BY sr.created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const [resources] = await pool.execute(sql, params);

    // Get total count
    let countSql = `SELECT COUNT(*) as total FROM shared_resources WHERE 1=1`;
    const countParams = [];
    if (category && category !== 'all') {
      countSql += " AND category = ?";
      countParams.push(category);
    }
    if (search) {
      countSql += " AND (title LIKE ? OR description LIKE ?)";
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }
    const [countResult] = await pool.execute(countSql, countParams);

    res.json({
      success: true,
      count: resources.length,
      total: countResult[0].total,
      resources: resources.map(r => ({
        ...r,
        tags: r.tags ? JSON.parse(r.tags) : []
      }))
    });
  } catch (error) {
    console.error('Get shared resources error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch resources"
    });
  }
});

// Get My Shared Resources
app.get("/resources/my", authenticateToken, async (req, res) => {
  try {
    const [resources] = await pool.execute(
      `SELECT * FROM shared_resources WHERE user_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      count: resources.length,
      resources: resources.map(r => ({
        ...r,
        tags: r.tags ? JSON.parse(r.tags) : []
      }))
    });
  } catch (error) {
    console.error('Get my resources error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your resources"
    });
  }
});

// Delete Resource
app.delete("/resources/:id", authenticateToken, async (req, res) => {
  try {
    const resourceId = req.params.id;
    const userId = req.user.id;

    // Check if resource exists and belongs to user
    const [resources] = await pool.execute(
      "SELECT id FROM shared_resources WHERE id = ? AND user_id = ?",
      [resourceId, userId]
    );

    if (resources.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Resource not found or you don't have permission"
      });
    }

    await pool.execute("DELETE FROM shared_resources WHERE id = ?", [resourceId]);

    res.json({
      success: true,
      message: "Resource deleted successfully"
    });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to delete resource"
    });
  }
});

// ==================== PROGRESS TRACKING ====================

// Save/Update Progress
app.post("/progress", authenticateToken, async (req, res) => {
  try {
    const { subject, topic, progress_percentage, completed, notes } = req.body;
    const userId = req.user.id;

    if (!subject || !topic) {
      return res.status(400).json({
        success: false,
        message: "Subject and topic are required"
      });
    }

    // Check if progress exists
    const [existing] = await pool.execute(
      "SELECT id FROM user_progress WHERE user_id = ? AND subject = ? AND topic = ?",
      [userId, subject, topic]
    );

    if (existing.length > 0) {
      // Update existing progress
      await pool.execute(
        `UPDATE user_progress 
         SET progress_percentage = ?, completed = ?, notes = ?, updated_at = NOW() 
         WHERE id = ?`,
        [progress_percentage || 0, completed || false, notes || null, existing[0].id]
      );

      res.json({
        success: true,
        message: "Progress updated successfully"
      });
    } else {
      // Create new progress
      const [result] = await pool.execute(
        `INSERT INTO user_progress (user_id, subject, topic, progress_percentage, completed, notes, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [userId, subject, topic, progress_percentage || 0, completed || false, notes || null]
      );

      res.status(201).json({
        success: true,
        message: "Progress saved successfully",
        progressId: result.insertId
      });
    }
  } catch (error) {
    console.error('Save progress error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to save progress"
    });
  }
});

// Get User Progress
app.get("/progress", authenticateToken, async (req, res) => {
  try {
    const { subject } = req.query;
    const userId = req.user.id;

    let sql = "SELECT * FROM user_progress WHERE user_id = ?";
    const params = [userId];

    if (subject) {
      sql += " AND subject = ?";
      params.push(subject);
    }

    sql += " ORDER BY updated_at DESC";

    const [progress] = await pool.execute(sql, params);

    // Calculate statistics
    const total = progress.length;
    const completed = progress.filter(p => p.completed).length;
    const inProgress = progress.filter(p => !p.completed && p.progress_percentage > 0).length;
    const averageProgress = total > 0 
      ? Math.round(progress.reduce((sum, p) => sum + p.progress_percentage, 0) / total)
      : 0;

    res.json({
      success: true,
      progress,
      statistics: {
        total,
        completed,
        inProgress,
        notStarted: total - completed - inProgress,
        averageProgress
      }
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch progress"
    });
  }
});

// Get Progress by Subject
app.get("/progress/subject/:subject", authenticateToken, async (req, res) => {
  try {
    const { subject } = req.params;
    const userId = req.user.id;

    const [progress] = await pool.execute(
      "SELECT * FROM user_progress WHERE user_id = ? AND subject = ? ORDER BY updated_at DESC",
      [userId, subject]
    );

    res.json({
      success: true,
      subject,
      progress
    });
  } catch (error) {
    console.error('Get progress by subject error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch progress"
    });
  }
});

// ==================== RESOURCE ACCESS TRACKING ====================

// Track Resource Access
app.post("/resources/access", authenticateToken, async (req, res) => {
  try {
    const { resource_id, resource_type, action } = req.body;
    const userId = req.user.id;

    if (!resource_id || !action) {
      return res.status(400).json({
        success: false,
        message: "Resource ID and action are required"
      });
    }

    await pool.execute(
      `INSERT INTO resource_access (user_id, resource_id, resource_type, action, accessed_at) 
       VALUES (?, ?, ?, ?, NOW())`,
      [userId, resource_id, resource_type || 'shared_resource', action || 'view']
    );

    res.json({
      success: true,
      message: "Access tracked"
    });
  } catch (error) {
    console.error('Track access error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to track access"
    });
  }
});

// Get Access Analytics
app.get("/analytics/access", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '7d' } = req.query;

    let dateFilter = "DATE(accessed_at) >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
    if (period === '30d') {
      dateFilter = "DATE(accessed_at) >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
    } else if (period === '1y') {
      dateFilter = "DATE(accessed_at) >= DATE_SUB(NOW(), INTERVAL 1 YEAR)";
    }

    // Get access statistics
    const [stats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_accesses,
        COUNT(DISTINCT resource_id) as unique_resources,
        COUNT(DISTINCT DATE(accessed_at)) as active_days
       FROM resource_access 
       WHERE user_id = ? AND ${dateFilter}`,
      [userId]
    );

    // Get most accessed resources
    const [topResources] = await pool.execute(
      `SELECT resource_id, resource_type, COUNT(*) as access_count
       FROM resource_access 
       WHERE user_id = ? AND ${dateFilter}
       GROUP BY resource_id, resource_type
       ORDER BY access_count DESC
       LIMIT 10`,
      [userId]
    );

    // Get daily access pattern
    const [dailyPattern] = await pool.execute(
      `SELECT DATE(accessed_at) as date, COUNT(*) as count
       FROM resource_access 
       WHERE user_id = ? AND ${dateFilter}
       GROUP BY DATE(accessed_at)
       ORDER BY date DESC`,
      [userId]
    );

    res.json({
      success: true,
      statistics: stats[0],
      topResources,
      dailyPattern
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics"
    });
  }
});

// ==================== LANGUAGE SUPPORT ====================

// Supported languages
const SUPPORTED_LANGUAGES = {
  en: { name: 'English', code: 'en' },
  hi: { name: 'हिन्दी', code: 'hi' },
  mr: { name: 'मराठी', code: 'mr' }
};

// Get Supported Languages
app.get("/languages", (req, res) => {
  res.json({
    success: true,
    languages: Object.values(SUPPORTED_LANGUAGES)
  });
});

// Save User Language Preference
app.post("/user/language", authenticateToken, async (req, res) => {
  try {
    const { language } = req.body;
    const userId = req.user.id;

    if (!language || !SUPPORTED_LANGUAGES[language]) {
      return res.status(400).json({
        success: false,
        message: "Invalid language code"
      });
    }

    // Update or insert user preference
    await pool.execute(
      `INSERT INTO user_preferences (user_id, preference_key, preference_value, updated_at) 
       VALUES (?, 'language', ?, NOW())
       ON DUPLICATE KEY UPDATE preference_value = ?, updated_at = NOW()`,
      [userId, language, language]
    );

    res.json({
      success: true,
      message: "Language preference saved",
      language: SUPPORTED_LANGUAGES[language]
    });
  } catch (error) {
    console.error('Save language error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to save language preference"
    });
  }
});

// Get User Language Preference
app.get("/user/language", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [prefs] = await pool.execute(
      "SELECT preference_value FROM user_preferences WHERE user_id = ? AND preference_key = 'language'",
      [userId]
    );

    const language = prefs.length > 0 ? prefs[0].preference_value : 'en';

    res.json({
      success: true,
      language: SUPPORTED_LANGUAGES[language] || SUPPORTED_LANGUAGES.en,
      code: language
    });
  } catch (error) {
    console.error('Get language error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch language preference",
      language: SUPPORTED_LANGUAGES.en,
      code: 'en'
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found"
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});
