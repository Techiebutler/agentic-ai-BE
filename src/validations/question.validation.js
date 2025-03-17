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
  questionText: Joi.string().required().trim().min(1).max(500)
    .messages({
      'string.empty': 'Question text is required',
      'string.min': 'Question text must be at least 1 character',
      'string.max': 'Question text cannot exceed 500 characters'
    }),
  questionType: Joi.string().required().valid('text', 'radio', 'select', 'checkbox', 'llm')
    .messages({
      'string.empty': 'Question type is required',
      'any.only': 'Question type must be one of: text, radio, select, checkbox, llm'
    }),
  titleId: Joi.number().integer().min(1)
    .messages({
      'number.base': 'Title ID must be a number',
      'number.integer': 'Title ID must be an integer',
      'number.min': 'Title ID must be at least 1'
    }),
  groupId: Joi.number().integer().min(1)
    .messages({
      'number.base': 'Group ID must be a number',
      'number.integer': 'Group ID must be an integer',
      'number.min': 'Group ID must be at least 1'
    }).allow(null).allow(""),
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
        'any.unknown': 'Options are not allowed for text or llm questions'
      })
  })
})

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
  projectId: Joi.number().integer().required().min(1)
    .messages({
      'number.base': 'Project ID must be a number',
      'number.integer': 'Project ID must be an integer',
      'number.min': 'Project ID must be at least 1',
      'any.required': 'Project ID is required'
    }),
  answerText: Joi.string().trim().min(1).max(5000)
    .messages({
      'string.empty': 'Answer text cannot be empty',
      'string.min': 'Answer text must be at least 1 character',
      'string.max': 'Answer text cannot exceed 5000 characters'
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
  projectId: Joi.number().integer().required().min(1)
    .messages({
      'number.base': 'Project ID must be a number',
      'number.integer': 'Project ID must be an integer',
      'number.min': 'Project ID must be at least 1',
      'any.required': 'Project ID is required'
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

const getProjectAnswersSchema = Joi.object({
  projectId: Joi.number().integer().required().min(1)
    .messages({
      'number.base': 'Project ID must be a number',
      'number.integer': 'Project ID must be an integer',
      'number.min': 'Project ID must be at least 1',
      'any.required': 'Project ID is required'
    }),
  titleId: Joi.number().integer().positive().allow(null)
    .messages({
      'number.base': 'Title ID must be a number',
      'number.positive': 'Title ID must be positive'
    })
});

const getLlmHistorySchema = Joi.object({
  projectId: Joi.number().integer().required().min(1)
    .messages({
      'number.base': 'Project ID must be a number',
      'number.integer': 'Project ID must be an integer',
      'number.min': 'Project ID must be at least 1',
      'any.required': 'Project ID is required'
    }),
  questionId: Joi.number().integer().required().min(1)
    .messages({
      'number.base': 'Question ID must be a number',
      'number.integer': 'Question ID must be an integer',
      'number.min': 'Question ID must be at least 1',
      'any.required': 'Question ID is required'
    })
}).unknown(true);

const saveLlmHistorySchema = Joi.object({
  questionId: Joi.number().integer().required().min(1)
    .messages({
      'number.base': 'Question ID must be a number',
      'number.integer': 'Question ID must be an integer',
      'number.min': 'Question ID must be at least 1'
    }),
  projectId: Joi.number().integer().required().min(1)
    .messages({
      'number.base': 'Project ID must be a number',
      'number.integer': 'Project ID must be an integer',
      'number.min': 'Project ID must be at least 1'
    }),
  llmAnswer: Joi.string().required().trim().min(1).max(5000)
    .messages({
      'string.empty': 'LLM answer is required',
      'string.min': 'LLM answer must be at least 1 character',
      'string.max': 'LLM answer cannot exceed 5000 characters'
    }),
  rejectionReason: Joi.string().required().trim().min(1).max(500)
    .messages({
      'string.empty': 'Rejection reason is required',
      'string.min': 'Rejection reason must be at least 1 character',
      'string.max': 'Rejection reason cannot exceed 500 characters'
    })
});

const getQuestionGroupsSchema = Joi.object({
  titleId: Joi.number().required().integer().min(1)
    .messages({
      'number.base': 'Title ID must be a number',
      'number.integer': 'Title ID must be an integer',
      'number.min': 'Title ID must be at least 1',
      'any.required': 'Title ID is required'
    })
});

const updateQuestionSchema = Joi.object({
  questionText: Joi.string().min(3).optional(),
  questionType: Joi.string().valid('text', 'radio', 'select', 'checkbox', 'llm').optional(),
  isRequired: Joi.boolean().optional()
}).min(1);

const updateTitleSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  description: Joi.string().min(10).max(500).optional()
}).min(1);

const deleteTitleSchema = Joi.object({
  id: Joi.number().integer().positive().required()
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
  updateAnswerSchema,
  getProjectAnswersSchema,
  getLlmHistorySchema,
  saveLlmHistorySchema,
  getQuestionGroupsSchema,
  updateQuestionSchema,
  updateTitleSchema,
  deleteTitleSchema
};
