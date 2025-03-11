require('dotenv').config();

module.exports = {
  HOST: process.env.DB_HOST || 'localhost',
  USER: process.env.DB_USER || 'postgres',
  PASSWORD: process.env.DB_PASSWORD,
  DB: process.env.DB_NAME || 'agentic_ai',
  PORT: process.env.DB_PORT || 5432,
  dialect: 'postgres',
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};
