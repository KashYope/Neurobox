// Simple admin seeding script that can be run directly with node
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

const seedAdmin = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/neurobox'
  });

  try {
    await client.connect();
    
    const email = 'admin@neurosooth.com';
    const password = 'admin123'; // Change this in production!
    
    // Check if admin exists
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (existing.rows.length > 0) {
      console.log('Admin user already exists. Updating password...');
      const hash = await bcrypt.hash(password, 10);
      await client.query(
        'UPDATE users SET password_hash = $1 WHERE email = $2',
        [hash, email]
      );
      console.log('Admin password updated successfully');
    } else {
      console.log('Creating new admin user...');
      const hash = await bcrypt.hash(password, 10);
      const id = '00000000-0000-0000-0000-000000000000';
      
      await client.query(
        `INSERT INTO users (id, email, password_hash, organization, contact_name, role, status)
         VALUES ($1, $2, $3, 'NeuroSooth Admin', 'Super Admin', 'admin', 'active')`,
        [id, email, hash]
      );
      console.log('Admin user created successfully');
    }
    
    console.log('\nAdmin credentials:');
    console.log('Email: admin@neurosooth.com');
    console.log('Password: admin123');
    console.log('\nYou can now login at http://localhost:4000');
    
  } catch (error) {
    console.error('Failed to seed admin:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
};

seedAdmin();
