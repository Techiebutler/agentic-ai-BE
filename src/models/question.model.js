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
      type: Sequelize.STRING,
      allowNull: false,
    },
    questionType: {
      type: Sequelize.ENUM('text', 'radio', 'select', 'checkbox', 'llm'),
      allowNull: false,
      defaultValue: 'text',
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
    sequenceNo: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    createdBy: {
      type: Sequelize.INTEGER,
      allowNull: false
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
