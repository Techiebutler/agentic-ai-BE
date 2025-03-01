import express from "express";
import { questionary, message } from "../controller/generative_ai.js"

const router = express.Router();

/**
 * @swagger
 * /api/questionary:
 *   get:
 *     summary: Get questionary data
 *     tags: [AI]
 *     responses:
 *       200:
 *         description: Successfully retrieved questionary data
 *       500:
 *         description: Server error
 */
router.get("/api/questionary", questionary)

/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       properties:
 *         role:
 *           type: string
 *           enum: [system, user, assistant]
 *           description: The role of the message sender
 *         content:
 *           type: string
 *           description: The content of the message
 * 
 * /api/message:
 *   post:
 *     summary: Send a message to the AI
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               model:
 *                 type: string
 *                 default: gpt-3.5-turbo
 *                 description: The OpenAI model to use
 *               messages:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Message'
 *                 description: Array of messages in the conversation
 *                 example:
 *                   - role: system
 *                     content: You are a helpful AI assistant.
 *                   - role: user
 *                     content: write essay for rain
 *               stream:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to stream the response
 *               temperature:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 maximum: 2
 *                 description: Controls randomness in the response
 *               top_p:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 maximum: 1
 *                 description: Controls diversity via nucleus sampling
 *               max_tokens:
 *                 type: integer
 *                 minimum: 1
 *                 description: Maximum number of tokens to generate
 *               presence_penalty:
 *                 type: number
 *                 format: float
 *                 minimum: -2
 *                 maximum: 2
 *                 description: Penalty for new tokens
 *               frequency_penalty:
 *                 type: number
 *                 format: float
 *                 minimum: -2
 *                 maximum: 2
 *                 description: Penalty for frequent tokens
 *               logit_bias:
 *                 type: object
 *                 additionalProperties:
 *                   type: number
 *                 description: Modify likelihood of specific tokens appearing
 *               user:
 *                 type: string
 *                 description: Unique identifier for the end-user
 *     responses:
 *       200:
 *         description: Successfully processed message
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Server error
 */
router.post("/api/message", message)

export default router