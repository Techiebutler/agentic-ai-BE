const { Sequelize } = require('sequelize');
require('dotenv').config();

console.log("process.env.DB_NAME",process.env.DB_NAME);
console.log("process.env.DB_USER",process.env.DB_USER);
console.log("process.env.DB_PASSWORD",process.env.DB_PASSWORD);
console.log("process.env.DB_PORT",process.env.DB_PORT);

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    port: process.env.DB_PORT,
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
);

const db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.users = require('./user.model')(sequelize, Sequelize);
db.roles = require('./role.model')(sequelize, Sequelize);
db.tokens = require('./token.model')(sequelize, Sequelize);
db.projects = require('./project.model')(sequelize, Sequelize);

// Define relationships
db.roles.hasMany(db.users);
db.users.belongsTo(db.roles);

db.users.hasMany(db.tokens, { foreignKey: 'userId' });
db.tokens.belongsTo(db.users, { foreignKey: 'userId' });

db.users.hasMany(db.projects, { foreignKey: 'userId' });
db.projects.belongsTo(db.users, { foreignKey: 'userId' });

module.exports = db;
