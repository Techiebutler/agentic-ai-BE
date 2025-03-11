module.exports = (sequelize, Sequelize) => {
  const LlmHistory = sequelize.define('llmHistory', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    questionId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'questions',
        key: 'id'
      }
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    projectId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id'
      }
    },
    llmAnswer: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    rejectionReason: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    createdBy: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    updatedBy: {
      type: Sequelize.INTEGER,
      allowNull: true
    }
  });

  return LlmHistory;
};
