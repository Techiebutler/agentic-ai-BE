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
const { DATABASE_STATUS_TYPE, ENTITY_TYPES } = require('../constants/database.constants');

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

    const findTitle = await db.titles.findOne({
      where: {
        id: value.titleId,
        status: DATABASE_STATUS_TYPE.ACTIVE
      }
    });
    if (!findTitle) {
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
      const findTitle = await db.titles.findOne({
        where: {
          id: value.titleId,
          status: DATABASE_STATUS_TYPE.ACTIVE
        }
      });
      if (!findTitle) {
        return res.status(404).json({ message: 'Title not found' });
      }
    } else {
      const findGroup = await db.questionGroups.findOne({
        where: {
          id: value.groupId,
          status: DATABASE_STATUS_TYPE.ACTIVE
        }
      });
      if (!findGroup) {
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

    const title = await db.titles.findOne({
      where: {
        id: titleId,
        status: DATABASE_STATUS_TYPE.ACTIVE
      }
    });
    if (!title) {
      return res.status(404).json({ message: 'Title not found' });
    }

    const result = await db.sequelize.query(`
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
                                      'questionId', q.id,
                                      'questionText', q."questionText",
                                      'questionType', q."questionType",
                                      'isRequired', q."isRequired",
                                      'options', (
                                          SELECT COALESCE(
                                              JSONB_AGG(
                                                  JSONB_BUILD_OBJECT(
                                                      'option_id', o.id,
                                                      'optionText', o."optionText"
                                                  )
                                                  ORDER BY o.id
                                              ) FILTER (WHERE o.id IS NOT NULL), '[]'::JSONB
                                          )
                                          FROM options o
                                          WHERE o."questionId" = q.id AND o.status = ${DATABASE_STATUS_TYPE.ACTIVE}
                                      )
                                  )
                                  ORDER BY q.id
                              ) FILTER (WHERE q.id IS NOT NULL), '[]'::JSONB
                          )
                          FROM questions q
                          WHERE q."groupId" = g.id AND q.status = ${DATABASE_STATUS_TYPE.ACTIVE}
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
                                  ORDER BY o.id
                              ) FILTER (WHERE o.id IS NOT NULL), '[]'::JSONB
                          )
                          FROM options o
                          WHERE o."questionId" = uq.id AND o.status = ${DATABASE_STATUS_TYPE.ACTIVE}
                      )
                  )
              ) FILTER (WHERE uq.id IS NOT NULL), '[]'::JSONB
          ) AS ungrouped_questions
      FROM titles t
      LEFT JOIN question_groups g ON g."titleId" = t.id
      LEFT JOIN questions uq ON uq."titleId" = t.id AND uq."groupId" IS NULL  
      WHERE t.id = :titleId AND t.status = ${DATABASE_STATUS_TYPE.ACTIVE}
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
      where: { id: projectId, status: DATABASE_STATUS_TYPE.ACTIVE }
    });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has access to this project
    const userProject = await db.projects.findOne({
      where: { userId, id: projectId, status: DATABASE_STATUS_TYPE.ACTIVE }
    });
    if (!userProject) {
      return res.status(403).json({ message: 'Access denied to this project' });
    }

    // Find the question
    const question = await db.questions.findOne({
      where: {
        id: questionId,
        status: DATABASE_STATUS_TYPE.ACTIVE
      }
    })
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

    const titleId = req.params.titleId;

    const title = await db.titles.findOne({
      where: {
        id: titleId,
        status: DATABASE_STATUS_TYPE.ACTIVE
      }
    });
    if (!title) {
      return res.status(404).json({ message: 'Title not found' });
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
                        SELECT JSONB_AGG(q_obj ORDER BY q_obj."questionId")
                        FROM (
                            SELECT uq."questionId",
                                uq."questionText", uq."questionType", uq."isRequired",
                                uq."answerId", uq."answer", uq."options"
                            FROM (
                                SELECT DISTINCT ON (q.id, q."questionText", q."questionType", q."isRequired", a.id, a."answerText", a."selectedOptionIds")
                                    q.id AS "questionId", q."groupId", q."titleId",
                                    q."questionText", q."questionType", q."isRequired",
                                    a.id AS "answerId",
                                    CASE
                                        WHEN q."questionType" = 'text' THEN TO_JSONB(a."answerText")
                                        WHEN q."questionType" IN ('radio', 'select', 'checkbox') THEN TO_JSONB(COALESCE(a."selectedOptionIds", '{}'::integer[]))
                                    END AS "answer",
                                    (SELECT JSONB_AGG(
                                        JSONB_BUILD_OBJECT(
                                            'id', o.id,
                                            'optionText', o."optionText",
                                            'isSelected', o.id = ANY(COALESCE(a."selectedOptionIds", '{}'::integer[]))
                                        ) ORDER BY o.id
                                    ) FROM options o WHERE o."questionId" = q.id AND o."status"=${DATABASE_STATUS_TYPE.ACTIVE}) AS "options"
                                FROM questions q
                                LEFT JOIN answers a ON a."questionId" = q.id AND a."userId" = :userId
                                WHERE q."titleId" = :titleId AND q."status"=${DATABASE_STATUS_TYPE.ACTIVE}
                                ORDER BY q.id
                            ) AS uq
                            WHERE uq."groupId" = g.id
                            ORDER BY uq."questionId"
                        ) AS q_obj
                    )
                )
            ) FILTER (WHERE g.id IS NOT NULL), '[]'::JSONB
        ) AS grouped_questions,
        COALESCE(
            JSONB_AGG(
                DISTINCT JSONB_BUILD_OBJECT(
                    'questionId', uq."questionId",
                    'questionText', uq."questionText",
                    'questionType', uq."questionType",
                    'isRequired', uq."isRequired",
                    'answerId', uq."answerId",
                    'answer', uq."answer",
                    'options', uq."options"
                )
            ) FILTER (WHERE uq."groupId" IS NULL), '[]'::JSONB
        ) AS ungrouped_questions
    FROM titles t
    LEFT JOIN question_groups g ON g."titleId" = t.id
    LEFT JOIN (
        SELECT DISTINCT ON (q.id, q."questionText", q."questionType", q."isRequired", a.id, a."answerText", a."selectedOptionIds")
            q.id AS "questionId", q."groupId", q."titleId",
            q."questionText", q."questionType", q."isRequired",
            a.id AS "answerId",
            CASE
                WHEN q."questionType" = 'text' THEN TO_JSONB(a."answerText")
                WHEN q."questionType" IN ('radio', 'select', 'checkbox') THEN TO_JSONB(COALESCE(a."selectedOptionIds", '{}'::integer[]))
            END AS "answer",
            (SELECT JSONB_AGG(
                JSONB_BUILD_OBJECT(
                    'id', o.id,
                    'optionText', o."optionText",
                    'isSelected', o.id = ANY(COALESCE(a."selectedOptionIds", '{}'::integer[]))
                ) ORDER BY o.id
            ) FROM options o WHERE o."questionId" = q.id AND o."status"=${DATABASE_STATUS_TYPE.ACTIVE}) AS "options"
        FROM questions q
        LEFT JOIN answers a ON a."questionId" = q.id AND a."userId" = :userId
        WHERE q."titleId" = :titleId AND q."status"=${DATABASE_STATUS_TYPE.ACTIVE}
        ORDER BY q.id
    ) AS uq ON uq."titleId" = t.id
    WHERE t.id = :titleId AND t.status = ${DATABASE_STATUS_TYPE.ACTIVE}
    GROUP BY t.id, t.name
    ORDER BY t.id
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
      const question = await db.questions.findOne({ where: { id, status: DATABASE_STATUS_TYPE.ACTIVE } });
      if (!question) {
        return res.status(404).json({ message: 'Question not found' });
      }
      await question.update({ questionText: text });
      return res.status(200).json({ message: 'Question text updated successfully' });
    }

    if (type === 'option') {
      const option = await db.options.findOne({ where: { id, status: DATABASE_STATUS_TYPE.ACTIVE } });
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
    const question = await db.questions.findOne({ where: { id: questionId, status: DATABASE_STATUS_TYPE.ACTIVE } });

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Update status to IN_ACTIVE instead of deleting
    await db.questions.update(
      { status: DATABASE_STATUS_TYPE.IN_ACTIVE },
      { where: { id: questionId } }
    );

    // Update associated options status to IN_ACTIVE
    await db.options.update(
      { status: DATABASE_STATUS_TYPE.IN_ACTIVE },
      { where: { questionId } }
    );

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

    const option = await db.options.findOne({ where: { id: optionId, status: DATABASE_STATUS_TYPE.ACTIVE } });

    if (!option) {
      return res.status(404).json({ message: 'Option not found' });
    }

    // Check if this is the last option for a radio/select/checkbox question
    const question = await db.questions.findOne({ where: { id: option.questionId, status: DATABASE_STATUS_TYPE.ACTIVE } });
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

    await db.options.update(
      { status: DATABASE_STATUS_TYPE.IN_ACTIVE },
      { where: { id: optionId } }
    );
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
    const question = await db.questions.findOne({ where: { id: questionId, status: DATABASE_STATUS_TYPE.ACTIVE } });
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
      where: { status: DATABASE_STATUS_TYPE.ACTIVE },
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
      where: { id: projectId, status: DATABASE_STATUS_TYPE.ACTIVE }
    });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has access to this project
    const userProject = await db.projects.findOne({
      where: { userId, id: projectId, status: DATABASE_STATUS_TYPE.ACTIVE }
    });
    if (!userProject) {
      return res.status(403).json({ message: 'Access denied to this project' });
    }

    // Find the answer and check ownership
    const answer = await db.answers.findOne({
      where: { id: answerId, projectId, status: DATABASE_STATUS_TYPE.ACTIVE },
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
          questionId: answer.questionId,
          status: DATABASE_STATUS_TYPE.ACTIVE
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
      where: { id: projectId, status: DATABASE_STATUS_TYPE.ACTIVE }
    });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has access to this project
    const userProject = await db.projects.findOne({
      where: { userId, id: projectId, status: DATABASE_STATUS_TYPE.ACTIVE }
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
                                            WHERE o."questionId" = q.id AND o."status"=${DATABASE_STATUS_TYPE.ACTIVE})
                                        ELSE NULL
                                    END
                            )
                        )
                        FROM questions q
                        LEFT JOIN answers a ON a."questionId" = q.id AND a."userId" = :userId AND a."projectId" = :projectId
                        WHERE q."groupId" = g.id AND q."status"=${DATABASE_STATUS_TYPE.ACTIVE}
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
                                        WHERE o."questionId" = q.id AND o."status"=${DATABASE_STATUS_TYPE.ACTIVE})
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
    WHERE t.id = :titleId AND t.status = ${DATABASE_STATUS_TYPE.ACTIVE}
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
      where: { id: projectId, status: DATABASE_STATUS_TYPE.ACTIVE }
    });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has access to this project
    const userProject = await db.projects.findOne({
      where: { userId, id: projectId, status: DATABASE_STATUS_TYPE.ACTIVE }
    });
    if (!userProject) {
      return res.status(403).json({ message: 'Access denied to this project' });
    }

    // Get LLM history with pagination
    const history = await db.answerHistories.findAndCountAll({
      where: {
        userId,
        projectId,
        questionId,
        status: DATABASE_STATUS_TYPE.ACTIVE
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
      where: { id: projectId, status: DATABASE_STATUS_TYPE.ACTIVE }
    });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has access to this project
    const userProject = await db.projects.findOne({
      where: { userId, id: projectId, status: DATABASE_STATUS_TYPE.ACTIVE }
    });
    if (!userProject) {
      return res.status(403).json({ message: 'Access denied to this project' });
    }

    // Validate question exists and is LLM type
    const question = await db.questions.findOne({
      where: { id: questionId,status:DATABASE_STATUS_TYPE.ACTIVE }
    });
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    if (question.questionType !== 'llm') {
      return res.status(400).json({ message: 'This operation is only valid for LLM type questions' });
    }

    // Save to LLM history
    const history = await db.answerHistories.create({
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
    const title = await db.titles.findOne({
      where: { id: titleId, status: DATABASE_STATUS_TYPE.ACTIVE }
    });
    if (!title) {
      return res.status(404).json({ message: 'Title not found' });
    }

    const groups = await db.questionGroups.findAll({
      where: { titleId, status: DATABASE_STATUS_TYPE.ACTIVE },  // Only get active groups
      attributes: ['id', 'name', 'titleId', 'createdAt'],
      include: [{
        model: db.titles,
        attributes: ['name'],
        as: 'title',
        where: { status: DATABASE_STATUS_TYPE.ACTIVE }  // Only include active titles
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
      }],
      where: { status: DATABASE_STATUS_TYPE.ACTIVE }
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
      }],
      where: { status: DATABASE_STATUS_TYPE.ACTIVE }
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

    const title = await db.titles.findByPk(titleId, {
      where: { status: DATABASE_STATUS_TYPE.ACTIVE }
    });

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

    const title = await db.titles.findByPk(titleId, {
      where: { status: DATABASE_STATUS_TYPE.ACTIVE }
    });
    if (!title) {
      return res.status(404).json({ message: 'Title not found' });
    }

    // Update status to IN_ACTIVE instead of deleting
    await db.titles.update(
      { status: DATABASE_STATUS_TYPE.IN_ACTIVE },
      { where: { id: titleId } }
    );

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

    const group = await db.questionGroups.findByPk(groupId,{
      where: { status: DATABASE_STATUS_TYPE.ACTIVE }
    });
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
      }],
      where: { status: DATABASE_STATUS_TYPE.ACTIVE }
    });

    if (!group) {
      return res.status(404).json({ message: 'Question group not found' });
    }

    // Update status to IN_ACTIVE instead of deleting
    await db.questionGroups.update(
      { status: DATABASE_STATUS_TYPE.IN_ACTIVE },
      { where: { id: groupId } }
    );

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

const regenerateAnswers = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { data, group_id, rejectionReason } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: 'Invalid data format. Expected non-empty array.' });
    }

    // Validate all question IDs exist and belong to the same group if group_id is provided
    const questionIds = data.map(item => item.id);
    const questions = await db.questions.findAll({
      where: {
        id: { [Op.in]: questionIds },
        ...(group_id && { groupId: group_id }),
        status: DATABASE_STATUS_TYPE.ACTIVE
      }
    });

    if (questions.length !== questionIds.length) {
      return res.status(400).json({ message: 'One or more invalid question IDs or questions not in specified group.' });
    }

    // Get existing answers
    const existingAnswers = await db.answers.findAll({
      where: {
        questionId: {
          [Op.in]: questionIds
        },
        userId,
        status: DATABASE_STATUS_TYPE.ACTIVE
      }
    });

    if (existingAnswers.length === 0) {
      return res.status(400).json({ message: 'No existing answers found to regenerate.' });
    }

    // Get latest versions for each answer
    const latestVersions = await Promise.all(existingAnswers.map(async (answer) => {
      const latestHistory = await db.answerHistories.findOne({
        where: { answerId: answer.id,status:DATABASE_STATUS_TYPE.ACTIVE },
        order: [['version', 'DESC']],
        attributes: ['version']
      });
      return {
        answerId: answer.id,
        version: latestHistory ? latestHistory.version + 1 : 1
      };
    }));

    // Create version lookup map
    const versionMap = latestVersions.reduce((map, item) => {
      map[item.answerId] = item.version;
      return map;
    }, {});

    // Store existing answers in history
    await Promise.all([
      // Store answer details in history
      ...existingAnswers.map(answer => db.answerHistories.create({
        answerId: answer.id,
        userId,
        entityType: ENTITY_TYPES.QUESTION,
        answerText: answer.answerText,
        selectedOptionIds: answer.selectedOptionIds,
        systemPrompt: answer.systemPrompt,
        rejectionReason,
        version: versionMap[answer.id],
        status: DATABASE_STATUS_TYPE.ACTIVE,
        createdBy: userId
      }, { transaction: t }))
    ]);

    // Update existing answers with new data
    await Promise.all(data.map(async (item) => {
      const answer = existingAnswers.find(a => a.questionId === item.id);
      if (answer) {
        await answer.update({
          answerText: item.answerText,
          selectedOptionIds: item.selectedOptionIds,
        }, { transaction: t });
      }
    }));

    // TODO: Call external service to get new systemPrompt
    // const systemPrompt = await externalService.getSystemPrompt(existingAnswers);
    const systemPrompt = "Placeholder for external service response"; // Remove this line when implementing external service

    // Update all answers with the new systemPrompt
    await Promise.all(existingAnswers.map(answer =>
      answer.update({ systemPrompt }, { transaction: t })
    ));

    await t.commit();
    res.status(200).json({
      message: 'Answers regenerated successfully',
      answers: existingAnswers,
      versions: versionMap
    });
  } catch (error) {
    await t.rollback();
    console.error('Error in regenerateAnswers:', error);
    res.status(500).json({ message: 'Error regenerating answers', error: error.message });
  }
};

const submitBulkAnswers = async (req, res) => {
  try {
    const { data, group_id, projectId } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: 'Invalid data format. Expected non-empty array.' });
    }

    // Validate all question IDs exist and belong to the same group if group_id is provided
    const questionIds = data.map(item => item.id);
    const questions = await db.questions.findAll({
      where: {
        id: { [Op.in]: questionIds },
        ...(group_id && { groupId: group_id }),
        status:DATABASE_STATUS_TYPE.ACTIVE
      }
    });

    if (questions.length !== questionIds.length) {
      return res.status(400).json({ message: 'One or more invalid question IDs or questions not in specified group.' });
    }

    // Find existing answers for these questions
    const existingAnswers = await db.answers.findAll({
      where: {
        questionId: { [Op.in]: questionIds },
        userId,
        projectId,
        status: DATABASE_STATUS_TYPE.ACTIVE
      }
    });

    // Create a map of existing answers for quick lookup
    const existingAnswersMap = existingAnswers.reduce((map, answer) => {
      map[answer.questionId] = answer;
      return map;
    }, {});

    // Update or create answers
    const answers = await Promise.all(data.map(async (item) => {
      const existingAnswer = existingAnswersMap[item.id];

      if (existingAnswer) {
        // Update existing answer
        await existingAnswer.update({
          answerText: item.answerText,
          selectedOptionIds: item.selectedOptionIds
        });
        return existingAnswer;
      } else {
        // Create new answer
        return db.answers.create({
          questionId: item.id,
          userId,
          projectId,
          answerText: item.answerText,
          selectedOptionIds: item.selectedOptionIds,
          status: DATABASE_STATUS_TYPE.ACTIVE,
          createdBy: userId
        });
      }
    }));

    // TODO: Call external service to get systemPrompt
    // const systemPrompt = await externalService.getSystemPrompt(answers);
    const systemPrompt = "Placeholder for external service response"; // Remove this line when implementing external service

    // Update all answers with the systemPrompt
    await Promise.all(answers.map(answer =>
      answer.update({ systemPrompt })
    ));

    res.status(200).json({
      message: 'Answers submitted successfully',
      answers,
      updated: Object.keys(existingAnswersMap).length,
      created: answers.length - Object.keys(existingAnswersMap).length
    });
  } catch (error) {
    console.error('Error in submitBulkAnswers:', error);
    res.status(500).json({ message: 'Error submitting answers', error: error.message });
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
  getQuestionDetails,
  submitBulkAnswers,
  regenerateAnswers
};
