const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Inisialisasi Database
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) console.error('Gagal koneksi database:', err.message);
    console.log('Terhubung ke database SQLite.');
});

// Membuat Tabel secara Sinkron (Berurutan)
db.serialize(() => {
    // 1. Tabel Users
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT
    )`, (err) => {
        if (err) console.error('Gagal buat tabel users:', err.message);
        else console.log('Tabel users siap.');
    });

    // 2. Tabel Kehadiran (Attendance)
    db.run(`CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_name TEXT,
        teacher_name TEXT,
        subject TEXT,
        period TEXT,
        status TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) console.error('Gagal buat tabel attendance:', err.message);
        else console.log('Tabel attendance siap.');
    });

    // 3. Isi Akun Default (Admin & Contoh Kelas)
    const stmt = db.prepare(`INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`);
    stmt.run('admin', 'berhias', 'admin');
    stmt.run('guru1', 'berhias', 'teacher');
    
    // Tambahkan otomatis beberapa kelas (Bisa ditambah manual di sini)
    const classes = ['X.1', 'X.2', 'XI.1', 'XI.2', 'XII.1'];
    classes.forEach(cls => {
        stmt.run(cls, 'berhias', 'representative');
    });
    stmt.finalize();
    console.log('Data user berhasil di-sinkronisasi.');
});

// API untuk Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, password], (err, row) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (row) {
            res.json({ success: true, role: row.role, username: row.username });
        } else {
            res.status(401).json({ success: false, message: 'Username atau Password salah!' });
        }
    });
});

// API untuk Simpan Data Kehadiran
app.post('/api/save-attendance', (req, res) => {
    // ... kode simpan ke tabel attendance ...
});
app.post('/api/save-attendance', (req, res) => {
    const { class_name, teacher_name, subject, period, status } = req.body;
    const sql = `INSERT INTO attendance (class_name, teacher_name, subject, period, status) VALUES (?, ?, ?, ?, ?)`;
    
    db.run(sql, [class_name, teacher_name, subject, period, status], function(err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: 'Data berhasil disimpan!' });
    });
});

const port = process.env.PORT || 3000; // Menggunakan port dari hosting atau 3000
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});
