module.exports = (sequelize, Sequelize) => {
  const Question = sequelize.define('question', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    titleId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'titles',
        key: 'id'
      }
    },
    groupId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'question_groups',
        key: 'id'
      }
    },
    questionText: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    questionType: {
      type: Sequelize.ENUM('text', 'radio', 'select', 'checkbox'),
      allowNull: false,
    },
    isRequired: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
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

  return Question;
};
