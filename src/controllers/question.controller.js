const db = require('../models');
const {
  createTitleSchema,
  createQuestionGroupSchema,
  createQuestionSchema,
  updateTextSchema,
  deleteQuestionSchema,
  deleteOptionSchema,
  submitAnswerSchema,
  addOptionSchema,
  updateAnswerSchema
} = require('../validations/question.validation');
const { getPagination, getPagingData } = require('../utils/pagination');

// Admin Controllers
const createTitle = async (req, res) => {
  try {
    const userId = req.user.id;
    const { error, value } = createTitleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const title = await db.titles.create({
      ...value,
      createdBy: userId
    });

    res.status(201).json({
      message: 'Title created successfully',
      title
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createQuestionGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { error, value } = createQuestionGroupSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const title = await db.titles.findByPk(value.titleId);
    if (!title) {
      return res.status(404).json({ message: 'Title not found' });
    }

    const group = await db.questionGroups.create({
      ...value,
      createdBy: userId
    });

    res.status(201).json({
      message: 'Question group created successfully',
      group
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createQuestion = async (req, res) => {
  try {
    const userId = req.user.id;
    const { error, value } = createQuestionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Validate title or group exists
    if (value.titleId) {
      const title = await db.titles.findByPk(value.titleId);
      if (!title) {
        return res.status(404).json({ message: 'Title not found' });
      }
    } else {
      const group = await db.questionGroups.findByPk(value.groupId);
      if (!group) {
        return res.status(404).json({ message: 'Question group not found' });
      }
    }

    const question = await db.sequelize.transaction(async (t) => {
      // Create question
      const newQuestion = await db.questions.create({
        titleId: value.titleId,
        groupId: value.groupId,
        questionText: value.questionText,
        questionType: value.questionType,
        isRequired: value.isRequired,
        createdBy: userId
      }, { transaction: t });

      // Create options if provided
      if (value.options && value.options.length > 0) {
        const options = value.options.map(opt => ({
          ...opt,
          questionId: newQuestion.id,
          createdBy: userId
        }));
        console.log("options", options);
        await db.options.bulkCreate(options, { transaction: t });
      }

      return newQuestion;
    });

    // Fetch created question with options
    const questionWithOptions = await db.questions.findByPk(question.id, {
      include: [{
        model: db.options,
        attributes: ['id', 'optionText']
      }]
    });

    res.status(201).json({
      message: 'Question created successfully',
      question: questionWithOptions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getQuestionsByTitle = async (req, res) => {
  try {
    const { page, size } = req.query;
    const { limit, offset } = getPagination(page, size);

    const titleId = req.params.titleId;

    const title = await db.titles.findByPk(titleId);
    if (!title) {
      return res.status(404).json({ message: 'Title not found' });
    }

    const result = await db.sequelize.query(`
     SELECT 
    t.id AS titleId,
    t.name AS title_name,
    COALESCE(
        JSONB_AGG(
            JSONB_BUILD_OBJECT(
                'groupId', g.id,
                'group_name', g.name,
                'questions', (
                    SELECT COALESCE(
                        JSONB_AGG(
                            JSONB_BUILD_OBJECT(
                                'questionId', q.id,
                                'questionText', q."questionText",
                                'questionType', q."questionType",
                                'options', (
                                    SELECT COALESCE(
                                        JSONB_AGG(
                                            JSONB_BUILD_OBJECT(
                                                'option_id', o.id,
                                                'optionText', o."optionText"
                                            )
                                        ) FILTER (WHERE o.id IS NOT NULL), '[]'::JSONB
                                    )
                                    FROM options o
                                    WHERE o."questionId" = q.id
                                )
                            )
                        ) FILTER (WHERE q.id IS NOT NULL), '[]'::JSONB
                    )
                    FROM questions q
                    WHERE q."groupId" = g.id
                )
            )
        ) FILTER (WHERE g.id IS NOT NULL), '[]'::JSONB
    ) AS grouped_questions,
    COALESCE(
        JSONB_AGG(
            DISTINCT JSONB_BUILD_OBJECT( -- Ensure unique questions
                'questionId', q.id,
                'questionText', q."questionText",
                'questionType', q."questionType",
                'options', (
                    SELECT COALESCE(
                        JSONB_AGG(
                            JSONB_BUILD_OBJECT(
                                'option_id', o.id,
                                'optionText', o."optionText"
                            )
                        ) FILTER (WHERE o.id IS NOT NULL), '[]'::JSONB
                    )
                    FROM options o
                    WHERE o."questionId" = q.id
                )
            )
        ) FILTER (WHERE q.id IS NOT NULL), '[]'::JSONB
    ) AS ungrouped_questions
FROM titles t
LEFT JOIN question_groups g ON g."titleId" = t.id
LEFT JOIN questions q ON q."titleId" = t.id AND q."groupId" IS NULL
WHERE t.id = :titleId AND t.status = 1
GROUP BY t.id, t.name
LIMIT :limit OFFSET :offset;
    `, {
      replacements: { titleId, limit, offset },
      type: db.sequelize.QueryTypes.SELECT
    });

    const count = await db.questions.count({
      where: { titleId, status: 1 }
    });

    res.json({
      ...getPagingData(result, page, limit, count),
      title: {
        id: title.id,
        name: title.name,
        description: title.description
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const submitAnswer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { error, value } = submitAnswerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { questionId, answerText, selectedOptionIds } = value;

    // Validate question exists
    const question = await db.questions.findByPk(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Validate question type matches input type
    if (question.questionType === 'text' && !answerText) {
      return res.status(400).json({ message: 'Text answer required for text questions' });
    }
    if (['radio', 'select', 'checkbox'].includes(question.questionType) && !selectedOptionIds) {
      return res.status(400).json({ message: 'Option selection required for this question type' });
    }

    // For radio/select, ensure only one option is selected
    if (['radio'].includes(question.questionType) && selectedOptionIds.length !== 1) {
      return res.status(400).json({ message: 'Exactly one option must be selected for radio/select questions' });
    }

    // Validate selected options exist and belong to the question
    if (selectedOptionIds) {
      const validOptions = await db.options.count({
        where: {
          id: selectedOptionIds,
          questionId: questionId
        }
      });

      if (validOptions !== selectedOptionIds.length) {
        return res.status(400).json({ message: 'One or more selected options are invalid' });
      }
    }

    // Find or create answer
    const [answer, created] = await db.answers.findOrCreate({
      where: {
        questionId,
        userId
      },
      defaults: {
        answerText: question.questionType === 'text' ? answerText : null,
        selectedOptionIds: ['radio', 'select', 'checkbox'].includes(question.questionType) ? selectedOptionIds : null,
        createdBy: userId
      }
    });

    // Update if answer already exists
    if (!created) {
      await answer.update({
        answerText: question.questionType === 'text' ? answerText : null,
        selectedOptionIds: ['radio', 'select', 'checkbox'].includes(question.questionType) ? selectedOptionIds : null,
        updatedBy: userId
      });
    }

    return res.status(created ? 201 : 200).json({
      message: created ? 'Answer submitted successfully' : 'Answer updated successfully',
      answer
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getUserAnswers = async (req, res) => {
  try {
    const { page, size } = req.query;
    const { limit, offset } = getPagination(page, size);
    const userId = req.user.id;

    const rawQuery = `
    SELECT 
        t.id AS "titleId",
        t.name AS "titleName",
        COALESCE(
            JSONB_AGG(
                DISTINCT JSONB_BUILD_OBJECT(
                    'id', g.id,
                    'name', g.name,
                    'questions', (
                        SELECT JSONB_AGG(
                            DISTINCT JSONB_BUILD_OBJECT(
                                'questionId', q.id,
                                'questionText', q."questionText",
                                'questionType', q."questionType",
                                'answerId', a.id,
                                'answer', 
                                    CASE 
                                        WHEN q."questionType" = 'text' THEN 
                                            TO_JSONB(a."answerText")
                                        WHEN q."questionType" IN ('radio', 'select', 'checkbox') THEN 
                                            TO_JSONB(COALESCE(a."selectedOptionIds", '{}'::integer[]))
                                    END,
                                'options',
                                    CASE 
                                        WHEN q."questionType" IN ('radio', 'select', 'checkbox') THEN
                                            (SELECT JSONB_AGG(
                                                JSONB_BUILD_OBJECT(
                                                    'id', o.id,
                                                    'optionText', o."optionText",
                                                    'isSelected', o.id = ANY(COALESCE(a."selectedOptionIds", '{}'::integer[]))
                                                )
                                            )
                                            FROM options o
                                            WHERE o."questionId" = q.id)
                                        ELSE NULL
                                    END
                            )
                        )
                        FROM questions q
                        LEFT JOIN answers a ON a."questionId" = q.id AND a."userId" = :userId
                        WHERE q."groupId" = g.id
                    )
                )
            ) FILTER (WHERE g.id IS NOT NULL), '[]'::JSONB
        ) AS grouped_questions,
        COALESCE(
            JSONB_AGG(
                DISTINCT CASE 
                    WHEN q."groupId" IS NULL THEN 
                        JSONB_BUILD_OBJECT(
                            'questionId', q.id,
                            'questionText', q."questionText",
                            'questionType', q."questionType",
                            'answerId', a.id,
                            'answer',
                                CASE 
                                    WHEN q."questionType" = 'text' THEN 
                                        TO_JSONB(a."answerText")
                                    WHEN q."questionType" IN ('radio', 'select', 'checkbox') THEN 
                                        TO_JSONB(COALESCE(a."selectedOptionIds", '{}'::integer[]))
                                END,
                            'options',
                                CASE 
                                    WHEN q."questionType" IN ('radio', 'select', 'checkbox') THEN
                                        (SELECT JSONB_AGG(
                                            JSONB_BUILD_OBJECT(
                                                'id', o.id,
                                                'optionText', o."optionText",
                                                'isSelected', o.id = ANY(COALESCE(a."selectedOptionIds", '{}'::integer[]))
                                            )
                                        )
                                        FROM options o
                                        WHERE o."questionId" = q.id)
                                    ELSE NULL
                                END
                        )
                END
            ) FILTER (WHERE q."groupId" IS NULL), '[]'::JSONB
        ) AS ungrouped_questions
    FROM titles t
    LEFT JOIN question_groups g ON g."titleId" = t.id
    LEFT JOIN questions q ON q."titleId" = t.id
    LEFT JOIN answers a ON a."questionId" = q.id AND a."userId" = :userId
    WHERE t.id = :titleId AND t.status = 1
    GROUP BY t.id, t.name
    LIMIT :limit OFFSET :offset;
`;

    const result = await db.sequelize.query(rawQuery, {
      replacements: { userId, titleId: req.params.titleId, limit, offset },
      type: db.sequelize.QueryTypes.SELECT
    });

    return res.json({
      message: 'User answers retrieved successfully',
      data: result
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateText = async (req, res) => {
  try {
    const { error } = updateTextSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { type, id, text } = req.body;

    if (type === 'question') {
      const question = await db.questions.findByPk(id);
      if (!question) {
        return res.status(404).json({ message: 'Question not found' });
      }
      await question.update({ questionText: text });
      return res.status(200).json({ message: 'Question text updated successfully' });
    }

    if (type === 'option') {
      const option = await db.options.findByPk(id);
      if (!option) {
        return res.status(404).json({ message: 'Option not found' });
      }
      await option.update({ optionText: text });
      return res.status(200).json({ message: 'Option text updated successfully' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    const questionId = req.params?.questionId;
    if (!questionId) {
      return res.status(400).json({ message: 'Question ID is required' });
    }
    const question = await db.questions.findByPk(questionId);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Delete associated options first (will be handled by cascade delete)
    await db.options.destroy({
      where: { questionId }
    });

    // Delete the question
    await db.questions.destroy({
      where: { id: questionId }
    });

    return res.status(200).json({ message: 'Question and its options deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteOption = async (req, res) => {
  try {
    let optionId = req.params?.optionId;
    if (!optionId) {
      return res.status(400).json({ message: 'Option ID is required' });
    }

    const option = await db.options.findByPk(optionId);

    if (!option) {
      return res.status(404).json({ message: 'Option not found' });
    }

    // Check if this is the last option for a radio/select/checkbox question
    const question = await db.questions.findByPk(option.questionId);
    if (question && ['radio', 'select', 'checkbox'].includes(question.questionType)) {
      const optionCount = await db.options.count({
        where: { questionId: option.questionId }
      });

      if (optionCount <= 1) {
        return res.status(400).json({
          message: 'Cannot delete the last option of a radio/select/checkbox question'
        });
      }
    }

    await option.destroy();
    return res.status(200).json({ message: 'Option deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const addOption = async (req, res) => {
  try {
    const { error, value } = addOptionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { questionId, optionText } = value;

    // Check if question exists and is of correct type
    const question = await db.questions.findByPk(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    if (!['radio', 'select', 'checkbox'].includes(question.questionType)) {
      return res.status(400).json({
        message: 'Options can only be added to radio, select, or checkbox questions'
      });
    }

    // Create the option
    const option = await db.options.create({
      questionId,
      optionText
    });

    return res.status(201).json({
      message: 'Option added successfully',
      option
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAllTitles = async (req, res) => {
  try {
    const titles = await db.titles.findAll({
      attributes: ['id', 'name', 'description', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      message: 'Titles retrieved successfully',
      data: titles
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAllQuestions = async (req, res) => {
  try {
    var { page, limit } = req.query;
    var { limit, offset } = getPagination(page, limit);

    const questions = await db.questions.findAndCountAll({
      attributes: ['id', 'questionText', 'questionType'],
      include: [
        {
          model: db.titles,
          attributes: ['id', 'name'],
          required: true
        },
        {
          model: db.questionGroups,
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: db.options,
          attributes: ['id', 'optionText'],
          required: false
        }
      ],
      limit: limit,
      offset: offset
    });

    const result = getPagingData(
      questions.rows.map(question => ({
        questionId: question.id,
        questionText: question.questionText,
        questionType: question.questionType,
        title: {
          id: question.title.id,
          name: question.title.name
        },
        group: question.question_group ? {
          id: question.question_group.id,
          name: question.question_group.name
        } : null,
        options: question.options.map(option => ({
          id: option.id,
          optionText: option.optionText
        }))
      })),
      page,
      limit,
      questions.count
    );

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateAnswer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { error, value } = updateAnswerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { answerId, answerText, selectedOptionIds } = value;

    // Find the answer and check ownership
    const answer = await db.answers.findOne({
      where: { id: answerId },
      include: [{
        model: db.questions,
        attributes: ['id', 'questionType']
      }]
    });

    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    if (answer.userId !== userId) {
      return res.status(403).json({ message: 'You can only update your own answers' });
    }

    // Validate question type matches input type
    if (answer.question.questionType === 'text' && !answerText) {
      return res.status(400).json({ message: 'Text answer required for text questions' });
    }
    if (['radio', 'select', 'checkbox'].includes(answer.question.questionType) && !selectedOptionIds) {
      return res.status(400).json({ message: 'Option selection required for this question type' });
    }

    // For radio, ensure only one option is selected
    if (['radio'].includes(answer.question.questionType) && selectedOptionIds.length !== 1) {
      return res.status(400).json({ message: 'Exactly one option must be selected for radio questions' });
    }

    // Validate selected options exist and belong to the question
    if (selectedOptionIds) {
      const validOptions = await db.options.count({
        where: {
          id: selectedOptionIds,
          questionId: answer.questionId
        }
      });

      if (validOptions !== selectedOptionIds.length) {
        return res.status(400).json({ message: 'One or more selected options are invalid' });
      }
    }

    // Update the answer
    await answer.update({
      answerText: answer.question.questionType === 'text' ? answerText : null,
      selectedOptionIds: ['radio', 'select', 'checkbox'].includes(answer.question.questionType) ? selectedOptionIds : null,
      updatedBy: userId
    });

    return res.status(200).json({
      message: 'Answer updated successfully',
      answer: {
        id: answer.id,
        questionId: answer.questionId,
        answerText: answer.answerText,
        selectedOptionIds: answer.selectedOptionIds
      }
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTitle,
  createQuestionGroup,
  createQuestion,
  getQuestionsByTitle,
  submitAnswer,
  getUserAnswers,
  updateText,
  deleteQuestion,
  deleteOption,
  addOption,
  getAllTitles,
  getAllQuestions,
  updateAnswer
};
