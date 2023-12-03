const checkRole = (req, res, next) => {
  const userRoles = req.roles;

  const hasAccess =
    userRoles.includes('Admin') || userRoles.includes('Manager');

  if (!hasAccess) {
    res.status(403);
    throw new Error('Not authorized. Access denied.');
  }

  next();
};

module.exports = checkRole;
