const db = require('../models');

async function syncDatabase() {
  try {
    // Force true will drop the table if it already exists
    // Set to false in production
    await db.sequelize.sync({ force: true });
    console.log('Database synchronized successfully.');

    // Create default roles
    const roles = await db.roles.bulkCreate([
      { name: 'admin' },
      { name: 'user' }
    ]);
    console.log('Default roles created successfully.');

    process.exit(0);
  } catch (error) {
    console.error('Error synchronizing database:', error);
    process.exit(1);
  }
}

syncDatabase();
