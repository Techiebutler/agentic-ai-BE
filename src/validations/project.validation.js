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
    name: Joi.string().optional().trim().allow("").allow(null),
    address: Joi.string().optional().trim().allow("").allow(null),
    contact: Joi.string().optional().trim().allow("").allow(null)
  }).optional()
    .messages({
      'object.base': 'Company info must be an object'
    })
});

const updateProjectSchema = Joi.object({
  name: Joi.string().trim().allow("").allow(null)
    .messages({
      'string.min': 'Name must be at least 3 characters',
      'string.max': 'Name cannot exceed 100 characters'
    }),
  type: Joi.number().integer().allow("").allow(null)
    .messages({
      'number.base': 'Type must be a number',
      'number.min': 'Type must be greater than 0'
    }),
  description: Joi.string().trim().allow("").allow(null)
    .messages({
      'string.min': 'Description must be at least 10 characters',
      'string.max': 'Description cannot exceed 1000 characters'
    }),
  companyInfo: Joi.object({
    name: Joi.string().optional().trim().allow("").allow(null),
    address: Joi.string().optional().trim().allow("").allow(null),
    contact: Joi.string().optional().trim().allow("").allow(null)
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
