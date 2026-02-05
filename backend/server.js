/**
 * Simple Express API for Carlet that stores data in PostgreSQL and files on disk.
 * - Creates tables if not present
 * - Exposes endpoints under /api/*
 *
 * Environment:
 *  - PORT (default 3000)
 *  - PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE
 */

const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({ dest: UPLOAD_DIR });

const pool = new Pool({
  host: process.env.PGHOST || 'db',
  port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
  user: process.env.PGUSER || 'carlet',
  password: process.env.PGPASSWORD || 'carletpass',
  database: process.env.PGDATABASE || 'carletdb',
});

async function ensureSchema() {
  // Basic tables with JSON fields where appropriate
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT,
      full_name TEXT,
      role TEXT,
      is_platform_admin BOOLEAN DEFAULT false,
      location_id TEXT
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      name TEXT,
      timezone TEXT,
      stages JSONB
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cars (
      id TEXT PRIMARY KEY,
      vin TEXT,
      year INTEGER,
      make TEXT,
      model TEXT,
      trim TEXT,
      license_plate TEXT,
      customer_name TEXT,
      customer_phone TEXT,
      customer_email TEXT,
      location_id TEXT,
      current_stage_id TEXT,
      last_activity TIMESTAMP,
      created_date TIMESTAMP,
      updated_date TIMESTAMP,
      check_in_images JSONB,
      check_out_images JSONB,
      is_archived BOOLEAN DEFAULT false
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS parts (
      id TEXT PRIMARY KEY,
      car_id TEXT,
      name TEXT,
      qty INTEGER DEFAULT 1,
      notes TEXT,
      created_date TIMESTAMP,
      updated_date TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      car_id TEXT,
      content TEXT,
      author_name TEXT,
      stage_name TEXT,
      created_date TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      filename TEXT,
      url TEXT,
      created_date TIMESTAMP
    );
  `);

  // Seed one user and a location with stages if missing
  const res = await pool.query(`SELECT COUNT(*) AS cnt FROM users`);
  if (parseInt(res.rows[0].cnt) === 0) {
    const userId = 'u1';
    await pool.query(
      `INSERT INTO users (id, email, full_name, role, is_platform_admin, location_id)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [userId, 'admin@example.com', 'Local Admin', 'admin', true, 'loc1']
    );
  }

  const locRes = await pool.query(`SELECT COUNT(*) AS cnt FROM locations`);
  if (parseInt(locRes.rows[0].cnt) === 0) {
    const stages = [
      { id: 's1', name: 'Check In', color: '#f59e0b' },
      { id: 's2', name: 'Inspection', color: '#06b6d4' },
      { id: 's3', name: 'Repair', color: '#10b981' },
      { id: 's4', name: 'Check Out', color: '#6366f1' }
    ];
    await pool.query(
      `INSERT INTO locations (id, name, timezone, stages) VALUES ($1,$2,$3,$4)`,
      ['loc1', 'Local Shop', 'UTC', JSON.stringify(stages)]
    );
  }
}

function nowIso() {
  return new Date().toISOString();
}

// Basic VIN decode map (same mapping as the frontend mock)
const VIN_YEAR_MAP = {
  A: 2010, B: 2011, C: 2012, D: 2013, E: 2014, F: 2015, G: 2016, H: 2017,
  J: 2018, K: 2019, L: 2020, M: 2021, N: 2022, P: 2023, R: 2024, S: 2025,
  T: 2026, V: 2027, W: 2028, X: 2029, Y: 2030, 1: 2001, 2: 2002, 3: 2003,
  4: 2004, 5: 2005, 6: 2006, 7: 2007, 8: 2008, 9: 2009
};

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));

// API root
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Auth
app.get('/api/auth/me', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM users LIMIT 1');
    res.json(r.rows[0] || null);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'db error' });
  }
});

app.post('/api/auth/logout', (req, res) => res.json({ ok: true }));

// Locations
app.get('/api/locations', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM locations');
    res.json(r.rows || []);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'db error' });
  }
});

// Cars
app.get('/api/cars', async (req, res) => {
  try {
    // Support simple filters via query params (location_id, is_archived)
    const filters = [];
    const values = [];
    let idx = 1;
    if (req.query.location_id) {
      filters.push(`location_id = $${idx++}`);
      values.push(req.query.location_id);
    }
    if (req.query.is_archived) {
      filters.push(`is_archived = $${idx++}`);
      values.push(req.query.is_archived === 'true');
    }
    let q = 'SELECT * FROM cars';
    if (filters.length) q += ' WHERE ' + filters.join(' AND ');
    const r = await pool.query(q, values);
    res.json(r.rows || []);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'db error' });
  }
});

app.get('/api/cars/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM cars WHERE id=$1 LIMIT 1', [req.params.id]);
    res.json(r.rows[0] || null);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'db error' });
  }
});

app.post('/api/cars', async (req, res) => {
  try {
    const id = req.body.id || uuidv4();
    const now = nowIso();
    const payload = {
      ...req.body,
      id,
      created_date: now,
      updated_date: now,
      last_activity: req.body.last_activity || now,
      check_in_images: req.body.check_in_images || [],
      check_out_images: req.body.check_out_images || [],
      is_archived: req.body.is_archived || false
    };
    await pool.query(
      `INSERT INTO cars (id, vin, year, make, model, trim, license_plate, customer_name, customer_phone, customer_email,
        location_id, current_stage_id, last_activity, created_date, updated_date, check_in_images, check_out_images, is_archived)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
      [
        payload.id, payload.vin, payload.year, payload.make, payload.model, payload.trim,
        payload.license_plate, payload.customer_name, payload.customer_phone, payload.customer_email,
        payload.location_id, payload.current_stage_id, payload.last_activity, payload.created_date, payload.updated_date,
        JSON.stringify(payload.check_in_images), JSON.stringify(payload.check_out_images), payload.is_archived
      ]
    );
    res.json(payload);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'db error' });
  }
});

app.put('/api/cars/:id', async (req, res) => {
  try {
    const now = nowIso();
    const updates = { ...req.body, updated_date: now };
    // Build SET clause dynamically
    const keys = Object.keys(updates);
    const values = keys.map(k => updates[k]);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const q = `UPDATE cars SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`;
    const r = await pool.query(q, [...values, req.params.id]);
    res.json(r.rows[0] || null);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'db error' });
  }
});

// Parts
app.get('/api/parts', async (req, res) => {
  try {
    const q = 'SELECT * FROM parts' + (req.query.car_id ? ' WHERE car_id = $1' : '');
    const r = req.query.car_id ? await pool.query(q, [req.query.car_id]) : await pool.query(q);
    res.json(r.rows || []);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'db error' });
  }
});

app.post('/api/parts', async (req, res) => {
  try {
    const id = req.body.id || uuidv4();
    const now = nowIso();
    await pool.query(
      `INSERT INTO parts (id, car_id, name, qty, notes, created_date, updated_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [id, req.body.car_id, req.body.name, req.body.qty || 1, req.body.notes || '', now, now]
    );
    const r = await pool.query('SELECT * FROM parts WHERE id=$1', [id]);
    res.json(r.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'db error' });
  }
});

app.put('/api/parts/:id', async (req, res) => {
  try {
    const now = nowIso();
    const updates = { ...req.body, updated_date: now };
    const keys = Object.keys(updates);
    const values = keys.map(k => updates[k]);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const q = `UPDATE parts SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`;
    const r = await pool.query(q, [...values, req.params.id]);
    res.json(r.rows[0] || null);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'db error' });
  }
});

// Notes
app.get('/api/notes', async (req, res) => {
  try {
    const q = 'SELECT * FROM notes' + (req.query.car_id ? ' WHERE car_id = $1' : '');
    const r = req.query.car_id ? await pool.query(q, [req.query.car_id]) : await pool.query(q);
    res.json(r.rows || []);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'db error' });
  }
});

app.post('/api/notes', async (req, res) => {
  try {
    const id = req.body.id || uuidv4();
    const now = nowIso();
    await pool.query(
      `INSERT INTO notes (id, car_id, content, author_name, stage_name, created_date)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, req.body.car_id, req.body.content, req.body.author_name || '', req.body.stage_name || '', now]
    );
    const r = await pool.query('SELECT * FROM notes WHERE id=$1', [id]);
    res.json(r.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'db error' });
  }
});

// Uploads
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'no file' });
    // Move file to uploads with original filename (avoid name collisions by prefix)
    const ext = path.extname(req.file.originalname) || '';
    const filename = `${Date.now()}_${uuidv4()}${ext}`;
    const dest = path.join(UPLOAD_DIR, filename);
    fs.renameSync(req.file.path, dest);
    const url = `/uploads/${filename}`;
    const id = uuidv4();
    await pool.query(
      `INSERT INTO files (id, filename, url, created_date) VALUES ($1,$2,$3,$4)`,
      [id, req.file.originalname, url, nowIso()]
    );
    res.json({ file_url: url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'upload error' });
  }
});

// Invoke LLM (VIN decode fallback)
app.post('/api/invoke-llm', async (req, res) => {
  try {
    const prompt = req.body.prompt || '';
    const m = prompt.match(/Decode this VIN:\s*([A-Za-z0-9]{17})/i);
    if (m) {
      const vin = m[1].toUpperCase();
      const yearCode = vin[9];
      const year = VIN_YEAR_MAP[yearCode] || null;
      return res.json({ year: year || null, make: '', model: '', trim: '' });
    }
    res.json({ year: null, make: '', model: '', trim: '' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'invoke error' });
  }
});

// appLogs
app.post('/api/app-logs', (req, res) => {
  console.log('app-log', req.body);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await ensureSchema();
    app.listen(PORT, () => {
      console.log(`Carlet backend listening on port ${PORT}`);
    });
  } catch (e) {
    console.error('Failed to start:', e);
    process.exit(1);
  }
})();