const Sequelize = require('sequelize');
require('dotenv').config();

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

// Import models
db.users = require('./user.model')(sequelize, Sequelize);
db.roles = require('./role.model')(sequelize, Sequelize);
db.tokens = require('./token.model')(sequelize, Sequelize);
db.projects = require('./project.model')(sequelize, Sequelize);
db.titles = require('./title.model')(sequelize, Sequelize);
db.questionGroups = require('./question-group.model')(sequelize, Sequelize);
db.questions = require('./question.model')(sequelize, Sequelize);
db.options = require('./option.model')(sequelize, Sequelize);
db.answers = require('./answer.model')(sequelize, Sequelize);
db.llmHistories = require('./llmHistory.model')(sequelize, Sequelize);

// Define relationships
// User-Role relationship
db.users.belongsTo(db.roles, {
  foreignKey: 'roleId'
});
db.roles.hasMany(db.users, {
  foreignKey: 'roleId'
});

// User-Token relationship
db.users.hasMany(db.tokens, {
  foreignKey: 'userId'
});
db.tokens.belongsTo(db.users, {
  foreignKey: 'userId'
});

// User-Project relationship
db.users.hasMany(db.projects, {
  foreignKey: 'userId'
});
db.projects.belongsTo(db.users, {
  foreignKey: 'userId'
});

// Question-Answer Module Relationships

// Title-QuestionGroup relationship
db.titles.hasMany(db.questionGroups, {
  foreignKey: 'titleId'
});
db.questionGroups.belongsTo(db.titles, {
  foreignKey: 'titleId'
});

// Title-Question relationship (for ungrouped questions)
db.titles.hasMany(db.questions, {
  foreignKey: 'titleId'
});
db.questions.belongsTo(db.titles, {
  foreignKey: 'titleId'
});

// QuestionGroup-Question relationship
db.questionGroups.hasMany(db.questions, {
  foreignKey: 'groupId'
});
db.questions.belongsTo(db.questionGroups, {
  foreignKey: 'groupId'
});

// Question-Option relationship
db.questions.hasMany(db.options, {
  foreignKey: 'questionId'
});
db.options.belongsTo(db.questions, {
  foreignKey: 'questionId'
});

// Question-Answer relationship
db.questions.hasMany(db.answers, {
  foreignKey: 'questionId'
});
db.answers.belongsTo(db.questions, {
  foreignKey: 'questionId'
});
db.projects.hasMany(db.answers, {
  foreignKey: 'projectId'
});
db.answers.belongsTo(db.projects, {
  foreignKey: 'projectId'
});

// User-Answer relationship
db.users.hasMany(db.answers, {
  foreignKey: 'userId'
});
db.answers.belongsTo(db.users, {
  foreignKey: 'userId'
});

// LLM History relationships
db.users.hasMany(db.llmHistories, {
  foreignKey: 'userId'
});
db.llmHistories.belongsTo(db.users, {
  foreignKey: 'userId'
});

db.questions.hasMany(db.llmHistories, {
  foreignKey: 'questionId'
});
db.llmHistories.belongsTo(db.questions, {
  foreignKey: 'questionId'
});

db.projects.hasMany(db.llmHistories, {
  foreignKey: 'projectId'
});
db.llmHistories.belongsTo(db.projects, {
  foreignKey: 'projectId'
});

module.exports = db;
