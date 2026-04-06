const express = require('express');
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const os = require('os');
const multer = require('multer');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const usePostgres = Boolean(process.env.DATABASE_URL);

const rootDir = usePostgres ? path.join(os.tmpdir(), 'training-management-system') : __dirname;
const uploadsDir = path.join(rootDir, 'uploads');
const dbPath = path.join(rootDir, 'training.db');

if (!fs.existsSync(rootDir)) {
  fs.mkdirSync(rootDir, { recursive: true });
}

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const pool = usePostgres ? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost') ? { rejectUnauthorized: false } : false,
}) : null;

const sqliteDb = !usePostgres ? new sqlite3.Database(dbPath, (err) => {
  if (err) console.error(err);
  else console.log('Connected to SQLite database');
}) : null;

function convertSql(query) {
  let index = 0;
  return query.replace(/\?/g, () => `$${++index}`);
}

function dbAll(query, params = []) {
  if (usePostgres) {
    return pool.query(convertSql(query), params).then(result => result.rows);
  }
  return new Promise((resolve, reject) => {
    sqliteDb.all(query, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function dbGet(query, params = []) {
  if (usePostgres) {
    return pool.query(convertSql(query), params).then(result => result.rows[0] || null);
  }
  return new Promise((resolve, reject) => {
    sqliteDb.get(query, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function dbRun(query, params = []) {
  if (usePostgres) {
    const pgQuery = convertSql(query);
    if (query.trim().toUpperCase().startsWith('INSERT')) {
      return pool.query(pgQuery.replace(/;?$/, ' RETURNING id'), params)
        .then(result => ({ lastID: result.rows[0]?.id, rowCount: result.rowCount }));
    }
    return pool.query(pgQuery, params).then(result => ({ rowCount: result.rowCount }));
  }
  return new Promise((resolve, reject) => {
    sqliteDb.run(query, params, function(err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

async function initDb() {
  if (usePostgres) {
    await pool.query(`CREATE TABLE IF NOT EXISTS learning_points (
      id SERIAL PRIMARY KEY,
      type TEXT NOT NULL,
      module_name TEXT NOT NULL,
      description TEXT,
      created_date TIMESTAMPTZ DEFAULT NOW()
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS training_sessions (
      id SERIAL PRIMARY KEY,
      learning_point_id INTEGER NOT NULL REFERENCES learning_points(id),
      session_date TIMESTAMPTZ NOT NULL,
      created_date TIMESTAMPTZ DEFAULT NOW()
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS session_participants (
      id SERIAL PRIMARY KEY,
      session_id INTEGER NOT NULL REFERENCES training_sessions(id),
      participant_name TEXT NOT NULL,
      joined_date TIMESTAMPTZ DEFAULT NOW()
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      session_id INTEGER REFERENCES training_sessions(id),
      task_name TEXT NOT NULL,
      description TEXT,
      deadline TIMESTAMPTZ NOT NULL,
      assigned_to TEXT NOT NULL,
      status TEXT DEFAULT 'Pending',
      completion_date TIMESTAMPTZ,
      last_status_update TIMESTAMPTZ,
      created_date TIMESTAMPTZ DEFAULT NOW()
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS task_attachments (
      id SERIAL PRIMARY KEY,
      task_id INTEGER NOT NULL REFERENCES tasks(id),
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      uploaded_date TIMESTAMPTZ DEFAULT NOW()
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS task_submissions (
      id SERIAL PRIMARY KEY,
      task_id INTEGER NOT NULL REFERENCES tasks(id),
      submitted_by TEXT NOT NULL,
      submission_date TIMESTAMPTZ NOT NULL,
      attachment_path TEXT,
      note TEXT,
      status TEXT DEFAULT 'Submitted'
    )`);
  } else {
    await new Promise((resolve, reject) => {
      sqliteDb.serialize(() => {
        sqliteDb.run(`CREATE TABLE IF NOT EXISTS learning_points (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL,
          module_name TEXT NOT NULL,
          description TEXT,
          created_date DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        sqliteDb.run(`CREATE TABLE IF NOT EXISTS training_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          learning_point_id INTEGER NOT NULL,
          session_date DATETIME NOT NULL,
          created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (learning_point_id) REFERENCES learning_points(id)
        )`);

        sqliteDb.run(`CREATE TABLE IF NOT EXISTS session_participants (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id INTEGER NOT NULL,
          participant_name TEXT NOT NULL,
          joined_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (session_id) REFERENCES training_sessions(id)
        )`);

        sqliteDb.run(`CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id INTEGER,
          task_name TEXT NOT NULL,
          description TEXT,
          deadline DATETIME NOT NULL,
          assigned_to TEXT NOT NULL,
          status TEXT DEFAULT 'Pending',
          completion_date DATETIME,
          last_status_update DATETIME,
          created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (session_id) REFERENCES training_sessions(id)
        )`);

        sqliteDb.run(`CREATE TABLE IF NOT EXISTS task_attachments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          task_id INTEGER NOT NULL,
          file_name TEXT NOT NULL,
          file_path TEXT NOT NULL,
          uploaded_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (task_id) REFERENCES tasks(id)
        )`);

        sqliteDb.run(`CREATE TABLE IF NOT EXISTS task_submissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          task_id INTEGER NOT NULL,
          submitted_by TEXT NOT NULL,
          submission_date DATETIME NOT NULL,
          attachment_path TEXT,
          note TEXT,
          status TEXT DEFAULT 'Submitted',
          FOREIGN KEY (task_id) REFERENCES tasks(id)
        )`);

        resolve();
      });
    });
  }
}

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));
app.use('/uploads', express.static(uploadsDir));

app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

initDb().catch(err => {
  console.error('Database initialization error:', err);
  process.exit(1);
});

// ===== LEARNING POINTS ENDPOINTS =====

// Get all learning points
app.get('/api/learning-points', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM learning_points ORDER BY created_date DESC', []);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create learning point
app.post('/api/learning-points', async (req, res) => {
  const { type, module_name, description } = req.body;
  
  if (!type || !module_name) {
    res.status(400).json({ error: 'Type and Module Name are required' });
    return;
  }

  try {
    const result = await dbRun(
      'INSERT INTO learning_points (type, module_name, description) VALUES (?, ?, ?)',
      [type, module_name, description || '']
    );
    res.json({ id: result.lastID, message: 'Learning point created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete learning point
app.delete('/api/learning-points/:id', async (req, res) => {
  try {
    await dbRun('DELETE FROM learning_points WHERE id = ?', [req.params.id]);
    res.json({ message: 'Learning point deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== TRAINING SESSIONS ENDPOINTS =====

// Get all training sessions
app.get('/api/training-sessions', async (req, res) => {
  const query = `
    SELECT ts.*, lp.type, lp.module_name 
    FROM training_sessions ts
    LEFT JOIN learning_points lp ON ts.learning_point_id = lp.id
    ORDER BY ts.session_date DESC
  `;
  try {
    const rows = await dbAll(query, []);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create training session
app.post('/api/training-sessions', async (req, res) => {
  const { learning_point_id, session_date } = req.body;
  
  if (!learning_point_id || !session_date) {
    res.status(400).json({ error: 'Learning Point ID and Session Date are required' });
    return;
  }

  try {
    const result = await dbRun(
      'INSERT INTO training_sessions (learning_point_id, session_date) VALUES (?, ?)',
      [learning_point_id, session_date]
    );
    res.json({ id: result.lastID, message: 'Training session created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get session details with participants
app.get('/api/training-sessions/:id', async (req, res) => {
  const sessionId = req.params.id;
  try {
    const session = await dbGet('SELECT * FROM training_sessions WHERE id = ?', [sessionId]);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    const participants = await dbAll('SELECT * FROM session_participants WHERE session_id = ?', [sessionId]);
    res.json({ ...session, participants });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete training session and related records
app.delete('/api/training-sessions/:id', async (req, res) => {
  const sessionId = req.params.id;

  try {
    await dbRun('DELETE FROM task_submissions WHERE task_id IN (SELECT id FROM tasks WHERE session_id = ?)', [sessionId]);
    await dbRun('DELETE FROM task_attachments WHERE task_id IN (SELECT id FROM tasks WHERE session_id = ?)', [sessionId]);
    await dbRun('DELETE FROM tasks WHERE session_id = ?', [sessionId]);
    await dbRun('DELETE FROM session_participants WHERE session_id = ?', [sessionId]);
    await dbRun('DELETE FROM training_sessions WHERE id = ?', [sessionId]);
    res.json({ message: 'Training session deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get sessions for specific person
app.get('/api/training-sessions/person/:person_name', async (req, res) => {
  const personName = req.params.person_name;
  const query = `
    SELECT ts.*, lp.type, lp.module_name
    FROM training_sessions ts
    LEFT JOIN learning_points lp ON ts.learning_point_id = lp.id
    WHERE ts.id IN (
      SELECT session_id FROM session_participants WHERE participant_name LIKE ?
    )
    ORDER BY ts.session_date ASC
  `;
  try {
    const rows = await dbAll(query, ['%' + personName + '%']);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add participant to session
app.post('/api/session-participants', async (req, res) => {
  const { session_id, participant_name } = req.body;
  
  if (!session_id || !participant_name) {
    res.status(400).json({ error: 'Session ID and Participant Name are required' });
    return;
  }

  try {
    const result = await dbRun(
      'INSERT INTO session_participants (session_id, participant_name) VALUES (?, ?)',
      [session_id, participant_name]
    );
    res.json({ id: result.lastID, message: 'Participant added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== TASKS ENDPOINTS =====

// Create task
app.post('/api/tasks', upload.single('attachment'), async (req, res) => {
  const { session_id, task_name, description, deadline, assigned_to } = req.body;
  const parsedSessionId = session_id ? Number(session_id) : null;
  
  if (!task_name || !deadline || !assigned_to) {
    res.status(400).json({ error: 'Task Name, Deadline, and Assigned To are required' });
    return;
  }

  try {
    const result = await dbRun(
      'INSERT INTO tasks (session_id, task_name, description, deadline, assigned_to) VALUES (?, ?, ?, ?, ?)',
      [parsedSessionId, task_name, description || '', deadline, assigned_to]
    );

    const taskId = result.lastID;
    if (req.file) {
      await dbRun(
        'INSERT INTO task_attachments (task_id, file_name, file_path) VALUES (?, ?, ?)',
        [taskId, req.file.originalname, `/uploads/${req.file.filename}`]
      );
    }
    res.json({ id: taskId, message: 'Task created for ' + assigned_to + ' successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all tasks
app.get('/api/tasks', async (req, res) => {
  const query = `
    SELECT t.*, ts.session_date, lp.module_name
    FROM tasks t
    LEFT JOIN training_sessions ts ON t.session_id = ts.id
    LEFT JOIN learning_points lp ON ts.learning_point_id = lp.id
    ORDER BY t.deadline ASC
  `;
  try {
    const rows = await dbAll(query, []);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get tasks for specific person
app.get('/api/tasks/person/:person_name', async (req, res) => {
  const personName = req.params.person_name.trim();
  const normalizedName = ',' + personName.replace(/\s+/g, '') + ',';
  const query = `
    SELECT t.*, ts.session_date, lp.module_name
    FROM tasks t
    LEFT JOIN training_sessions ts ON t.session_id = ts.id
    LEFT JOIN learning_points lp ON ts.learning_point_id = lp.id
    WHERE ',' || REPLACE(t.assigned_to, ' ', '') || ',' LIKE ?
    ORDER BY t.deadline ASC
  `;
  try {
    const rows = await dbAll(query, ['%' + normalizedName + '%']);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update task status
app.put('/api/tasks/:id', async (req, res) => {
  const { status, completion_date } = req.body;
  const lastStatusUpdate = new Date().toISOString();
  const finalCompletionDate = status === 'Completed' ? (completion_date || new Date().toISOString()) : null;

  try {
    await dbRun(
      'UPDATE tasks SET status = ?, completion_date = ?, last_status_update = ? WHERE id = ?',
      [status, finalCompletionDate, lastStatusUpdate, req.params.id]
    );
    res.json({ message: 'Task updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit task with optional note and attachment
app.post('/api/tasks/:id/submit', upload.single('submission_attachment'), async (req, res) => {
  const { status, completion_date, note, submitted_by } = req.body;
  const taskId = req.params.id;
  const lastStatusUpdate = new Date().toISOString();
  const finalCompletionDate = status === 'Completed' ? (completion_date || new Date().toISOString()) : null;

  try {
    await dbRun(
      'UPDATE tasks SET status = ?, completion_date = ?, last_status_update = ? WHERE id = ?',
      [status, finalCompletionDate, lastStatusUpdate, taskId]
    );

    const submissionDate = new Date().toISOString();
    const attachmentPath = req.file ? `/uploads/${req.file.filename}` : null;
    if (note || req.file) {
      await dbRun(
        'INSERT INTO task_submissions (task_id, submitted_by, submission_date, attachment_path, note, status) VALUES (?, ?, ?, ?, ?, ?)',
        [taskId, submitted_by || '', submissionDate, attachmentPath, note || '', status || 'Submitted']
      );
    }

    res.json({ message: 'Task submitted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get task attachments
app.get('/api/tasks/:id/attachments', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM task_attachments WHERE task_id = ?', [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== ANALYTICS ENDPOINTS =====

// Get dashboard stats
app.get('/api/analytics/dashboard', async (req, res) => {
  try {
    const totalSessions = await dbGet('SELECT COUNT(*) as count FROM training_sessions', []);
    const completedTasks = await dbGet("SELECT COUNT(*) as count FROM tasks WHERE status = 'Completed'", []);
    const queriesArrivedTasks = await dbGet("SELECT COUNT(*) as count FROM tasks WHERE status = 'Queries Arrived'", []);

    const personStats = await dbAll(`
      SELECT assigned_to,
             COUNT(*) as total_tasks,
             SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_tasks
      FROM tasks
      GROUP BY assigned_to
    `, []);

    let avgTimes;
    let avgStatusUpdate;

    if (usePostgres) {
      avgTimes = await dbAll(`
        SELECT assigned_to,
               AVG(EXTRACT(EPOCH FROM (completion_date - created_date)) / 86400.0) as avg_days_to_complete
        FROM tasks
        WHERE status = 'Completed' AND completion_date IS NOT NULL
        GROUP BY assigned_to
      `, []);

      avgStatusUpdate = await dbGet(`
        SELECT AVG(EXTRACT(EPOCH FROM (last_status_update - created_date)) / 86400.0) as avg_status_update_days
        FROM tasks
        WHERE last_status_update IS NOT NULL
      `, []);
    } else {
      avgTimes = await dbAll(`
        SELECT assigned_to,
               AVG(julianday(completion_date) - julianday(created_date)) as avg_days_to_complete
        FROM tasks
        WHERE status = 'Completed' AND completion_date IS NOT NULL
        GROUP BY assigned_to
      `, []);

      avgStatusUpdate = await dbGet(`
        SELECT AVG(julianday(last_status_update) - julianday(created_date)) as avg_status_update_days
        FROM tasks
        WHERE last_status_update IS NOT NULL
      `, []);
    }

    res.json({
      total_sessions: totalSessions.count,
      completed_tasks: completedTasks.count,
      queries_arrived_tasks: queriesArrivedTasks.count,
      person_stats: personStats,
      avg_completion_times: avgTimes,
      avg_status_update_days: avgStatusUpdate?.avg_status_update_days || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get person's analytics
app.get('/api/analytics/person/:person_name', async (req, res) => {
  const personName = req.params.person_name.trim();
  const normalizedName = ',' + personName.replace(/\s+/g, '') + ',';

  try {
    let query;
    if (usePostgres) {
      query = `
        SELECT 
          COUNT(*) as total_tasks,
          SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_tasks,
          SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_tasks,
          SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_tasks,
          SUM(CASE WHEN status = 'Queries Arrived' THEN 1 ELSE 0 END) as queries_arrived_tasks,
          AVG(CASE WHEN status = 'Completed' THEN EXTRACT(EPOCH FROM (completion_date - created_date)) / 86400.0 END) as avg_days_to_complete,
          AVG(CASE WHEN last_status_update IS NOT NULL THEN EXTRACT(EPOCH FROM (last_status_update - created_date)) / 86400.0 END) as avg_status_update_days
        FROM tasks
        WHERE ',' || REPLACE(assigned_to, ' ', '') || ',' LIKE ?
      `;
    } else {
      query = `
        SELECT 
          COUNT(*) as total_tasks,
          SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_tasks,
          SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_tasks,
          SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_tasks,
          SUM(CASE WHEN status = 'Queries Arrived' THEN 1 ELSE 0 END) as queries_arrived_tasks,
          AVG(CASE WHEN status = 'Completed' THEN julianday(completion_date) - julianday(created_date) END) as avg_days_to_complete,
          AVG(CASE WHEN last_status_update IS NOT NULL THEN julianday(last_status_update) - julianday(created_date) END) as avg_status_update_days
        FROM tasks
        WHERE ',' || REPLACE(assigned_to, ' ', '') || ',' LIKE ?
      `;
    }

    const stats = await dbAll(query, ['%' + normalizedName + '%']);
    res.json(stats[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server when running locally
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`Training Management System is running!`);
    console.log(`\nOpen your browser and go to:`);
    console.log(`http://localhost:${PORT}`);
    console.log(`\nAdmin Panel: http://localhost:${PORT}/admin.html`);
    console.log(`Learner Login: http://localhost:${PORT}/login.html`);
    console.log(`Analytics: http://localhost:${PORT}/analytics.html`);
    console.log(`========================================\n`);
  });
}

module.exports = app;
