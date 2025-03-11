const Joi = require('joi');

const createProjectSchema = Joi.object({
  name: Joi.string().required().trim().min(3).max(100)
    .messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 3 characters',
      'string.max': 'Name cannot exceed 100 characters'
    }),
  type: Joi.number().required().integer().min(1)
    .messages({
      'number.base': 'Type must be a number',
      'number.empty': 'Type is required',
      'number.min': 'Type must be greater than 0'
    }),
  description: Joi.string().required().trim().min(10).max(1000)
    .messages({
      'string.empty': 'Description is required',
      'string.min': 'Description must be at least 10 characters',
      'string.max': 'Description cannot exceed 1000 characters'
    }),
  companyInfo: Joi.object({
    name: Joi.string().required().trim().min(3).max(100),
    address: Joi.string().required().trim().min(10).max(500),
    contact: Joi.string().required().trim().min(10).max(15)
  }).required()
    .messages({
      'object.base': 'Company info must be an object',
      'object.empty': 'Company info is required'
    })
});

const updateProjectSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100)
    .messages({
      'string.min': 'Name must be at least 3 characters',
      'string.max': 'Name cannot exceed 100 characters'
    }),
  type: Joi.number().integer().min(1)
    .messages({
      'number.base': 'Type must be a number',
      'number.min': 'Type must be greater than 0'
    }),
  description: Joi.string().trim().min(10).max(1000)
    .messages({
      'string.min': 'Description must be at least 10 characters',
      'string.max': 'Description cannot exceed 1000 characters'
    }),
  companyInfo: Joi.object({
    name: Joi.string().trim().min(3).max(100),
    address: Joi.string().trim().min(10).max(500),
    contact: Joi.string().trim().min(10).max(15)
  })
    .messages({
      'object.base': 'Company info must be an object'
    })
}).min(1)
  .messages({
    'object.min': 'At least one field is required for update'
  });

module.exports = {
  createProjectSchema,
  updateProjectSchema
};
