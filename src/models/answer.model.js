module.exports = (sequelize, Sequelize) => {
  const Answer = sequelize.define('answer', {
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
    answerText: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    selectedOptionIds: {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: true
    },
    systemPrompt: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    status: {
      type: Sequelize.INTEGER,
      defaultValue: 1,
      allowNull: false
    },
    createdBy: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    updatedBy: {
      type: Sequelize.INTEGER,
      allowNull: true
    }
  }, {
    timestamps: true,
  });

  return Answer;
};
