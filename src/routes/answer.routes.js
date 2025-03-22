const express = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const {
  submitBulkAnswers,
  regenerateAnswers
} = require('../controllers/question.controller');

const router = express.Router();

/**
 * @swagger
 * /api/user/answers/bulk-submit:
 *   post:
 *     tags: [Questions]
 *     summary: Submit multiple answers for questions in bulk
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *             properties:
 *               data:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: Question ID
 *                     answerText:
 *                       type: string
 *                       description: Text answer for the question
 *                     selectedOptionIds:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       description: Array of selected option IDs
 *               group_id:
 *                 type: integer
 *                 nullable: true
 *                 description: Group ID if questions are grouped, null if ungrouped
 *     responses:
 *       200:
 *         description: Answers submitted successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 * 
 * /api/user/answers/regenerate:
 *   post:
 *     tags: [Questions]
 *     summary: Regenerate answers and store previous answers in history
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *               - rejectionReason
 *             properties:
 *               data:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: Question ID
 *                     answerText:
 *                       type: string
 *                       description: Text answer for the question
 *                     selectedOptionIds:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       description: Array of selected option IDs
 *               group_id:
 *                 type: integer
 *                 nullable: true
 *                 description: Group ID if questions are grouped, null if ungrouped
 *               rejectionReason:
 *                 type: string
 *                 description: Reason for regenerating the answers
 *     responses:
 *       200:
 *         description: Answers regenerated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

router.post('/bulk-submit', verifyToken, submitBulkAnswers);
router.post('/regenerate', verifyToken, regenerateAnswers);


module.exports = router;
