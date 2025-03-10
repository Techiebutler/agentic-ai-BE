const db = require('../models');
const {
  createTitleSchema,
  createQuestionGroupSchema,
  createQuestionSchema,
  updateTextSchema,
  deleteQuestionSchema,
  deleteOptionSchema,
  submitAnswerSchema,
  addOptionSchema
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
      console.log("titleId", value.titleId);

      const title = await db.titles.findByPk(value.titleId);
      if (!title) {
        return res.status(404).json({ message: 'Title not found' });
      }
    } else {
      console.log("group", value.group);
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
                                'question_id', q.id,
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
                'question_id', q.id,
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
    const { error, value } = submitAnswerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const question = await db.questions.findByPk(value.questionId, {
      include: [{
        model: db.options,
        attributes: ['id']
      }]
    });

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Validate selected options belong to the question
    if (value.selectedOptionIds) {
      const validOptionIds = question.options.map(opt => opt.id);
      const invalidOptions = value.selectedOptionIds.filter(id => !validOptionIds.includes(id));
      if (invalidOptions.length > 0) {
        return res.status(400).json({ message: 'Invalid option ids provided' });
      }
    }

    // Create or update answer
    const [answer, created] = await db.answers.findOrCreate({
      where: {
        questionId: value.questionId,
        userId: req.userId
      },
      defaults: {
        answerText: value.answerText,
        selectedOptionIds: value.selectedOptionIds,
        createdBy: req.userId
      }
    });

    if (!created) {
      await answer.update({
        answerText: value.answerText,
        selectedOptionIds: value.selectedOptionIds,
        updatedBy: req.userId
      });
    }

    res.json({
      message: created ? 'Answer submitted successfully' : 'Answer updated successfully',
      answer
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserAnswers = async (req, res) => {
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
          JSON_AGG(
            CASE 
              WHEN g.id IS NOT NULL THEN 
                JSON_BUILD_OBJECT(
                  'groupId', g.id,
                  'group_name', g.name,
                  'questions', (
                    SELECT JSON_AGG(
                      JSON_BUILD_OBJECT(
                        'question_id', q.id,
                        'questionText', q."questionText",
                        'questionType', q.questionType,
                        'answer', 
                          CASE 
                            WHEN q.questionType IN ('select', 'checkbox') THEN COALESCE(a.answer_value, '{}'::TEXT[])
                            ELSE COALESCE(a.answer_value[1], '')
                          END
                      )
                    )
                    FROM questions q
                    LEFT JOIN answers a ON a.question_id = q.id AND a.user_id = :userId
                    WHERE q.groupId = g.id
                  )
                )
              ELSE NULL
            END
          ) FILTER (WHERE g.id IS NOT NULL), '[]'
        ) AS grouped_questions,
        COALESCE(
          JSON_AGG(
            CASE 
              WHEN q.groupId IS NULL THEN 
                JSON_BUILD_OBJECT(
                  'question_id', q.id,
                  'questionText', q."questionText",
                  'questionType', q.questionType,
                  'answer', 
                    CASE 
                      WHEN q.questionType IN ('select', 'checkbox') THEN COALESCE(a.answer_value, '{}'::TEXT[])
                      ELSE COALESCE(a.answer_value[1], '')
                    END
                )
              ELSE NULL
            END
          ) FILTER (WHERE q.groupId IS NULL), '[]'
        ) AS ungrouped_questions
      FROM titles t
      LEFT JOIN question_groups g ON g.titleId = t.id
      LEFT JOIN questions q ON q.titleId = t.id OR q.groupId = g.id
      LEFT JOIN answers a ON a.question_id = q.id AND a.user_id = :userId
      WHERE t.id = :titleId AND t.status = 1
      GROUP BY t.id, t.name
      LIMIT :limit OFFSET :offset
    `, {
      replacements: { titleId, userId: req.userId, limit, offset },
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
    res.status(500).json({ message: error.message });
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
        question_id: question.id,
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
  getAllQuestions
};
