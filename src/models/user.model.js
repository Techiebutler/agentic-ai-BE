module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define('user', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
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
      unique: true
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
    isEmailVerified: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    verificationOtp: {
      type: Sequelize.STRING,
      allowNull: true
    },
    roleId: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    status: {
      type: Sequelize.INTEGER,
      defaultValue: 1, // 1: active, 0: inactive, 2: blocked
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
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return User;
};
