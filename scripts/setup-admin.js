const bcrypt = require('bcryptjs');
const pool = require('../lib/db');

async function setupAdmin() {
  try {
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (username, password, nama, role) VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO NOTHING RETURNING id',
      ['admin', hashedPassword, 'Administrator', 'admin']
    );

    if (result.rows.length > 0) {
      console.log('Admin user created successfully!');
      console.log('Username: admin');
      console.log('Password: admin123');
    } else {
      console.log('Admin user already exists.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error setting up admin:', error);
    process.exit(1);
  }
}

setupAdmin();
