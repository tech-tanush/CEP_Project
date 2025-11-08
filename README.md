# EduBridge Backend API

Enhanced backend API for the EduBridge educational platform.

## Features

- ✅ JWT Authentication
- ✅ Password Hashing (bcrypt)
- ✅ Input Validation
- ✅ Search Functionality
- ✅ Dashboard Endpoints
- ✅ Error Handling
- ✅ Environment Variables Support
- ✅ Connection Pooling

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your database credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=edubridge
JWT_SECRET=your_secret_key_here
PORT=3000
```

## Database Setup

Make sure your MySQL database has a `users` table with the following structure:

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('student', 'tutor') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Running the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Authentication

- `POST /signup` - Create a new account
- `POST /login` - Login and get JWT token
- `GET /profile` - Get user profile (requires authentication)

### Search

- `GET /search/tutors?query=name` - Search for tutors
- `GET /search/resources?query=term&category=math` - Search resources

### Dashboard

- `GET /dashboard/student` - Get student dashboard data (requires authentication)
- `GET /dashboard/tutor` - Get tutor dashboard data (requires authentication)

### Health Check

- `GET /health` - Check API status

## Request/Response Examples

### Signup
```json
POST /signup
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student"
}

Response:
{
  "success": true,
  "message": "Account created successfully!",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  },
  "token": "jwt_token_here"
}
```

### Login
```json
POST /login
{
  "email": "john@example.com",
  "password": "password123",
  "role": "student"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  },
  "token": "jwt_token_here"
}
```

### Authenticated Request
```javascript
// Include token in Authorization header
fetch('/api/profile', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('authToken')
  }
})
```

## Security Features

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- Input validation and sanitization
- CORS configuration
- SQL injection protection (parameterized queries)

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "message": "Error message",
  "errors": ["Detailed error 1", "Detailed error 2"] // Optional
}
```

## Notes

- The backend supports both hashed and plain text passwords for backward compatibility
- New signups automatically hash passwords
- JWT tokens expire after 7 days
- Connection pooling is used for better performance

