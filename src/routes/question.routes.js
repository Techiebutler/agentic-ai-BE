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
  regenerateAnswers,
  updateQuestionSequence
} = require('../controllers/question.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Questions
 *   description: Question management endpoints
 * servers:
 *   url: https://agentic-ai-be-1.onrender.com
 *   description: Deployed production server
 */
/**
 * @swagger
 * /api/admin/title/create:
 *   post:
 *     tags: [Questions]
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
 * /api/admin/title/{titleId}:
 *   put:
 *     tags: [Questions]
 *     summary: Update a title (admin only)
 *     description: Update name and/or description of a title. Name can only be updated if no questions exist.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: titleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the title to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *       200:
 *         description: Title updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Title updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     status:
 *                       type: integer
 *       400:
 *         description: Invalid input or title has associated questions (when updating name)
 *       403:
 *         description: Access denied. Admin privileges required.
 *       404:
 *         description: Title not found
 */
router.put('/admin/title/:titleId', verifyToken, isAdmin, updateTitle);

/**
 * @swagger
 * /api/admin/title/{titleId}:
 *   delete:
 *     tags: [Questions]
 *     summary: Delete a title (admin only)
 *     description: Delete a title. Only possible if no questions or groups are associated with it.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: titleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the title to delete
 *     responses:
 *       200:
 *         description: Title deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Title deleted successfully
 *       400:
 *         description: Cannot delete title with associated questions or groups
 *       403:
 *         description: Access denied. Admin privileges required.
 *       404:
 *         description: Title not found
 */
router.delete('/admin/title/:titleId', verifyToken, isAdmin, deleteTitle);

/**
 * @swagger
 * /api/titles:
 *   get:
 *     tags: [Questions]
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
router.get('/titles', verifyToken, getAllTitles);

/**
 * @swagger
 * /api/admin/question-group/create:
 *   post:
 *     tags: [Questions]
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
 * /api/admin/question-group/{groupId}:
 *   put:
 *     tags: [Questions]
 *     summary: Update a question group (admin only)
 *     description: Update the name of a question group. Requires admin privileges.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the question group to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 255
 *                 description: New name for the question group
 *     responses:
 *       200:
 *         description: Question group updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Question group updated successfully
 *                 group:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     titleId:
 *                       type: integer
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid input or validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied. Admin privileges required.
 *       404:
 *         description: Question group not found
 *       500:
 *         description: Server error
 */
router.put('/admin/question-group/:groupId', verifyToken, isAdmin, updateQuestionGroup);

/**
 * @swagger
 * /api/admin/question-group/{groupId}:
 *   delete:
 *     tags: [Questions]
 *     summary: Delete a question group (admin only)
 *     description: Delete a question group. Can only be deleted if it has no associated questions. Requires admin privileges.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the question group to delete
 *     responses:
 *       200:
 *         description: Question group deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Question group deleted successfully
 *       400:
 *         description: Cannot delete group with existing questions
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied. Admin privileges required.
 *       404:
 *         description: Question group not found
 *       500:
 *         description: Server error
 */
router.delete('/admin/question-group/:groupId', verifyToken, isAdmin, deleteQuestionGroup);

/**
 * @swagger
 * /api/admin/question-groups/{titleId}:
 *   get:
 *     tags: [Questions]
 *     summary: Get all question groups for a title (admin only)
 *     description: Retrieves all active question groups for a specific title, sorted by creation date. Includes title information.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: titleId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID of the title to get groups for
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Question groups retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       titleId:
 *                         type: integer
 *                       status:
 *                         type: integer
 *                         description: Status of the group (1 = active)
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       title:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           status:
 *                             type: integer
 *                             description: Status of the title (1 = active)
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Title not found
 *       500:
 *         description: Server error
 */
router.get('/admin/question-groups/:titleId', verifyToken, isAdmin, getAllQuestionGroups);

/**
 * @swagger
 * /api/admin/question:
 *   post:
 *     tags: [Questions]
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
 *             properties:
 *               questionText:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 500
 *                 description: The text of the question
 *               questionType:
 *                 type: string
 *                 enum: [text, radio, select, checkbox, llm]
 *                 description: Type of question
 *               titleId:
 *                 type: integer
 *                 description: ID of the title (optional if groupId is provided)
 *               groupId:
 *                 type: integer
 *                 description: ID of the question group (optional if titleId is provided)
 *               isRequired:
 *                 type: boolean
 *                 default: false
 *                 description: Whether the question is required
 *               options:
 *                 type: array
 *                 description: Required for radio, select, checkbox types
 *                 items:
 *                   type: object
 *                   required:
 *                     - optionText
 *                   properties:
 *                     optionText:
 *                       type: string
 *                       minLength: 1
 *                       maxLength: 255
 *     responses:
 *       201:
 *         description: Question created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 question:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     questionText:
 *                       type: string
 *                     questionType:
 *                       type: string
 *                     options:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           optionText:
 *                             type: string
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Title or group not found
 *       500:
 *         description: Server error
 */
router.post('/admin/question', verifyToken, isAdmin, createQuestion);

/**
 * @swagger
 * /api/admin/question/{questionId}:
 *   get:
 *     tags: [Questions]
 *     summary: Get question details by ID
 *     description: Retrieve detailed information about a specific question including its title, group, and options (if applicable)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the question to retrieve
 *     responses:
 *       200:
 *         description: Question details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Question details retrieved successfully
 *                 question:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     questionText:
 *                       type: string
 *                       example: What is your diet preference?
 *                     questionType:
 *                       type: string
 *                       enum: [text, radio, select, checkbox, llm]
 *                       example: radio
 *                     isRequired:
 *                       type: boolean
 *                       example: true
 *                     title:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         name:
 *                           type: string
 *                           example: Diet Plan
 *                     group:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         name:
 *                           type: string
 *                           example: Dietary Preferences
 *                     options:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           optionText:
 *                             type: string
 *                             example: Vegetarian
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid question ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Question not found
 *       500:
 *         description: Server error
 */
router.get('/admin/question/:questionId', verifyToken, isAdmin, getQuestionDetails);

/**
 * @swagger
 * /api/admin/question/sequence:
 *   put:
 *     tags: [Questions]
 *     summary: Update question sequence (admin only)
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
 *               - newSequence
 *             properties:
 *               questionId:
 *                 type: integer
 *                 description: ID of the question to reorder
 *               newSequence:
 *                 type: integer
 *                 description: New sequence number for the question
 *     responses:
 *       200:
 *         description: Question sequence updated successfully
 *       400:
 *         description: Invalid sequence number
 *       404:
 *         description: Question not found
 *       500:
 *         description: Server error
 */
router.put('/admin/question/sequence', verifyToken, isAdmin, updateQuestionSequence);

/**
 * @swagger
 * /api/admin/question/{questionId}:
 *   put:
 *     tags: [Questions]
 *     summary: Update a question (admin only)
 *     description: Update questionText, questionType, and/or isRequired fields of a question. Type changes are validated based on existing options.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the question to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               questionText:
 *                 type: string
 *                 minLength: 3
 *               questionType:
 *                 type: string
 *                 enum: [text, radio, select, checkbox, llm]
 *               isRequired:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Question updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Question updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     questionText:
 *                       type: string
 *                     questionType:
 *                       type: string
 *                     isRequired:
 *                       type: boolean
 *       400:
 *         description: Invalid input or incompatible type change
 *       403:
 *         description: Access denied. Admin privileges required.
 *       404:
 *         description: Question not found
 */
router.put('/admin/question/:questionId', verifyToken, isAdmin, updateQuestion);

/**
 * @swagger
 * /api/admin/question:
 *   put:
 *     tags: [Questions]
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
router.put('/admin/question', verifyToken, isAdmin, updateText);

/**
 * @swagger
 * /api/admin/question/delete/{questionId}:
 *   delete:
 *     tags: [Questions]
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
 * /api/admin/option/add:
 *   post:
 *     tags: [Questions]
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
 * /api/admin/option/delete/{optionId}:
 *   delete:
 *     tags: [Questions]
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
 *                                   isRequired:
 *                                     type: boolean
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
 *                             isRequired:
 *                               type: boolean
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
router.get('/questions/:titleId', verifyToken, getQuestionsByTitle);

/**
 * @swagger
 * /api/questions:
 *   get:
 *     tags: [Questions]
 *     summary: Get All questions
 *     security:
 *       - bearerAuth: []
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
 *                       titleId:
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
 *                                   isRequired:
 *                                     type: boolean
 *                                     default: false
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
 *                             isRequired:
 *                               type: boolean
 *                               default: false
 *                             options:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   option_id:
 *                                     type: integer
 *                                   optionText:
 *                                     type: string
 *       404:
 *         description: Title not found
 */
router.get('/questions', verifyToken, getQuestionsWithTitles);

/**
 * @swagger
 * /api/user/answer/submit:
 *   post:
 *     summary: Submit an answer for a question
 *     tags: [Questions]
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
 *               - projectId
 *             properties:
 *               questionId:
 *                 type: integer
 *                 description: ID of the question
 *               projectId:
 *                 type: integer
 *                 description: ID of the project
 *               answerText:
 *                 type: string
 *                 description: Required for text and llm type questions
 *               selectedOptionIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Required for radio, select, and checkbox type questions
 *     responses:
 *       201:
 *         description: Answer submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 answer:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     answerText:
 *                       type: string
 *                     selectedOptionIds:
 *                       type: array
 *                       items:
 *                         type: integer
 *       400:
 *         description: Invalid input or wrong question type
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Question or project not found
 *       500:
 *         description: Server error
 */
router.post('/user/answer/submit', verifyToken, submitAnswer);

/**
 * @swagger
 * /api/user/answer/update:
 *   put:
 *     summary: Update an existing answer
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - answerId
 *             properties:
 *               answerId:
 *                 type: integer
 *                 description: ID of the answer to update
 *               answerText:
 *                 type: string
 *                 description: Required for text and llm type questions
 *               selectedOptionIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Required for radio, select, and checkbox type questions
 *     responses:
 *       200:
 *         description: Answer updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 answer:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     answerText:
 *                       type: string
 *                     selectedOptionIds:
 *                       type: array
 *                       items:
 *                         type: integer
 *       400:
 *         description: Invalid input or wrong question type
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Answer not found
 *       500:
 *         description: Server error
 */
router.put('/user/answer/update', verifyToken, updateAnswer);

/**
 * @swagger
 * /api/user/answers/{titleId}:
 *   get:
 *     summary: Get user's answers
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: path
 *         name: titleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the title to get answers for
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalItems:
 *                   type: integer
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       titleId:
 *                         type: integer
 *                       titleName:
 *                         type: string
 *                       questions:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             questionText:
 *                               type: string
 *                             questionType:
 *                               type: string
 *                             answer:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                 answerText:
 *                                   type: string
 *                                 selectedOptionIds:
 *                                   type: array
 *                                   items:
 *                                     type: integer
 *                             options:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: integer
 *                                   optionText:
 *                                     type: string
 *                                   isSelected:
 *                                     type: boolean
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/user/answers/:titleId', verifyToken, getUserAnswers);

/**
 * @swagger
 * /api/user/answers/project:
 *   get:
 *     tags: [Questions]
 *     summary: Get user's answers for a specific project
 *     description: Get all answers submitted by the user for questions in a project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the project
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
 *         description: Project answers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Project answers retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       titleId:
 *                         type: integer
 *                         example: 1
 *                       titleName:
 *                         type: string
 *                         example: "Health Survey"
 *                       grouped_questions:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                               example: 1
 *                             name:
 *                               type: string
 *                               example: "Basic Information"
 *                             questions:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   questionId:
 *                                     type: integer
 *                                     example: 1
 *                                   questionText:
 *                                     type: string
 *                                     example: "What is your weight?"
 *                                   questionType:
 *                                     type: string
 *                                     enum: [text, radio, select, checkbox]
 *                                     example: "text"
 *                                   answerId:
 *                                     type: integer
 *                                     example: 1
 *                                   answer:
 *                                     oneOf:
 *                                       - type: string
 *                                         example: "70 kg"
 *                                       - type: array
 *                                         items:
 *                                           type: integer
 *                                         example: [1, 2]
 *                                   options:
 *                                     type: array
 *                                     items:
 *                                       type: object
 *                                       properties:
 *                                         id:
 *                                           type: integer
 *                                           example: 1
 *                                         optionText:
 *                                           type: string
 *                                           example: "50-60 kg"
 *                                         isSelected:
 *                                           type: boolean
 *                                           example: true
 *                       ungrouped_questions:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             questionId:
 *                               type: integer
 *                               example: 1
 *                             questionText:
 *                               type: string
 *                               example: "Additional Comments"
 *                             questionType:
 *                               type: string
 *                               enum: [text, radio, select, checkbox]
 *                               example: "text"
 *                             answerId:
 *                               type: integer
 *                               example: 1
 *                             answer:
 *                               oneOf:
 *                                 - type: string
 *                                   example: "No additional comments"
 *                                 - type: array
 *                                   items:
 *                                     type: integer
 *                                   example: [1, 2]
 *                             options:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: integer
 *                                     example: 1
 *                                   optionText:
 *                                     type: string
 *                                     example: "Option 1"
 *                                   isSelected:
 *                                     type: boolean
 *                                     example: true
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Access denied
 *       404:
 *         description: Project not found
 */
router.get('/user/answers/project/:projectId', verifyToken, getProjectAnswers);

/**
 * @swagger
 * /api/user/answer/llm-history:
 *   post:
 *     summary: Save LLM answer history
 *     tags: [Questions]
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
 *               - projectId
 *               - llmAnswer
 *               - rejectionReason
 *             properties:
 *               questionId:
 *                 type: integer
 *                 description: Question ID
 *               projectId:
 *                 type: integer
 *                 description: Project ID
 *               llmAnswer:
 *                 type: string
 *                 description: LLM generated answer
 *               rejectionReason:
 *                 type: string
 *                 description: Reason for rejecting the LLM answer
 *     responses:
 *       201:
 *         description: LLM history saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 history:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     userId:
 *                       type: integer
 *                     questionId:
 *                       type: integer
 *                     projectId:
 *                       type: integer
 *                     llmAnswer:
 *                       type: string
 *                     rejectionReason:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *       400:
 *         description: Invalid input or non-LLM question type
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Project or question not found
 *       500:
 *         description: Server error
 */
router.post('/user/answer/llm-history', verifyToken, saveLlmHistory);

/**
 * @swagger
 * /api/user/answer/llm-history:
 *   get:
 *     summary: Get LLM answer history
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *       - in: query
 *         name: questionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Question ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalItems:
 *                       type: integer
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           llmAnswer:
 *                             type: string
 *                           rejectionReason:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                           question:
 *                             type: object
 *                             properties:
 *                               questionText:
 *                                 type: string
 *                               questionType:
 *                                 type: string
 *                     totalPages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Project or question not found
 *       500:
 *         description: Server error
 */
router.get('/user/answer/llm-history', verifyToken, getLlmHistory);

module.exports = router;