const jwt = require('jsonwebtoken');
const db = require('../models');
const Token = db.tokens;

const generateTokens = async (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    isEmailVerified: user.isEmailVerified,
    roleId: user.roleId
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '60m' });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

  // Store refresh token
  await Token.create({
    userId: user.id,
    token: refreshToken,
    type: 'refresh_token'
  });

  return { accessToken, refreshToken };
};

const verifyRefreshToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const token = await Token.findOne({ 
      where: { 
        userId: decoded.id, 
        token: refreshToken,
        type: 'refresh_token'
      } 
    });
    
    if (!token) {
      throw new Error('Invalid refresh token');
    }

    return decoded;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

const generateAccessToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    isEmailVerified: user.isEmailVerified,
    roleId: user.roleId
  };

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '60m' });
};

const generateForgotPasswordToken = async (user) => {
  const payload = {
    id: user.id,
    email: user.email
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '60m' });

  // Store forgot password token
  await Token.create({
    userId: user.id,
    token: token,
    type: 'forgot_password'
  });

  return token;
};

const verifyForgotPasswordToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const tokenRecord = await Token.findOne({ 
      where: { 
        userId: decoded.id, 
        token: token,
        type: 'forgot_password'
      } 
    });
    
    if (!tokenRecord) {
      throw new Error('Invalid or expired reset token');
    }

    // Delete the token after verification
    await tokenRecord.destroy();

    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired reset token');
  }
};

module.exports = {
  generateTokens,
  verifyRefreshToken,
  generateAccessToken,
  generateForgotPasswordToken,
  verifyForgotPasswordToken
};
