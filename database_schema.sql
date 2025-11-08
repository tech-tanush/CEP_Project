-- EduBridge Database Schema
-- Run this SQL script to create all necessary tables

-- Users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('student', 'tutor') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Shared Resources table
CREATE TABLE IF NOT EXISTS shared_resources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  url VARCHAR(500),
  type ENUM('link', 'document', 'video', 'image', 'other') DEFAULT 'link',
  tags JSON,
  views INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_category (category),
  INDEX idx_user (user_id),
  INDEX idx_created (created_at)
);

-- User Progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  subject VARCHAR(100) NOT NULL,
  topic VARCHAR(255) NOT NULL,
  progress_percentage INT DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_subject_topic (user_id, subject, topic),
  INDEX idx_user (user_id),
  INDEX idx_subject (subject),
  INDEX idx_completed (completed)
);

-- Resource Access Tracking table
CREATE TABLE IF NOT EXISTS resource_access (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  resource_id VARCHAR(255) NOT NULL,
  resource_type VARCHAR(50) DEFAULT 'shared_resource',
  action VARCHAR(50) DEFAULT 'view',
  accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_resource (resource_id, resource_type),
  INDEX idx_accessed (accessed_at)
);

-- User Preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  preference_key VARCHAR(100) NOT NULL,
  preference_value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_preference (user_id, preference_key),
  INDEX idx_user (user_id)
);

-- Sessions table (for future use)
CREATE TABLE IF NOT EXISTS sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tutor_id INT NOT NULL,
  student_id INT NOT NULL,
  subject VARCHAR(100) NOT NULL,
  topic VARCHAR(255),
  scheduled_at DATETIME,
  duration INT,
  status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tutor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_tutor (tutor_id),
  INDEX idx_student (student_id),
  INDEX idx_status (status)
);

