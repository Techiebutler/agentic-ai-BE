module.exports = (sequelize, Sequelize) => {
  const Token = sequelize.define('token', {
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
    token: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    type: {
      type: Sequelize.ENUM('refresh_token', 'forgot_password'),
      allowNull: false
    },
    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    }
  }, {
    timestamps: true,
  });

  return Token;
};
