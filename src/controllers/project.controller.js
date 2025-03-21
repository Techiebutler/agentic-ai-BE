const db = require('../models');
const { DATABASE_STATUS_TYPE } = require('../constants/database.constants');
const { createProjectSchema, updateProjectSchema } = require('../validations/project.validation');
const Project = db.projects;
const User = db.users;
const Role = db.roles;

// User endpoints
const createProject = async (req, res) => {
  try {
    const { error, value } = createProjectSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { name, type, description, companyInfo } = value;
    const userId = req.user.id;

    const project = await Project.create({
      userId,
      name,
      type,
      description,
      companyInfo,
      status: DATABASE_STATUS_TYPE.ACTIVE,
      createdBy: userId,
      updatedBy: userId
    });

    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const { error, value } = updateProjectSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { project_id } = req.params;
    const { name, type, description, companyInfo } = value;
    const userId = req.user.id;

    const project = await Project.findOne({
      where: {
        id: project_id,
        userId,
        status: DATABASE_STATUS_TYPE.ACTIVE
      }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await project.update({
      ...(name && { name }),
      ...(type && { type }),
      ...(description && { description }),
      ...(companyInfo && { companyInfo }),
      updatedBy: userId
    });

    res.json({
      message: 'Project updated successfully',
      project
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProjectDetails = async (req, res) => {
  try {
    const { project_id } = req.params;
    const userId = req.user.id;

    const project = await Project.findOne({
      where: {
        id: project_id,
        userId,
        status: DATABASE_STATUS_TYPE.ACTIVE
      },
      include: [{
        model: User,
        attributes: { exclude: ['password', 'verificationOtp', 'otpExpiry'] }
      }]
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: projects } = await Project.findAndCountAll({
      where: {
        userId,
        status: DATABASE_STATUS_TYPE.ACTIVE
      },
      include: [{
        model: User,
        attributes: { exclude: ['password', 'otpExpiry','isEmailVerified','verificationOtp'] }
      }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      projects,
      pagination: {
        totalItems: count,
        currentPage: page,
        itemsPerPage: limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { project_id } = req.params;
    const userId = req.user.id;

    const project = await Project.findOne({
      where: {
        id: project_id,
        userId,
        status: DATABASE_STATUS_TYPE.ACTIVE
      }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await project.update({
      status: DATABASE_STATUS_TYPE.SOFT_DELETE,
      updatedBy: userId
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin endpoints
const getUsersList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: users } = await User.findAndCountAll({
      where: {
        status: DATABASE_STATUS_TYPE.ACTIVE
      },
      include: [{
        model: Role,
        attributes: ['name']
      }],
      attributes: { exclude: ['password', 'verificationOtp', 'otpExpiry'] },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      users,
      pagination: {
        totalItems: count,
        currentPage: page,
        itemsPerPage: limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserProjectsByAdmin = async (req, res) => {
  try {
    const { user_id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: projects } = await Project.findAndCountAll({
      where: {
        userId: user_id,
        status: DATABASE_STATUS_TYPE.ACTIVE
      },
      include: [{
        model: User,
        attributes: { exclude: ['password', 'verificationOtp', 'otpExpiry'] }
      }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      projects,
      pagination: {
        totalItems: count,
        currentPage: page,
        itemsPerPage: limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProjectDetailsByAdmin = async (req, res) => {
  try {
    const { project_id } = req.params;

    const project = await Project.findOne({
      where: {
        id: project_id,
        status: DATABASE_STATUS_TYPE.ACTIVE
      },
      include: [{
        model: User,
        attributes: { exclude: ['password', 'verificationOtp', 'otpExpiry'] }
      }]
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProjectByAdmin = async (req, res) => {
  try {
    const { error, value } = updateProjectSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { project_id } = req.params;
    const { name, type, description, companyInfo } = value;
    const adminId = req.user.id;

    const project = await Project.findOne({
      where: {
        id: project_id,
        status: DATABASE_STATUS_TYPE.ACTIVE
      }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await project.update({
      ...(name && { name }),
      ...(type && { type }),
      ...(description && { description }),
      ...(companyInfo && { companyInfo }),
      updatedBy: adminId
    });

    res.json({
      message: 'Project updated successfully',
      project
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteProjectByAdmin = async (req, res) => {
  try {
    const { project_id } = req.params;
    const adminId = req.user.id;

    const project = await Project.findOne({
      where: {
        id: project_id,
        status: DATABASE_STATUS_TYPE.ACTIVE
      }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await project.update({
      status: DATABASE_STATUS_TYPE.SOFT_DELETE,
      updatedBy: adminId
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  // User endpoints
  createProject,
  updateProject,
  getProjectDetails,
  getUserProjects,
  deleteProject,
  
  // Admin endpoints
  getUsersList,
  getUserProjectsByAdmin,
  getProjectDetailsByAdmin,
  updateProjectByAdmin,
  deleteProjectByAdmin
};
