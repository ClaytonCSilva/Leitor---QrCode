// src/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

dotenv.config({ path: './.env' });

const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || 'cW?|y5q@Uz6XhTZj-dIP>oqb';
const API_URL = process.env.API_URL || `https://api-qrcode-8clv.onrender.com:${PORT}`;

// ============================================
// MIDDLEWARE
// ============================================

app.use(cors());
app.use(express.json());

// Database SQLite
const db = new sqlite3.Database('./data/qrcodes.db', (err) => {
  if (err) console.error('Database connection error:', err);
  else console.log('✅ Connected to SQLite database');
});

// Criar tabelas
db.serialize(() => {
  // Tabela de leituras de QR Code
  db.run(`
    CREATE TABLE IF NOT EXISTS qr_readings (
      id TEXT PRIMARY KEY,
      qr_data TEXT NOT NULL,
      device_id TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      latitude REAL,
      longitude REAL,
      image_url TEXT,
      processed BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

   // Tabela de Líderes
  db.run(`
    CREATE TABLE IF NOT EXISTS liders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      matricula TEXT UNIQUE NOT NULL,
      foto_url TEXT
    )
  `);

  // Tabela de Colaboradores
  db.run(`
    CREATE TABLE IF NOT EXISTS collaborators (
      id TEXT PRIMARY KEY,
      lider_id TEXT NOT NULL REFERENCES liders(id),
      name TEXT NOT NULL,
      matricula TEXT UNIQUE NOT NULL,
      foto_url TEXT
    )
  `);

 
  // Tabela de dispositivos
  db.run(`
    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      device_type TEXT,
      last_sync INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de usuários (se necessário)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('NODE_ENV =', process.env.NODE_ENV);
  if(process.env.NODE_ENV === 'development') {
    // Inserir usuário de teste
    db.get('SELECT * FROM users WHERE username = ?', ['teste'], (err, row) => {
      if (err) console.error('Database error:', err);
      if (!row) {
        const testUserId = uuidv4();
        db.run(
          'INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)',
          [testUserId, 'teste', 'admin@example.com', 'admin123']
        );
      }
    });
  }
});

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// ============================================
// ROTAS - AUTENTICAÇÃO
// ============================================

// Login (verifica usuário no banco; em produção use hash salgado)
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error', details: err.message });
    if (!row) return res.status(401).json({ error: 'Invalid credentials' });

    // NOTE: here password_hash is stored in plain text for simplicity in this demo.
    // In production, store salted hashes and use bcrypt.compare.
    if (row.password_hash !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = { id: row.id, username: row.username };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user });
  });
});

// Refresh token
app.post('/api/auth/refresh', authenticateToken, (req, res) => {
  const token = jwt.sign(req.user, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token });
});

// ============================================
// ROTAS - QR CODES
// ============================================

// 1️⃣ REGISTRAR NOVA LEITURA DE QR CODE
app.post('/api/qr/register', authenticateToken, (req, res) => {
  const { qr_data, device_id, latitude, longitude, image_url } = req.body;

  if (!qr_data) {
    return res.status(400).json({ error: 'qr_data required' });
  }

      const id = uuidv4();
      const timestamp = Date.now();

      db.run(
        `INSERT INTO qr_readings (id, qr_data, device_id, timestamp, latitude, longitude, image_url)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, qr_data, device_id, timestamp, latitude || null, longitude || null, image_url || null],
        (insertErr) => {
          if (insertErr) {
            return res.status(500).json({ error: 'Database error', details: insertErr.message });
          }
          res.status(201).json({
            success: true,
            id,
            qr_data,
            timestamp,
            message: 'QR code registered successfully'
          });
        }
      );
    }
  );

// 3️⃣ OBTER UMA LEITURA ESPECÍFICA
app.get('/api/qr/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM qr_readings WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'QR reading not found' });
    }
    res.json(row);
  });
});

// 4️⃣ BUSCAR QR CODES POR DATA
app.get('/api/qr/search', authenticateToken, (req, res) => {
  const { start_date, end_date, device_id } = req.query;

  if (!start_date || !end_date) {
    return res.status(400).json({ error: 'start_date and end_date required' });
  }

  const startTime = new Date(start_date).getTime();
  const endTime = new Date(end_date).getTime();

  let query = 'SELECT * FROM qr_readings WHERE timestamp BETWEEN ? AND ?';
  let params = [startTime, endTime];

  if (device_id) {
    query += ' AND device_id = ?';
    params.push(device_id);
  }

  query += ' ORDER BY timestamp DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  });
});

// ROTA PARA VERIFICAR DE QUAL COLABORADOR É O QR CODE LIDO
app.get('/api/qr/verify/:qr_data', authenticateToken, (req, res) => {
  const qrData = decodeURIComponent(req.params.qr_data);

  db.get('SELECT * FROM collaborators WHERE matricula = ?', [qrData], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Collaborator not found for this QR code' });
    }
    res.json({
      success: true,
      qr_data: qrData,
      collaborator: row,
      marker_options: ['grave', 'medio', 'curto']
    });
  });
});

// 6️⃣ ESTATÍSTICAS
app.get('/api/qr/stats', authenticateToken, (req, res) => {
  const { device_id } = req.query;

  let query = 'SELECT COUNT(*) as total, COUNT(DISTINCT device_id) as devices FROM qr_readings';
  let params = [];

  if (device_id) {
    query = 'SELECT COUNT(*) as total FROM qr_readings WHERE device_id = ?';
    params = [device_id];
  }

  db.get(query, params, (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err.message });
    }

    res.json({
      success: true,
      stats: row
    });
  });
});

// ============================================
// ROTAS - DISPOSITIVOS
// ============================================

// Registrar dispositivo
app.post('/api/devices/register', (req, res) => {
  const { name, device_type } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Device name required' });
  }

  const device_id = uuidv4();

  db.run(
    `INSERT INTO devices (id, name, device_type, last_sync) VALUES (?, ?, ?, ?)`,
    [device_id, name, device_type || 'mobile', Date.now()],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      res.status(201).json({
        success: true,
        device_id,
        message: 'Device registered successfully'
      });
    }
  );
});

// Listar dispositivos
app.get('/api/devices', authenticateToken, (req, res) => {
  db.all('SELECT * FROM devices ORDER BY last_sync DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  });
});

// ============================================
// ROTAS - HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ============================================
// TRATAMENTO DE ERROS
// ============================================

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║        QR Code Reader API - Backend                   ║
║        Running on: ${API_URL}:${PORT}                 ║
║        Environment: ${process.env.NODE_ENV || 'development'}║
╚═══════════════════════════════════════════════════════╝
  `);
});

module.exports = app;