import bcrypt from 'bcryptjs';
import { pool } from '../src/db.js';

const seedAdmin = async () => {
  const email = 'admin@neurosooth.com';
  const password = 'admin123'; // Ensure this is changed in production!

  try {
    // Check if admin exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      console.log('Admin already exists');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const id = '00000000-0000-0000-0000-000000000000'; // Fixed UUID for admin

    await pool.query(
      `INSERT INTO users (id, email, password_hash, organization, contact_name, role, status)
       VALUES ($1, $2, $3, 'NeuroSooth Admin', 'Super Admin', 'admin', 'active')`,
      [id, email, hash]
    );

    console.log('Admin user created successfully');
  } catch (error) {
    console.error('Failed to seed admin:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

seedAdmin();
