const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'tasksdb',
};

let pool;

async function initDb() {
  const bootstrap = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
  });
  await bootstrap.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
  await bootstrap.end();

  pool = mysql.createPool(dbConfig);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function waitForDb(retries = 20, delayMs = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      await initDb();
      console.log('Database ready');
      return;
    } catch (err) {
      console.log(`DB not ready (${i + 1}/${retries}): ${err.message}`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw new Error('Could not connect to database');
}

app.get('/', (req, res) => {
  res.json({
    name: 'Tasks API',
    endpoints: ['/api/health', '/api/tasks', '/api/tasks/:id'],
  });
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/tasks', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM tasks ORDER BY id DESC');
  res.json(rows);
});

app.get('/api/tasks/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

app.post('/api/tasks', async (req, res) => {
  const { title, description = '', completed = false } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  const [result] = await pool.query(
    'INSERT INTO tasks (title, description, completed) VALUES (?, ?, ?)',
    [title, description, completed]
  );
  const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
});

app.put('/api/tasks/:id', async (req, res) => {
  const { title, description, completed } = req.body;
  await pool.query(
    'UPDATE tasks SET title = ?, description = ?, completed = ? WHERE id = ?',
    [title, description, completed, req.params.id]
  );
  const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

app.delete('/api/tasks/:id', async (req, res) => {
  const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

waitForDb().then(() => {
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
});
