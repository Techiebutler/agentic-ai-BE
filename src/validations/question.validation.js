const Joi = require('joi');

const createTitleSchema = Joi.object({
  name: Joi.string().required().trim().min(3).max(255)
    .messages({
      'string.empty': 'Title name is required',
      'string.min': 'Title name must be at least 3 characters',
      'string.max': 'Title name cannot exceed 255 characters'
    }),
  description: Joi.string().optional().allow('').trim().max(1000)
    .messages({
      'string.max': 'Description cannot exceed 1000 characters'
    })
});

const createQuestionGroupSchema = Joi.object({
  titleId: Joi.number().required().integer().positive()
    .messages({
      'number.base': 'Title ID must be a number',
      'number.positive': 'Title ID must be positive'
    }),
  name: Joi.string().required().trim().min(3).max(255)
    .messages({
      'string.empty': 'Group name is required',
      'string.min': 'Group name must be at least 3 characters',
      'string.max': 'Group name cannot exceed 255 characters'
    })
});

const createQuestionSchema = Joi.object({
  titleId: Joi.number().integer().positive().allow(null)
    .messages({
      'number.base': 'Title ID must be a number',
      'number.positive': 'Title ID must be positive'
    }),
  groupId: Joi.number().integer().positive().allow(null)
    .messages({
      'number.base': 'Group ID must be a number',
      'number.positive': 'Group ID must be positive'
    }),
  questionText: Joi.string().required().trim().max(1000)
    .messages({
      'string.empty': 'Question text is required',
      'string.min': 'Question text must be at least 10 characters',
      'string.max': 'Question text cannot exceed 1000 characters'
    }),
  questionType: Joi.string().required().valid('text', 'radio', 'select', 'checkbox')
    .messages({
      'string.empty': 'Question type is required',
      'any.only': 'Question type must be one of: text, radio, select, checkbox'
    }),
  isRequired: Joi.boolean().default(false)
    .messages({
      'boolean.base': 'Is required must be a boolean'
    }),
  options: Joi.when('questionType', {
    is: Joi.string().valid('radio', 'select', 'checkbox'),
    then: Joi.array().min(1).items(
      Joi.object({
        optionText: Joi.string().required().trim().min(1).max(255)
          .messages({
            'string.empty': 'Option text is required',
            'string.min': 'Option text must be at least 1 character',
            'string.max': 'Option text cannot exceed 255 characters'
          })
      })
    ).required()
      .messages({
        'array.min': 'At least one option is required for this question type',
        'any.required': 'Options are required for this question type'
      }),
    otherwise: Joi.forbidden()
      .messages({
        'any.unknown': 'Options are not allowed for text questions'
      })
  })
});

const updateTextSchema = Joi.object({
  type: Joi.string().required().valid('question', 'option')
    .messages({
      'string.empty': 'Type is required',
      'any.only': 'Type must be one of: question, option'
    }),
  id: Joi.number().integer().required().min(1)
    .messages({
      'number.base': 'ID must be a number',
      'number.integer': 'ID must be an integer',
      'number.min': 'ID must be at least 1'
    }),
  text: Joi.string().required().trim().min(1).max(500)
    .messages({
      'string.empty': 'Text is required',
      'string.min': 'Text must be at least 1 character',
      'string.max': 'Text cannot exceed 500 characters'
    })
});

const deleteQuestionSchema = Joi.object({
  questionId: Joi.number().integer().required().min(1)
    .messages({
      'number.base': 'Question ID must be a number',
      'number.integer': 'Question ID must be an integer',
      'number.min': 'Question ID must be at least 1'
    })
});

const deleteOptionSchema = Joi.object({
  optionId: Joi.number().integer().required().min(1)
    .messages({
      'number.base': 'Option ID must be a number',
      'number.integer': 'Option ID must be an integer',
      'number.min': 'Option ID must be at least 1'
    })
});

const submitAnswerSchema = Joi.object({
  questionId: Joi.number().integer().required().min(1)
    .messages({
      'number.base': 'Question ID must be a number',
      'number.integer': 'Question ID must be an integer',
      'number.min': 'Question ID must be at least 1'
    }),
  answerText: Joi.string().trim().min(1).max(500)
    .messages({
      'string.empty': 'Answer text is required',
      'string.min': 'Answer text must be at least 1 character',
      'string.max': 'Answer text cannot exceed 500 characters'
    }),
  selectedOptionIds: Joi.array().items(Joi.number().integer().min(1))
    .messages({
      'array.base': 'Selected options must be an array',
      'number.base': 'Option ID must be a number',
      'number.integer': 'Option ID must be an integer',
      'number.min': 'Option ID must be at least 1'
    })
}).custom((value, helpers) => {
  if (!value.answerText && !value.selectedOptionIds) {
    return helpers.error('object.missing', {
      message: 'Either answerText or selectedOptionIds must be provided'
    });
  }
  if (value.answerText && value.selectedOptionIds) {
    return helpers.error('object.xor', {
      message: 'Cannot provide both answerText and selectedOptionIds'
    });
  }
  return value;
});

const addOptionSchema = Joi.object({
  questionId: Joi.number().integer().required().min(1)
    .messages({
      'number.base': 'Question ID must be a number',
      'number.integer': 'Question ID must be an integer',
      'number.min': 'Question ID must be at least 1'
    }),
  optionText: Joi.string().required().trim().min(1).max(100)
    .messages({
      'string.empty': 'Option text is required',
      'string.min': 'Option text must be at least 1 character',
      'string.max': 'Option text cannot exceed 100 characters'
    })
});

const updateAnswerSchema = Joi.object({
  answerId: Joi.number().integer().required().min(1)
    .messages({
      'number.base': 'Answer ID must be a number',
      'number.integer': 'Answer ID must be an integer',
      'number.min': 'Answer ID must be at least 1'
    }),
  answerText: Joi.string().trim().min(1).max(500)
    .messages({
      'string.empty': 'Answer text is required',
      'string.min': 'Answer text must be at least 1 character',
      'string.max': 'Answer text cannot exceed 500 characters'
    }),
  selectedOptionIds: Joi.array().items(Joi.number().integer().min(1))
    .messages({
      'array.base': 'Selected options must be an array',
      'number.base': 'Option ID must be a number',
      'number.integer': 'Option ID must be an integer',
      'number.min': 'Option ID must be at least 1'
    })
}).custom((value, helpers) => {
  if (!value.answerText && !value.selectedOptionIds) {
    return helpers.error('object.missing', {
      message: 'Either answerText or selectedOptionIds must be provided'
    });
  }
  if (value.answerText && value.selectedOptionIds) {
    return helpers.error('object.xor', {
      message: 'Cannot provide both answerText and selectedOptionIds'
    });
  }
  return value;
});

module.exports = {
  createTitleSchema,
  createQuestionGroupSchema,
  createQuestionSchema,
  updateTextSchema,
  deleteQuestionSchema,
  deleteOptionSchema,
  submitAnswerSchema,
  addOptionSchema,
  updateAnswerSchema
};
