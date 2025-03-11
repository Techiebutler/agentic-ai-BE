const db = require('../models');

const syncDatabase = async () => {
  try {
    // Sync all models with database
    await db.sequelize.sync({ alter: true });
    console.log('Database synchronized successfully.');

    // Check if roles exist before creating
    const adminRole = await db.roles.findOne({ where: { name: 'admin' } });
    const userRole = await db.roles.findOne({ where: { name: 'user' } });

    // Create roles only if they don't exist
    if (!adminRole) {
      await db.roles.create({ name: 'admin', status: 1 });
    }
    if (!userRole) {
      await db.roles.create({ name: 'user', status: 1 });
    }
    console.log('Default roles checked/created successfully.');

  } catch (error) {
    console.error('Error synchronizing database:', error);
    process.exit(1);
  }
};

syncDatabase();
