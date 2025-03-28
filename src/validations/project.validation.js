const Joi = require('joi');

const createProjectSchema = Joi.object({
  name: Joi.string().required().trim()
    .messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 3 characters',
      'string.max': 'Name cannot exceed 100 characters'
    }),
  type: Joi.number().required().integer()
    .messages({
      'number.base': 'Type must be a number',
      'number.empty': 'Type is required',
      'number.min': 'Type must be greater than 0'
    }),
  description: Joi.string().optional().trim()
    .messages({
      'string.empty': 'Description is required',
      'string.min': 'Description must be at least 10 characters',
      'string.max': 'Description cannot exceed 1000 characters'
    }),
  companyInfo: Joi.object({
    name: Joi.string().optional().trim(),
    address: Joi.string().optional().trim(),
    contact: Joi.string().optional().trim()
  }).required()
    .messages({
      'object.base': 'Company info must be an object',
      'object.empty': 'Company info is required'
    })
});

const updateProjectSchema = Joi.object({
  name: Joi.string().trim()
    .messages({
      'string.min': 'Name must be at least 3 characters',
      'string.max': 'Name cannot exceed 100 characters'
    }),
  type: Joi.number().integer()
    .messages({
      'number.base': 'Type must be a number',
      'number.min': 'Type must be greater than 0'
    }),
  description: Joi.string().trim()
    .messages({
      'string.min': 'Description must be at least 10 characters',
      'string.max': 'Description cannot exceed 1000 characters'
    }),
  companyInfo: Joi.object({
    name: Joi.string().trim(),
    address: Joi.string().trim(),
    contact: Joi.string().trim()
  })
    .messages({
      'object.base': 'Company info must be an object'
    })
})
  .messages({
    'object.min': 'At least one field is required for update'
  });

module.exports = {
  createProjectSchema,
  updateProjectSchema
};
