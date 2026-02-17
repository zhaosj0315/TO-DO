import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'zhaot',
  password: process.env.DB_PASSWORD || 'zt060816',
  database: process.env.DB_NAME || 'todo_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool = mysql.createPool(dbConfig);

export async function initDB() {
  const connection = await pool.getConnection();
  try {
    console.log(`Connected to database: ${dbConfig.database}`);
    
    // 用户表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 任务表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        text TEXT NOT NULL,
        status ENUM('pending', 'in_progress', 'completed', 'cancelled', 'overdue') DEFAULT 'pending',
        category ENUM('work', 'study', 'life') DEFAULT 'work',
        priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
        type ENUM('today', 'daily', 'weekly') DEFAULT 'today',
        weekdays JSON,
        is_deleted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_completed TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('Tables initialized successfully.');
  } catch (error) {
    console.error('Error initializing tables:', error);
  } finally {
    connection.release();
  }
}

export default pool;