const express = require('express');
const { getUsersList, getUserProjectsByAdmin, getProjectDetailsByAdmin, updateProjectByAdmin, deleteProjectByAdmin } = require('../controllers/project.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/admin.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/admin/user/list:
 *   get:
 *     tags: [Admin]
 *     summary: Get list of all users with pagination, search and sorting (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for firstName, lastName, or email
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [firstName, lastName, email, createdAt]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order (ascending or descending)
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
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: object
 *                         properties:
 *                           name:
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
 *       400:
 *         description: Invalid query parameters
 *       403:
 *         description: Access denied. Admin privileges required.
 */
router.get('/user/list', verifyToken, isAdmin, getUsersList);

/**
 * @swagger
 * /api/admin/project/list/{user_id}:
 *   get:
 *     tags: [Admin]
 *     summary: Get list of user's projects with pagination (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
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
 *       403:
 *         description: Access denied. Admin privileges required.
 */
router.get('/project/list/:user_id', verifyToken, isAdmin, getUserProjectsByAdmin);

/**
 * @swagger
 * /api/admin/project/detail/{project_id}:
 *   get:
 *     tags: [Admin]
 *     summary: Get project details with user information (admin only)
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
 *       403:
 *         description: Access denied. Admin privileges required.
 */
router.get('/project/detail/:project_id', verifyToken, isAdmin, getProjectDetailsByAdmin);

/**
 * @swagger
 * /api/admin/project/update/{project_id}:
 *   put:
 *     tags: [Admin]
 *     summary: Update a project (admin only)
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
 *       403:
 *         description: Access denied. Admin privileges required.
 */
router.put('/project/update/:project_id', verifyToken, isAdmin, updateProjectByAdmin);

/**
 * @swagger
 * /api/admin/project/delete/{project_id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a project (admin only, soft delete)
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
 *       403:
 *         description: Access denied. Admin privileges required.
 */
router.delete('/project/delete/:project_id', verifyToken, isAdmin, deleteProjectByAdmin);

module.exports = router;
