module.exports = (sequelize, Sequelize) => {
  const Project = sequelize.define('project', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    type: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    companyInfo: {
      type: Sequelize.JSON,
      allowNull: true
    },
    status: {
      type: Sequelize.INTEGER,
      defaultValue: 1, // 1: active, 2: inactive, 3: soft deleted
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

  return Project;
};
