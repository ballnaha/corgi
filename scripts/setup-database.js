const mysql = require('mysql2/promise');

async function setupDatabase() {
  try {
    // Connect to MySQL server (without specifying database)
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '', // Change this if you have a password
    });

    // Create database if it doesn't exist
    await connection.execute('CREATE DATABASE IF NOT EXISTS corgi_shop');
    console.log('✅ Database "corgi_shop" created or already exists');

    await connection.end();
    console.log('✅ Database setup completed');
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();