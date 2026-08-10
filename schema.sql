-- Shopify LMS MySQL Database Schema

CREATE DATABASE IF NOT EXISTS shopify_lms;
USE shopify_lms;

-- 1. Courses Table
CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  instructor_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  duration VARCHAR(100),
  status VARCHAR(50) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Students Table
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  shopify_customer_id VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Enrollments Table
CREATE TABLE IF NOT EXISTS enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'In Progress',
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Sample Data Insertion
INSERT INTO courses (title, description, instructor_name, category, duration, status) VALUES
('Intro to Shopify App Development', 'Learn how to build embedded Shopify apps with React and Node.js.', 'Vinupriya M', 'Development', '6 Hours', 'Active'),
('Advanced Polaris UI Mastery', 'Master Shopify Polaris design system components.', 'John Doe', 'Design', '4 Hours', 'Active');

INSERT INTO students (name, email, shopify_customer_id) VALUES
('Alice Smith', 'alice@example.com', '78912345'),
('Bob Johnson', 'bob@example.com', '78912346');

INSERT INTO enrollments (student_id, course_id, status) VALUES
(1, 1, 'In Progress'),
(2, 2, 'Completed');
