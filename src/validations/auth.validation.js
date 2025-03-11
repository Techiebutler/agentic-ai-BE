const Joi = require('joi');

const registerSchema = Joi.object({
  firstName: Joi.string().required().min(2).max(50),
  lastName: Joi.string().required().min(2).max(50),
  email: Joi.string().email().required(),
  password: Joi.string().required().min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'))
    .message('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  gender: Joi.string().valid('male', 'female', 'other').required(),
  roleId: Joi.number().optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().required().length(6)
});

module.exports = {
  registerSchema,
  loginSchema,
  verifyOtpSchema
};
