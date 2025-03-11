const jwt = require('jsonwebtoken');
const db = require('../models');
const User = db.users;

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.status !== 1) {
      return res.status(403).json({ message: 'User account is inactive or blocked' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const isSuperAdmin = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{
        model: db.roles,
        attributes: ['name']
      }]
    });

    if (user.role.name !== 'super_admin') {
      return res.status(403).json({ message: 'Require Super Admin Role!' });
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  verifyToken,
  isSuperAdmin
};
