module.exports = (sequelize, Sequelize) => {
  const Role = sequelize.define('role', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
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

  return Role;
};
