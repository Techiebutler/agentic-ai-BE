const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const db = require('../models');
const { registerSchema, loginSchema, verifyOtpSchema } = require('../validations/auth.validation');
const authService = require('../services/auth.service');
const path = require('path');
const ejs = require('ejs');

const User = db.users;
const Role = db.roles;

console.log("process.env.SMTP_HOST",process.env.SMTP_HOST);
console.log("process.env.SMTP_PORT",process.env.SMTP_PORT);
console.log("process.env.SMTP_USER",process.env.SMTP_USER);
console.log("process.env.SMTP_PASS",process.env.SMTP_PASS);

let transporter = nodemailer.createTransport({
  service: process.env.SMTP_HOST,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const register = async (req, res) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { firstName, lastName, email, password, gender, roleId } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultRole = await Role.findOne({ where: { name: 'user' } });

    const otp = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 60);

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      gender,
      roleId: roleId || defaultRole.id,
      status: 1,
      verificationOtp: otp,
      otpExpiry,
      createdBy: null
    });

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Email Verification',
      text: `Your email verification OTP is: ${otp}. This OTP will expire in 60 minutes.`
    });
    console.log("mail sent");

    res.status(201).json({
      message: 'User registered successfully. Please check your email for verification OTP.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email, password } = req.body;
    const user = await User.findOne({
      where: { email },
      include: [{
        model: Role,
        attributes: ['name']
      }]
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (user.status !== 1) {
      return res.status(403).json({ message: 'Account is inactive or blocked' });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({ message: 'Please verify your email before logging in' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const { accessToken, refreshToken } = await authService.generateTokens(user);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name
      }
    });
  } catch (error) {
    console.log("error",error);
    res.status(500).json({ message: error.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { error } = verifyOtpSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email, otp } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.verificationOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    await user.update({
      isEmailVerified: true,
      verificationOtp: null,
      otpExpiry: null
    });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const resendVerificationOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    const otp = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 60);

    await user.update({
      verificationOtp: otp,
      otpExpiry
    });

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: user.email,
      subject: 'Email Verification',
      text: `Your email verification OTP is: ${otp}. This OTP will expire in 60 minutes.`
    });

    res.json({ message: 'Verification OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const userData = await authService.verifyRefreshToken(token);
    const user = await User.findByPk(userData.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const accessToken = authService.generateAccessToken(user);
    res.json({ accessToken });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const token = await authService.generateForgotPasswordToken(user);
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    // Render the email template
    const emailHtml = await ejs.renderFile(
      path.join(__dirname, '../templates/reset-password.ejs'),
      { resetLink }
    );

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: user.email,
      subject: 'Reset Your Password',
      html: emailHtml
    });

    res.json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    console.log("token",token);
    
    const decoded = await authService.verifyForgotPasswordToken(token);
    const user = await User.findOne({
      where: { id: decoded.id },
      include: [{
        model: Role,
        attributes: ['name']
      }]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });
    console.log("Password reset successful");

    // Generate new tokens after password reset
    const { accessToken, refreshToken } = await authService.generateTokens(user);

    res.json({
      message: 'Password reset successful',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: user.role.name
      }
    });
  } catch (error) {
    console.log("error",error);
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerificationOtp,
  refreshToken,
  forgotPassword,
  resetPassword
};
