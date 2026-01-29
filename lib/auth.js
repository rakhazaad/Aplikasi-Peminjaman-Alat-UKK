const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

async function login(username, password) {
  try {
    const result = await pool.query(
      'SELECT id, username, password, nama, role FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return { success: false, message: 'Username tidak ditemukan' };
    }

    const user = result.rows[0];
    const isValid = await comparePassword(password, user.password);

    if (!isValid) {
      return { success: false, message: 'Password salah' };
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Log login activity
    try {
      await pool.query(
        'INSERT INTO log_aktifitas (user_id, aksi, tabel, record_id, detail) VALUES ($1, $2, $3, $4, $5)',
        [user.id, 'LOGIN', 'auth', user.id, `Login berhasil - Role: ${user.role}`]
      );
    } catch (logError) {
      // Don't fail login if logging fails
      console.error('Error logging login activity:', logError);
    }

    return {
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        nama: user.nama,
        role: user.role,
      },
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Terjadi kesalahan saat login' };
  }
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

module.exports = {
  hashPassword,
  comparePassword,
  login,
  verifyToken,
};
