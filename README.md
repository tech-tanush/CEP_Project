# CEP_Project

EduBridge - Equal Learning Opportunities
----------------------------------------

This is a simple web project that connects students and tutors.  
It includes a login system using Node.js, Express, and MySQL.

----------------------------------------
Project Structure
----------------------------------------
edubridge-project/
│
├── backend/
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
│
└── README.txt

----------------------------------------
Technologies Used
----------------------------------------
Frontend: HTML, CSS, JavaScript
Backend: Node.js, Express
Database: MySQL

----------------------------------------
Setup Steps
----------------------------------------

1. Install Node.js and MySQL on your system.

2. Open MySQL and create a new database:
   CREATE DATABASE edubridge_db;
   USE edubridge_db;
   CREATE TABLE users (
     id INT AUTO_INCREMENT PRIMARY KEY,
     name VARCHAR(100),
     email VARCHAR(100) UNIQUE,
     password VARCHAR(100),
     role ENUM('student','tutor')
   );

3. Open a terminal and go to the backend folder:
   cd backend

4. Install dependencies:
   npm install express mysql2 cors

5. Edit server.js and add your MySQL details:
   user: 'root',
   password: 'your_password'

6. Start the server:
   node server.js

   You should see:
   🚀 Server running on http://localhost:3000
   ✅ Connected to MySQL

7. Open frontend/index.html in a browser or use Live Server.

8. Try logging in with existing credentials or insert users manually in MySQL.

----------------------------------------
Future Ideas
----------------------------------------
- Add signup/register feature
- Encrypt passwords
- Create dashboards for students and tutors

----------------------------------------
Author
----------------------------------------
Tanush Vijan <br>
Shubham Kulkarni <br>
Krishna Bachkar <br>
Rohit Somase <br>
Prathamesh Desai

