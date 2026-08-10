# Shopify LMS (Learning Management System) App

An embedded Shopify application built with **React (Shopify Polaris)**, **Node.js (Express)**, and **MySQL** that enables Shopify merchants to manage courses, student enrollments, and progress directly within their Shopify Admin.

---

## 🌟 Key Features

1. **Shopify Authentication & Session Management**:
   - Built using official Shopify OAuth flow and session management.
   - Secure embedded app experience within Shopify Admin.

2. **Course Management Module**:
   - Full **CRUD** operations (Create, Read, Update, Delete) for courses.
   - Real-time client-side and server-side validation.
   - Live search filter and pagination (5 items per page).
   - Instant App Bridge Toast notifications for user feedback.

3. **Student & Enrollment Management**:
   - Manage student course enrollments and status (`In Progress` vs. `Completed`).
   - Server-side duplicate enrollment prevention (returns `409 Conflict`).
   - Instant status updates.

4. **Shopify Admin GraphQL Integration**:
   - Queries Shopify's GraphQL Admin API to dynamically fetch store details (Store Name, Email, Primary Domain).
   - Real-time dashboard showing total courses, active/completed enrollments, and recent student activity.

5. **Storefront Student Dashboard (App Proxy)**:
   - Configured `[app_proxy]` endpoint (`/api/proxy/dashboard`).
   - Intercepts `logged_in_customer_id` when a customer logs into the Shopify Storefront.
   - Dynamically queries MySQL and renders a responsive Liquid/HTML dashboard embedded inside the store theme (`/apps/lms`).

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Shopify Polaris UI (`v10`), App Bridge (`v4`), Vite
- **Backend**: Node.js, Express.js
- **Database**: MySQL (via `mysql2/promise`)
- **API Integration**: Shopify Admin GraphQL API & App Proxy

---

## 📋 Prerequisites

Before running the application, ensure you have:
- **Node.js**: `v18.0.0` or higher
- **MySQL Server**: Running on `localhost:3306` (e.g. XAMPP)
- **Shopify Partner Account** & Development Store
- **Shopify CLI**: Installed globally or via `npx`

---

## 🚀 Setup & Local Execution

### 1. Database Configuration
Import the database schema or run MySQL on `localhost:3306`:
```sql
CREATE DATABASE IF NOT EXISTS shopify_lms;
USE shopify_lms;

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

CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  shopify_customer_id VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'In Progress',
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=shopify_lms
```

### 3. Installation & Run
Install dependencies and launch the development server via Shopify CLI:
```bash
npm install
npm run dev
```

Open the generated Shopify preview link to view the app inside your development store!

---

## 📄 License
Developed for Shopify App Developer evaluation by **Vinupriya M**.
