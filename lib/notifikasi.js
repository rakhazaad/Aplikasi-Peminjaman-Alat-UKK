const pool = require('./db');

async function createNotifikasi(userId, tipe, judul, pesan, link = null) {
  try {
    // Ensure schema exists
    if (pool.ensureSchema) {
      await pool.ensureSchema();
    }

    const result = await pool.query(
      'INSERT INTO notifikasi (user_id, tipe, judul, pesan, link) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, tipe, judul, pesan, link]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating notifikasi:', error);
    return null;
  }
}

async function createNotifikasiForAllUsers(role, tipe, judul, pesan, link = null) {
  try {
    // Ensure schema exists
    if (pool.ensureSchema) {
      await pool.ensureSchema();
    }

    // Get all users with specified role
    const usersResult = await pool.query(
      'SELECT id FROM users WHERE role = $1',
      [role]
    );

    // Create notification for each user
    const promises = usersResult.rows.map(user =>
      createNotifikasi(user.id, tipe, judul, pesan, link)
    );

    await Promise.all(promises);
    return true;
  } catch (error) {
    console.error('Error creating notifikasi for all users:', error);
    return false;
  }
}

async function createNotifikasiForPetugas(tipe, judul, pesan, link = null) {
  return createNotifikasiForAllUsers('petugas', tipe, judul, pesan, link);
}

async function createNotifikasiForPeminjam(tipe, judul, pesan, link = null) {
  return createNotifikasiForAllUsers('peminjam', tipe, judul, pesan, link);
}

async function createNotifikasiForAdmin(tipe, judul, pesan, link = null) {
  return createNotifikasiForAllUsers('admin', tipe, judul, pesan, link);
}

module.exports = {
  createNotifikasi,
  createNotifikasiForAllUsers,
  createNotifikasiForPetugas,
  createNotifikasiForPeminjam,
  createNotifikasiForAdmin,
};
