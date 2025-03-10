module.exports = (sequelize, Sequelize) => {
  const QuestionGroup = sequelize.define('question_group', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    titleId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'titles',
        key: 'id'
      }
    },
    name: {
      type: Sequelize.STRING(255),
      allowNull: false
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

  return QuestionGroup;
};
