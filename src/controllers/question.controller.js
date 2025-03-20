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
  updateAnswerSchema,
  getProjectAnswersSchema,
  getLlmHistorySchema,
  saveLlmHistorySchema,
  getQuestionGroupsSchema,
  updateQuestionSchema,
  updateTitleSchema,
  updateQuestionGroupSchema,
  deleteQuestionGroupSchema,
  getQuestionDetailsSchema
} = require('../validations/question.validation');
const { getPagination, getPagingData } = require('../utils/pagination');
const { Op } = require('sequelize');
const { DATABASE_STATUS_TYPE } = require('../constants/database.constants');

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

      // Create options if provided for radio, select, checkbox types
      if (value.options && ['radio', 'select', 'checkbox'].includes(value.questionType)) {
        const options = value.options.map(opt => ({
          ...opt,
          questionId: newQuestion.id,
          createdBy: userId
        }));
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
    const titleId = req.params.titleId;

    const title = await db.titles.findByPk(titleId);
    if (!title) {
      return res.status(404).json({ message: 'Title not found' });
    }

    const result = await db.sequelize.query(`
      WITH ordered_questions AS (
          SELECT 
              q.* 
          FROM questions q
          ORDER BY q."createdAt" ASC  -- Global ordering applied here
      )
      SELECT 
          t.id AS titleId,
          t.name AS title_name,
          COALESCE(
              JSONB_AGG(
                  DISTINCT JSONB_BUILD_OBJECT(  
                      'groupId', g.id,
                      'group_name', g.name,
                      'questions', (
                          SELECT COALESCE(
                              JSONB_AGG(
                                  JSONB_BUILD_OBJECT(
                                      'questionId', oq.id,
                                      'questionText', oq."questionText",
                                      'questionType', oq."questionType",
                                      'isRequired', oq."isRequired",
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
                                          WHERE o."questionId" = oq.id
                                      )
                                  )
                              ) FILTER (WHERE oq.id IS NOT NULL), '[]'::JSONB
                          )
                          FROM ordered_questions oq
                          WHERE oq."groupId" = g.id
                      )
                  )
              ) FILTER (WHERE g.id IS NOT NULL), '[]'::JSONB
          ) AS grouped_questions,
          COALESCE(
              JSONB_AGG(
                  DISTINCT JSONB_BUILD_OBJECT(
                      'questionId', uq.id,
                      'questionText', uq."questionText",
                      'questionType', uq."questionType",
                      'isRequired', uq."isRequired",
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
                          WHERE o."questionId" = uq.id
                      )
                  )
              ) FILTER (WHERE uq.id IS NOT NULL), '[]'::JSONB
          ) AS ungrouped_questions
      FROM titles t
      LEFT JOIN question_groups g ON g."titleId" = t.id
      LEFT JOIN ordered_questions uq ON uq."titleId" = t.id AND uq."groupId" IS NULL  
      WHERE t.id = :titleId AND t.status = 1
      GROUP BY t.id, t.name
  `, {
      replacements: { titleId },
      type: db.sequelize.QueryTypes.SELECT
  });
  
  

    res.json({
      result,
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
    console.log("value", value);

    const { questionId, projectId, answerText, selectedOptionIds } = value;

    // Validate project exists and user has access
    const project = await db.projects.findOne({
      where: { id: projectId, status: 1 }
    });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has access to this project
    const userProject = await db.projects.findOne({
      where: { userId, id: projectId }
    });
    if (!userProject) {
      return res.status(403).json({ message: 'Access denied to this project' });
    }

    // Find the question
    const question = await db.questions.findByPk(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Validate question type matches input type
    if ((question.questionType === 'text' || question.questionType === 'llm') && !answerText) {
      return res.status(400).json({ message: 'Text answer required for text questions' });
    }
    if (['radio', 'select', 'checkbox'].includes(question.questionType) && !selectedOptionIds) {
      return res.status(400).json({ message: 'Option selection required for this question type' });
    }

    // For radio questions, ensure only one option is selected
    if (['radio'].includes(question.questionType) && selectedOptionIds.length !== 1) {
      return res.status(400).json({ message: 'Exactly one option must be selected for radio questions' });
    }

    // Validate selected options exist and belong to the question
    if (selectedOptionIds) {
      const validOptions = await db.options.count({
        where: {
          id: selectedOptionIds,
          questionId
        }
      });

      if (validOptions !== selectedOptionIds.length) {
        return res.status(400).json({ message: 'One or more selected options are invalid' });
      }
    }

    // Check if answer already exists for this user and question
    let answer = await db.answers.findOne({
      where: { userId, questionId, projectId }
    });

    if (answer) {
      // Update existing answer
      answer = await answer.update({
        answerText: (question.questionType === 'text' || question.questionType === 'llm') ? answerText : null,
        selectedOptionIds: ['radio', 'select', 'checkbox'].includes(question.questionType) ? selectedOptionIds : null,
        updatedBy: userId
      });

      return res.status(200).json({
        message: 'Answer updated successfully',
        answer: {
          id: answer.id,
          questionId: answer.questionId,
          projectId: answer.projectId,
          answerText: answer.answerText,
          selectedOptionIds: answer.selectedOptionIds
        }
      });
    }

    // Create new answer
    answer = await db.answers.create({
      userId,
      questionId,
      projectId,
      answerText: (question.questionType === 'text' || question.questionType === 'llm') ? answerText : null,
      selectedOptionIds: ['radio', 'select', 'checkbox'].includes(question.questionType) ? selectedOptionIds : null,
      createdBy: userId,
      updatedBy: userId
    });

    return res.status(201).json({
      message: 'Answer submitted successfully',
      answer: {
        id: answer.id,
        questionId: answer.questionId,
        projectId: answer.projectId,
        answerText: answer.answerText,
        selectedOptionIds: answer.selectedOptionIds
      }
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getUserAnswers = async (req, res) => {
  try {
    var { page, limit } = req.query;
    var { limit, offset } = getPagination(page, limit);
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
      order: [['createdAt', 'ASC']]
    });

    return res.status(200).json({
      message: 'Titles retrieved successfully',
      data: titles
    });
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

    const { answerId, projectId, answerText, selectedOptionIds } = value;

    // Validate project exists and user has access
    const project = await db.projects.findOne({
      where: { id: projectId, status: 1 }
    });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has access to this project
    const userProject = await db.projects.findOne({
      where: { userId, id: projectId }
    });
    if (!userProject) {
      return res.status(403).json({ message: 'Access denied to this project' });
    }

    // Find the answer and check ownership
    const answer = await db.answers.findOne({
      where: { id: answerId, projectId },
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
    if ((answer.question.questionType === 'text' || answer.question.questionType === 'llm') && !answerText) {
      return res.status(400).json({ message: 'Text answer required for text questions' });
    }
    if (['radio', 'select', 'checkbox'].includes(answer.question.questionType) && !selectedOptionIds) {
      return res.status(400).json({ message: 'Option selection required for this question type' });
    }

    // For radio questions, ensure only one option is selected
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
      answerText: (answer.question.questionType === 'text' || answer.question.questionType === 'llm') ? answerText : null,
      selectedOptionIds: ['radio', 'select', 'checkbox'].includes(answer.question.questionType) ? selectedOptionIds : null,
      updatedBy: userId
    });

    return res.status(200).json({
      message: 'Answer updated successfully',
      answer: {
        id: answer.id,
        questionId: answer.questionId,
        projectId: answer.projectId,
        answerText: answer.answerText,
        selectedOptionIds: answer.selectedOptionIds
      }
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getProjectAnswers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { error, value } = getProjectAnswersSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    let titleId = Number(value.titleId)
    let projectId = Number(value.projectId)


    // Validate project exists and user has access
    const project = await db.projects.findOne({
      where: { id: projectId, status: 1 }
    });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has access to this project
    const userProject = await db.projects.findOne({
      where: { userId, id: projectId }
    });
    if (!userProject) {
      return res.status(403).json({ message: 'Access denied to this project' });
    }

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
                                        WHEN q."questionType" IN ('text', 'llm') THEN 
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
                        LEFT JOIN answers a ON a."questionId" = q.id AND a."userId" = :userId AND a."projectId" = :projectId
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
                                    WHEN q."questionType" IN ('text', 'llm') THEN 
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
    LEFT JOIN answers a ON a."questionId" = q.id AND a."userId" = :userId AND a."projectId" = :projectId
    WHERE t.id = :titleId AND t.status = 1
    GROUP BY t.id, t.name
    `;

    const result = await db.sequelize.query(rawQuery, {
      replacements: { userId, projectId, titleId },
      type: db.sequelize.QueryTypes.SELECT
    });

    return res.status(200).json({
      message: 'Project answers retrieved successfully',
      result
    });

  } catch (error) {
    console.log("e", error);
    return res.status(500).json({ message: error.message });
  }
};

const getLlmHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { error, value } = getLlmHistorySchema.validate(req.query);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { projectId, questionId } = value;
    var { page, limit } = req.query;
    var { limit, offset } = getPagination(page, limit);

    // Validate project exists and user has access
    const project = await db.projects.findOne({
      where: { id: projectId, status: 1 }
    });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has access to this project
    const userProject = await db.projects.findOne({
      where: { userId, id: projectId }
    });
    if (!userProject) {
      return res.status(403).json({ message: 'Access denied to this project' });
    }

    // Get LLM history with pagination
    const history = await db.llmHistories.findAndCountAll({
      where: {
        userId,
        projectId,
        questionId
      },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      include: [{
        model: db.questions,
        attributes: ['questionText', 'questionType']
      }]
    });

    const data = getPagingData(history.rows, page, limit, history.count);

    return res.status(200).json({
      message: 'LLM history retrieved successfully',
      data
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const saveLlmHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { error, value } = saveLlmHistorySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { questionId, projectId, llmAnswer, rejectionReason } = value;

    // Validate project exists and user has access
    const project = await db.projects.findOne({
      where: { id: projectId, status: 1 }
    });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has access to this project
    const userProject = await db.projects.findOne({
      where: { userId, id: projectId }
    });
    if (!userProject) {
      return res.status(403).json({ message: 'Access denied to this project' });
    }

    // Validate question exists and is LLM type
    const question = await db.questions.findOne({
      where: { id: questionId }
    });
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    if (question.questionType !== 'llm') {
      return res.status(400).json({ message: 'This operation is only valid for LLM type questions' });
    }

    // Save to LLM history
    const history = await db.llmHistories.create({
      userId,
      projectId,
      questionId,
      llmAnswer,
      rejectionReason,
      createdBy: userId
    });

    return res.status(201).json({
      message: 'LLM history saved successfully',
      history
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAllQuestionGroups = async (req, res) => {
  try {
    const { error, value } = getQuestionGroupsSchema.validate(req.params);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { titleId } = value;

    // Validate title exists
    const title = await db.titles.findByPk(titleId);
    if (!title) {
      return res.status(404).json({ message: 'Title not found' });
    }

    const groups = await db.questionGroups.findAll({
      where: { titleId, status: 1 },  // Only get active groups
      attributes: ['id', 'name', 'titleId', 'createdAt'],
      include: [{
        model: db.titles,
        attributes: ['name'],
        as: 'title',
        where: { status: 1 }  // Only include active titles
      }],
      order: [['createdAt', 'ASC']]
    });

    return res.status(200).json({
      message: 'Question groups retrieved successfully',
      data: groups
    });
  } catch (error) {
    console.error('Error getting question groups:', error);
    return res.status(500).json({ message: 'Error retrieving question groups' });
  }
};

const updateQuestion = async (req, res) => {
  try {
    const userId = req.user.id;
    const questionId = parseInt(req.params.questionId);

    const { error, value } = updateQuestionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const question = await db.questions.findByPk(questionId, {
      include: [{
        model: db.options,
        attributes: ['id', 'optionText']
      }]
    });

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Update the question
    await question.update({
      ...value,
      updatedBy: userId
    });

    // If changing to text/llm type, remove any existing options
    if (['text', 'llm'].includes(value.questionType)) {
      await db.options.destroy({
        where: { questionId }
      });
    }

    // Fetch updated question with options
    const updatedQuestion = await db.questions.findByPk(questionId, {
      include: [{
        model: db.options,
        attributes: ['id', 'optionText']
      }]
    });

    res.json({
      message: 'Question updated successfully',
      data: updatedQuestion
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTitle = async (req, res) => {
  try {
    const userId = req.user.id;
    const titleId = parseInt(req.params.titleId);

    const { error, value } = updateTitleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const title = await db.titles.findByPk(titleId);
    if (!title) {
      return res.status(404).json({ message: 'Title not found' });
    }

    await title.update({
      ...value,
      updatedBy: userId
    });

    res.json({
      message: 'Title updated successfully',
      data: title
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteTitle = async (req, res) => {
  try {
    const titleId = parseInt(req.params.titleId);

    if (!titleId) {
      return res.status(400).json({ message: 'Title ID is required!' })
    }

    const title = await db.titles.findByPk(titleId);
    if (!title) {
      return res.status(404).json({ message: 'Title not found' });
    }

    // Check if title has any associated questions or groups
    const [questions, groups] = await Promise.all([
      db.questions.findOne({ where: { titleId } }),
      db.questionGroups.findOne({ where: { titleId } })
    ]);

    if (questions || groups) {
      return res.status(400).json({
        message: 'Cannot delete title. Delete all associated questions and groups first.'
      });
    }

    await title.destroy();

    res.json({
      message: 'Title deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getQuestionsWithTitles = async (req, res) => {
  try {
    const result = await db.sequelize.query(`
      SELECT 
          t.id AS "titleId",
          t.name AS "title_name",
          COALESCE(
              JSONB_AGG(
                  DISTINCT JSONB_BUILD_OBJECT(  
                      'groupId', g.id,
                      'group_name', g.name,
                      'questions', (
                          SELECT COALESCE(
                              JSONB_AGG(
                                  JSONB_BUILD_OBJECT(
                                      'questionId', q.id,
                                      'questionText', q."questionText",
                                      'questionType', q."questionType",
                                      'isRequired',q."isRequired",
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
                  DISTINCT JSONB_BUILD_OBJECT(
                      'questionId', uq.id,
                      'questionText', uq."questionText",
                      'questionType', uq."questionType",
                      'isRequired',uq."isRequired",
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
                          WHERE o."questionId" = uq.id
                      )
                  )
              ) FILTER (WHERE uq.id IS NOT NULL), '[]'::JSONB
          ) AS ungrouped_questions
      FROM titles t
      LEFT JOIN question_groups g ON g."titleId" = t.id
      LEFT JOIN questions uq ON uq."titleId" = t.id AND uq."groupId" IS NULL  
      WHERE t.status = 1
      GROUP BY t.id, t.name
  `, {
      type: db.sequelize.QueryTypes.SELECT
    });

    res.status(200).json({
      result
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const updateQuestionGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { error, value } = updateQuestionGroupSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const group = await db.questionGroups.findByPk(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Question group not found' });
    }

    await group.update({
      name: value.name,
      updatedBy: req.user.id
    });

    res.status(200).json({
      message: 'Question group updated successfully',
      group
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteQuestionGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { error } = deleteQuestionGroupSchema.validate({ groupId });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const group = await db.questionGroups.findByPk(groupId, {
      include: [{
        model: db.questions,
        attributes: ['id']
      }]
    });

    if (!group) {
      return res.status(404).json({ message: 'Question group not found' });
    }

    // Check if group has any questions
    if (group.questions && group.questions.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete question group that has questions. Please delete or move the questions first.' 
      });
    }

    await group.destroy();

    res.status(200).json({
      message: 'Question group deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getQuestionDetails = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { error } = getQuestionDetailsSchema.validate({ questionId: parseInt(questionId) });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const question = await db.questions.findOne({
      where: { 
        id: questionId,
        status: DATABASE_STATUS_TYPE.ACTIVE 
      },
      include: [
        {
          model: db.titles,
          attributes: ['id', 'name']
        },
        {
          model: db.questionGroups,
          attributes: ['id', 'name']
        },
        {
          model: db.options,
          attributes: ['id', 'optionText'],
          where: { status: DATABASE_STATUS_TYPE.ACTIVE },
          required: false
        }
      ]
    });

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const response = {
      id: question.id,
      questionText: question.questionText,
      questionType: question.questionType,
      isRequired: question.isRequired,
      title: question.title,
      group: question.questionGroup,
      options: question.options || [],
      createdAt: question.createdAt,
      updatedAt: question.updatedAt
    };

    res.status(200).json({
      message: 'Question details retrieved successfully',
      question: response
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
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
  updateAnswer,
  getProjectAnswers,
  saveLlmHistory,
  getLlmHistory,
  getAllQuestionGroups,
  updateQuestion,
  updateTitle,
  deleteTitle,
  getQuestionsWithTitles,
  updateQuestionGroup,
  deleteQuestionGroup,
  getQuestionDetails
};
