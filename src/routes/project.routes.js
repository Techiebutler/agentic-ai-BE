const express = require('express');
const { createProject, updateProject, getProjectDetails, getUserProjects, deleteProject } = require('../controllers/project.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/project/create:
 *   post:
 *     tags: [Projects]
 *     summary: Create a new project
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
 *               - type
 *               - description
 *               - companyInfo
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *               type:
 *                 type: integer
 *                 minimum: 1
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *               companyInfo:
 *                 type: object
 *                 required:
 *                   - name
 *                   - address
 *                   - contact
 *                 properties:
 *                   name:
 *                     type: string
 *                     minLength: 3
 *                     maxLength: 100
 *                   address:
 *                     type: string
 *                     minLength: 10
 *                     maxLength: 500
 *                   contact:
 *                     type: string
 *                     minLength: 10
 *                     maxLength: 15
 *     responses:
 *       201:
 *         description: Project created successfully
 *       400:
 *         description: Validation error
 */
router.post('/project/create', verifyToken, createProject);

/**
 * @swagger
 * /api/project/list:
 *   get:
 *     tags: [Projects]
 *     summary: Get list of user's projects with pagination
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
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of projects retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 projects:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           email:
 *                             type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     totalItems:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     itemsPerPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPreviousPage:
 *                       type: boolean
 */
router.get('/project/list', verifyToken, getUserProjects);

/**
 * @swagger
 * /api/project/detail/{project_id}:
 *   get:
 *     tags: [Projects]
 *     summary: Get project details with user information
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: project_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Project details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         email:
 *                           type: string
 */
router.get('/project/detail/:project_id', verifyToken, getProjectDetails);

/**
 * @swagger
 * /api/project/update/{project_id}:
 *   put:
 *     tags: [Projects]
 *     summary: Update a project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: project_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *               type:
 *                 type: integer
 *                 minimum: 1
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *               companyInfo:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     minLength: 3
 *                     maxLength: 100
 *                   address:
 *                     type: string
 *                     minLength: 10
 *                     maxLength: 500
 *                   contact:
 *                     type: string
 *                     minLength: 10
 *                     maxLength: 15
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       400:
 *         description: Validation error
 */
router.put('/project/update/:project_id', verifyToken, updateProject);

/**
 * @swagger
 * /api/project/delete/{project_id}:
 *   delete:
 *     tags: [Projects]
 *     summary: Delete a project (soft delete)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: project_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Project deleted successfully
 */
router.delete('/project/delete/:project_id', verifyToken, deleteProject);

module.exports = router;
