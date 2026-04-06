const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const os = require('os');
const multer = require('multer');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

const rootDir = process.env.VERCEL ? path.join(os.tmpdir(), 'training-management-system') : __dirname;
const uploadsDir = path.join(rootDir, 'uploads');
const dbPath = path.join(rootDir, 'training.db');

if (!fs.existsSync(rootDir)) {
  fs.mkdirSync(rootDir, { recursive: true });
}

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
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

// Database setup
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error(err);
  else console.log('Connected to SQLite database');
});

// Initialize database tables
db.serialize(() => {
  // Learning Points table
  db.run(`CREATE TABLE IF NOT EXISTS learning_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    module_name TEXT NOT NULL,
    description TEXT,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Training Sessions table
  db.run(`CREATE TABLE IF NOT EXISTS training_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    learning_point_id INTEGER NOT NULL,
    session_date DATETIME NOT NULL,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (learning_point_id) REFERENCES learning_points(id)
  )`);

  // Session Participants table
  db.run(`CREATE TABLE IF NOT EXISTS session_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    participant_name TEXT NOT NULL,
    joined_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES training_sessions(id)
  )`);

  // Tasks table
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
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

  // Fix schema for existing table if session_id is still NOT NULL
  db.get(`PRAGMA table_info(tasks)`, [], (err, columns) => {
    if (!err) {
      const sessionColumn = columns.find(col => col.name === 'session_id');
      if (sessionColumn && sessionColumn.notnull === 1) {
        db.serialize(() => {
          db.run('PRAGMA foreign_keys = OFF');
          db.run(`CREATE TABLE IF NOT EXISTS tasks_new (
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
          db.run('INSERT INTO tasks_new (id, session_id, task_name, description, deadline, assigned_to, status, completion_date, last_status_update, created_date) SELECT id, session_id, task_name, description, deadline, assigned_to, status, completion_date, last_status_update, created_date FROM tasks');
          db.run('DROP TABLE tasks');
          db.run('ALTER TABLE tasks_new RENAME TO tasks');
          db.run('PRAGMA foreign_keys = ON');
        });
      }
    }
  });

  // Add last_status_update column if missing
  db.get(`PRAGMA table_info(tasks)`, [], (err, columns) => {
    if (!err && !columns.some(col => col.name === 'last_status_update')) {
      db.run('ALTER TABLE tasks ADD COLUMN last_status_update DATETIME');
    }
  });

  // Task Attachments table
  db.run(`CREATE TABLE IF NOT EXISTS task_attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    uploaded_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id)
  )`);

  // Task Submissions table
  db.run(`CREATE TABLE IF NOT EXISTS task_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    submitted_by TEXT NOT NULL,
    submission_date DATETIME NOT NULL,
    attachment_path TEXT,
    note TEXT,
    status TEXT DEFAULT 'Submitted',
    FOREIGN KEY (task_id) REFERENCES tasks(id)
  )`);

  db.all(`PRAGMA table_info(task_submissions)`, [], (err, columns) => {
    if (!err && !columns.some(col => col.name === 'note')) {
      db.run('ALTER TABLE task_submissions ADD COLUMN note TEXT');
    }
  });
});

// ===== LEARNING POINTS ENDPOINTS =====

// Get all learning points
app.get('/api/learning-points', (req, res) => {
  db.all('SELECT * FROM learning_points ORDER BY created_date DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Create learning point
app.post('/api/learning-points', (req, res) => {
  const { type, module_name, description } = req.body;
  
  if (!type || !module_name) {
    res.status(400).json({ error: 'Type and Module Name are required' });
    return;
  }

  db.run(
    'INSERT INTO learning_points (type, module_name, description) VALUES (?, ?, ?)',
    [type, module_name, description || ''],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: 'Learning point created successfully' });
    }
  );
});

// Delete learning point
app.delete('/api/learning-points/:id', (req, res) => {
  db.run('DELETE FROM learning_points WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Learning point deleted' });
  });
});

// ===== TRAINING SESSIONS ENDPOINTS =====

// Get all training sessions
app.get('/api/training-sessions', (req, res) => {
  const query = `
    SELECT ts.*, lp.type, lp.module_name 
    FROM training_sessions ts
    LEFT JOIN learning_points lp ON ts.learning_point_id = lp.id
    ORDER BY ts.session_date DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Create training session
app.post('/api/training-sessions', (req, res) => {
  const { learning_point_id, session_date } = req.body;
  
  if (!learning_point_id || !session_date) {
    res.status(400).json({ error: 'Learning Point ID and Session Date are required' });
    return;
  }

  db.run(
    'INSERT INTO training_sessions (learning_point_id, session_date) VALUES (?, ?)',
    [learning_point_id, session_date],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: 'Training session created successfully' });
    }
  );
});

// Get session details with participants
app.get('/api/training-sessions/:id', (req, res) => {
  const sessionId = req.params.id;
  
  db.get('SELECT * FROM training_sessions WHERE id = ?', [sessionId], (err, session) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    db.all('SELECT * FROM session_participants WHERE session_id = ?', [sessionId], (err, participants) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ ...session, participants });
    });
  });
});

// Delete training session and related records
app.delete('/api/training-sessions/:id', (req, res) => {
  const sessionId = req.params.id;

  db.serialize(() => {
    db.run('DELETE FROM task_submissions WHERE task_id IN (SELECT id FROM tasks WHERE session_id = ?)', [sessionId]);
    db.run('DELETE FROM task_attachments WHERE task_id IN (SELECT id FROM tasks WHERE session_id = ?)', [sessionId]);
    db.run('DELETE FROM tasks WHERE session_id = ?', [sessionId]);
    db.run('DELETE FROM session_participants WHERE session_id = ?', [sessionId]);
    db.run('DELETE FROM training_sessions WHERE id = ?', [sessionId], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Training session deleted successfully' });
    });
  });
});

// Get sessions for specific person
app.get('/api/training-sessions/person/:person_name', (req, res) => {
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
  db.all(query, ['%' + personName + '%'], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Add participant to session
app.post('/api/session-participants', (req, res) => {
  const { session_id, participant_name } = req.body;
  
  if (!session_id || !participant_name) {
    res.status(400).json({ error: 'Session ID and Participant Name are required' });
    return;
  }

  db.run(
    'INSERT INTO session_participants (session_id, participant_name) VALUES (?, ?)',
    [session_id, participant_name],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: 'Participant added successfully' });
    }
  );
});

// ===== TASKS ENDPOINTS =====

// Create task
app.post('/api/tasks', upload.single('attachment'), (req, res) => {
  const { session_id, task_name, description, deadline, assigned_to } = req.body;
  const parsedSessionId = session_id ? Number(session_id) : null;
  
  if (!task_name || !deadline || !assigned_to) {
    res.status(400).json({ error: 'Task Name, Deadline, and Assigned To are required' });
    return;
  }

  db.run(
    'INSERT INTO tasks (session_id, task_name, description, deadline, assigned_to) VALUES (?, ?, ?, ?, ?)',
    [parsedSessionId, task_name, description || '', deadline, assigned_to],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      const taskId = this.lastID;

      // If file was uploaded, add to attachments
      if (req.file) {
        db.run(
          'INSERT INTO task_attachments (task_id, file_name, file_path) VALUES (?, ?, ?)',
          [taskId, req.file.originalname, `/uploads/${req.file.filename}`],
          (err) => {
            if (err) console.error(err);
          }
        );
      }

      res.json({ id: taskId, message: 'Task created for ' + assigned_to + ' successfully' });
    }
  );
});

// Get all tasks
app.get('/api/tasks', (req, res) => {
  const query = `
    SELECT t.*, ts.session_date, lp.module_name
    FROM tasks t
    LEFT JOIN training_sessions ts ON t.session_id = ts.id
    LEFT JOIN learning_points lp ON ts.learning_point_id = lp.id
    ORDER BY t.deadline ASC
  `;
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get tasks for specific person
app.get('/api/tasks/person/:person_name', (req, res) => {
  const personName = req.params.person_name;
  const query = `
    SELECT t.*, ts.session_date, lp.module_name
    FROM tasks t
    LEFT JOIN training_sessions ts ON t.session_id = ts.id
    LEFT JOIN learning_points lp ON ts.learning_point_id = lp.id
    WHERE t.assigned_to LIKE ?
    ORDER BY t.deadline ASC
  `;
  db.all(query, ['%' + personName + '%'], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Update task status
app.put('/api/tasks/:id', (req, res) => {
  const { status, completion_date } = req.body;
  const lastStatusUpdate = new Date().toISOString();
  const finalCompletionDate = status === 'Completed' ? (completion_date || new Date().toISOString()) : null;
  
  db.run(
    'UPDATE tasks SET status = ?, completion_date = ?, last_status_update = ? WHERE id = ?',
    [status, finalCompletionDate, lastStatusUpdate, req.params.id],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Task updated successfully' });
    }
  );
});

// Submit task with optional note and attachment
app.post('/api/tasks/:id/submit', upload.single('submission_attachment'), (req, res) => {
  const { status, completion_date, note, submitted_by } = req.body;
  const taskId = req.params.id;
  const lastStatusUpdate = new Date().toISOString();
  const finalCompletionDate = status === 'Completed' ? (completion_date || new Date().toISOString()) : null;

  db.run(
    'UPDATE tasks SET status = ?, completion_date = ?, last_status_update = ? WHERE id = ?',
    [status, finalCompletionDate, lastStatusUpdate, taskId],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      const submissionDate = new Date().toISOString();
      const attachmentPath = req.file ? `/uploads/${req.file.filename}` : null;

      if (note || req.file) {
        db.run(
          'INSERT INTO task_submissions (task_id, submitted_by, submission_date, attachment_path, note, status) VALUES (?, ?, ?, ?, ?, ?)',
          [taskId, submitted_by || '', submissionDate, attachmentPath, note || '', status || 'Submitted'],
          (err) => {
            if (err) console.error(err);
          }
        );
      }

      res.json({ message: 'Task submitted successfully' });
    }
  );
});

// Get task attachments
app.get('/api/tasks/:id/attachments', (req, res) => {
  db.all('SELECT * FROM task_attachments WHERE task_id = ?', [req.params.id], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// ===== ANALYTICS ENDPOINTS =====

// Get dashboard stats
app.get('/api/analytics/dashboard', (req, res) => {
  // Total sessions
  db.get('SELECT COUNT(*) as count FROM training_sessions', [], (err, totalSessions) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    // Tasks completed
    db.get("SELECT COUNT(*) as count FROM tasks WHERE status = 'Completed'", [], (err, completedTasks) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // Queries arrived
      db.get("SELECT COUNT(*) as count FROM tasks WHERE status = 'Queries Arrived'", [], (err, queriesArrivedTasks) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        // Tasks by person
        db.all(`
          SELECT assigned_to, 
                 COUNT(*) as total_tasks,
                 SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_tasks
          FROM tasks
          GROUP BY assigned_to
        `, [], (err, personStats) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }

          // Average completion time
          db.all(`
            SELECT assigned_to,
                   AVG(julianday(completion_date) - julianday(created_date)) as avg_days_to_complete
            FROM tasks
            WHERE status = 'Completed' AND completion_date IS NOT NULL
            GROUP BY assigned_to
          `, [], (err, avgTimes) => {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }

            // Average status update time across all tasks
            db.get(`
              SELECT AVG(julianday(last_status_update) - julianday(created_date)) as avg_status_update_days
              FROM tasks
              WHERE last_status_update IS NOT NULL
            `, [], (err, avgStatusUpdate) => {
              if (err) {
                res.status(500).json({ error: err.message });
                return;
              }

              res.json({
                total_sessions: totalSessions.count,
                completed_tasks: completedTasks.count,
                queries_arrived_tasks: queriesArrivedTasks.count,
                person_stats: personStats,
                avg_completion_times: avgTimes,
                avg_status_update_days: avgStatusUpdate.avg_status_update_days
              });
            });
          });
        });
      });
    });
  });
});

// Get person's analytics
app.get('/api/analytics/person/:person_name', (req, res) => {
  const personName = req.params.person_name;
  
  db.all(`
    SELECT 
      COUNT(*) as total_tasks,
      SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_tasks,
      SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_tasks,
      SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_tasks,
      SUM(CASE WHEN status = 'Queries Arrived' THEN 1 ELSE 0 END) as queries_arrived_tasks,
      AVG(CASE WHEN status = 'Completed' THEN julianday(completion_date) - julianday(created_date) END) as avg_days_to_complete,
      AVG(CASE WHEN last_status_update IS NOT NULL THEN julianday(last_status_update) - julianday(created_date) END) as avg_status_update_days
    FROM tasks
    WHERE assigned_to LIKE ?
  `, ['%' + personName + '%'], (err, stats) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(stats[0]);
  });
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
