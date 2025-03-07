module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define('user', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    firstName: {
      type: Sequelize.STRING,
      allowNull: false
    },
    lastName: {
      type: Sequelize.STRING,
      allowNull: false
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false
    },
    gender: {
      type: Sequelize.ENUM('male', 'female', 'other'),
      allowNull: false
    },
    loginOtp: {
      type: Sequelize.STRING,
      allowNull: true
    },
    otpExpiry: {
      type: Sequelize.DATE,
      allowNull: true
    },
    status: {
      type: Sequelize.INTEGER,
      defaultValue: 1, // 1: active, 0: inactive, 2: blocked
      allowNull: false
    },
    createdBy: {
      type: Sequelize.UUID,
      allowNull: true
    },
    updatedBy: {
      type: Sequelize.UUID,
      allowNull: true
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return User;
};
