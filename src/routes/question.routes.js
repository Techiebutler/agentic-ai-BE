const express = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/admin.middleware');
const {
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
} = require('../controllers/question.controller');

const router = express.Router();

/**
 * @swagger
 * /api/questions/{titleId}:
 *   get:
 *     tags: [Questions]
 *     summary: Get questions by title with user's answers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: titleId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Questions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       titleid:
 *                         type: integer
 *                       title_name:
 *                         type: string
 *                       grouped_questions:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             groupId:
 *                               type: integer
 *                             group_name:
 *                               type: string
 *                             questions:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   questionId:
 *                                     type: integer
 *                                   questionText:
 *                                     type: string
 *                                   questionType:
 *                                     type: string
 *                                     enum: [text, radio, select, checkbox]
 *                                   options:
 *                                     type: array
 *                                     items:
 *                                       type: object
 *                                       properties:
 *                                         option_id:
 *                                           type: integer
 *                                         optionText:
 *                                           type: string
 *                       ungrouped_questions:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             questionId:
 *                               type: integer
 *                             questionText:
 *                               type: string
 *                             questionType:
 *                               type: string
 *                               enum: [text, radio, select, checkbox]
 *                             options:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   option_id:
 *                                     type: integer
 *                                   optionText:
 *                                     type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     totalItems:
 *                       type: integer
 *                     itemsPerPage:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPreviousPage:
 *                       type: boolean
 *                 title:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *       404:
 *         description: Title not found
 */
router.get('/admin/questions/:titleId', verifyToken, getQuestionsByTitle);

/**
 * @swagger
 * /api/admin/title/create:
 *   post:
 *     tags: [Admin]
 *     summary: Create a new title (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *     responses:
 *       201:
 *         description: Title created successfully
 *       403:
 *         description: Access denied. Admin privileges required.
 */
router.post('/admin/title/create', verifyToken, isAdmin, createTitle);

/**
 * @swagger
 * /api/admin/question-group/create:
 *   post:
 *     tags: [Admin]
 *     summary: Create a new question group (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - titleId
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *               titleId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Question group created successfully
 *       403:
 *         description: Access denied. Admin privileges required.
 *       404:
 *         description: Title not found
 */
router.post('/admin/question-group/create', verifyToken, isAdmin, createQuestionGroup);

/**
 * @swagger
 * /api/admin/question/create:
 *   post:
 *     tags: [Admin]
 *     summary: Create a new question (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questionText
 *               - questionType
 *               - titleId
 *             properties:
 *               questionText:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 500
 *               questionType:
 *                 type: string
 *                 enum: [text, radio, select, checkbox]
 *               titleId:
 *                 type: integer
 *               groupId:
 *                 type: integer
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - optionText
 *                   properties:
 *                     optionText:
 *                       type: string
 *                       minLength: 1
 *                       maxLength: 100
 *     responses:
 *       201:
 *         description: Question created successfully
 *       403:
 *         description: Access denied. Admin privileges required.
 *       404:
 *         description: Title or question group not found
 */
router.post('/admin/question/create', verifyToken, isAdmin, createQuestion);

/**
 * @swagger
 * /api/question/submit-answer:
 *   post:
 *     tags: [Questions]
 *     summary: Submit or update an answer to a question
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questionId
 *               - answer
 *             properties:
 *               questionId:
 *                 type: integer
 *               answer:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *     responses:
 *       201:
 *         description: Answer submitted successfully
 *       404:
 *         description: Question not found
 */
router.post('/question/submit-answer', verifyToken, submitAnswer);

/**
 * @swagger
 * /api/questions/{titleId}/answers:
 *   get:
 *     tags: [Questions]
 *     summary: Get user's answers for a specific title
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: titleId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User's answers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 answers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       questionId:
 *                         type: integer
 *                       answer:
 *                         type: string
 *       404:
 *         description: Title not found
 */
router.get('/questions/:titleId/answers', verifyToken, getUserAnswers);

/**
 * @swagger
 * /api/admin/question/update-text:
 *   put:
 *     tags: [Admin]
 *     summary: Update question text or option text (admin only)
 *     description: Single endpoint to update either question text or option text based on type parameter
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - id
 *               - text
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [question, option]
 *                 description: Specify whether to update question or option text
 *                 example: "question"
 *               id:
 *                 type: integer
 *                 minimum: 1
 *                 description: ID of the question or option to update
 *                 example: 1
 *               text:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 500
 *                 description: New text content
 *                 example: "What is your favorite color?"
 *     responses:
 *       200:
 *         description: Text updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Question text updated successfully"
 *       400:
 *         description: Invalid input or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Type must be one of: question, option"
 *       403:
 *         description: Access denied. Admin privileges required.
 *       404:
 *         description: Question or option not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Question not found"
 */
router.put('/admin/question/update-text', verifyToken, isAdmin, updateText);

/**
 * @swagger
 * /api/admin/question/delete/{questionId}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a question and its associated options (admin only)
 *     description: Deletes a question and all its associated options through cascade delete
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID of the question to delete
 *     responses:
 *       200:
 *         description: Question and its options deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Question and its options deleted successfully"
 *       400:
 *         description: Invalid input or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Question ID is required"
 *       403:
 *         description: Access denied. Admin privileges required.
 *       404:
 *         description: Question not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Question not found"
 */
router.delete('/admin/question/delete/:questionId', verifyToken, isAdmin, deleteQuestion);

/**
 * @swagger
 * /api/admin/option/delete/{optionId}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a specific option (admin only)
 *     description: Deletes a specific option. Prevents deletion of the last option for radio/select/checkbox questions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: optionId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID of the option to delete
 *     responses:
 *       200:
 *         description: Option deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Option deleted successfully"
 *       400:
 *         description: Invalid input, validation error, or attempting to delete last option
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cannot delete the last option of a radio/select/checkbox question"
 *       403:
 *         description: Access denied. Admin privileges required.
 *       404:
 *         description: Option not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Option not found"
 */
router.delete('/admin/option/delete/:optionId', verifyToken, isAdmin, deleteOption);

/**
 * @swagger
 * /api/admin/option/add:
 *   post:
 *     tags: [Admin]
 *     summary: Add a new option to an existing question (admin only)
 *     description: Adds a new option to an existing radio, select, or checkbox question
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questionId
 *               - optionText
 *             properties:
 *               questionId:
 *                 type: integer
 *                 minimum: 1
 *                 description: ID of the question to add option to
 *                 example: 1
 *               optionText:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Text for the new option
 *                 example: "New option text"
 *     responses:
 *       201:
 *         description: Option added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Option added successfully"
 *                 option:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     questionId:
 *                       type: integer
 *                       example: 1
 *                     optionText:
 *                       type: string
 *                       example: "New option text"
 *       400:
 *         description: Invalid input or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Options can only be added to radio, select, or checkbox questions"
 *       403:
 *         description: Access denied. Admin privileges required.
 *       404:
 *         description: Question not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Question not found"
 */
router.post('/admin/option/add', verifyToken, isAdmin, addOption);

/**
 * @swagger
 * /api/admin/titles:
 *   get:
 *     tags: [Admin]
 *     summary: Get all titles (admin only)
 *     description: Retrieves all titles with their details, sorted by creation date
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Titles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Titles retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "Diet Plan"
 *                       description:
 *                         type: string
 *                         example: "Questions about your diet and health"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-03-10T11:00:00.000Z"
 *       403:
 *         description: Access denied. Admin privileges required.
 */
router.get('/admin/titles', verifyToken, isAdmin, getAllTitles);

/**
 * @swagger
 * /api/admin/questions:
 *   get:
 *     tags: [Admin]
 *     summary: Get all questions with their titles and groups (admin only)
 *     description: Retrieves all questions with their associated titles, groups, and options, with pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Questions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       questionId:
 *                         type: integer
 *                         example: 1
 *                       questionText:
 *                         type: string
 *                         example: "What is your weight?"
 *                       questionType:
 *                         type: string
 *                         enum: [text, radio, select, checkbox]
 *                         example: "select"
 *                       title:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           name:
 *                             type: string
 *                             example: "Diet Plan"
 *                       group:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           name:
 *                             type: string
 *                             example: "Basic Information"
 *                       options:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                               example: 1
 *                             optionText:
 *                               type: string
 *                               example: "50-60 kg"
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     totalItems:
 *                       type: integer
 *                       example: 50
 *                     itemsPerPage:
 *                       type: integer
 *                       example: 10
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     hasNextPage:
 *                       type: boolean
 *                       example: true
 *                     hasPreviousPage:
 *                       type: boolean
 *                       example: false
 *       403:
 *         description: Access denied. Admin privileges required.
 */
router.get('/admin/questions', verifyToken, isAdmin, getAllQuestions);

module.exports = router;
