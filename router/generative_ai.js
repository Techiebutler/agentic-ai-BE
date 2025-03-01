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
 *       required:
 *         - role
 *         - content
 *       properties:
 *         role:
 *           type: string
 *           enum: [system, user]
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
 *             required:
 *               - messages
 *               - stream
 *             properties:
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