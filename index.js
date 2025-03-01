import express from 'express'
import routes from "./router/generative_ai.js";
import dotev from "dotenv";
import cors from "cors";
import swaggerUi from 'swagger-ui-express';
import { specs } from './swagger.js';

dotev.config();
const app = express();

const corsOptions = { origin: "*" };

app.use(cors(corsOptions));
app.use(express.json());

// Swagger UI route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use(routes)

app.get('/', (req, res) => {
    res.send('Hello World!');
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Check API health status
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
app.get('/health', (req, res) => {
    res.send({"status": "ok" });
});

let port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Swagger documentation available at http://localhost:${port}/api-docs`);
});