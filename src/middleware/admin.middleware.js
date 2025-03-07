const db = require('../models');
const Role = db.roles;

const isAdmin = async (req, res, next) => {
  try {
    const user = req.user; // Set by auth middleware
    const userRole = await Role.findByPk(user.roleId);

    if (!userRole || userRole.name !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  isAdmin
};
